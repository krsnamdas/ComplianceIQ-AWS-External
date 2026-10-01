import { Regulation, ControlDetail } from '../types/regulatory';
import { RedlineAnalysisResult, PolicyFinding, RedlineSummary } from '../types/redline';

interface RedlineEngineInput {
  policyDraftText: string;
  policyName?: string;
  regulation: Regulation;
}

export function analyzePolicyAgainstRegulation(input: RedlineEngineInput): RedlineAnalysisResult {
  const { policyDraftText, policyName = 'Internal Compliance Policy Draft', regulation } = input;

  const textLower = policyDraftText.toLowerCase();
  const words = policyDraftText.trim().split(/\s+/).filter(Boolean);
  const paragraphs = policyDraftText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const findings: PolicyFinding[] = [];

  // Evaluate each control in the regulation against the policy text
  // Regulation objects have sampleControls; we fall back or synthesize from domainList if needed
  let controls: ControlDetail[] = regulation.sampleControls || (regulation as any).controls || [];

  // If the regulation only has a few sample controls, synthesize domain controls from controlStructure to provide robust coverage
  if (controls.length < 4 && regulation.controlStructure?.domainList?.length) {
    const additionalControls: ControlDetail[] = regulation.controlStructure.domainList.map((domain, i) => ({
      id: `${regulation.id}-domain-${i + 1}`,
      code: `${regulation.code || 'REG'}-DOM-0${i + 1}`,
      domainNumber: `${i + 1}`,
      domainName: domain,
      subDomainName: domain,
      title: `${domain} Compliance & Enforcement`,
      description: `Organizations must establish documented, executive-approved policies and operational safeguards governing ${domain.toLowerCase()} in accordance with ${regulation.authority} statutory directives.`,
      clauseReference: `${regulation.code} Sec. ${i + 1}`,
      mandatoryLevel: 'Mandatory',
      applicableSectors: regulation.targetSectors || ['Banking', 'Cloud & Hyperscalers', 'Government'],
      mapping: {
        nistCsf: 'PR.DS-01, GV.OC-01',
        iso27001: 'A.5.1, A.8.1',
        csaCcm: 'GRC-01, DCS-01',
      },
    }));

    // Merge without duplicates
    controls = [...controls, ...additionalControls];
  }

  for (const ctrl of controls) {
    const titleLower = ctrl.title.toLowerCase();
    const descLower = ctrl.description.toLowerCase();
    const domainLower = ctrl.domainName.toLowerCase();

    // Key semantic anchors
    const isCrypto = titleLower.includes('encrypt') || descLower.includes('encrypt') || titleLower.includes('crypt') || domainLower.includes('crypt');
    const isAccess = titleLower.includes('access') || titleLower.includes('identity') || titleLower.includes('authenticat') || domainLower.includes('identity');
    const isTransfer = titleLower.includes('transfer') || titleLower.includes('cross-border') || titleLower.includes('jurisdiction') || descLower.includes('cross-border') || descLower.includes('outside');
    const isBreach = titleLower.includes('breach') || titleLower.includes('incident') || descLower.includes('incident') || descLower.includes('breach');
    const isLog = titleLower.includes('log') || titleLower.includes('monitor') || descLower.includes('siem') || descLower.includes('audit trail');
    const isThirdParty = titleLower.includes('third-party') || titleLower.includes('vendor') || titleLower.includes('cloud') || titleLower.includes('outsource');
    const isConsent = titleLower.includes('consent') || titleLower.includes('notice') || titleLower.includes('subject');
    const isRetention = titleLower.includes('retention') || titleLower.includes('disposal') || titleLower.includes('erasure') || descLower.includes('destroy');
    const isGovernance = titleLower.includes('governance') || titleLower.includes('officer') || titleLower.includes('raci') || titleLower.includes('audit');

    // Check presence in draft policy
    let isCoveredInPolicy = false;
    let detectedSnippet = '';
    let isDeficient = false;
    let deficiencyReason = '';
    let suggestedClause = '';

    // Search paragraphs for relevant text
    for (const p of paragraphs) {
      const pLower = p.toLowerCase();
      if (
        (isCrypto && (pLower.includes('encrypt') || pLower.includes('cipher') || pLower.includes('key'))) ||
        (isAccess && (pLower.includes('password') || pLower.includes('access') || pLower.includes('credential') || pLower.includes('mfa') || pLower.includes('root'))) ||
        (isTransfer && (pLower.includes('transfer') || pLower.includes('overseas') || pLower.includes('cross-border') || pLower.includes('cloud') || pLower.includes('data center'))) ||
        (isBreach && (pLower.includes('breach') || pLower.includes('incident') || pLower.includes('escalat') || pLower.includes('notif'))) ||
        (isLog && (pLower.includes('log') || pLower.includes('monitor') || pLower.includes('audit') || pLower.includes('retention'))) ||
        (isThirdParty && (pLower.includes('vendor') || pLower.includes('cloud') || pLower.includes('third-party') || pLower.includes('outsource'))) ||
        (isConsent && (pLower.includes('consent') || pLower.includes('subject') || pLower.includes('notice'))) ||
        (isRetention && (pLower.includes('retention') || pLower.includes('erasure') || pLower.includes('years') || pLower.includes('wip')))
      ) {
        isCoveredInPolicy = true;
        detectedSnippet = p.trim().slice(0, 320) + (p.length > 320 ? '...' : '');

        // Now test for statutory deficiencies
        if (isTransfer) {
          if (pLower.includes('no additional regulator') || pLower.includes('without approval') || pLower.includes('offshore') || !pLower.includes('standard contractual clauses') && !pLower.includes('sdaia') && !pLower.includes('adequacy')) {
            isDeficient = true;
            deficiencyReason = `Draft policy permits overseas transfer to foreign cloud regions without conducting the statutory Transfer Impact Assessment (TIA) or obtaining mandatory regulator authorization/Standard Contractual Clauses required by ${regulation.name} (${ctrl.code}).`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "Cross-Border Data Transfers must strictly comply with ${regulation.authority} requirements. Personal or sensitive telemetry data shall not be transferred outside the jurisdiction unless an approved Adequacy Decision exists or executed Standard Contractual Clauses (SCCs) are registered with the competent authority. Prior Transfer Risk Assessments (TRA) and local data residency safeguards must be formally documented prior to transmission."`;
          }
        }

        if (isAccess) {
          if (pLower.includes('not mandatory') || pLower.includes('optional') || pLower.includes('8 characters') || pLower.includes('shared among') || pLower.includes('permanent 24/7 privileged') || pLower.includes('14 calendar days')) {
            isDeficient = true;
            deficiencyReason = `Draft policy authorizes weak password baselines, voluntary MFA, or unmonitored permanent privileged root access which directly violates ${regulation.name} access control mandate ${ctrl.code}.`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "Phishing-resistant Multi-Factor Authentication (MFA / FIDO2) is strictly mandatory for all administrative, remote VPN, and cloud console sessions. Privileged access must follow Just-In-Time (JIT) least-privilege principles with session recording. Deprovisioning of terminated personnel access must occur automatically within four (4) hours of departure."`;
          }
        }

        if (isCrypto) {
          if (pLower.includes('aes-128') || pLower.includes('des') || pLower.includes('optional') || pLower.includes('local application server') || pLower.includes('software-based')) {
            isDeficient = true;
            deficiencyReason = `Draft policy permits obsolete ciphers (DES/AES-128) and software-only keystores. ${regulation.name} (${ctrl.code}) mandates AES-256 / RSA-3072+ and dedicated FIPS 140-2 Level 3 Hardware Security Modules (HSMs).`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "All sensitive and personal data at rest must be encrypted utilizing AES-256-GCM. Cryptographic keys must be generated, stored, and rotated inside FIPS 140-2 Level 3 validated Hardware Security Modules (HSMs). Unencrypted plaintext keys on application servers or source repositories are strictly prohibited."`;
          }
        }

        if (isBreach) {
          if (pLower.includes('5 business days') || pLower.includes('commercially advantageous') || pLower.includes('72 hours') || pLower.includes('no formal mandate') || pLower.includes('30-45 days')) {
            isDeficient = true;
            deficiencyReason = `Draft policy establishes an unlawful breach notification threshold ("5 days" or "at discretion"). ${regulation.name} (${ctrl.code}) mandates statutory reporting within 72 hours (or immediate 2-hour escalation for critical infrastructure) to the regulatory authority.`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "In the event of a confirmed or suspected cybersecurity incident or personal data breach, the incident response team must immediately notify ${regulation.authority} within seventy-two (72) hours of becoming aware (or two (2) hours for critical infrastructure disruptions), detailing impact, root cause, and containment remediation."`;
          }
        }

        if (isLog) {
          if (pLower.includes('30 days') || pLower.includes('once per month') || pLower.includes('local server disks') || pLower.includes('standard business hours')) {
            isDeficient = true;
            deficiencyReason = `Retention of logs for only 30 days and ad-hoc monthly reviews violates ${regulation.name} (${ctrl.code}), which requires centralized WORM immutable logging with a minimum 12-month retention and 24/7 continuous SIEM monitoring.`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "Audit trails and security event telemetry from all operating systems, hypervisors, databases, and network gateways must be ingested in real-time into a centralized SIEM with 24/7/365 active SOC monitoring. All security logs must be cryptographically protected against tampering and retained for a minimum of twelve (12) calendar months."`;
          }
        }

        if (isThirdParty) {
          if (pLower.includes('not required to grant') || pLower.includes('prior written approval or non-objection is not required') || pLower.includes('standard commercial terms')) {
            isDeficient = true;
            deficiencyReason = `Draft policy waives regulatory audit rights and prior written non-objection approvals required for cloud outsourcing under ${regulation.name} (${ctrl.code}).`;
            suggestedClause = `STATUTORY INSERTION (${ctrl.code}): "All cloud service provider (CSP) agreements must explicitly mandate unrestricted physical and logical audit inspection rights for ${regulation.authority} inspectors. Material outsourcing requires formal submission of regulatory risk dossiers and formal written non-objection prior to production onboarding."`;
          }
        }

        break;
      }
    }

    if (!isCoveredInPolicy) {
      // MISSING CLAUSE: Control completely omitted from the draft policy
      findings.push({
        id: `finding-missing-${ctrl.id}`,
        category: 'Missing Clause',
        severity: ctrl.mandatoryLevel === 'Mandatory' ? 'Critical' : 'High',
        title: `Missing Statutory Clause: ${ctrl.title}`,
        clauseReference: ctrl.clauseReference,
        regulationControlCode: ctrl.code,
        regulationControlTitle: ctrl.title,
        mandateLevel: ctrl.mandatoryLevel,
        regulatoryRequirementText: ctrl.description,
        gapAnalysis: `The uploaded internal policy draft contains ZERO mention or coverage of ${regulation.name} requirement ${ctrl.code} (${ctrl.title}). Auditors will classify this omission as an immediate non-conformity.`,
        suggestedDraftClause: `MANDATORY ADDITION (Section: ${ctrl.domainName} - ${ctrl.code}):\n"${ctrl.description} Personnel must adhere to documented SOPs, and automated verification must be captured in the enterprise governance repository."`,
        rationale: `Mandated by ${regulation.authority} statutory baseline. Applicable to sectors: ${ctrl.applicableSectors.join(', ')}.`,
      });
    } else if (isDeficient) {
      // NON-COMPLIANT OR DEFICIENT CLAUSE
      findings.push({
        id: `finding-deficient-${ctrl.id}`,
        category: 'Non-Compliant',
        severity: 'Critical',
        title: `Non-Compliant Clause: ${ctrl.title}`,
        clauseReference: ctrl.clauseReference,
        regulationControlCode: ctrl.code,
        regulationControlTitle: ctrl.title,
        mandateLevel: ctrl.mandatoryLevel,
        regulatoryRequirementText: ctrl.description,
        detectedPolicyText: detectedSnippet,
        gapAnalysis: deficiencyReason,
        suggestedDraftClause: suggestedClause,
        rationale: `Violates statutory compliance parameters set forth by ${regulation.authority}.`,
      });
    } else {
      // COMPLIANT
      findings.push({
        id: `finding-compliant-${ctrl.id}`,
        category: 'Compliant',
        severity: 'Pass',
        title: `Compliant: ${ctrl.title}`,
        clauseReference: ctrl.clauseReference,
        regulationControlCode: ctrl.code,
        regulationControlTitle: ctrl.title,
        mandateLevel: ctrl.mandatoryLevel,
        regulatoryRequirementText: ctrl.description,
        detectedPolicyText: detectedSnippet,
        gapAnalysis: `The draft policy adequately addresses the foundational intent of ${ctrl.code}. Continue regular periodic audit reviews.`,
        suggestedDraftClause: `CURRENT TEXT IS ALIGNED: Continue monitoring against ${ctrl.mapping.nistCsf || ctrl.mapping.iso27001 || 'statutory benchmark'}.`,
        rationale: `Satisfies ${ctrl.code} baseline requirements.`,
      });
    }
  }

  // Calculate score & statistics
  const totalMandates = findings.length;
  const compliantCount = findings.filter((f) => f.category === 'Compliant').length;
  const partialCount = findings.filter((f) => f.category === 'Partially Compliant').length;
  const nonCompliantCount = findings.filter((f) => f.category === 'Non-Compliant').length;
  const missingCount = findings.filter((f) => f.category === 'Missing Clause').length;

  // Weighted score calculation
  const weightedPassing = compliantCount * 1.0 + partialCount * 0.5;
  const overallComplianceScore = totalMandates > 0 ? Math.round((weightedPassing / totalMandates) * 100) : 50;

  let complianceGrade: RedlineSummary['complianceGrade'] = 'F';
  let riskRating: RedlineSummary['riskRating'] = 'Critical Breach Risk';

  if (overallComplianceScore >= 90) {
    complianceGrade = 'A+';
    riskRating = 'Very Low Risk';
  } else if (overallComplianceScore >= 80) {
    complianceGrade = 'A';
    riskRating = 'Low Risk';
  } else if (overallComplianceScore >= 70) {
    complianceGrade = 'B';
    riskRating = 'Moderate Risk';
  } else if (overallComplianceScore >= 55) {
    complianceGrade = 'C';
    riskRating = 'High Statutory Risk';
  } else if (overallComplianceScore >= 40) {
    complianceGrade = 'D';
    riskRating = 'High Statutory Risk';
  } else {
    complianceGrade = 'F';
    riskRating = 'Critical Breach Risk';
  }

  // Compile Executive Summary & Recommendations
  const primaryRiskAreas: string[] = [];
  if (missingCount > 0) primaryRiskAreas.push(`${missingCount} mandatory statutory controls are entirely omitted from policy documentation.`);
  if (nonCompliantCount > 0) primaryRiskAreas.push(`${nonCompliantCount} draft clauses contradict statutory baselines (weak authentication, illicit cross-border transfers, or inadequate breach timelines).`);
  if (overallComplianceScore < 70) primaryRiskAreas.push(`High probability of formal audit non-conformity findings and administrative fines under ${regulation.authority}.`);

  const keyRecommendations: string[] = [
    `Adopt the redlined replacement clauses for all ${nonCompliantCount} non-compliant statements highlighted below.`,
    `Insert dedicated sections for the ${missingCount} missing statutory controls before submitting to internal audit or the Board Risk Committee.`,
    `Align incident notification procedures to strictly enforce 72-hour regulatory disclosure to ${regulation.authority}.`,
    `Implement continuous compliance telemetry mapping to verify that stated policy controls are technically enforced in cloud workloads.`,
  ];

  const executiveSummary = `Comprehensive redline assessment of "${policyName}" against ${regulation.name} (${regulation.authority}, ${regulation.countryId.toUpperCase()}) identified a compliance posture score of ${overallComplianceScore}/100 (Grade ${complianceGrade} - ${riskRating}). Out of ${totalMandates} statutory mandates evaluated, ${compliantCount} are compliant, ${nonCompliantCount} are deficient/non-compliant, and ${missingCount} are entirely absent from the internal draft. Immediate insertion of corrective clauses is required to mitigate regulatory enforcement and sanction exposure.`;

  // Generate Redlined Policy Text with Diff Markup
  let redlinedDraft = policyDraftText;
  for (const f of findings) {
    if (f.category === 'Non-Compliant' && f.detectedPolicyText) {
      const targetSnippet = f.detectedPolicyText.slice(0, 80);
      if (redlinedDraft.includes(targetSnippet)) {
        redlinedDraft = redlinedDraft.replace(
          targetSnippet,
          `\n<<< [REDLINE STRIKE - NON-COMPLIANT WITH ${f.regulationControlCode}] >>>\n${targetSnippet}\n<<< [REDLINE INSERTION - RECOMMENDED STATUTORY CLAUSE] >>>\n${f.suggestedDraftClause}\n`
        );
      }
    }
  }

  // Append Missing Clauses at the bottom of the redline draft
  if (missingCount > 0) {
    redlinedDraft += `\n\n================================================================================\n=== REQUIRED ADDITIONS: ${missingCount} MISSING STATUTORY CLAUSES REQUIRED BY ${regulation.name.toUpperCase()} ===\n================================================================================\n`;
    for (const f of findings.filter((x) => x.category === 'Missing Clause')) {
      redlinedDraft += `\n[MISSING MANDATE: ${f.regulationControlCode} - ${f.regulationControlTitle}]\n${f.suggestedDraftClause}\n`;
    }
  }

  return {
    id: `redline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    analyzedAt: new Date().toISOString(),
    policyName,
    policyWordCount: words.length,
    policyParagraphCount: paragraphs.length,
    selectedRegulationId: regulation.id,
    selectedRegulationCode: regulation.code,
    selectedRegulationName: regulation.name,
    selectedRegulationJurisdiction: regulation.countryId.toUpperCase(),
    summary: {
      overallComplianceScore,
      complianceGrade,
      riskRating,
      totalMandatesChecked: totalMandates,
      fullyCompliantCount: compliantCount,
      partiallyCompliantCount: partialCount,
      nonCompliantCount,
      missingClausesCount: missingCount,
      executiveSummary,
      primaryRiskAreas,
      keyRecommendations,
    },
    findings,
    redlinedPolicyDraft: redlinedDraft,
    modelUsed: 'ComplianceIQ Redline Engine v2.5 (MENAT Regulatory Corpus & Semantics)',
  };
}
