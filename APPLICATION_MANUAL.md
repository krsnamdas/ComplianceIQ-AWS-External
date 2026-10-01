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
`https://<YOUR_ALB_DNS_OR_DOMAIN>/`

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
| **Cognito (edge gate)** | Access control to even reach the app | Email + password + MFA | AWS Cognito pool `<USER_POOL_ID>` |
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
