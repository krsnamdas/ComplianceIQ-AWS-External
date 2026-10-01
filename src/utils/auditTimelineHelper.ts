import { AuditFrequency, RegulatoryCategory, RegulationNature } from '../types/regulatory';

export const AUDIT_FREQUENCY_OPTIONS: { id: AuditFrequency; label: string; description: string }[] = [
  { id: 'Annually', label: 'Annually', description: 'Comprehensive annual compliance and control attestation cycle' },
  { id: 'Bi-Annually', label: 'Bi-Annually', description: 'Twice yearly assessment cycle (H1 & H2 attestation)' },
  { id: 'Quarterly', label: 'Quarterly', description: 'Quarterly periodic control verification (Q1 / Q2 / Q3 / Q4)' },
  { id: 'Monthly', label: 'Monthly', description: 'Continuous monthly operational and security monitoring' },
  { id: 'NA', label: 'NA (Not Applicable)', description: 'Event-driven, incident-triggered, or non-periodic' },
  { id: 'Unknown', label: 'Unknown', description: 'Periodic timeline to be clarified by supervisory authority' },
];

export const REGULATION_NATURE_OPTIONS: { id: RegulationNature; label: string; description: string }[] = [
  { id: 'Tech', label: 'Tech Regulation', description: 'Technical baseline, cybersecurity, cloud, and architecture rules' },
  { id: 'Hybrid', label: 'Hybrid Regulation', description: 'Dual operational and legal regime with direct tech obligations' },
  { id: 'Non-Tech', label: 'Non-Tech (Tech Impact)', description: 'Broad statutory framework with significant technology impact' },
];

export const CATEGORY_OPTIONS: { id: RegulatoryCategory; label: string; iconName?: string }[] = [
  { id: 'tech_cyber', label: 'Cybersecurity Baseline' },
  { id: 'tech_ai', label: 'Artificial Intelligence & Ethics' },
  { id: 'tech_data_privacy', label: 'Data Privacy & Sovereignty' },
  { id: 'tech_cloud', label: 'Cloud Security & Outsourcing' },
  { id: 'tech_operational_resilience', label: 'Operational Resilience & DORA-like' },
  { id: 'tech_ot_ics', label: 'OT & SCADA Cyber' },
  { id: 'tech_space_quantum', label: 'Space & Quantum Tech' },
  { id: 'tech_fintech_payments', label: 'FinTech, Open Banking & Crypto' },
  { id: 'tech_risk_others', label: 'Technology Risk(Others)' },
  { id: 'non_tech_impact', label: 'Non-Tech Statutory (Tech Impact)' },
];

export function getAuditTimelineDefault(frequency: AuditFrequency = 'Annually'): string {
  switch (frequency) {
    case 'Annually':
      return 'Annual Audit Cycle (Q4 Mandatory Statutory Attestation)';
    case 'Bi-Annually':
      return 'Bi-Annual Review Cycle (H1 Mid-Year & H2 Year-End Attestation)';
    case 'Quarterly':
      return 'Quarterly Periodic Verification (Q1, Q2, Q3, Q4 Reporting Windows)';
    case 'Monthly':
      return 'Monthly Continuous Control Monitoring & Operational KPI Review';
    case 'NA':
      return 'Event-Driven / Post-Incident Attestation Cycle';
    case 'Unknown':
      return 'Timeline Pending Supervisory Authority Circular Guidance';
    default:
      return 'Annual Audit Cycle (Q4 Mandatory Statutory Attestation)';
  }
}

/**
 * Ensures enactment period is formatted as mm/yyyy (e.g. 09/2024).
 * If existing is already mm/yyyy, returns it.
 * Otherwise parses effectiveDate or year.
 */
export function formatEnactmentPeriod(existing?: string, effectiveDate?: string, yearEnacted?: number): string {
  if (existing && /^\d{2}\/\d{4}$/.test(existing.trim())) {
    return existing.trim();
  }
  if (existing && /^\d{4}-\d{2}/.test(existing.trim())) {
    const parts = existing.trim().split('-');
    return `${parts[1]}/${parts[0]}`;
  }
  if (effectiveDate && /^\d{4}-\d{2}/.test(effectiveDate.trim())) {
    const parts = effectiveDate.trim().split('-');
    return `${parts[1]}/${parts[0]}`;
  }
  const year = yearEnacted || 2024;
  return `01/${year}`;
}
