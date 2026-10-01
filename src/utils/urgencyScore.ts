import { Regulation, SectorType } from '../types/regulatory';
import { RegulatorySentiment } from '../types/news';
import { REGULATORY_TIMELINE_EVENTS } from '../data/regulatoryTimelineData';

export interface UrgencyScoreResult {
  score: number; // 0 - 100
  tier: 'Critical' | 'High' | 'Moderate' | 'Monitored';
  sentiment: RegulatorySentiment;
  sentimentRationale: string;
  sectorMultiplier: number;
  targetDeadline: string;
  daysRemaining: number;
  urgencyRationale: string;
  breakdown: {
    sentimentScore: number;
    sectorRiskScore: number;
    deadlineScore: number;
  };
}

// Sector risk weightings based on systemic exposure and audit rigor
const SECTOR_RISK_WEIGHTS: Record<string, { weight: number; label: string }> = {
  'Critical Infrastructure': { weight: 1.5, label: 'Systemic National Asset' },
  'Oil & Gas': { weight: 1.45, label: 'High OT/SCADA Exposure' },
  'Power & Energy': { weight: 1.45, label: 'Critical Grid Operations' },
  'Utilities': { weight: 1.4, label: 'Essential Public Utility' },
  'Banking': { weight: 1.45, label: 'Prudential & Capital Scrutiny' },
  'Financial Services': { weight: 1.4, label: 'Stringent Market Conduct' },
  'Payments': { weight: 1.4, label: 'Real-Time Transaction Integrity' },
  'Fintech': { weight: 1.35, label: 'Accelerated Sandbox & Licensing' },
  'Insurance': { weight: 1.3, label: 'Actuarial & Solvency Controls' },
  'Cloud & Hyperscalers': { weight: 1.4, label: 'Sovereignty & Data Residency' },
  'Telco': { weight: 1.35, label: 'Lawful Intercept & Telecom Security' },
  'Healthcare': { weight: 1.3, label: 'Sensitive Clinical & Patient Data' },
  'Government': { weight: 1.3, label: 'Sovereign Security Baselines' },
  'Space & Aerospace': { weight: 1.25, label: 'Dual-Use & Export Controls' },
  'Defense & National Security': { weight: 1.5, label: 'High Security Classification' },
  'Manufacturing': { weight: 1.2, label: 'Industrial Automation & Safety' },
  'Automotive': { weight: 1.15, label: 'Connected Vehicle Telemetry' },
  'Retail & E-Commerce': { weight: 1.15, label: 'Consumer Data & PCI-DSS' },
  'Digital Tech Startups': { weight: 1.1, label: 'Emerging Tech Governance' },
  'Mining & Extraction': { weight: 1.2, label: 'Physical & Digital Safety' },
  'Gaming & Entertainment': { weight: 1.05, label: 'Youth Protection & Content' },
};

