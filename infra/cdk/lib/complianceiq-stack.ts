import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2Actions from 'aws-cdk-lib/aws-elasticloadbalancingv2-actions';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface ComplianceIqStackProps extends cdk.StackProps {
  envName: string;
  imageUri: string;
  internalDomainName: string;
  bedrockModelId: string;
  awsRegionForApp: string;
  cpu: number;
  memoryMiB: number;
  /** ACM certificate ARN for the HTTPS listener (self-signed import for non-prod). */
  certificateArn: string;
}

/**
 * ComplianceIQ — PRIVATE single-instance deployment (no public access).
 *
 * Topology:
 *   VPC (private + isolated subnets, no NAT needed for the internal path;
 *        NAT is included so the task can reach Bedrock/Tavily on the internet)
 *     └─ Internal Application Load Balancer (scheme=internal)  ← reachable only
 *        from inside the VPC / connected networks (VPN / Direct Connect / peering)
 *          └─ ECS Fargate Service (desiredCount=1, NO autoscaling this phase)
 *               • Task IAM role → bedrock:InvokeModel (no static AWS keys)
 *               • Tavily key injected from Secrets Manager
 *               • EFS mounted at /app/data (DATA_DIR) so admin edits persist
 *          └─ Route 53 PRIVATE hosted zone → friendly internal hostname
 *   CloudWatch Logs for the container.
 */
export class ComplianceIqStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComplianceIqStackProps) {
    super(scope, id, props);

    const {
      envName,
      imageUri,
      internalDomainName,
      bedrockModelId,
      awsRegionForApp,
      cpu,
      memoryMiB,
      certificateArn,
    } = props;

