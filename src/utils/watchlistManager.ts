import {
  WatchlistPin,
  WatchlistNotification,
  WatchlistPreferences,
  WatchlistPriority,
  Regulation,
  RegulatoryUpdate,
  TimelineEvent,
} from '../types/regulatory';
import { REGULATORY_TIMELINE_EVENTS } from '../data/regulatoryTimelineData';
import { MENAT_VERSION_DIFFS } from '../data/versionDiffsData';

const PINS_STORAGE_KEY = 'menat_watchlist_pins_v2';
const NOTIFICATIONS_STORAGE_KEY = 'menat_watchlist_notifications_v2';
const PREFERENCES_STORAGE_KEY = 'menat_watchlist_preferences_v2';

/**
 * Watchlist pins are PER-USER. Each account keeps its own pinned regulations,
 * so what one user pins is never visible to another. Pins are keyed in
 * localStorage by the logged-in user's id. Users with no pins start empty
 * (no default/seed pins) — the UI shows a "no regulations pinned yet" state.
 */
function pinsStorageKey(userId?: string | null): string {
  return userId ? `${PINS_STORAGE_KEY}::${userId}` : `${PINS_STORAGE_KEY}::guest`;
}

// New users (and guests) begin with an empty watchlist.
export const DEFAULT_WATCHLIST_PINS: WatchlistPin[] = [];

export const DEFAULT_WATCHLIST_PREFERENCES: WatchlistPreferences = {
  emailAlertSimulation: true,
  soundAlerts: true,
  urgencyThreshold: 'All',
  autoPinOnExport: false,
};

// Load the current user's saved pins from localStorage (empty if none).
export function loadWatchlistPins(userId?: string | null): WatchlistPin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(pinsStorageKey(userId));
    if (!raw) return []; // no pins yet for this user -> empty watchlist
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save the current user's pins to localStorage (scoped by user id).
export function saveWatchlistPins(pins: WatchlistPin[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(pinsStorageKey(userId), JSON.stringify(pins));
  } catch (err) {
    console.error('Failed to save watchlist pins:', err);
  }
}

// Load preferences
export function loadWatchlistPreferences(): WatchlistPreferences {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_WATCHLIST_PREFERENCES;
    return { ...DEFAULT_WATCHLIST_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WATCHLIST_PREFERENCES;
  }
}

// Save preferences
export function saveWatchlistPreferences(prefs: WatchlistPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save watchlist preferences:', err);
  }
}

// Synthesize an alert sound using Web Audio API (safe, no external asset needed)
export function playAlertChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a friendly two-tone notification chime
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

