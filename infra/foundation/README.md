# ComplianceIQ — Account Foundation (CloudFormation)

A small **account-level baseline** that the app stack sits on top of. Deploy this
**once per account** (e.g. your Isengard non-prod account) **before** the app IaC.

> This is NOT an AWS Organizations / Control Tower "Landing Zone". In Isengard,
> org-level governance (accounts, SCPs, central CloudTrail, SSO) is managed
> centrally by Amazon's tooling — do not try to recreate it here. This template
> only sets up the shared, in-account prerequisites for ComplianceIQ.

## What it creates
| Resource | Purpose |
|----------|---------|
| **S3 state bucket** (versioned, encrypted, retained) | Terraform remote state (only needed if you use the Terraform path) |
| **DynamoDB lock table** | Terraform state locking |
| **ECR repository** (`complianceiq`, scan-on-push, keep last 10) | Holds the app container image |
| **IAM admin group + managed policy** | Least-privilege deploy/operate permissions for your operators |
| **IAM admin deploy role** (optional) | For **federated** identities (Isengard) to assume — created only if you pass `AdminPrincipalArns` |
| **CloudWatch log group** (`/complianceiq/<env>`, 30-day) | Pre-created app log group |
| **CloudTrail** (optional, default OFF) | Only if your account lacks a central trail |

## Why CloudFormation for this layer
- It's the natural fit for an **account baseline** and has no bootstrap
  chicken-and-egg problem (Terraform would need the very S3/DynamoDB backend
  this stack creates; CDK would need `cdk bootstrap` first).
- After this, the **app** is deployed with either CDK (which is CloudFormation
  under the hood) or Terraform (which uses the backend this stack created).

---

## Deploy it (step by step)

**Prereqs:** AWS CLI v2, valid Isengard credentials (`aws sts get-caller-identity`
works), and the region set.

```bash
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

**Option 1 — no federated role wiring (simplest): create the group, add admins manually**
```bash
aws cloudformation deploy \
  --region $AWS_REGION \
  --stack-name complianceiq-foundation-nonprod \
  --template-file infra/foundation/foundation.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      ProjectName=complianceiq \
      EnvName=nonprod \
      EcrRepoName=complianceiq
```

**Option 2 — wire your 2 admins as an assumable role (federated Isengard identities)**
```bash
# Replace with the 2 admins' federated role/user ARNs (comma-separated).
aws cloudformation deploy \
  --region $AWS_REGION \
  --stack-name complianceiq-foundation-nonprod \
  --template-file infra/foundation/foundation.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      ProjectName=complianceiq \
      EnvName=nonprod \
      EcrRepoName=complianceiq \
      "AdminPrincipalArns=arn:aws:iam::${ACCOUNT_ID}:role/AdminA,arn:aws:iam::${ACCOUNT_ID}:role/AdminB"
```

> `CAPABILITY_NAMED_IAM` is required because the stack creates named IAM
> resources. `CreateCloudTrail=true` only if your account has no central trail.

**Read the outputs (you'll need these next):**
```bash
aws cloudformation describe-stacks \
  --region $AWS_REGION \
  --stack-name complianceiq-foundation-nonprod \
  --query "Stacks[0].Outputs" --output table
```
Note the `StateBucketName`, `LockTableName`, `EcrRepositoryUri`, `AdminGroupName`,
and (if created) `AdminDeployRoleArn`.

---

## The 2 admins
- **If you used Option 2**, each admin assumes `AdminDeployRoleArn` to deploy/operate.
- **If you used Option 1**, add each admin's IAM user to the created group:
  ```bash
  aws iam add-user-to-group --group-name complianceiq-nonprod-admins --user-name <adminA>
  aws iam add-user-to-group --group-name complianceiq-nonprod-admins --user-name <adminB>
  ```
- The attached policy grants exactly what's needed to deploy the app stack, push
  the image, use Terraform state, and read logs/metrics — nothing broader.

---

## Wire the foundation into the app IaC

### If deploying the app with **Terraform**
Enable the S3 backend using the foundation outputs. In `infra/terraform/main.tf`
uncomment the `backend "s3"` block and set:
```hcl
backend "s3" {
  bucket         = "<StateBucketName output>"
  key            = "complianceiq/nonprod/terraform.tfstate"
  region         = "us-east-1"
  dynamodb_table = "<LockTableName output>"
  encrypt        = true
}
```
Then set `image_uri` in `terraform.tfvars` to `<EcrRepositoryUri output>:latest`
and run `terraform init` (it will migrate to the S3 backend) → `plan` → `apply`.

### If deploying the app with **CDK**
CDK uses its own bootstrap bucket, so it does **not** need the Terraform S3
backend. Just use the ECR URI:
```bash
npx cdk bootstrap aws://$ACCOUNT_ID/$AWS_REGION   # one-time
npx cdk deploy -c imageUri=<EcrRepositoryUri output>:latest -c envName=nonprod
```

Either way, the image push step (Finch → ECR) uses `EcrRepositoryUri`.

---

## Order of operations (the whole flow)
1. **Deploy this foundation** (CloudFormation) → get outputs.
2. **Build & push the image** with Finch to the ECR repo (`infra/DEPLOY.md` §2).
3. **Deploy the app** with CDK or Terraform (`infra/DEPLOY.md` §3), pointing at
   the ECR image and (Terraform) the S3 backend.
4. **Set the Tavily secret**, reach the internal URL (`infra/DEPLOY.md` §4–5).

## Updating / tearing down
- **Update:** edit `foundation.yaml`, re-run the same `aws cloudformation deploy`.
- **Tear down:** `aws cloudformation delete-stack --stack-name complianceiq-foundation-nonprod`.
  The **state bucket, lock table, and (if made) CloudTrail bucket are RETAINED**
  on delete so you don't lose Terraform state or audit logs by accident — remove
  them manually if you truly want them gone.

## Prod
Deploy a second foundation stack with `EnvName=prod` (and a prod account/creds).
Same template, different parameters — that's the portability model.

## Isengard notes / caveats
- Some actions here (creating IAM roles/policies, S3 buckets, CloudTrail) may be
  constrained by your account's **SCPs/guardrails**. If `deploy` fails with an
  explicit deny, that's a guardrail — check with your Isengard/CloudOps team
  rather than trying to work around it.
- A central org CloudTrail almost certainly already exists → keep
  `CreateCloudTrail=false` unless told otherwise.
- The admin policy uses some `*` actions for deployment breadth. If your account
  requires tighter least-privilege, scope the `DeployInfra` statement down to
  specific resource ARNs once the app stack's resource names are known.
