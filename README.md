# ComplianceIQ — AWS External Edition

A deploy-it-yourself edition of **ComplianceIQ** (a MENAT Governance, Risk & Compliance
intelligence platform) for **any standalone AWS account**. It runs on **ECS Fargate** behind
a **Cognito-authenticated (MFA) HTTPS load balancer**, using **Amazon Bedrock** for AI and
**Tavily** for web search.

> This edition is **independent of any Amazon-employee access**. You deploy it into **your own
> commercial AWS account**, with **your own** Bedrock model access and Tavily API key. There is
> no dependency on internal/Isengard tooling.
>
> - **Application features & usage:** [`APPLICATION_MANUAL.md`](./APPLICATION_MANUAL.md)
> - **Infrastructure & operations:** [`infra/INFRASTRUCTURE_MANUAL.md`](./infra/INFRASTRUCTURE_MANUAL.md)
> - **Roadmap / options:** [`infra/FUTURE_DESIGN_CONSIDERATIONS.md`](./infra/FUTURE_DESIGN_CONSIDERATIONS.md)
>
> Looking to demo **without any AWS account**? Use the **Gemini edition** instead (separate repo).

---

## What you need (prerequisites)

1. **An AWS account** you control (a normal commercial account — not required to be anything special).
2. **AWS CLI v2** configured with credentials for that account (`aws sts get-caller-identity` works).
3. **Amazon Bedrock model access** for your chosen model (default `amazon.nova-pro-v1:0`) in your region.
   - Verify: `aws bedrock get-foundation-model --model-identifier amazon.nova-pro-v1:0 --region <region>`
4. **A Tavily API key** (https://tavily.com) for live web search/news.
5. **Node.js 18+** and **AWS CDK** (`npm i -g aws-cdk` or use the local dep in `infra/cdk`).
6. A container builder (**Docker** or **Finch**).
7. *(Recommended)* **A domain name** you control, for a trusted HTTPS certificate and a stable
   login callback. Without one you can still deploy using a self-signed cert (browser warning)
   and a helper script — see below.

---

## How it differs from the internal/Isengard deployment

This edition was derived from an internal deployment and generalized so it works in any account:

| Area | Internal (Isengard) original | This external edition |
|---|---|---|
| **AWS account** | Personal Isengard non-prod | **Your own** commercial account |
| **Bedrock / Tavily** | Tied to the author's access | **You supply** your own access + key |
| **Cognito callback URL** | Hardcoded to the author's ALB DNS | **Dynamic** — custom domain (recommended) or a post-deploy helper script |
| **VPC Block Public Access** | Required Isengard-specific exclusions | **Not needed** unless *your* account enforces BPA (documented as optional) |
| **TLS certificate** | Self-signed (browser warning) | **Use a real ACM cert** on your domain (recommended); self-signed fallback documented |
| **App code** | Bedrock + Tavily | **Unchanged** — identical app |

**The application code is identical.** All differences are in deployment configuration and docs.

---

## Quick start

```bash
# 0. Shell setup
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=complianceiq
export IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest"

# 1. Foundation (ECR, IAM, log group) — once per account
aws cloudformation deploy --region "$AWS_REGION" \
  --stack-name complianceiq-foundation-nonprod \
  --template-file infra/foundation/foundation.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides ProjectName=complianceiq EnvName=nonprod EcrRepoName=complianceiq

# 2. Build & push the image (x86_64 for Fargate). Docker shown; Finch is identical.
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
docker build --platform linux/amd64 -t "$IMAGE_URI" .
docker push "$IMAGE_URI"

# 3. A TLS certificate ARN (choose one):
#    (A) RECOMMENDED — real ACM cert for your domain (DNS-validated), or
#    (B) self-signed import (browser warning) — see infra/INFRASTRUCTURE_MANUAL.md
export CERT_ARN="arn:aws:acm:${AWS_REGION}:${ACCOUNT_ID}:certificate/<your-cert>"

# 4. Deploy the app stack
cd infra/cdk && npm install && npm run build
npx cdk bootstrap "aws://${ACCOUNT_ID}/${AWS_REGION}"

# 4A. WITH a custom domain (recommended — clean, stable login callback):
npx cdk deploy -c envName=nonprod -c imageUri="$IMAGE_URI" \
  -c bedrockModelId=amazon.nova-pro-v1:0 -c certificateArn="$CERT_ARN" \
  -c appDomainName=app.your-domain.com
#   then point app.your-domain.com (DNS) at the ALB from the stack outputs.

# 4B. WITHOUT a custom domain (raw ALB DNS):
npx cdk deploy -c envName=nonprod -c imageUri="$IMAGE_URI" \
  -c bedrockModelId=amazon.nova-pro-v1:0 -c certificateArn="$CERT_ARN"
cd ../..
#   then register the lowercase ALB callback for Cognito:
AWS_REGION="$AWS_REGION" STACK=ComplianceIQ-nonprod ./infra/scripts/add-cognito-callback.sh

# 5. Set your Tavily key, then roll the service
aws secretsmanager put-secret-value --secret-id complianceiq/nonprod/tavily-api-key \
  --secret-string 'tvly-YOUR-KEY' --region "$AWS_REGION"
# (force-new-deployment — see the infrastructure manual runbook)

# 6. Create your login users in the Cognito user pool (see the infra manual).
```

Full details, topology, security model, and the operations runbook are in
**[`infra/INFRASTRUCTURE_MANUAL.md`](./infra/INFRASTRUCTURE_MANUAL.md)**.

---

## If your account enforces VPC Block Public Access (BPA)

Most commercial accounts do **not**. If yours does (inbound internet blocked at the VPC level),
the internet-facing ALB won't be reachable until you add a BPA **exclusion** on the public
subnets. This is optional and only applies to BPA-enabled accounts — see the infrastructure
manual's networking section.

---

## Security notes

- The app runs privately; only the **Cognito-authenticated (MFA) HTTPS ALB** is exposed.
- The task uses an **IAM role** for Bedrock — **no static AWS keys** in the image.
- Tavily key lives in **Secrets Manager**, never in git or the image.
- Use a **real certificate** (not self-signed) for any shared/real use.
- Local dev uses `.env` (see `.env.example`); it is git-ignored — never commit real keys.

---

*ComplianceIQ covers 24 MENAT jurisdictions mapped to NIST CSF 2.0, ISO/IEC 27001:2022, and
CSA CCM v4.0.10. See [`APPLICATION_MANUAL.md`](./APPLICATION_MANUAL.md) for the full feature set.*