// Compute specialized notifications for the currently pinned regulations
export function generateSpecializedNotifications(
  pins: WatchlistPin[],
  regulations: Regulation[],
  updates: RegulatoryUpdate[],
  customNotifications: WatchlistNotification[] = [],
  timelineEvents: typeof REGULATORY_TIMELINE_EVENTS = REGULATORY_TIMELINE_EVENTS,
  benchmarkDate: string = '2026-09-22'
): WatchlistNotification[] {
  const pinnedIds = new Set(pins.map((p) => p.regulationId));
  const pinMap = new Map<string, WatchlistPin>();
  pins.forEach((p) => pinMap.set(p.regulationId, p));

  const pinnedRegulations = regulations.filter((r) => pinnedIds.has(r.id));
  const generated: WatchlistNotification[] = [];

  // Benchmark 'current date' anchor (configurable per region via admin panel).
  const CURRENT_DATE = new Date(`${benchmarkDate}T00:00:00Z`);

  // 1. Cross-reference with (file-backed) Timeline Events for Pinned Regulations
  timelineEvents.forEach((evt) => {
    // Check if this timeline event corresponds to any pinned regulation
    // Match precedence matters: prefer an EXACT regulation id/code match so a
    // specific event (e.g. OTCC-1:2022) links to the right regulation. Only
    // fall back to the loose "same country + same authority" heuristic when the
    // event carries NO regulation identifier at all — otherwise an OTCC event
    // would wrongly attach to the first NCA regulation found (e.g. ECC).
    const hasSpecificRef = Boolean(evt.regulationId || evt.regulationCode);
    const normalizeCode = (c: string) => c.toLowerCase().replace(/v\d+.*/, '').trim();

    const matchedReg =
      // 1) Exact id or code match on the event's own identifier
      pinnedRegulations.find(
        (r) =>
          (evt.regulationId && (evt.regulationId === r.id || evt.regulationId === r.code)) ||
          (evt.regulationCode &&
            (normalizeCode(r.code) === normalizeCode(evt.regulationCode) ||
              normalizeCode(r.code).includes(normalizeCode(evt.regulationCode)) ||
              normalizeCode(evt.regulationCode).includes(normalizeCode(r.code))))
      ) ||
      // 2) Loose country + authority fallback ONLY for events with no specific ref
      (!hasSpecificRef
        ? pinnedRegulations.find(
            (r) =>
              r.countryId === evt.countryId &&
              r.authorityShort.toLowerCase() === evt.authorityShort.toLowerCase()
          )
        : undefined);

    if (matchedReg) {
      const pinConfig = pinMap.get(matchedReg.id);
      if (pinConfig && !pinConfig.notifyOnDeadlines && evt.eventType.includes('Deadline')) return;

      const deadline = new Date(evt.deadlineDate);
      const diffDays = Math.round((deadline.getTime() - CURRENT_DATE.getTime()) / (1000 * 60 * 60 * 24));

      let notifType: WatchlistNotification['type'] = 'Approaching Deadline';
      if (evt.eventType === 'Public Consultation') notifType = 'Public Consultation';
      else if (evt.eventType === 'Major Overhaul') notifType = 'Version Diff Published';
      else if (evt.eventType === 'Grace Period Expiry') notifType = 'Approaching Deadline';

      generated.push({
        id: `notif-evt-${evt.id}-${matchedReg.id}`,
        regulationId: matchedReg.id,
        regulationCode: matchedReg.code,
        regulationName: matchedReg.name,
        countryId: matchedReg.countryId,
        countryName: evt.countryName,
        countryFlag: evt.countryFlag,
        title: `${evt.title} (${diffDays > 0 ? `${diffDays} Days Remaining` : 'Enforcement Active'})`,
        summary: evt.description,
        date: evt.deadlineDate,
        urgency: evt.urgency,
        type: notifType,
        read: false,
        sourceUrl: evt.officialUrl,
        versionDiffId: evt.versionDiffId || matchedReg.versionDiffId,
        daysRemaining: diffDays,
        keyActionItems: evt.complianceChecklist.slice(0, 3),
      });
    }
  });

  // 2. Cross-reference with Regulatory Updates from Scraper & Authorities
  updates.forEach((upd) => {
    // Prefer a specific match (update title explicitly names the regulation
    // code) so a same-country/same-authority update doesn't attach to the wrong
    // regulation. Only fall back to the broad authority/category heuristics if
    // no specific code match exists among the pinned regulations.
    const matchedReg =
      pinnedRegulations.find(
        (r) =>
          r.countryId === upd.countryId &&
          r.code &&
          upd.title.toLowerCase().includes(r.code.toLowerCase())
      ) ||
      pinnedRegulations.find((r) => {
        if (r.countryId === upd.countryId) {
          if (upd.authority.toLowerCase().includes(r.authorityShort.toLowerCase())) return true;
          if (upd.category === r.category) return true;
        }
        return false;
      });

    if (matchedReg) {
      let notifType: WatchlistNotification['type'] = 'Statutory Amendment';
      if (upd.type === 'Public Consultation') notifType = 'Public Consultation';
      else if (upd.type === 'Enforcement / Circular') notifType = 'Enforcement Circular';

      generated.push({
        id: `notif-upd-${upd.id}-${matchedReg.id}`,
        regulationId: matchedReg.id,
        regulationCode: matchedReg.code,
        regulationName: matchedReg.name,
        countryId: matchedReg.countryId,
        countryName: upd.countryName,
        countryFlag: '🌐',
        title: upd.title,
        summary: upd.summary,
        date: upd.publicationDate,
        urgency: upd.impactLevel,
        type: notifType,
        read: false,
        sourceUrl: upd.sourceUrl,
        versionDiffId: matchedReg.versionDiffId,
        keyActionItems: upd.keyRequirements,
      });
    }
  });

  // 3. Cross-reference with Version Diffs for pinned regulations
  MENAT_VERSION_DIFFS.forEach((diff) => {
    const matchedReg = pinnedRegulations.find((r) => r.id === diff.regulationId || r.versionDiffId === diff.id);
    if (matchedReg) {
      generated.push({
        id: `notif-diff-${diff.id}-${matchedReg.id}`,
        regulationId: matchedReg.id,
        regulationCode: matchedReg.code,
        regulationName: matchedReg.name,
        countryId: matchedReg.countryId,
        countryName: diff.countryName,
        countryFlag: diff.countryFlag,
        title: `Statutory Evolution Diff Available: ${diff.previousVersion} → ${diff.latestVersion}`,
        summary: diff.headlineSummary,
        date: diff.latestDate,
        urgency: 'Critical',
        type: 'Version Diff Published',
        read: false,
        sourceUrl: diff.officialAmendmentUrl || matchedReg.officialUrl,
        versionDiffId: diff.id,
        keyActionItems: diff.complianceActionItems.slice(0, 3),
      });
    }
  });

  // Merge with custom notifications (e.g. simulated live alerts) and deduplicate
  const all = [...customNotifications, ...generated];
  const seen = new Set<string>();
  const deduplicated: WatchlistNotification[] = [];

  for (const n of all) {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      deduplicated.push(n);
    }
  }

  // Sort by date (descending)
  return deduplicated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Generate a simulated live real-time alert for testing the notifications pipeline
