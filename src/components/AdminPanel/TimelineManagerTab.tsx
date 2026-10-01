import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { TimelineEvent, SectorType, RegulatoryCategory } from '../../types/regulatory';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  Download,
  X,
  Save,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PendingChangesDock } from './PendingChangesDock';

const BENCHMARK_DATE = '2026-09-22';
const BENCHMARK_TIME = new Date(BENCHMARK_DATE).getTime();

const SECTOR_OPTIONS: SectorType[] = [
  'Banking',
  'Financial Services',
  'Payments',
  'Fintech',
  'Telco',
  'Cloud & Hyperscalers',
  'Retail & E-Commerce',
  'Healthcare',
  'Power & Energy',
  'Government',
  'Critical Infrastructure',
  'Insurance',
  'Oil & Gas',
  'Mining & Extraction',
  'Digital Tech Startups',
  'Manufacturing',
  'Automotive',
  'Space & Aerospace',
  'Gaming & Entertainment',
  'Utilities',
];

const CATEGORY_OPTIONS: { id: RegulatoryCategory; label: string }[] = [
  { id: 'tech_cyber', label: 'Cybersecurity & Critical Infrastructure' },
  { id: 'tech_data_privacy', label: 'Data Privacy & Cross-Border Transfer' },
  { id: 'tech_cloud', label: 'Cloud & Hyperscalers' },
  { id: 'tech_ai', label: 'Artificial Intelligence & Algorithmic Safety' },
  { id: 'tech_fintech_payments', label: 'Digital Payments & Open Finance' },
  { id: 'tech_operational_resilience', label: 'Operational Resilience & Business Continuity' },
  { id: 'tech_ot_ics', label: 'OT & Industrial Control Systems' },
  { id: 'tech_space_quantum', label: 'Quantum & Deep-Tech Security' },
  { id: 'tech_risk_others', label: 'General Tech Risk & Governance' },
  { id: 'non_tech_impact', label: 'Non-Tech Statutory Directives' },
];

