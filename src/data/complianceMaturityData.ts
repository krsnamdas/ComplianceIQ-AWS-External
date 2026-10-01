import { MaturitySectorId, MaturitySectorInfo, HeatmapCellData, CountryMaturitySummary } from '../types/heatmap';
import { ALL_MENAT_COUNTRIES } from './expandedCountriesData';

export const MATURITY_SECTORS: MaturitySectorInfo[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence & Generative AI',
    shortName: 'AI & GenAI',
    categoryKey: 'tech_ai',
    description: 'Statutory guardrails for algorithmic transparency, foundation model risk classification, bias audits, and generative AI deployment ethics.',
    benchmarkStandards: ['SDAIA AI Ethics', 'UAE AI Strategy & Guide', 'EU AI Act Alignment', 'ISO/IEC 42001', 'NIST AI RMF'],
    regulatoryFocus: 'High compliance density in KSA & UAE; emerging consultation frameworks in Qatar, Turkey, and Egypt.',
  },
  {
    id: 'cyber',
    name: 'Cybersecurity & Critical Infrastructure',
    shortName: 'Cybersecurity',
    categoryKey: 'tech_cyber',
    description: 'Mandatory national cybersecurity controls, SOC requirements, incident reporting SLAs, and critical national infrastructure defense.',
    benchmarkStandards: ['NCA ECC-1:2018', 'UAE NESA / ISR', 'Qatar NIA v2.0', 'NIST CSF 2.0', 'ISO/IEC 27001:2022'],
    regulatoryFocus: 'Highest regional regulatory density with mandatory statutory audits, criminal penalties, and licensing gates across GCC & North Africa.',
  },
  {
    id: 'privacy',
    name: 'Data Protection & Privacy (PDPL / GDPR)',
    shortName: 'Data Privacy',
    categoryKey: 'tech_data_privacy',
    description: 'Comprehensive personal data protection acts, cross-border data transfer mechanisms, DPO appointments, and consent management.',
    benchmarkStandards: ['Saudi PDPL', 'UAE Federal Law 45/2021', 'Qatar Law 13/2016', 'Turkey KVKK No. 6698', 'Egypt Law 151/2020'],
    regulatoryFocus: 'Aggressive enforcement with strict local data localization and regulatory pre-approval for offshore transfers.',
  },
  {
    id: 'cloud',
    name: 'Cloud Sovereignty & Hyperscale Compliance',
    shortName: 'Cloud Sovereignty',
    categoryKey: 'tech_cloud',
    description: 'Classification of government & financial cloud data, in-country CSP licensing, encryption key ownership, and tenant boundary isolation.',
    benchmarkStandards: ['CST Cloud Computing Framework', 'DESC Cloud Security Standard', 'Qatar Sovereign Cloud Policy', 'CSA CCM v4'],
    regulatoryFocus: 'Strict sovereign cloud and security clearance tiers (Class A-C) restricting classified workload egress.',
  },
  {
    id: 'fintech',
    name: 'Fintech, Open Banking & Crypto Assets',
    shortName: 'Fintech & Payments',
    categoryKey: 'tech_fintech_payments',
    description: 'Central bank cybersecurity mandates, API security for open banking, stablecoin reserves, and anti-money laundering digital controls.',
    benchmarkStandards: ['SAMA Cyber Framework', 'CBUAE Open Banking Framework', 'CBB Crypto Modules', 'VARA Virtual Asset Rules'],
    regulatoryFocus: 'Rigorous central bank licensing with automated regulatory reporting (SupTech) integration.',
  },
  {
    id: 'resilience',
    name: 'Operational Resilience & Disaster Recovery',
    shortName: 'Resilience & BCM',
    categoryKey: 'tech_operational_resilience',
    description: 'Mandatory recovery point/time objectives (RPO/RTO), third-party concentration risk, and systemic crisis simulation drills.',
    benchmarkStandards: ['ISO 22301:2019', 'NCA BCM-1:2020', 'CBUAE Outsourcing Standards', 'Basel Committee Principles'],
    regulatoryFocus: 'Annual stress-testing and mandatory live unannounced failover drills for Tier-1 institutions.',
  },
  {
    id: 'telco',
    name: 'Telecommunications & Digital Platforms',
    shortName: 'Telecom & Platforms',
    categoryKey: 'tech_cyber',
    description: 'Spectrum cybersecurity, submarine cable integrity, VoIP licensing, lawful interception, and OTT platform governance.',
    benchmarkStandards: ['CST KSA Rules', 'TDRA UAE Federal Regulations', 'BTK Turkey Regulations', 'ITU-T Recommendations'],
    regulatoryFocus: 'Strict carrier-grade lawful intercept compliance and local POP hosting requirements.',
  },
  {
    id: 'ot_ics',
    name: 'OT / Industrial Control Systems (Energy & Utilities)',
    shortName: 'OT & Industrial ICS',
    categoryKey: 'tech_ot_ics',
    description: 'SCADA, DCS, and pipeline cyber safety mandates safeguarding oil & gas, desalination, power generation, and port logistics.',
    benchmarkStandards: ['NCA CSCC-1:2019', 'IEC 62443', 'NIST SP 800-82', 'Aramco CCC Cybersecurity Standard'],
    regulatoryFocus: 'Air-gapped architecture verification, physical-digital perimeter zoning, and supply chain inspection.',
  },
];

// Helper to determine maturity level from numeric score (0-100)
export function getMaturityLevel(score: number): { level: 1 | 2 | 3 | 4 | 5; label: string } {
  if (score >= 86) return { level: 5, label: 'Level 5 - World-Class & Pioneer' };
  if (score >= 70) return { level: 4, label: 'Level 4 - Advanced & Enforced' };
  if (score >= 50) return { level: 3, label: 'Level 3 - Defined Standards' };
  if (score >= 26) return { level: 2, label: 'Level 2 - Emerging Framework' };
  return { level: 1, label: 'Level 1 - Initial / Ad-Hoc' };
}

