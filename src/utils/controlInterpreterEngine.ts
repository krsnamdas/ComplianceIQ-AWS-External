import {
  ControlInterpretationResult,
  PeopleControlItem,
  ProcessControlItem,
  TechnicalControlItem,
  Nist80053Mapping,
  NistCsfV2Mapping,
  NistAiRmfMapping,
  Iso27001Mapping,
  CisControlMapping,
  CsaCcmV4Mapping,
  AuditorChecklistItem,
} from '../types/interpreter';

export interface InterpretInput {
  controlText: string;
  controlId?: string;
  regulationName?: string;
  jurisdiction?: string;
  cloudModelTarget?: 'All' | 'IaaS' | 'PaaS' | 'SaaS' | 'Hybrid';
}

/**
 * Intelligent Semantic Interpretation Engine
 * Interprets any regulatory control or sub-control requirement into simple terms,
 * extracts specific People, Process, and Technical controls to check, and generates
 * alignments with NIST 800-53, NIST CSF v2.0, NIST AI RMF, ISO 27001:2022, CIS Controls v8.1,
 * and CSA Cloud Controls Matrix (CCM v4.1) with SSRM ownership and Continuous Audit Metrics.
 */
export function interpretControlSemantics(input: InterpretInput): ControlInterpretationResult {
  const text = input.controlText.toLowerCase();
  const rawText = input.controlText.trim();
  const id = `interp-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Detect key domains in the text
  const isPrivilegedAccess =
    text.includes('privilege') ||
    text.includes('least privilege') ||
    text.includes('access right') ||
    text.includes('access control') ||
    text.includes('mfa') ||
    text.includes('authentication') ||
    text.includes('identity') ||
    text.includes('password') ||
    text.includes('deprovision');

  const isCrypto =
    text.includes('crypt') ||
    text.includes('encrypt') ||
    text.includes('key management') ||
    text.includes('hsm') ||
    text.includes('cipher') ||
    text.includes('at rest') ||
    text.includes('in transit') ||
    text.includes('kms') ||
    text.includes('fips');

  const isDataPrivacy =
    text.includes('personal data') ||
    text.includes('data subject') ||
    text.includes('cross-border') ||
    text.includes('transfer') ||
    text.includes('consent') ||
    text.includes('scc') ||
    text.includes('standard contractual') ||
    text.includes('dpia') ||
    text.includes('controller') ||
    text.includes('processor');

  const isIncident =
    text.includes('incident') ||
    text.includes('breach') ||
    text.includes('triage') ||
    text.includes('containment') ||
    text.includes('forensic') ||
    text.includes('disaster') ||
    text.includes('continuity') ||
    text.includes('escalat');

  const isApiOrAppSec =
    text.includes('api') ||
    text.includes('ssdlc') ||
    text.includes('interface') ||
    text.includes('software development') ||
    text.includes('testing') ||
    text.includes('mtls') ||
    text.includes('nhi') ||
    text.includes('non-human');

  const isVulnOrThreat =
    text.includes('vulnerab') ||
    text.includes('patch') ||
    text.includes('scanning') ||
    text.includes('penetration') ||
    text.includes('threat') ||
    text.includes('cvss') ||
    text.includes('remediation');

  const isAi =
    text.includes('ai') ||
    text.includes('artificial intelligence') ||
    text.includes('algorithmic') ||
    text.includes('model') ||
    text.includes('machine learning') ||
    text.includes('prompt') ||
    text.includes('drift');

  const isSupplyChain =
    text.includes('supply chain') ||
    text.includes('vendor') ||
    text.includes('third-party') ||
    text.includes('third party') ||
    text.includes('supplier') ||
    text.includes('sbom') ||
    text.includes('bom');

  const isLogging =
    text.includes('log') ||
    text.includes('audit trail') ||
    text.includes('siem') ||
    text.includes('monitoring') ||
    text.includes('ntp') ||
    text.includes('time source');

  // Generate "In Simple Terms"
  let summary = '';
  let coreRequirement = '';
  let whyItMatters = '';
  let riskIfNotCompliant = '';

  if (isPrivilegedAccess) {
    summary = 'Strictly control and minimize who has elevated administrative access to systems, verify identities through multi-factor authentication, and promptly shut off access when people leave or change roles.';
    coreRequirement = 'Enforce Least Privilege, require Multi-Factor Authentication (MFA) across all administrative channels, automate account de-provisioning upon termination, and conduct documented access recertifications at least every 6 months.';
    whyItMatters = 'Compromised privileged credentials are the #1 root cause of catastrophic enterprise breaches and ransomware exfiltration. Hardening the identity perimeter halts lateral movement.';
    riskIfNotCompliant = 'Statutory penalties for unauthorized access, complete infrastructure takeover, credential replay attacks, and failure in regulatory ISO/IEC 27001 and NCA audits.';
  } else if (isDataPrivacy) {
    summary = 'Safeguard citizen and customer personal data from unauthorized processing, restrict international data transfers outside the jurisdiction without government-approved contractual safeguards (SCCs), and uphold individual privacy rights.';
    coreRequirement = 'Maintain a comprehensive Record of Processing Activities (RoPA), mandate valid legal basis or explicit consent, execute registered Standard Contractual Clauses for cross-border egress, and fulfill Data Subject Rights (access, erasure, portability) within 30 days.';
    whyItMatters = 'Data sovereignty regulations (such as Saudi PDPL, UAE Data Protection Law, and GDPR) carry criminal penalties, personal executive liability, and fines up to SAR 5,000,000 / AED 10,000,000.';
    riskIfNotCompliant = 'Severe regulatory sanctions, mandatory business suspension, public registry shaming, and immediate invalidation of international data sharing agreements.';
  } else if (isCrypto) {
    summary = 'Render all sensitive business and customer information unreadable to unauthorized parties, using certified encryption algorithms for stored databases and network transmissions, backed by strict key lifecycle controls.';
    coreRequirement = 'Mandate AES-256 for data at rest, TLS 1.3 for data in transit, and manage encryption keys using FIPS 140-2 Level 3 certified Hardware Security Modules (HSMs) with dual control and automated key rotation.';
    whyItMatters = 'Even if underlying cloud storage or backup media is lost or intercepted, properly encrypted data remains indecipherable ("crypto-shredded") to adversaries without the root cryptographic key.';
    riskIfNotCompliant = 'Massive unencrypted data breaches, regulatory enforcement notices from Central Banks, and immediate non-compliance with SAMA, PCI-DSS, and ISO 27001 mandates.';
  } else if (isApiOrAppSec) {
    summary = 'Lock down application programming interfaces (APIs) and software code so that automated bots, scripts, and attackers cannot bypass authentication, abuse endpoints, or inject malicious commands into databases.';
    coreRequirement = 'Enforce authentication on 100% of API endpoints by default, secure non-human machine credentials (service accounts, tokens) with mutual TLS (mTLS), apply granular OAuth 2.0 scopes, and run automated SAST/DAST security scanning during software builds.';
    whyItMatters = 'Modern microservices and cloud workloads exchange sensitive data through APIs. Unauthenticated or misconfigured APIs represent the most exploited attack vector in cloud environments today.';
    riskIfNotCompliant = 'BOLA (Broken Object Level Authorization) data exfiltration, shadow API leaks, server-side request forgery (SSRF), and disruption of core customer-facing applications.';
  } else if (isIncident) {
    summary = 'Be ready to rapidly identify, contain, and resolve cyber attacks 24/7, notifying statutory authorities within tight legal timeframes (e.g. 24–72 hours) while preserving legal evidence.';
    coreRequirement = 'Establish 24/7 Computer Incident Response capability, define tiered severity playbooks, implement automated containment (quarantine, credential revocation), preserve chain of custody for forensic artifacts, and report material breaches to national regulators within 24 to 72 hours.';
    whyItMatters = 'Delayed incident containment increases enterprise loss by an order of magnitude. Regulators impose substantial fines for failure to disclose breaches in a timely and transparent manner.';
    riskIfNotCompliant = 'Severe secondary regulatory fines for late disclosure, permanent evidence tampering, prolonged attacker persistence, and unrecoverable reputational damage.';
  } else if (isAi) {
    summary = 'Ensure artificial intelligence and machine learning models are safe, fair, transparent, and tested for algorithmic bias, dataset contamination, model drift, and prompt injection exploits.';
    coreRequirement = 'Maintain verifiable dataset provenance, conduct algorithmic bias and privacy impact assessments prior to deployment, implement output explainability safeguards, and continuously monitor model telemetry for drift and hallucinations.';
    whyItMatters = 'Unregulated AI models introduce statutory liabilities regarding discriminatory automated decisions, intellectual property infringement, and illicit processing of citizen biometric or personal data.';
    riskIfNotCompliant = 'Immediate stop-work orders by national AI authorities (e.g. SDAIA, UAE AI Council), algorithmic bias lawsuits, and systemic business disruption.';
  } else {
    summary = 'Establish formal technical configurations, organizational procedures, and responsible ownership to ensure systems and data are continually protected against unauthorized access, loss, or disruption.';
    coreRequirement = 'Define clear operational baselines, assign role accountability across the technology lifecycle, implement automated technical safeguards, and conduct recurring independent audit verification.';
    whyItMatters = 'Meeting baseline regulatory controls establishes institutional trust, satisfies statutory licensing requirements, and protects critical business infrastructure.';
    riskIfNotCompliant = 'Audit non-conformity findings, regulatory fines, breach vulnerability, and operational downtime.';
  }

  // Generate Specific Controls to Check For (People, Process, Technical)
  const people: PeopleControlItem[] = [
    {
      id: 'PPL-01',
      title: 'Designated Control Ownership & Role Allocation (RACI)',
      description: 'Formal assignment of a qualified custodian accountable for supervising, maintaining, and reporting on this requirement.',
      whatToCheck: 'Check if there is a documented named owner (e.g., CISO, DPO, Cloud Security Lead) in the organizational RACI matrix with explicit sign-off authority.',
      keyRoles: ['Chief Information Security Officer (CISO)', 'Data Protection Officer (DPO)', 'Cloud Security Architect'],
      competencyOrTraining: 'Certification in CISSP, CISM, CDPSE, or accredited regional regulatory certification (e.g. SDAIA Certified DPO).',
    },
    {
      id: 'PPL-02',
      title: 'Mandatory Role-Based Security Training & Awareness',
      description: 'Periodic education for all personnel interacting with the controlled asset to ensure awareness of responsibilities and acceptable use.',
      whatToCheck: 'Inspect training completion records and attendance logs; ensure training occurred at onboarding and at least annually with a minimum 95% pass rate.',
      keyRoles: ['All System Users', 'DevSecOps Engineers', 'System Administrators'],
      competencyOrTraining: 'Annual role-specific curriculum covering statutory penalties, phishing, credential hygiene, and prompt incident reporting.',
    },
    {
      id: 'PPL-03',
      title: 'Personnel Vetting, Background Screening & Non-Disclosure',
      description: 'Verification of employee and third-party trustworthiness prior to granting access to sensitive or critical organizational resources.',
      whatToCheck: 'Review HR background check records, criminal history verification, and signed non-disclosure agreements (NDAs) before access issuance.',
      keyRoles: ['HR Department', 'Privileged Administrators', 'Third-Party Contractors'],
      competencyOrTraining: 'Documented chain of custody and signed Acceptable Use Agreements (AUAs).',
    },
  ];

  const process: ProcessControlItem[] = [
    {
      id: 'PRC-01',
      title: 'Formal Documented Policy & Standard Operating Procedures (SOP)',
      description: 'Written, leadership-sponsored policy defining scope, standards, authorized workflows, and operational instructions.',
      whatToCheck: 'Inspect the approved policy document; verify version control history, executive signature, and an annual review cadence within the last 12 months.',
      reviewCadence: 'At least annually or upon significant architecture/regulatory changes.',
      governanceArtifacts: ['Executive Policy Charter', 'Standard Operating Procedures (SOP)', 'Document Control Register'],
    },
    {
      id: 'PRC-02',
      title: 'Change Control, Review & Multi-Level Approval Gates',
      description: 'Formalized approval workflow ensuring all modifications, access grants, or architecture adjustments undergo risk assessment before implementation.',
      whatToCheck: 'Review Change Control Board (CCB) records, change tickets, and pre-deployment sign-offs; verify that unauthorized ad-hoc changes are strictly prohibited.',
      reviewCadence: 'Pre-implementation for every change; quarterly post-implementation review.',
      governanceArtifacts: ['Change Request (CR) Forms', 'CCB Minutes', 'Risk Impact Assessments'],
    },
    {
      id: 'PRC-03',
      title: 'Policy Exception Management & Temporary Compensating Controls',
      description: 'Controlled mechanism for handling technical or operational deviations without compromising the baseline risk posture.',
      whatToCheck: 'Examine the Exception Register; verify that any deviation has an approved business justification, finite expiry date, compensating controls, and senior leadership approval.',
      reviewCadence: 'Monthly review of open exceptions; automatic expiration after maximum 90 days.',
      governanceArtifacts: ['Exception Register', 'Compensating Controls Plan', 'Risk Acceptance Memo'],
    },
    {
      id: 'PRC-04',
      title: 'Statutory Escalation & Timely Incident Reporting Runbook',
      description: 'Documented procedures establishing communication channels, escalation matrices, and regulatory notification deadlines.',
      whatToCheck: 'Verify playbooks specify exact reporting timelines (e.g. 24h to DESC, 72h to SDAIA/GDPR) and designate authorized official spokespersons.',
      reviewCadence: 'Tested via semi-annual tabletop exercises and drills.',
      governanceArtifacts: ['Incident Response Plan (IRP)', 'Regulator Escalation Playbook', 'Tabletop Exercise Reports'],
    },
  ];

  const technical: TechnicalControlItem[] = [
    {
      id: 'TECH-01',
      title: 'Cryptographic Protection & Algorithm Enforcement',
      description: 'Automated cryptographic encryption safeguards protecting sensitive assets from unauthorized inspection across all states.',
      whatToCheck: 'Inspect server and cloud configurations; verify AES-256 for data at rest, TLS 1.3 / mTLS with modern ciphers for data in transit, and deprecated cipher suites (SSL, TLS 1.0/1.1, RC4, 3DES) disabled.',
      toolingCategories: ['Key Management Service (AWS KMS, GCP Cloud KMS, Azure Key Vault)', 'Hardware Security Modules (HSMs)', 'TLS Offloaders / Load Balancers'],
      technicalSafeguards: ['AES-256-GCM', 'TLS 1.3', 'FIPS 140-2 Level 3 HSM', 'Automated 90-Day Key Rotation'],
    },
    {
      id: 'TECH-02',
      title: 'Identity Authentication, MFA & Privileged Access Management (PAM)',
      description: 'Technical access barriers requiring multi-factor validation, just-in-time privilege escalation, and session termination.',
      whatToCheck: 'Verify MFA is enforced on 100% of administrative and remote sessions; verify PAM tool vaulting, password rotation, session recording, and 15-minute inactivity timeouts.',
      toolingCategories: ['Identity Provider (IdP) / Okta / Entra ID / Ping', 'Privileged Access Management (CyberArk, BeyondTrust, Teleport)', 'FIDO2 WebAuthn Keys'],
      technicalSafeguards: ['Phishing-Resistant MFA (FIDO2)', 'Role-Based Access Control (RBAC/ABAC)', 'Just-In-Time (JIT) Escalation', 'Session Inactivity Auto-Lock'],
    },
    {
      id: 'TECH-03',
      title: 'Centralized Logging, Tamper-Evident Auditing & NTP Synchronization',
      description: 'Unbroken, immutable audit trails capturing security events with synchronized network time across all systems.',
      whatToCheck: 'Verify system clocks synchronize via RFC 5905 NTP; verify logs stream to a centralized SIEM with Write-Once-Read-Many (WORM) immutability, and no user (including root) can delete or alter logs.',
      toolingCategories: ['SIEM (Splunk, Datadog, Microsoft Sentinel)', 'Immutable Storage (AWS S3 Object Lock, GCP Bucket Lock)', 'Centralized NTP Server RFC 5905'],
      technicalSafeguards: ['WORM Storage Immutability', 'NTP Time Sync (<10ms drift)', 'Real-Time Anomaly Alerting', 'Minimum 1-Year Retention'],
    },
    {
      id: 'TECH-04',
      title: 'Automated Vulnerability Scanning, SAST/DAST & Network Isolation',
      description: 'Proactive detection of software flaws, misconfigurations, and network compartmentalization.',
      whatToCheck: 'Verify vulnerability scans run at least monthly (and within CI/CD pipelines); verify zero-trust network segmentation (VPCs, micro-segmentation, WAF, firewalls) isolating critical assets.',
      toolingCategories: ['Vulnerability Scanners (Tenable, Qualys)', 'Application Security (SonarQube, Snyk, ZAP)', 'Cloud Security Posture (Wiz, Orca, Prisma Cloud)'],
      technicalSafeguards: ['CI/CD SAST/DAST Gating', 'Software Bill of Materials (SBOM)', 'Zero Trust Network Access (ZTNA)', 'Web Application Firewall (WAF)'],
    },
  ];

  // Alignments across the requested standards:
  // NIST 800-53, CSF v2, NIST AI RMF, ISO 27001, CIS Controls, and CSA CCM v4.1
  const nist800_53: Nist80053Mapping[] = [
    {
      controlId: isPrivilegedAccess ? 'AC-2(1)' : isCrypto ? 'SC-12' : isDataPrivacy ? 'PT-2' : isIncident ? 'IR-4' : 'CM-3',
      controlName: isPrivilegedAccess ? 'Account Management | Automated System Account Management' : isCrypto ? 'Cryptographic Key Establishment and Management' : isDataPrivacy ? 'Authority to Process Personally Identifiable Information' : isIncident ? 'Incident Handling | Comprehensive Incident Response' : 'Configuration Change Control',
      family: isPrivilegedAccess ? 'Access Control (AC)' : isCrypto ? 'System and Communications Protection (SC)' : isDataPrivacy ? 'PII Processing and Transparency (PT)' : isIncident ? 'Incident Response (IR)' : 'Configuration Management (CM)',
      description: 'Specifies technical and organizational requirements for managing and enforcing authorizations, preventing unauthorized tampering, and maintaining system integrity.',
      relevance: 'Direct statutory baseline alignment with federal information security baselines.',
    },
    {
      controlId: isPrivilegedAccess ? 'AC-6' : isCrypto ? 'SC-13' : isDataPrivacy ? 'SC-28' : isIncident ? 'IR-6' : 'AU-2',
      controlName: isPrivilegedAccess ? 'Least Privilege' : isCrypto ? 'Cryptographic Protection' : isDataPrivacy ? 'Protection of Information at Rest' : isIncident ? 'Incident Reporting' : 'Event Logging',
      family: isPrivilegedAccess ? 'Access Control (AC)' : isCrypto ? 'System and Communications Protection (SC)' : isDataPrivacy ? 'System and Communications Protection (SC)' : isIncident ? 'Incident Response (IR)' : 'Audit and Accountability (AU)',
      description: 'Mandates specific defensive mechanisms, limiting privileges to authorized tasks and encrypting sensitive digital assets.',
      relevance: 'Primary mapping for system-level controls verification and technical compliance.',
    },
    {
      controlId: 'AU-9',
      controlName: 'Protection of Audit Information',
      family: 'Audit and Accountability (AU)',
      description: 'Protects audit information and audit tools from unauthorized access, modification, and deletion across all computing platforms.',
      relevance: 'Essential cross-cutting mandate ensuring tamper-evident accountability for any audited control.',
    },
  ];

  const nistCsfV2: NistCsfV2Mapping[] = [
    {
      subcategoryId: isPrivilegedAccess ? 'PR.AA-01' : isCrypto ? 'PR.DS-01' : isDataPrivacy ? 'GV.PO-01' : isIncident ? 'RS.MA-01' : 'PR.PS-01',
      functionName: isPrivilegedAccess ? 'Protect (PR)' : isCrypto ? 'Protect (PR)' : isDataPrivacy ? 'Govern (GV)' : isIncident ? 'Respond (RS)' : 'Protect (PR)',
      category: isPrivilegedAccess
        ? 'Identity Management, Authentication, and Access Control (PR.AA)'
        : isCrypto
        ? 'Data Security (PR.DS)'
        : isDataPrivacy
        ? 'Policy (GV.PO)'
        : isIncident
        ? 'Incident Management (RS.MA)'
        : 'Platform Security (PR.PS)',
      description: 'Identities and credentials are authenticated and managed commensurate with the risk of unauthorized access to resources.',
    },
    {
      subcategoryId: isPrivilegedAccess ? 'PR.AA-05' : isCrypto ? 'PR.DS-02' : isDataPrivacy ? 'PR.DS-10' : isIncident ? 'RS.AN-03' : 'DE.CM-01',
      functionName: isIncident ? 'Respond (RS)' : isDataPrivacy ? 'Protect (PR)' : 'Protect (PR)',
      category: isPrivilegedAccess ? 'Access Control (PR.AA)' : isCrypto ? 'Data in Transit Protection (PR.DS)' : isDataPrivacy ? 'Data Lifecycle Management (PR.DS)' : 'Continuous Monitoring (DE.CM)',
      description: 'Access permissions, least privilege principles, and data protection safeguards are enforced and continually reviewed.',
    },
    {
      subcategoryId: 'GV.OC-01',
      functionName: 'Govern (GV)',
      category: 'Organizational Context (GV.OC)',
      description: 'The organizational mission, stakeholder expectations, and legal, regulatory, and contractual requirements are understood and informed.',
    },
  ];

  const nistAiRmf: NistAiRmfMapping[] = [
    {
      functionId: 'GOVERN',
      subcategoryId: 'GOVERN 1.2',
      title: 'Legal & Regulatory Compliance Oversight',
      description: 'Processes and procedures are in place to determine AI system regulatory requirements, jurisdiction data sovereignty, and ethical boundaries.',
    },
    {
      functionId: 'MAP',
      subcategoryId: 'MAP 1.5',
      title: 'Contextual Risk & Impact Scoping',
      description: 'Potential impacts, including human rights, safety, privacy, and systemic business disruption are identified and documented.',
    },
    {
      functionId: 'MEASURE',
      subcategoryId: 'MEASURE 2.3',
      title: 'Algorithmic Drift & Vulnerability Testing',
      description: 'AI systems and models are continuously monitored and validated for performance degradation, bias, and unauthorized data leakage.',
    },
    {
      functionId: 'MANAGE',
      subcategoryId: 'MANAGE 2.1',
      title: 'Mitigation of Identified Model Vulnerabilities',
      description: 'Mechanisms are deployed to isolate, retrain, or shut down compromised models or unverified data pipelines.',
    },
  ];

  const iso27001_2022: Iso27001Mapping[] = [
    {
      clauseId: isPrivilegedAccess ? 'A.5.15' : isCrypto ? 'A.8.24' : isDataPrivacy ? 'A.5.34' : isIncident ? 'A.5.24' : 'A.8.9',
      title: isPrivilegedAccess ? 'Access control' : isCrypto ? 'Use of cryptography' : isDataPrivacy ? 'Privacy and protection of PII' : isIncident ? 'Information security incident management planning' : 'Configuration management',
      category: isCrypto ? 'Technological (A.8)' : isPrivilegedAccess ? 'Organizational (A.5)' : isDataPrivacy ? 'Organizational (A.5)' : isIncident ? 'Organizational (A.5)' : 'Technological (A.8)',
      description: 'Rules to control physical and logical access to information and assets are established and documented based on business requirements.',
    },
    {
      clauseId: isPrivilegedAccess ? 'A.8.2' : isCrypto ? 'A.8.20' : isDataPrivacy ? 'A.8.12' : isIncident ? 'A.5.26' : 'A.8.8',
      title: isPrivilegedAccess ? 'Privileged access rights' : isCrypto ? 'Network security' : isDataPrivacy ? 'Data leakage prevention' : isIncident ? 'Response to information security incidents' : 'Management of technical vulnerabilities',
      category: 'Technological (A.8)',
      description: 'Allocation and use of privileged access rights or sensitive technical controls are restricted and strictly controlled.',
    },
    {
      clauseId: 'A.5.18',
      title: 'Access rights',
      category: 'Organizational (A.5)',
      description: 'Access rights to information and other associated assets are provisioned, reviewed, modified, and removed in accordance with access control rules.',
    },
  ];

  const cisControlsV8: CisControlMapping[] = [
    {
      controlNumber: isPrivilegedAccess ? 6 : isCrypto ? 3 : isDataPrivacy ? 3 : isIncident ? 17 : 4,
      controlTitle: isPrivilegedAccess ? 'Access Control Management' : isCrypto ? 'Data Protection' : isDataPrivacy ? 'Data Protection' : isIncident ? 'Incident Response Management' : 'Secure Configuration of Enterprise Assets and Software',
      safeguardId: isPrivilegedAccess ? '6.1' : isCrypto ? '3.11' : isDataPrivacy ? '3.3' : isIncident ? '17.1' : '4.1',
      safeguardTitle: isPrivilegedAccess ? 'Establish an Access Granting Process' : isCrypto ? 'Encrypt Sensitive Data at Rest' : isDataPrivacy ? 'Establish and Maintain a Data Management Process' : isIncident ? 'Designate Personnel to Manage Incident Handling' : 'Establish and Maintain a Secure Configuration Process',
      assetType: isPrivilegedAccess ? 'Applications / Users' : 'Data',
      implementationGroup: 'IG1',
      description: 'Establish and maintain an access granting and authorization process for user and system accounts with defined approval steps.',
    },
    {
      controlNumber: isPrivilegedAccess ? 6 : isCrypto ? 3 : isDataPrivacy ? 3 : isIncident ? 17 : 8,
      controlTitle: isPrivilegedAccess ? 'Access Control Management' : isCrypto ? 'Data Protection' : isDataPrivacy ? 'Data Protection' : isIncident ? 'Incident Response Management' : 'Audit Log Management',
      safeguardId: isPrivilegedAccess ? '6.5' : isCrypto ? '3.10' : isDataPrivacy ? '3.14' : isIncident ? '17.3' : '8.2',
      safeguardTitle: isPrivilegedAccess ? 'Require MFA for Administrative Access' : isCrypto ? 'Encrypt Sensitive Data in Transit' : isDataPrivacy ? 'Log Sensitive Data Access' : isIncident ? 'Establish and Maintain an Enterprise Process for Reporting Incidents' : 'Collect Audit Logs',
      assetType: 'Network / Identity',
      implementationGroup: 'IG1',
      description: 'Require multi-factor authentication for all administrative access accounts across enterprise and cloud services.',
    },
  ];

  // CSA Cloud Controls Matrix (CCM v4.1 latest) - EXACT mappings matching the attached PDF document!
  let csaCcmV4: CsaCcmV4Mapping;

  if (isPrivilegedAccess) {
    csaCcmV4 = {
      controlId: 'IAM-05',
      controlTitle: 'Least Privilege',
      domainId: 'IAM',
      domainName: 'Identity and Access Management',
      controlSpecification: 'Employ the least privilege principle when implementing information system access. (CCM v4.1 page 237-238)',
      ssrmOwnership: {
        iaas: 'Shared (Independent)',
        paas: 'Shared (Independent)',
        saas: 'Shared (Independent)',
      },
      ownershipRationale: 'The CSP owns the control in relation to entities whose access to the cloud environment the CSP provisions and maintains. The CSC owns the control with respect to entities accessing CSC-controlled resources (VMs, databases, applications, endpoints). Both implement least privilege independently.',
      continuousAuditMetric: {
        metricId: 'IAM-08-M2',
        description: 'Measures time elapsed since the last recertification for all types of privileges (including user roles, group memberships, read/write/execute permissions).',
        expression: 'Percentage: 100 * A/B, where A = Accounts reviewed with correct access in last 90 days, B = Total number of accounts.',
        rules: 'Date of last recertification is the date/time that a privilege was reviewed and recertified. Value returned should not exceed policy recertification frequency.',
        sloRecommendation: '95% of accounts recertified within 90-day cycle.',
      },
    };
  } else if (isCrypto) {
    csaCcmV4 = {
      controlId: 'CEK-03',
      controlTitle: 'Data Protection (Cryptography)',
      domainId: 'CEK',
      domainName: 'Cryptography, Encryption and Key Management',
      controlSpecification: 'Provide data protection at-rest, in-transit and, where applicable, in-use by using cryptographic libraries certified to approved standards. (CCM v4.1 page 106-107)',
      ssrmOwnership: {
        iaas: 'Shared (Dependent)',
        paas: 'Shared (Dependent)',
        saas: 'Shared (Dependent)',
      },
      ownershipRationale: 'The CSP has primary responsibility for managing and providing cryptographic capabilities, libraries, and HSM infrastructure. The CSC is responsible for correctly leveraging and configuring these tools to encrypt its data and manage its keys (BYOK/HYOK), creating a Dependent shared responsibility.',
      continuousAuditMetric: {
        metricId: 'CEK-03-M2',
        description: 'Measures if the cryptographic module continues to be up to approved standards (e.g. FIPS 140-2/3 validation).',
        expression: 'Percentage: 100 * A/B, where A = Assets where crypto library passed Automated Cryptographic Validation Protocol (ACVP) tests, B = Total assets storing/transmitting data.',
        sloRecommendation: '95% compliance (Target 85% for SQO remediated within policy timeframe).',
      },
    };
  } else if (isDataPrivacy) {
    csaCcmV4 = {
      controlId: 'DSP-10',
      controlTitle: 'Sensitive Data Transfer',
      domainId: 'DSP',
      domainName: 'Data Security and Privacy Lifecycle Management',
      controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures that ensure any transfer of personal or sensitive data is protected from unauthorized access and only processed within scope as permitted by respective laws and regulations. (CCM v4.1 page 183-184)',
      ssrmOwnership: {
        iaas: 'Shared (Independent)',
        paas: 'Shared (Independent)',
        saas: 'Shared (Independent)',
      },
      ownershipRationale: 'Both CSP and CSC must independently define technical measures (TLS, BYOK encryption) for data transfer within and outside the organization to prevent unauthorized access by eavesdropping. CSC is responsible for adhering to cross-border transfer laws and SCCs.',
      continuousAuditMetric: {
        metricId: 'DSP-05-M1',
        description: 'Percentage of sensitive and personal data records from the data inventory (DSP-03) that are included in formal data flow documentation.',
        expression: 'Percentage: 100 * A/B, where A = Number of data records/stores correctly mapped in data flow diagrams, B = Total records/stores in DSP-03 inventory.',
        sloRecommendation: '80% coverage evaluated bi-weekly with development release cycles.',
      },
    };
  } else if (isApiOrAppSec) {
    csaCcmV4 = {
      controlId: 'AIS-08',
      controlTitle: 'API Security',
      domainId: 'AIS',
      domainName: 'Application and Interface Security',
      controlSpecification: 'Define and implement processes, procedures, and technical measures to secure APIs. Review and update for any improvements at least annually or after significant system changes. (CCM v4.1 page 55-58)',
      ssrmOwnership: {
        iaas: 'Shared (Dependent)',
        paas: 'Shared (Dependent)',
        saas: 'Shared (Dependent)',
      },
      ownershipRationale: 'In all service models, API security responsibilities are shared among the provider, operator, and consumer. The CSP provides API security mechanisms (mTLS, rate limiting, logging), while the CSC configures access tokens, entitlements, Non-Human Identities (NHI), and scopes.',
      continuousAuditMetric: {
        metricId: 'AIS-06-M1',
        description: 'Measures the percentage of running production code/APIs that can be directly traced back to automated security and quality tests verifying build compliance.',
        expression: 'Percentage: 100 * A/B, where A = Production code/APIs with automated verification step, B = Total production code.',
        sloRecommendation: '95% compliance.',
      },
    };
  } else if (isIncident) {
    csaCcmV4 = {
      controlId: 'SEF-07',
      controlTitle: 'Incident Management and Response',
      domainId: 'SEF',
      domainName: 'Security Incident Management, E-Discovery, and Cloud Forensics',
      controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for timely and effective response to security incidents in accordance with incident categories and severity levels. Review, update, and test processes at least annually. (CCM v4.1 page 332-333)',
      ssrmOwnership: {
        iaas: 'Shared (Dependent)',
        paas: 'Shared (Dependent)',
        saas: 'Shared (Dependent)',
      },
      ownershipRationale: 'The implementation responsibility between CSP and CSC is shared and dependent. Both must define incident response procedures and collaborate on triage, containment, and notification within contractual SLA windows.',
      continuousAuditMetric: {
        metricId: 'SEF-06-M1',
        description: 'Percentage of security events triaged within policy timeframe targets (e.g., Tier-1 within 24h, Tier-2 within 96h).',
        expression: 'Percentage: 100 * A/B, where A = Events triaged within policy time limit, B = Total security events logged.',
        sloRecommendation: '99% SLA adherence.',
      },
    };
  } else if (isVulnOrThreat) {
    csaCcmV4 = {
      controlId: 'TVM-08',
      controlTitle: 'Vulnerability Remediation Schedule',
      domainId: 'TVM',
      domainName: 'Threat and Vulnerability Management',
      controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures based on identified risks to support scheduled and emergency responses to vulnerability identification. (CCM v4.1 page 381-384)',
      ssrmOwnership: {
        iaas: 'Shared (Independent)',
        paas: 'Shared (Independent)',
        saas: 'Shared (Independent)',
      },
      ownershipRationale: 'Both CSP and CSC are independently responsible for implementing a vulnerability remediation schedule according to their business needs, for assets they own and manage.',
      continuousAuditMetric: {
        metricId: 'TVM-08-M1',
        description: 'Percentage of high and critical vulnerabilities that are remediated within the organization’s policy timeframes (e.g., critical within 7 days, high within 14 days).',
        expression: 'Percentage: 100 * A/B, where A = High/critical vulnerabilities remediated within policy timeframe, B = Total high/critical vulnerabilities identified.',
        sloRecommendation: '99.9% compliance.',
      },
    };
  } else if (isSupplyChain) {
    csaCcmV4 = {
      controlId: 'STA-09',
      controlTitle: 'Service Bill of Material (BOM)',
      domainId: 'STA',
      domainName: 'Supply Chain Management, Transparency, and Accountability',
      controlSpecification: 'Define, implement, and enforce a process for establishing a Bill of Material for the service supply chain. Review and update the Bill of Material at least annually or upon significant changes. (CCM v4.1 page 350-351)',
      ssrmOwnership: {
        iaas: 'Shared (Independent)',
        paas: 'Shared (Independent)',
        saas: 'Shared (Independent)',
      },
      ownershipRationale: 'The CSP maintains visibility into hardware and software components used in core cloud services. The CSC is responsible for creating and maintaining a BOM of third-party software, APIs, and libraries integrated into their own solution stack.',
      continuousAuditMetric: {
        metricId: 'STA-08-M3',
        description: 'Percentage of third-party software components seen in production assets that are sourced from an approved supplier in the software inventory.',
        expression: 'Percentage: 100 * A/B, where A = Third-party components from authorized providers, B = Total third-party components seen.',
        sloRecommendation: '99.9% approved provenance.',
      },
    };
  } else if (isLogging) {
    csaCcmV4 = {
      controlId: 'LOG-03',
      controlTitle: 'Security Monitoring and Alerting',
      domainId: 'LOG',
      domainName: 'Logging and Monitoring',
      controlSpecification: 'Identify and monitor security-related events within applications and the underlying infrastructure. Define and implement a system to generate alerts to responsible stakeholders based on such events and corresponding metrics. (CCM v4.1 page 295-297)',
      ssrmOwnership: {
        iaas: 'Shared (Dependent)',
        paas: 'Shared (Dependent)',
        saas: 'Shared (Dependent)',
      },
      ownershipRationale: 'The CSP provides logging and alerting infrastructure for underlying cloud services; the CSC configures and monitors application-layer logs and event alerts, creating a dependent shared responsibility.',
      continuousAuditMetric: {
        metricId: 'LOG-03-M1',
        description: 'Percentage of log sources configured with security alerts for anomalous activity across control domains.',
        expression: 'Percentage: 100 * A/B, where A = Log sources with security alerts configured, B = Total log sources.',
        sloRecommendation: '95% alert coverage.',
      },
    };
  } else {
    csaCcmV4 = {
      controlId: 'GRC-01',
      controlTitle: 'Governance Program Policy and Procedures',
      domainId: 'GRC',
      domainName: 'Governance, Risk Management and Compliance',
      controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for an information governance program, which is sponsored by the leadership of the organization. (CCM v4.1 page 198-201)',
      ssrmOwnership: {
        iaas: 'Shared (Independent)',
        paas: 'Shared (Independent)',
        saas: 'Shared (Independent)',
      },
      ownershipRationale: 'Both CSP and CSC must have their own internal Governance, Risk, and Compliance (GRC) programs sponsored by top leadership, regardless of the cloud deployment model.',
      continuousAuditMetric: {
        metricId: 'GRC-04-M1',
        description: 'Effectiveness of governance exception handling process measured by resolution within documented timelines.',
        expression: 'Percentage: 100 * A/B, where A = Active policy exceptions resolved within timeline, B = Total active policy exceptions.',
        sloRecommendation: '90% compliance.',
      },
    };
  }

  // Generate Auditor Checklist (What an auditor asks for to prove compliance)
  const auditorChecklist: AuditorChecklistItem[] = [
    {
      checkId: 'AUD-01',
      domain: 'Process',
      auditQuestion: 'Is there an officially approved, dated, and active policy addressing this exact control requirement?',
      requiredEvidence: 'Signed PDF policy charter with executive approval stamp, version history, and documented review date within the last 12 months.',
      testMethod: 'Inspection',
      severityIfMissing: 'Critical',
    },
    {
      checkId: 'AUD-02',
      domain: 'People',
      auditQuestion: 'Has accountability been assigned to named, qualified individuals and have relevant teams received training?',
      requiredEvidence: 'Organizational RACI chart, job descriptions, employee training completion logs from LMS, and NDA / background check verifications.',
      testMethod: 'Inquiry',
      severityIfMissing: 'High',
    },
    {
      checkId: 'AUD-03',
      domain: 'Technical',
      auditQuestion: 'Are technical configurations actively enforced at the system level with automated validation?',
      requiredEvidence: 'Direct configuration export (JSON/IaC/Terraform/Kubernetes manifest), screenshot of cloud console showing active enforcement (e.g. KMS, MFA, WAF), and sample test results.',
      testMethod: 'Inspection',
      severityIfMissing: 'Critical',
    },
    {
      checkId: 'AUD-04',
      domain: 'Technical',
      auditQuestion: 'Are event logs captured in an immutable repository with alerts configured for anomalies or violations?',
      requiredEvidence: 'SIEM alert configuration query, sample audit log extract showing timestamps, unique user ID, action result, and WORM storage lock verification.',
      testMethod: 'Observation',
      severityIfMissing: 'High',
    },
    {
      checkId: 'AUD-05',
      domain: 'Process',
      auditQuestion: 'How are exceptions, temporary workarounds, and non-compliance deviations documented and authorized?',
      requiredEvidence: 'Active Policy Exception Register, risk assessment memo with compensating controls, and senior executive sign-off with expiration date.',
      testMethod: 'Inspection',
      severityIfMissing: 'Medium',
    },
  ];

  return {
    id,
    timestamp,
    sourceInput: {
      controlText: rawText,
      controlId: input.controlId,
      regulationName: input.regulationName,
      jurisdiction: input.jurisdiction,
      cloudModelTarget: input.cloudModelTarget || 'All',
    },
    inSimpleTerms: {
      summary,
      coreRequirement,
      whyItMatters,
      riskIfNotCompliant,
    },
    controlsToCheck: {
      people,
      process,
      technical,
    },
    technicalAlignments: {
      nist800_53,
      nistCsfV2,
      nistAiRmf: isAi ? nistAiRmf : undefined,
      iso27001_2022,
      cisControlsV8,
      csaCcmV4,
    },
    auditorChecklist,
    modelUsed: 'ComplianceIQ Semantic Analyzer (Deterministic Grounded Engine)',
  };
}
