# ComplianceIQ — Infrastructure as Code

Private, single-instance AWS deployment (no public access) for Isengard non-prod,
promotable to prod. Two equivalent implementations — **use one**:

| Folder | Tool | Use if… |
|--------|------|---------|
| `cdk/` | AWS CDK (TypeScript) | you prefer TypeScript; CDK generates & deploys CloudFormation for you |
| `terraform/` | Terraform | your team standardizes on Terraform |

Both build the **same** architecture:

- **VPC** with private + isolated subnets (1 NAT gateway for egress to Bedrock/Tavily).
- **Internal Application Load Balancer** (`internal` / not internet-facing).
- **ECS Fargate service**, `desiredCount = 1` (no autoscaling this phase).
- **EFS** mounted at `/app/data` (env `DATA_DIR=/app/data`) so admin edits persist; daily AWS Backup.
- **IAM task role** → `bedrock:InvokeModel` only (no static AWS keys).
- **Secrets Manager** → Tavily API key (value set post-deploy, never in git).
- **CloudWatch Logs** + Container Insights.
- **Route 53 private hosted zone** → `complianceiq.internal` (resolves inside the VPC only).

## Deployment order
1. **Account foundation (once per account)** — deploy `foundation/foundation.yaml`
   (CloudFormation): Terraform state backend, ECR repo, 2-admin IAM, log baseline.
   See **[`foundation/README.md`](./foundation/README.md)**.
2. **App stack** — build & push the image (Finch → ECR), then deploy with **CDK**
   *or* **Terraform**. See **[`DEPLOY.md`](./DEPLOY.md)** — step-by-step: prereqs →
   build & push image → deploy → set Tavily key → reach the internal URL → how
   updates flow from GitHub.

```
foundation/   CloudFormation account baseline (state backend, ECR, IAM, logs) — deploy FIRST
cdk/          App stack (AWS CDK)        ┐ pick ONE
terraform/    App stack (Terraform)      ┘
DEPLOY.md     App deploy guide
```

## Configurable inputs (same meaning in both tools)
`envName` · `imageUri` (ECR) · `internalDomainName` · `bedrockModelId` ·
`awsRegion` · `cpu` · `memoryMiB`.

## Not in this phase (deferred)
Autoscaling (needs the DynamoDB data-layer migration first), Cognito auth,
public access, GitHub Actions CI/CD. See the main deployment plan.
