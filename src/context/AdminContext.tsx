import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Regulation, Country, TimelineEvent, RegulatoryUpdate } from '../types/regulatory';
import { MENAT_REGULATIONS, MENAT_COUNTRIES, MOCK_REGULATORY_UPDATES } from '../data/menatData';
import { REGULATORY_TIMELINE_EVENTS } from '../data/regulatoryTimelineData';
import {
  UserProfile,
  FeatureFlags,
  SystemBroadcast,
  AuditLogEntry,
  UserRoleType,
  LinkSuggestion,
  RegulationSuggestion,
  RegulationFieldChange,
} from '../types/admin';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'ciadmin1',
    username: 'ciadmin1',
    password: 'cisadmin123',
    name: 'ciadmin1',
    email: 'ciadmin1@complianceiq.io',
    role: 'admin',
    roleLabel: 'System Administrator / Lead Compliance Architect',
    isAdmin: true,
    avatarInitials: 'CA1',
    jobTitle: 'Chief Compliance Systems Administrator',
    organization: 'ComplianceIQ Regional Governance',
    jurisdiction: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    status: 'active',
    lastActive: 'Just now',
    dateCreated: '2025-01-10',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
      canAccessAdminPanel: true,
      canManageRegulations: true,
      canToggleFeatures: true,
      canManageUsers: true,
    },
  },
  {
    id: 'ciadmin2',
    username: 'ciadmin2',
    password: 'cisadmin123',
    name: 'ciadmin2',
    email: 'ciadmin2@complianceiq.io',
    role: 'admin',
    roleLabel: 'Regional Administrator & Systems Architect',
    isAdmin: true,
    avatarInitials: 'CA2',
    jobTitle: 'Principal Regulatory Systems Administrator',
    organization: 'ComplianceIQ Regional Governance',
    jurisdiction: 'United Arab Emirates',
    countryFlag: '🇦🇪',
    status: 'active',
    lastActive: '12 mins ago',
    dateCreated: '2025-02-14',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
      canAccessAdminPanel: true,
      canManageRegulations: true,
      canToggleFeatures: true,
      canManageUsers: true,
    },
  },
  {
    id: 'sasuser1',
    username: 'sasuser1',
    password: 'sasuser123',
    name: 'sasuser1',
    email: 'sasuser1@complianceiq.io',
    role: 'compliance_officer',
    roleLabel: 'Senior Compliance Officer',
    isAdmin: false,
    avatarInitials: 'SU1',
    jobTitle: 'Head of Banking Regulatory Compliance',
    organization: 'Gulf Banking Regulatory Services',
    jurisdiction: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    status: 'active',
    lastActive: '45 mins ago',
    dateCreated: '2025-03-01',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
      canAccessAdminPanel: false,
      canManageRegulations: false,
      canToggleFeatures: false,
      canManageUsers: false,
    },
  },
  {
    id: 'sasuser2',
    username: 'sasuser2',
    password: 'sasuser123',
    name: 'sasuser2',
    email: 'sasuser2@complianceiq.io',
    role: 'risk_analyst',
    roleLabel: 'Cyber Risk & Cloud Governance Analyst',
    isAdmin: false,
    avatarInitials: 'SU2',
    jobTitle: 'Senior Cloud Resilience Specialist',
    organization: 'Sovereign Cloud & Telco Infrastructure',
    jurisdiction: 'Qatar',
    countryFlag: '🇶🇦',
    status: 'active',
    lastActive: '2 hours ago',
    dateCreated: '2025-04-12',
    permissions: {
      canTriggerScraper: false,
      canManageWatchlist: true,
      canExportReports: false,
      canEditControls: false,
      canAccessAdminPanel: false,
      canManageRegulations: false,
      canToggleFeatures: false,
      canManageUsers: false,
    },
  },
  {
    id: 'sasuser3',
    username: 'sasuser3',
    password: 'sasuser123',
    name: 'sasuser3',
    email: 'sasuser3@complianceiq.io',
    role: 'compliance_officer',
    roleLabel: 'FinTech & CASP Regulatory Specialist',
    isAdmin: false,
    avatarInitials: 'SU3',
    jobTitle: 'Director of Digital Asset Compliance',
    organization: 'FinTech & Capital Markets Technology',
    jurisdiction: 'Türkiye',
    countryFlag: '🇹🇷',
    status: 'active',
    lastActive: 'Yesterday',
    dateCreated: '2025-05-20',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
      canAccessAdminPanel: false,
      canManageRegulations: false,
      canToggleFeatures: false,
      canManageUsers: false,
    },
  },
  {
    id: 'sasuser4',
    username: 'sasuser4',
    password: 'sasuser123',
    name: 'sasuser4',
    email: 'sasuser4@complianceiq.io',
    role: 'auditor',
    roleLabel: 'Lead IT Assurance & Critical Infra Auditor',
    isAdmin: false,
    avatarInitials: 'SU4',
    jobTitle: 'Principal Security Assurance Auditor',
    organization: 'Critical Infrastructure & Telco Assurance',
    jurisdiction: 'Egypt',
    countryFlag: '🇪🇬',
    status: 'active',
    lastActive: '3 days ago',
    dateCreated: '2025-06-08',
    permissions: {
      canTriggerScraper: false,
      canManageWatchlist: false,
      canExportReports: true,
      canEditControls: false,
      canAccessAdminPanel: false,
      canManageRegulations: false,
      canToggleFeatures: false,
      canManageUsers: false,
    },
  },
];

export const GUEST_USER: UserProfile = {
  id: 'guest',
  username: 'guest',
  name: 'Guest Officer',
  email: 'guest@complianceiq.io',
  role: 'guest',
  roleLabel: 'Guest Visitor (Unauthenticated)',
  isAdmin: false,
  avatarInitials: 'GV',
  jobTitle: 'Public Visitor',
  organization: 'Public Regulatory Preview',
  jurisdiction: 'MENAT Region',
  countryFlag: '🌐',
  status: 'active',
  lastActive: 'Just now',
  dateCreated: '2026-01-01',
  permissions: {
    canTriggerScraper: false,
    canManageWatchlist: false,
    canExportReports: false,
    canEditControls: false,
    canAccessAdminPanel: false,
    canManageRegulations: false,
    canToggleFeatures: false,
    canManageUsers: false,
  },
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  regulatoryFeed: true,
  aiCopilot: true,
  maturityHeatmap: true,
  regulatoryRoadmap: true,
  regulatoryTimeline: true,
  versionDiffs: true,
  controlsCrosswalk: true,
  regulationComparator: true,
  controlInterpreter: true,
  aiRedlining: true,
  sectorMatrix: true,
  sourcesManager: true,
  exportReports: true,
  watchlistAlerts: true,
  systemBroadcast: true,
  smartInsights: true,
};

