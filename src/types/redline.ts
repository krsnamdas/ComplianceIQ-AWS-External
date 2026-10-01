export interface PolicyFinding {
  id: string;
  category: 'Missing Clause' | 'Non-Compliant' | 'Partially Compliant' | 'Compliant';
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass';
  title: string;
  clauseReference: string;
  regulationControlCode: string;
  regulationControlTitle: string;
  mandateLevel: 'Mandatory' | 'Recommended' | 'Conditional' | 'Guideline';
  regulatoryRequirementText: string;
  detectedPolicyText?: string;
  gapAnalysis: string;
  suggestedDraftClause: string;
  rationale: string;
  matchedLine?: number;
  highlightCoordinates?: { start: number; end: number };
}

export interface RedlineSummary {
  overallComplianceScore: number; // 0 - 100
  complianceGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  riskRating: 'Very Low Risk' | 'Low Risk' | 'Moderate Risk' | 'High Statutory Risk' | 'Critical Breach Risk';
  totalMandatesChecked: number;
  fullyCompliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  missingClausesCount: number;
  executiveSummary: string;
  primaryRiskAreas: string[];
  keyRecommendations: string[];
}

export interface RedlineAnalysisResult {
  id: string;
  analyzedAt: string;
  policyName: string;
  policyWordCount: number;
  policyParagraphCount: number;
  selectedRegulationId: string;
  selectedRegulationCode: string;
  selectedRegulationName: string;
  selectedRegulationJurisdiction: string;
  summary: RedlineSummary;
  findings: PolicyFinding[];
  redlinedPolicyDraft: string; // Policy with markup [[INSERT: ...]] and [[DEFICIENT: ...]]
  modelUsed: string;
}

export interface DraftPolicyPreset {
  id: string;
  name: string;
  targetRegulationId: string;
  targetRegulationName: string;
  category: string;
  description: string;
  policyDraftText: string;
}
