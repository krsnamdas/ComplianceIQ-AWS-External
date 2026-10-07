# ComplianceIQ — AWS Deployment Guide (Private / Single-Instance)

Step-by-step guide to deploy ComplianceIQ privately in AWS (Isengard non-prod),
with **no public access**, reachable via an **internal DNS name** over your
private network (VPN / Direct Connect / from inside the VPC).

This phase: **single Fargate task, no autoscaling, local login, EFS-persisted data.**
GitHub stays the master copy; AWS is built from the image you push.

---

## 0. Mental model (read this first)

```
Laptop (edit) --git push--> GitHub (main = source of truth)
                                 |
                    you build the image locally with Finch
                                 |
                          push image --> ECR
                                 |
             CDK or Terraform deploys infra + runs the image on Fargate
                                 |
        Internal ALB (private) <-- reach via complianceiq.internal (VPC only)
```

- **CDK and Terraform do the same thing.** Pick **ONE**. Don't run both — they'd
  create duplicate stacks. (CDK if you like TypeScript; Terraform if your team
  standardizes on it.)
- **You do NOT touch CloudFormation by hand.** CDK generates and deploys it for
  you; Terraform talks to AWS directly.
- **Data lives in AWS (EFS), code lives in GitHub.** They're intentionally
  separate. Admin edits in the running app change EFS, not your repo.

---

## 1. Prerequisites (one-time)

On your Mac:
- **Finch** (already installed & working — you built the image with it).
- **AWS CLI v2** — `brew install awscli` then confirm `aws --version`.
- **Credentials for your Isengard account** — via your team's federation
  (`ada credentials update --account <id> --role <role>` or `isengardcli`),
  or `aws configure` with temporary creds. Verify with:
  ```bash
  aws sts get-caller-identity
  ```
  You should see your Isengard account id.
- Then EITHER:
  - **CDK path:** Node.js 18+ (you have it) and `npm i -g aws-cdk` (or use the
    local dep in `infra/cdk`).
  - **Terraform path:** `brew install terraform`.

Set these once in your shell for convenience:
```bash
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=complianceiq
export IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

---

## 2. Build & push the image to ECR (with Finch)

**2a. Create the ECR repository (one-time):**
```bash
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
```

**2b. Log Finch in to ECR:**
```bash
aws ecr get-login-password --region $AWS_REGION \
  | finch login --username AWS --password-stdin \
    $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

**2c. Build for the platform Fargate will run.**
Fargate here uses **x86_64** by default, but your Mac is arm64. Build explicitly:
```bash
# from the repo root
finch build --platform linux/amd64 -t $IMAGE_URI .
```
> If you prefer cheaper Graviton, use `--platform linux/arm64` here AND set the
> task to ARM64 (CDK: add `runtimePlatform`; TF: add `runtime_platform`). Keep
> them consistent. Default guide assumes x86_64.

**2d. Push:**
```bash
finch push $IMAGE_URI
```

---

## 3. Deploy the infrastructure — choose ONE path

### PATH A — CDK (TypeScript)

```bash
cd infra/cdk
npm install

# One-time per account/region: prepare CDK's deploy bucket/roles
npx cdk bootstrap aws://$ACCOUNT_ID/$AWS_REGION

# See what will be created (no changes made):
npx cdk synth -c imageUri=$IMAGE_URI -c internalDomainName=complianceiq.internal

# Deploy:
npx cdk deploy \
  -c envName=nonprod \
  -c imageUri=$IMAGE_URI \
  -c internalDomainName=complianceiq.internal \
  -c bedrockModelId=amazon.nova-pro-v1:0
```
CDK prints the stack **Outputs** (internal URL, ALB DNS, Tavily secret name,
EFS id) when done.

### PATH B — Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set image_uri (= $IMAGE_URI), region, internal_domain_name

terraform init
terraform plan      # review what will be created
terraform apply     # type "yes" to confirm
```
Terraform prints the **outputs** (internal URL, ALB DNS, Tavily secret name, etc.).

---

## 4. Set the Tavily API key (one-time, after first deploy)

The stack creates an **empty** secret (no secret values are ever stored in code
or git). Populate it once:
```bash
aws secretsmanager put-secret-value \
  --secret-id complianceiq/nonprod/tavily-api-key \
  --secret-string 'tvly-YOUR-REAL-KEY' \
  --region $AWS_REGION

