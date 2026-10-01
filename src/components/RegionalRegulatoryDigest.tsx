import React, { useState, useMemo } from 'react';
import { Country, SectorType, RegulatoryUpdate } from '../types/regulatory';
import { MENAT_COUNTRIES } from '../data/menatData';
import { useAdmin } from '../context/AdminContext';
import {
  DigestSubscriptionPreferences,
  loadDigestPreferences,
  saveDigestPreferences,
  getFilteredDigestAlerts,
  generateDigestExecutiveBrief,
  ALL_SECTORS_LIST,
} from '../utils/digestManager';
import {
  BellRing,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe2,
  Layers,
  Clock,
  Mail,
  ExternalLink,
  Download,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface RegionalRegulatoryDigestProps {
  onNavigateHome?: () => void;
  onViewRegulation?: (code: string) => void;
}

export const RegionalRegulatoryDigest: React.FC<RegionalRegulatoryDigestProps> = ({
  onNavigateHome,
  onViewRegulation,
}) => {
  // File-backed digest feed (region JSON, admin-editable) from the admin context.
  const { digestUpdates } = useAdmin();

  // Subscriptions State
  const [preferences, setPreferences] = useState<DigestSubscriptionPreferences>(() =>
    loadDigestPreferences()
  );

  // Preference Modal State
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [tempPrefs, setTempPrefs] = useState<DigestSubscriptionPreferences>(preferences);

  // Executive Brief Modal State
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Digest Feed Filter State
  const [feedFilter, setFeedFilter] = useState<'all' | 'critical' | 'unread'>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);

  // Compute filtered alerts
  const subscribedAlerts = useMemo(() => {
    return getFilteredDigestAlerts(digestUpdates, preferences);
  }, [digestUpdates, preferences]);

  // Secondary feed filter
  const displayedAlerts = useMemo(() => {
    return subscribedAlerts.filter((alert) => {
      if (feedFilter === 'critical' && alert.impactLevel !== 'Critical') {
        return false;
      }
      if (feedFilter === 'unread' && preferences.readAlertIds.includes(alert.id)) {
        return false;
      }
      if (feedSearch.trim()) {
        const q = feedSearch.toLowerCase();
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesSummary = alert.summary.toLowerCase().includes(q);
        const matchesAuthority = alert.authority.toLowerCase().includes(q);
        const matchesCountry = alert.countryName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesAuthority && !matchesCountry) {
          return false;
        }
      }
      return true;
    });
  }, [subscribedAlerts, feedFilter, feedSearch, preferences.readAlertIds]);

  // Unread Count
  const unreadCount = useMemo(() => {
    return subscribedAlerts.filter((a) => !preferences.readAlertIds.includes(a.id)).length;
  }, [subscribedAlerts, preferences.readAlertIds]);

  // Executive brief content
  const executiveBrief = useMemo(() => {
    return generateDigestExecutiveBrief(
      subscribedAlerts,
      preferences.subscribedCountries.length,
      preferences.subscribedSectors.length
    );
  }, [subscribedAlerts, preferences]);

  // Save new preferences
  const handleSavePreferences = () => {
    saveDigestPreferences(tempPrefs);
    setPreferences(tempPrefs);
    setIsPrefModalOpen(false);
  };

  // Toggle Read Status
  const handleToggleRead = (alertId: string) => {
    const isRead = preferences.readAlertIds.includes(alertId);
    const newRead = isRead
      ? preferences.readAlertIds.filter((id) => id !== alertId)
      : [...preferences.readAlertIds, alertId];

    const updated = { ...preferences, readAlertIds: newRead };
    setPreferences(updated);
    saveDigestPreferences(updated);
  };

  // Mark All Read
  const handleMarkAllRead = () => {
    const allIds = subscribedAlerts.map((a) => a.id);
    const updated = { ...preferences, readAlertIds: allIds };
    setPreferences(updated);
    saveDigestPreferences(updated);
  };

  // Copy Alert Brief to Clipboard
  const handleCopyAlert = (alert: RegulatoryUpdate) => {
    const text = `[REGULATORY ALERT] ${alert.title}\nJurisdiction: ${alert.countryName} (${alert.authority})\nImpact: ${alert.impactLevel.toUpperCase()}\nPublished: ${alert.publicationDate}\nSummary: ${alert.summary}\nOfficial Link: ${alert.sourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedAlertId(alert.id);
    setTimeout(() => setCopiedAlertId(null), 2500);
  };

  // Copy Executive Brief
  const handleCopyBrief = () => {
    const text = `COMPLIANCEIQ REGIONAL REGULATORY DIGEST\nDate: ${new Date().toLocaleDateString()}\n\nHEADLINE:\n${executiveBrief.headline}\n\nKEY TAKEAWAYS:\n${executiveBrief.keyEnforcementTakeaways.map((t) => `• ${t}`).join('\n')}\n\nREQUIRED ACTIONS:\n${executiveBrief.immediateActionsRequired.map((a) => `• ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Country', 'Authority', 'Title', 'Impact Level', 'Publication Date', 'Effective Date', 'Sectors', 'Official Source'];
    const rows = displayedAlerts.map((a) => [
      `"${a.id}"`,
      `"${a.countryName}"`,
      `"${a.authority}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.impactLevel}"`,
      `"${a.publicationDate}"`,
      `"${a.effectiveDate || 'N/A'}"`,
      `"${a.targetSectors.join('; ')}"`,
      `"${a.sourceUrl}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Regulatory-Digest-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Country Quick Presets
  const applyCountryPreset = (type: 'all' | 'gcc' | 'north_africa' | 'clear') => {
    if (type === 'all') {
      setTempPrefs({ ...tempPrefs, subscribedCountries: MENAT_COUNTRIES.map((c) => c.id) });
    } else if (type === 'gcc') {
      setTempPrefs({ ...tempPrefs, subscribedCountries: ['sa', 'ae', 'qa', 'kw', 'bh', 'om'] });
    } else if (type === 'north_africa') {
      setTempPrefs({ ...tempPrefs, subscribedCountries: ['eg', 'ma', 'dz', 'tn', 'ly', 'mr'] });
    } else if (type === 'clear') {
      setTempPrefs({ ...tempPrefs, subscribedCountries: [] });
    }
  };

  // Sector Quick Presets
  const applySectorPreset = (type: 'all' | 'fintech' | 'tech' | 'infra' | 'clear') => {
    if (type === 'all') {
      setTempPrefs({ ...tempPrefs, subscribedSectors: [...ALL_SECTORS_LIST] });
    } else if (type === 'fintech') {
      setTempPrefs({
        ...tempPrefs,
        subscribedSectors: ['Banking', 'Financial Services', 'Payments', 'Fintech'],
      });
    } else if (type === 'tech') {
      setTempPrefs({
        ...tempPrefs,
        subscribedSectors: ['Cloud & Hyperscalers', 'Telco', 'Digital Tech Startups'],
      });
    } else if (type === 'infra') {
      setTempPrefs({
        ...tempPrefs,
        subscribedSectors: ['Critical Infrastructure', 'Utilities', 'Oil & Gas', 'Power & Energy'],
      });
    } else if (type === 'clear') {
      setTempPrefs({ ...tempPrefs, subscribedSectors: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Regional Regulatory Digest</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    HIGH-PRIORITY ALERTS
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personalized statutory intelligence matching your subscribed MENAT jurisdictions and industry sectors.
                </p>
              </div>
            </div>

            {/* Subscribed Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-1.5">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  <strong>{preferences.subscribedCountries.length}</strong> Jurisdictions
                </span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong>{preferences.subscribedSectors.length}</strong> Sectors
                </span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{preferences.deliveryFrequency} Delivery</span>
              </span>

              {preferences.emailAlertsEnabled && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span className="truncate max-w-[180px]">{preferences.recipientEmail}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setTempPrefs(preferences);
                setIsPrefModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:border-slate-600"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Customize Subscriptions</span>
            </button>

            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white flex items-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Executive Brief</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Unread counter, Search & Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Left Filter Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFeedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              feedFilter === 'all'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>All Subscribed</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">
              {subscribedAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setFeedFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              feedFilter === 'critical'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 text-rose-400 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Critical Only</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">
              {subscribedAlerts.filter((a) => a.impactLevel === 'Critical').length}
            </span>
          </button>

          <button
            onClick={() => setFeedFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              feedFilter === 'unread'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500 text-white font-mono font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Search & Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search digest headlines, authorities..."
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            className="w-full md:w-64 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 whitespace-nowrap cursor-pointer transition-colors"
              title="Mark all alerts as read"
            >
              Mark all read
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer transition-colors"
            title="Export alerts to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Digest Feed */}
      <div className="space-y-4">
        {displayedAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <BellRing className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-white">No updates match your current filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Try adjusting your search query, or expand your subscribed jurisdictions and sectors to receive broader coverage.
            </p>
            <button
              onClick={() => {
                setTempPrefs(preferences);
                setIsPrefModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer inline-flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Modify Subscriptions</span>
            </button>
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const countryObj = MENAT_COUNTRIES.find(
              (c) => c.id.toLowerCase() === alert.countryId.toLowerCase()
            );
            const isRead = preferences.readAlertIds.includes(alert.id);
            const isCopied = copiedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all shadow-sm ${
                  !isRead
                    ? 'border-rose-500/50 bg-slate-900/90 shadow-rose-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl" title={alert.countryName}>
                      {countryObj?.flag || '🌐'}
                    </span>
                    <span className="font-bold text-white text-sm">{alert.countryName}</span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1 font-medium">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{alert.authority}</span>
                    </span>

                    {/* Impact Level Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        alert.impactLevel === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : alert.impactLevel === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      {alert.impactLevel.toUpperCase()} IMPACT
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {alert.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Published: {alert.publicationDate}</span>
                    {alert.effectiveDate && (
                      <span className="text-amber-400 font-bold">• Effective: {alert.effectiveDate}</span>
                    )}
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="mt-3.5">
                  <h3 className="text-base font-bold text-white leading-snug tracking-tight">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{alert.summary}</p>
                </div>

                {/* Key Technical Requirements / Mandates */}
                {alert.keyRequirements && alert.keyRequirements.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Statutory Compliance Directives</span>
                    </div>
                    <ul className="space-y-1.5">
                      {alert.keyRequirements.map((req, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Affected Sector Tags & Footer Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">
                      Affected Sectors:
                    </span>
                    {alert.targetSectors.map((sector) => (
                      <span
                        key={sector}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-cyan-300 border border-slate-700/60 font-mono"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleToggleRead(alert.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                        isRead
                          ? 'text-slate-400 bg-slate-950 border-slate-800 hover:text-white'
                          : 'text-rose-300 bg-rose-500/10 border-rose-500/30 font-medium'
                      }`}
                    >
                      {isRead ? 'Mark as Unread' : 'Mark as Read'}
                    </button>

                    <button
                      onClick={() => handleCopyAlert(alert)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Copy alert brief to clipboard"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Official Gazette</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subscription Preferences Modal */}
      {isPrefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Customize Regulatory Digest Subscriptions</h3>
                  <p className="text-xs text-slate-400">
                    Subscribe to high-priority alerts tailored to your geographic and sectoral compliance perimeter.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrefModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* SECTION 1: Sovereign Jurisdictions Multi-Select */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Globe2 className="w-4 h-4 text-cyan-400" />
                    <span>Subscribed Jurisdictions ({tempPrefs.subscribedCountries.length} selected)</span>
                  </label>

                  {/* Preset quick buttons */}
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => applyCountryPreset('gcc')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
                    >
                      GCC (6)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCountryPreset('north_africa')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
                    >
                      North Africa (6)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCountryPreset('all')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
                    >
                      Select All (24)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCountryPreset('clear')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {MENAT_COUNTRIES.map((c) => {
                    const isSelected = tempPrefs.subscribedCountries.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const newCountries = isSelected
                            ? tempPrefs.subscribedCountries.filter((id) => id !== c.id)
                            : [...tempPrefs.subscribedCountries, c.id];
                          setTempPrefs({ ...tempPrefs, subscribedCountries: newCountries });
                        }}
                        className={`p-2 rounded-lg text-left text-xs flex items-center space-x-2 transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500/50 text-white font-semibold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-base shrink-0">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Target Industry Sectors Multi-Select */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Subscribed Sectors ({tempPrefs.subscribedSectors.length} selected)</span>
                  </label>

                  {/* Preset quick buttons */}
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => applySectorPreset('fintech')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
                    >
                      Finance &amp; Fintech
                    </button>
                    <button
                      type="button"
                      onClick={() => applySectorPreset('tech')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
                    >
                      Cloud &amp; Tech
                    </button>
                    <button
                      type="button"
                      onClick={() => applySectorPreset('infra')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                    >
                      Critical Infra
                    </button>
                    <button
                      type="button"
                      onClick={() => applySectorPreset('all')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
                    >
                      Select All (18)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {ALL_SECTORS_LIST.map((sector) => {
                    const isSelected = tempPrefs.subscribedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => {
                          const newSectors = isSelected
                            ? tempPrefs.subscribedSectors.filter((s) => s !== sector)
                            : [...tempPrefs.subscribedSectors, sector];
                          setTempPrefs({ ...tempPrefs, subscribedSectors: newSectors });
                        }}
                        className={`p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-semibold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{sector}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Priority & Delivery Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Alert Urgency Threshold
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTempPrefs({ ...tempPrefs, priorityFilter: 'high_only' })}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border cursor-pointer transition-colors ${
                        tempPrefs.priorityFilter === 'high_only'
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">High &amp; Critical Only</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Enforcements &amp; Penalties</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTempPrefs({ ...tempPrefs, priorityFilter: 'all' })}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border cursor-pointer transition-colors ${
                        tempPrefs.priorityFilter === 'all'
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">All Regulatory News</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Includes Consultations</div>
                    </button>
                  </div>
                </div>

                {/* Delivery Frequency */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Digest Schedule
                  </label>
                  <select
                    value={tempPrefs.deliveryFrequency}
                    onChange={(e) =>
                      setTempPrefs({ ...tempPrefs, deliveryFrequency: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="daily">Daily Morning Digest (08:00 UTC)</option>
                    <option value="weekly">Weekly Executive Roundup (Mondays)</option>
                    <option value="realtime">Real-Time Flash Bulletins (Immediate)</option>
                  </select>
                </div>
              </div>

              {/* Email Notification Dispatch */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailAlertsToggle"
                    checked={tempPrefs.emailAlertsEnabled}
                    onChange={(e) =>
                      setTempPrefs({ ...tempPrefs, emailAlertsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="emailAlertsToggle" className="text-xs font-bold text-white cursor-pointer">
                      Send Automated Digest to Email
                    </label>
                    <p className="text-[11px] text-slate-400">Dispatch executive briefs directly to compliance inbox.</p>
                  </div>
                </div>

                <input
                  type="email"
                  disabled={!tempPrefs.emailAlertsEnabled}
                  value={tempPrefs.recipientEmail}
                  onChange={(e) => setTempPrefs({ ...tempPrefs, recipientEmail: e.target.value })}
                  placeholder="compliance@enterprise.com"
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setIsPrefModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Subscriptions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Brief Generator Modal */}
      {isBriefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Board-Ready Executive Briefing</h3>
                  <p className="text-xs text-slate-400">
                    Synthesized compliance takeaways for CISO, DPO, and General Counsel review.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Headline */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-amber-950/30 border border-rose-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold mb-1">
                  EXECUTIVE SUMMARY HEADLINE
                </div>
                <p className="text-sm font-bold text-white leading-relaxed">{executiveBrief.headline}</p>
              </div>

              {/* Takeaways */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Key Enforcement Signals ({preferences.subscribedCountries.length} Jurisdictions)
                </h4>
                <ul className="space-y-2">
                  {executiveBrief.keyEnforcementTakeaways.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action items */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Immediate Board &amp; Operations Directives
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  {executiveBrief.immediateActionsRequired.map((action, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-6">
              <span className="text-[11px] text-slate-500 font-mono">
                Generated from active subscriptions
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {copiedBrief ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedBrief ? 'Copied to Clipboard!' : 'Copy Executive Brief'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
