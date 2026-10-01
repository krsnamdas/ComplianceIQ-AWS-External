import React, { useState, useMemo } from 'react';
import {
  Regulation,
  RegulatoryUpdate,
  WatchlistPin,
  WatchlistNotification,
  WatchlistPriority,
  WatchlistPreferences,
  Country,
} from '../types/regulatory';
import {
  BookmarkCheck,
  Bookmark,
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  ExternalLink,
  GitCompare,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  UserCheck,
  Sliders,
  Layers,
  ArrowRight,
  ChevronRight,
  Check,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Info,
  Lock,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useRBAC } from '../context/RBACContext';
import { ImpactHorizonChart } from './ImpactHorizonChart';
import {
  exportWatchlistCsv,
  exportWatchlistJson,
  createSimulatedLiveAlert,
  playAlertChime,
} from '../utils/watchlistManager';

interface RegulatoryWatchlistProps {
  pins: WatchlistPin[];
  allRegulations: Regulation[];
  allUpdates: RegulatoryUpdate[];
  countries: Country[];
  notifications: WatchlistNotification[];
  preferences: WatchlistPreferences;
  onTogglePin: (regulationId: string) => void;
  onUpdatePinNotes: (regulationId: string, notes: string) => void;
  onUpdatePinPriority: (regulationId: string, priority: WatchlistPriority) => void;
  onUpdatePinTags: (regulationId: string, tags: string[]) => void;
  onUpdatePinAssignee: (regulationId: string, assignedTo: string) => void;
  onUpdatePinNotificationRules: (
    regulationId: string,
    rules: { notifyOnAmendments?: boolean; notifyOnConsultations?: boolean; notifyOnDeadlines?: boolean }
  ) => void;
  onMarkNotificationAsRead: (notificationId: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onAddSimulatedNotification: (notification: WatchlistNotification) => void;
  onUpdatePreferences: (preferences: WatchlistPreferences) => void;
  onViewRegulationDetails?: (regulationId: string) => void;
  onViewVersionDiff?: (diffId: string) => void;
  onNavigateToRegistry?: () => void;
  onOpenBulkPdfExport?: (regulationIds: string[]) => void;
}

export const RegulatoryWatchlist: React.FC<RegulatoryWatchlistProps> = ({
  pins,
  allRegulations,
  allUpdates,
  countries,
  notifications,
  preferences,
  onTogglePin,
  onUpdatePinNotes,
  onUpdatePinPriority,
  onUpdatePinTags,
  onUpdatePinAssignee,
  onUpdatePinNotificationRules,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification,
  onAddSimulatedNotification,
  onUpdatePreferences,
  onViewRegulationDetails,
  onViewVersionDiff,
  onNavigateToRegistry,
  onOpenBulkPdfExport,
}) => {
  // Navigation sub-tab: 'tracked' | 'horizon' | 'notifications' | 'deadlines' | 'settings'
  const [activeSubTab, setActiveSubTab] = useState<'tracked' | 'horizon' | 'notifications' | 'deadlines' | 'settings'>('tracked');
  const [showInlineHorizon, setShowInlineHorizon] = useState(true);

  // Filtering within Tracked Regulations
  const [trackedSearch, setTrackedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | WatchlistPriority>('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filtering within Notifications
  const [notifSearch, setNotifSearch] = useState('');
  const [notifUrgencyFilter, setNotifUrgencyFilter] = useState<string>('all');
  const [notifRegFilter, setNotifRegFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Quick memo editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
  const [tempAssignee, setTempAssignee] = useState('');
  const [newTagInput, setNewTagInput] = useState<{ [regId: string]: string }>({});

  // Toast alert feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Map pins to actual regulation records
  const pinMap = useMemo(() => new Map(pins.map((p) => [p.regulationId, p])), [pins]);

  const pinnedRegulations = useMemo(() => {
    return allRegulations.filter((r) => pinMap.has(r.id));
  }, [allRegulations, pinMap]);

  // In-page "Pin a Regulation" picker state + the list of still-unpinned regs
  // (derived from the real registry, so options are always valid & react live).
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [pinPickerSearch, setPinPickerSearch] = useState('');

  const unpinnedRegulations = useMemo(
    () => allRegulations.filter((r) => !pinMap.has(r.id)),
    [allRegulations, pinMap]
  );

  const pinPickerResults = useMemo(() => {
    const q = pinPickerSearch.trim().toLowerCase();
    const list = q
      ? unpinnedRegulations.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            (r.authority || '').toLowerCase().includes(q) ||
            (r.countryId || '').toLowerCase().includes(q)
        )
      : unpinnedRegulations;
    return list.slice(0, 50);
  }, [unpinnedRegulations, pinPickerSearch]);

  // Filtered pinned regulations
  const filteredPinnedRegulations = useMemo(() => {
    return pinnedRegulations.filter((reg) => {
      const pin = pinMap.get(reg.id);
      if (!pin) return false;

      if (priorityFilter !== 'all' && pin.priority !== priorityFilter) return false;
      if (countryFilter !== 'all' && reg.countryId !== countryFilter) return false;

      if (trackedSearch.trim()) {
        const q = trackedSearch.toLowerCase();
        const matchesCode = reg.code.toLowerCase().includes(q);
        const matchesName = reg.name.toLowerCase().includes(q);
        const matchesNotes = pin.notes?.toLowerCase().includes(q);
        const matchesTags = pin.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesAuthority = reg.authority.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesNotes && !matchesTags && !matchesAuthority) {
          return false;
        }
      }

      return true;
    });
  }, [pinnedRegulations, pinMap, priorityFilter, countryFilter, trackedSearch]);

  // Notifications filtering
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (showUnreadOnly && n.read) return false;
      if (notifUrgencyFilter !== 'all' && n.urgency !== notifUrgencyFilter) return false;
      if (notifRegFilter !== 'all' && n.regulationId !== notifRegFilter) return false;

      if (notifSearch.trim()) {
        const q = notifSearch.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.regulationCode.toLowerCase().includes(q) ||
          n.countryName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [notifications, showUnreadOnly, notifUrgencyFilter, notifRegFilter, notifSearch]);

  // Compute portfolio high-level stats
  const portfolioStats = useMemo(() => {
    const total = pinnedRegulations.length;
    const criticalCount = pins.filter((p) => p.priority === 'Critical').length;
    const countriesCovered = new Set(pinnedRegulations.map((r) => r.countryId)).size;
    const totalControls = pinnedRegulations.reduce(
      (acc, r) => acc + (r.controlStructure?.totalControlsCount || 0),
      0
    );
    const deadlinesCount = notifications.filter(
      (n) => n.type === 'Approaching Deadline' && (n.daysRemaining ?? 999) <= 90
    ).length;

    return { total, criticalCount, countriesCovered, totalControls, deadlinesCount };
  }, [pinnedRegulations, pins, notifications]);

  // Trigger real-time alert simulation
  const handleSimulateAlert = () => {
    if (pinnedRegulations.length === 0) {
      showToast('Please pin at least one regulation to test specialized alerts.');
      return;
    }

    const randomReg = pinnedRegulations[Math.floor(Math.random() * pinnedRegulations.length)];
    const simAlert = createSimulatedLiveAlert(randomReg);

    onAddSimulatedNotification(simAlert);

    if (preferences.soundAlerts) {
      playAlertChime();
    }

    showToast(`🚨 New Live Regulatory Alert received for ${randomReg.code}!`);
    setActiveSubTab('notifications');
  };

  // RBAC Context
  const { canManageWatchlist, canExportReports, isAnalyst, triggerRestrictedAction, setRole } = useRBAC();

  // Guarded actions
  const handleGuardedTogglePin = (regId: string) => {
    if (!canManageWatchlist) {
      triggerRestrictedAction(
        'Modify Watchlist Pins',
        'Pinning or unpinning statutory instruments from the organizational watchlist requires the Compliance Manager role.'
      );
      return;
    }
    onTogglePin(regId);
  };

  const handleGuardedSimulateAlert = () => {
    if (!canManageWatchlist) {
      triggerRestrictedAction(
        'Simulate Live Regulatory Alert',
        'Broadcasting simulated real-time regulatory circulars and amendments to watchlist subscribers requires the Compliance Manager role.'
      );
      return;
    }
    handleSimulateAlert();
  };

  const handleGuardedExportCsv = () => {
    if (!canExportReports) {
      triggerRestrictedAction(
        'Export Watchlist CSV',
        'Exporting corporate watchlist data to CSV files requires the Compliance Manager role.'
      );
      return;
    }
    exportWatchlistCsv(pins, allRegulations);
  };

  const handleGuardedExportJson = () => {
    if (!canExportReports) {
      triggerRestrictedAction(
        'Export Watchlist JSON',
        'Exporting corporate watchlist portfolios with memos & tags to JSON requires the Compliance Manager role.'
      );
      return;
    }
    exportWatchlistJson(pins, allRegulations);
  };

  const handleGuardedBulkPdf = (regIds: string[]) => {
    if (!canExportReports) {
      triggerRestrictedAction(
        'Generate Watchlist PDF Dossier',
        'Generating and downloading consolidated PDF compliance reports requires the Compliance Manager role.'
      );
      return;
    }
    if (onOpenBulkPdfExport) {
      onOpenBulkPdfExport(regIds);
    }
  };

  // Quick recommended regulations to add when empty — derived from the REAL
  // registry (unpinned regs) so every card resolves to a valid regulation and
  // pins instantly. Previously these were hardcoded IDs, several of which no
  // longer existed, so clicking "Pin" did nothing.
  const recommendedRegulations = useMemo(() => {
    const flagFor = (countryId: string) =>
      countries.find((c) => c.id === countryId)?.flag || '🌐';
    const nameFor = (countryId: string) =>
      countries.find((c) => c.id === countryId)?.name || countryId.toUpperCase();
    // Prefer a spread across jurisdictions for the 6 suggestions.
    const seen = new Set<string>();
    const spread: Regulation[] = [];
    for (const r of unpinnedRegulations) {
      if (!seen.has(r.countryId)) {
        seen.add(r.countryId);
        spread.push(r);
      }
      if (spread.length >= 6) break;
    }
    const picks = spread.length >= 6 ? spread : unpinnedRegulations.slice(0, 6);
    return picks.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      flag: flagFor(r.countryId),
      country: nameFor(r.countryId),
    }));
  }, [unpinnedRegulations, countries]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-3 transition-all animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analyst Role Notice Banner */}
      {isAnalyst && (
        <div className="p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sky-300 block">Analyst Role (View-Only Mode) Active</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Watchlist is running in read-only mode. Pinning/unpinning, adding compliance memos, reassigning leads, and adjusting alert rules are restricted to Compliance Managers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRole('compliance_manager')}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <span>Switch to Compliance Manager</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hero Header & Personalized Cockpit Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BookmarkCheck className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Regulatory Watchlist & Specialized Alert Feed</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Personalized Portfolio
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Track specific statutory instruments and receive real-time notifications filtered strictly for your pinned regulatory scope.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGuardedSimulateAlert}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                !canManageWatchlist
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/40'
                  : 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40'
              }`}
              title={
                !canManageWatchlist
                  ? 'Analyst Role: Alert simulation restricted (Click to elevate)'
                  : 'Simulate incoming real-time gazette amendment or urgent circular for your pinned items'
              }
            >
              {!canManageWatchlist ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <BellRing className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              )}
              <span>{canManageWatchlist ? 'Simulate Live Alert' : 'Simulate (Locked)'}</span>
            </button>

            <button
              onClick={handleGuardedExportCsv}
              disabled={pinnedRegulations.length === 0}
              className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-40 cursor-pointer ${
                !canExportReports
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={
                !canExportReports
                  ? 'Analyst Role: Export restricted to Compliance Manager'
                  : 'Export your personalized watchlist portfolio to CSV'
              }
            >
              {!canExportReports ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleGuardedExportJson}
              disabled={pinnedRegulations.length === 0}
              className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-40 cursor-pointer ${
                !canExportReports
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={
                !canExportReports
                  ? 'Analyst Role: Export restricted to Compliance Manager'
                  : 'Export complete watchlist with notes & tags to JSON'
              }
            >
              {!canExportReports ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Export JSON</span>
            </button>

            {onOpenBulkPdfExport && (
              <button
                onClick={() => handleGuardedBulkPdf(pinnedRegulations.map((r) => r.id))}
                disabled={pinnedRegulations.length === 0}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-40 cursor-pointer ${
                  !canExportReports
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/40'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
                title={
                  !canExportReports
                    ? 'Analyst Role: PDF Report generation restricted to Compliance Manager'
                    : 'Generate a consolidated PDF compliance report for all pinned regulations'
                }
              >
                {!canExportReports ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Watchlist PDF Report ({pinnedRegulations.length})</span>
              </button>
            )}

            {/* Primary: pin a regulation right here without leaving the page */}
            <button
              onClick={() => {
                if (!canManageWatchlist) {
                  triggerRestrictedAction(
                    'Pin / Manage Watchlist',
                    'Adding regulations to your watchlist requires the Compliance Manager role. Analysts have view-only access.'
                  );
                  return;
                }
                setPinPickerOpen((o) => !o);
                setPinPickerSearch('');
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                pinPickerOpen
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Pin a regulation to your watchlist"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pin a Regulation</span>
            </button>
          </div>
        </div>

        {/* Inline "Pin a Regulation" picker — searchable, adds without navigating away */}
        {pinPickerOpen && (
          <div className="mt-4 bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pin a Regulation to Your Watchlist</span>
              </h4>
              <button
                onClick={() => setPinPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close pin picker"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={pinPickerSearch}
                onChange={(e) => setPinPickerSearch(e.target.value)}
                placeholder="Search by regulation name, code, authority, or country…"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {unpinnedRegulations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                All regulations are already pinned to your watchlist.
              </p>
            ) : pinPickerResults.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No unpinned regulations match &quot;{pinPickerSearch}&quot;.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {pinPickerResults.map((reg) => {
                  const country = countries.find((c) => c.id === reg.countryId);
                  return (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="min-w-0 flex items-center space-x-2.5">
                        <span className="text-base shrink-0">{country?.flag || '🌐'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                              {reg.code}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">
                              {country?.name || reg.countryId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">{reg.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleGuardedTogglePin(reg.id)}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 transition-colors cursor-pointer"
                        title={`Pin ${reg.code} to your watchlist`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pin</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{unpinnedRegulations.length} regulation(s) available to pin</span>
              {onNavigateToRegistry && (
                <button
                  onClick={onNavigateToRegistry}
                  className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  Browse full registry →
                </button>
              )}
            </div>
          </div>
        )}

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Tracked Regimes</span>
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-white tracking-tight">{portfolioStats.total}</span>
              <span className="text-xs text-slate-400">across {portfolioStats.countriesCovered} countries</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {portfolioStats.criticalCount} classified as Critical Priority
            </span>
          </div>

          <div
            onClick={() => setActiveSubTab('notifications')}
            className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 cursor-pointer hover:border-indigo-500/50 transition-colors group"
          >
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Specialized Alerts</span>
              <Bell className="w-3.5 h-3.5 text-indigo-400 group-hover:animate-bounce" />
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-indigo-300 tracking-tight">{notifications.length}</span>
              {unreadCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Updates matching tracked items only
            </span>
          </div>

          <div
            onClick={() => setActiveSubTab('deadlines')}
            className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 cursor-pointer hover:border-amber-500/50 transition-colors"
          >
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Imminent Deadlines</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-amber-300 tracking-tight">
                {portfolioStats.deadlinesCount}
              </span>
              <span className="text-xs text-slate-400">&lt;90 days horizon</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Enforcement & audit milestones
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Mapped Controls Scope</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {portfolioStats.totalControls}
              </span>
              <span className="text-xs text-slate-400">articles & controls</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Auditable compliance articles
            </span>
          </div>

          <div
            onClick={() => setActiveSubTab('horizon')}
            className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 cursor-pointer hover:border-amber-500/50 transition-colors group"
          >
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Impact Horizon</span>
              <Activity className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">D3 Map</span>
              <span className="text-xs text-amber-300/80 font-mono">Risk Matrix</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Scatter risk vs deadlines
            </span>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('tracked')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'tracked'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Tracked Regulations</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-300 font-mono">
              {pinnedRegulations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('horizon')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'horizon'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Impact Horizon (D3)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Risk Matrix
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'notifications'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Specialized Alerts Feed</span>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {unreadCount} New
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-300 font-mono">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('deadlines')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'deadlines'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Portfolio Deadlines & Milestones</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Notification Rules</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW: IMPACT HORIZON D3 RISK MATRIX                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'horizon' && (
        <div className="space-y-4">
          <ImpactHorizonChart
            regulations={allRegulations}
            pinnedIds={pins.map((p) => p.regulationId)}
            onSelectRegulation={(id) => {
              if (onViewRegulationDetails) {
                onViewRegulationDetails(id);
              }
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: TRACKED REGULATIONS                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'tracked' && (
        <div className="space-y-4">
          {/* Quick Inline Horizon Toggle for Tracked Items */}
          {pinnedRegulations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setShowInlineHorizon(!showInlineHorizon)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{showInlineHorizon ? 'Hide Portfolio Impact Horizon' : 'Show Portfolio Impact Horizon (D3)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('horizon')}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>Open Fullscreen Risk Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {showInlineHorizon && (
                <ImpactHorizonChart
                  regulations={allRegulations}
                  pinnedIds={pins.map((p) => p.regulationId)}
                  onSelectRegulation={(id) => {
                    if (onViewRegulationDetails) {
                      onViewRegulationDetails(id);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Filtering & Search Controls */}
          {pinnedRegulations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by code, memo, tag, or title..."
                  value={trackedSearch}
                  onChange={(e) => setTrackedSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e: any) => setPriorityFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Country:</span>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="all">All Jurisdictions</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-1 rounded text-xs ${
                      viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Card Grid"
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-1 rounded text-xs ${
                      viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Matrix Table"
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE (If user has 0 pinned regulations) */}
          {pinnedRegulations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <BookmarkCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Your Regulatory Watchlist is Empty</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pin key cybersecurity, data protection, and fintech regulations to this personalized dashboard to receive specialized real-time alerts, track compliance milestones, and attach custom audit memos.
                </p>
              </div>

              {/* Recommended Quick-Add Regimes */}
              <div className="pt-4 max-w-3xl mx-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Recommended Core Regimes to Track:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {recommendedRegulations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{rec.flag}</span>
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-400">{rec.code}</span>
                            <span className="text-[10px] text-slate-400 block">{rec.country}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-2 line-clamp-1">{rec.name}</p>
                      </div>

                      <button
                        onClick={() => {
                          handleGuardedTogglePin(rec.id);
                        }}
                        className="mt-3 w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pin to Watchlist</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredPinnedRegulations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 space-y-2">
              <p className="font-semibold text-white">No pinned regulations match the selected filters.</p>
              <button
                onClick={() => {
                  setTrackedSearch('');
                  setPriorityFilter('all');
                  setCountryFilter('all');
                }}
                className="mt-2 text-xs text-amber-400 hover:underline"
              >
                Reset Watchlist Filters
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* DETAILED CARDS VIEW */
            <div className="space-y-4">
              {filteredPinnedRegulations.map((reg) => {
                const pin = pinMap.get(reg.id)!;
                const countryObj = countries.find((c) => c.id === reg.countryId);

                // Priority style mapping
                const priorityStyles: Record<WatchlistPriority, { bg: string; text: string; border: string }> = {
                  Critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
                  High: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
                  Medium: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
                  Low: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
                };

                const currentStyle = priorityStyles[pin.priority] || priorityStyles.Medium;

                return (
                  <div
                    key={reg.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl" role="img" aria-label={countryObj?.name}>
                          {countryObj?.flag || '🌐'}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                              {reg.code}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {countryObj?.name || reg.countryId.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-400">{reg.authority}</span>
                          </div>
                          <h3 className="text-base font-bold text-white tracking-tight mt-1">{reg.name}</h3>
                          {reg.arabicName && (
                            <p className="text-xs text-slate-400 font-arabic mt-0.5" dir="rtl">
                              {reg.arabicName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Priority Selector & Unpin Action */}
                      <div className="flex items-center space-x-2 self-start sm:self-center">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Priority:</span>
                          <select
                            value={pin.priority}
                            disabled={!canManageWatchlist}
                            onChange={(e) => {
                              if (!canManageWatchlist) {
                                triggerRestrictedAction('Change Watchlist Priority', 'Modifying priority status for tracked statutory instruments requires the Compliance Manager role.');
                                return;
                              }
                              onUpdatePinPriority(reg.id, e.target.value as WatchlistPriority);
                              showToast(`Updated priority to ${e.target.value}`);
                            }}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} focus:outline-none ${!canManageWatchlist ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            handleGuardedTogglePin(reg.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Unpin from Watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Version</span>
                        <span className="font-mono text-cyan-300 font-semibold block mt-0.5">
                          {reg.currentVersion || `v${reg.yearEnacted}.1`}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Enforcement Date</span>
                        <span className="text-amber-300 font-medium block mt-0.5">{reg.effectiveDate}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Controls</span>
                        <span className="text-emerald-400 font-semibold block mt-0.5">
                          {reg.controlStructure?.totalControlsCount || 'N/A'} Articles
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pinned Since</span>
                        <span className="text-slate-300 block mt-0.5">
                          {pin.pinnedAt ? pin.pinnedAt.split('T')[0] : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Notification Channels & Action Links */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                      {/* Notification Rules Toggles */}
                      <div className="flex flex-wrap items-center gap-3 text-slate-300">
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>Alert on:</span>
                        </span>
                        <label className={`flex items-center space-x-1 ${!canManageWatchlist ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            disabled={!canManageWatchlist}
                            checked={pin.notifyOnAmendments}
                            onChange={(e) => {
                              if (!canManageWatchlist) {
                                triggerRestrictedAction('Configure Alert Rules', 'Modifying alert notification rules requires the Compliance Manager role.');
                                return;
                              }
                              onUpdatePinNotificationRules(reg.id, { notifyOnAmendments: e.target.checked });
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px]">Amendments</span>
                        </label>
                        <label className={`flex items-center space-x-1 ${!canManageWatchlist ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            disabled={!canManageWatchlist}
                            checked={pin.notifyOnDeadlines}
                            onChange={(e) => {
                              if (!canManageWatchlist) {
                                triggerRestrictedAction('Configure Alert Rules', 'Modifying alert notification rules requires the Compliance Manager role.');
                                return;
                              }
                              onUpdatePinNotificationRules(reg.id, { notifyOnDeadlines: e.target.checked });
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px]">Deadlines</span>
                        </label>
                        <label className={`flex items-center space-x-1 ${!canManageWatchlist ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            disabled={!canManageWatchlist}
                            checked={pin.notifyOnConsultations}
                            onChange={(e) => {
                              if (!canManageWatchlist) {
                                triggerRestrictedAction('Configure Alert Rules', 'Modifying alert notification rules requires the Compliance Manager role.');
                                return;
                              }
                              onUpdatePinNotificationRules(reg.id, { notifyOnConsultations: e.target.checked });
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px]">Consultations</span>
                        </label>
                      </div>

                      {/* Action Links */}
                      <div className="flex flex-wrap items-center gap-2">
                        {reg.versionDiffId && onViewVersionDiff && (
                          <button
                            onClick={() => onViewVersionDiff(reg.versionDiffId!)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 flex items-center space-x-1.5 transition-colors"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Version Diff</span>
                          </button>
                        )}

                        <a
                          href={reg.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                        >
                          <span>Official Gazette</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* COMPACT MATRIX TABLE VIEW */
            <div className="bg-slate-900 border border-slate-800 rounded-xl table-scroll-x shadow-sm">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Jurisdiction</th>
                    <th className="px-4 py-3">Code & Name</th>
                    <th className="px-4 py-3">Authority</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Effective Date</th>
                    <th className="px-4 py-3">Assigned Lead</th>
                    <th className="px-4 py-3">Compliance Memo</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredPinnedRegulations.map((reg) => {
                    const pin = pinMap.get(reg.id)!;
                    const countryObj = countries.find((c) => c.id === reg.countryId);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xl mr-2">{countryObj?.flag || '🌐'}</span>
                          <span className="font-semibold text-white">{countryObj?.name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-amber-300 block">{reg.code}</span>
                          <span className="text-slate-400 text-[11px] block">{reg.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{reg.authority}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              pin.priority === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : pin.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {pin.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{reg.effectiveDate}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {pin.assignedTo || <span className="text-slate-500">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-slate-400 italic">
                          {pin.notes || <span className="text-slate-600">None</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                          {reg.versionDiffId && onViewVersionDiff && (
                            <button
                              onClick={() => onViewVersionDiff(reg.versionDiffId!)}
                              className="px-2 py-1 text-[11px] rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                            >
                              Diff
                            </button>
                          )}
                          <button
                            onClick={() => handleGuardedTogglePin(reg.id)}
                            className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 cursor-pointer"
                          >
                            Unpin
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: SPECIALIZED NOTIFICATIONS FEED                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          {/* Notifications Controls & Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search alerts by title or regulation..."
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={notifUrgencyFilter}
                onChange={(e) => setNotifUrgencyFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
              >
                <option value="all">All Urgencies</option>
                <option value="Critical">Critical Only</option>
                <option value="High">High Only</option>
                <option value="Medium">Medium Only</option>
              </select>

              <select
                value={notifRegFilter}
                onChange={(e) => setNotifRegFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
              >
                <option value="all">All Pinned Regs ({pinnedRegulations.length})</option>
                {pinnedRegulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 ${
                  showUnreadOnly
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span>Unread Only</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    onMarkAllNotificationsAsRead();
                    showToast('All notifications marked as read.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Specialized Notification Cards Feed */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-semibold text-white">No notifications match your current filter.</p>
              <p className="text-xs text-slate-400">
                You will only receive alerts for items pinned to your Watchlist.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const urgencyBadgeStyles: Record<string, string> = {
                  Critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                  High: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  Medium: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                  Informational: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
                };

                return (
                  <div
                    key={notif.id}
                    className={`bg-slate-900 border rounded-xl p-5 shadow-sm transition-all ${
                      notif.read
                        ? 'border-slate-800/80 opacity-80'
                        : 'border-indigo-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl mt-0.5">{notif.countryFlag || '🌐'}</span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                              {notif.regulationCode}
                            </span>

                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                urgencyBadgeStyles[notif.urgency] || urgencyBadgeStyles.Medium
                              }`}
                            >
                              {notif.urgency}
                            </span>

                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {notif.type}
                            </span>

                            {notif.daysRemaining !== undefined && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                  notif.daysRemaining <= 30
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {notif.daysRemaining > 0 ? `${notif.daysRemaining} Days Remaining` : 'Enforced Today'}
                              </span>
                            )}

                            {!notif.read && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                                NEW
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white tracking-tight pt-1">{notif.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{notif.summary}</p>

                          {/* Action Items List */}
                          {notif.keyActionItems && notif.keyActionItems.length > 0 && (
                            <div className="mt-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Key Compliance Directives:
                              </span>
                              <ul className="space-y-1 text-xs text-slate-300">
                                {notif.keyActionItems.map((item, idx) => (
                                  <li key={idx} className="flex items-start space-x-1.5">
                                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Read / Unread toggle & shortcuts */}
                      <div className="flex flex-col sm:items-end space-y-2 shrink-0 pt-2 sm:pt-0">
                        <span className="text-[11px] text-slate-400 font-mono">{notif.date}</span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onMarkNotificationAsRead(notif.id)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            {notif.read ? 'Mark Unread' : 'Mark Read'}
                          </button>

                          {notif.versionDiffId && onViewVersionDiff && (
                            <button
                              onClick={() => onViewVersionDiff(notif.versionDiffId!)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800"
                            >
                              Diff
                            </button>
                          )}

                          {notif.sourceUrl && (
                            <a
                              href={notif.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-white"
                              title="Official source link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => onDeleteNotification(notif.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Dismiss notification"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: PORTFOLIO DEADLINES & MILESTONES                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'deadlines' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Statutory Deadlines for Pinned Regulations</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Chronological horizon of enforcement dates, grace period conclusions, and accredited audit deadlines for your tracked regulatory instruments.
            </p>
          </div>

          <div className="space-y-3">
            {notifications
              .filter((n) => n.type === 'Approaching Deadline' || n.daysRemaining !== undefined)
              .map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{d.countryFlag || '🌐'}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-300 px-1.5 py-0.5 rounded bg-slate-800">
                          {d.regulationCode}
                        </span>
                        <span className="text-xs font-semibold text-white">{d.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{d.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-300 block">{d.date}</span>
                      <span className="text-[11px] text-slate-400">
                        {d.daysRemaining !== undefined ? `${d.daysRemaining} days left` : 'Enforced'}
                      </span>
                    </div>

                    {d.versionDiffId && onViewVersionDiff && (
                      <button
                        onClick={() => onViewVersionDiff(d.versionDiffId!)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                      >
                        Diff
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: NOTIFICATION RULES & SETTINGS                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Watchlist Notification Rules & Escalation Thresholds</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure how and when specialized alerts are triggered for your tracked regulatory instruments.
              </p>
            </div>
            {!canManageWatchlist && (
              <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                View-Only Configuration
              </span>
            )}
          </div>

          {!canManageWatchlist && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Modifying organizational notification thresholds & chime settings requires <strong>Compliance Manager</strong> privileges.</span>
              </div>
              <button
                onClick={() => setRole('compliance_manager')}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shrink-0 ml-3"
              >
                Switch to Manager
              </button>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {/* Audio chime toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                {preferences.soundAlerts ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <span className="text-xs font-semibold text-white block">Auditory Chime on Real-Time Alerts</span>
                  <span className="text-[11px] text-slate-400 block">
                    Play a gentle two-tone synthesizer chime when live gazette updates or crawler findings arrive.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canManageWatchlist}
                checked={preferences.soundAlerts}
                onChange={(e) => {
                  if (!canManageWatchlist) {
                    triggerRestrictedAction('Configure Notification Audio', 'Changing audio alert settings requires the Compliance Manager role.');
                    return;
                  }
                  onUpdatePreferences({ ...preferences, soundAlerts: e.target.checked });
                }}
                className={`w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 ${!canManageWatchlist ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              />
            </div>

            {/* Email simulation toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <BellRing className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">GRC Weekly Compliance Digest Simulation</span>
                  <span className="text-[11px] text-slate-400 block">
                    Generate periodic briefing digests aggregating all deadlines and statutory amendments for tracked items.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canManageWatchlist}
                checked={preferences.emailAlertSimulation}
                onChange={(e) => {
                  if (!canManageWatchlist) {
                    triggerRestrictedAction('Configure Compliance Digest', 'Configuring weekly digest scheduling requires the Compliance Manager role.');
                    return;
                  }
                  onUpdatePreferences({ ...preferences, emailAlertSimulation: e.target.checked });
                }}
                className={`w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 ${!canManageWatchlist ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              />
            </div>

            {/* Urgency Threshold */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-white block">Notification Urgency Sensitivity</span>
              <p className="text-[11px] text-slate-400">
                Filter which severity categories trigger high-visibility alerts on your navigation bell.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                {(['All', 'HighAndCritical', 'CriticalOnly'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      if (!canManageWatchlist) {
                        triggerRestrictedAction('Modify Urgency Thresholds', 'Updating watchlist notification thresholds requires the Compliance Manager role.');
                        return;
                      }
                      onUpdatePreferences({ ...preferences, urgencyThreshold: lvl });
                    }}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      preferences.urgencyThreshold === lvl
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    } ${!canManageWatchlist ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {lvl === 'All' ? 'All Alerts' : lvl === 'HighAndCritical' ? 'High & Critical' : 'Critical Only'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