# Restart the task so it picks up the key:
# (CDK/TF output gives cluster + service names)
aws ecs update-service --cluster <cluster-name> --service <service-name> \
  --force-new-deployment --region $AWS_REGION
```
> Bedrock needs **no key** — the task's IAM role grants `bedrock:InvokeModel`.
> Ensure your Isengard account has **Bedrock model access** granted for
> `amazon.nova-pro-v1:0` (Bedrock console → Model access).

---

## 5. Reach the app (private, no public access)

Because the ALB is **internal**, you reach it from **inside the VPC or a
connected network** (corporate VPN / Direct Connect / a bastion / peered VPC):

- **Friendly name:** `http://complianceiq.internal/` — resolves via the Route53
  **private** hosted zone, but **only from within the VPC** (or networks
  associated with that zone).
- **Direct ALB DNS:** the `internal_alb_dns_name` / `InternalAlbDnsName` output,
  e.g. `internal-complianceiq-...elb.amazonaws.com` — also private.

**Quick test without a VPN** (from your laptop): use SSM port-forwarding through
a small bastion, or temporarily run `aws ssm start-session` to a host in the
VPC, then `curl http://complianceiq.internal/api/health`. In normal use your
team accesses it over the VPN that's connected to this VPC.

> Note: a truly fixed *private IP* isn't how ALBs work (they use multiple ENIs).
> The **internal DNS name is the stable address** — use that.

---

## 6. How updates flow (keeping laptop / GitHub / AWS in sync)

1. Edit locally → commit → push → PR → merge to **GitHub `main`** (as today).
2. Rebuild & push the image, then roll the service:
   ```bash
   finch build --platform linux/amd64 -t $IMAGE_URI .
   finch push $IMAGE_URI
   aws ecs update-service --cluster <cluster-name> --service <service-name> \
     --force-new-deployment --region $AWS_REGION
   ```
3. Infra changes (rare) → edit `infra/**` → `cdk deploy` or `terraform apply`.

**Golden rule:** never hand-edit resources in the AWS console. AWS is always a
product of (GitHub code) + (the image you pushed) + (the IaC you applied). That's
what keeps the three copies in sync. The only thing unique to AWS is the *data*
on EFS (admin edits), which is deliberately separate from code and is backed up.

> Later (optional): a GitHub Actions workflow can do steps 2–3 automatically on
> merge to `main` (using GitHub OIDC → a deploy IAM role). Not required now.

---

## 7. Data, logs, backups

- **Data:** region JSON lives on **EFS** mounted at `/app/data` (the app reads
  `DATA_DIR=/app/data`). Survives restarts/redeploys. **AWS Backup** takes daily
  EFS snapshots (enabled in the IaC).
- **Logs:** CloudWatch Logs group `/complianceiq/nonprod`. Container Insights is
  on for CPU/memory metrics.
- **Seeding data:** the image already contains a copy of `data/` from the repo.
  On first boot, if EFS is empty you may want to copy the seed in. Two options:
  (a) let the app write via the admin UI, or (b) one-time copy the repo's
  `data/regions/` onto the EFS volume (via an SSM session on a host that mounts
  the EFS). For non-prod, starting from the in-image copy is usually fine.

---

## 8. IAM & the "2 admins + specific users"

Two layers:
- **AWS operators (infra):** the 2 people who deploy get an Isengard role with
  permission to run CDK/Terraform + view logs. This is separate from the app.
- **App users (login):** for now the app uses its built-in **local login**
  (existing accounts, incl. the admin accounts). Since the app is **private**
  (no public access), this is acceptable for non-prod. Before any wider/prod
  exposure, move app auth to **Amazon Cognito** (groups → app RBAC, with the 2
  admins in an `Admins` group) — that's a separate, later change.

---

## 9. Portability (non-prod → prod)

The IaC is parameterized, so prod is the **same code with different inputs**:
- **CDK:** `cdk deploy -c envName=prod -c imageUri=<prod-image> -c internalDomainName=complianceiq.prod.internal`
- **Terraform:** a separate `prod.tfvars` (or a workspace) with prod values.

