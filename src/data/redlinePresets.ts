import { DraftPolicyPreset } from '../types/redline';

export const DRAFT_POLICY_PRESETS: DraftPolicyPreset[] = [
  {
    id: 'preset-sdaia-pdpl',
    name: 'Corporate Data Protection & Retention Policy (Deficient Transfer Clauses)',
    targetRegulationId: 'ksa-pdpl',
    targetRegulationName: 'SDAIA PDPL - Personal Data Protection Law (M/19 & M/148)',
    category: 'Data Privacy & Sovereignty',
    description: 'A standard enterprise privacy policy with generic GDPR-style wording that lacks mandatory Saudi SDAIA local registration, SCC approvals, and Article 29 cross-border exceptions.',
    policyDraftText: `POLICY TITLE: GLOBAL ENTERPRISE DATA PROTECTION & CLOUD TRANSFER POLICY
VERSION: 1.4 | CLASSIFICATION: INTERNAL USE ONLY

1. PURPOSE & APPLICABILITY
This policy outlines organizational requirements for processing, storing, and transmitting customer and employee personal data. It applies to all business units, cloud infrastructure environments, and external processors handling data across Middle East operations.

2. DATA SUBJECT CONSENT & NOTIFICATION
2.1 All business units must ensure personal data is collected following explicit consent or where required for legitimate commercial interests.
2.2 Data subjects may withdraw consent at any time via an email request to our customer service desk.
2.3 Privacy notices must be published on public portals describing the categories of data collected.

3. RETENTION & ERASURE OF PERSONAL RECORDS
3.1 Personal data shall not be retained longer than necessary to satisfy commercial and accounting objectives.
3.2 Records shall be reviewed once every three (3) years and securely wiped using commercial disk utilities.
3.3 Backups may retain encrypted snapshots indefinitely for disaster recovery purposes.

4. CROSS-BORDER DATA TRANSFERS & OVERSEAS PROCESSING
4.1 The organization utilizes multi-region hyperscale public clouds with primary data centers located in Western Europe and North America.
4.2 Personnel are permitted to transfer customer records to overseas offshore shared service centers in India and the Philippines for 24/7 technical customer support and log monitoring.
4.3 No additional regulator registration or assessment is conducted prior to overseas transmission, provided the cloud vendor executes standard commercial terms of service.

5. DATA BREACH NOTIFICATION
5.1 Any suspected breach of personal data must be escalated to the internal IT Security Manager within five (5) business days of discovery.
5.2 The executive committee will decide whether notification to customers or regulatory authorities is commercially advantageous or legally mandatory.`,
  },
  {
    id: 'preset-nca-ecc',
    name: 'Information Security & Access Management Policy (Missing MFA & 24/7 SOC)',
    targetRegulationId: 'ksa-ecc-1',
    targetRegulationName: 'NCA ECC-1:2018 - Essential Cybersecurity Controls',
    category: 'Cybersecurity Baseline',
    description: 'An IT security policy with weak privileged access controls, single-factor legacy passwords, and absence of 24/7 security event logging mandated by NCA ECC-1:2018.',
    policyDraftText: `POLICY TITLE: IT ACCESS CONTROL AND SYSTEM SECURITY STANDARD
VERSION: 2.1 | CLASSIFICATION: CONFIDENTIAL

1. OBJECTIVE AND SCOPE
This document defines user access control rules, privileged credential management, and logging practices for all servers, network appliances, and workstations across the organization.

2. USER AUTHENTICATION & ACCESS CREDENTIALS
2.1 Standard users must choose a password containing at least eight (8) characters. Passwords expire every 180 days.
2.2 Remote VPN access to corporate headquarters requires a standard username and password. Multifactor authentication (MFA) is encouraged for executives but not mandatory for third-party contractors or system administrators.
2.3 Shared administrator accounts (e.g., 'root', 'admin', 'sa') may be shared among the senior DevOps engineering team via a shared spreadsheet encrypted with a password.

3. PRIVILEGED ACCESS MANAGEMENT
3.1 System administrators have permanent 24/7 privileged root access to production database clusters to facilitate rapid hotfix deployments.
3.2 Privileged activity is reviewed by department heads on an ad-hoc annual basis during budget reviews.
3.3 Terminated employees will have their directory accounts disabled within fourteen (14) calendar days of departure notification from HR.

4. LOGGING, MONITORING AND EVENT CORRELATION
4.1 System logs shall be retained on local server disks for thirty (30) days and then overwritten automatically by log rotation scripts.
4.2 The IT helpdesk reviews firewall dropped-packet summaries once per month during standard business hours (Sunday to Thursday, 9 AM - 5 PM).
4.3 Critical cybersecurity incidents are investigated internally. No formal mandate exists to notify national cybersecurity authorities unless external law enforcement subpoenas are served.`,
  },
  {
    id: 'preset-sama-cyber',
    name: 'Cloud Banking Security & Encryption Architecture Standard',
    targetRegulationId: 'ksa-sama-csf',
    targetRegulationName: 'SAMA Cybersecurity Framework (2017)',
    category: 'Financial Regulatory & Fintech',
    description: 'A fintech cloud security standard with weak key management, software-only encryption lacking FIPS 140-2 Level 3 HSMs, and missing SAMA written non-objection notices.',
    policyDraftText: `POLICY TITLE: FINTECH DIGITAL BANKING CLOUD INFRASTRUCTURE & CRYPTOGRAPHY
VERSION: 3.0 | CLASSIFICATION: STRICTLY CONFIDENTIAL

1. ARCHITECTURAL OVERVIEW
This standard governs cloud workloads hosting digital banking APIs, core ledger databases, and electronic payment gateways operating within the Kingdom.

2. CRYPTOGRAPHIC SAFEGUARDS & KEY MANAGEMENT
2.1 Customer debit card numbers and PIN hashes must be encrypted at rest using AES-128 or DES algorithms.
2.2 Cryptographic encryption keys are stored on local application server configuration files protected by operating system file permissions.
2.3 Software-based certificate generation is sufficient; dedicated Hardware Security Modules (HSMs) are deemed optional due to licensing costs.
2.4 Key rotation shall occur once every three (3) years or following a confirmed cryptographic breach.

3. THIRD-PARTY CLOUD PROVIDER SELECTION
3.1 The company may contract public cloud providers located in any geographic region provided they offer an ISO 27001 certificate.
3.2 Prior written approval or non-objection from the Saudi Central Bank (SAMA) is not required for outsourcing mission-critical banking ledger services, provided the CEO approves the procurement contract.
3.3 Cloud providers are not required to grant on-site physical audit access to SAMA or external regulatory inspectors.

4. BUSINESS CONTINUITY & RECOVERY TIME OBJECTIVES (RTO)
4.1 Critical banking services have a recovery time objective (RTO) of forty-eight (48) hours following total data center outage.
4.2 Disaster recovery failover testing shall be simulated on paper once every two (2) years.`,
  },
  {
    id: 'preset-uae-nesa',
    name: 'Critical Infrastructure Data Governance & Incident Escalation Policy',
    targetRegulationId: 'uae-desc-ias',
    targetRegulationName: 'DESC IAS v2.0 - Information Assurance Standards',
    category: 'Critical Infrastructure & Government',
    description: 'An industrial and utilities security policy lacking NESA-mandated critical asset tiering, 2-hour emergency escalation, and onshore sovereign telemetry storage.',
    policyDraftText: `POLICY TITLE: CRITICAL NATIONAL INFRASTRUCTURE SECURITY AND GOVERNANCE
VERSION: 1.0 | CLASSIFICATION: SECRET

1. SCOPE
Applies to Supervisory Control and Data Acquisition (SCADA), industrial IoT telemetry, and customer billing databases in the UAE.

2. CRITICAL ASSET IDENTIFICATION
2.1 Operational technology (OT) assets are cataloged in decentralized spreadsheets maintained by local plant managers.
2.2 Criticality classification is determined subjectively by plant operators without reference to National Electronic Security Authority (NESA) severity tiers.

3. NETWORK SEGREGATION & INDUSTRIAL FIREWALLS
3.1 Corporate office IT networks and plant OT networks are bridged via a routed software firewall with open administrative jump hosts.
3.2 Remote vendor diagnostic sessions may be initiated over standard Internet tunnels without multi-party authorization or video recording.

4. INCIDENT NOTIFICATION & ESCLATION
4.1 Any suspected cyber incident causing disruption to utility distribution must be reported to the internal Communications PR team within 72 hours.
4.2 Notification to the UAE National Cyber Security Council (NCSC) or NESA is only initiated after post-incident forensics are fully concluded (typically 30-45 days post-event).
4.3 Telemetry and security logs may be exported to third-party offshore SaaS analysis platforms located outside the UAE.`,
  },
];
