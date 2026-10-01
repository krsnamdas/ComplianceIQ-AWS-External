#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ComplianceIqStack } from '../lib/complianceiq-stack';

const app = new cdk.App();

/**
 * Configuration is read from CDK context or environment variables so the SAME
 * code deploys to non-prod (Isengard) and later to prod by changing only these
 * values — nothing in the stack code changes between environments.
 *
 * Provide values via `cdk deploy -c key=value` or a cdk.context.json file.
 */
const envName = app.node.tryGetContext('envName') || process.env.ENV_NAME || 'nonprod';

new ComplianceIqStack(app, `ComplianceIQ-${envName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  envName,
  // Container image URI in ECR (e.g. <acct>.dkr.ecr.us-east-1.amazonaws.com/complianceiq:latest)
  imageUri: app.node.tryGetContext('imageUri') || process.env.IMAGE_URI || '',
  // Internal DNS name to reach the app, e.g. complianceiq.internal
  internalDomainName:
    app.node.tryGetContext('internalDomainName') || process.env.INTERNAL_DOMAIN || 'complianceiq.internal',
  // Bedrock model + region the app will call
  bedrockModelId:
    app.node.tryGetContext('bedrockModelId') || process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
  awsRegionForApp: process.env.APP_AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1',
  // Task sizing (single instance, no autoscaling in this phase)
  cpu: Number(app.node.tryGetContext('cpu') || 512),
  memoryMiB: Number(app.node.tryGetContext('memoryMiB') || 1024),
  // ACM cert ARN for the HTTPS listener (self-signed import for non-prod).
  certificateArn: app.node.tryGetContext('certificateArn') || process.env.CERT_ARN || '',
  tags: {
    Project: 'ComplianceIQ',
    Environment: envName,
    ManagedBy: 'CDK',
  },
});

app.synth();