Use the **same image** promoted to a prod ECR (or shared repo). Only config
(env name, domain, sizing, account) differs. This is why IaC matters: prod is a
one-command, repeatable deploy — not a hand-built snowflake.

---

## 10. Tear-down (to stop costs in non-prod)

- **CDK:** `cd infra/cdk && npx cdk destroy`
- **Terraform:** `cd infra/terraform && terraform destroy`

> The EFS file system has a **RETAIN** policy (CDK) so your data isn't deleted by
> accident — delete it manually if you truly want it gone. Everything else
> (ALB, ECS, NAT, VPC) is removed, stopping ongoing charges.

---

## 11. Rough cost note (non-prod)

Main ongoing costs: 1 small Fargate task, 1 NAT gateway (the biggest fixed item,
~$1/day), an internal ALB, EFS (pennies at this size), CloudWatch. Bedrock/Tavily
are per-use. Expect a modest monthly figure for a lightly-used non-prod stack.
If you want to trim: replace the NAT gateway with **VPC endpoints** for ECR/Logs/
Secrets/Bedrock (set `natGateways: 0` in CDK) — a follow-up optimization.

---

## 12. Common gotchas

- **`aws sts get-caller-identity` fails** → your Isengard credentials expired;
  refresh them.
- **Task keeps restarting / unhealthy** → check CloudWatch logs
  `/complianceiq/nonprod`; usually a missing Bedrock model-access grant or the
  Tavily secret not set yet (the app still boots without it, but AI/news degrade).
- **Can't reach `complianceiq.internal`** → you're not on the VPC's private
  network. Connect via VPN/SSM, or test the health endpoint through a bastion.
- **Image architecture mismatch** (`exec format error`) → you built arm64 but the
  task is x86_64 (or vice-versa). Rebuild with the matching `--platform`.
- **Bedrock AccessDenied** → the model isn't enabled in this account/region, or
  the region in `AWS_REGION` doesn't offer that model. Enable model access.

---

## v3.0 Deploy Notes (2026-10-07)

A few things changed since this guide's original "private / internal-only" framing. The current non-prod stack is a **public, Cognito+MFA-gated ALB** (not internal-only), and the v3.0 release adds document storage, an encrypted audit log, and bcrypt auth. Deploy steps are otherwise the same.

### New required / relevant environment

| Variable | Editions | Purpose |
|----------|----------|---------|
| `DOCUMENTS_BUCKET` | AWS normal / External | Private S3 bucket for documents + audit log. Set automatically by CDK on the task. |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Gemini only | Cloudflare R2 (S3-compatible) for documents + audit log. Set in the Gemini deployment env (never committed). |
| `TAVILY_API_KEY` | all | Web search (unchanged; Secrets Manager on AWS). |
| `BEDROCK_MODEL_ID`, `AWS_REGION` | AWS | AI engine (unchanged). |

### What CDK provisions in v3.0

- A **private, encrypted S3 bucket** `complianceiq-<env>-documents-<account>` (BPA on, TLS-only, versioned, RETAIN) with the task role granted read/write.
- The ALB Cognito **`SessionTimeout = 24h`**.
- The task definition env now includes `DOCUMENTS_BUCKET`.

### First-run seeding

On the first boot of a new task, the server seeds `users.json` (bcrypt-hashed default accounts: `ciadmin1`, `ciadmin2`, `sasuser1`–`sasuser4`) and the other server-authoritative files onto the EFS volume. No manual step required. The in-container build installs **bcryptjs** (pure-JS; no native toolchain needed).

### Deploy commands (reference)

```bash
export AWS_PROFILE=complianceiq AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/complianceiq:latest

cd infra/cdk && npm install && npm run build
npx cdk deploy -c envName=nonprod -c imageUri=$IMAGE_URI \
  -c internalDomainName=complianceiq.internal -c bedrockModelId=amazon.nova-pro-v1:0 \
  -c certificateArn=<ACM-ARN>
cd ../..

aws ecr get-login-password --region $AWS_REGION | finch login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
finch build --platform linux/amd64 -t $IMAGE_URI . && finch push $IMAGE_URI
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region $AWS_REGION
```