// Master data matrix generator for all 24 MENAT countries × 8 regulatory sectors
export function generateComplianceMaturityMatrix(): HeatmapCellData[] {
  // Pre-calculated base scores for high-fidelity regional realism
  const countryBaseMap: Record<
    string,
    {
      ai: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      cyber: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      privacy: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      cloud: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      fintech: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      resilience: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      telco: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
      ot_ics: { score: number; regs: number; ctrls: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low'; codes: string[]; auth: string[]; keyMandates: string[]; fines: string; gap: string };
    }
  > = {
    ksa: {
      ai: {
        score: 94,
        regs: 4,
        ctrls: 28,
        penalty: 'Extreme',
        codes: ['SDAIA-AI-ETHICS-2023', 'SDAIA-GEN-AI-2024', 'SDAIA-DATA-AI-STD'],
        auth: ['SDAIA', 'NCA', 'CST'],
        keyMandates: ['Mandatory algorithmic transparency & bias audit', 'SDAIA national AI registry notification', 'Local data residency for AI training corpora', 'Watermarking generative AI synthetic media'],
        fines: 'Up to SAR 5,000,000 ($1.33M) + executive penal liability',
        gap: 'Mature leadership; ongoing standardization of sovereign foundation models and dual-use defense AI.',
      },
      cyber: {
        score: 98,
        regs: 6,
        ctrls: 114,
        penalty: 'Extreme',
        codes: ['NCA-ECC-1:2018', 'NCA-CSCC-1:2019', 'NCA-TCC-1:2020', 'SAMA-CSF-V3'],
        auth: ['NCA', 'SAMA', 'CST'],
        keyMandates: ['Strict annual third-party compliance audit certification', 'Mandatory 24/7 SOC integration with NCA NCSC', 'Zero-trust multi-factor authentication on all administrative portals', 'Air-gapped critical backup immutable replication'],
        fines: 'Severe statutory stop-work orders, license revocation, and up to SAR 10,000,000 fines',
        gap: 'Benchmark authority globally; focus on extending supply chain cyber audits to Tier-3 subcontractors.',
      },
      privacy: {
        score: 92,
        regs: 3,
        ctrls: 42,
        penalty: 'Extreme',
        codes: ['SA-PDPL-2023', 'SDAIA-TRANSFERS-2024'],
        auth: ['SDAIA'],
        keyMandates: ['Ex-ante regulatory pre-approval for cross-border data egress', 'DPO registration with national register', 'Mandatory privacy impact assessment (PIA) for sensitive profiling'],
        fines: 'Up to SAR 5,000,000 and possible imprisonment for illicit disclosure of health/credit data',
        gap: 'Full enforcement active post-grace period; rapid issuance of binding adequacy decisions for trade partners.',
      },
      cloud: {
        score: 95,
        regs: 4,
        ctrls: 38,
        penalty: 'Extreme',
        codes: ['CST-CR-CLASS-2021', 'NCA-CCC-1:2020'],
        auth: ['CST', 'NCA'],
        keyMandates: ['Mandatory CST Class-C CSP licensing', 'Physical sovereign in-kingdom data residency', 'Cryptographic key retention within national territory'],
        fines: 'Up to SAR 25,000,000 and total network disconnection',
        gap: 'Broad adoption of sovereign Google/Oracle/AWS regions; hyperscale compliance standardized.',
      },
      fintech: {
        score: 93,
        regs: 4,
        ctrls: 45,
        penalty: 'Extreme',
        codes: ['SAMA-CSF-2022', 'SAMA-OPEN-BANKING-2023'],
        auth: ['SAMA', 'CMA'],
        keyMandates: ['Open Banking API security conformance', 'Instant fraud telemetry sharing with SAMA', 'Dual-site disaster recovery within 2-hour RTO'],
        fines: 'Direct daily punitive debit from reserve accounts up to SAR 1,000,000/day',
        gap: 'Extremely high regulatory oversight; sandbox transition to production is rapid and rigorously tested.',
      },
      resilience: {
        score: 90,
        regs: 3,
        ctrls: 32,
        penalty: 'High',
        codes: ['NCA-BCM-1:2020', 'SAMA-BCM-STD'],
        auth: ['NCA', 'SAMA'],
        keyMandates: ['Unannounced live failover drill annually', 'Independent secondary telecommunications route', 'RPO < 15 minutes for critical transaction logs'],
        fines: 'Regulatory sanctions and executive accountability audits',
        gap: 'Leading resilience standards; expanding mandatory requirements to major digital e-commerce supply chains.',
      },
      telco: {
        score: 92,
        regs: 3,
        ctrls: 26,
        penalty: 'High',
        codes: ['CST-TELCO-CYBER-2022', 'CST-INTERNET-EXCHANGE'],
        auth: ['CST'],
        keyMandates: ['Subsea cable landing point redundancy', 'DDoS volumetric mitigation scrubbing capacity', 'SIM biometric registration verification'],
        fines: 'Up to SAR 20,000,000',
        gap: 'State-of-the-art infrastructure; 5G standalone slice security audits mandated.',
      },
      ot_ics: {
        score: 96,
        regs: 3,
        ctrls: 48,
        penalty: 'Extreme',
        codes: ['NCA-CSCC-1:2019', 'ARAMCO-CCC-STD'],
        auth: ['NCA', 'Ministry of Energy'],
        keyMandates: ['Physical air-gapping of Level 0-2 industrial controllers', 'Unidirectional security gateways (data diodes)', 'Mandatory supply chain firmware vulnerability scanning'],
        fines: 'Immediate facility shutdown and national security prosecution',
        gap: 'Global gold standard in energy sector ICS defense due to extensive Aramco/NCA joint frameworks.',
      },
    },
    uae: {
      ai: {
        score: 92,
        regs: 5,
        ctrls: 32,
        penalty: 'High',
        codes: ['UAE-AI-STRAT-2031', 'DIFC-AI-REG-2024', 'ADGM-AI-ETHICS'],
        auth: ['AI Office', 'DESC', 'DIFC CA', 'ADGM FSRA'],
        keyMandates: ['AI safety testing before commercial launch', 'Autonomous vehicle cybersecurity clearance', 'Financial generative AI disclosure requirements', 'DIFC AI Developer liability register'],
        fines: 'Fines up to AED 10,000,000 ($2.72M) and commercial license freeze',
        gap: 'Dual onshore-offshore synergy; fast deployment of AI regulation sandbox environments.',
      },
      cyber: {
        score: 96,
        regs: 6,
        ctrls: 98,
        penalty: 'Extreme',
        codes: ['UAE-NESA-IAS', 'DESC-ISR-V2', 'CSC-FED-CYBER-2023'],
        auth: ['Cyber Security Council', 'DESC', 'TDRA', 'CBUAE'],
        keyMandates: ['Mandatory compliance with DESC ISR for Dubai government entities', 'National Cyber Pulse proactive vulnerability scanning', 'Mandatory 2-hour cyber incident notification window'],
        fines: 'Criminal sanctions under Cybercrime Law and fines up to AED 5,000,000',
        gap: 'World-class cyber hygiene; federated alignment between individual emirates is nearly complete.',
      },
      privacy: {
        score: 88,
        regs: 4,
        ctrls: 36,
        penalty: 'High',
        codes: ['UAE-LAW-45-2021', 'DIFC-DP-LAW-2020', 'ADGM-DPR-2021'],
        auth: ['UAE Data Office', 'DIFC Commissioner', 'ADGM'],
        keyMandates: ['Appointment of statutory DPO for high-risk processing', 'Explicit consent mechanisms for commercial marketing', 'Cross-border transfer safeguards aligned with EU standard contractual clauses'],
        fines: 'Up to AED 10,000,000 under federal law',
        gap: 'Executive regulations operationalized; multi-jurisdictional onshore/free-zone coordination established.',
      },
      cloud: {
        score: 91,
        regs: 3,
        ctrls: 34,
        penalty: 'High',
        codes: ['DESC-CSP-SEC-2022', 'TDRA-CLOUD-POLICY'],
        auth: ['DESC', 'TDRA', 'CSC'],
        keyMandates: ['DESC cloud service provider accreditation for government workloads', 'Tiered data classification with local encryption key management', 'Zero shared tenancy for confidential public sector data'],
        fines: 'Decertification and civil liability',
        gap: 'Extensive regional cloud adoption (Microsoft, AWS, G42 Sovereign Cloud).',
      },
      fintech: {
        score: 95,
        regs: 5,
        ctrls: 46,
        penalty: 'Extreme',
        codes: ['CBUAE-OPEN-BANKING-2023', 'VARA-FULL-RULEBOOK', 'ADGM-FSRA-CRYPTO'],
        auth: ['CBUAE', 'VARA', 'DFSA', 'ADGM FSRA'],
        keyMandates: ['Full VARA regulatory licensing for virtual asset service providers', 'CBUAE consumer protection & digital KYC standards', 'Mandatory biometric liveness verification for remote account creation'],
        fines: 'Revocation of financial license and up to AED 20,000,000 penalties',
        gap: 'Pioneering global digital assets and payments framework.',
      },
      resilience: {
        score: 89,
        regs: 3,
        ctrls: 30,
        penalty: 'High',
        codes: ['NCEMA-7000:2021', 'CBUAE-OUTSOURCE-STD'],
        auth: ['NCEMA', 'CBUAE', 'DESC'],
        keyMandates: ['National crisis emergency management alignment', 'Cloud exit strategy testing requirements', 'Secondary datacenter separation of at least 50km'],
        fines: 'Regulatory sanctions and executive board formal reprimands',
        gap: 'High resilience across banking and aviation sectors.',
      },
      telco: {
        score: 94,
        regs: 3,
        ctrls: 28,
        penalty: 'High',
        codes: ['TDRA-TELCO-SEC-2022', 'TDRA-IOT-REG'],
        auth: ['TDRA'],
        keyMandates: ['IoT device type approval and default password prohibition', 'Critical network routing redundancy', 'SMS fraud screening and brand protection'],
        fines: 'Up to AED 5,000,000',
        gap: 'Top global fiber and 5G penetration with stringent carrier cyber controls.',
      },
      ot_ics: {
        score: 91,
        regs: 3,
        ctrls: 38,
        penalty: 'Extreme',
        codes: ['ADNOC-CYBER-STD', 'DEWA-OT-SEC-FRAMEWORK'],
        auth: ['Ministry of Energy', 'DESC', 'Cyber Security Council'],
        keyMandates: ['OT network segmentation conforming to Purdue Model', 'Zero USB media insertion on plant control workstations', 'Independent continuous ICS network anomaly detection'],
        fines: 'Emergency shutdown orders and legal prosecution',
        gap: 'Highly mature across ADNOC energy operations and DEWA power grids.',
      },
    },
    qatar: {
      ai: {
        score: 82,
        regs: 3,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['QATAR-AI-STRAT-2024', 'MCIT-AI-ETHICS-GUIDE'],
        auth: ['MCIT', 'NCSA'],
        keyMandates: ['Ethical AI impact assessment for public sector procurement', 'Prohibition of subliminal manipulation algorithms', 'Mandatory human-in-the-loop oversight for high-risk public decisions'],
        fines: 'Administrative procurement disqualification and statutory fines',
        gap: 'Transitioning from guidance framework into binding national AI statutory law.',
      },
      cyber: {
        score: 89,
        regs: 5,
        ctrls: 76,
        penalty: 'Extreme',
        codes: ['NCSA-NIA-V2', 'QCB-CYBER-SEC-2022', 'CRA-CIIP-STD'],
        auth: ['NCSA', 'QCB', 'CRA', 'QFCRA'],
        keyMandates: ['Mandatory National Information Assurance (NIA v2.0) compliance', 'Quarterly external penetration testing and code reviews', 'Immediate threat telemetry sharing with Q-CERT'],
        fines: 'Up to QAR 5,000,000 and suspension of operations',
        gap: 'Very strong across banking, defense, and oil/gas; expanding to SME supply chains.',
      },
      privacy: {
        score: 86,
        regs: 3,
        ctrls: 30,
        penalty: 'High',
        codes: ['QATAR-LAW-13-2016', 'QFC-DPR-2020'],
        auth: ['National Cyber Governance and Assurance Affairs (MCIT)', 'QFC'],
        keyMandates: ['Mandatory permit for electronic marketing communications', 'Data breach reporting within 72 hours', 'Special protection measures for children data'],
        fines: 'Fines up to QAR 5,000,000',
        gap: 'Enacted in 2016; updated guidelines published in 2024 for cross-border adequacy.',
      },
      cloud: {
        score: 87,
        regs: 3,
        ctrls: 28,
        penalty: 'High',
        codes: ['MCIT-SOV-CLOUD-2022', 'QCB-CLOUD-DIR'],
        auth: ['MCIT', 'NCSA', 'QCB'],
        keyMandates: ['Data residency within state of Qatar for sovereign data classes', 'Mandatory Q-CERT security assessment of hyperscale datacenters', 'Exit management escrow arrangements'],
        fines: 'Up to QAR 3,000,000',
        gap: 'Active sovereign cloud presence (Google Cloud Doha Region, Microsoft Cloud).',
      },
      fintech: {
        score: 85,
        regs: 3,
        ctrls: 32,
        penalty: 'High',
        codes: ['QCB-FINTECH-STRAT-2023', 'QCB-ELECTRONIC-PAYMENTS'],
        auth: ['QCB', 'QFCRA'],
        keyMandates: ['Digital onboarding and AML/CFT transaction screening', 'Open API security standards', 'Regulatory sandbox compliance monitoring'],
        fines: 'Up to QAR 10,000,000',
        gap: 'Robust banking framework; digital assets regulatory framework currently in rollout.',
      },
      resilience: {
        score: 86,
        regs: 2,
        ctrls: 24,
        penalty: 'High',
        codes: ['NCSA-BCM-GUIDE', 'QCB-RISK-MGMT'],
        auth: ['NCSA', 'QCB'],
        keyMandates: ['Critical system recovery in under 4 hours', 'Geographic disaster recovery site segregation', 'Supply chain contingency agreements'],
        fines: 'Regulatory sanctions and financial penalties',
        gap: 'Strong institutional focus developed through major global event hosting.',
      },
      telco: {
        score: 88,
        regs: 2,
        ctrls: 22,
        penalty: 'High',
        codes: ['CRA-CRITICAL-INFRA', 'CRA-CYBER-MANDATE'],
        auth: ['CRA'],
        keyMandates: ['National roaming resilience protocols', 'Submarine cable protection zones', 'Critical infrastructure physical security barriers'],
        fines: 'Up to QAR 5,000,000',
        gap: 'Consolidated telco market with strict regulatory oversight from CRA.',
      },
      ot_ics: {
        score: 93,
        regs: 3,
        ctrls: 36,
        penalty: 'Extreme',
        codes: ['QATAR-ENERGY-ICS-STD', 'NCSA-INDUSTRIAL-CYBER'],
        auth: ['NCSA', 'QatarEnergy'],
        keyMandates: ['Mandatory industrial control cyber assurance for LNG export terminals', 'Strict separation of corporate IT and DCS networks', 'Real-time protocol inspection for Modbus/DNP3'],
        fines: 'Immediate operational shutdown and state security review',
        gap: 'World-class industrial safety due to strategic global LNG supply critical infrastructure.',
      },
    },
    bahrain: {
      ai: {
        score: 74,
        regs: 2,
        ctrls: 14,
        penalty: 'Moderate',
        codes: ['BAH-AI-POLICY-2023'],
        auth: ['iGA', 'EDB'],
        keyMandates: ['Ethical guidelines for algorithmic decision-making', 'Voluntary AI sandbox participation', 'Fairness and non-discrimination audits'],
        fines: 'Administrative warnings and permit reviews',
        gap: 'Formulating comprehensive binding legislation following regional GCC models.',
      },
      cyber: {
        score: 86,
        regs: 4,
        ctrls: 62,
        penalty: 'High',
        codes: ['NCSC-CYBER-STRAT-2022', 'CBB-CYBER-MODULE'],
        auth: ['NCSC', 'CBB', 'TRA'],
        keyMandates: ['Annual cyber resilience assessment for licensed financial institutions', 'Multi-factor authentication on all remote access', 'Mandatory incident notification to NCSC within 4 hours'],
        fines: 'Up to BHD 100,000 ($265,000) and regulatory censures',
        gap: 'Strong in banking and cloud; national framework undergoing statutory overhaul in 2026.',
      },
      privacy: {
        score: 83,
        regs: 2,
        ctrls: 26,
        penalty: 'High',
        codes: ['BAH-PDPL-LAW-30-2018'],
        auth: ['Personal Data Protection Authority (PDPA)'],
        keyMandates: ['Prior notification for automated processing', 'Cross-border data transfer restrictions to non-adequate states', 'Mandatory consent for marketing communications'],
        fines: 'Fines up to BHD 100,000 and potential imprisonment for criminal breaches',
        gap: 'Mature legislation; enforcement intensified with newly established independent authority.',
      },
      cloud: {
        score: 92,
        regs: 4,
        ctrls: 32,
        penalty: 'High',
        codes: ['BAH-CLOUD-FIRST-POLICY', 'CBB-CLOUD-OUTSOURCE'],
        auth: ['iGA', 'CBB'],
        keyMandates: ['Cloud-First procurement mandate across government ministries', 'Data Jurisdiction Law safeguarding overseas customer data', 'Stringent CBB pre-approval for offshore cloud migrations'],
        fines: 'Administrative contract annulment and regulatory fines',
        gap: 'Regional pioneer with AWS Bahrain hub and unique Cloud Jurisdiction Law protection.',
      },
      fintech: {
        score: 90,
        regs: 4,
        ctrls: 40,
        penalty: 'High',
        codes: ['CBB-OPEN-BANKING-FRAMEWORK', 'CBB-CRYPTO-ASSET-MODULE'],
        auth: ['CBB'],
        keyMandates: ['Full regulatory compliance with CBB Open Banking API standards', 'Cold storage requirements for 98% of virtual asset reserves', 'Mandatory insurance coverage for custodial crypto holdings'],
        fines: 'Revocation of CBB license and monetary fines up to BHD 500,000',
        gap: 'Highly sophisticated fintech ecosystem with premier regulatory sandbox.',
      },
      resilience: {
        score: 82,
        regs: 2,
        ctrls: 22,
        penalty: 'Moderate',
        codes: ['CBB-BCM-GUIDELINES', 'iGA-DR-STANDARD'],
        auth: ['CBB', 'iGA'],
        keyMandates: ['Alternate processing site within kingdom or approved GCC zone', 'Testing frequency at least twice per year', 'Third-party vendor dependency risk assessments'],
        fines: 'Administrative penalties and board-level rectification orders',
        gap: 'Solid financial BCM framework; extending coverage to healthcare and retail utilities.',
      },
      telco: {
        score: 85,
        regs: 2,
        ctrls: 20,
        penalty: 'High',
        codes: ['TRA-SECURITY-DIR', 'TRA-CRITICAL-TELECOM'],
        auth: ['TRA'],
        keyMandates: ['National telecommunications infrastructure security audits', 'Emergency broadcast system integration', 'Sim registration and cyber intercept compliance'],
        fines: 'Up to BHD 500,000',
        gap: 'Active regulatory compliance overseen by TRA Bahrain.',
      },
      ot_ics: {
        score: 84,
        regs: 2,
        ctrls: 26,
        penalty: 'High',
        codes: ['BAPCO-CYBER-STD', 'EWA-INDUSTRIAL-SEC'],
        auth: ['NCSC', 'Ministry of Oil'],
        keyMandates: ['Segmentation of refinery process networks', 'Strict vendor maintenance remote session recording', 'Industrial threat monitoring coordination with NCSC'],
        fines: 'Statutory penalties and operational sanctions',
        gap: 'Focused on Bapco energy infrastructure and national water/power grids.',
      },
    },
    kuwait: {
      ai: {
        score: 65,
        regs: 2,
        ctrls: 10,
        penalty: 'Moderate',
        codes: ['CITRA-DIGITAL-TRANSF-2023'],
        auth: ['CITRA', 'CAIT'],
        keyMandates: ['Public sector digital transformation guidance', 'Voluntary algorithmic fairness assessments', 'Data privacy compliance for AI inputs'],
        fines: 'Administrative reviews and warnings',
        gap: 'Comprehensive AI legislative framework currently in inter-ministerial draft phase.',
      },
      cyber: {
        score: 83,
        regs: 4,
        ctrls: 58,
        penalty: 'High',
        codes: ['CBK-CYBER-FRAMEWORK-2020', 'CITRA-CYBER-SEC-2022'],
        auth: ['NCSC-KW', 'CBK', 'CITRA'],
        keyMandates: ['CBK mandatory cybersecurity controls for commercial banks', 'NCSC national critical asset inventory registration', 'Zero unencrypted sensitive data in transit or at rest'],
        fines: 'Up to KWD 50,000 ($162,000) and regulatory capital add-ons',
        gap: 'Strong in banking under Central Bank of Kuwait; newly formed NCSC standardizing across state entities.',
      },
      privacy: {
        score: 75,
        regs: 2,
        ctrls: 22,
        penalty: 'Moderate',
        codes: ['CITRA-DATA-PRIVACY-REG-2021'],
        auth: ['CITRA'],
        keyMandates: ['Data processing register maintenance', 'Consent collection for personal data usage', 'Notification of data breaches within 48 hours to CITRA'],
        fines: 'Up to KWD 20,000 and license conditions',
        gap: 'Regulatory resolution in place under CITRA; standalone parliamentary comprehensive law pending.',
      },
      cloud: {
        score: 81,
        regs: 3,
        ctrls: 24,
        penalty: 'High',
        codes: ['CITRA-CLOUD-REG-2021', 'CBK-CLOUD-DIR-2022'],
        auth: ['CITRA', 'CBK'],
        keyMandates: ['CSP licensing with CITRA before offering services to government', 'In-country data storage requirement for critical financial and government records', 'Audit access rights for state supervisory bodies'],
        fines: 'Administrative cessation orders and monetary fines',
        gap: 'Accelerating following multi-billion dollar hyperscale investment agreements.',
      },
      fintech: {
        score: 82,
        regs: 3,
        ctrls: 30,
        penalty: 'High',
        codes: ['CBK-ELECTRONIC-PAYMENT-2023', 'CBK-DIGITAL-BANKING'],
        auth: ['CBK', 'CMA'],
        keyMandates: ['Electronic payment operator licensing and capital adequacy', 'Transaction risk monitoring for anti-fraud detection', 'Prohibition of unauthorized crypto trading activities'],
        fines: 'Revocation of payment service provider license and fines',
        gap: 'Conservative central bank approach with strong stability and anti-fraud protections.',
      },
      resilience: {
        score: 79,
        regs: 2,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['CBK-BUSINESS-RESILIENCE', 'CITRA-DR-GUIDE'],
        auth: ['CBK', 'CITRA'],
        keyMandates: ['Off-site synchronous data replication', 'Annual comprehensive disaster recovery rehearsal', 'Key vendor concentration risk mitigation plans'],
        fines: 'Regulatory citations and audit remediation orders',
        gap: 'Well established in Tier-1 banking; government cloud resilience undergoing upgrades.',
      },
      telco: {
        score: 83,
        regs: 2,
        ctrls: 20,
        penalty: 'High',
        codes: ['CITRA-TELCO-SEC', 'CITRA-INTERNET-SAFETY'],
        auth: ['CITRA'],
        keyMandates: ['National fiber backbone physical integrity', 'Customer data protection on telecom billing networks', 'DDoS protection on external gateway exchanges'],
        fines: 'Up to KWD 50,000',
        gap: 'High connectivity with strict CITRA licensing oversight.',
      },
      ot_ics: {
        score: 88,
        regs: 3,
        ctrls: 34,
        penalty: 'Extreme',
        codes: ['KPC-CYBER-SEC-POLICY', 'KNPC-ICS-STD'],
        auth: ['Kuwait Petroleum Corporation (KPC)', 'NCSC-KW'],
        keyMandates: ['Strict cybersecurity governance for oil extraction and refinery facilities', 'Segregated demilitarized zones between SCADA and corporate IT', 'Hardware integrity verification for field programmable gate arrays'],
        fines: 'National security sanctions and facility access revocation',
        gap: 'Highly developed internal standards across KPC subsidiaries.',
      },
    },
    oman: {
      ai: {
        score: 70,
        regs: 2,
        ctrls: 12,
        penalty: 'Moderate',
        codes: ['OMAN-AI-STRAT-2023', 'MTCIT-AI-ETHICS'],
        auth: ['MTCIT'],
        keyMandates: ['National executive program for AI and advanced technology adoption', 'Ethical AI principles and human oversight guidelines', 'Protection of national cultural identity in algorithmic generation'],
        fines: 'Administrative procurement penalties',
        gap: 'Comprehensive sector-specific guidelines currently being drafted for health and transport.',
      },
      cyber: {
        score: 85,
        regs: 4,
        ctrls: 64,
        penalty: 'High',
        codes: ['OMAN-CYBERCRIME-LAW', 'CBO-CYBER-FRAMEWORK', 'MTCIT-INFO-SEC-V2'],
        auth: ['MTCIT (Oman CERT)', 'CBO', 'TRA'],
        keyMandates: ['Mandatory compliance with MTCIT Information Security Framework', 'Central Bank of Oman cyber governance directive for financial entities', 'Incident reporting to Oman CERT within 2 hours'],
        fines: 'Up to OMR 50,000 ($130,000) and criminal penalties',
        gap: 'Longstanding mature cyber response; ranked high in regional ITU cyber readiness index.',
      },
      privacy: {
        score: 84,
        regs: 2,
        ctrls: 28,
        penalty: 'High',
        codes: ['OMAN-PDPL-LAW-6-2022'],
        auth: ['MTCIT'],
        keyMandates: ['Comprehensive personal data protection statute', 'Cross-border transfer restrictions requiring MTCIT authorization', 'Data subject access and erasure rights mechanisms'],
        fines: 'Fines up to OMR 500,000 and possible prison terms for gross non-compliance',
        gap: 'Executive regulations fully entered into force in 2024; active enforcement underway.',
      },
      cloud: {
        score: 83,
        regs: 3,
        ctrls: 24,
        penalty: 'High',
        codes: ['MTCIT-CLOUD-FRAMEWORK', 'CBO-CLOUD-COMPUTING-DIR'],
        auth: ['MTCIT', 'CBO'],
        keyMandates: ['Classification of state data and in-country hosting for sovereign data', 'Security vetting of CSP local and international administrators', 'Mandatory exit plan with data sanitization certificates'],
        fines: 'Revocation of cloud operational credentials and fines',
        gap: 'Growing domestic datacenter and submarine cable hub in Salalah and Muscat.',
      },
      fintech: {
        score: 80,
        regs: 3,
        ctrls: 28,
        penalty: 'High',
        codes: ['CBO-FINTECH-FRAMEWORK-2022', 'CBO-PAYMENT-SYSTEM-LAW'],
        auth: ['CBO', 'CMA'],
        keyMandates: ['CBO regulatory sandbox compliance protocols', 'Mandatory tokenization for digital card storage', 'Cybersecurity defense requirements for instant payment gateways'],
        fines: 'Administrative fines up to OMR 100,000',
        gap: 'Expanding digital banking ecosystem with strict CBO prudential supervision.',
      },
      resilience: {
        score: 80,
        regs: 2,
        ctrls: 22,
        penalty: 'Moderate',
        codes: ['CBO-BUSINESS-CONTINUITY', 'MTCIT-RESILIENCE-STD'],
        auth: ['CBO', 'MTCIT'],
        keyMandates: ['Annual live disaster recovery cutover verification', 'Geographic risk diversification (distance from coastal surge zones)', 'Third-party critical supplier redundancy requirements'],
        fines: 'Regulatory remediation directives',
        gap: 'Specific geographic weather resilience considerations integrated into datacenter rules.',
      },
      telco: {
        score: 84,
        regs: 2,
        ctrls: 22,
        penalty: 'High',
        codes: ['TRA-SECURITY-OBLIGATIONS', 'TRA-SUBSEA-CABLE-PROT'],
        auth: ['TRA'],
        keyMandates: ['Submarine cable landing station security standards', 'Infrastructure resilience against cyber and environmental disruption', 'Emergency telecommunication readiness protocols'],
        fines: 'Up to OMR 100,000',
        gap: 'Major global interconnection hub with specialized cable security oversight.',
      },
      ot_ics: {
        score: 89,
        regs: 3,
        ctrls: 36,
        penalty: 'Extreme',
        codes: ['PDO-CYBER-SEC-CODE', 'OQ-INDUSTRIAL-ICS-STD'],
        auth: ['Ministry of Energy and Minerals', 'MTCIT'],
        keyMandates: ['Mandatory compliance with Petroleum Development Oman (PDO) cyber code', 'Air-gap and multi-tier firewall enforcement on gas pipeline SCADA systems', 'Pre-deployment cyber testing of all industrial IoT sensors'],
        fines: 'Facility operational suspension and criminal liability',
        gap: 'Comprehensive and rigorous across upstream and downstream energy infrastructure.',
      },
    },
    turkey: {
      ai: {
        score: 76,
        regs: 3,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['TR-NAT-AI-STRAT-2021-25', 'BTK-AI-ETHICS-GUIDE'],
        auth: ['Digital Transformation Office (CBDFO)', 'BTK', 'TÜBİTAK'],
        keyMandates: ['Strategic alignment with National AI Strategy action plans', 'Bias testing in public administrative automated systems', 'National AI ecosystem certification and domestic model preference'],
        fines: 'Administrative procurement sanctions and tender disqualification',
        gap: 'Comprehensive draft AI law currently modeled after EU AI Act pending Grand National Assembly.',
      },
      cyber: {
        score: 88,
        regs: 5,
        ctrls: 82,
        penalty: 'High',
        codes: ['CBDFO-INFO-SEC-GUIDE-V2', 'BTK-CYBER-INCIDENT-REG', 'BDDK-CYBER-BANKS'],
        auth: ['CBDFO', 'BTK (USOM)', 'BDDK', 'SPK'],
        keyMandates: ['Mandatory compliance with CBDFO Information and Communication Security Guide', 'National CERT (USOM) real-time incident notification within 1 hour', 'Mandatory local security clearance for critical infrastructure personnel'],
        fines: 'Fines up to TRY 50,000,000 and executive criminal liability',
        gap: 'Extremely detailed 200+ page national guide; deep domestic technical capability and USOM SOC integration.',
      },
      privacy: {
        score: 87,
        regs: 3,
        ctrls: 34,
        penalty: 'High',
        codes: ['TR-KVKK-LAW-6698', 'KVKK-AMENDMENT-2024'],
        auth: ['Personal Data Protection Authority (KVKK)'],
        keyMandates: ['Mandatory registration in Data Controllers Registry (VERBIS)', '2024 reform aligning cross-border transfers with EU standard contractual clauses', 'Strict consent requirements and biometric data safeguards'],
        fines: 'Fines up to TRY 10,000,000 per violation',
        gap: 'Recent 2024 statutory amendment successfully modernizes international transfers toward GDPR parity.',
      },
      cloud: {
        score: 82,
        regs: 3,
        ctrls: 26,
        penalty: 'High',
        codes: ['CBDFO-CLOUD-LOCALIZATION', 'BDDK-BANK-CLOUD-RULE'],
        auth: ['CBDFO', 'BDDK', 'BTK'],
        keyMandates: ['Banking and public sector data must reside on servers physically within Republic of Turkey', 'Primary and secondary systems must be hosted within national borders', 'Foreign hyperscalers must establish local certified corporate entities'],
        fines: 'Severe banking regulatory fines and operational suspension',
        gap: 'Strict data residency rules drive growth of domestic cloud providers (Turkcell, Türk Telekom, Havelsan).',
      },
      fintech: {
        score: 86,
        regs: 4,
        ctrls: 38,
        penalty: 'High',
        codes: ['BDDK-OPEN-BANKING-REG', 'TCMB-PAYMENT-SYSTEMS', 'SPK-CRYPTO-LAW-2024'],
        auth: ['BDDK', 'TCMB', 'SPK', 'MASAK'],
        keyMandates: ['2024 Capital Markets Law amendments regulating crypto asset service providers', 'TCMB licensing for payment and electronic money institutions', 'Mandatory independent penetration testing and source code audits'],
        fines: 'Up to TRY 25,000,000 and custodial sentences for illicit financial operators',
        gap: 'Fast-moving regulatory ecosystem with newly enacted comprehensive crypto asset regime.',
      },
      resilience: {
        score: 83,
        regs: 3,
        ctrls: 26,
        penalty: 'High',
        codes: ['BDDK-BCM-MANDATE', 'AFAD-CRITICAL-INFRA'],
        auth: ['BDDK', 'AFAD', 'CBDFO'],
        keyMandates: ['Seismic disaster recovery resilience (mandatory minimum 100km distance between datacenters)', 'Maximum allowable downtime under 2 hours for critical banking systems', 'Semi-annual disaster cutover simulation audits'],
        fines: 'Regulatory capital deductions and supervisory sanctions',
        gap: 'High focus on physical seismic resilience combined with digital disaster recovery.',
      },
      telco: {
        score: 87,
        regs: 3,
        ctrls: 26,
        penalty: 'High',
        codes: ['BTK-TELECOM-SECURITY', 'BTK-TRAFFIC-LOGGING'],
        auth: ['BTK'],
        keyMandates: ['Mandatory timestamped retention of network traffic logs for 2 years', 'National backbone infrastructure protection and domestic peering preference', 'Lawful interception equipment installation across all ISP networks'],
        fines: 'Up to 3% of previous calendar year net turnover',
        gap: 'Highly regulated telecommunications market with centralized BTK monitoring.',
      },
      ot_ics: {
        score: 84,
        regs: 3,
        ctrls: 30,
        penalty: 'High',
        codes: ['EPDK-ENERGY-CYBER-SEC', 'BOTAŞ-SCADA-POLICY'],
        auth: ['EPDK', 'Ministry of Energy and Natural Resources', 'CBDFO'],
        keyMandates: ['Mandatory compliance with EPDK Industrial Cybersecurity Guidelines for electricity & gas', 'Annual vulnerability scanning of transmission line SCADA networks', 'Prohibition of remote vendor connections without explicit two-tier authorization'],
        fines: 'Administrative fines and operational license reviews',
        gap: 'Significant regulatory emphasis given strategic pipeline and power transmission infrastructure.',
      },
    },
    egypt: {
      ai: {
        score: 68,
        regs: 2,
        ctrls: 14,
        penalty: 'Moderate',
        codes: ['EGY-NAT-AI-STRAT-V2', 'MCIT-AI-CHARTER-2023'],
        auth: ['National Council for AI (NCAI)', 'MCIT'],
        keyMandates: ['Responsible AI Charter principles for ethical development', 'Capacity building and algorithmic audit guidelines for government e-services', 'Protection of citizen privacy in automated profiling'],
        fines: 'Administrative procurement penalties',
        gap: 'Second phase of National AI Strategy underway; binding legislation expected in 2026/2027.',
      },
      cyber: {
        score: 78,
        regs: 4,
        ctrls: 56,
        penalty: 'High',
        codes: ['EGY-CYBERCRIME-LAW-175', 'CBE-CYBER-FRAMEWORK', 'EG-CERT-DIRECTIVES'],
        auth: ['EG-CERT', 'Central Bank of Egypt (CBE)', 'NTRA'],
        keyMandates: ['CBE Cybersecurity Framework mandatory for all commercial banks', 'Mandatory 24-hour incident notification to EG-CERT for critical sectors', 'Registration and licensing of cybersecurity testing service providers with NTRA'],
        fines: 'Fines up to EGP 20,000,000 ($410,000) and custodial sentences under Law 175',
        gap: 'Comprehensive legal powers; national cybersecurity strategy actively modernizing oversight.',
      },
      privacy: {
        score: 77,
        regs: 2,
        ctrls: 26,
        penalty: 'High',
        codes: ['EGY-PDPL-LAW-151-2020'],
        auth: ['Personal Data Protection Centre (PDPC)', 'MCIT'],
        keyMandates: ['Mandatory statutory license for cross-border data transfer', 'Appointment of accredited Data Protection Officer', 'Statutory consent requirements for direct electronic marketing'],
        fines: 'Fines up to EGP 5,000,000 and potential prison terms for willful violations',
        gap: 'Executive regulations finalized; regulatory enforcement licensing center actively expanding capacity.',
      },
      cloud: {
        score: 73,
        regs: 2,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['NTRA-CLOUD-POLICY-2022', 'CBE-CLOUD-OUTSOURCE'],
        auth: ['NTRA', 'CBE'],
        keyMandates: ['NTRA licensing required for commercial datacenter and cloud providers', 'Government confidential data must remain within national sovereign borders', 'Encryption standards verified by national telecommunications authorities'],
        fines: 'Administrative closure orders and financial penalties',
        gap: 'Surge in hyperscale datacenter investments in New Administrative Capital and Suez Canal corridor.',
      },
      fintech: {
        score: 82,
        regs: 4,
        ctrls: 34,
        penalty: 'High',
        codes: ['EGY-FINTECH-LAW-5-2022', 'CBE-INSTANT-PAYMENT-REG', 'FRA-DIGITAL-FINANCE'],
        auth: ['CBE', 'Financial Regulatory Authority (FRA)'],
        keyMandates: ['Fintech Law 5/2022 licensing for non-banking financial tech operations', 'Mandatory biometric customer onboarding safeguards', 'Real-time transaction fraud monitoring connected to national payment switch (IPN/InstaPay)'],
        fines: 'Up to EGP 10,000,000 and license cancellation',
        gap: 'Massive adoption of digital payments (InstaPay, Meeza) supported by progressive CBE regulatory sandbox.',
      },
      resilience: {
        score: 72,
        regs: 2,
        ctrls: 18,
        penalty: 'Moderate',
        codes: ['CBE-BCM-GUIDELINES', 'EG-CERT-RESILIENCE'],
        auth: ['CBE', 'EG-CERT'],
        keyMandates: ['Secondary disaster recovery site outside primary metropolitan zone', 'Annual penetration testing and business continuity drills', 'Third-party cloud risk assessment protocols'],
        fines: 'Regulatory citations and remediation timelines',
        gap: 'Well established in Tier-1 banking; broader national critical infrastructure adoption underway.',
      },
      telco: {
        score: 81,
        regs: 2,
        ctrls: 22,
        penalty: 'High',
        codes: ['NTRA-TELECOM-LAW-10-2003', 'NTRA-SECURITY-STANDARDS'],
        auth: ['NTRA'],
        keyMandates: ['Submarine cable landing security (Suez Canal strategic global corridor)', 'SIM card national ID registration enforcement', 'VoIP traffic management and lawful intercept requirements'],
        fines: 'Up to EGP 20,000,000',
        gap: 'Critical global telecommunications bottleneck across Suez is subject to top-level state security.',
      },
      ot_ics: {
        score: 79,
        regs: 2,
        ctrls: 24,
        penalty: 'High',
        codes: ['SUEZ-CANAL-CYBER-POLICY', 'MIN-PETROLEUM-CYBER-STD'],
        auth: ['Ministry of Petroleum', 'Suez Canal Authority', 'EG-CERT'],
        keyMandates: ['SCADA network protection for national gas grids and Suez transit control', 'Physical and electronic perimeter access control for power generation plants', 'Annual industrial vulnerability assessments certified by EG-CERT'],
        fines: 'State security prosecution and administrative penalties',
        gap: 'High focus on vital canal logistics and Mediterranean offshore gas (Zohr field) operations.',
      },
    },
    morocco: {
      ai: {
        score: 66,
        regs: 2,
        ctrls: 12,
        penalty: 'Moderate',
        codes: ['MAR-AI-MOVEMENT-2023', 'ADD-AI-RECOMMENDATIONS'],
        auth: ['Digital Development Agency (ADD)', 'CNDP'],
        keyMandates: ['National Artificial Intelligence guidelines promoting ethical use', 'Human oversight and privacy impact assessments for algorithmic processing', 'Preservation of data sovereignty in national AI training models'],
        fines: 'Administrative procurement reviews',
        gap: 'National strategy actively being formulated with UNESCO and EU benchmark alignment.',
      },
      cyber: {
        score: 81,
        regs: 4,
        ctrls: 60,
        penalty: 'High',
        codes: ['MAR-CYBER-LAW-05-20', 'DGSSI-INFO-SEC-DIRECTIVE'],
        auth: ['DGSSI (General Directorate of Information Systems Security)', 'maCERT'],
        keyMandates: ['Law 05-20 mandatory for public administrations and vital infrastructure operators', 'Mandatory security audits every two years by DGSSI-approved audit firms', 'Immediate cyber incident notification to maCERT'],
        fines: 'Fines up to MAD 500,000 ($50,000) and criminal penalties',
        gap: 'Robust national cyber defense architecture managed directly under National Defense Administration.',
      },
      privacy: {
        score: 83,
        regs: 2,
        ctrls: 28,
        penalty: 'High',
        codes: ['MAR-LAW-09-08', 'CNDP-REFORM-2024'],
        auth: ['National Commission for the Protection of Personal Data (CNDP)'],
        keyMandates: ['Prior declaration and authorization for automated processing', 'Strict cross-border transfer authorization requirements', 'Data subject access, rectification, and objection rights'],
        fines: 'Fines up to MAD 300,000 and possible imprisonment for unauthorized transfer',
        gap: 'Pioneer in North Africa with Law 09-08; currently updating toward Council of Europe Convention 108+ standard.',
      },
      cloud: {
        score: 76,
        regs: 2,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['DGSSI-CLOUD-SECURITY-DIR', 'ADD-SOVEREIGN-CLOUD'],
        auth: ['DGSSI', 'ADD'],
        keyMandates: ['DGSSI pre-approval required for hosting sensitive public data in external clouds', 'Data localization on national territory for sovereign institutional categories', 'Encrypted communication channels with national root certificate validation'],
        fines: 'Administrative contract nullification and security sanctions',
        gap: 'Growing datacenter hub in Casablanca Finance City and Benguerir Green City.',
      },
      fintech: {
        score: 79,
        regs: 3,
        ctrls: 28,
        penalty: 'High',
        codes: ['BAM-DIR-PAYMENT-INSTITUTIONS', 'BAM-CYBER-CIRCULAR'],
        auth: ['Bank Al-Maghrib (BAM)', 'AMMC'],
        keyMandates: ['Bank Al-Maghrib circular on cybersecurity governance for financial establishments', 'Licensing of payment service providers and mobile money agents', 'Prohibition of unbacked cryptocurrency operations'],
        fines: 'Monetary penalties and potential withdrawal of banking approval',
        gap: 'Strong traditional banking resilience; expanding mobile payment interoperability and fintech sandbox.',
      },
      resilience: {
        score: 75,
        regs: 2,
        ctrls: 20,
        penalty: 'Moderate',
        codes: ['BAM-BCM-DIRECTIVE', 'DGSSI-CONTINUITY-STD'],
        auth: ['Bank Al-Maghrib', 'DGSSI'],
        keyMandates: ['Redundant business continuity site situated in distinct risk zone', 'Testing of critical service recovery at least annually', 'Formal crisis management team structure and communication protocols'],
        fines: 'Regulatory warnings and remediation requirements',
        gap: 'High standard in banking and automotive/aerospace manufacturing export corridors.',
      },
      telco: {
        score: 82,
        regs: 2,
        ctrls: 22,
        penalty: 'High',
        codes: ['ANRT-SECURITY-DECISION', 'ANRT-INTERCONNECTION'],
        auth: ['ANRT'],
        keyMandates: ['Telecommunications network integrity and cyber defense measures', 'SIM card identification and anti-fraud verification', 'Submarine fiber landing security in Asilah and Tetouan'],
        fines: 'Up to 2% of operator annual turnover',
        gap: 'Advanced telecom regulator with high 4G/5G deployment and pan-African network links.',
      },
      ot_ics: {
        score: 81,
        regs: 2,
        ctrls: 26,
        penalty: 'High',
        codes: ['OCP-CYBER-SEC-FRAMEWORK', 'ONEE-POWER-GRID-SEC'],
        auth: ['DGSSI', 'Ministry of Energy Transition and Sustainable Development'],
        keyMandates: ['Industrial cybersecurity standards protecting national phosphate (OCP) processing', 'Power grid and renewable solar (Noor Ouarzazate) SCADA defense', 'Network zoning separating office environments from factory DCS controllers'],
        fines: 'Security sanction and administrative intervention',
        gap: 'World-class industrial protocols implemented across OCP and renewable energy complexes.',
      },
    },
  };

  const defaultRegionalBenchmarks: Record<
    string,
    { baseScore: number; regsMult: number; ctrlsMult: number; penalty: 'Extreme' | 'High' | 'Moderate' | 'Low' }
  > = {
    GCC: { baseScore: 78, regsMult: 3, ctrlsMult: 24, penalty: 'High' },
    'Middle East': { baseScore: 68, regsMult: 2, ctrlsMult: 18, penalty: 'Moderate' },
    'North Africa': { baseScore: 64, regsMult: 2, ctrlsMult: 16, penalty: 'Moderate' },
    'Levant & Other': { baseScore: 56, regsMult: 2, ctrlsMult: 14, penalty: 'Moderate' },
    'The Sahel': { baseScore: 38, regsMult: 1, ctrlsMult: 8, penalty: 'Low' },
    'Horn of Africa': { baseScore: 35, regsMult: 1, ctrlsMult: 6, penalty: 'Low' },
  };

  const matrix: HeatmapCellData[] = [];

  for (const country of ALL_MENAT_COUNTRIES) {
    const customCountryData = countryBaseMap[country.id.toLowerCase()];

    for (const sector of MATURITY_SECTORS) {
      let score: number;
      let regsCount: number;
      let ctrlsCount: number;
      let penalty: 'Extreme' | 'High' | 'Moderate' | 'Low';
      let primaryRegulationCodes: string[];
      let primaryAuthorities: string[];
      let keyMandates: string[];
      let gapAnalysis: string;

      if (customCountryData && customCountryData[sector.id]) {
        const item = customCountryData[sector.id];
        score = item.score;
        regsCount = item.regs;
        ctrlsCount = item.ctrls;
        penalty = item.penalty;
        primaryRegulationCodes = item.codes;
        primaryAuthorities = item.auth;
        keyMandates = item.keyMandates;
        gapAnalysis = item.gap;
      } else {
        const benchmark = defaultRegionalBenchmarks[country.region] || defaultRegionalBenchmarks['Levant & Other'];
        // Modulate slightly based on sector
        let sectorModifier = 0;
        if (sector.id === 'cyber') sectorModifier = 8;
        if (sector.id === 'ai') sectorModifier = -12;
        if (sector.id === 'privacy') sectorModifier = 2;
        if (sector.id === 'telco') sectorModifier = 4;

        score = Math.min(95, Math.max(15, benchmark.baseScore + sectorModifier));
        regsCount = Math.max(1, Math.round(benchmark.regsMult * (score / 70)));
        ctrlsCount = Math.max(4, Math.round(benchmark.ctrlsMult * (score / 60)));
        penalty = score > 75 ? 'High' : score > 50 ? 'Moderate' : 'Low';

        primaryRegulationCodes = [`${country.code}-${sector.shortName.toUpperCase().replace(/\s+/g, '-')}-REG`];
        primaryAuthorities = country.primaryAuthorities.slice(0, 2);
        keyMandates = [
          `General compliance with ${sector.name} baseline requirements`,
          `Security incident logging and notification to ${country.primaryAuthorities[0] || 'national authority'}`,
          `Adherence to national data sovereignty and system integrity guidelines`,
        ];
        gapAnalysis =
          score > 65
            ? 'Structured statutory framework in place; ongoing harmonization with international benchmarks.'
            : 'Emerging regulatory framework; primary reliance on high-level executive circulars and sector guidelines.';
      }

      const { level, label: levelLabel } = getMaturityLevel(score);

      let enforcementStatus: HeatmapCellData['enforcementStatus'] = 'Active Statutory Fines';
      if (score < 40) enforcementStatus = 'Consultation Draft';
      else if (score < 60) enforcementStatus = 'Sectoral Guidelines';
      else if (score < 75) enforcementStatus = 'Phased Implementation';

      matrix.push({
        countryId: country.id,
        countryName: country.name,
        countryFlag: country.flag,
        region: country.region,
        macroRegion: country.macroRegion,
        sectorId: sector.id,
        sectorName: sector.name,
        score,
        level,
        levelLabel,
        regulationsCount: regsCount,
        mandatoryControlsCount: ctrlsCount,
        primaryRegulationCodes,
        primaryAuthorities,
        keyMandates,
        penaltyRisk: penalty,
        enforcementStatus,
        gapAnalysis,
      });
    }
  }

  return matrix;
}

// Compute country-level aggregate summaries
export function generateCountryMaturitySummaries(): CountryMaturitySummary[] {
  const matrix = generateComplianceMaturityMatrix();
  const summaries: CountryMaturitySummary[] = [];

  for (const country of ALL_MENAT_COUNTRIES) {
    const countryCells = matrix.filter((c) => c.countryId === country.id);
    if (countryCells.length === 0) continue;

    const totalScore = countryCells.reduce((acc, c) => acc + c.score, 0);
    const overallScore = Math.round(totalScore / countryCells.length);
    const totalRegs = countryCells.reduce((acc, c) => acc + c.regulationsCount, 0);
    const totalCtrls = countryCells.reduce((acc, c) => acc + c.mandatoryControlsCount, 0);

    const aiCell = countryCells.find((c) => c.sectorId === 'ai');
    const cyberCell = countryCells.find((c) => c.sectorId === 'cyber');
    const privacyCell = countryCells.find((c) => c.sectorId === 'privacy');
    const cloudCell = countryCells.find((c) => c.sectorId === 'cloud');
    const fintechCell = countryCells.find((c) => c.sectorId === 'fintech');

    const sectorRanks: Record<MaturitySectorId, number> = {} as any;
    for (const s of MATURITY_SECTORS) {
      sectorRanks[s.id] = countryCells.find((c) => c.sectorId === s.id)?.score || 0;
    }

    let maturityTier: CountryMaturitySummary['maturityTier'] = 'Tier 4 - Emerging Guidelines';
    if (overallScore >= 85) maturityTier = 'Tier 1 - World Class & Strict';
    else if (overallScore >= 70) maturityTier = 'Tier 2 - Advanced & Expanding';
    else if (overallScore >= 50) maturityTier = 'Tier 3 - Structured Framework';

    summaries.push({
      countryId: country.id,
      countryName: country.name,
      countryFlag: country.flag,
      region: country.region,
      overallMaturityScore: overallScore,
      totalRegulations: totalRegs,
      totalMandatoryControls: totalCtrls,
      aiMaturityScore: aiCell?.score || 0,
      cyberMaturityScore: cyberCell?.score || 0,
      privacyMaturityScore: privacyCell?.score || 0,
      cloudMaturityScore: cloudCell?.score || 0,
      fintechMaturityScore: fintechCell?.score || 0,
      sectorRanks,
      primaryEnforcementAuthority: country.primaryAuthorities[0] || 'National Regulatory Body',
      maturityTier,
    });
  }

  return summaries.sort((a, b) => b.overallMaturityScore - a.overallMaturityScore);
}

// Get top regulatory density countries for a specific sector (e.g. AI or Cyber)
export function getSectorTopPerformers(
  sectorId: MaturitySectorId,
  limit: number = 6
): { countryName: string; countryFlag: string; score: number; regsCount: number; ctrlsCount: number; authorities: string[] }[] {
  const matrix = generateComplianceMaturityMatrix();
  return matrix
    .filter((c) => c.sectorId === sectorId)
    .sort((a, b) => b.score - a.score || b.regulationsCount - a.regulationsCount)
    .slice(0, limit)
    .map((c) => ({
      countryName: c.countryName,
      countryFlag: c.countryFlag,
      score: c.score,
      regsCount: c.regulationsCount,
      ctrlsCount: c.mandatoryControlsCount,
      authorities: c.primaryAuthorities,
    }));
}