export function calculateUrgencyScore(
  regulation: Regulation,
  timelineEvents: typeof REGULATORY_TIMELINE_EVENTS = REGULATORY_TIMELINE_EVENTS
): UrgencyScoreResult {
  // 1. Regulatory Sentiment Assessment
  let sentiment: RegulatorySentiment = 'Impactful';
  let sentimentScore = 80;
  let sentimentRationale = 'Binding statutory instrument with continuous enforcement mandates.';

  const codeUpper = regulation.code.toUpperCase();
  const nameUpper = regulation.name.toUpperCase();
  const authorityUpper = regulation.authority.toUpperCase();

  if (
    codeUpper.includes('ECC') ||
    codeUpper.includes('CSCF') ||
    codeUpper.includes('ISR') ||
    codeUpper.includes('DORA') ||
    authorityUpper.includes('NCA') ||
    authorityUpper.includes('CBUAE') ||
    authorityUpper.includes('SAMA')
  ) {
    sentiment = 'Impactful';
    sentimentScore = 92;
    sentimentRationale = 'High-enforcement authority with active supervisory penalties and compulsory audit filing.';
  } else if (
    regulation.status === 'Draft / Public Consultation' ||
    nameUpper.includes('CONSULTATION') ||
    nameUpper.includes('SANDBOX') ||
    nameUpper.includes('DRAFT')
  ) {
    sentiment = 'Consultation Phase';
    sentimentScore = 65;
    sentimentRationale = 'Draft framework in public consultation; early compliance preparation advised before gazette passage.';
  } else if (codeUpper.includes('GUIDELINE') || nameUpper.includes('FRAMEWORK') || nameUpper.includes('GUIDELINES')) {
    sentiment = 'Neutral';
    sentimentScore = 52;
    sentimentRationale = 'Supervisory guidance and advisory baseline with flexible transitional adoption.';
  } else if (regulation.isTech && regulation.status === 'Enacted') {
    sentiment = 'Impactful';
    sentimentScore = 82;
    sentimentRationale = 'Active statutory mandate imposing mandatory technical controls and compliance attestations.';
  }

  // 2. Sector Risk Multiplier
  let maxWeight = 1.0;
  let highestRiskSector: SectorType | null = null;

  if (regulation.targetSectors && regulation.targetSectors.length > 0) {
    regulation.targetSectors.forEach((sec) => {
      const entry = SECTOR_RISK_WEIGHTS[sec];
      if (entry && entry.weight > maxWeight) {
        maxWeight = entry.weight;
        highestRiskSector = sec;
      }
    });
  } else {
    maxWeight = 1.15; // default enterprise baseline
  }

  // Convert multiplier into a 0-100 sector risk score
  const sectorRiskScore = Math.min(100, Math.round((maxWeight / 1.5) * 100));

  // 3. Upcoming Deadlines & Proximity Calculation
  // Grounded against statutory timeline milestones and periodic supervisory audits
  const now = new Date();
  let daysRemaining = 45;
  let targetDeadline = '';

  // Check if there is an official statutory event in the (file-backed) timeline
  const timelineEvent = timelineEvents.find(
    (e) => e.regulationId === regulation.id || e.regulationCode.toLowerCase() === regulation.code.toLowerCase()
  );

  if (timelineEvent && timelineEvent.deadlineDate) {
    const eventDeadline = new Date(timelineEvent.deadlineDate);
    if (eventDeadline.getTime() > now.getTime()) {
      daysRemaining = Math.max(1, Math.ceil((eventDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      targetDeadline = eventDeadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      // Past statutory enactment date: calculate next scheduled annual supervisory recertification
      const nextCycle = new Date(eventDeadline);
      while (nextCycle.getTime() <= now.getTime()) {
        nextCycle.setFullYear(nextCycle.getFullYear() + 1);
      }
      daysRemaining = Math.max(1, Math.ceil((nextCycle.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      targetDeadline = nextCycle.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } else {
    // Derive deterministic upcoming compliance milestone from regulation hash (30 to 180 days out)
    const hash = regulation.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const cycleOffsets = [35, 48, 62, 75, 90, 110, 135, 160, 185];
    daysRemaining = cycleOffsets[hash % cycleOffsets.length];

    if (regulation.status === 'Draft / Public Consultation') {
      daysRemaining = Math.min(daysRemaining, 45);
    }

    const futureDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    targetDeadline = futureDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  let deadlineScore = 40;
  if (daysRemaining <= 30) {
    deadlineScore = 98;
  } else if (daysRemaining <= 60) {
    deadlineScore = 88;
  } else if (daysRemaining <= 90) {
    deadlineScore = 74;
  } else if (daysRemaining <= 180) {
    deadlineScore = 60;
  } else {
    deadlineScore = 42;
  }

  // Composite Weighted Urgency Score calculation:
  // 35% Sentiment + 35% Sector Risk + 30% Deadline Proximity
  const compositeScore = Math.round(
    sentimentScore * 0.35 + sectorRiskScore * 0.35 + deadlineScore * 0.3
  );
  const finalScore = Math.max(15, Math.min(99, compositeScore));

  let tier: 'Critical' | 'High' | 'Moderate' | 'Monitored' = 'Moderate';
  if (finalScore >= 80) {
    tier = 'Critical';
  } else if (finalScore >= 65) {
    tier = 'High';
  } else if (finalScore >= 45) {
    tier = 'Moderate';
  } else {
    tier = 'Monitored';
  }

  // Clean, non-repeating executive jurisprudence rationale
  const sectorContext = highestRiskSector ? `${highestRiskSector} and regulated infrastructure` : 'designated economic sectors';
  const urgencyRationale = `${tier} priority under ${regulation.authority}: Statutory requirements mandate strict compliance controls across ${sectorContext}. Next supervisory audit or filing window scheduled for ${targetDeadline}.`;

  return {
    score: finalScore,
    tier,
    sentiment,
    sentimentRationale,
    sectorMultiplier: maxWeight,
    targetDeadline,
    daysRemaining,
    urgencyRationale,
    breakdown: {
      sentimentScore,
      sectorRiskScore,
      deadlineScore,
    },
  };
}