export const DEFAULT_BROADCAST: SystemBroadcast = {
  enabled: true,
  level: 'warning',
  title: 'Statutory Advisory',
  message:
    'SDAIA Cross-Border Data Transfer standard clauses mandatory registration audit cycle is in effect. Review statutory requirements and file SCC documentation.',
  actionUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf',
  actionLabel: 'View SDAIA PDPL Official Law (PDF)',
  author: 'Tariq Al-Mansoor (Super Admin)',
  updatedAt: '2026-09-22 06:30 UTC',
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: '2026-09-22 06:15:22 UTC',
    userId: 'ciadmin1',
    userName: 'ciadmin1',
    userEmail: 'ciadmin1@complianceiq.io',
    userRole: 'admin',
    actionType: 'BROADCAST_UPDATED',
    targetEntity: 'System Announcement Banner',
    details: 'Published mandatory cross-border data transfer advisory for SDAIA PDPL.',
  },
  {
    id: 'log-seed-2',
    timestamp: '2026-09-22 05:40:11 UTC',
    userId: 'ciadmin2',
    userName: 'ciadmin2',
    userEmail: 'ciadmin2@complianceiq.io',
    userRole: 'admin',
    actionType: 'FEATURE_TOGGLED',
    targetEntity: 'regulatoryRoadmap',
    details: 'Enabled Regulatory Roadmap & Investment Forecasting module for all jurisdictions.',
  },
  {
    id: 'log-seed-3',
    timestamp: '2026-09-22 04:12:05 UTC',
    userId: 'ciadmin1',
    userName: 'ciadmin1',
    userEmail: 'ciadmin1@complianceiq.io',
    userRole: 'admin',
    actionType: 'REGULATION_LINK_UPDATED',
    targetEntity: 'NCA ECC-1:2018',
    details: 'Verified and updated official PDF documentation link to NCA official mirror.',
  },
  {
    id: 'log-seed-4',
    timestamp: '2026-09-22 03:25:40 UTC',
    userId: 'sasuser1',
    userName: 'sasuser1',
    userEmail: 'sasuser1@complianceiq.io',
    userRole: 'compliance_officer',
    actionType: 'REGULATORY_DOWNLOAD',
    targetEntity: 'GCC Multi-Framework Compliance Pack',
    details: 'Generated and downloaded formal PDF dossier (ComplianceIQ_Report_6Regs_2026-09-22.pdf) covering NCA ECC, SDAIA PDPL, and UAE DESC.',
  },
  {
    id: 'log-seed-5',
    timestamp: '2026-09-22 02:45:18 UTC',
    userId: 'sasuser1',
    userName: 'sasuser1',
    userEmail: 'sasuser1@complianceiq.io',
    userRole: 'compliance_officer',
    actionType: 'POLICY_REDLINING',
    targetEntity: 'Enterprise Cloud Data Handling Policy vs SDAIA PDPL',
    details: 'Completed automated AI policy redline audit against Saudi PDPL. Score: 88% (Grade B), 4 critical missing consent clauses remediated.',
  },
  {
    id: 'log-seed-6',
    timestamp: '2026-09-22 01:10:00 UTC',
    userId: 'ciadmin1',
    userName: 'ciadmin1',
    userEmail: 'ciadmin1@complianceiq.io',
    userRole: 'admin',
    actionType: 'SCRAPER_TRIGGERED',
    targetEntity: '24 MENAT Jurisdictions',
    details: 'Executed periodic automated scraper crawler probe across all official sovereign gazettes and portal feeds.',
  },
];

const STORAGE_KEYS = {
  USERS: 'complianceiq_users_v3',
  CURRENT_USER_ID: 'complianceiq_current_user_id_v3',
  AUTH_STATE: 'complianceiq_auth_state_v3',
  ADMIN_UNLOCKED: 'complianceiq_admin_unlocked_v3',
  FEATURE_FLAGS: 'complianceiq_feature_flags_v3',
  REGULATIONS: 'complianceiq_regulations_v3',
  COUNTRIES: 'complianceiq_countries_v3',
  BROADCAST: 'complianceiq_broadcast_v3',
  AUDIT_LOGS: 'complianceiq_audit_logs_v3',
  LINK_SUGGESTIONS: 'complianceiq_link_suggestions_v3',
  REGULATION_SUGGESTIONS: 'complianceiq_regulation_suggestions_v3',
  TIMELINE_EVENTS: 'complianceiq_timeline_events_v3',
};

interface AdminContextType {
  // Authentication & Guest State
  isAuthenticated: boolean;
  isGuest: boolean;
  logout: () => void;
  quickLoginAs: (userId: string) => void;

  // Admin Security Gateway
  isAdminUnlocked: boolean;
  unlockAdmin: (password: string) => boolean;
  lockAdmin: () => void;

  // User Management & IAM
  users: UserProfile[];
  currentUser: UserProfile;
  isCurrentUserAdmin: boolean;
  switchUser: (userId: string) => void;
  loginWithCredentials: (username: string, password: string) => { success: boolean; message?: string; user?: UserProfile };
  addUser: (user: Omit<UserProfile, 'id' | 'dateCreated' | 'lastActive'>) => void;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;

  // Feature Flags
  featureFlags: FeatureFlags;
  toggleFeature: (feature: keyof FeatureFlags, value?: boolean) => void;
  updateFeatureFlags: (newFlags: FeatureFlags) => void;
  resetFeatureFlags: () => void;

  // Country & Jurisdiction CRUD
  countries: Country[];
  addCountry: (country: Country) => void;
  updateCountry: (id: string, updates: Partial<Country>) => void;
  deleteCountry: (id: string) => void;
  resetCountriesToDefault: () => void;

  // Regulation CRUD
  regulations: Regulation[];
  addRegulation: (regulation: Omit<Regulation, 'id'> & { id?: string }) => void;
  updateRegulation: (id: string, updates: Partial<Regulation>) => void;
  deleteRegulation: (id: string) => void;
  updateRegulationLink: (id: string, officialUrl: string, documentPdfUrl?: string) => void;
  resetRegulationsToDefault: () => void;
  importRegulationsBackup: (newRegs: Regulation[]) => void;

  // Regional Regulatory Digest feed (file-backed, admin-editable). Powers the
  // "Regional Regulatory Digest" page and its "Official Gazette" source links.
  digestUpdates: RegulatoryUpdate[];
  updateDigestUpdate: (id: string, updates: Partial<RegulatoryUpdate>) => void;

  // Region benchmark "current date" anchor (configurable per region / deployment)
  benchmarkDate: string;
  updateBenchmarkDate: (date: string) => void;

  // Timeline Events & Statutory Deadlines Manager
  timelineEvents: TimelineEvent[];
  effectiveTimelineEvents: TimelineEvent[];
  addTimelineEvent: (event: TimelineEvent) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  resetTimelineEventsToDefault: () => void;
  batchUpdateTimelineEvents: (updates: { id: string; changes: Partial<TimelineEvent> }[], auditSummary?: string) => void;

  // Atomic Staged Pending Edits (Deadlines & Regulatory Statuses)
  pendingTimelineEdits: Record<string, Partial<TimelineEvent>>;
  pendingRegulationEdits: Record<string, Partial<Regulation>>;
  stageTimelineEdit: (id: string, changes: Partial<TimelineEvent>) => void;
  unstageTimelineEdit: (id: string) => void;
  stageRegulationEdit: (id: string, changes: Partial<Regulation>) => void;
  unstageRegulationEdit: (id: string) => void;
  discardPendingEdits: () => void;
  applyPendingEdits: () => { success: boolean; timelineCount: number; regulationCount: number };
  hasPendingEdits: boolean;
  totalPendingEditsCount: number;

  // System Broadcast Banner
  broadcastBanner: SystemBroadcast;
  updateBroadcastBanner: (updates: Partial<SystemBroadcast>) => void;

  // Audit Log
  auditLogs: AuditLogEntry[];
  addAuditLog: (
    actionType: AuditLogEntry['actionType'],
    targetEntity: string,
    details: string
  ) => void;
  clearAuditLogs: () => void;
  exportAuditLogsCSV: () => void;

  // Backup & Restore
  exportFullBackupJSON: () => void;
  importFullBackupJSON: (jsonString: string) => boolean;

