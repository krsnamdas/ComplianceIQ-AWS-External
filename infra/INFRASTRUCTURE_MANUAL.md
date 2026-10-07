# ComplianceIQ — Infrastructure & Architecture Manual (Non-Prod)

> **Audience:** the admin/operator managing the AWS infrastructure that hosts ComplianceIQ.
> **Scope:** everything about the AWS environment — services, topology, how it was built,
> how to operate it, and known caveats. For the *application itself* (features, usage,
> accounts) see **[`APPLICATION_MANUAL.md`](../APPLICATION_MANUAL.md)**. For planned
> improvements see **[Future Design Considerations](#future-design-considerations)** below
> (also kept in **[`FUTURE_DESIGN_CONSIDERATIONS.md`](./FUTURE_DESIGN_CONSIDERATIONS.md)**).
>
> **If you are reading this cold (e.g. after time away): start at
> [§1 TL;DR](#1-tldr--what-this-is) and [§13 Operations runbook](#13-operations-runbook).**

---

## Table of contents
1. [TL;DR — what this is](#1-tldr--what-this-is)
2. [Key identifiers (fill-in-the-blanks cheat sheet)](#2-key-identifiers)
3. [Topology diagram](#3-topology-diagram)
4. [Request flow — how a user reaches the app](#4-request-flow)
5. [AWS building blocks (service by service)](#5-aws-building-blocks)
6. [The two CloudFormation stacks](#6-the-two-cloudformation-stacks)
7. [Security model & posture](#7-security-model--posture)
8. [Networking deep-dive (VPC, subnets, BPA)](#8-networking-deep-dive)
9. [Authentication (Cognito + MFA)](#9-authentication-cognito--mfa)
10. [Secrets, data & backups](#10-secrets-data--backups)
11. [How it was built (the deployment story)](#11-how-it-was-built)
12. [Caveats & known rough edges](#12-caveats--known-rough-edges)
13. [Operations runbook](#13-operations-runbook)
14. [Cost notes](#14-cost-notes)
15. [Future design considerations](#future-design-considerations)

---

## 1. TL;DR — what this is

ComplianceIQ is a containerized web app (React SPA + Express API) running on **AWS ECS
Fargate**, in a **personal Isengard non-prod account**. It is reached over the public
internet at an **HTTPS URL**, but **gated by Amazon Cognito with mandatory MFA** before any
request reaches the app. Infrastructure is defined as code with **AWS CDK (TypeScript)**,
which deploys **CloudFormation** under the hood.

- **Public URL:** `https://compli-alb16-6eesite0yiky-1926867226.us-east-1.elb.amazonaws.com/`
- **Account / Region:** `192425633190` / `us-east-1`
- **IaC:** `infra/cdk/` (app stack) + `infra/foundation/foundation.yaml` (account baseline)
- **Auth:** Cognito user pool (MFA/TOTP required) → then the app's own local login
- **AI:** Amazon Bedrock (`amazon.nova-pro-v1:0`) + Tavily web search

---

## 2. Key identifiers

Copy-paste reference for everything you'll need to operate this.

| Thing | Value |
|---|---|
| AWS Account ID | `192425633190` |
| Region | `us-east-1` |
| CLI profile | `krishmd` (Isengard; refresh with `mwinit` then `aws login --profile krishmd`) |
| App CloudFormation stack | `ComplianceIQ-nonprod` |
| Foundation stack | `complianceiq-foundation-nonprod` |
| Public app URL | `https://compli-alb16-6eesite0yiky-1926867226.us-east-1.elb.amazonaws.com/` |
| ALB DNS | `compli-alb16-6eesite0yiky-1926867226.us-east-1.elb.amazonaws.com` |
| VPC ID | `vpc-08e469db1cdcfd9eb` |
| ECR repo | `complianceiq` (`192425633190.dkr.ecr.us-east-1.amazonaws.com/complianceiq:latest`) |
| ECS cluster / service | `ComplianceIQ-nonprod-Cluster...` / `ComplianceIQ-nonprod-Service...` (discover via CLI) |
| Cognito User Pool ID | `us-east-1_lykHzDirh` |
| Cognito App Client ID | `6cnjcbtvs3r18g26uk5tbv89o9` |
| Cognito hosted-UI domain prefix | `complianceiq-nonprod-192425633190` |
| Tavily secret (Secrets Manager) | `complianceiq/nonprod/tavily-api-key` |
| EFS file system | `fs-0ad6b114155b99c72` (mounted at `/app/data`) |
| CloudWatch log group | `/complianceiq/nonprod` |
| ACM cert (self-signed) | `arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERT_ID>` (look up the live ARN with `aws acm list-certificates`) |
| Bedrock model | `amazon.nova-pro-v1:0` |

> **Note:** ECS cluster/service names carry random suffixes. Discover them with:
> ```bash
> CLUSTER=$(aws ecs list-clusters --region us-east-1 --query "clusterArns[?contains(@,'ComplianceIQ-nonprod')]" --output text)
> SERVICE=$(aws ecs list-services --cluster "$CLUSTER" --region us-east-1 --query "serviceArns[0]" --output text)
> ```

---

## 3. Topology diagram

```
                                   INTERNET
                                      │
                                      │  HTTPS (443)   [HTTP:80 → 301 redirect to 443]
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  AWS Account 192425633190 · Region us-east-1                                        │
│                                                                                     │
│  VPC vpc-08e469db1cdcfd9eb  (2 Availability Zones)                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐│
│  │  PUBLIC subnets (public-nat)   ── VPC BPA EXCLUSION: allow-bidirectional ──      ││
│  │   • Internet Gateway (IGW)                                                       ││
│  │   • NAT Gateway  ───────────────────────────────┐ (egress for private tier)     ││
│  │   • Application Load Balancer (internet-facing)  │                               ││
│  │        │  listener :80  → redirect :443          │                               ││
│  │        │  listener :443 (ACM self-signed cert)   │                               ││
│  │        │     └─ action: authenticate-cognito ────┼──► Cognito User Pool          ││
│  │        │          (MFA/TOTP) then forward         │     us-east-1_lykHzDirh       ││
│  │        ▼                                          │     + hosted UI domain        ││
│  │   Target Group (HTTP :3000, health /api/health)   │                               ││
│  └────────┼──────────────────────────────────────────┼──────────────────────────────┘│
│           │ (ALB → task, SG-restricted)               │                               │
│  ┌────────▼──────────────────────────────────────────┼──────────────────────────────┐│
│  │  PRIVATE subnets (private-app)   ── BPA: block-ingress (no inbound internet) ──    ││
│  │   • ECS Fargate Service (desiredCount = 1)         │                               ││
│  │        Task: container port 3000                   │                               ││
│  │          env: BEDROCK_MODEL_ID, AWS_REGION, DATA_DIR=/app/data                     ││
│  │          secret: TAVILY_API_KEY  ◄──── Secrets Manager (complianceiq/nonprod/...)  ││
│  │          Task Role ──► Bedrock InvokeModel ───────────────► Amazon Bedrock         ││
│  │          egress via NAT ──► Bedrock / Tavily (internet)                            ││
│  │          logs ──────────────────────────────────────────► CloudWatch Logs         ││
│  │              │                                                /complianceiq/nonprod ││
│  │              │ NFS mount /app/data (TLS)                                           ││
│  └──────────────┼───────────────────────────────────────────────────────────────────┘│
│  ┌──────────────▼───────────────────────────────────────────────────────────────────┐│
│  │  ISOLATED subnets (isolated-data)   ── BPA: block-ingress, no egress ──            ││
│  │   • EFS fs-0ad6b114155b99c72 (encrypted) ──► AWS Backup (daily snapshots)          ││
│  └────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                     │
│  ECR repo `complianceiq` (image source)   Route53 PRIVATE zone complianceiq.internal│
│  CloudWatch Container Insights                (vestigial; see caveats)              │
└──────────────────────────────────────────────────────────────────────────────────┘

  External SaaS (reached outbound via NAT):  Tavily Search API  ·  (Bedrock is an AWS API)
```

A rendered version of this diagram is attached to the chat as a Mermaid artifact; the
ASCII above is the authoritative, always-available copy.

---

## 4. Request flow

What happens when a user opens the URL:

1. **Browser → ALB :443.** (If they hit `:80`, the ALB 301-redirects them to `:443`.)
2. **TLS terminates at the ALB** using the self-signed ACM cert. *(Browsers show a
   "not private" warning — expected; see caveats.)*
3. **ALB `authenticate-cognito` action** intercepts. If the user has no valid session,
   the ALB redirects them to the **Cognito hosted UI** to log in.
4. **Cognito login + MFA.** First-time users set a password and enroll a TOTP authenticator.
   Cognito redirects back to the ALB's `/oauth2/idpresponse` callback with an auth code.
5. **ALB validates** the code with Cognito, establishes an auth session cookie, and only
   now **forwards the request** to the target group.
6. **Target group → Fargate task** on port 3000 (HTTP, inside the VPC).
7. **The app** serves the SPA / API. It then presents **its own local login**
   (`ciadmin` / `sasuser*`) — a second, app-level gate.
8. **AI calls** from the app go to **Bedrock** (via the task's IAM role) and **Tavily**
   (via NAT egress, using the key from Secrets Manager).

Two independent auth layers: **Cognito+MFA (network edge)** → **app local login (app layer)**.

---

## 5. AWS building blocks

| # | Service | Resource | Purpose / config |
|---|---|---|---|
| 1 | **VPC** | `vpc-08e469db1cdcfd9eb` | 2 AZs; public/private/isolated subnet tiers |
| 2 | **Internet Gateway** | (in VPC) | Inbound/outbound for public subnets |
| 3 | **NAT Gateway** | 1 (in public subnet) | Outbound-only egress for the private tier (Bedrock/Tavily) |
| 4 | **VPC Block Public Access** | account-level `block-ingress` + 2 subnet exclusions | Blocks inbound internet account-wide; public subnets excluded so the ALB works |
| 5 | **Application Load Balancer** | internet-facing, in public subnets | Entry point; TLS termination; Cognito auth; 80→443 redirect |
| 6 | **ACM** | self-signed cert `...15d77c4a...` | TLS cert for the HTTPS listener (CN `complianceiq.nonprod.internal`) |
| 7 | **Cognito User Pool** | `us-east-1_lykHzDirh` | Auth gate; MFA required (TOTP); hosted UI; self-signup disabled |
| 8 | **ECS (Fargate)** | cluster + service, `desiredCount=1` | Runs the container; Container Insights; circuit breaker w/ rollback |
| 9 | **ECR** | repo `complianceiq` | Stores the app image (foundation-owned) |
| 10 | **EFS** | `fs-0ad6b114155b99c72` | Persistent `/app/data`; encrypted; access point uid/gid 1000 |
| 11 | **AWS Backup** | auto (EFS) | Daily EFS snapshots |
| 12 | **Secrets Manager** | `complianceiq/nonprod/tavily-api-key` | Tavily API key, injected into the task |
| 13 | **IAM** | task role + execution role | Task role: Bedrock invoke + read secret. Exec role: ECR pull + logs |
| 14 | **CloudWatch Logs** | `/complianceiq/nonprod` | Container logs (30-day retention; foundation-owned) |
| 15 | **Amazon Bedrock** | model `amazon.nova-pro-v1:0` | LLM for AI features (invoked by the task role) |
| 16 | **Route 53** | private zone `complianceiq.internal` | Legacy internal DNS (vestigial — see caveats) |

**External (non-AWS) integration:** **Tavily Search API** — reached outbound via the NAT
gateway, authenticated with the key from Secrets Manager. Used for live regulatory web search/news.

---

## 6. The two CloudFormation stacks

Infrastructure is split into two layers, deployed in order:

### 6a. Foundation — `infra/foundation/foundation.yaml` (raw CloudFormation)
Deployed **once per account**, before the app. Creates account-level prerequisites:
- **ECR repository** `complianceiq` (scan-on-push, keep last 10 images)
- **IAM admin group + managed policy** (for operators; currently empty/unused)
- **CloudWatch log group** `/complianceiq/nonprod` (30-day retention)
- **Terraform state backend** (S3 bucket + DynamoDB lock table) — **created but UNUSED**
  because we deployed with CDK, not Terraform. Harmless; see Future Considerations.

Stack name: `complianceiq-foundation-nonprod`.

### 6b. Application — `infra/cdk/` (AWS CDK, TypeScript → CloudFormation)
Everything else (VPC, ALB, ECS, EFS, Cognito, IAM task roles, secrets shell, Route53).
Entry point `infra/cdk/bin/app.ts`; stack definition `infra/cdk/lib/complianceiq-stack.ts`.
Stack name: `ComplianceIQ-nonprod`.

> **CDK gotcha:** `cdk.json` runs the **compiled** `bin/app.js`, so you **must
> `npm run build` after editing any `.ts`** before `cdk deploy`, or your change is ignored.

---

## 7. Security model & posture

**Defense in depth, outside-in:**

1. **VPC Block Public Access (`block-ingress`)** — account-wide guardrail blocking inbound
   internet. Only the **two public ALB subnets** are excluded (`allow-bidirectional`).
   Private and isolated subnets remain fully blocked from inbound internet.
2. **Security groups** — ALB SG allows 443/80 from the internet (gated by Cognito, not IP).
   Task SG only accepts 3000 **from the ALB SG**. EFS SG only accepts 2049 **from the task SG**.
3. **TLS** — all app traffic is HTTPS; plain HTTP is redirected to HTTPS.
4. **Cognito + mandatory MFA** — no request reaches the app without an authenticated
   Cognito session with TOTP.
5. **App local login** — a second gate (`ciadmin`/`sasuser*`) inside the app.
6. **IAM least-privilege** — the task role can only `bedrock:InvokeModel*` and read its one
   secret. **No static AWS keys anywhere** — the task uses its role; the image excludes `.env`.
7. **Encryption** — EFS encrypted at rest; EFS transit encryption on; Secrets Manager encrypted.

**What is intentionally NOT protected to prod-grade:** the app's own login has **no MFA**
(hence the Cognito gate in front), the TLS cert is **self-signed** (not publicly trusted),
and the ALB is **internet-reachable** (gated, but reachable). All acceptable for a
short-lived non-prod test with no customer data; see caveats + future considerations.

---

## 8. Networking deep-dive

**Subnet tiers (per AZ, 2 AZs):**
- **`public-nat` (PUBLIC)** — hosts the IGW route, the NAT gateway, and the internet-facing
  ALB. **BPA-excluded** so inbound can reach the ALB.
- **`private-app` (PRIVATE_WITH_EGRESS)** — the Fargate task. No inbound internet; outbound
  via NAT (to reach Bedrock/Tavily).
- **`isolated-data` (PRIVATE_ISOLATED)** — EFS. No internet at all, inbound or outbound.

**VPC Block Public Access (BPA):** The account has BPA in `block-ingress` mode
(`ManagedBy: account`). This is why nothing inbound worked until we created exclusions.
Two exclusions exist (`allow-bidirectional`) on the public subnets. Check/manage:
```bash
aws ec2 describe-vpc-block-public-access-options --region us-east-1
aws ec2 describe-vpc-block-public-access-exclusions --max-results 50 --region us-east-1
```
**If you ever tear down and rebuild the ALB/subnets, you must recreate the exclusions.**

**Why the NAT gateway exists:** the app must call Tavily (and reach Bedrock's public
endpoint) *outbound*. NAT provides that egress. NAT is **outbound-only** — it does not and
cannot accept inbound connections. Inbound is the ALB's job.

---

## 9. Authentication (Cognito + MFA)

- **User pool:** `us-east-1_lykHzDirh` (`complianceiq-nonprod`). MFA **REQUIRED** (TOTP only,
  no SMS). Self-signup **disabled** — operators create users. Email is the username/alias.
  Password policy: 12+ chars, upper/lower/digit/symbol.
- **App client:** `6cnjcbtvs3r18g26uk5tbv89o9`, has a client secret (required for ALB auth),
  authorization-code flow, scopes `openid email`.
- **Callback URLs:** BOTH the mixed-case ALB DNS and a **lowercase literal** are registered.
  This is deliberate — browsers lowercase the host and Cognito matches callbacks
  case-sensitively. **If the ALB is replaced (new DNS), update the lowercase literal in
  `complianceiq-stack.ts` and redeploy.**
- **Hosted UI domain:** `complianceiq-nonprod-192425633190.auth.us-east-1.amazoncognito.com`.

**Managing users** (console: Cognito → `complianceiq-nonprod` → Users; or CLI):
```bash
# create a user (operator sets a temp password; forced change + MFA enroll on first login)
aws cognito-idp admin-create-user --region us-east-1 \
  --user-pool-id us-east-1_lykHzDirh \
  --username USER@amazon.com \
  --user-attributes Name=email,Value=USER@amazon.com Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL
# set a known temp password if the invite email doesn't arrive
aws cognito-idp admin-set-user-password --region us-east-1 \
  --user-pool-id us-east-1_lykHzDirh --username USER@amazon.com \
  --password 'TempPass!2026Xy' --no-permanent
```
Current tester emails: `krishmd@amazon.ae`, `heladel@amazon.ae`, `mvvarbai@amazon.co.uk`,
`ammarzon@amazon.ae`.

> **Email delivery caveat:** the pool uses Cognito's default email (low limits, often caught
> by corporate spam). If invites don't arrive, set passwords manually (above) or move to SES
> (see Future Considerations).

---

## 10. Secrets, data & backups

- **Tavily key** lives only in **Secrets Manager** (`complianceiq/nonprod/tavily-api-key`),
  injected into the container as `TAVILY_API_KEY`. Never in git or the image. Rotate with:
  ```bash
  aws secretsmanager put-secret-value --secret-id complianceiq/nonprod/tavily-api-key \
    --secret-string 'tvly-NEW-KEY' --region us-east-1
  # then force a new deployment so the task picks it up (see runbook)
  ```
- **App data** (region JSON, admin edits) persists on **EFS** at `/app/data` (`DATA_DIR`).
  Survives restarts/redeploys. **AWS Backup** takes daily snapshots. EFS has a **RETAIN**
  policy — it is NOT deleted if you `cdk destroy`.
- **No customer/PII data** is stored — only regulatory framework metadata and assessments.

---

## 11. How it was built

Chronological summary of the actual deployment, including the bugs fixed along the way
(kept so a future reader understands *why* the code looks the way it does):

1. **Isengard auth:** `mwinit` → `aws login --profile krishmd`. Credentials are short-lived
   and expire frequently — re-auth is routine.
2. **Foundation stack** deployed (ECR, IAM, log group, unused TF state backend).
3. **Image build & push:** Finch, built `--platform linux/amd64` (Fargate is x86_64),
   pushed to ECR. *(First attempt tagged the wrong repo name due to a zsh `:latest`
   glob-modifier quirk — always quote `"${VAR}:latest"`.)*
4. **CDK app stack** — iterated through several real defects before it deployed clean:
   - VPC `natGateways:1` needed a **public subnet** to host the NAT → added `public-nat`.
   - **Log-group collision**: both foundation and CDK tried to create `/complianceiq/nonprod`
     → switched CDK to `LogGroup.fromLogGroupName` (reference, not create).
   - **Em-dash** in an IAM role description → IAM rejects non-ASCII → replaced with `-`.
   - **ECR pull AccessDenied** (`ecr:GetAuthorizationToken`): the image was referenced with
     `fromRegistry` (generic) so CDK didn't grant ECR perms → switched to
     **`fromEcrRepository`**, which auto-grants the execution role the right permissions.
     *(This was NOT an SCP — the error wording was the standard "no identity-based policy".)*
5. **Tavily secret** set; service force-redeployed to pick it up.
6. **Bedrock** `amazon.nova-pro-v1:0` confirmed `ACTIVE` and invoke-tested OK. (The old
   "Model access" console page is retired; access is now default-on.)
7. **Access problem:** VPC **BPA `block-ingress`** blocks all inbound. An SSM bastion was
   attempted but never registered (locked-down account). Resolved by discovering BPA, and
   that **exclusions are allowed** at the account level.
8. **Public + secure access:** created **BPA exclusions** on the public subnets, flipped the
   ALB to **internet-facing**, added **Cognito + MFA** auth and an **HTTPS listener**.
   - SG rule description with `>` was rejected (invalid char) → reworded.
   - Self-signed cert with a non-FQDN CN was rejected by ALB → regenerated with FQDN CN+SAN.
   - Cognito "redirect not configured" → ALB host case-sensitivity → registered lowercase
     callback URL (now in IaC).
9. **Bastion terminated** (cleanup). First Cognito user created; login verified end-to-end
   (Cognito → MFA → app).

---

## 12. Caveats & known rough edges

| Caveat | Impact | Mitigation / fix |
|---|---|---|
| **Self-signed TLS cert** | Every user sees a browser "not private" warning (click through) | Use a real domain + ACM cert — see Future Considerations |
| **BPA exclusion in place** | The public subnets opt out of the account inbound-block guardrail | Narrowly scoped (ALB subnets only); remove when done; consider a heads-up to Secure Foundations |
| **ALB DNS hardcoded in a Cognito callback** | If the ALB is replaced, login breaks until the lowercase literal is updated | Update the literal in `complianceiq-stack.ts` + redeploy, or move to a stable custom domain |
| **Cognito default email** | Invite emails may not reach corporate inboxes | Set passwords manually, or adopt SES (Future Considerations) |
| **App local login has no MFA** | Weak on its own | Cognito+MFA gate compensates; longer-term fold auth into Cognito |
| **Route 53 private zone is vestigial** | `complianceiq.internal` A-record points at a now-public ALB; unused | Harmless; can be removed in a cleanup pass |
| **Unused Terraform state backend** | S3 bucket + DynamoDB table sit idle (from foundation) | ~$0 idle; keep for optional Terraform path or delete |
| **`desiredCount=1`, no autoscaling** | Single task; brief downtime on redeploy | Fine for non-prod; see Future Considerations for HA |
| **Bedrock IAM `resource: '*'`** | Broader than strictly necessary | Scope to specific model ARNs if desired |
| **Isengard creds expire often** | Commands fail with `ExpiredToken` mid-session | `mwinit` + `aws login --profile krishmd` to refresh |

---

## 13. Operations runbook

**Re-authenticate (do this first whenever a command says `ExpiredToken`):**
```bash
mwinit
aws login --profile krishmd
aws sts get-caller-identity --profile krishmd    # expect account 192425633190
export AWS_PROFILE=krishmd AWS_REGION=us-east-1
```

**Standard env vars for CDK work:**
```bash
export AWS_PROFILE=krishmd AWS_REGION=us-east-1
export ACCOUNT_ID=192425633190 CDK_DEFAULT_ACCOUNT=192425633190 CDK_DEFAULT_REGION=us-east-1
export IMAGE_URI="192425633190.dkr.ecr.us-east-1.amazonaws.com/complianceiq:latest"
export CERT_ARN="$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[0].CertificateArn" --output text)"   # or paste your cert ARN
```

**Deploy a code or infra change (new app version):**
```bash
# 1. rebuild & push the image
finch build --platform linux/amd64 -t "$IMAGE_URI" .
aws ecr get-login-password --region us-east-1 | finch login --username AWS --password-stdin 192425633190.dkr.ecr.us-east-1.amazonaws.com
finch push "$IMAGE_URI"
# 2. roll the service to the new image
CLUSTER=$(aws ecs list-clusters --region us-east-1 --query "clusterArns[?contains(@,'ComplianceIQ-nonprod')]" --output text)
SERVICE=$(aws ecs list-services --cluster "$CLUSTER" --region us-east-1 --query "serviceArns[0]" --output text)
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --force-new-deployment --region us-east-1
```

**Deploy an infrastructure change (edited the CDK):**
```bash
cd infra/cdk
npm run build        # REQUIRED after editing any .ts
npx cdk deploy -c envName=nonprod -c imageUri="$IMAGE_URI" \
  -c internalDomainName=complianceiq.internal -c bedrockModelId=amazon.nova-pro-v1:0 \
  -c certificateArn="$CERT_ARN"
```

**Check health / status:**
```bash
# rollout state (want COMPLETED)
aws ecs describe-services --cluster "$CLUSTER" --service "$SERVICE" --region us-east-1 \
  --query "services[0].deployments[?status=='PRIMARY'].rolloutState" --output text
# target health (want healthy)
TG=$(aws elbv2 describe-target-groups --region us-east-1 --query "TargetGroups[?contains(TargetGroupName,'Compli')].TargetGroupArn" --output text)
aws elbv2 describe-target-health --target-group-arn "$TG" --region us-east-1 --query "TargetHealthDescriptions[].TargetHealth.State" --output text
# live logs
aws logs tail /complianceiq/nonprod --follow --region us-east-1
```

**Rotate the Tavily key:** see §10, then force a new deployment (above).

**Test Bedrock access:**
```bash
aws bedrock-runtime invoke-model --model-id amazon.nova-pro-v1:0 \
  --body '{"messages":[{"role":"user","content":[{"text":"hi"}]}],"inferenceConfig":{"maxTokens":10}}' \
  --cli-binary-format raw-in-base64-out --region us-east-1 /tmp/t.json && cat /tmp/t.json
```

**Tear down (stop costs):**
```bash
cd infra/cdk && npx cdk destroy        # removes the app stack
# EFS is RETAINed — delete manually if you truly want the data gone
# Also delete the BPA exclusions and the self-signed ACM cert if fully decommissioning
```
> A failed `cdk deploy` can leave the stack in `ROLLBACK_COMPLETE` (on create) which must be
> **deleted** before redeploying; a failed *update* rolls back automatically and can be
> redeployed directly.

---

## 14. Cost notes

Main ongoing (non-prod, lightly used): **1 NAT gateway** (the biggest fixed item, ~\$1/day
+ data), **1 small Fargate task** (0.5 vCPU / 1 GB), **1 ALB**, **EFS** (pennies at this
size), **CloudWatch**, **Cognito** (free at this scale). **Bedrock/Tavily** are per-use.
To trim: replace the NAT gateway with **VPC endpoints** for ECR/Logs/Secrets/Bedrock
(set `natGateways: 0`) — a follow-up optimization. **Terminate the bastion** was done.
`cdk destroy` stops the recurring charges (EFS retained).

---

## Future design considerations

The full version lives in **[`FUTURE_DESIGN_CONSIDERATIONS.md`](./FUTURE_DESIGN_CONSIDERATIONS.md)**.
In brief, planned/optional improvements:
- **SES for Cognito emails** (reliable invites)
- **Terraform + DynamoDB** alternative path (and the data-layer migration for HA)
- **Midway / corporate SSO** federation (true employee login)
- **Publicly-trusted certificate** on a real domain (removes browser warning)
- **Swappable / cheaper Bedrock models** (cost control)
- **VPC endpoints** (drop NAT), **autoscaling**, **CI/CD**, **tighter IAM**

See that document for *what specifically changes* in the current implementation to enable each.

---

## 15. v3.0 Infrastructure Additions (2026-10-07)

This section records the infrastructure changes added in the v3.0 release. They are additive — the topology in §3 still holds, with the additions below.

### 15.1 New: private documents + audit S3 bucket

A new **private S3 bucket** `complianceiq-nonprod-documents-192425633190` was added to the CDK application stack (`infra/cdk/lib/complianceiq-stack.ts`):

- **Encryption:** SSE-S3 (AES-256) at rest.
- **Public access:** Block Public Access = ON (all four settings).
- **Transport:** TLS-only (bucket policy denies non-HTTPS requests, `aws:SecureTransport=false`).
- **Versioning:** ON (recoverable overwrites/deletes).
- **Removal policy:** `RETAIN` (documents survive stack deletion; delete manually if decommissioning).
- **Contents:** uploaded regulation documents under `<region>/regulations/<regulationId>/…` and the audit log under `<region>/audit-logs/audit-log.jsonl`.
- **Access:** the **ECS task IAM role** is granted `grantReadWrite` on the bucket (covers Get/Put/Delete/List and the `audit-logs/` prefix). Reads/writes are proxied by the app — the bucket is never public.
- **Wiring:** the bucket name is passed to the container as the `DOCUMENTS_BUCKET` environment variable; the app's `documentStore.ts` / `auditStore.ts` use it. If unset (local dev) the app falls back to local disk.

Updated topology (addition to the PRIVATE/task tier):

```
   Task Role ──► S3 (complianceiq-nonprod-documents-<account>)   [NEW]
        • PutObject/GetObject/DeleteObject/ListBucket (private, SSE)
        • documents:  <region>/regulations/<id>/<docId>.<ext>
        • audit log:  <region>/audit-logs/audit-log.jsonl
   env: + DOCUMENTS_BUCKET=complianceiq-nonprod-documents-<account>   [NEW]
```

### 15.2 Changed: ALB Cognito session timeout = 24h

The HTTPS listener's `authenticate-cognito` default action now sets **`SessionTimeout = 86400` seconds (24h)**. Previously it used the ALB default (7 days). The ALB now forces Cognito re-authentication (with MFA) at least once per day.

Generated CloudFormation (`AWS::ElasticLoadBalancingV2::Listener` → `DefaultActions[0].AuthenticateCognitoConfig`):

```yaml
AuthenticateCognitoConfig:
  SessionTimeout: "86400"      # 24 hours
  UserPoolArn: !GetAtt UserPool.Arn
  UserPoolClientId: !Ref UserPoolAlbClient
  UserPoolDomain: !Ref UserPoolDomain
Type: authenticate-cognito
```

### 15.3 Changed: new runtime data on EFS

The EFS data volume (`/app/data`, `data/regions/<REGION>/`) now also holds the v3.0 server-authoritative state, seeded on first run and git-ignored:
`users.json` (bcrypt hashes), `link-suggestions.json`, `regulation-suggestions.json`, `countries.json`, `feature-flags.json`, `broadcast.json`. These are backed up with the rest of EFS via AWS Backup. The audit log and documents live in S3 (§15.1), not EFS.

### 15.4 Dependency

**bcryptjs** (pure-JavaScript bcrypt) was added to the application dependencies. It requires no native compilation, so the `node:20-alpine` multi-stage image builds unchanged.

### 15.5 Deploy procedure (unchanged shape)

The v3.0 changes deploy with the same flow as before:

```bash
# 1. infra (creates the S3 bucket + 24h Cognito timeout)
cd infra/cdk && npm install && npm run build
npx cdk deploy -c envName=nonprod -c imageUri=$IMAGE_URI \
  -c internalDomainName=complianceiq.internal -c bedrockModelId=amazon.nova-pro-v1:0 \
  -c certificateArn=<ACM-ARN>
cd ../..
# 2. image (installs bcryptjs in-container) + 3. roll the service
finch build --platform linux/amd64 -t $IMAGE_URI . && finch push $IMAGE_URI
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region us-east-1
```

### 15.6 Other editions

- **AWS External** (`ComplianceIQ-AWS-External`): identical infra to this non-prod stack (S3 bucket, Cognito 24h, EFS data).
- **Gemini** (`ComplianceIQ-Gemini`): documents + audit log use **Cloudflare R2** (S3-compatible) via `R2_ENDPOINT` / `R2_BUCKET` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`; region/app data uses the deployment's local disk/volume. No AWS S3 or EFS.