export function createSimulatedLiveAlert(pinnedRegulation: Regulation): WatchlistNotification {
  const now = new Date().toISOString();
  const alertVariants = [
    {
      type: 'Enforcement Circular' as const,
      urgency: 'Critical' as const,
      title: `${pinnedRegulation.authorityShort} Issues Urgent Compliance Circular on ${pinnedRegulation.code}`,
      summary: `Regulatory inspection alert: The authority has mandated all regulated entities conduct an immediate self-audit of privileged account controls and upload compliance attestations within 30 calendar days.`,
      actionItems: [
        'Perform internal gap analysis on Section 2 access management controls',
        'Upload verified CISO attestation to regulatory portal',
        'Review vendor third-party connectivity logs',
      ],
    },
    {
      type: 'Statutory Amendment' as const,
      urgency: 'High' as const,
      title: `Executive Regulations Published for ${pinnedRegulation.code} Implementation`,
      summary: `Official gazette notification: Supplementary technical controls issued regarding cross-border cloud storage architectures, encryption key management, and incident disclosure intervals.`,
      actionItems: [
        'Review updated technical annexure against existing controls',
        'Update institutional data residency inventory',
        'Align SOC escalation thresholds to 4-hour mandatory reporting window',
      ],
    },
    {
      type: 'Approaching Deadline' as const,
      urgency: 'Critical' as const,
      title: `Mandatory Transition Grace Period Cut-off in 45 Days for ${pinnedRegulation.code}`,
      summary: `Statutory countdown notice: Statutory grace period expires on schedule. Uncertified entities risk suspension of licensed operations and administrative penalties.`,
      actionItems: [
        'Finalize accredited external audit documentation',
        'Submit remediation roadmap for residual high-risk findings',
        'Schedule executive sign-off meeting before the deadline',
      ],
    },
  ];

  const variant = alertVariants[Math.floor(Math.random() * alertVariants.length)];

  return {
    id: `sim-alert-${Date.now()}`,
    regulationId: pinnedRegulation.id,
    regulationCode: pinnedRegulation.code,
    regulationName: pinnedRegulation.name,
    countryId: pinnedRegulation.countryId,
    countryName: pinnedRegulation.countryId.toUpperCase(),
    countryFlag: '🚨',
    title: variant.title,
    summary: variant.summary,
    date: now.split('T')[0],
    urgency: variant.urgency,
    type: variant.type,
    read: false,
    sourceUrl: pinnedRegulation.officialUrl,
    versionDiffId: pinnedRegulation.versionDiffId,
    daysRemaining: variant.type === 'Approaching Deadline' ? 45 : undefined,
    keyActionItems: variant.actionItems,
  };
}

