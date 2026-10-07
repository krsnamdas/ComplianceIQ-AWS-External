# ComplianceIQ: Enterprise Architecture, Operational Manuals & Kiro (AWS) Migration Blueprint

**Document Version:** 2.4.0  
**Target Environment:** Enterprise Production & Local Kiro IDE (AWS Bedrock)  
**Jurisdictional Scope:** 24 MENAT Sovereign Jurisdictions & Global GRC Crosswalks  
**Classification:** Internal Technical Architecture & User/Admin Operational Dossier  

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Detailed Implementation Plan](#2-detailed-implementation-plan)
   - 2.1 Architectural Topology
   - 2.2 Core Data Models & Schema Design
   - 2.3 Crosswalk Alignment & LOE Comparator Engine
   - 2.4 Atomic Transactional Timeline Engine
3. [ComplianceIQ User Operational Manual](#3-complianceiq-user-operational-manual)
   - 3.1 Overview & Navigation
   - 3.2 Sovereign Jurisdictions & Controls Registry
   - 3.3 Regional Regulatory Digest & Newsfeed
   - 3.4 Regulatory Radar & Category Mapping
   - 3.5 Controls Crosswalk (NIST CSF, ISO 27001, CSA CCM)
   - 3.6 Cross-Regulation Overlap & LOE Comparator
   - 3.7 AI Control Clause Interpreter & Multi-Standard Redlining
   - 3.8 Regulatory Watchlist & Specialized Trackers
   - 3.9 Generating Audit-Ready Compliance Reports (PDF, CSV, JSON)
4. [ComplianceIQ Administrator Operational Manual](#4-complianceiq-administrator-operational-manual)
   - 4.1 Admin Console Gateway & RBAC Governance
   - 4.2 Atomic Regulatory Timeline & Milestone Management
   - 4.3 Regulatory Link Reachability & Web Scraper Audits
   - 4.4 System Feature Flags & Audit Logging Engine
5. [Step-by-Step Migration to Kiro IDE & AWS Bedrock](#5-step-by-step-migration-to-kiro-ide--aws-bedrock)
   - 5.1 Overview of Kiro IDE & AWS Bedrock Architecture
   - 5.2 Step 1: Exporting Codebase to Local Laptop
   - 5.3 Step 2: Configuring AWS IAM & Bedrock Model Access
   - 5.4 Step 3: Installing AWS Bedrock SDK Dependencies
   - 5.5 Step 4: Refactoring AI Endpoints in `server.ts` for AWS Bedrock
   - 5.6 Step 5: Configuring Kiro IDE Workspace Rules (`.kiro/rules.md`)
   - 5.7 Step 6: Local Verification, Copilot Prompting & Production Deployment

---

# 1. Executive Summary & System Architecture

**ComplianceIQ** is an enterprise-grade Governance, Risk, and Compliance (GRC) intelligence platform purpose-built for the **Middle East, North Africa, and Türkiye (MENAT)** region. Covering 24 sovereign nations, the platform synthesizes statutory regulations, mandatory cybersecurity frameworks, data protection decrees, and artificial intelligence governance baselines into a unified regulatory graph.

### Architectural Principles:
1. **Sovereign Specificity**: High-fidelity indexing of regional statutory instruments (e.g., Saudi NCA ECC-1:2018, SDAIA PDPL, UAE DESC ISR v2.0, CBB Operational Cyber, Qatar NIA v2.0, Türkiye KVKK).
2. **Global Crosswalk Interoperability**: Bi-directional mapping of national controls to international baselines: **NIST CSF 2.0**, **ISO/IEC 27001:2022**, and **Cloud Security Alliance (CSA) CCM v4.0.10**.
3. **Atomic State Consistency**: Single-transaction timeline and milestone updates ensuring zero drift between timeline visualizations, Gantt dependency charts, and the audit ledger.
4. **Defense-in-Depth RBAC**: Strict separation of duties between Compliance Analysts (read/filter), Compliance Managers (export/evaluate), Security Auditors (inspect logs/trace crosswalks), and Super Admins (edit mandates, manage timelines, run scrapers).

---

# 2. Detailed Implementation Plan

## 2.1 Architectural Topology

The system is engineered as a high-performance modern web application with a decoupled Node.js API layer:

```
+-----------------------------------------------------------------------+
|                            CLIENT BROWSER                             |
|  React 19 SPA | Tailwind CSS v4 | Lucide Icons | Recharts & D3 Graph  |
+-----------------------------------+-----------------------------------+
                                    | HTTP / REST & SSE Stream
                                    v
+-----------------------------------------------------------------------+
|                         APPLICATION SERVER                            |
|  Node.js / Express API | Middleware Auth / RBAC | SSE Log Streaming  |
+-------------------+-------------------------------+-------------------+
                    |                               |
                    v                               v
+---------------------------------------+   +---------------------------+
|          AI ENGINE SERVICES           |   |   PERSISTENCE & SCHEMAS   |
|  Current: Google GenAI (Gemini 2.5)   |   |   AdminContext State      |
|  Target:  AWS Bedrock (Claude 3.5)    |   |   MENAT Regulatory DB     |
|  Endpoints: Redline, Clause, Chat     |   |   Audit Transaction Log   |
+---------------------------------------+   +---------------------------+
```

### Tech Stack Details:
* **Frontend Runtime**: React 19.0.1, TypeScript 5.8+, Vite 6/8.
* **Component Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), custom enterprise dark slate theme (`#0f172a`, `#1e293b`).
* **Visualizations**: D3.js v7 (force-directed regulatory network graph), Recharts (maturity bar charts, radar plots, deadline distribution), Motion (smooth modal & tab animations).
* **Document Engine**: jsPDF v4.2 & jsPDF-AutoTable v5.0 for client-side cryptographic-grade compliance dossiers.
* **Backend Runtime**: Node.js with Express v4.21, `tsx` for TypeScript execution, Server-Sent Events (SSE) for scraper real-time telemetry.

## 2.2 Core Data Models & Schema Design

### Regulation Entity (`src/types/regulatory.ts`)
```typescript
export interface Regulation {
  id: string;                         // Unique slug (e.g., 'ksa-ecc-1')
  countryId: string;                  // ISO alpha-2/slug (e.g., 'saudi-arabia')
  name: string;                       // Statutory name in English
  localName?: string;                 // Official Arabic / Turkish / French name
  code: string;                       // Official reference (e.g., 'NCA ECC-1:2018')
  authority: string;                  // Regulatory body (e.g., 'NCA', 'DESC', 'CBB')
  authorityArabic?: string;           // Local authority representation
  category: RegulatoryCategory;       // Cybersecurity, Data Privacy, AI, Cloud, Banking
  status: 'In Force' | 'Draft' | 'Upcoming' | 'Superseded';
  effectiveDate: string;              // ISO Date (YYYY-MM-DD)
  deadline?: string;                  // Enforcement date or transition deadline
  penaltyMax?: string;                // Maximum statutory penalty
  sampleControls: RegulatoryControl[];// Indexed control clauses
  changeLog?: RegulatoryVersionDiff[];// Full historic version tree
  mandateType?: 'Mandatory' | 'Guideline' | 'Sectoral';
}
```

### Regulatory Control Clause
```typescript
export interface RegulatoryControl {
  id: string;                         // e.g., 'ECC-1-1-1'
  domainNumber: string;               // e.g., '1'
  domainName: string;                 // e.g., 'Cybersecurity Governance'
  subDomain: string;                  // e.g., 'Strategy & Policy'
  code: string;                       // Clause code (e.g., '1-1-1')
  title: string;                      // Operational control title
  description: string;                // Full statutory requirement text
  mandatoryLevel: 'Mandatory' | 'Recommended' | 'Sector-Specific';
  applicableSectors: string[];        // Banking, Energy, Healthcare, Gov, All
  nistCsfMapping?: string;            // e.g., 'GV.OC-01, GV.PO-01'
  iso27001Mapping?: string;           // e.g., 'A.5.1, A.5.2'
  csaCcmMapping?: string;             // e.g., 'GRM-01, CCC-02'
  officialUrl?: string;               // Link to sovereign legal gazette
}
```

## 2.3 Crosswalk Alignment & LOE Comparator Engine
ComplianceIQ implements an automated **Level of Effort (LOE) Calculator** based on Jaccard similarity and crosswalk density across controls:
* **High Overlap (>75% mutual mapping)**: Identical requirements (e.g., Annual Third-Party Penetration Testing across NCA ECC and UAE DESC). Saves up to 80% audit effort.
* **Medium Overlap (40%-74%)**: Aligned conceptual intent with varying sovereign implementation parameters (e.g., Incident Notification window: 2 hours vs. 72 hours).
* **Low Overlap (<40%)**: Sovereign-specific mandate requiring standalone local implementation (e.g., Saudi in-country data residency requirements under PDPL & CITC).

## 2.4 Atomic Transactional Timeline Engine
Located in `src/context/AdminContext.tsx`, this engine manages batch updates to deadlines and statuses across the platform:
1. **Staging Cache**: Pending edits are queued in `pendingMilestoneEdits`.
2. **Transactional Commit**: When the Administrator clicks **Apply Changes**, `commitMilestoneEdits()` runs a single atomic dispatch.
3. **Propagated Surfaces**:
   - `RegulatoryTimeline.tsx` (Interactive milestone track)
   - `RegulatoryRoadmap.tsx` (Gantt Chart & statutory dependencies)
   - `RegulationCard.tsx` (Detail modal & badge indicators)
   - `menatData.ts` in-memory state & localStorage audit ledger.
4. **Rollback & Audit Trail**: Every atomic batch produces a structured `AUDIT_MILESTONE_BATCH` log containing the timestamp, administrator identity, previous values, and newly applied values.

---

# 3. ComplianceIQ User Operational Manual

This manual provides compliance officers, risk analysts, and legal counsel with step-by-step instructions for daily operations.

## 3.1 Overview & Navigation
1. Launch the platform at the designated URL.
2. The **Top Navigation Bar** provides quick access to all 16 modules categorized into four clusters:
   - **Intelligence & Repositories**: Overview, Regional Digest, Regulations, Controls Crosswalk.
   - **Comparative & Analytics**: Regulation Comparator, Maturity Heatmap, Sector Matrix, Regulatory Radar.
   - **Planning & Timeline**: Sovereign Roadmap (Gantt), Regulatory Milestones, Version Diffs.
   - **AI Governance & Redlining**: AI Redline Assistant, Clause Interpreter, AI Copilot.
3. The **Global Search Bar** in the header allows searching by regulation code (`ECC-1`), sovereign authority (`SDAIA`), or domain topic (`Data Privacy`).

## 3.2 Sovereign Jurisdictions & Controls Registry (Overview Tab)
* **Selecting a Country**: Click on any of the 24 sovereign flags (e.g., Saudi Arabia, UAE, Qatar, Egypt, Türkiye) to filter regulations applicable to that jurisdiction.
* **Viewing Regulation Cards**: Each card displays the statutory code, authority, enforcement status, category, effective date, and primary penalties.
* **Inspecting Controls**: Click **View Controls** on any card to open the complete control breakdown containing domain hierarchies and international mappings.

## 3.3 Regional Regulatory Digest & Newsfeed (Digest Tab)
* Real-time automated regulatory feed tracking updates across official gazettes and supervisory portals.
* Filter updates by **Country**, **Category**, or **Severity Impact** (Critical, High, Medium, Informational).
* Click **Source Link** to inspect the sovereign authority's official bulletin or gazette entry.

## 3.4 Regulatory Radar & Category Mapping (Radar Tab)
* A high-level visual representation of regulatory maturity across six strategic pillars: Cybersecurity, Data Privacy, Cloud Governance, AI & Emerging Tech, FinTech & Banking, and Critical Infrastructure.
* Hover over any jurisdiction to compare its relative regulatory stringency index.

## 3.5 Controls Crosswalk (Controls Tab)
* Connects regional requirements directly to **NIST CSF 2.0**, **ISO/IEC 27001:2022**, and **CSA CCM v4.0.10**.
* **Use Case**: If your enterprise is ISO 27001 certified, enter your certified controls (e.g., `A.5.15 Access Control`) to automatically view all corresponding mandatory MENAT clauses satisfying that requirement.
* Click **Export Matrix** to download the crosswalk spreadsheet.

## 3.6 Cross-Regulation Overlap & LOE Comparator (Compare Tab)
* **Step 1**: Select **Primary Regulation** (e.g., Saudi NCA ECC-1:2018).
* **Step 2**: Select **Comparison Regulation** (e.g., UAE DESC Information Security Regulation ISR v2.0).
* **Step 3**: Click **Analyze Overlap**.
* **Reviewing Outputs**:
  * **Mutual Compliance Ratio**: The percentage of overlapping control domains.
  * **Net Implementation LOE**: Estimated man-days saved through reciprocal controls.
  * **Gap Delta**: Standalone clauses unique to each jurisdiction requiring dedicated remediation.

## 3.7 AI Control Clause Interpreter & Multi-Standard Redlining
* **AI Clause Interpreter (`/interpreter`)**:
  * Select any clause from the MENAT repository.
  * Click **Interpret Clause** to generate an operational checklist, evidence requirements for auditors, and common compliance pitfalls.
* **AI Multi-Standard Redlining (`/ai_redline`)**:
  * Paste your enterprise internal policy text (e.g., your corporate Data Retention Policy).
  * Select the target regulations (e.g., Saudi PDPL + UAE Federal Decree-Law No. 45/2021).
  * Click **Run Policy Audit & Redlining**.
  * The AI engine highlights missing mandatory disclosures, identifies non-compliant retention clauses, and provides ready-to-adopt redline draft edits.

## 3.8 Regulatory Watchlist & Specialized Trackers (Watchlist Tab)
* Pin key regulations to your personal watchlist by clicking the **Pin / Bookmark** icon on any regulation card.
* Set alert preferences for:
  * Deadline reminders (30, 60, 90 days out).
  * Regulatory amendments and draft-to-enforcement transitions.
  * Sovereign authority notices.

## 3.9 Generating Audit-Ready Compliance Reports (Export Modal)
* Click the **Export / Download** button in the navigation header.
* **Choose Export Type**:
  * **PDF Compliance Report**: Comprehensive audit dossier including executive summary, jurisdictional breakdown, full control clauses, and NIST/ISO crosswalks.
  * **CSV Spreadsheet**: Flat tabular format ready for Microsoft Excel, PowerBI, or corporate GRC tools (ServiceNow, MetricStream).
  * **JSON API Export**: Structured JSON payload for SIEM ingestion and automated compliance pipelines.
* Choose target regulations or select **All 24 Nations Bulk Preset**.
* Click **Download Dossier**.

---

# 4. ComplianceIQ Administrator Operational Manual

This manual provides Super Administrators and System Administrators with operational instructions for configuration, batch timeline management, and audit verification.

## 4.1 Admin Console Gateway & RBAC Governance
* Navigate to the **Admin Console** tab (available to users with the Super Admin role).
* **Role Switcher**: Use the RBAC switcher in the top right to test views as:
  * `super_admin`: Full read/write, timeline modification, scraper execution, audit log clearance.
  * `compliance_manager`: Read, policy redlining, PDF/CSV report exports, watchlist management.
  * `security_auditor`: Read-only access to all modules, full access to audit trails.
  * `compliance_analyst`: Restricted view-only mode (export and admin features disabled).

## 4.2 Atomic Regulatory Timeline & Milestone Management
ComplianceIQ features a transactional update engine for regulatory deadlines:
1. In the **Admin Console**, select the **Timeline & Milestones Manager** tab.
2. Select any regulation to modify:
   - Change **Effective Date** or **Statutory Deadline**.
   - Change **Enforcement Status** (Draft, In Force, Upcoming, Superseded).
   - Add a **Revision Note** explaining the regulatory circular or gazette decree justifying the change.
3. Observe the **Pending Changes Staging Bar**:
   - Multiple modifications across different regulations can be queued simultaneously.
   - Pending changes are displayed with an amber indicator showing old vs. new values.
4. Click **Apply Changes (Commit Batch)**:
   - Executes an atomic state update.
   - Updates both the interactive Milestone Timeline and the Gantt Roadmap instantaneously.
   - Generates an immutable entry in the System Audit Log.
5. **Rollback**: If a date was entered incorrectly, navigate to **Audit Log**, locate the transaction ID, and click **Rollback Batch**.

## 4.3 Regulatory Link Reachability & Web Scraper Audits
Official sovereign websites across MENAT periodically change URLs or migrate to new e-government portals.
* **Running the Reachability Checker**:
  ```bash
  npm run check-links
  ```
  This automated script tests all statutory gazette URLs across 24 countries, outputting HTTP status codes, latency, and identifying broken links (404/500).
* **Live Scraper Simulation**:
  - In the Admin Console, navigate to **Tracked Sources**.
  - Click **Trigger Scraper Run** to simulate web crawling of sovereign portals (e.g., Saudi NCA, UAE TDRA, Qatar CRA).
  - Inspect the real-time Server-Sent Events (SSE) telemetry feed for crawl status, new circular detections, and response latency.

## 4.4 System Feature Flags & Audit Logging Engine
* Under **System Configuration & Feature Flags**:
  * `enableAiAssistant`: Toggle the AI Chatbot and Copilot across the entire application.
  * `enableExternalScrapers`: Enable/disable background scraper jobs.
  * `strictRbacEnforcement`: When enabled, locks non-admins from sensitive export modules.
  * `systemReadOnlyMode`: Instantly puts the entire portal into maintenance read-only mode.

---

# 5. Step-by-Step Migration to Kiro IDE & AWS Bedrock

This section provides comprehensive instructions for migrating ComplianceIQ from its current environment to your laptop using **Kiro IDE** and transitioning all AI functionalities to **AWS Bedrock**.

## 5.1 Overview of Kiro IDE & AWS Bedrock Architecture
* **Kiro IDE** is an AI-native integrated development environment powered by AWS intelligence and Amazon Q Developer.
* In the AI Studio environment, the backend uses Google's `@google/genai` library with Gemini models.
* For your Kiro / AWS deployment, we migrate the backend to use **AWS Bedrock Runtime SDK** (`@aws-sdk/client-bedrock-runtime`), giving you access to **Anthropic Claude 3.5 Sonnet** (or Amazon Titan) hosted on AWS.

```
                      +---------------------------------------+
                      |         KIRO IDE ON LAPTOP            |
                      |  Codebase Editor | AI Copilot Chat    |
                      |  Context Rules: .kiro/rules.md        |
                      +-------------------+-------------------+
                                          |
                                          v
+-----------------------------+      +----+----------------------------------+
|      REACT 19 FRONTEND      | <--> |          EXPRESS BACKEND              |
|  Runs on http://localhost   |      |  server.ts on http://localhost:3000   |
+-----------------------------+      +-------------------+-------------------+
                                                         |
                                                         v  (AWS SDK v3 Bedrock)
                                     +-------------------+-------------------+
                                     |           AWS CLOUD (BEDROCK)         |
                                     |  Model: Claude 3.5 Sonnet v2          |
                                     |  Model ID: anthropic.claude-3-5-sonnet|
                                     +---------------------------------------+
```

---

## 5.2 Step 1: Exporting Codebase to Local Laptop
1. Download or clone your ComplianceIQ project directory onto your laptop.
2. Open **Kiro IDE**.
3. In Kiro, select **File > Open Folder...** and select the project root folder.
4. Open the integrated terminal in Kiro (`Ctrl + \`` or `Cmd + \``).
5. Ensure Node.js (v18.0.0 or v20.x+) is installed:
   ```bash
   node -v
   npm -v
   ```

---

## 5.3 Step 2: Configuring AWS IAM & Bedrock Model Access
To run AI requests through AWS Bedrock, you require an AWS IAM User or Role with Bedrock permissions:

1. **Log in to AWS Management Console**.
2. Navigate to **Amazon Bedrock > Model access**:
   - Verify that **Anthropic Claude 3.5 Sonnet** (or Claude 3 Haiku / Amazon Titan) status is **Access Granted**.
   - If not enabled, click **Modify model access**, check the box for Claude 3.5 Sonnet, and click **Request model access** (approval is typically instantaneous).
3. Navigate to **IAM > Users > Create User** (e.g., `kiro-complianceiq-dev`):
   - Attach policy directly: `AmazonBedrockFullAccess` (or create a least-privilege policy allowing `bedrock:InvokeModel`).
   - Create an **Access Key ID** and **Secret Access Key**.
4. Configure AWS credentials on your laptop:
   - **Option A (AWS CLI)**:
     ```bash
     aws configure
     # AWS Access Key ID [None]: YOUR_AWS_ACCESS_KEY_ID
     # AWS Secret Access Key [None]: YOUR_AWS_SECRET_ACCESS_KEY
     # Default region name [None]: us-east-1 (or us-west-2, eu-central-1)
     # Default output format [None]: json
     ```
   - **Option B (`.env` file in project root)**:
     Create or update `.env` in the ComplianceIQ root directory:
     ```env
     PORT=3000
     AWS_REGION=us-east-1
     AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
     AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
     BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
     ```

---

## 5.4 Step 3: Installing AWS Bedrock SDK Dependencies
In the Kiro terminal, install the official AWS Bedrock client:

```bash
npm install @aws-sdk/client-bedrock-runtime
```

*(Optional: If you no longer need `@google/genai`, you can remove it via `npm uninstall @google/genai`)*.

---

## 5.5 Step 4: Refactoring AI Endpoints in `server.ts` for AWS Bedrock

Replace the AI integration code in `server.ts` with the following AWS Bedrock client implementation. This connects all AI endpoints (`/api/ai/redline`, `/api/ai/interpret`, `/api/ai/chat`) directly to Claude 3.5 Sonnet on AWS Bedrock:

```typescript
// ============================================================================
// AWS Bedrock AI Integration for ComplianceIQ (Kiro IDE / AWS Migration)
// ============================================================================
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize the Bedrock Client with region and credentials from environment
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Uses default AWS credential provider chain if undefined
});

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";

/**
 * Helper to invoke Anthropic Claude 3.5 Sonnet on AWS Bedrock
 */
async function invokeClaudeOnBedrock(systemPrompt: string, userPrompt: string, maxTokens = 4096): Promise<string> {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.2,
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  if (responseBody.content && responseBody.content.length > 0) {
    return responseBody.content[0].text;
  }
  return "";
}

// ----------------------------------------------------------------------------
// 1. Policy Redlining Endpoint (/api/ai/redline)
// ----------------------------------------------------------------------------
app.post("/api/ai/redline", async (req, res) => {
  try {
    const { policyText, targetRegulations, complianceGoal } = req.body;
    
    if (!policyText) {
      return res.status(400).json({ error: "policyText is required" });
    }

    const systemPrompt = `You are a Senior Regulatory Counsel specializing in Middle East, North Africa, and Türkiye (MENAT) cybersecurity, privacy, and technology regulations (e.g., Saudi NCA ECC, SDAIA PDPL, UAE DESC ISR, Qatar NIA, Bahrain CBB). Analyze enterprise policy text against statutory mandates. Return a JSON object with:
    1. executiveSummary (string)
    2. complianceScore (number from 0-100)
    3. redlines (array of { clauseTitle, originalExcerpt, issueIdentified, suggestedRedline, severity: 'High'|'Medium'|'Low', regulatoryCitation })
    4. missingMandatoryClauses (array of string)`;

    const userPrompt = `Policy Content to Redline:\n"""${policyText}"""\n\nTarget Regulations: ${targetRegulations?.join(', ') || 'General MENAT Standards'}\nCompliance Goal: ${complianceGoal || 'General Audit Readiness'}\n\nRespond ONLY with valid JSON.`;

    const rawResponse = await invokeClaudeOnBedrock(systemPrompt, userPrompt);
    
    // Clean JSON response
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return res.json(parsed);
  } catch (error: any) {
    console.error("Bedrock Redlining Error:", error);
    return res.status(500).json({ error: "Failed to perform AI policy redline via AWS Bedrock", details: error.message });
  }
});

// ----------------------------------------------------------------------------
// 2. Control Clause Interpreter Endpoint (/api/ai/interpret)
// ----------------------------------------------------------------------------
app.post("/api/ai/interpret", async (req, res) => {
  try {
    const { controlCode, controlTitle, controlDescription, regulationName, authority } = req.body;

    const systemPrompt = `You are an expert IT auditor specializing in MENAT regulatory frameworks. Interpret the following statutory requirement and return a structured JSON response with:
    1. plainEnglishExplanation (string)
    2. auditVerificationSteps (array of strings)
    3. requiredArtifacts (array of strings)
    4. commonImplementationPitfalls (array of strings)
    5. recommendedNistMapping (string)`;

    const userPrompt = `Regulation: ${regulationName} (${authority})\nControl: [${controlCode}] ${controlTitle}\nRequirement: ${controlDescription}\n\nRespond ONLY with valid JSON.`;

    const rawResponse = await invokeClaudeOnBedrock(systemPrompt, userPrompt);
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return res.json(parsed);
  } catch (error: any) {
    console.error("Bedrock Interpreter Error:", error);
    return res.status(500).json({ error: "Failed to interpret clause via AWS Bedrock", details: error.message });
  }
});

// ----------------------------------------------------------------------------
// 3. AI Compliance Copilot Chat Endpoint (/api/ai/chat)
// ----------------------------------------------------------------------------
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    const systemPrompt = `You are ComplianceIQ Copilot, an enterprise AI assistant for sovereign Middle East, North Africa, and Türkiye (MENAT) compliance. You provide accurate statutory citations, penalty thresholds, and NIST/ISO crosswalk advice. Keep answers structured, professional, and precise.`;

    const historyFormatted = conversationHistory ? conversationHistory.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n') : '';
    const userPrompt = `${historyFormatted ? `Conversation History:\n${historyFormatted}\n\n` : ''}User Question: ${message}`;

    const textResponse = await invokeClaudeOnBedrock(systemPrompt, userPrompt, 2048);
    return res.json({ reply: textResponse });
  } catch (error: any) {
    console.error("Bedrock Chat Error:", error);
    return res.status(500).json({ error: "Failed to generate AI response via AWS Bedrock", details: error.message });
  }
});
```

---

## 5.6 Step 5: Configuring Kiro IDE Workspace Rules (`.kiro/rules.md`)

Kiro IDE uses a `.kiro` workspace directory to give Kiro's AI Copilot complete domain context regarding your project.

Create a file named `.kiro/rules.md` in the project root:

```markdown
# Kiro AI Copilot Guidelines: ComplianceIQ

You are Kiro AI Copilot working inside the **ComplianceIQ** codebase.

## System Architecture
- **Frontend**: React 19 SPA, Tailwind CSS v4, Lucide React, Recharts & D3 graphs.
- **Backend**: Express on Node.js running via `server.ts` with `tsx`.
- **AI Infrastructure**: AWS Bedrock SDK (`@aws-sdk/client-bedrock-runtime`) using Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`).

## Jurisdictional Domain
- Scope: 24 Sovereign Nations in the MENAT region (KSA, UAE, Qatar, Bahrain, Kuwait, Oman, Egypt, Türkiye, Jordan, etc.).
- Statutory Regulators: NCA, SDAIA, DESC, CBB, NBE, CRA, KVKK.
- Global Framework Crosswalks: NIST CSF 2.0, ISO/IEC 27001:2022, CSA CCM v4.0.10.

## Coding Standards
1. **TypeScript**: Strict type definitions in `src/types/regulatory.ts`. Never use `any` when a known interface exists.
2. **Atomic Consistency**: Any update to regulatory dates or statuses must use the batch transaction pattern in `AdminContext.tsx`.
3. **Styling**: Tailwind utility classes only. Maintain dark slate theme (`bg-slate-900`, `border-slate-800`, `text-cyan-400`, `text-emerald-400`).
4. **Error Handling**: Always wrap Bedrock calls with comprehensive try/catch blocks and clear user-facing error messages.
```

---

## 5.7 Step 6: Local Verification, Copilot Prompting & Production Deployment

### 1. Launching Locally in Kiro IDE:
Run the development server inside Kiro's integrated terminal:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

### 2. Verifying Bedrock Integration:
* Open the **AI Redlining** tab (`/ai_redline`).
* Paste sample text and click **Run Policy Audit**.
* Check the Kiro terminal: You should see the AWS Bedrock command executing cleanly with Claude 3.5 Sonnet returning structured JSON.

### 3. Using Kiro's AI Copilot to Continue Development:
Now you can press `Cmd + L` (or `Ctrl + L`) in Kiro to chat with Kiro's AI Copilot:
* *"Kiro, add a new regulation for Oman's Data Protection Law to `menatData.ts` with 5 sample controls and ISO 27001 mappings."*
* *"Kiro, generate an AWS Bedrock streaming response endpoint using `InvokeModelWithResponseStreamCommand` in `server.ts`."*
* *"Kiro, add an automated email digest exporter in `ExportModal.tsx`."*

### 4. Deploying to AWS Production:
When ready to deploy your application to AWS:
* **Containerize**: Use a standard Dockerfile with multi-stage build (`node:20-alpine`).
* **Deploy to AWS App Runner or AWS ECS Fargate**:
  - Store container image in **Amazon ECR**.
  - Assign an IAM Task Role with `bedrock:InvokeModel` permissions.
  - Zero server management, auto-scaling, and secure native access to AWS Bedrock without storing static API keys.

---

### Verification Summary
* **Task 1**: Complete implementation plan, technical architecture, and dual user/admin operational manuals documented above.
* **Task 2**: End-to-end guidance for porting to Kiro IDE, configuring AWS IAM, swapping the AI engine to AWS Bedrock (Claude 3.5 Sonnet), setting up `.kiro/rules.md`, and continuing development with Kiro AI Copilot.

---

# 6. v3.0 Addendum — Documents, Multi-Admin Sync, Hardened Auth & Editions

**Version:** 3.0 · **Date:** 2026-10-07 · This addendum supersedes the §2.1 topology diagram above and documents the subsystems added since v2.x. See also `ComplianceIQ_System_Architecture_Diagram_v3.0.md` for the Mermaid rendering.

## 6.1 Updated architectural topology

```
                 Internet (public testers)
                          |
                          v
   +--------------------------------------------------------------+
   |  Application Load Balancer (public, HTTPS :443)              |   AWS editions
   |  authenticate-cognito  ->  Cognito User Pool (login + MFA)   |   only
   |  SessionTimeout = 86400s (24h)  ->  forward to app           |
   +--------------------------------+-----------------------------+
                                    v
   +--------------------------------------------------------------+
   |                 CLIENT BROWSER — React 19 SPA                |
   |  App.tsx (effectiveFeatureFlags gating)                      |
   |  RegulationCard + RegulationDocuments (download all/upload)  |
   |  Account menu: login / logout / change-password             |
   |  AdminContext = server-authoritative + refreshAdminData()   |
   +--------------------------------+-----------------------------+
                                    | HTTP / REST
                                    v
   +--------------------------------------------------------------+
   |                 APPLICATION SERVER — Express                 |
   |  /auth/* (bcrypt)  /users/*  /documents/*  /audit-logs/*     |
   |  /link-suggestions /regulation-suggestions /broadcast        |
   |  /feature-flags /countries  /regulations /ai/* ...           |
   |  userStore (bcrypt) · auditStore (CSV) · documentStore       |
   |  regionLoader (atomic JSON)                                  |
   +----------------+----------------------------+----------------+
                    |                            |
                    v                            v
   +-------------------------------+   +----------------------------+
   |  AI ENGINE                    |   |  PRIVATE OBJECT STORAGE    |
   |  AWS Bedrock (Nova/Claude)    |   |  encrypted at rest (SSE)   |
   |  OR Google Gemini (Gemini ed) |   |  S3 (AWS) / R2 (Gemini)    |
   |  Tavily web search            |   |  documents + audit-logs/   |
   +-------------------------------+   +----------------------------+
                    |
                    v
   +--------------------------------------------------------------+
   |  REGION DATA — data/regions/<REGION>/  (EFS on AWS / disk)   |
   |  regulations · users(bcrypt) · suggestions · countries ·     |
   |  feature-flags · broadcast · timeline · roadmap · maturity   |
   +--------------------------------------------------------------+
```

## 6.2 Authentication & user model (server-side, bcrypt)

- **Login** is verified server-side at `POST /api/auth/login` using **bcrypt** (cost 12). The password hash is stored only in `users.json` and never transmitted to the client. On success the server returns the public user profile (no hash).
- **User MACDs** go through server endpoints: `POST /api/users` (create, hashes the initial password), `PUT /api/users/:id` (non-secret fields only), `DELETE /api/users/:id`, `POST /api/users/:id/reset-password` (admin reset), `POST /api/auth/change-password` (self-service, verifies current password).
- The **admin console second-gate** password is retained and separate from the per-user login.
- **No plaintext** passwords are stored, displayed, or logged anywhere. The UI shows "bcrypt-hashed" in place of any password field.
- The user roster is **seeded on first run** (`initUsers()`) with the default accounts, so a fresh deployment is immediately usable; thereafter the roster is admin-managed and persists on the data volume.

## 6.3 Server-authoritative data (no browser dependency)

All admin-mutable domains are owned by the server (region JSON via `regionLoader`) and synchronized across every admin/device. `AdminContext` fetches them on load and via `refreshAdminData()` (admin-panel open + Refresh button); `localStorage` is only an offline cache and per-browser session state.

| Domain | Endpoint(s) | File |
|--------|-------------|------|
| Users | `/api/users`, `/api/auth/*` | `users.json` |
| Link suggestions | `GET/PUT /api/link-suggestions` | `link-suggestions.json` |
| Field suggestions | `GET/PUT /api/regulation-suggestions` | `regulation-suggestions.json` |
| Broadcast banner | `GET/PUT /api/broadcast` | `broadcast.json` |
| Feature flags | `GET/PUT /api/feature-flags` | `feature-flags.json` |
| Countries | `GET/POST/PUT/DELETE /api/countries` | `countries.json` |
| Regulations/timeline/etc. | existing `/api/*` | respective JSON |

This closes all prior "split-brain" gaps where a change by one admin was invisible to another. The only intentionally per-browser state is the login session itself.

## 6.4 Feature-toggle semantics

Gating uses an admin-aware derived object, **`effectiveFeatureFlags`**: for admins every flag reads enabled (admins always have full access); for normal users the real flags apply. The admin **Feature Toggles** tab edits the true `featureFlags` state (file-backed, shared). This means disabling a feature restricts normal users while leaving admins unaffected.

## 6.5 Document management

- Endpoints: `GET /api/regulations/:id/documents` (list, all users), `POST /api/regulations/:id/documents` (upload, admin), `GET /api/documents/:id/download` (download, all users), `DELETE /api/documents/:id` (admin).
- Storage (`documentStore.ts`): **S3** on AWS editions (`DOCUMENTS_BUCKET`), **Cloudflare R2** on the Gemini edition (`R2_*` vars, S3-compatible API), **local disk** fallback in dev. Bucket is private, encrypted at rest, Block Public Access on; downloads are proxied by the app.
- Limits: 5 MB/file, 10 files/regulation; types pdf/doc/docx/xls/xlsx/csv/txt/ppt/pptx.

## 6.6 Audit log (encrypted object storage)

- `auditStore.ts` appends each event to `<region>/audit-logs/audit-log.jsonl` in the private bucket (encrypted at rest).
- `POST /api/audit-logs` (fire-and-forget append), `GET /api/audit-logs` (shared on-screen view), `GET /api/audit-logs/download` (readable CSV).
- The admin Audit Log tab reads the shared server log (all admins' actions) and offers a CSV download + Refresh.

## 6.7 Infrastructure (CDK) changes

- New **private S3 documents bucket** (`complianceiq-<env>-documents-<account>`): SSE (AES-256), Block Public Access on, TLS-only (deny non-HTTPS), versioned, `RETAIN` on stack delete. Task IAM role granted read/write (covers the `audit-logs/` prefix too). `DOCUMENTS_BUCKET` env var passed to the container.
- **ALB Cognito `SessionTimeout` = 24h** on the HTTPS listener's `authenticate-cognito` action (CloudFormation `AuthenticateCognitoConfig.SessionTimeout = "86400"`).
- Dependency added: **bcryptjs** (pure-JS, no native build — safe in the Alpine container).

## 6.8 Deployment editions

| Aspect | AWS normal | AWS External | Gemini |
|--------|-----------|--------------|--------|
| AI | Bedrock | Bedrock | Google Gemini |
| Doc/audit storage | S3 (SSE) | S3 (SSE) | Cloudflare R2 (SSE) |
| Region/app data | EFS | EFS | deployment disk |
| Edge auth | ALB+Cognito+MFA (24h) | ALB+Cognito+MFA (24h) | host-dependent |
| Repo | `ComplianceIQAMZ` | `ComplianceIQ-AWS-External` | `ComplianceIQ-Gemini` |

The shared `src/` application code, bcrypt auth, multi-admin sync, documents, audit, and feature-toggle behavior are identical across all three. Only the AI provider, object-storage backend, and infrastructure differ.
