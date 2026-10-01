export type MaturitySectorId =
  | 'ai'
  | 'cyber'
  | 'privacy'
  | 'cloud'
  | 'fintech'
  | 'resilience'
  | 'telco'
  | 'ot_ics';

export interface MaturitySectorInfo {
  id: MaturitySectorId;
  name: string;
  shortName: string;
  categoryKey: string;
  description: string;
  benchmarkStandards: string[];
  regulatoryFocus: string;
}

export interface HeatmapCellData {
  countryId: string;
  countryName: string;
  countryFlag: string;
  region: 'GCC' | 'Middle East' | 'North Africa' | 'Levant & Other' | 'The Sahel' | 'Horn of Africa';
  macroRegion?: 'Middle East' | 'North Africa, The Sahel, & Horn of Africa';
  sectorId: MaturitySectorId;
  sectorName: string;
  score: number; // 0 to 100
  level: 1 | 2 | 3 | 4 | 5;
  levelLabel: string;
  regulationsCount: number;
  mandatoryControlsCount: number;
  primaryRegulationCodes: string[];
  primaryAuthorities: string[];
  keyMandates: string[];
  penaltyRisk: 'Extreme' | 'High' | 'Moderate' | 'Low';
  enforcementStatus: 'Active Statutory Fines' | 'Phased Implementation' | 'Consultation Draft' | 'Sectoral Guidelines';
  gapAnalysis: string;
}

export interface CountryMaturitySummary {
  countryId: string;
  countryName: string;
  countryFlag: string;
  region: string;
  overallMaturityScore: number;
  totalRegulations: number;
  totalMandatoryControls: number;
  aiMaturityScore: number;
  cyberMaturityScore: number;
  privacyMaturityScore: number;
  cloudMaturityScore: number;
  fintechMaturityScore: number;
  sectorRanks: Record<MaturitySectorId, number>;
  primaryEnforcementAuthority: string;
  maturityTier: 'Tier 1 - World Class & Strict' | 'Tier 2 - Advanced & Expanding' | 'Tier 3 - Structured Framework' | 'Tier 4 - Emerging Guidelines';
}

export interface HeatmapFilterState {
  selectedSector: MaturitySectorId | 'all';
  selectedRegion: string;
  metric: 'score' | 'regulationsCount' | 'mandatoryControlsCount';
  sortBy: 'density' | 'maturity' | 'alphabetical' | 'region';
  minMaturityLevel: number;
  searchQuery: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: { title: string; url: string }[];
  searchQueries?: string[];
  rolePersona?: string;
  isStreaming?: boolean;
  error?: string;
}
