export type RegulatoryNewsCategory =
  | 'Cybersecurity'
  | 'AI Governance'
  | 'Data Privacy & Cloud'
  | 'FinTech & Banking'
  | 'Critical Infrastructure'
  | 'Telecom & Cross-Border';

export type RegulatoryImpactLevel = 'High' | 'Medium' | 'Advisory';

export type RegulatorySentiment = 'Impactful' | 'Neutral' | 'Consultation Phase';

export interface GroundedNewsItem {
  id: string;
  title: string;
  summary: string;
  jurisdiction: string;
  countryCode: string; // ISO 2-letter e.g. 'sa', 'ae', 'qa'
  countryFlag: string;
  authority: string;
  category: RegulatoryNewsCategory;
  impactLevel: RegulatoryImpactLevel;
  sentiment: RegulatorySentiment;
  sentimentRationale?: string;
  publishedAt: string;
  timeAgo: string;
  sourceName: string;
  sourceUrl: string;
  searchGroundingQuery?: string;
  tags: string[];
  keyObligations?: string[];
  affectedSectors?: string[];
}

export interface NewsFeedResponse {
  news: GroundedNewsItem[];
  searchQueries: string[];
  sourceCitations: Array<{ title: string; url: string }>;
  lastUpdated: string;
  isLiveGrounded: boolean;
  totalCount: number;
}
