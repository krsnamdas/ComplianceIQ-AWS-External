export type RegulatoryCategory =
  | 'tech_cyber'
  | 'tech_ai'
  | 'tech_data_privacy'
  | 'tech_cloud'
  | 'tech_operational_resilience'
  | 'tech_ot_ics'
  | 'tech_space_quantum'
  | 'tech_fintech_payments'
  | 'tech_risk_others'
  | 'non_tech_impact';

export type AuditFrequency = 'Annually' | 'Quarterly' | 'Bi-Annually' | 'Monthly' | 'NA' | 'Unknown';

export type RegulationNature = 'Tech' | 'Hybrid' | 'Non-Tech';

export type SectorType =
  | 'Banking'
  | 'Financial Services'
  | 'Insurance'
  | 'Payments'
  | 'Fintech'
  | 'Government'
  | 'Critical Infrastructure'
  | 'Utilities'
  | 'Oil & Gas'
  | 'Mining & Extraction'
  | 'Power & Energy'
  | 'Cloud & Hyperscalers'
  | 'Telco'
  | 'Digital Tech Startups'
  | 'Retail & E-Commerce'
  | 'Manufacturing'
  | 'Automotive'
  | 'Space & Aerospace'
  | 'Gaming & Entertainment'
  | 'Healthcare';

export interface StandardMapping {
  nistCsf?: string; // e.g. "PR.AC-01, PR.DS-02, GV.OC-01"
  iso27001?: string; // e.g. "A.5.15, A.8.20, A.8.24"
  csaCcm?: string; // e.g. "IAM-02, CRY-01, DCS-01"
}

export interface ControlDetail {
  id: string;
  code: string;
  domainNumber: string;
  domainName: string;
  subDomainName?: string;
  title: string;
  description: string;
  clauseReference: string;
  mandatoryLevel: 'Mandatory' | 'Recommended' | 'Conditional' | 'Guideline';
  mandatoryConfidence?: number; // e.g. 95 for 95% confident
  confidenceInterval?: string; // e.g. "90% - 98%"
  confidenceRationale?: string;
  applicableSectors: SectorType[];
  mapping: StandardMapping;
}

export interface RequirementConfidenceResult {
  id: string;
  code: string;
  label: 'Mandatory' | 'Guideline' | 'Conditional' | 'Recommended';
  confidenceScore: number; // e.g. 96 for 96%
  confidenceInterval: string; // e.g. "93% - 98%"
  rationale: string;
  statutoryKeyword?: string;
  enforcementType?: string;
  isGeminiExtracted?: boolean;
}

export interface RegulationRequirementsAnalysis {
  regulationId: string;
  regulationCode: string;
  overallMandate: {
    label: 'Mandatory' | 'Guideline' | 'Conditional Mandate';
    confidenceScore: number;
    confidenceInterval: string;
    rationale: string;
  };
  requirements: RequirementConfidenceResult[];
  modelUsed: string;
  timestamp: string;
  isLiveGemini: boolean;
}

export interface VersionHistoryItem {
  version: string;
  releaseDate: string;
  effectiveDate: string;
  status: 'Superseded' | 'Current Version' | 'Draft / Pending';
  summaryOfChanges: string;
}

export interface VersionDiff {
  id: string;
  regulationId: string;
  regulationCode: string;
  regulationName: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  previousVersion: string;
  previousDate: string;
  latestVersion: string;
  latestDate: string;
  transitionDeadline?: string;
  headlineSummary: string;
  changeType: 'Major Overhaul' | 'Regulatory Amendment' | 'Statutory Modernization' | 'Scope Expansion';
  keyDifferences: {
    category: string;
    previousState: string;
    newState: string;
    impactLevel: 'Critical' | 'High' | 'Medium';
    practicalGuidance: string;
  }[];
  affectedSectors: SectorType[];
  complianceActionItems: string[];
  officialAmendmentUrl?: string;
}

