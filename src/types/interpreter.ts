export interface PeopleControlItem {
  id: string;
  title: string;
  description: string;
  whatToCheck: string;
  keyRoles: string[];
  competencyOrTraining: string;
}

export interface ProcessControlItem {
  id: string;
  title: string;
  description: string;
  whatToCheck: string;
  reviewCadence: string;
  governanceArtifacts: string[];
}

export interface TechnicalControlItem {
  id: string;
  title: string;
  description: string;
  whatToCheck: string;
  toolingCategories: string[];
  technicalSafeguards: string[];
}

export interface Nist80053Mapping {
  controlId: string;
  controlName: string;
  family: string;
  description: string;
  relevance: string;
}

export interface NistCsfV2Mapping {
  subcategoryId: string;
  functionName: 'Govern (GV)' | 'Identify (ID)' | 'Protect (PR)' | 'Detect (DE)' | 'Respond (RS)' | 'Recover (RC)';
  category: string;
  description: string;
}

export interface NistAiRmfMapping {
  functionId: 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';
  subcategoryId: string;
  title: string;
  description: string;
}

export interface Iso27001Mapping {
  clauseId: string;
  title: string;
  category: 'Organizational (A.5)' | 'People (A.6)' | 'Physical (A.7)' | 'Technological (A.8)';
  description: string;
}

export interface CisControlMapping {
  controlNumber: number;
  controlTitle: string;
  safeguardId: string;
  safeguardTitle: string;
  assetType: string;
  implementationGroup: 'IG1' | 'IG2' | 'IG3';
  description: string;
}

export type SsrmResponsibility = 'CSP-Owned' | 'CSC-Owned' | 'Shared (Independent)' | 'Shared (Dependent)';

export interface CsaCcmV4Mapping {
  controlId: string;
  controlTitle: string;
  domainId: string;
  domainName: string;
  controlSpecification: string;
  ssrmOwnership: {
    iaas: SsrmResponsibility;
    paas: SsrmResponsibility;
    saas: SsrmResponsibility;
  };
  ownershipRationale: string;
  continuousAuditMetric?: {
    metricId: string;
    description: string;
    expression: string;
    rules?: string;
    sloRecommendation: string;
  };
}

export interface AuditorChecklistItem {
  checkId: string;
  domain: 'People' | 'Process' | 'Technical';
  auditQuestion: string;
  requiredEvidence: string;
  testMethod: 'Inquiry' | 'Inspection' | 'Observation' | 'Re-performance';
  severityIfMissing: 'Critical' | 'High' | 'Medium';
}

export interface ControlInterpretationResult {
  id: string;
  timestamp: string;
  sourceInput: {
    controlText: string;
    controlId?: string;
    regulationName?: string;
    jurisdiction?: string;
    cloudModelTarget?: 'All' | 'IaaS' | 'PaaS' | 'SaaS' | 'Hybrid';
  };
  inSimpleTerms: {
    summary: string;
    coreRequirement: string;
    whyItMatters: string;
    riskIfNotCompliant: string;
  };
  controlsToCheck: {
    people: PeopleControlItem[];
    process: ProcessControlItem[];
    technical: TechnicalControlItem[];
  };
  technicalAlignments: {
    nist800_53: Nist80053Mapping[];
    nistCsfV2: NistCsfV2Mapping[];
    nistAiRmf?: NistAiRmfMapping[];
    iso27001_2022: Iso27001Mapping[];
    cisControlsV8: CisControlMapping[];
    csaCcmV4: CsaCcmV4Mapping;
  };
  auditorChecklist: AuditorChecklistItem[];
  modelUsed: string;
}

export interface InterpreterPreset {
  id: string;
  badge: string;
  title: string;
  jurisdiction: string;
  regulationName: string;
  controlId: string;
  controlText: string;
  cloudModelTarget: 'All' | 'IaaS' | 'PaaS' | 'SaaS' | 'Hybrid';
}