// Export Watchlist portfolio to CSV
export function exportWatchlistCsv(pins: WatchlistPin[], regulations: Regulation[]): void {
  const pinMap = new Map(pins.map((p) => [p.regulationId, p]));
  const matched = regulations.filter((r) => pinMap.has(r.id));

  const headers = [
    'Regulation Code',
    'Regulation Name',
    'Country',
    'Authority',
    'Classification',
    'Current Version',
    'Effective Date',
    'Watchlist Priority',
    'Pinned Date',
    'Assigned To',
    'Internal Compliance Notes',
    'Custom Tags',
    'Total Controls Count',
    'Official Portal URL',
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const rows = [headers.join(',')];

  for (const reg of matched) {
    const pin = pinMap.get(reg.id)!;
    rows.push(
      [
        escapeCsv(reg.code),
        escapeCsv(reg.name),
        escapeCsv(reg.countryId.toUpperCase()),
        escapeCsv(reg.authority),
        escapeCsv(reg.isTech ? 'Tech Regulation' : 'Non-Tech'),
        escapeCsv(reg.currentVersion || `v${reg.yearEnacted}`),
        escapeCsv(reg.effectiveDate),
        escapeCsv(pin.priority),
        escapeCsv(pin.pinnedAt ? pin.pinnedAt.split('T')[0] : 'N/A'),
        escapeCsv(pin.assignedTo || 'Unassigned'),
        escapeCsv(pin.notes || ''),
        escapeCsv(pin.tags?.join('; ') || ''),
        escapeCsv(reg.controlStructure.totalControlsCount),
        escapeCsv(reg.officialUrl),
      ].join(',')
    );
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MENAT_Personalized_Watchlist_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export Watchlist portfolio to formatted JSON
export function exportWatchlistJson(pins: WatchlistPin[], regulations: Regulation[]): void {
  const pinMap = new Map(pins.map((p) => [p.regulationId, p]));
  const matched = regulations.filter((r) => pinMap.has(r.id));

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalPinnedRegulations: matched.length,
    portfolio: matched.map((reg) => {
      const pin = pinMap.get(reg.id)!;
      return {
        regulationId: reg.id,
        code: reg.code,
        name: reg.name,
        countryId: reg.countryId,
        authority: reg.authority,
        category: reg.category,
        isTech: reg.isTech,
        currentVersion: reg.currentVersion,
        effectiveDate: reg.effectiveDate,
        lastUpdated: reg.lastUpdated,
        targetSectors: reg.targetSectors,
        officialUrl: reg.officialUrl,
        controlStructure: reg.controlStructure,
        watchlistMetadata: {
          pinnedAt: pin.pinnedAt,
          priority: pin.priority,
          notes: pin.notes || '',
          tags: pin.tags || [],
          assignedTo: pin.assignedTo || 'Unassigned',
          notificationPreferences: {
            notifyOnAmendments: pin.notifyOnAmendments,
            notifyOnConsultations: pin.notifyOnConsultations,
            notifyOnDeadlines: pin.notifyOnDeadlines,
          },
        },
      };
    }),
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MENAT_Personalized_Watchlist_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