  // Automated Regulatory Link Reachability & PDF Integrity
  linkAudits: Record<string, RegulatoryLinkAuditResult>;
  isLinkAuditRunning: boolean;
  lastLinkAuditTimestamp: string | null;
  runLinkAudit: () => Promise<void>;
  getLinkAudit: (regulationId: string, field: 'officialUrl' | 'documentPdfUrl') => RegulatoryLinkAuditResult | undefined;
  fetchLinkAudits: () => void;

  // User-Submitted Link Correction Workflow
  linkSuggestions: LinkSuggestion[];
  submitLinkSuggestion: (
    regulationId: string,
    linkType: 'officialUrl' | 'documentPdfUrl',
    suggestedUrl: string,
    notes?: string
  ) => { success: boolean; message: string };
  reviewLinkSuggestion: (
    suggestionId: string,
    action: 'accept' | 'reject',
    adminNotes?: string
  ) => void;

  // User-Submitted Regulation Field-Correction Workflow (all fields)
  regulationSuggestions: RegulationSuggestion[];
  submitRegulationSuggestion: (
    regulationId: string,
    changes: RegulationFieldChange[],
    proposedValues: Record<string, unknown>,
    notes?: string
  ) => { success: boolean; message: string };
  reviewRegulationSuggestion: (
    suggestionId: string,
    action: 'accept' | 'reject',
    adminNotes?: string
  ) => void;
}