    // ---------------------------------------------------------------------
    // 1. Network — a VPC with private subnets. The ALB is INTERNAL (private).
    //    NAT gateways let the Fargate task reach Bedrock & Tavily (egress only);
    //    there is NO inbound path from the internet.
    // ---------------------------------------------------------------------
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1, // egress for the task to reach Bedrock/Tavily; set 0 if using VPC endpoints only
      subnetConfiguration: [
        // Public subnet exists ONLY to host the NAT gateway (required for egress).
        // The app/data tiers below stay private — there is no inbound path to them.
        { name: 'public-nat', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private-app', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'isolated-data', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // ---------------------------------------------------------------------
    // 2. Secrets — the Tavily API key. Create the secret shell here; you set
    //    the actual value once via the AWS CLI/console (never in code/repo).
    // ---------------------------------------------------------------------
    const tavilySecret = new secretsmanager.Secret(this, 'TavilyApiKey', {
      secretName: `complianceiq/${envName}/tavily-api-key`,
      description: 'Tavily Search API key for ComplianceIQ web search / news',
    });

    // ---------------------------------------------------------------------
    // 3. Persistent data — EFS mounted at /app/data so admin edits to region
    //    JSON survive container restarts/redeploys.
    // ---------------------------------------------------------------------
    const fileSystem = new efs.FileSystem(this, 'DataFs', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // keep data if the stack is deleted
      enableAutomaticBackups: true, // AWS Backup daily snapshots
    });

    const accessPoint = fileSystem.addAccessPoint('DataAp', {
      path: '/data',
      createAcl: { ownerGid: '1000', ownerUid: '1000', permissions: '750' },
      posixUser: { gid: '1000', uid: '1000' },
    });

    // ---------------------------------------------------------------------
    // 4. ECS cluster + Fargate task definition.
    // ---------------------------------------------------------------------
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsights: true,
    });

    // The log group /complianceiq/<env> is owned by the account foundation stack
    // (infra/foundation/foundation.yaml), which pre-creates it with 30-day
    // retention. Reference it here instead of creating a second one — two
    // CloudFormation stacks cannot both own the same log group.
    const logGroup = logs.LogGroup.fromLogGroupName(
      this,
      'AppLogs',
      `/complianceiq/${envName}`
    );

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ComplianceIQ task role - Bedrock invoke + read its own secret',
    });

    // Least-privilege: only Bedrock InvokeModel (and streaming variant).
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvoke',
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'], // Bedrock model ARNs vary by region/model; scope down if desired
      })
    );
    tavilySecret.grantRead(taskRole);

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB: memoryMiB,
      taskRole,
      // executionRole is auto-created; it pulls the image from ECR + writes logs.
    });



    // Attach the EFS volume to the task definition.
    const volumeName = 'data';
    taskDef.addVolume({
      name: volumeName,
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: { accessPointId: accessPoint.accessPointId, iam: 'ENABLED' },
      },
    });

    // Reference the ECR repo (created by the account foundation) so CDK grants
    // the execution role the correct ECR pull permissions automatically —
    // including ecr:GetAuthorizationToken. The image tag is parsed from imageUri
    // (e.g. ".../complianceiq:latest" -> "latest"), defaulting to "latest".
    const imageTag = imageUri.includes(':') ? imageUri.split(':').pop()! : 'latest';
    const appRepo = ecr.Repository.fromRepositoryName(this, 'AppRepo', 'complianceiq');

    const container = taskDef.addContainer('App', {
      image: ecs.ContainerImage.fromEcrRepository(appRepo, imageTag),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app', logGroup }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        REGION: 'menat',
        DATA_DIR: '/app/data', // matches the volume mount + regionLoader resolution
        BEDROCK_MODEL_ID: bedrockModelId,
        AWS_REGION: awsRegionForApp,
      },
      secrets: {
        TAVILY_API_KEY: ecs.Secret.fromSecretsManager(tavilySecret),
      },
      portMappings: [{ containerPort: 3000 }],
    });

    container.addMountPoints({
      containerPath: '/app/data',
      sourceVolume: volumeName,
      readOnly: false,
    });

    // ---------------------------------------------------------------------
    // 5. Internal ALB (private) + Fargate service (single task).
    // ---------------------------------------------------------------------
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'ComplianceIQ public ALB SG (Cognito-gated)',
      allowAllOutbound: true,
    });
    // Public access is gated by Cognito + MFA at the ALB (not by IP). Allow 443
    // from the internet; redirect 80 -> 443. A VPC Block Public Access exclusion
    // on the public subnets permits this inbound (private subnets stay blocked).
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from internet Cognito gated');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP to HTTPS redirect');

    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true, // <-- PUBLIC, but gated by Cognito+MFA over HTTPS
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // -------------------------------------------------------------------
    // Cognito user pool — the auth gate. Users (your @amazon.com testers)
    // must sign in here (with MFA) before the ALB forwards to the app.
    // -------------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `complianceiq-${envName}`,
      selfSignUpEnabled: false, // operators create users (keyed to @amazon.com email)
      signInAliases: { email: true },
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: { sms: false, otp: true }, // TOTP authenticator app
      standardAttributes: { email: { required: true, mutable: false } },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // non-prod: ok to drop with the stack
    });

    // A hosted-UI domain for the Cognito login pages (free *.auth.<region> domain).
    userPool.addDomain('UserPoolDomain', {
      cognitoDomain: { domainPrefix: `complianceiq-${envName}-${this.account}` },
    });

    // OAuth callback (the ALB's well-known OIDC response path).
    //
    // Casing note: browsers lowercase the host, but alb.loadBalancerDnsName
    // renders mixed-case, and Cognito matches callback hosts case-sensitively.
    // For a RE-USABLE deployment there are two correct options:
    //   (A) RECOMMENDED: deploy behind a stable custom domain (set `appDomainName`)
    //       — pass -c appDomainName=app.example.com. The callback is then clean
    //       and case-stable, and you point that domain's DNS at the ALB.
    //   (B) Fallback (no domain): use the raw ALB DNS. Because its exact lowercase
    //       form is only known AFTER the ALB is created, deploy once, then run the
    //       helper in infra/scripts/add-cognito-callback.sh (prints + registers the
    //       lowercase callback). This avoids hardcoding any account-specific DNS.
    const appDomainName = this.node.tryGetContext('appDomainName') as string | undefined;
    const callbackUrls = appDomainName
      ? [`https://${appDomainName}/oauth2/idpresponse`]
      : [`https://${alb.loadBalancerDnsName}/oauth2/idpresponse`];

    const userPoolClient = userPool.addClient('AlbClient', {
      generateSecret: true, // required for ALB authenticate-cognito
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
        callbackUrls,
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    });

    const certificate = acm.Certificate.fromCertificateArn(this, 'AlbCert', certificateArn);

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1, // single instance — NO autoscaling this phase
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minHealthyPercent: 0, // single task: allow full replace on deploy
      maxHealthyPercent: 200,
      circuitBreaker: { rollback: true },
    });

    // Let the task's EFS mount + ALB traffic through security groups.
    fileSystem.connections.allowDefaultPortFrom(service);
    service.connections.allowFrom(alb, ec2.Port.tcp(3000), 'ALB to task');

    // HTTP :80 -> redirect to HTTPS :443 (no app traffic served over plain HTTP).
    alb.addListener('HttpRedirect', {
      port: 80,
      open: false,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS :443 — Cognito auth gate, THEN forward to the app target group.
    const httpsListener = alb.addListener('Https', {
      port: 443,
      open: false,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    // The target group the app runs in (health-checked on /api/health).
    const appTargetGroup = new elbv2.ApplicationTargetGroup(this, 'AppTg', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/api/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
      },
      deregistrationDelay: cdk.Duration.seconds(15),
    });

    // Default action: authenticate via Cognito (forces login + MFA), then forward.
    httpsListener.addAction('CognitoAuth', {
      action: new elbv2Actions.AuthenticateCognitoAction({
        userPool,
        userPoolClient,
        userPoolDomain: userPool.node.tryFindChild('UserPoolDomain') as cognito.UserPoolDomain,
        next: elbv2.ListenerAction.forward([appTargetGroup]),
      }),
    });

    // ---------------------------------------------------------------------
    // 6. Route 53 PRIVATE hosted zone → friendly internal hostname.
    //    Resolvable only inside this VPC (and peered/VPN-connected networks).
    // ---------------------------------------------------------------------
    const zoneName = internalDomainName.split('.').slice(1).join('.') || 'internal';
    const privateZone = new route53.PrivateHostedZone(this, 'PrivateZone', {
      zoneName,
      vpc,
    });

    new route53.ARecord(this, 'AppRecord', {
      zone: privateZone,
      recordName: internalDomainName,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb)),
    });

    // ---------------------------------------------------------------------
    // 7. Outputs — what you need after deploy.
    // ---------------------------------------------------------------------
    new cdk.CfnOutput(this, 'PublicUrl', {
      value: `https://${alb.loadBalancerDnsName}/`,
      description: 'Public app URL (Cognito+MFA gated, HTTPS). Share with testers.',
    });
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Public ALB DNS name',
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'Create tester users here (aws cognito-idp admin-create-user)',
    });
    new cdk.CfnOutput(this, 'TavilySecretName', {
      value: tavilySecret.secretName,
      description: 'Set the Tavily key here: aws secretsmanager put-secret-value',
    });
    new cdk.CfnOutput(this, 'EfsFileSystemId', {
      value: fileSystem.fileSystemId,
      description: 'EFS holding persistent /app/data',
    });
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
  }
}
