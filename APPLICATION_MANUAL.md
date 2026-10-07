# ComplianceIQ — Application Manual

> **Audience:** anyone using or maintaining the *application* (features, screens, accounts,
> APIs, data). For the **AWS infrastructure** that hosts it, see
> **[`infra/INFRASTRUCTURE_MANUAL.md`](./infra/INFRASTRUCTURE_MANUAL.md)**. For the roadmap,
> see **[`infra/FUTURE_DESIGN_CONSIDERATIONS.md`](./infra/FUTURE_DESIGN_CONSIDERATIONS.md)**.
>
> **If reading cold: start at [§1](#1-what-complianceiq-is) and [§3 How to access](#3-how-to-access-the-app).**

---

## Table of contents
1. [What ComplianceIQ is](#1-what-complianceiq-is)
2. [Tech stack](#2-tech-stack)
3. [How to access the app](#3-how-to-access-the-app)
4. [Accounts, logins & roles](#4-accounts-logins--roles)
5. [Feature tour](#5-feature-tour)
6. [AI features & how they work](#6-ai-features--how-they-work)
7. [Admin console](#7-admin-console)
8. [Data model & where data lives](#8-data-model--where-data-lives)
9. [API reference](#9-api-reference)
10. [Running locally (dev)](#10-running-locally-dev)
11. [Jurisdictional & framework coverage](#11-jurisdictional--framework-coverage)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What ComplianceIQ is

ComplianceIQ is an enterprise **Governance, Risk & Compliance (GRC) intelligence platform**
for the **MENAT region** (Middle East, North Africa & Türkiye). It covers **24 sovereign
jurisdictions** and maps national regulations to international frameworks:
**NIST CSF 2.0**, **ISO/IEC 27001:2022**, and **CSA CCM v4.0.10**.

It helps compliance teams understand regulatory requirements, compare jurisdictions, track
regulatory changes, assess maturity, and get AI-assisted interpretation of controls and
policies — focused on the MENAT regulatory landscape.

---

## 2. Tech stack

```
React 19 SPA (Vite + Tailwind CSS v4)
    ↕ HTTP / REST
Express.js server (server.ts, port 3000)
    ↕ AWS SDK v3
AWS Bedrock (amazon.nova-pro-v1:0)   +   Tavily Search API (web search)
```

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, D3.js v7, Motion
- **Backend:** Express 4 on Node.js (served as a bundled `dist/server.mjs` in the container)
- **AI engine:** AWS Bedrock via `@aws-sdk/client-bedrock-runtime`
- **Web search:** Tavily Search API
- **PDF export:** jsPDF + jsPDF-AutoTable
- **Dark slate theme:** `bg-slate-900`, `text-cyan-400`, `text-emerald-400`

---

## 3. How to access the app

**Deployed (AWS non-prod):**
`https://compli-alb16-6eesite0yiky-1926867226.us-east-1.elb.amazonaws.com/`

First-time access flow (there are **two** login layers):
1. **Browser cert warning** — the non-prod cert is self-signed. Click **Advanced → Proceed**.
   *(This is expected; see the infra manual's caveats.)*
2. **Cognito login (with MFA)** — the network-edge gate. Enter your email + password; on first
   login you set a password and **enroll an authenticator app (TOTP)** for MFA.
3. **App login** — ComplianceIQ's own login screen (`ciadmin` / `sasuser*`).

**Who manages Cognito users:** the infra admin (see
[Infrastructure Manual §9](./infra/INFRASTRUCTURE_MANUAL.md#9-authentication-cognito--mfa)).

---

## 4. Accounts, logins & roles

There are **two separate identity systems** — don't confuse them:

| Layer | Who/what | Credentials | Managed where |
|---|---|---|---|
| **Cognito (edge gate)** | Access control to even reach the app | Email + password + MFA | AWS Cognito pool `us-east-1_lykHzDirh` |
| **App login (RBAC)** | In-app roles & permissions | App usernames | Inside the app (`RBACContext`) |

**App accounts:**
- **`ciadmin`** — administrator; full access incl. the Admin console.
- **`sasuser1`, `sasuser2`, `sasuser3`** — standard users.

> App RBAC is enforced via the `useRBAC()` hook / `RBACContext`. The app login currently has
> **no MFA of its own** — the Cognito+MFA gate in front provides the strong authentication.

---

## 5. Feature tour

The SPA (`src/App.tsx`) is tab-routed. Major areas (components in `src/components/`):

- **Country Overview** — per-jurisdiction regulatory snapshot.
- **Regulation Cards / Comparator** — browse regulations; compare across jurisdictions.
- **Controls Crosswalk** — map controls across NIST / ISO 27001 / CSA CCM.
- **Control Interpreter** — deep-dive on a control clause (deterministic engine + Bedrock).
- **AI Redlining** — policy gap analysis against regulatory requirements.
- **Compliance Maturity Heatmap** — maturity by country/sector.
- **Regulatory Radar / Watchlist / News Feed / Roadmap / Timeline** — track upcoming and
  recent regulatory change.
- **Sector Matrix / Trend charts / Impact Horizon** — analytics and visualizations.
- **Regional Regulatory Digest** — curated regional updates.
- **AI Compliance Copilot** — floating chat drawer (web-grounded Q&A).
- **Admin Panel** — see §7.

---

## 6. AI features & how they work

All AI calls go through the server helper **`invokeClaudeOnBedrock(systemPrompt, userPrompt,
maxTokens)`** (name is historical — it supports both Nova and Claude). Web search uses
**`tavilySearch(query, maxResults)`**.

- **Model:** `amazon.nova-pro-v1:0` (set via `BEDROCK_MODEL_ID`). The server auto-detects the
  model family and builds the correct payload — so the model is **swappable** without code
  changes (see Future Considerations #4).
- **Graceful degradation:** AI endpoints fall back to **deterministic engines**
  (`controlInterpreterEngine.ts`, `redlineEngine.ts`) or offline content if Bedrock/Tavily are
  unavailable — so the app stays usable even if an AI dependency is down.
- **Feature flag:** AI features are gated by `featureFlags.aiCopilot` (Admin console).

AI endpoints (see §9): chat, maturity analysis, smart insight, requirement analysis, control
interpretation, policy redlining, grounded news.

---

## 7. Admin console

The Admin Panel (`src/components/AdminPanel/`) is for `ciadmin` and includes tabs:

- **Feature Toggles** — enable/disable features (incl. AI).
- **Regulation Editor** — add/edit/remove regulations.
- **Timeline Manager** — manage regulatory timeline entries.
- **Country Management** — manage jurisdictions.
- **User Management** — app users/roles.
- **Audit Trail** — view audit log entries.
- **Broadcast Banner** — system-wide announcement banner.
- **Link Integrity / Link Suggestions Queue** — validate and curate regulatory source links.
- **Tracked Sources Manager** — manage scraper sources.
- **System Backup** — backup-related admin actions.

> Admin edits persist to the **data store on EFS** (`/app/data`) — see §8. Use the batch
> transaction pattern (`pendingMilestoneEdits` → `commitMilestoneEdits()` in `AdminContext.tsx`)
> for date/status changes.

---

## 8. Data model & where data lives

**At runtime**, data lives on the **EFS volume at `/app/data`** (`DATA_DIR`), so admin edits
survive restarts/redeploys. The image ships a **seed copy** from the repo's `data/` folder.

Primary data files (`data/regions/menat/`):

| File | Contents |
|---|---|
| `regulations.json` | The regulations dataset (`Regulation` objects) |
| `maturity.json` | Compliance maturity heatmap data |
| `timeline.json` | Regulatory timeline entries |
| `roadmap-milestones.json`, `roadmap-quarters.json` | Regulatory roadmap |
| `news-seed.json` | Seed regulatory news |
| `digest-updates.json` | Regional digest updates |
| `scraper-sources.json` | Tracked regulatory source links |
| `region.config.json` | Region configuration (MENAT) |

**Core TypeScript types** (`src/types/`):
- `regulatory.ts` — `Regulation`, `Country`, `RegulatoryControl`, etc.
- `admin.ts` — `FeatureFlags`, `UserProfile`, `AuditLogEntry`.
- `heatmap.ts` — `AIChatMessage`, `HeatmapCellData`, `MaturitySectorId`.

> **No customer/PII data** is stored — only regulatory metadata and internal assessments.
> **Backups:** AWS Backup takes daily EFS snapshots (see infra manual §10).

---

## 9. API reference

All served by `server.ts` on port 3000. Grouped by area.

**Platform / health**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check (ALB uses this) |
| GET | `/api/info` | Platform info |
| GET/PUT | `/api/config` | Region config |
| GET/POST | `/api/features` | Feature flags |

**Core data**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/countries` | List jurisdictions |
| GET/POST | `/api/regulations` | List / create regulations |
| PUT/DELETE | `/api/regulations/:id` | Update / delete a regulation |
| GET | `/api/controls` | Controls (crosswalk data) |
| GET | `/api/maturity/heatmap` | Maturity heatmap data |
| GET/POST/PUT/DELETE | `/api/timeline`[`/:id`] | Timeline CRUD |
| GET/POST/PUT/DELETE | `/api/roadmap`[`/:id`] | Roadmap CRUD |
| GET | `/api/export` | Export (PDF/data) |

**Tracking / sources / digests**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/scraper/status` | Scraper status |
| GET/POST/PUT/DELETE | `/api/scraper/sources`[`/:id`] | Manage tracked sources |
| POST | `/api/scraper/register-regulation` | Register a scraped regulation |
| POST | `/api/scraper/run` | Trigger a scrape run |
| POST | `/api/admin/check-links` | Validate regulatory links |
| GET/POST | `/api/admin/links/audit-status`,`/audit-run` | Link audit |
| GET | `/api/tracker/updates` | Regulatory updates |
| GET/PUT | `/api/digest/updates`[`/:id`] | Regional digest |
| GET | `/api/watchlist/notifications` | Watchlist notifications |

**AI (Bedrock + Tavily)**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/chat` | Multi-turn copilot with web search |
| POST | `/api/ai/maturity-analysis` | Country/sector maturity memo |
| POST | `/api/ai/smart-insight` | 3-bullet sector impact per regulation |
| POST | `/api/ai/analyze-requirements`[`/:regulationId`] | Per-control classification |
| POST | `/api/control/interpret` | Control clause deep-dive |
| POST | `/api/ai/redline` | Policy gap analysis |
| GET/POST | `/api/news/grounded` | Live MENAT regulatory news |

> In production the server also serves the built SPA for all non-API routes (`app.get('*')`).

---

## 10. Running locally (dev)

For development or to click through the UI without going via AWS:
```bash
npm install
npm run dev        # full-stack on http://localhost:3000
```
Requires a local `.env` with `AWS_REGION`, Bedrock access (and `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` for local dev), `BEDROCK_MODEL_ID`, and `TAVILY_API_KEY`.
Build for container: `npm run build` → `dist/` (Vite SPA + esbuild server bundle).

> **Security note:** keep real keys only in local `.env` (git-ignored). The deployed container
> uses an IAM role for Bedrock and Secrets Manager for Tavily — no static keys.

---

## 11. Jurisdictional & framework coverage

**24 MENAT nations:** Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman, Egypt, Türkiye, Jordan,
Lebanon, Iraq, Morocco, Algeria, Tunisia, Libya, Yemen, Syria, Palestine, Sudan, Mauritania,
Djibouti, Somalia, Comoros, Pakistan.

**Key regulators:** NCA, SDAIA, DESC, CBB, QCB, TDRA, KVKK, CBE, TRA.

**Global crosswalks:** NIST CSF 2.0, ISO/IEC 27001:2022, CSA CCM v4.0.10.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser "not private" warning | Self-signed TLS cert (non-prod) | Click Advanced → Proceed; long-term use a real cert (Future Considerations #1) |
| Can't log in at Cognito | No user, or MFA not enrolled | Admin creates/reset the Cognito user (infra manual §9) |
| "redirect not configured" after MFA | ALB callback URL mismatch | Already fixed in IaC; if ALB was replaced, update the callback (infra manual §9) |
| AI chat returns generic/offline answers | Bedrock unavailable or model access | Check Bedrock invoke (infra runbook); app falls back to deterministic engines |
| Live news/search empty | Tavily key missing/expired or rate-limited | Rotate the Tavily secret (infra manual §10) |
| Admin edits lost after redeploy | Writing outside `/app/data` | Ensure `DATA_DIR=/app/data` (it is, in the task def) — data is on EFS |
| App unreachable entirely | ECS task unhealthy | Check target health + logs (infra runbook §13) |

---

*For infrastructure operations, deployment, and AWS service details, see
[`infra/INFRASTRUCTURE_MANUAL.md`](./infra/INFRASTRUCTURE_MANUAL.md).*

## 13. v3.0 Release — Documents, Multi-Admin Sync & Hardened Auth

This section documents the capabilities added in the v3.0 release. They apply to all three editions (AWS normal, AWS External, Gemini), differing only in where files are stored (S3 on AWS, Cloudflare R2 on Gemini).

### 13.1 Regulation documents (upload / download)

Each regulation can carry attached documents (the regulation text, internal RCMs, controls libraries, etc.).

- **All signed-in users** see an **Attached Documents** section on the regulation card and can **download** any document.
- **Only admins** see the **Upload** control (card + the Edit Regulation modal in the admin console). Normal users never see an upload option.
- Each document shows a type badge — **Regulation** or **Internal** — the file name (truncated if long, extension preserved), and a download action.
- **Limits:** max **5 MB per file**, up to **10 documents per regulation**. Allowed types: pdf, doc, docx, xls, xlsx, csv, txt, ppt, pptx.
- **Where files live:** a **private, encrypted** object-storage bucket (Amazon S3 on AWS editions; Cloudflare R2 on the Gemini edition). The bucket is never public — downloads are proxied by the app, so access is implicitly gated by the app login (and Cognito+MFA at the ALB on AWS).

### 13.2 Login & accounts (bcrypt, server-side)

- Login is verified **on the server** against a **bcrypt** password hash. Passwords are never stored in plaintext and the hash never reaches the browser.
- The login screen shows **no example usernames or passwords**. There is **no one-click account switching** — to use a different account, **sign out and sign in** again.
- **Default accounts:** admins `ciadmin1`, `ciadmin2`; normal users `sasuser1`–`sasuser4`. (Passwords are set by an operator and stored only as hashes.)
- **Admin console** still requires its **second password gate** after an admin signs in.
- **Change your own password:** account menu (top-right) → **Change Password**. After a successful change you are **signed out** and must log in again with the new password (the old password stops working immediately).

### 13.3 User management (admin)

- **Create user:** Admin Console → User Management → add a user with an initial password (stored as a bcrypt hash).
- **Reset password:** the **Reset** action sets a brand-new password (no password is ever displayed or copied). The user's old password stops working.
- **Edit / delete / suspend:** standard MACD operations. All user changes are **server-side** and **sync across all admins** (no per-browser divergence).
- Passwords are **never displayed** anywhere in the UI (the user list shows "bcrypt-hashed").

### 13.4 Multi-admin synchronization

All admin-mutable data is **server-authoritative** and shared across every admin and device:

- Users/roster, link suggestions, field-correction suggestions, broadcast banner, feature flags, countries/jurisdictions.
- When one admin accepts/rejects a suggestion (or makes any change), it is resolved for **all** admins — no stale "pending" items and no overrides.
- The admin console **refetches on open** and offers a **Refresh** button for on-demand updates (there is no background polling, so an admin already sitting on a screen clicks Refresh to pull the latest).

### 13.5 Feature toggles

- Feature toggles gate **normal users only**. **Admins always have access to every feature** regardless of toggle state.
- The admin **Feature Toggles** tab still shows and edits the true on/off state; toggle state is server-authoritative and shared across admins (and survives restarts).

### 13.6 Audit log

- Every significant action is recorded to a **shared, server-side audit log** stored in object storage **encrypted at rest**.
- Admin Console → **Audit Log** shows the shared trail (all admins' actions) and offers **Download Audit Log (CSV)** — a readable export of the complete log. A **Refresh** button pulls the latest.

### 13.7 Session timeout (AWS editions)

- The public ALB enforces **Cognito re-authentication (with MFA) at least every 24 hours**. After the session expires you are prompted to sign in again at the Cognito page before reaching the app.