export interface RegulatoryLinkAuditResult {
  id: string;
  regulationId: string;
  regulationCode: string;
  regulationName: string;
  countryId: string;
  authority: string;
  url: string;
  field: 'officialUrl' | 'documentPdfUrl';
  isPdf: boolean;
  status: number;
  statusText: string;
  responseTimeMs: number;
  isReachable: boolean;
  isBroken: boolean;
  isRedirect: boolean;
  redirectUrl?: string;
  lastChecked: string;
  error?: string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users State
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return INITIAL_USERS;
  });

  // Authentication State (default to false for public guest visitor)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return false; // Default to unauthenticated guest
  });

  // Admin Security Gateway Unlock State (requires entering admin password)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.ADMIN_UNLOCKED);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return false;
  });

  // Current User ID
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'sasuser1'; // Default persona when authenticated
  });

  // Memoized so a fresh object identity isn't handed to consumers on every
  // unrelated state change (e.g. editing a regulation). Stable identity prevents
  // App-level navigation effects from re-firing spuriously.
  // Resolve to the real user profile whenever the session is authenticated OR
  // the admin console has been unlocked via the password gateway. Treating an
  // unlocked admin console as a resolved session keeps isCurrentUserAdmin stable
  // during the re-render that a regulation edit triggers, so the App-level
  // navigation guards don't bounce the admin out of the console.
  const currentUser = useMemo(
    () =>
      isAuthenticated || isAdminUnlocked
        ? users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0]
        : GUEST_USER,
    [isAuthenticated, isAdminUnlocked, users, currentUserId]
  );
  const isGuest = !isAuthenticated;
  const isCurrentUserAdmin =
    (isAuthenticated || isAdminUnlocked) && (currentUser.isAdmin || currentUser.role === 'admin');

  // 2. Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEATURE_FLAGS);
      if (saved) return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_FEATURE_FLAGS;
  });

  // Sync feature flags with backend on initial mount
  useEffect(() => {
    fetch('/api/features')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.features) {
          setFeatureFlags((prev) => ({
            ...prev,
            ...data.features,
          }));
        }
      })
      .catch((err) => {
        console.warn('[AdminContext] Could not fetch server feature flags, using local state:', err);
      });
  }, []);

  // Defensive: collapse any regulations that share the same id, keeping the
  // first occurrence. A stale localStorage cache (or bad data) with duplicate
  // ids otherwise causes React "two children with the same key" warnings and
  // double-rendered rows. Applied wherever regulations enter state.
  const dedupeRegulationsById = (regs: Regulation[]): Regulation[] => {
    const seen = new Set<string>();
    const out: Regulation[] = [];
    for (const r of regs) {
      if (r && !seen.has(r.id)) {
        seen.add(r.id);
        out.push(r);
      }
    }
    return out;
  };

  // 3. Dynamic Regulations State
  const [regulations, setRegulationsRaw] = useState<Regulation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGULATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Self-healing migration for outdated cached URLs
          return dedupeRegulationsById(parsed.map((r: Regulation) => {
            if (r.id === 'ksa-pdpl') {
              return {
                ...r,
                officialUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf',
                documentPdfUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf',
              };
            }
            if (r.id === 'ksa-ai-ethics') {
              return {
                ...r,
                officialUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-ethics-principles-en.pdf',
                documentPdfUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-ethics-principles-en.pdf',
              };
            }
            if (r.id === 'ksa-ecc') {
              return {
                ...r,
                officialUrl: 'https://nca.gov.sa/sites/default/files/2021-10/ECC-1-2018-EN.pdf',
                documentPdfUrl: 'https://nca.gov.sa/sites/default/files/2021-10/ECC-1-2018-EN.pdf',
              };
            }
            return r;
          }));
        }
      }
    } catch (e) {
      console.error('Error loading regulations:', e);
    }
    return dedupeRegulationsById(MENAT_REGULATIONS);
  });

  // Always dedupe by id whenever regulations are set, so no code path (server
  // hydrate, edits, backup restore) can ever introduce duplicate-key rows.
  const setRegulations: React.Dispatch<React.SetStateAction<Regulation[]>> = (value) => {
    setRegulationsRaw((prev) => {
      const next = typeof value === 'function' ? (value as (p: Regulation[]) => Regulation[])(prev) : value;
      return dedupeRegulationsById(next);
    });
  };

  // 3a. Hydrate regulations from the server (file-backed source of truth).
  // The region JSON file (data/regions/<REGION>/regulations.json) is authoritative;
  // localStorage is only a fast offline cache. On mount we fetch the server copy
  // and adopt it so admin edits persisted to the file are always reflected.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.regulations) && data.regulations.length > 0) {
          setRegulations(data.regulations);
        }
      })
      .catch((e) => console.warn('[AdminContext] Could not hydrate regulations from server; using cached copy.', e));
    return () => {
      cancelled = true;
    };
  }, []);

  // 3b. Regional Regulatory Digest updates. Seeded from the in-code fallback,
  // then hydrated from the server (file-backed source of truth at
  // data/regions/<REGION>/digest-updates.json) so admin edits to the feed —
  // including the "Official Gazette" source links — are always reflected.
  const [digestUpdates, setDigestUpdates] = useState<RegulatoryUpdate[]>(MOCK_REGULATORY_UPDATES);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/digest/updates')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.updates) && data.updates.length > 0) {
          setDigestUpdates(data.updates);
        }
      })
      .catch((e) => console.warn('[AdminContext] Could not hydrate digest updates from server; using in-code seed.', e));
    return () => {
      cancelled = true;
    };
  }, []);

  // Admin edit of a single digest update (e.g. correct a broken Official Gazette
  // link). Optimistically updates local state, then persists to the region file
  // via the server; on failure we log and re-hydrate to stay consistent.
  const updateDigestUpdate = (id: string, updates: Partial<RegulatoryUpdate>) => {
    setDigestUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates, id } : u)));
    fetch(`/api/digest/updates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.update) {
          setDigestUpdates((prev) => prev.map((u) => (u.id === id ? data.update : u)));
        }
      })
      .catch((e) => {
        console.error('[AdminContext] Failed to persist digest update; re-hydrating.', e);
        fetch('/api/digest/updates')
          .then((res) => res.json())
          .then((d) => {
            if (d && Array.isArray(d.updates)) setDigestUpdates(d.updates);
          })
          .catch(() => {});
      });
    addAuditLog(
      'DIGEST_UPDATE_EDITED',
      id,
      `Edited digest update "${id}" (fields: ${Object.keys(updates).join(', ')})`
    );
  };

  // 3b. Countries State
  const [countriesRaw, setCountriesRaw] = useState<Country[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUNTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading countries:', e);
    }
    return MENAT_COUNTRIES;
  });

  // Dynamically calculate synchronized regulation counts for each country
  const countries: Country[] = countriesRaw.map((country) => {
    const cId = country.id.toLowerCase();
    const cCode = country.code.toLowerCase();
    const cName = country.name.toLowerCase();

    const countryRegs = regulations.filter((r) => {
      const rId = (r.countryId || '').toLowerCase();
      return (
        rId === cId ||
        rId === cCode ||
        (cId === 'uae' && (rId === 'ae' || rId.includes('emirates') || rId.includes('uae'))) ||
        (cId === 'ksa' && (rId === 'sa' || rId.includes('saudi') || rId.includes('ksa'))) ||
        (cName && rId.includes(cName))
      );
    });

    const techCount = countryRegs.filter((r) => r.isTech || r.regulationNature === 'Tech' || r.regulationNature === 'Hybrid').length;
    const nonTechCount = countryRegs.filter((r) => (!r.isTech && r.regulationNature === 'Non-Tech') || (!r.isTech && !r.regulationNature)).length;

    return {
      ...country,
      totalRegulationsCount: countryRegs.length,
      techRegulationsCount: techCount,
      nonTechRegulationsCount: nonTechCount,
    };
  });

  // 4. Broadcast Banner State
  const [broadcastBanner, setBroadcastBanner] = useState<SystemBroadcast>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BROADCAST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          !parsed.actionUrl ||
          parsed.actionUrl === 'https://sdaia.gov' ||
          parsed.actionUrl === 'https://sdaia.gov.sa' ||
          (parsed.actionUrl.includes('sdaia.gov') && !parsed.actionUrl.endsWith('.pdf'))
        ) {
          parsed.actionUrl = DEFAULT_BROADCAST.actionUrl;
          parsed.actionLabel = DEFAULT_BROADCAST.actionLabel;
        }
        return { ...DEFAULT_BROADCAST, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_BROADCAST;
  });

  // 5. Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  });

  // 6. Automated Regulatory Link & PDF Integrity State
  const [linkAudits, setLinkAudits] = useState<Record<string, RegulatoryLinkAuditResult>>({});
  const [isLinkAuditRunning, setIsLinkAuditRunning] = useState(false);
  const [lastLinkAuditTimestamp, setLastLinkAuditTimestamp] = useState<string | null>(null);

  // 7. User-Submitted Link Suggestions State
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINK_SUGGESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'sug-ksa-pdpl',
        regulationId: 'ksa-pdpl',
        regulationCode: 'Saudi PDPL (M/19)',
        regulationName: 'Personal Data Protection Law (PDPL)',
        linkType: 'documentPdfUrl',
        currentUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf',
        suggestedUrl: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf',
        notes: 'Direct official English translation published on the SDAIA national portal with verified legal definitions.',
        submittedByUserId: 'sasuser1',
        submittedByUserName: 'sasuser1 (Senior Compliance Officer)',
        submittedAt: '2026-09-22 14:30 UTC',
        status: 'pending',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LINK_SUGGESTIONS, JSON.stringify(linkSuggestions));
    } catch {
      // ignore
    }
  }, [linkSuggestions]);

  // 7b. User-Submitted Regulation Field-Correction Suggestions State
  const [regulationSuggestions, setRegulationSuggestions] = useState<RegulationSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGULATION_SUGGESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGULATION_SUGGESTIONS, JSON.stringify(regulationSuggestions));
    } catch {
      // ignore
    }
  }, [regulationSuggestions]);

  // 8. Dynamic Timeline Events & Statutory Deadlines State
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE_EVENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading timeline events from storage:', e);
    }
    return REGULATORY_TIMELINE_EVENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE_EVENTS, JSON.stringify(timelineEvents));
    } catch {
      // ignore
    }
  }, [timelineEvents]);

  // Hydrate timeline events from the region file-backed API (source of truth).
  // Seeded synchronously above from the in-code copy so there is no UI flash.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/timeline')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setTimelineEvents(data.events);
        }
      })
      .catch(() => {
        /* keep the synchronous seed on error — no UI disruption */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Region benchmark "current date" anchor. Defaults to the historical benchmark
  // (2026-09-22) so behaviour is unchanged; hydrated from /api/config so a
  // deployment (e.g. APAC) can set it to its own go-live date via the admin panel.
  const [benchmarkDate, setBenchmarkDate] = useState<string>('2026-09-22');
  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cancelled) return;
        if (cfg && typeof cfg.benchmarkDate === 'string') {
          setBenchmarkDate(cfg.benchmarkDate);
        }
      })
      .catch(() => {
        /* keep default on error */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateBenchmarkDate = (date: string) => {
    setBenchmarkDate(date);
    fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benchmarkDate: date }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          addAuditLog('SYSTEM_CONFIG_UPDATED', 'Benchmark Date', `Updated the platform benchmark "current date" to ${date}.`);
        }
      })
      .catch((e) => console.warn('[AdminContext] Could not persist benchmark date:', e));
  };

  // 9. Atomic Staged Pending Edits State (Deadlines & Regulatory Statuses)
  const [pendingTimelineEdits, setPendingTimelineEdits] = useState<Record<string, Partial<TimelineEvent>>>({});
  const [pendingRegulationEdits, setPendingRegulationEdits] = useState<Record<string, Partial<Regulation>>>({});

  const submitLinkSuggestion = (
    regulationId: string,
    linkType: 'officialUrl' | 'documentPdfUrl',
    suggestedUrl: string,
    notes?: string
  ): { success: boolean; message: string } => {
    const trimmed = suggestedUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { success: false, message: 'Please enter a valid URL starting with http:// or https://' };
    }

    const targetReg = regulations.find((r) => r.id === regulationId);
    if (!targetReg) {
      return { success: false, message: 'Target regulation not found.' };
    }

    const currentUrl = linkType === 'officialUrl' ? targetReg.officialUrl : targetReg.documentPdfUrl;

    const newSuggestion: LinkSuggestion = {
      id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      regulationId,
      regulationCode: targetReg.code,
      regulationName: targetReg.name,
      linkType,
      currentUrl: currentUrl || 'N/A',
      suggestedUrl: trimmed,
      notes: notes?.trim() || 'User submitted verified alternative mirror link.',
      submittedByUserId: currentUser.id,
      submittedByUserName: `${currentUser.name} (${currentUser.roleLabel})`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'pending',
    };

    setLinkSuggestions((prev) => [newSuggestion, ...prev]);

    addAuditLog(
      'REGULATION_LINK_UPDATED',
      targetReg.code,
      `User ${currentUser.name} submitted working link suggestion for ${linkType === 'officialUrl' ? 'Portal' : 'PDF'}: ${trimmed}`
    );

    return {
      success: true,
      message: 'Working link request submitted to Administrator for review and verification.',
    };
  };

  const reviewLinkSuggestion = (
    suggestionId: string,
    action: 'accept' | 'reject',
    adminNotes?: string
  ) => {
    const suggestion = linkSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    if (action === 'accept') {
      // 1. Update regulation link in state & persistence
      setRegulations((prev) => {
        const next = prev.map((r) => {
          if (r.id === suggestion.regulationId) {
            return {
              ...r,
              [suggestion.linkType]: suggestion.suggestedUrl,
              lastUpdated: new Date().toISOString().split('T')[0],
            };
          }
          return r;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.REGULATIONS, JSON.stringify(next));
        } catch {}
        return next;
      });

      // 2. Mark this link as verified in linkAudits
      const auditKey = `${suggestion.regulationId}:${suggestion.linkType}`;
      const targetReg = regulations.find((r) => r.id === suggestion.regulationId);
      setLinkAudits((prev) => {
        const existing = prev[auditKey];
        return {
          ...prev,
          [auditKey]: {
            id: auditKey,
            regulationId: suggestion.regulationId,
            regulationCode: suggestion.regulationCode,
            regulationName: suggestion.regulationName,
            countryId: targetReg?.countryId || existing?.countryId || 'SA',
            authority: targetReg?.authority || existing?.authority || 'Regulator',
            field: suggestion.linkType,
            isPdf: suggestion.linkType === 'documentPdfUrl',
            url: suggestion.suggestedUrl,
            status: 200,
            statusText: 'Verified & Approved by Admin',
            responseTimeMs: existing?.responseTimeMs || 120,
            isReachable: true,
            isBroken: false,
            isRedirect: false,
            lastChecked: new Date().toISOString(),
          },
        };
      });

      // 3. Mark suggestion as accepted
      setLinkSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'accepted' as const,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                reviewedBy: currentUser.name,
              }
            : s
        )
      );

      addAuditLog(
        'REGULATION_LINK_UPDATED',
        suggestion.regulationCode,
        `Admin accepted user link submission. Updated ${suggestion.linkType} to "${suggestion.suggestedUrl}" and marked link as verified.`
      );
    } else {
      // Mark suggestion as rejected
      setLinkSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'rejected' as const,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                reviewedBy: currentUser.name,
              }
            : s
        )
      );

      addAuditLog(
        'REGULATION_LINK_UPDATED',
        suggestion.regulationCode,
        `Admin rejected user link submission for "${suggestion.suggestedUrl}". Reason: ${adminNotes || 'Declined'}.`
      );
    }
  };

  // --- Regulation field-correction suggestions (all fields) ---
  const submitRegulationSuggestion = (
    regulationId: string,
    changes: RegulationFieldChange[],
    proposedValues: Record<string, unknown>,
    notes?: string
  ): { success: boolean; message: string } => {
    if (!changes || changes.length === 0) {
      return { success: false, message: 'No changes were proposed. Adjust at least one field before submitting.' };
    }
    const targetReg = regulations.find((r) => r.id === regulationId);
    if (!targetReg) {
      return { success: false, message: 'Target regulation not found.' };
    }

    const newSuggestion: RegulationSuggestion = {
      id: `regsug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      regulationId,
      regulationCode: targetReg.code,
      regulationName: targetReg.name,
      changes,
      proposedValues,
      notes: notes?.trim() || undefined,
      submittedByUserId: currentUser.id,
      submittedByUserName: `${currentUser.name} (${currentUser.roleLabel})`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      status: 'pending',
    };

    setRegulationSuggestions((prev) => [newSuggestion, ...prev]);
    addAuditLog(
      'SUGGESTION_SUBMITTED',
      targetReg.code,
      `User ${currentUser.name} proposed ${changes.length} field correction(s) for "${targetReg.name}": ${changes.map((c) => c.fieldLabel).join(', ')}.`
    );

    return {
      success: true,
      message: 'Your suggested correction has been submitted to the Administrator review queue.',
    };
  };

  const reviewRegulationSuggestion = (
    suggestionId: string,
    action: 'accept' | 'reject',
    adminNotes?: string
  ) => {
    const suggestion = regulationSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    if (action === 'accept') {
      // Apply the proposed field values via updateRegulation (persists to region file)
      updateRegulation(suggestion.regulationId, suggestion.proposedValues as Partial<Regulation>);
      setRegulationSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'accepted' as const,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                reviewedBy: currentUser.name,
                reviewNotes: adminNotes,
              }
            : s
        )
      );
      addAuditLog(
        'SUGGESTION_ACCEPTED',
        suggestion.regulationCode,
        `Admin accepted user correction for "${suggestion.regulationName}". Applied fields: ${suggestion.changes.map((c) => c.fieldLabel).join(', ')}.`
      );
    } else {
      setRegulationSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                status: 'rejected' as const,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                reviewedBy: currentUser.name,
                reviewNotes: adminNotes,
              }
            : s
        )
      );
      addAuditLog(
        'SUGGESTION_REJECTED',
        suggestion.regulationCode,
        `Admin rejected user correction for "${suggestion.regulationName}". Reason: ${adminNotes || 'Declined'}.`
      );
    }
  };

  const fetchLinkAudits = () => {
    fetch('/api/admin/links/audit-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.audits) {
          setLinkAudits(data.audits);
          if (data.lastAuditTimestamp) {
            setLastLinkAuditTimestamp(data.lastAuditTimestamp);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLinkAudits();
  }, []);

  const runLinkAudit = async () => {
    setIsLinkAuditRunning(true);
    try {
      const res = await fetch('/api/admin/links/audit-run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.audits) {
          setLinkAudits(data.audits);
          setLastLinkAuditTimestamp(data.lastAuditTimestamp || new Date().toISOString());
        }
      }
    } catch (e) {
      console.warn('Failed to run link audit on backend:', e);
    } finally {
      setIsLinkAuditRunning(false);
    }
  };

  const getLinkAudit = (regulationId: string, field: 'officialUrl' | 'documentPdfUrl'): RegulatoryLinkAuditResult | undefined => {
    return linkAudits[`${regulationId}:${field}`];
  };

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch {
      // ignore
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(featureFlags));
    } catch {
      // ignore
    }
  }, [featureFlags]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGULATIONS, JSON.stringify(regulations));
    } catch {
      // ignore
    }
  }, [regulations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COUNTRIES, JSON.stringify(countriesRaw));
    } catch {
      // ignore
    }
  }, [countriesRaw]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCAST, JSON.stringify(broadcastBanner));
    } catch {
      // ignore
    }
  }, [broadcastBanner]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  // Helper to append audit log
  const addAuditLog = (
    actionType: AuditLogEntry['actionType'],
    targetEntity: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      actionType,
      targetEntity,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 199)]); // Keep last 200 entries
  };

  // User Actions
  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      if (!target.isAdmin && target.role !== 'admin') {
        setIsAdminUnlocked(false);
        try {
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_UNLOCKED);
        } catch {
          // ignore
        }
      }
      addAuditLog('USER_SWITCHED', target.name, `Active session switched to ${target.name} (${target.roleLabel}).`);
    }
  };

  const loginWithCredentials = (usernameInput: string, passwordInput: string): { success: boolean; message?: string; user?: UserProfile } => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    const target = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        u.id.toLowerCase() === cleanUser ||
        u.name.toLowerCase() === cleanUser ||
        u.email.toLowerCase() === cleanUser
    );
    if (!target) {
      return { success: false, message: `Account "${usernameInput}" not found. Available accounts: ciadmin1, ciadmin2, sasuser1, sasuser2, sasuser3, sasuser4.` };
    }
    if (target.status !== 'active') {
      return { success: false, message: `Account "${target.username}" is suspended.` };
    }

    const validPasswords = [
      target.password,
      target.isAdmin ? 'cisadmin123' : 'sasuser123',
      target.isAdmin ? 'ciadmin123' : 'sasuser123',
    ].filter(Boolean) as string[];

    if (!validPasswords.includes(cleanPass)) {
      return { success: false, message: 'Invalid username or password.' };
    }
    setCurrentUserId(target.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
    } catch {
      // ignore
    }
    if (target.isAdmin || target.role === 'admin') {
      setIsAdminUnlocked(true);
      try {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_UNLOCKED, 'true');
      } catch {
        // ignore
      }
    } else {
      setIsAdminUnlocked(false);
      try {
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_UNLOCKED);
      } catch {
        // ignore
      }
    }
    addAuditLog('USER_SWITCHED', target.name, `User ${target.username} logged in with credentials.`);
    return { success: true, user: target };
  };

  const quickLoginAs = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      } catch {
        // ignore
      }
      if (target.isAdmin || target.role === 'admin') {
        setIsAdminUnlocked(true);
        try {
          sessionStorage.setItem(STORAGE_KEYS.ADMIN_UNLOCKED, 'true');
        } catch {
          // ignore
        }
      } else {
        setIsAdminUnlocked(false);
        try {
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_UNLOCKED);
        } catch {
          // ignore
        }
      }
      addAuditLog('USER_SWITCHED', target.name, `Quick persona login as ${target.name}.`);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdminUnlocked(false);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'false');
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_UNLOCKED);
    } catch {
      // ignore
    }
    addAuditLog('USER_SWITCHED', 'Session Ended', 'User logged out; returned to public guest mode.');
  };

  const unlockAdmin = (password: string): boolean => {
    const clean = password.trim();
    if (
      clean === 'cisadmin123' ||
      clean === 'ciadmin123' ||
      clean === 'admin123' ||
      (currentUser.isAdmin && clean === currentUser.password)
    ) {
      setIsAdminUnlocked(true);
      // Unlocking the admin console with a valid password is an authenticated
      // action. Mark the session authenticated so `isCurrentUserAdmin`
      // (= isAuthenticated && isAdmin) is consistent with the unlocked state.
      // Without this, App-level guards saw isAuthenticated=false and bounced the
      // admin out of the console back to Overview on the next re-render.
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_UNLOCKED, 'true');
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
      } catch {
        // ignore
      }
      addAuditLog('FEATURE_TOGGLED', 'Admin Console Gateway', 'Admin panel unlocked via local password authentication.');
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_UNLOCKED);
    } catch {
      // ignore
    }
  };

  const addUser = (userData: Omit<UserProfile, 'id' | 'dateCreated' | 'lastActive'>) => {
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const initials = userData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: UserProfile = {
      ...userData,
      id: newId,
      username: userData.username || newId,
      password: userData.password || (userData.isAdmin ? 'ciadmin123' : 'sasuser123'),
      avatarInitials: initials || 'UR',
      dateCreated: new Date().toISOString().split('T')[0],
      lastActive: 'Never',
    };

    setUsers((prev) => [...prev, newUser]);
    addAuditLog('USER_CREATED', newUser.name, `Created user account: ${newUser.email} with role ${newUser.role}.`);
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (updates.role) {
            updated.isAdmin = updates.role === 'admin';
          }
          return updated;
        }
        return u;
      })
    );
    const target = users.find((u) => u.id === userId);
    addAuditLog('USER_UPDATED', target ? target.name : userId, `Updated user attributes: ${Object.keys(updates).join(', ')}.`);
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === currentUserId) {
      alert('Cannot delete the currently active user session.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('USER_STATUS_CHANGED', target.name, `Deleted user account: ${target.email}.`);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          addAuditLog('USER_STATUS_CHANGED', u.name, `Changed user status to ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Feature Flag Actions
  const toggleFeature = (feature: keyof FeatureFlags, value?: boolean) => {
    setFeatureFlags((prev) => {
      const nextVal = value !== undefined ? value : !prev[feature];
      const updated = { ...prev, [feature]: nextVal };
      addAuditLog(
        'FEATURE_TOGGLED',
        feature,
        `Toggled feature ${feature} to ${nextVal ? 'ENABLED' : 'DISABLED'}.`
      );

      // Async sync to backend
      fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, enabled: nextVal }),
      }).catch((e) => console.warn('[AdminContext] Failed to sync feature to backend:', e));

      return updated;
    });
  };

  const resetFeatureFlags = () => {
    setFeatureFlags(DEFAULT_FEATURE_FLAGS);
    addAuditLog('FEATURE_TOGGLED', 'All Features', 'Reset all feature flags to system default.');

    // Async sync to backend
    fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: DEFAULT_FEATURE_FLAGS }),
    }).catch((e) => console.warn('[AdminContext] Failed to reset features on backend:', e));
  };

  const updateFeatureFlags = (newFlags: FeatureFlags) => {
    setFeatureFlags(newFlags);
    addAuditLog(
      'FEATURE_TOGGLED',
      'Batch Feature Flags',
      'Applied bulk platform feature flags update in one shot.'
    );

    // Async sync to backend
    fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: newFlags }),
    }).catch((e) => console.warn('[AdminContext] Failed to sync batch features to backend:', e));
  };

  // Regulation Actions
  const addRegulation = (regData: Omit<Regulation, 'id'> & { id?: string }) => {
    const newId =
      regData.id ||
      `${regData.countryId}-${regData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newRegulation: Regulation = {
      ...regData,
      id: newId,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setRegulations((prev) => [newRegulation, ...prev]);
    addAuditLog(
      'REGULATION_CREATED',
      newRegulation.code,
      `Created regulation "${newRegulation.name}" (${newRegulation.authority}, ${newRegulation.countryId.toUpperCase()}).`
    );

    // Persist the new regulation to the region JSON file (file-backed source of truth)
    fetch('/api/regulations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRegulation),
    })
      .then((res) => res.json())
      .then((data) => {
        // Adopt the server-canonical id/record so local state matches the file
        if (data && data.regulation) {
          setRegulations((prev) => prev.map((r) => (r.id === newRegulation.id ? data.regulation : r)));
        }
      })
      .catch((e) => console.warn('[AdminContext] Could not persist new regulation to server file:', e));

    // Auto-register statutory URLs to weekly periodic scraper & link reachability daemon
    fetch('/api/scraper/register-regulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regulation: newRegulation }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          addAuditLog(
            'SCRAPER_SOURCE_ADDED',
            newRegulation.code,
            `Enrolled regulation statutory URL(s) to automated weekly scraping queue.`
          );
          fetchLinkAudits();
        }
      })
      .catch((e) => console.warn('[AdminContext] Could not auto-register regulation with scraper:', e));
  };

  const updateRegulation = (id: string, updates: Partial<Regulation>) => {
    const updatesWithMeta = { ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    setRegulations((prev) =>
      prev.map((reg) => {
        if (reg.id === id) {
          return {
            ...reg,
            ...updatesWithMeta,
          };
        }
        return reg;
      })
    );
    // Persist the amendment to the region JSON file
    fetch(`/api/regulations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatesWithMeta),
    }).catch((e) => console.warn('[AdminContext] Could not persist regulation update to server file:', e));
    addAuditLog(
      'REGULATION_UPDATED',
      id,
      `Updated regulation fields: ${Object.keys(updates).join(', ')}.`
    );
  };

  const updateRegulationLink = (id: string, officialUrl: string, documentPdfUrl?: string) => {
    setRegulations((prev) =>
      prev.map((reg) => {
        if (reg.id === id) {
          const updated = {
            ...reg,
            officialUrl,
            documentPdfUrl: documentPdfUrl || reg.documentPdfUrl,
            lastUpdated: new Date().toISOString().split('T')[0],
          };

          // Persist the link change to the region JSON file (file-backed source of truth)
          fetch(`/api/regulations/${encodeURIComponent(id)}/link`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ officialUrl, documentPdfUrl: documentPdfUrl || reg.documentPdfUrl }),
          }).catch((e) => console.warn('[AdminContext] Could not persist link update to server file:', e));

          // Auto-register updated statutory link with weekly scraper
          fetch('/api/scraper/register-regulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regulation: updated }),
          })
            .then(() => fetchLinkAudits())
            .catch(() => {});

          return updated;
        }
        return reg;
      })
    );
    addAuditLog(
      'REGULATION_LINK_UPDATED',
      id,
      `Updated statutory link to "${officialUrl}"${documentPdfUrl ? ` and PDF to "${documentPdfUrl}"` : ''}.`
    );
  };

  const deleteRegulation = (id: string) => {
    const target = regulations.find((r) => r.id === id);
    setRegulations((prev) => prev.filter((r) => r.id !== id));
    // Persist the deletion to the region JSON file
    fetch(`/api/regulations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('[AdminContext] Could not persist deletion to server file:', e));
    addAuditLog(
      'REGULATION_DELETED',
      target?.code || id,
      `Removed regulation "${target?.name || id}" from database.`
    );
  };

  const resetRegulationsToDefault = () => {
    setRegulations(MENAT_REGULATIONS);
    addAuditLog(
      'REGULATIONS_RESET',
      'All Regulations',
      'Reset all regulations to statutory official baseline.'
    );
  };

  const importRegulationsBackup = (newRegs: Regulation[]) => {
    if (Array.isArray(newRegs) && newRegs.length > 0) {
      setRegulations(newRegs);
      addAuditLog(
        'BACKUP_RESTORED',
        'Regulations Database',
        `Imported ${newRegs.length} regulations from external JSON snapshot.`
      );
    }
  };

  // Timeline Events & Statutory Deadlines Actions
  const addTimelineEvent = (event: TimelineEvent) => {
    setTimelineEvents((prev) => [event, ...prev]);
    addAuditLog(
      'TIMELINE_EVENT_CREATED',
      event.title,
      `Created statutory deadline milestone: "${event.title}" (${event.countryName}, Due: ${event.deadlineDate}, Urgency: ${event.urgency}).`
    );
  };

  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    setTimelineEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === id) {
          return { ...evt, ...updates };
        }
        return evt;
      })
    );
    const target = timelineEvents.find((e) => e.id === id);
    addAuditLog(
      'TIMELINE_EVENT_UPDATED',
      target?.title || id,
      `Updated statutory deadline: ${updates.deadlineDate ? `Due: ${updates.deadlineDate} ` : ''}${updates.status ? `Status: ${updates.status} ` : ''}${updates.urgency ? `Urgency: ${updates.urgency}` : ''}`
    );
  };

  const deleteTimelineEvent = (id: string) => {
    const target = timelineEvents.find((e) => e.id === id);
    setTimelineEvents((prev) => prev.filter((e) => e.id !== id));
    addAuditLog(
      'TIMELINE_EVENT_DELETED',
      target?.title || id,
      `Deleted statutory timeline milestone: "${target?.title || id}".`
    );
  };

  const resetTimelineEventsToDefault = () => {
    setTimelineEvents(REGULATORY_TIMELINE_EVENTS);
    addAuditLog(
      'TIMELINE_EVENTS_RESET',
      'All Timeline Events',
      'Reset all regulatory statutory timeline milestones and deadlines to baseline dataset.'
    );
  };

  const batchUpdateTimelineEvents = (
    updates: { id: string; changes: Partial<TimelineEvent> }[],
    auditSummary?: string
  ) => {
    if (!updates || updates.length === 0) return;
    setTimelineEvents((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.changes]));
      const next = prev.map((evt) => {
        if (updateMap.has(evt.id)) {
          return { ...evt, ...updateMap.get(evt.id) };
        }
        return evt;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.TIMELINE_EVENTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    addAuditLog(
      'TIMELINE_BATCH_APPLIED',
      'Statutory Deadlines Batch',
      auditSummary || `Applied atomic batch update to ${updates.length} statutory timeline milestone(s).`
    );
  };

  // Atomic Staged Pending Edits Management
  const stageTimelineEdit = (id: string, changes: Partial<TimelineEvent>) => {
    setPendingTimelineEdits((prev) => {
      const existing = prev[id] || {};
      const merged = { ...existing, ...changes };

      // Compare with persisted base event
      const baseEvent = timelineEvents.find((e) => e.id === id);
      if (baseEvent) {
        let isDifferent = false;
        for (const key of Object.keys(merged) as Array<keyof TimelineEvent>) {
          if (JSON.stringify(merged[key]) !== JSON.stringify(baseEvent[key])) {
            isDifferent = true;
            break;
          }
        }
        if (!isDifferent) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
      }

      return {
        ...prev,
        [id]: merged,
      };
    });
  };

  const unstageTimelineEdit = (id: string) => {
    setPendingTimelineEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const stageRegulationEdit = (id: string, changes: Partial<Regulation>) => {
    setPendingRegulationEdits((prev) => {
      const existing = prev[id] || {};
      const merged = { ...existing, ...changes };

      const baseReg = regulations.find((r) => r.id === id);
      if (baseReg) {
        let isDifferent = false;
        for (const key of Object.keys(merged) as Array<keyof Regulation>) {
          if (JSON.stringify(merged[key]) !== JSON.stringify(baseReg[key])) {
            isDifferent = true;
            break;
          }
        }
        if (!isDifferent) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
      }

      return {
        ...prev,
        [id]: merged,
      };
    });
  };

  const unstageRegulationEdit = (id: string) => {
    setPendingRegulationEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const discardPendingEdits = () => {
    setPendingTimelineEdits({});
    setPendingRegulationEdits({});
  };

  const applyPendingEdits = (): { success: boolean; timelineCount: number; regulationCount: number } => {
    const timelineIds = Object.keys(pendingTimelineEdits);
    const regulationIds = Object.keys(pendingRegulationEdits);

    if (timelineIds.length === 0 && regulationIds.length === 0) {
      return { success: false, timelineCount: 0, regulationCount: 0 };
    }

    // Single Atomic Transaction: commit both timeline events & regulations
    if (timelineIds.length > 0) {
      setTimelineEvents((prev) => {
        const next = prev.map((evt) => {
          if (pendingTimelineEdits[evt.id]) {
            return { ...evt, ...pendingTimelineEdits[evt.id] };
          }
          return evt;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.TIMELINE_EVENTS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    if (regulationIds.length > 0) {
      setRegulations((prev) => {
        const next = prev.map((reg) => {
          if (pendingRegulationEdits[reg.id]) {
            return {
              ...reg,
              ...pendingRegulationEdits[reg.id],
              lastUpdated: new Date().toISOString().split('T')[0],
            };
          }
          return reg;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.REGULATIONS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    // Consolidated audit trail
    const timelineDetails = timelineIds.map((id) => {
      const evt = timelineEvents.find((e) => e.id === id);
      const changes = pendingTimelineEdits[id];
      const changeParts: string[] = [];
      if (changes.deadlineDate) changeParts.push(`Deadline: ${changes.deadlineDate}`);
      if (changes.status) changeParts.push(`Status: ${changes.status}`);
      if (changes.urgency) changeParts.push(`Urgency: ${changes.urgency}`);
      if (changes.transitionStartDate) changeParts.push(`Grace: ${changes.transitionStartDate}`);
      return `"${evt?.title || id}" [${changeParts.join(', ')}]`;
    });

    const regulationDetails = regulationIds.map((id) => {
      const reg = regulations.find((r) => r.id === id);
      const changes = pendingRegulationEdits[id];
      const changeParts: string[] = [];
      if (changes.status) changeParts.push(`Status: ${changes.status}`);
      return `"${reg?.code || id}" [${changeParts.join(', ')}]`;
    });

    const combinedDetails = [
      timelineIds.length > 0 ? `${timelineIds.length} Deadline(s): ${timelineDetails.join('; ')}` : '',
      regulationIds.length > 0 ? `${regulationIds.length} Regulation Status(es): ${regulationDetails.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    addAuditLog(
      'TIMELINE_BATCH_APPLIED',
      'Statutory Deadlines & Statuses',
      `Applied atomic batch transaction: Persisted updates to ${timelineIds.length} statutory deadline(s) and ${regulationIds.length} regulatory status(es). Summary: ${combinedDetails}`
    );

    const result = {
      success: true,
      timelineCount: timelineIds.length,
      regulationCount: regulationIds.length,
    };

    setPendingTimelineEdits({});
    setPendingRegulationEdits({});

    return result;
  };

  const hasPendingEdits = Object.keys(pendingTimelineEdits).length > 0 || Object.keys(pendingRegulationEdits).length > 0;
  const totalPendingEditsCount = Object.keys(pendingTimelineEdits).length + Object.keys(pendingRegulationEdits).length;

  const effectiveTimelineEvents = useMemo(() => {
    if (Object.keys(pendingTimelineEdits).length === 0) return timelineEvents;
    return timelineEvents.map((evt) => {
      const pending = pendingTimelineEdits[evt.id];
      if (pending) {
        return { ...evt, ...pending };
      }
      return evt;
    });
  }, [timelineEvents, pendingTimelineEdits]);

  // Country & Jurisdiction Actions
  const addCountry = (countryData: Country) => {
    setCountriesRaw((prev) => {
      const exists = prev.some((c) => c.id.toLowerCase() === countryData.id.toLowerCase());
      if (exists) {
        return prev.map((c) => (c.id.toLowerCase() === countryData.id.toLowerCase() ? countryData : c));
      }
      return [countryData, ...prev];
    });
    addAuditLog(
      'COUNTRY_CREATED',
      countryData.name,
      `Added sovereign jurisdiction "${countryData.name}" (${countryData.code}) with ${countryData.primaryAuthorities.length} regulatory authorities.`
    );
  };

  const updateCountry = (id: string, updates: Partial<Country>) => {
    setCountriesRaw((prev) =>
      prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? { ...c, ...updates } : c))
    );
    const target = countriesRaw.find((c) => c.id.toLowerCase() === id.toLowerCase());
    addAuditLog(
      'COUNTRY_UPDATED',
      target?.name || id,
      `Amended jurisdiction attributes for ${target?.name || id}: ${Object.keys(updates).join(', ')}.`
    );
  };

  const deleteCountry = (id: string) => {
    const target = countriesRaw.find((c) => c.id.toLowerCase() === id.toLowerCase());
    setCountriesRaw((prev) => prev.filter((c) => c.id.toLowerCase() !== id.toLowerCase()));
    addAuditLog(
      'COUNTRY_DELETED',
      target?.name || id,
      `Deleted sovereign jurisdiction "${target?.name || id}" (${id}) from active system directory.`
    );
  };

  const resetCountriesToDefault = () => {
    setCountriesRaw(MENAT_COUNTRIES);
    addAuditLog(
      'COUNTRIES_RESET',
      'All Jurisdictions',
      'Reset all countries & sovereign jurisdictions to default 24-state MENAT baseline.'
    );
  };

  // Broadcast Actions
  const updateBroadcastBanner = (updates: Partial<SystemBroadcast>) => {
    setBroadcastBanner((prev) => {
      const updated: SystemBroadcast = {
        ...prev,
        ...updates,
        author: `${currentUser.name} (${currentUser.isAdmin ? 'Admin' : 'Officer'})`,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      };
      addAuditLog(
        'BROADCAST_UPDATED',
        'System Banner',
        `Updated broadcast: "${updated.title}" - Status: ${updated.enabled ? 'Active' : 'Muted'}.`
      );
      return updated;
    });
  };

  // Audit Logs Actions
  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const exportAuditLogsCSV = () => {
    const headers = ['Timestamp', 'User Name', 'User Email', 'Role', 'Action Type', 'Target Entity', 'Details'];
    const rows = auditLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.userEmail}"`,
      `"${log.userRole}"`,
      `"${log.actionType}"`,
      `"${log.targetEntity.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MENAT_Admin_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('BACKUP_EXPORTED', 'Audit Trail', 'Exported complete audit log to CSV format.');
  };

  // Full Backup & Restore
  const exportFullBackupJSON = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      exportedBy: currentUser.email,
      platform: 'MENAT ReguIntel Compliance System',
      version: '2.5.0',
      data: {
        featureFlags,
        users,
        broadcastBanner,
        countriesCount: countriesRaw.length,
        countries: countriesRaw,
        regulationsCount: regulations.length,
        regulations,
        timelineEventsCount: timelineEvents.length,
        timelineEvents,
        auditLogs,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MENAT_Compliance_Backend_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAuditLog('BACKUP_EXPORTED', 'Full System Backup', 'Generated full JSON backup snapshot.');
  };

  const importFullBackupJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) throw new Error('Invalid format: missing data key');

      if (parsed.data.featureFlags) setFeatureFlags(parsed.data.featureFlags);
      if (Array.isArray(parsed.data.users)) setUsers(parsed.data.users);
      if (parsed.data.broadcastBanner) setBroadcastBanner(parsed.data.broadcastBanner);
      if (Array.isArray(parsed.data.countries)) setCountriesRaw(parsed.data.countries);
      if (Array.isArray(parsed.data.regulations)) setRegulations(parsed.data.regulations);
      if (Array.isArray(parsed.data.timelineEvents)) setTimelineEvents(parsed.data.timelineEvents);

      addAuditLog('BACKUP_RESTORED', 'Full System Backup', `Imported backup snapshot from ${parsed.exportTimestamp || 'file'}.`);
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        logout,
        quickLoginAs,

        isAdminUnlocked,
        unlockAdmin,
        lockAdmin,

        users,
        currentUser,
        isCurrentUserAdmin,
        switchUser,
        loginWithCredentials,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,

        featureFlags,
        toggleFeature,
        updateFeatureFlags,
        resetFeatureFlags,

        countries,
        addCountry,
        updateCountry,
        deleteCountry,
        resetCountriesToDefault,

        regulations,
        addRegulation,
        updateRegulation,
        deleteRegulation,
        updateRegulationLink,
        resetRegulationsToDefault,
        importRegulationsBackup,

        digestUpdates,
        updateDigestUpdate,

        benchmarkDate,
        updateBenchmarkDate,

        timelineEvents,
        effectiveTimelineEvents,
        addTimelineEvent,
        updateTimelineEvent,
        deleteTimelineEvent,
        resetTimelineEventsToDefault,
        batchUpdateTimelineEvents,

        pendingTimelineEdits,
        pendingRegulationEdits,
        stageTimelineEdit,
        unstageTimelineEdit,
        stageRegulationEdit,
        unstageRegulationEdit,
        discardPendingEdits,
        applyPendingEdits,
        hasPendingEdits,
        totalPendingEditsCount,

        broadcastBanner,
        updateBroadcastBanner,

        auditLogs,
        addAuditLog,
        clearAuditLogs,
        exportAuditLogsCSV,

        exportFullBackupJSON,
        importFullBackupJSON,

        linkAudits,
        isLinkAuditRunning,
        lastLinkAuditTimestamp,
        runLinkAudit,
        getLinkAudit,
        fetchLinkAudits,

        linkSuggestions,
        submitLinkSuggestion,
        reviewLinkSuggestion,

        regulationSuggestions,
        submitRegulationSuggestion,
        reviewRegulationSuggestion,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