export const TimelineManagerTab: React.FC = () => {
  const {
    timelineEvents,
    effectiveTimelineEvents,
    pendingTimelineEdits,
    stageTimelineEdit,
    unstageTimelineEdit,
    discardPendingEdits,
    applyPendingEdits,
    hasPendingEdits,
    totalPendingEditsCount,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    resetTimelineEventsToDefault,
    countries,
    benchmarkDate,
    updateBenchmarkDate,
  } = useAdmin();

  // Configurable benchmark "current date" anchor (falls back to module default).
  const BENCHMARK_TIME_LOCAL = new Date(benchmarkDate || BENCHMARK_DATE).getTime();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick edit date drawer/modal state
  const [quickDateEvent, setQuickDateEvent] = useState<{
    id: string;
    title: string;
    deadlineDate: string;
    transitionStartDate?: string;
    urgency: TimelineEvent['urgency'];
    status: TimelineEvent['status'];
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filtered Events - uses effectiveTimelineEvents so pending changes show in real time
  const filteredEvents = useMemo(() => {
    return effectiveTimelineEvents.filter((evt) => {
      if (selectedCountryFilter !== 'all' && evt.countryId !== selectedCountryFilter) {
        return false;
      }
      if (selectedUrgencyFilter !== 'all' && evt.urgency !== selectedUrgencyFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'all' && evt.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchCode = evt.regulationCode.toLowerCase().includes(q);
        const matchAuth = evt.authority.toLowerCase().includes(q);
        const matchCountry = evt.countryName.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchAuth && !matchCountry && !matchDesc) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
  }, [effectiveTimelineEvents, selectedCountryFilter, selectedUrgencyFilter, selectedStatusFilter, searchQuery]);

  // Statistics (derived from effective events with staged changes)
  const totalCount = effectiveTimelineEvents.length;
  const criticalCount = effectiveTimelineEvents.filter((e) => e.urgency === 'Critical').length;
  const imminentCount = effectiveTimelineEvents.filter((e) => {
    const d = new Date(e.deadlineDate).getTime();
    const diffDays = Math.ceil((d - BENCHMARK_TIME_LOCAL) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  }).length;

  // Helpers
  const getDaysRemaining = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - BENCHMARK_TIME_LOCAL;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (urgency: TimelineEvent['urgency']) => {
    switch (urgency) {
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            CRITICAL
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
            HIGH
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-700 text-slate-300 border border-slate-600">
            INFORMATIONAL
          </span>
        );
    }
  };

  const exportCSV = () => {
    const headers = [
      'ID',
      'Country',
      'Regulation Code',
      'Milestone Title',
      'Authority',
      'Start Date',
      'Grace Period Start',
      'Statutory Deadline',
      'Urgency',
      'Status',
      'Official Reference',
      'Official URL',
    ];

    const rows = timelineEvents.map((evt) => [
      `"${evt.id}"`,
      `"${evt.countryName}"`,
      `"${evt.regulationCode}"`,
      `"${evt.title.replace(/"/g, '""')}"`,
      `"${evt.authority.replace(/"/g, '""')}"`,
      `"${evt.startDate}"`,
      `"${evt.transitionStartDate || ''}"`,
      `"${evt.deadlineDate}"`,
      `"${evt.urgency}"`,
      `"${evt.status}"`,
      `"${evt.officialReference?.replace(/"/g, '""') || ''}"`,
      `"${evt.officialUrl || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `MENAT_Statutory_Deadlines_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported statutory timeline dataset to CSV format.');
  };

  // Quick Date Save (Stages edit for atomic transaction)
  const handleSaveQuickDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDateEvent) return;

    stageTimelineEdit(quickDateEvent.id, {
      deadlineDate: quickDateEvent.deadlineDate,
      transitionStartDate: quickDateEvent.transitionStartDate,
      urgency: quickDateEvent.urgency,
      status: quickDateEvent.status,
    });

    showToast(`⚡ Staged statutory deadline update for "${quickDateEvent.title}". Click "Apply Changes" below to commit.`);
    setQuickDateEvent(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Staged Changes Header Alert Banner */}
      {hasPendingEdits && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Unapplied Statutory Edits</span>
                <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/40">
                  {totalPendingEditsCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Statutory deadline and regulatory status modifications are staged. Apply all changes simultaneously in a single atomic transaction.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={discardPendingEdits}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                const res = applyPendingEdits();
                if (res.success) {
                  showToast(`✓ Successfully applied ${res.timelineCount} statutory updates in a single atomic transaction!`);
                }
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border border-emerald-400/50 flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CalendarClock className="w-5 h-5 text-emerald-400" />
              <span>Statutory Timelines &amp; Enforcement Deadlines Manager</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {totalCount} Total Milestones
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Directly configure statutory enforcement cutoff dates, grace period transition runways, and urgency levels.
            Edits update live in real time across the <strong>Interactive Gantt Tracker</strong>, <strong>Chronological Feed</strong>, and <strong>Quarterly Matrix</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset timelines to default baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Baseline</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Statutory Deadline</span>
          </button>
        </div>
      </div>

      {/* Benchmark "Current Date" Anchor — configurable per region / deployment */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <CalendarClock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Platform Benchmark Date (&ldquo;Today&rdquo; Anchor)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              All deadline countdowns, urgency scores, and watchlist alerts are calculated relative to this date.
              Set it to your deployment go-live date when launching a new region.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="date"
            value={benchmarkDate}
            onChange={(e) => {
              if (e.target.value) {
                updateBenchmarkDate(e.target.value);
                showToast(`Benchmark date updated to ${e.target.value}. Deadline calculations refreshed.`);
              }
            }}
            className="bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono cursor-pointer"
            title="Change the benchmark 'current date' used for all deadline calculations"
          />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Region Anchor
          </span>
        </div>
      </div>

      {/* KPI Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Milestones</span>
          <span className="text-xl font-bold text-white mt-0.5 block">{totalCount}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-rose-400 font-mono block uppercase">Critical Urgency</span>
          <span className="text-xl font-bold text-rose-400 mt-0.5 block">{criticalCount}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-amber-400 font-mono block uppercase">Imminent (&lt;90 Days)</span>
          <span className="text-xl font-bold text-amber-300 mt-0.5 block">{imminentCount}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
          <span className="text-[10px] text-emerald-400 font-mono block uppercase">Anchor Benchmark</span>
          <span className="text-xs font-bold text-emerald-300 mt-1.5 block font-mono">Sep 22, 2026</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search statutory deadlines by regulation code, decree name, authority, or country..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Country filter */}
          <select
            value={selectedCountryFilter}
            onChange={(e) => setSelectedCountryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Jurisdictions ({countries.length})</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          {/* Urgency filter */}
          <select
            value={selectedUrgencyFilter}
            onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Urgency</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Informational">Informational</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Imminent (<90 Days)">Imminent (&lt;90 Days)</option>
            <option value="Upcoming (2026-2027)">Upcoming (2026-2027)</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed / Active">Completed / Active</option>
            <option value="Long-Term Horizon (2027+)">Long-Term Horizon (2027+)</option>
          </select>
        </div>
      </div>

      {/* Timeline Events Table / List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="table-scroll-x">
          <table className="w-full text-left text-xs border-collapse min-w-[820px]">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-44 shrink-0">Jurisdiction &amp; Authority</th>
                <th className="py-3 px-4">Regulation &amp; Milestone Title</th>
                <th className="py-3 px-3">Statutory Timeline Runway</th>
                <th className="py-3 px-3">Deadline Date</th>
                <th className="py-3 px-3">Urgency &amp; Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No statutory timeline milestones match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const daysRemaining = getDaysRemaining(evt.deadlineDate);
                  const isPast = daysRemaining < 0;
                  const isPending = !!pendingTimelineEdits[evt.id];
                  const pendingChanges = pendingTimelineEdits[evt.id];

                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isPending ? 'bg-amber-950/20 ring-1 ring-amber-500/50' : ''
                      }`}
                    >
                      {/* Jurisdiction */}
                      <td className="py-3.5 px-4 w-44 shrink-0 align-top">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{evt.countryFlag}</span>
                          <div>
                            <span className="font-semibold text-white block">
                              {evt.countryName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {evt.authorityShort || evt.authority}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Regulation & Title */}
                      <td className="py-3.5 px-4 align-top max-w-sm">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                              {evt.regulationCode}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {evt.eventType}
                            </span>
                            {isPending && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide inline-flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                <span>Pending Edit</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">
                            {evt.title}
                          </h4>
                          {evt.officialReference && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center space-x-1">
                              <Info className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{evt.officialReference}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Dates Runway */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap font-mono text-[11px]">
                        <div className="space-y-1">
                          <div className="text-slate-400">
                            <span className="text-[10px] text-slate-500 uppercase mr-1">Start:</span>
                            {evt.startDate}
                          </div>
                          {evt.transitionStartDate && (
                            <div className="text-amber-400/90 text-[10px]">
                              <span className="text-slate-500 uppercase mr-1">Grace:</span>
                              {evt.transitionStartDate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Deadline Date & Countdown */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="space-y-1 font-mono">
                          <span className={`text-xs font-bold block ${isPending ? 'text-amber-300' : 'text-white'}`}>
                            {evt.deadlineDate}
                          </span>
                          {isPast ? (
                            <span className="text-[10px] text-slate-500 block">
                              Passed ({Math.abs(daysRemaining)}d ago)
                            </span>
                          ) : daysRemaining <= 90 ? (
                            <span className="text-[10px] font-bold text-rose-400 block animate-pulse">
                              ⏳ {daysRemaining} days remaining
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 block">
                              In {Math.round(daysRemaining / 30)} months ({daysRemaining}d)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Urgency & Status */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1.5">
                          <div>{getUrgencyBadge(evt.urgency)}</div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {evt.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* If pending, show unstage button */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => unstageTimelineEdit(evt.id)}
                              className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                              title="Revert pending edit back to baseline"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Date Change Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setQuickDateEvent({
                                id: evt.id,
                                title: evt.title,
                                deadlineDate: evt.deadlineDate,
                                transitionStartDate: evt.transitionStartDate,
                                urgency: evt.urgency,
                                status: evt.status,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Quick Edit Deadline Date"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingEvent(evt)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit Full Milestone Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(evt.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK DATE MODAL */}
      {quickDateEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CalendarClock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Quick Update Deadline Date</h3>
              </div>
              <button
                onClick={() => setQuickDateEvent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickDate} className="space-y-4 mt-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Milestone Target</span>
                <p className="text-xs font-semibold text-slate-200 line-clamp-2 mt-0.5">
                  {quickDateEvent.title}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Statutory Enforcement Deadline Date *
                </label>
                <input
                  type="date"
                  required
                  value={quickDateEvent.deadlineDate}
                  onChange={(e) =>
                    setQuickDateEvent({ ...quickDateEvent, deadlineDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Transition / Grace Period Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={quickDateEvent.transitionStartDate || ''}
                  onChange={(e) =>
                    setQuickDateEvent({ ...quickDateEvent, transitionStartDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={quickDateEvent.urgency}
                    onChange={(e) =>
                      setQuickDateEvent({
                        ...quickDateEvent,
                        urgency: e.target.value as TimelineEvent['urgency'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Informational">Informational</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Status
                  </label>
                  <select
                    value={quickDateEvent.status}
                    onChange={(e) =>
                      setQuickDateEvent({
                        ...quickDateEvent,
                        status: e.target.value as TimelineEvent['status'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Imminent (<90 Days)">Imminent (&lt;90 Days)</option>
                    <option value="Upcoming (2026-2027)">Upcoming (2026-2027)</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="Completed / Active">Completed / Active</option>
                    <option value="Long-Term Horizon (2027+)">Long-Term Horizon (2027+)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickDateEvent(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL EDIT / CREATE MODAL */}
      {(isCreateModalOpen || editingEvent) && (
        <TimelineEventModal
          isOpen={isCreateModalOpen || !!editingEvent}
          eventToEdit={editingEvent}
          countries={countries}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={(eventData) => {
            if (editingEvent) {
              stageTimelineEdit(editingEvent.id, eventData);
              showToast(`⚡ Staged statutory edits for "${eventData.title}". Click "Apply Changes" below to commit.`);
            } else {
              const newId = `evt-${eventData.countryId}-${Date.now().toString(36)}`;
              addTimelineEvent({
                ...eventData,
                id: newId,
              });
              showToast(`✓ Created new statutory deadline milestone: "${eventData.title}".`);
            }
            setIsCreateModalOpen(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-white text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Delete Statutory Milestone?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to remove this timeline milestone? This will delete it from all active user timeline trackers and Gantt charts.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTimelineEvent(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('✓ Statutory timeline milestone deleted.');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Reset All Timelines to Default?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This will restore all regulatory timeline events and deadlines back to the official statutory baseline. Any customized deadlines or manually created events will be replaced.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetTimelineEventsToDefault();
                  setResetConfirmOpen(false);
                  showToast('✓ Reset all statutory deadlines to system default baseline.');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-lg"
              >
                Reset Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Dock for Atomic Persistence */}
      <PendingChangesDock viewContext="admin" />
    </div>
  );
};

interface TimelineEventModalProps {
  isOpen: boolean;
  eventToEdit: TimelineEvent | null;
  countries: any[];
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
}

const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  eventToEdit,
  countries,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<TimelineEvent>(() => {
    if (eventToEdit) return { ...eventToEdit };
    const defaultCountry = countries[0] || { id: 'saudi_arabia', name: 'Saudi Arabia', flag: '🇸🇦' };
    return {
      id: '',
      regulationCode: '',
      title: '',
      authority: '',
      authorityShort: '',
      countryId: defaultCountry.id,
      countryName: defaultCountry.name,
      countryFlag: defaultCountry.flag,
      category: 'tech_cyber',
      categoryLabel: 'Cybersecurity & Critical Infrastructure',
      targetSectors: ['Banking', 'Financial Services', 'Cloud & Hyperscalers'] as SectorType[],
      startDate: '2026-01-01',
      transitionStartDate: '2026-06-01',
      deadlineDate: '2026-12-31',
      eventType: 'Enforcement Deadline',
      status: 'Upcoming (2026-2027)',
      urgency: 'High',
      description: '',
      gracePeriodSummary: '',
      penaltiesSummary: '',
      officialReference: '',
      officialUrl: '',
      milestones: [
        { label: 'Statutory Notice Publication', date: '2026-01-01', completed: true },
        { label: 'Mandatory Compliance Audit Due', date: '2026-12-31', completed: false },
      ],
      complianceChecklist: [
        'Complete regulatory self-assessment audit',
        'Submit official compliance certification to portal',
      ],
    };
  });

  const [milestonesText, setMilestonesText] = useState(() => {
    return (formData.milestones || []).map((m) => `${m.date} | ${m.label} | ${m.completed ? 'DONE' : 'PENDING'}`).join('\n');
  });

  const [checklistText, setChecklistText] = useState(() => {
    return (formData.complianceChecklist || []).join('\n');
  });

  const handleCountryChange = (countryId: string) => {
    const c = countries.find((item) => item.id === countryId);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        countryId: c.id,
        countryName: c.name,
        countryFlag: c.flag,
      }));
    }
  };

  const handleCategoryChange = (catId: RegulatoryCategory) => {
    const cat = CATEGORY_OPTIONS.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      category: catId,
      categoryLabel: cat?.label || catId,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse milestones
    const parsedMilestones = milestonesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return {
          date: parts[0] || formData.startDate,
          label: parts[1] || 'Milestone',
          completed: parts[2]?.toUpperCase() === 'DONE',
        };
      });

    // Parse checklist
    const parsedChecklist = checklistText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    onSave({
      ...formData,
      milestones: parsedMilestones,
      complianceChecklist: parsedChecklist,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CalendarClock className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-lg text-white">
              {eventToEdit ? 'Edit Statutory Milestone & Deadline' : 'Create New Statutory Deadline'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Row 1: Country & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Jurisdiction / Country *
              </label>
              <select
                value={formData.countryId}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Regulatory Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as RegulatoryCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Regulation Code & Milestone Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Regulation Code *
              </label>
              <input
                type="text"
                required
                value={formData.regulationCode}
                onChange={(e) => setFormData({ ...formData, regulationCode: e.target.value })}
                placeholder="e.g. SAMA Open Banking, CBB CRA"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Milestone Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Open Banking Payment Initiation Service (PIS) Mandatory Launch"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Authority & Short Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Governing Authority *
              </label>
              <input
                type="text"
                required
                value={formData.authority}
                onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                placeholder="e.g. Saudi Central Bank (SAMA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Authority Acronym
              </label>
              <input
                type="text"
                value={formData.authorityShort}
                onChange={(e) => setFormData({ ...formData, authorityShort: e.target.value })}
                placeholder="e.g. SAMA, CBB, SDAIA"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Row 4: Dates & Timeline Runway */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Publication / Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Transition / Grace Period Start
              </label>
              <input
                type="date"
                value={formData.transitionStartDate || ''}
                onChange={(e) => setFormData({ ...formData, transitionStartDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-emerald-400 font-bold block mb-1">
                Statutory Enforcement Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadlineDate}
                onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                className="w-full bg-slate-900 border border-emerald-500/60 rounded-lg px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 5: Event Type, Urgency, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Event Type
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Enforcement Deadline">Enforcement Deadline</option>
                <option value="Grace Period Expiry">Grace Period Expiry</option>
                <option value="Compliance Audit Window">Compliance Audit Window</option>
                <option value="Major Overhaul">Major Overhaul</option>
                <option value="Statutory Enactment">Statutory Enactment</option>
                <option value="Public Consultation">Public Consultation</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Informational">Informational</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Imminent (<90 Days)">Imminent (&lt;90 Days)</option>
                <option value="Upcoming (2026-2027)">Upcoming (2026-2027)</option>
                <option value="In Consultation">In Consultation</option>
                <option value="Completed / Active">Completed / Active</option>
                <option value="Long-Term Horizon (2027+)">Long-Term Horizon (2027+)</option>
              </select>
            </div>
          </div>

          {/* Description & Impact */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Description &amp; Compliance Requirement Summary
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mandatory statutory requirements, audit scope, and operational impact..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Official Reference & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Official Reference / Circular Number
              </label>
              <input
                type="text"
                value={formData.officialReference}
                onChange={(e) => setFormData({ ...formData, officialReference: e.target.value })}
                placeholder="e.g. SAMA Circular 44100/102, CBB Decree 14/2025"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Official Gazette / Regulatory URL
              </label>
              <input
                type="url"
                value={formData.officialUrl}
                onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Milestones Editor */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Interim Milestones (One per line: Date | Label | DONE or PENDING)
            </label>
            <textarea
              rows={3}
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
              placeholder="2026-03-01 | Gap Analysis Submission | DONE&#10;2026-09-01 | Third-Party Audit Sign-off | PENDING"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Compliance Checklist */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Actionable Compliance Checklist (One item per line)
            </label>
            <textarea
              rows={3}
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
              placeholder="Upload CISO signed risk mitigation plan&#10;Submit API readiness security certificate to national portal"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-lg flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{eventToEdit ? 'Save Changes' : 'Create Statutory Milestone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
