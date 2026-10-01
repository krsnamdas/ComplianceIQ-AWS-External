# ComplianceIQ — Future Design Considerations

> **Companion to [`INFRASTRUCTURE_MANUAL.md`](./INFRASTRUCTURE_MANUAL.md).** This document
> captures *planned and optional* improvements to the current non-prod deployment. For each,
> it states **why**, **what specifically changes** in the current implementation, and the
> **effort / tradeoffs** — so a future reader can decide and implement without re-deriving it.
>
> None of these are required for the current setup to work. They are the roadmap from
> "working non-prod demo" toward "durable / production-grade."

---

## Priority at a glance

| # | Improvement | Why | Effort | When to do it |
|---|---|---|---|---|
| 1 | [Publicly-trusted certificate](#1-publicly-trusted-certificate) | Removes browser warning | Low–Med (needs a domain) | Before wider sharing |
| 2 | [SES for Cognito emails](#2-ses-for-cognito-emails) | Reliable invite/reset emails | Low–Med | When invites don't arrive |
| 3 | [Midway / corporate SSO](#3-midway--corporate-sso) | True employee login, no extra password | Med–High (governed) | If it becomes a lasting tool |
| 4 | [Swappable / cheaper Bedrock models](#4-swappable--cheaper-bedrock-models) | Cost control | Low (already supported) | Anytime for cost tuning |
| 5 | [Terraform + DynamoDB path](#5-terraform--dynamodb-path) | Team standard / HA data layer | Med–High | If standardizing on TF or needing HA |
| 6 | [VPC endpoints (drop NAT)](#6-vpc-endpoints-drop-nat) | Cost + tighter egress | Med | Cost optimization pass |
| 7 | [Autoscaling & HA](#7-autoscaling--high-availability) | Resilience, >1 task | Med (needs data-layer change) | Pre-prod |
| 8 | [CI/CD pipeline](#8-cicd-pipeline) | Auto deploy on merge | Med | When iteration picks up |
| 9 | [Tighter IAM & cleanup](#9-tighter-iam--cleanup) | Least privilege, tidy | Low | Hardening pass |

---

## 1. Publicly-trusted certificate

**Why:** The current HTTPS listener uses a **self-signed cert** (CN `complianceiq.nonprod.internal`),
so every user gets a browser "Your connection is not private" warning. Traffic *is* encrypted,
but the warning looks broken and trains users to click through TLS warnings.

**What changes in the current implementation:**
1. **Get a domain** you control (an internal Amazon-managed zone, or a registered domain in
   Route 53). This is the real dependency.
2. **Request an ACM certificate** for that domain with **DNS validation** (ACM auto-renews it):
   ```bash
   aws acm request-certificate --domain-name complianceiq.<your-domain> \
     --validation-method DNS --region us-east-1
   ```
   Add the CNAME validation record to the hosted zone; wait for `ISSUED`.
3. **Swap the cert ARN**: pass the new ACM ARN as `-c certificateArn=...` to `cdk deploy`
   (replaces the self-signed import). No code change needed — it's already a parameter.
4. **Point the domain at the ALB**: add a Route 53 **A/ALIAS** record
   (`complianceiq.<your-domain>` → the ALB). Use a **public** hosted zone (the current
   `complianceiq.internal` private zone is for internal names only).
5. **Update the Cognito callback URLs** in `complianceiq-stack.ts` to the new domain
   (`https://complianceiq.<your-domain>/oauth2/idpresponse`) and redeploy. This also lets you
   **remove the hardcoded lowercase ALB-DNS literal** — a stable custom domain is case-clean.

**Tradeoffs:** needs a domain (the only friction). Once done, the warning is gone, the
callback URL is stable (no more ALB-DNS fragility), and it's renewal-free with ACM DNS validation.

---

## 2. SES for Cognito emails

**Why:** The Cognito user pool currently uses **`COGNITO_DEFAULT`** email — low daily limits
and often blocked by corporate spam filters. Invite/reset emails may silently not arrive
(we worked around it by setting passwords manually).

**What changes:**
1. **Verify a sender identity in SES** (an email or, better, a domain) in `us-east-1`:
   ```bash
   aws ses verify-email-identity --email-address no-reply@<your-domain> --region us-east-1
   ```
2. **Move SES out of sandbox** (production access) via a short AWS support request — otherwise
   SES can only send to *verified* recipient addresses.
3. **Point the Cognito pool at SES**: set the pool's email configuration to
   `emailSendingAccount: DEVELOPER` with the SES `sourceArn`. In CDK:
   ```ts
   email: cognito.UserPoolEmail.withSES({
     fromEmail: 'no-reply@<your-domain>',
     sesRegion: 'us-east-1',
   }),
   ```
   Add this to the `new cognito.UserPool(...)` props in `complianceiq-stack.ts`, rebuild, redeploy.
4. Optionally **customize the invitation/verification message templates** (include the app
   URL, the cert-warning note, and MFA steps).

**Tradeoffs:** SES sandbox + production-access request is the main step. After that, invites
reach any recipient reliably and user onboarding is fully self-service.

---

## 3. Midway / corporate SSO

**Why:** Today users log in with a **Cognito-managed** password + MFA (keyed to their
`@amazon.com` email) — *not* their real corporate identity. True SSO means they authenticate
with their existing employee identity (Midway) — no separate password, central control.

**What changes:**
- **Federate Cognito to the corporate IdP** (OIDC or SAML). In Cognito, add the IdP under
  "Identity providers," map claims (email, name) to pool attributes, and set the ALB client's
  `supportedIdentityProviders` to that IdP (instead of/alongside `COGNITO`). The ALB
  `authenticate-cognito` action then delegates to Midway via Cognito.
- **Alternative:** skip Cognito and use the ALB's **`authenticate-oidc`** action pointed
  directly at Midway's OIDC endpoints.

**The hard part (be realistic):** both require **registering an OIDC/SAML app with Amazon's
internal IdP (Midway federation)** — a *governed* process requiring a request/ticket to the
owning team, and it **may not be permitted from a personal Isengard non-prod account** at all.
This is the one item that genuinely depends on internal approvals and cannot be self-served
from the account.

**Tradeoffs:** best UX and security (no extra password, central deprovisioning), but highest
process friction. Pursue only if ComplianceIQ becomes a lasting internal tool. Until then,
**Cognito + MFA (current)** is the pragmatic, no-approval equivalent.

---

## 4. Swappable / cheaper Bedrock models

**Why:** `amazon.nova-pro-v1:0` is capable but not the cheapest. The app can run on cheaper
models (e.g. **Nova Lite / Nova Micro**) to cut per-call cost, or switch to Claude variants.

**What changes — almost nothing; this is already supported:**
- The model is injected via the **`BEDROCK_MODEL_ID`** environment variable, set from the CDK
  context flag `-c bedrockModelId=...`. `server.ts` already **detects the model family**
  (`isNovaModel` / `isClaudeModel`) and builds the correct request payload for each.
- To switch models, redeploy (or just update the task definition env + roll the service):
  ```bash
  npx cdk deploy ... -c bedrockModelId=amazon.nova-lite-v1:0
  ```
- **Confirm the target model is available** in `us-east-1` and invoke-tests OK (model access
  is now default-on; verify with `aws bedrock get-foundation-model --model-identifier <id>`).
- Some models require a **cross-region inference profile** ID (e.g. `us.amazon.nova-...`) —
  use that form if the bare ID errors with a validation exception.

**Tradeoffs:** cheaper/faster models may reduce answer quality for complex compliance
reasoning. Easy to A/B by changing one parameter. Consider per-endpoint model selection
(cheap model for short tasks, Pro for deep analysis) as a code enhancement.

---

## 5. Terraform + DynamoDB path

Two related but separate ideas.

### 5a. Terraform instead of CDK
**Why:** if your team standardizes on Terraform. The foundation stack **already created the
Terraform state backend** (S3 bucket `complianceiq-nonprod-tfstate-<ACCOUNT_ID>` + DynamoDB
lock table `complianceiq-nonprod-tf-locks`) — currently **unused** because we deployed with CDK.

**What changes:**
- A Terraform implementation of the same architecture would live in `infra/terraform/`
  (a parallel implementation existed in the original plan). You would **not** run both CDK and
  Terraform against the same resources — pick one. Enable the S3 backend block with the
  foundation's bucket/lock table, `terraform init` → `plan` → `apply`.
- Everything in this doc that references `complianceiq-stack.ts` would have a Terraform `.tf`
  equivalent instead.

**Tradeoffs:** migrating an already-deployed CDK stack to Terraform means re-importing or
recreating resources — non-trivial. Only worth it for team-standardization reasons. If you
never go Terraform, **delete the unused S3 bucket + DynamoDB table** from the foundation to tidy up.

### 5b. DynamoDB as the data layer (for HA)
**Why:** Today app data lives on **EFS** (single shared file store), which is fine for one task
but is the thing blocking horizontal scaling (see [#7](#7-autoscaling--high-availability)).
Moving the region/admin data to **DynamoDB** makes it a managed, multi-writer store so you can
run **multiple tasks** safely.

**What changes:**
- App code change (not just infra): the data-access layer in the app (currently reading/writing
  region JSON under `DATA_DIR=/app/data`) would be rewritten to read/write **DynamoDB** tables.
- Infra: add DynamoDB table(s) in the CDK, grant the task role `dynamodb:*` on them, drop the
  EFS mount (or keep EFS for other files).
- This unlocks removing `desiredCount=1` and enabling autoscaling.

**Tradeoffs:** this is the **biggest** change (application rewrite of the persistence layer).
Do it only when HA/scale is actually needed. Until then EFS + single task is simpler and works.

---

## 6. VPC endpoints (drop NAT)

**Why:** The **NAT gateway is the biggest fixed cost** (~\$1/day + data) and exists so the task
can reach Bedrock, ECR, CloudWatch Logs, and Secrets Manager. Those are all AWS services —
reachable privately via **VPC interface endpoints** without any NAT/internet.

**What changes:**
- Add interface VPC endpoints for `bedrock-runtime`, `ecr.api`, `ecr.dkr`, `logs`,
  `secretsmanager` (and a gateway endpoint for S3, which ECR uses). In CDK, `vpc.addInterfaceEndpoint(...)`.
- Set **`natGateways: 0`** in the VPC config.
- **Caveat:** **Tavily is NOT an AWS service** — it's on the public internet. If you drop NAT
  entirely, the app loses Tavily access. Options: keep a minimal NAT just for Tavily, or route
  Tavily through a proxy/endpoint. So "drop NAT" only fully works if you also remove or
  re-route the Tavily dependency (see the regulatory-data-pipeline idea below).

**Tradeoffs:** saves NAT cost and tightens egress (traffic stays on AWS's network), but the
Tavily dependency complicates a full NAT removal.

### Related: AWS-native regulatory data pipeline (replace Tavily)
Raised during build as the AWS-native alternative to Tavily's web search: a **scheduled
Lambda (EventBridge) → scrape known MENAT regulator sources → store in DynamoDB/S3**, and have
the app query that store first, falling back to Tavily only for ad-hoc queries. This reduces
Tavily rate-limit exposure and (combined with VPC endpoints) could remove the public-internet
egress entirely. Larger project; worth it if Tavily limits bite or for a fully-private posture.

---

## 7. Autoscaling & high availability

**Why:** Currently **`desiredCount = 1`** with no autoscaling. A single task means brief
downtime on redeploy and no resilience to a task/AZ failure.

**What changes:**
- Set `desiredCount >= 2` and add an **Application Auto Scaling** target on the ECS service
  (CPU/memory or request-count based) in `complianceiq-stack.ts`.
- **Prerequisite:** the data layer must support concurrent writers. EFS technically allows
  multi-mount, but the app's file-based data model isn't safe for concurrent writes — so this
  really wants the **DynamoDB migration ([#5b](#5b-dynamodb-as-the-data-layer-for-ha))** first.
- The ALB + target group already support multiple targets, so the LB side is ready.

**Tradeoffs:** gated on the data-layer change. Until then, keep 1 task (the circuit breaker +
rollback already make redeploys safe).

---

## 8. CI/CD pipeline

**Why:** Today deploys are manual (`finch build/push` + `cdk deploy`). A pipeline removes
toil and human error.

**What changes:**
- A **GitHub Actions** workflow on merge to `main`: build the image, push to ECR, roll the ECS
  service (and `cdk deploy` on infra changes). Authenticate via **GitHub OIDC → a deploy IAM
  role** (no static keys).
- Add the OIDC provider + deploy role in the foundation (the admin IAM group is already there
  as a starting point).

**Tradeoffs:** standard and worthwhile once iteration picks up; needs the OIDC/role setup.

---

## 9. Tighter IAM & cleanup

Small hardening/tidy items noted during the build:
- **Scope the Bedrock IAM** from `resource: '*'` to the specific model ARN(s) the app uses.
- **Remove the vestigial Route 53 private zone** (`complianceiq.internal`) — it points at a
  now-public ALB and is unused.
- **Delete the unused Terraform state backend** (S3 bucket + DynamoDB lock table) if you're
  committed to CDK.
- **Remove the hardcoded lowercase ALB-DNS** Cognito callback once a stable custom domain is
  in place (see [#1](#1-publicly-trusted-certificate)).
- **Decommission checklist** (if tearing down): `cdk destroy`, delete the EFS (RETAINed),
  delete the BPA exclusions, delete the self-signed ACM cert, delete the Cognito pool.

---

## Summary — the realistic next three

If/when this moves beyond a short demo, the highest-value sequence is:
1. **Publicly-trusted cert on a real domain** (#1) — removes the warning + stabilizes the
   Cognito callback. Biggest UX win for least effort.
2. **SES for emails** (#2) — makes user onboarding self-service.
3. **Midway SSO** (#3) — if it becomes a lasting internal tool.

Everything else (Terraform, DynamoDB/HA, VPC endpoints, CI/CD) is driven by scale, cost, or
team-standardization needs rather than being blockers.
