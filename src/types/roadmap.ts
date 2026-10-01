import { SectorType, RegulatoryCategory } from './regulatory';

export type QuarterId =
  | '2026-Q4'
  | '2027-Q1'
  | '2027-Q2'
  | '2027-Q3'
  | '2027-Q4'
  | '2028-Q1'
  | '2028-Q2'
  | '2028-Q3'
  | '2028-Q4';

export type InvestmentCategory =
  | 'infrastructure_tooling'
  | 'external_audit_assurance'
  | 'internal_resourcing_fte'
  | 'legal_advisory_filings';

export type BudgetApprovalStatus = 'approved' | 'under_review' | 'pending_allocation' | 'deferred';

export type OrgScale = 'enterprise' | 'midmarket' | 'startup';

export interface InvestmentWorkstream {
  category: InvestmentCategory;
  categoryName: string;
  description: string;
  costUSD: number;
  capexRatio: number; // e.g. 0.8 for software/hardware license, 0 for advisory
}

export interface RoadmapMilestone {
  id: string;
  regulationId: string;
  regulationCode: string;
  regulationName: string;
  authority: string;
  authorityShort: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  targetSectors: SectorType[];
  category: RegulatoryCategory;
  categoryLabel: string;

  // Timing
  quarter: QuarterId;
  quarterLabel: string;
  deadlineDate: string; // YYYY-MM-DD
  phaseName: string;
  title: string;
  description: string;
  urgency: 'Critical' | 'High' | 'Medium';
  enforcementType:
    | 'Mandatory Audit'
    | 'Statutory Enactment'
    | 'Grace Period Expiry'
    | 'Technical Standard'
    | 'Supervisory Filing';

  // Long-Term Compliance Investment Requirements
  baseInvestmentUSD: number; // Baseline cost (mid-market)
  capexUSD: number;
  opexUSD: number;
  fteRequirementMonths: number;
  workstreams: InvestmentWorkstream[];

  // Risk & Penalties
  maxStatutoryFine: string;
  regulatoryInterventionRisk: string;

  // Implementation Work Items
  actionItems: string[];
  recommendedTechStack?: string[];
  primaryCompetencies?: string[];
  officialUrl?: string;
}

export interface QuarterlySummary {
  quarter: QuarterId;
  quarterLabel: string;
  year: number;
  milestones: RoadmapMilestone[];
  milestoneCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalInvestmentUSD: number;
  totalCapexUSD: number;
  totalOpexUSD: number;
  totalFteMonths: number;
  topAuthorities: string[];
}

export interface RoadmapFilterState {
  quarter: string; // 'all' | 'next4' | '2027' | '2028' | QuarterId
  countryId: string;
  sector: string;
  category: string;
  urgency: string;
  search: string;
  investmentCategory: string;
  orgScale: OrgScale;
}