export interface Regulation {
  id: string;
  code: string;
  name: string;
  arabicName?: string;
  authority: string;
  authorityShort: string;
  countryId: string;
  category: RegulatoryCategory;
  categoryLabel: string;
  isTech: boolean;
  regulationNature?: RegulationNature;
  regulatoryMandate?: {
    type: 'Mandatory' | 'Guideline' | 'Conditional Mandate';
    confidenceScore: number; // e.g. 96 for 96%
    confidenceInterval: string; // e.g. "92% - 98%"
    rationale: string; // e.g. "Enacted via Royal Decree with statutory financial penalties"
  };
  status: 'Enacted' | 'Amended' | 'Draft / Public Consultation';
  currentVersion?: string;
  createdDate?: string;
  yearEnacted: number;
  enactmentPeriod?: string; // Format: Month/year (mm/yyyy) e.g. "09/2024"
  effectiveDate: string;
  auditFrequency?: AuditFrequency; // Period of assessment/review: Annually, Quarterly, Bi-Annually, Monthly, NA, Unknown
  auditTimeline?: string; // Timeline based on audit frequency (e.g. "Annual Audit (Q4 Statutory Attestation)")
  lastUpdated: string;
  scopeSummary: string;
  targetSectors: SectorType[];
  officialUrl: string;
  documentPdfUrl?: string;
  controlStructure: {
    domainsCount: number;
    subDomainsCount: number;
    totalControlsCount: number;
    domainList: string[];
  };
  sampleControls: ControlDetail[];
  versionHistory?: VersionHistoryItem[];
  versionDiffId?: string;
}

export interface ScrapedSource {
  id: string;
  countryId: string;
  countryName: string;
  authority: string;
  authorityShort: string;
  sourceName: string;
  url: string;
  category:
    | 'Official Gazette & Legal Portal'
    | 'Cybersecurity Agency'
    | 'Data Protection Authority'
    | 'Central Bank & Financial Regulatory'
    | 'Telecommunications & Cloud Authority'
    | 'Critical Infrastructure & Energy'
    | 'Capital Markets & Crypto';
  checkFrequency: 'Every 48 Hours' | 'Daily' | 'Weekly';
  lastChecked: string;
  httpStatus: number;
  status: 'Active & Verified' | 'Pending Review' | 'Redirect/Changed' | 'Offline';
  etagOrHash?: string;
  notes?: string;
  isUserAdded?: boolean;
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 2 or 3 letter
  flag: string;
  macroRegion?: 'Middle East' | 'North Africa, The Sahel, & Horn of Africa';
  region: 'GCC' | 'Middle East' | 'North Africa' | 'Levant & Other' | 'The Sahel' | 'Horn of Africa';
  primaryAuthorities: string[];
  capital: string;
  totalRegulationsCount: number;
  techRegulationsCount: number;
  nonTechRegulationsCount: number;
  description: string;
}

export interface RegulatoryUpdate {
  id: string;
  countryId: string;
  countryName: string;
  title: string;
  authority: string;
  type: 'New Standard' | 'Regulatory Amendment' | 'Public Consultation' | 'Enforcement / Circular';
  category: RegulatoryCategory;
  publicationDate: string;
  effectiveDate?: string;
  status: 'Active' | 'Under Discussion' | 'Draft' | 'Upcoming';
  impactLevel: 'Critical' | 'High' | 'Medium';
  targetSectors: SectorType[];
  summary: string;
  keyRequirements: string[];
  sourceUrl: string;
  verifiedOfficialSource: boolean;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  sourceName: string;
  targetUrl: string;
  status: 'Checked - No Changes' | 'Update Detected' | 'Draft Identified';
  httpStatus: number;
  findingsCount: number;
  summary: string;
}

export interface ScraperStatus {
  lastRunTimestamp: string;
  nextScheduledRunTimestamp: string;
  frequency: string;
  isRunning: boolean;
  totalSourcesMonitored: number;
  sourcesOnline: number;
  recentLogs: ScraperLog[];
  lastRegulationsScrapeTime?: string;
  linksAuditStatus?: {
    lastAuditTimestamp: string;
    totalAudited: number;
    healthy: number;
    broken: number;
    redirects: number;
    wafProtected: number;
  };
}

export interface TimelineMilestone {
  label: string;
  date: string;
  completed?: boolean;
}

