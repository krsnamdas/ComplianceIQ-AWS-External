import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin, DEFAULT_FEATURE_FLAGS } from '../../context/AdminContext';
import { FeatureFlags } from '../../types/admin';
import {
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Radio,
  Flame,
  TrendingUp,
  CalendarClock,
  GitCompare,
  Layers,
  Scale,
  Grid,
  Database,
  Download,
  BookmarkCheck,
  Megaphone,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  PenTool,
  BookOpen,
  Check,
  X,
  Sliders,
} from 'lucide-react';

interface FeatureMetadata {
  key: keyof FeatureFlags;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'Intelligence & AI' | 'Core Analytics' | 'Navigation & Discovery' | 'Operational & Exports';
  affectedViews: string[];
}

const FEATURE_METADATA_LIST: FeatureMetadata[] = [
  {
    key: 'regulatoryFeed',
    title: 'Live Regulatory Radar & Grounded News Feed',
    description:
      'Enables the real-time MENAT radar scanner, official gazette feeds, and live web grounded regulatory intelligence streams.',
    icon: <Radio className="w-5 h-5 text-amber-400" />,
    category: 'Intelligence & AI',
    affectedViews: ['Navbar Radar Tab', 'RegulatoryRadar Component', 'Live Feeds'],
  },
  {
    key: 'aiCopilot',
    title: 'Autonomous AI Regulatory Copilot & Chatbot',
    description:
      'Provides conversational AI compliance advisory with live search grounding across 24 MENAT jurisdictions. When disabled, the AI Copilot chatbot drawer, floating quick-launch button, and navbar trigger are completely disabled and hidden across all pages including the admin console.',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    category: 'Intelligence & AI',
    affectedViews: [
      'Navbar AI Copilot Launcher',
      'Floating AI Copilot Widget',
      'AI Copilot Chat Drawer',
      'Admin Console Integration',
    ],
  },
  {
    key: 'smartInsights',
    title: 'Smart Insight Summary (Sector Mandates & Impact)',
    description:
      'Provides sector-specific AI statutory impact, architecture mandates, and enforcement risk breakdowns across regulations under each jurisdiction.',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    category: 'Intelligence & AI',
    affectedViews: ['RegulationCard Smart Insight Summary', 'Executive Sector Deep-Dives'],
  },
  {
    key: 'maturityHeatmap',
    title: 'Compliance Maturity Heatmap (D3.js)',
    description:
      'Interactive D3 cross-country heatmap charting cybersecurity, AI, data privacy, and operational resilience maturity scores.',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    category: 'Core Analytics',
    affectedViews: ['Navbar Heatmap Tab', 'ComplianceMaturityHeatmap View'],
  },
  {
    key: 'regulatoryRoadmap',
    title: 'Enactment Roadmap & Investment Model',
    description:
      'Enactment Roadmap tab: quarterly multi-year implementation progression visualizer and compliance capital expenditure (CapEx / OpEx) forecasting engine. Turn off to hide the Enactment Roadmap from all users.',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    category: 'Core Analytics',
    affectedViews: ['Navbar "Enactment Roadmap" Tab', 'RegulatoryRoadmap View', 'Quarterly Projections'],
  },
  {
    key: 'controlsCrosswalk',
    title: 'NIST CSF, ISO 27001 & CSA CCM Controls Crosswalk',
    description:
      'Side-by-side control mapping aligning MENAT statutory frameworks (NCA ECC, SAMA, CBUAE, etc.) with international baselines.',
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    category: 'Core Analytics',
    affectedViews: ['Navbar Controls Tab', 'ControlsCrosswalk Component'],
  },
  {
    key: 'regulationComparator',
    title: 'Cross-Regulation Overlap & LOE Comparator',
    description:
      'Enables side-by-side comparison between 2 regulations to compute rough order of magnitude overlap, LOE assessment effort, similar controls count, and unrelated domain alerts.',
    icon: <Scale className="w-5 h-5 text-indigo-400" />,
    category: 'Core Analytics',
    affectedViews: ['Navbar Compare Tab', 'RegulationComparator View', 'Card Quick Compare'],
  },
  {
    key: 'controlInterpreter',
    title: 'Control & Sub-Control Interpreter',
    description:
      'Breaks down statutory control requirements into People, Process, and Technical checks, with multi-standard crosswalks (NIST 800-53, CSF v2, ISO 27001, CIS, CSA CCM v4.1).',
    icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
    category: 'Intelligence & AI',
    affectedViews: ['Navbar Interpreter Tab', 'ControlInterpreter View', 'RegulationCard Interpret Clause Action'],
  },
  {
    key: 'aiRedlining',
    title: 'AI Policy Redlining & Gap Detection Engine',
    description:
      'Uploads draft internal compliance policies and compares against statutory controls in real time to identify, highlight, and rewrite non-compliant or missing clauses.',
    icon: <PenTool className="w-5 h-5 text-rose-400" />,
    category: 'Intelligence & AI',
    affectedViews: ['Navbar AI Redlining Tab', 'AIRedliningComponent View', 'Policy Gap Analysis'],
  },
  {
    key: 'sectorMatrix',
    title: 'Cross-Sector Compliance Matrix',
    description:
      'Sectoral coverage grid analyzing Banking, FinTech, Critical Infrastructure, Telco, Energy, and Government statutory exposure.',
    icon: <Grid className="w-5 h-5 text-teal-400" />,
    category: 'Core Analytics',
    affectedViews: ['Navbar Sectors Tab', 'SectorMatrix View'],
  },
  {
    key: 'regulatoryTimeline',
    title: 'Regulatory Timeline & Statutory Milestones',
    description:
      'Chronological milestone roadmap of passed laws, transitional grace periods, and upcoming mandatory enforcement deadlines.',
    icon: <CalendarClock className="w-5 h-5 text-purple-400" />,
    category: 'Navigation & Discovery',
    affectedViews: ['Navbar Timeline Tab', 'RegulatoryTimeline Component'],
  },
  {
    key: 'versionDiffs',
    title: 'Regulatory Version Diffs & Change Log Engine',
    description:
      'Side-by-side delta comparator analyzing statutory amendments (e.g. SAMA Cybersecurity Framework v1 vs v2, Saudi PDPL iterations).',
    icon: <GitCompare className="w-5 h-5 text-cyan-400" />,
    category: 'Navigation & Discovery',
    affectedViews: ['Navbar Version Diffs Tab', 'VersionDiffViewer Component'],
  },
  {
    key: 'sourcesManager',
    title: 'Official Gazette Sources & Scraper Crawler',
    description:
      'Registry of tracked official ministerial gazettes, central banks, and automated 48-hour compliance crawling schedules.',
    icon: <Database className="w-5 h-5 text-sky-400" />,
    category: 'Operational & Exports',
    affectedViews: ['Navbar Sources Tab', 'TrackedSourcesManager View', 'Manual Sync Button'],
  },
  {
    key: 'exportReports',
    title: 'Compliance Dossier Export (PDF / CSV / JSON)',
    description:
      'Executive reporting engine generating multi-jurisdiction compliance attestation documents, spreadsheets, and data feeds.',
    icon: <Download className="w-5 h-5 text-emerald-400" />,
    category: 'Operational & Exports',
    affectedViews: ['Navbar Export Button', 'ExportModal Component'],
  },
  {
    key: 'watchlistAlerts',
    title: 'Personalized Watchlist & Pinned Regulations',
    description:
      'Allows compliance officers to pin statutory instruments, customize notification urgency thresholds, and monitor updates.',
    icon: <BookmarkCheck className="w-5 h-5 text-amber-400" />,
    category: 'Operational & Exports',
    affectedViews: ['Navbar Watchlist Tab', 'Watchlist Notification Bell', 'Card Pin Controls'],
  },
  {
    key: 'systemBroadcast',
    title: 'Global System Advisory Banner',
    description:
      'Top-level broadcast banner broadcasting statutory audit deadlines, urgent ministerial circulars, or maintenance notifications.',
    icon: <Megaphone className="w-5 h-5 text-rose-400" />,
    category: 'Operational & Exports',
    affectedViews: ['Top SystemBroadcastBanner across all screens'],
  },
];

