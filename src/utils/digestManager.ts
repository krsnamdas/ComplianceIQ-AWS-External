import { SectorType, RegulatoryUpdate } from '../types/regulatory';
import { MOCK_REGULATORY_UPDATES } from '../data/menatData';

export interface DigestSubscriptionPreferences {
  subscribedCountries: string[]; // e.g. ['sa', 'ae', 'qa', 'kw', 'bh', 'om']
  subscribedSectors: SectorType[];
  priorityFilter: 'high_only' | 'all';
  deliveryFrequency: 'daily' | 'weekly' | 'realtime';
  emailAlertsEnabled: boolean;
  recipientEmail: string;
  slackWebhookEnabled?: boolean;
  readAlertIds: string[];
  lastDigestGenerated: string;
}

const STORAGE_KEY = 'complianceiq_digest_prefs_v2';

export const DEFAULT_DIGEST_PREFERENCES: DigestSubscriptionPreferences = {
  subscribedCountries: ['sa', 'ae', 'qa', 'eg', 'bh'], // Top GCC & MENA hubs by default
  subscribedSectors: [
    'Banking',
    'Financial Services',
    'Payments',
    'Cloud & Hyperscalers',
    'Critical Infrastructure',
    'Government',
    'Oil & Gas',
  ],
  priorityFilter: 'high_only',
  deliveryFrequency: 'daily',
  emailAlertsEnabled: true,
  recipientEmail: 'compliance-officer@enterprise.com',
  slackWebhookEnabled: false,
  readAlertIds: [],
  lastDigestGenerated: new Date().toISOString(),
};

export const ALL_SECTORS_LIST: SectorType[] = [
  'Banking',
  'Financial Services',
  'Payments',
  'Fintech',
  'Cloud & Hyperscalers',
  'Telco',
  'Critical Infrastructure',
  'Government',
  'Oil & Gas',
  'Utilities',
  'Power & Energy',
  'Healthcare',
  'Digital Tech Startups',
  'Retail & E-Commerce',
  'Manufacturing',
  'Automotive',
  'Space & Aerospace',
  'Gaming & Entertainment',
];

export function loadDigestPreferences(): DigestSubscriptionPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DIGEST_PREFERENCES,
        ...parsed,
        subscribedCountries: Array.isArray(parsed.subscribedCountries)
          ? parsed.subscribedCountries
          : DEFAULT_DIGEST_PREFERENCES.subscribedCountries,
        subscribedSectors: Array.isArray(parsed.subscribedSectors)
          ? parsed.subscribedSectors
          : DEFAULT_DIGEST_PREFERENCES.subscribedSectors,
      };
    }
  } catch (e) {
    console.error('Failed to load digest preferences:', e);
  }
  return DEFAULT_DIGEST_PREFERENCES;
}

export function saveDigestPreferences(prefs: DigestSubscriptionPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save digest preferences:', e);
  }
}

/**
 * Filter updates based on active subscription preferences
 */
export function getFilteredDigestAlerts(
  allUpdates: RegulatoryUpdate[],
  prefs: DigestSubscriptionPreferences
): RegulatoryUpdate[] {
  return allUpdates.filter((upd) => {
    // 1. Country Check: match countryId
    const normCountry = upd.countryId.toLowerCase();
    const matchesCountry =
      prefs.subscribedCountries.length === 0 ||
      prefs.subscribedCountries.some((c) => {
        const cLower = c.toLowerCase();
        return (
          cLower === normCountry ||
          (cLower === 'sa' && normCountry === 'ksa') ||
          (cLower === 'ksa' && normCountry === 'sa') ||
          (cLower === 'ae' && normCountry === 'uae') ||
          (cLower === 'uae' && normCountry === 'ae') ||
          normCountry.includes(cLower) ||
          cLower.includes(normCountry)
        );
      });

    if (!matchesCountry) return false;

    // 2. Sector Check: does the update overlap with any subscribed sectors?
    const matchesSector =
      prefs.subscribedSectors.length === 0 ||
      upd.targetSectors.some((s) => prefs.subscribedSectors.includes(s));

    if (!matchesSector) return false;

    // 3. Priority Check
    if (prefs.priorityFilter === 'high_only') {
      if (upd.impactLevel !== 'Critical' && upd.impactLevel !== 'High') {
        return false;
      }
    }

    return true;
  });
}

/**
 * Generate synthetic executive brief from filtered updates
 */
export function generateDigestExecutiveBrief(
  alerts: RegulatoryUpdate[],
  subscribedCountriesCount: number,
  subscribedSectorsCount: number
): {
  headline: string;
  keyEnforcementTakeaways: string[];
  immediateActionsRequired: string[];
  daysRemainingAlert?: string;
} {
  if (alerts.length === 0) {
    return {
      headline: 'All clear across subscribed jurisdictions. No high-priority alerts outstanding.',
      keyEnforcementTakeaways: [
        'Baseline regulations are operating normally across subscribed sectors.',
        'Official gazettes and central bank registers report zero critical amendments in the current 48-hour cycle.',
      ],
      immediateActionsRequired: ['Continue periodic automated scraper sync every 48 hours.'],
    };
  }

  const criticalCount = alerts.filter((a) => a.impactLevel === 'Critical').length;
  const highCount = alerts.filter((a) => a.impactLevel === 'High').length;

  const headline = `Regional Compliance Brief: ${criticalCount} Critical and ${highCount} High-Priority Regulatory Directives Active across ${subscribedCountriesCount} Jurisdictions.`;

  const keyEnforcementTakeaways = alerts.slice(0, 4).map((a) => {
    return `[${a.countryName} - ${a.authority}] ${a.title}: ${a.summary.slice(0, 150)}...`;
  });

  const actions = alerts.slice(0, 3).flatMap((a) => a.keyRequirements.slice(0, 1));

  return {
    headline,
    keyEnforcementTakeaways,
    immediateActionsRequired:
      actions.length > 0
        ? actions
        : [
            'Audit internal technical baselines against revised statutory requirements.',
            'Schedule briefing with DPO and CISO leadership regarding sovereign cloud transfers.',
          ],
    daysRemainingAlert: criticalCount > 0 ? 'Urgent: Immediate statutory compliance actions mandated' : undefined,
  };
}