export interface TimelineEvent {
  id: string;
  /** Registry regulation id this milestone maps to. Omitted for standalone
   *  milestones that have no matching entry in the regulation registry. */
  regulationId?: string;
  /** True when this milestone intentionally has no linked registry regulation
   *  (e.g. a circular/directive not tracked as a standalone regulation). */
  standalone?: boolean;
  regulationCode: string;
  title: string;
  authority: string;
  authorityShort: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  macroRegion?: 'Middle East' | 'North Africa, The Sahel, & Horn of Africa';
  category: RegulatoryCategory;
  categoryLabel: string;
  targetSectors: SectorType[];

  // Date attributes for Gantt chart & milestones
  startDate: string; // YYYY-MM-DD (e.g. publication or draft initiation)
  transitionStartDate?: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD (enforcement date or audit cut-off)
  
  eventType: 
    | 'Enforcement Deadline'
    | 'Grace Period Expiry'
    | 'Major Overhaul'
    | 'Statutory Enactment'
    | 'Public Consultation'
    | 'Compliance Audit Window';

  status: 'Completed / Active' | 'Imminent (<90 Days)' | 'Upcoming (2026-2027)' | 'In Consultation' | 'Long-Term Horizon (2027+)';
  urgency: 'Critical' | 'High' | 'Medium' | 'Informational';
  
  description: string;
  gracePeriodSummary?: string;
  penaltiesSummary?: string;
  milestones: TimelineMilestone[];
  complianceChecklist: string[];
  officialReference: string;
  officialUrl: string;
  versionDiffId?: string;
}

export type WatchlistPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface WatchlistPin {
  regulationId: string;
  pinnedAt: string; // ISO date string
  notes?: string;
  priority: WatchlistPriority;
  tags?: string[];
  notifyOnAmendments: boolean;
  notifyOnConsultations: boolean;
  notifyOnDeadlines: boolean;
  assignedTo?: string;
}

export interface WatchlistNotification {
  id: string;
  regulationId: string;
  regulationCode: string;
  regulationName: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  title: string;
  summary: string;
  date: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Informational';
  type: 
    | 'Statutory Amendment' 
    | 'Enforcement Circular' 
    | 'Public Consultation' 
    | 'Version Diff Published' 
    | 'Approaching Deadline'
    | 'Scraper Finding';
  read: boolean;
  sourceUrl?: string;
  versionDiffId?: string;
  daysRemaining?: number;
  keyActionItems?: string[];
}

export interface WatchlistPreferences {
  emailAlertSimulation: boolean;
  soundAlerts: boolean;
  urgencyThreshold: 'All' | 'HighAndCritical' | 'CriticalOnly';
  autoPinOnExport: boolean;
}

export interface DomainOverlapItem {
  domainName: string;
  overlapPercentage: number;
  status: 'Full Equivalency' | 'Substantial Overlap' | 'Partial Synergy' | 'Distinct / No Overlap';
  notes: string;
}

export interface ControlComparisonMatch {
  id: string;
  domainName: string;
  controlA?: {
    code: string;
    title: string;
    description: string;
    clause: string;
  };
  controlB: {
    code: string;
    title: string;
    description: string;
    clause: string;
    mandatoryLevel: string;
  };
  similarityLevel: 'Equivalent' | 'Partial' | 'Unique to Reg B';
  loeAssessment: 'Reuse Prior Evidence' | 'Minor Delta Review' | 'Net-New Audit Required';
  mappingStandard?: string;
}

export interface RegulationComparisonResult {
  regulationA: Regulation;
  regulationB: Regulation;
  overlapPercentage: number; // 0 to 100
  isUnrelated: boolean;
  unrelatedReason?: string;
  harmonizationTier: 'Identical / Harmonized' | 'High Overlap' | 'Moderate Overlap' | 'Low Overlap' | 'Unrelated / Disjoint';
  levelOfEffort: {
    tier: 'Low Effort (Fast-Track)' | 'Moderate Effort' | 'High Effort' | 'Full De Novo Assessment';
    estimatedPercentageNewWork: number;
    estimatedWeeks: string;
    timelineReductionPercentage: number;
    reusableArtifacts: string[];
    uniqueDeltaRequirements: string[];
  };
  controlsCount: {
    totalA: number;
    totalB: number;
    equivalentCount: number;
    partialCount: number;
    uniqueToBCount: number;
  };
  domainBreakdown: DomainOverlapItem[];
  sampleControlMatches: ControlComparisonMatch[];
  aiAnalysis?: string;
}