export const FeatureTogglesTab: React.FC = () => {
  const { featureFlags, updateFeatureFlags } = useAdmin();

  // Staged / Draft state
  const [stagedFlags, setStagedFlags] = useState<FeatureFlags>(featureFlags);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Sync draft flags with live flags when live flags change and no unapplied edits exist
  useEffect(() => {
    setStagedFlags((prev) => {
      const isDirty = (Object.keys(featureFlags) as Array<keyof FeatureFlags>).some(
        (k) => prev[k] !== featureFlags[k]
      );
      return isDirty ? prev : featureFlags;
    });
  }, [featureFlags]);

  // Compute modified / dirty keys
  const modifiedKeys = useMemo(() => {
    return (Object.keys(featureFlags) as Array<keyof FeatureFlags>).filter(
      (k) => stagedFlags[k] !== featureFlags[k]
    );
  }, [stagedFlags, featureFlags]);

  const hasUnappliedChanges = modifiedKeys.length > 0;
  const stagedEnabledCount = Object.values(stagedFlags).filter(Boolean).length;
  const totalCount = Object.keys(stagedFlags).length;

  const handleToggle = (key: keyof FeatureFlags) => {
    setApplySuccessMessage(null);
    setStagedFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDiscardChanges = () => {
    setStagedFlags(featureFlags);
    setApplySuccessMessage(null);
  };

  const handleResetToDefaultDraft = () => {
    setStagedFlags(DEFAULT_FEATURE_FLAGS);
    setApplySuccessMessage(null);
  };

  const handleApplyChanges = () => {
    const updatedCount = modifiedKeys.length;
    updateFeatureFlags(stagedFlags);
    setApplySuccessMessage(
      `✓ Successfully applied ${updatedCount} feature toggle ${
        updatedCount === 1 ? 'update' : 'updates'
      } in one shot! All platform modules and navigation bars are updated.`
    );
    setTimeout(() => {
      setApplySuccessMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 relative">
      {/* Top Banner with Stats */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Modular Platform Feature Toggles</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {stagedEnabledCount} of {totalCount} Enabled
            </span>
            {hasUnappliedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                {modifiedKeys.length} Unsaved Changes
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure platform capabilities. Toggle modules on or off below, then click{' '}
            <strong className="text-emerald-400 font-semibold">Apply Changes</strong> towards the
            bottom to commit all updates in one shot across user sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaultDraft}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Stage default configuration for all feature flags"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Stage System Defaults</span>
          </button>
        </div>
      </div>

      {/* Grid of Feature Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_METADATA_LIST.map((meta) => {
          const isStagedEnabled = stagedFlags[meta.key];
          const isLiveEnabled = featureFlags[meta.key];
          const isModified = isStagedEnabled !== isLiveEnabled;

          return (
            <div
              key={meta.key}
              className={`p-4 rounded-xl border transition-all ${
                isModified
                  ? 'bg-slate-900 border-amber-500/70 ring-1 ring-amber-500/40 shadow-md'
                  : isStagedEnabled
                  ? 'bg-slate-900/90 border-slate-700 shadow-xs'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isModified
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : isStagedEnabled
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {meta.title}
                      </span>
                      {isModified ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center space-x-1">
                          <span>PENDING:</span>
                          <strong className="uppercase">{isStagedEnabled ? 'ENABLE' : 'DISABLE'}</strong>
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isStagedEnabled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isStagedEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {meta.description}
                    </p>
                    {isModified && (
                      <div className="mt-1.5 text-[10px] text-amber-300/90 font-mono flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>
                          Live state: {isLiveEnabled ? 'ACTIVE' : 'DISABLED'} → Click Apply Changes below to commit.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggle(meta.key)}
                  className={`p-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                    isModified
                      ? 'text-amber-400 hover:text-amber-300'
                      : isStagedEnabled
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                  title={
                    isModified
                      ? `Pending: will switch to ${isStagedEnabled ? 'ENABLED' : 'DISABLED'}. Click to toggle back.`
                      : isStagedEnabled
                      ? `Click to toggle disable for ${meta.title}`
                      : `Click to toggle enable for ${meta.title}`
                  }
                >
                  {isStagedEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Affected views pill row */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">Category: {meta.category}</span>
                <span className="truncate ml-2 text-slate-400">
                  Target: {meta.affectedViews[0]}
                </span>
              </div>

              {meta.key === 'aiCopilot' && (
                <div className={`mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono ${isStagedEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>Floating Widget &amp; Launcher:</span>
                  <span className="font-bold">
                    {isStagedEnabled
                      ? isModified ? '● STAGED TO ENABLE (PENDING APPLY)' : '● ACTIVE'
                      : isModified ? '○ STAGED TO DISABLE (PENDING APPLY)' : '○ DISABLED'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Changes Control Center Towards the Bottom */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all ${
          hasUnappliedChanges
            ? 'bg-slate-900 border-amber-500/50 shadow-2xl ring-1 ring-amber-500/30'
            : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Feature Flags Batch Controller</span>
              </span>
              {hasUnappliedChanges ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                  {modifiedKeys.length} {modifiedKeys.length === 1 ? 'Change' : 'Changes'} Ready to Apply
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All Features Live &amp; Synchronized</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {hasUnappliedChanges
                ? 'You have toggled feature switches above. Click "Apply Changes" below to commit all staged configurations simultaneously across all views, navigations, and user accounts.'
                : 'All platform toggles are in sync with active user sessions. Toggle any module in the grid above to stage bulk updates.'}
            </p>

            {/* Chips showing which features have changed */}
            {hasUnappliedChanges && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {modifiedKeys.map((key) => {
                  const meta = FEATURE_METADATA_LIST.find((m) => m.key === key);
                  const willEnable = stagedFlags[key];
                  return (
                    <span
                      key={key}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 shadow-xs ${
                        willEnable
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                          : 'bg-rose-950/70 text-rose-300 border-rose-500/50'
                      }`}
                    >
                      <span className="font-semibold">{meta?.title || key}:</span>
                      <strong className="uppercase underline tracking-wide">
                        {willEnable ? 'Enable' : 'Disable'}
                      </strong>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0">
            {hasUnappliedChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Discard Changes</span>
              </button>
            )}

            <button
              type="button"
              disabled={!hasUnappliedChanges}
              onClick={handleApplyChanges}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-xl cursor-pointer ${
                hasUnappliedChanges
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white border border-emerald-400/50 transform hover:scale-105 active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes</span>
              {hasUnappliedChanges && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">
                  ({modifiedKeys.length})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {applySuccessMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{applySuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Dock for Instant Access When Scrolled */}
      {hasUnappliedChanges && (
        <div className="sticky bottom-4 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/60 rounded-xl p-3 sm:px-5 shadow-2xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white">
                  {modifiedKeys.length} {modifiedKeys.length === 1 ? 'toggle' : 'toggles'} modified
                </span>
                <span className="text-slate-400 hidden sm:inline"> — click Apply to execute in one shot</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplyChanges}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Changes ({modifiedKeys.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
