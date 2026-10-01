import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Regulation, RegulatoryCategory, SectorType, AuditFrequency, RegulationNature, ControlDetail } from '../../types/regulatory';
import {
  AUDIT_FREQUENCY_OPTIONS,
  REGULATION_NATURE_OPTIONS,
  getAuditTimelineDefault,
  formatEnactmentPeriod,
} from '../../utils/auditTimelineHelper';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  FileText,
  CheckCircle2,
  Globe2,
  Shield,
  Layers,
  AlertTriangle,
  RotateCcw,
  X,
  Save,
  Link as LinkIcon,
  Check,
  Building,
  Clock,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { PendingChangesDock } from './PendingChangesDock';

const ALL_SECTORS: SectorType[] = [
  'Banking',
  'Financial Services',
  'Insurance',
  'Payments',
  'Fintech',
  'Government',
  'Critical Infrastructure',
  'Utilities',
  'Oil & Gas',
  'Mining & Extraction',
  'Power & Energy',
  'Cloud & Hyperscalers',
  'Telco',
  'Digital Tech Startups',
  'Retail & E-Commerce',
  'Manufacturing',
  'Automotive',
  'Space & Aerospace',
  'Gaming & Entertainment',
  'Healthcare',
];

const CATEGORY_OPTIONS: { id: RegulatoryCategory; label: string }[] = [
  { id: 'tech_cyber', label: 'Cybersecurity Baseline' },
  { id: 'tech_ai', label: 'Artificial Intelligence & Algorithmic Governance' },
  { id: 'tech_data_privacy', label: 'Data Protection & Sovereignty' },
  { id: 'tech_cloud', label: 'Cloud Computing & Hyperscaler Standards' },
  { id: 'tech_operational_resilience', label: 'Operational Resilience & Business Continuity' },
  { id: 'tech_ot_ics', label: 'OT & Critical Infrastructure Cyber (ICS/SCADA)' },
  { id: 'tech_space_quantum', label: 'Space & Post-Quantum Cryptography' },
  { id: 'tech_fintech_payments', label: 'FinTech, Open Banking & Digital Assets' },
  { id: 'tech_risk_others', label: 'Technology Risk(Others)' },
  { id: 'non_tech_impact', label: 'General Corporate Governance' },
];

export const RegulationEditorTab: React.FC = () => {
  const {
    countries,
    regulations,
    addRegulation,
    updateRegulation,
    deleteRegulation,
    updateRegulationLink,
    resetRegulationsToDefault,
    pendingRegulationEdits,
    stageRegulationEdit,
    unstageRegulationEdit,
    discardPendingEdits,
    applyPendingEdits,
    hasPendingEdits,
    totalPendingEditsCount,
  } = useAdmin();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'jurisdiction_category' | 'recent' | 'code'>('jurisdiction_category');

  // Modals state
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [linkEditModal, setLinkEditModal] = useState<{
    id: string;
    code: string;
    name: string;
    officialUrl: string;
    documentPdfUrl?: string;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Quick link update inline states
  const [quickLinkSuccess, setQuickLinkSuccess] = useState<string | null>(null);

  // Effective regulations with any unapplied atomic pending edits merged
  const effectiveRegulations = useMemo(() => {
    return regulations.map((reg) => {
      const pending = pendingRegulationEdits[reg.id];
      if (pending) {
        return { ...reg, ...pending };
      }
      return reg;
    });
  }, [regulations, pendingRegulationEdits]);

  // Filtered and Ordered regulations (ordered by jurisdiction and category by default)
  const filteredRegulations = useMemo(() => {
    const list = effectiveRegulations.filter((reg) => {
      const matchSearch =
        searchTerm === '' ||
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.scopeSummary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCountry = countryFilter === 'all' || reg.countryId.toLowerCase() === countryFilter.toLowerCase();
      const matchCategory = categoryFilter === 'all' || reg.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || reg.status === statusFilter;

      return matchSearch && matchCountry && matchCategory && matchStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'jurisdiction_category') {
        const countryA = countries.find((c) => c.id.toLowerCase() === a.countryId.toLowerCase())?.name || a.countryId;
        const countryB = countries.find((c) => c.id.toLowerCase() === b.countryId.toLowerCase())?.name || b.countryId;
        const cDiff = countryA.localeCompare(countryB);
        if (cDiff !== 0) return cDiff;
        const catDiff = (a.categoryLabel || a.category).localeCompare(b.categoryLabel || b.category);
        if (catDiff !== 0) return catDiff;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'code') {
        return a.code.localeCompare(b.code);
      } else {
        return (b.yearEnacted || 0) - (a.yearEnacted || 0);
      }
    });
  }, [effectiveRegulations, countries, searchTerm, countryFilter, categoryFilter, statusFilter, sortBy]);

  // Handle Quick Link Save
  const handleSaveQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEditModal) return;

    updateRegulationLink(linkEditModal.id, linkEditModal.officialUrl, linkEditModal.documentPdfUrl);
    setQuickLinkSuccess(linkEditModal.id);
    setTimeout(() => setQuickLinkSuccess(null), 3000);
    setLinkEditModal(null);
  };

  // Handle Full Edit Save
  const handleSaveEditRegulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegulation) return;

    const normalizedPeriod = formatEnactmentPeriod(
      editingRegulation.enactmentPeriod,
      editingRegulation.effectiveDate,
      editingRegulation.yearEnacted
    );

    const freq = editingRegulation.auditFrequency || 'Annually';
    const nature = editingRegulation.regulationNature || (editingRegulation.isTech ? 'Tech' : 'Non-Tech');

    // Keep the headline "Total Controls / Articles" count consistent: it should
    // never be smaller than the number of authored sample controls.
    const authoredCount = editingRegulation.sampleControls?.length || 0;
    const existingTotal = editingRegulation.controlStructure?.totalControlsCount ?? 0;
    const reconciledControlStructure = editingRegulation.controlStructure
      ? {
          ...editingRegulation.controlStructure,
          totalControlsCount: Math.max(existingTotal, authoredCount),
        }
      : editingRegulation.controlStructure;

    const updated: Regulation = {
      ...editingRegulation,
      enactmentPeriod: normalizedPeriod,
      auditFrequency: freq,
      auditTimeline: editingRegulation.auditTimeline || getAuditTimelineDefault(freq),
      regulationNature: nature,
      isTech: nature === 'Tech' || nature === 'Hybrid',
      controlStructure: reconciledControlStructure,
    };

    updateRegulation(editingRegulation.id, updated);
    setEditingRegulation(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Regulatory Database Management & Live Editor</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {regulations.length} Statutory Instruments
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Update statutory documentation links, edit enforcement criteria, add jurisdiction-specific
            regulations, or remove obsolete frameworks. Changes reflect instantly across all platform views.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Regulation</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all regulations back to the official statutory baseline? Custom changes will be cleared.')) {
                resetRegulationsToDefault();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset to official statutory baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Pending Staged Changes Alert Banner */}
      {hasPendingEdits && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Unsaved Regulatory Changes Staged
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/40">
                  {totalPendingEditsCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Regulatory status changes or timeline deadline edits are staged. Review below and click "Apply Changes" to persist them atomically to the database.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={discardPendingEdits}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            >
              Discard All
            </button>
            <button
              type="button"
              onClick={applyPendingEdits}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Changes ({totalPendingEditsCount})</span>
            </button>
          </div>
        </div>
      )}

      {quickLinkSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Statutory documentation link successfully updated and published to registry!</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search regulation name, code, authority, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Country Selector */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Jurisdictions ({countries.length})</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name} ({c.totalRegulationsCount || 0})
              </option>
            ))}
          </select>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[180px] truncate"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Enacted">Enacted</option>
            <option value="Amended">Amended</option>
            <option value="Draft / Public Consultation">Draft / Consultation</option>
          </select>

          {/* Order / Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500 font-semibold"
            title="Sort and order regulations"
          >
            <option value="jurisdiction_category">Order: Jurisdiction & Category</option>
            <option value="recent">Order: Newest Enactment</option>
            <option value="code">Order: Code / Citation</option>
          </select>
        </div>
      </div>

      {/* Regulations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="table-scroll-x">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-32 shrink-0 whitespace-nowrap">Jurisdiction &amp; Code</th>
                <th className="py-3 px-4 min-w-[280px]">Statutory Regulation Name</th>
                <th className="py-3 px-4 w-48 shrink-0">Authority &amp; Nature</th>
                <th className="py-3 px-4 w-44 shrink-0 whitespace-nowrap">Enactment &amp; Assessment</th>
                <th className="py-3 px-4 w-36 shrink-0 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 w-28 shrink-0 whitespace-nowrap text-center">Official Links</th>
                <th className="py-3 px-4 w-24 shrink-0 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRegulations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No regulations matched your search filters.
                  </td>
                </tr>
              ) : (
                filteredRegulations.map((reg) => {
                  const country = countries.find(
                    (c) => c.id.toLowerCase() === reg.countryId.toLowerCase()
                  );
                  const nature = reg.regulationNature || (reg.isTech ? 'Tech' : 'Non-Tech');
                  const enactmentStr = formatEnactmentPeriod(reg.enactmentPeriod, reg.effectiveDate, reg.yearEnacted);
                  const reviewFreq = reg.auditFrequency || 'Annually';
                  const timelineStr = reg.auditTimeline || getAuditTimelineDefault(reviewFreq);
                  const isPending = Boolean(pendingRegulationEdits[reg.id]);

                  return (
                    <tr
                      key={reg.id}
                      className={`transition-colors ${
                        isPending
                          ? 'bg-amber-950/20 border-l-2 border-l-amber-500 hover:bg-amber-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Jurisdiction & Code */}
                      <td className="py-3.5 px-4 w-32 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-base shrink-0">{country?.flag || '🌐'}</span>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-white block truncate">
                              {reg.code}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {country?.name || reg.countryId.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Regulation Name */}
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="font-semibold text-white" title={reg.name}>
                          {reg.name}
                        </div>
                        {reg.arabicName && (
                          <div
                            className="text-[10px] text-slate-400 font-arabic truncate mt-0.5"
                            dir="rtl"
                          >
                            {reg.arabicName}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {reg.scopeSummary}
                        </p>
                      </td>

                      {/* Authority & Nature */}
                      <td className="py-3.5 px-4 w-48">
                        <span className="font-medium text-slate-200 block truncate max-w-[170px]">
                          {reg.authority}
                        </span>
                        <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-1">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              nature === 'Tech'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : nature === 'Hybrid'
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {nature}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 truncate max-w-[120px]">
                            {reg.categoryLabel}
                          </span>
                        </div>
                      </td>

                      {/* Enactment Period & Assessment Frequency / Timeline */}
                      <td className="py-3.5 px-4 w-44 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-200">
                            <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="font-mono font-bold text-cyan-300">{enactmentStr}</span>
                            <span className="text-[10px] text-slate-500 font-normal">(Enactment)</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-300">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-semibold text-amber-300">{reviewFreq}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]" title={timelineStr}>
                            {timelineStr}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 w-36 whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            value={reg.status}
                            onChange={(e) =>
                              stageRegulationEdit(reg.id, { status: e.target.value as any })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border focus:outline-none ${
                              reg.status === 'Enacted'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : reg.status === 'Amended'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                            }`}
                            title="Click to stage regulatory status change"
                          >
                            <option value="Enacted" className="bg-slate-900 text-emerald-400">Enacted</option>
                            <option value="Amended" className="bg-slate-900 text-amber-400">Amended</option>
                            <option value="Draft / Public Consultation" className="bg-slate-900 text-sky-400">Draft / Public Consultation</option>
                          </select>
                          {isPending && (
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] px-1 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                ⚡ Staged
                              </span>
                              <button
                                type="button"
                                onClick={() => unstageRegulationEdit(reg.id)}
                                className="text-[9px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                              >
                                Revert
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Official Links */}
                      <td className="py-3.5 px-4 w-28 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {reg.officialUrl ? (
                            <a
                              href={reg.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                              title={`Official Portal: ${reg.officialUrl}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No link</span>
                          )}

                          {reg.documentPdfUrl && (
                            <a
                              href={reg.documentPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition-colors"
                              title={`PDF Document: ${reg.documentPdfUrl}`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() =>
                              setLinkEditModal({
                                id: reg.id,
                                code: reg.code,
                                name: reg.name,
                                officialUrl: reg.officialUrl || '',
                                documentPdfUrl: reg.documentPdfUrl || '',
                              })
                            }
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit Official Portal / Document Links"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 w-24 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setEditingRegulation({ ...reg })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Regulation Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(reg.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Remove Regulation"
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

      {/* QUICK LINK EDIT MODAL */}
      {linkEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Update Official Statutory Links</h4>
              </div>
              <button
                onClick={() => setLinkEditModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickLink} className="mt-4 space-y-4">
              <div>
                <span className="text-[11px] text-slate-400">Target Regulation</span>
                <p className="text-xs font-bold text-emerald-400">
                  {linkEditModal.code} - {linkEditModal.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Regulatory Portal URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://authority.gov.sa/regulations/..."
                  value={linkEditModal.officialUrl}
                  onChange={(e) =>
                    setLinkEditModal({ ...linkEditModal, officialUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official PDF / Gazetted Document URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://authority.gov.sa/files/regulation.pdf"
                  value={linkEditModal.documentPdfUrl}
                  onChange={(e) =>
                    setLinkEditModal({ ...linkEditModal, documentPdfUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLinkEditModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Publish Links</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL REGULATION EDIT MODAL */}
      {editingRegulation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  Edit Regulation: {editingRegulation.code}
                </h4>
              </div>
              <button
                onClick={() => setEditingRegulation(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRegulation} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Name *</label>
                  <input
                    type="text"
                    required
                    value={editingRegulation.name}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Arabic / Native Script Name
                  </label>
                  <input
                    type="text"
                    value={editingRegulation.arabicName || ''}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, arabicName: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Code / Citation *</label>
                  <input
                    type="text"
                    required
                    value={editingRegulation.code}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, code: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Regulatory Authority *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRegulation.authority}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, authority: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={editingRegulation.category}
                    onChange={(e) => {
                      const sel = CATEGORY_OPTIONS.find((c) => c.id === e.target.value);
                      setEditingRegulation({
                        ...editingRegulation,
                        category: e.target.value as RegulatoryCategory,
                        categoryLabel: sel?.label || 'Statutory Framework',
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status *</label>
                  <select
                    value={editingRegulation.status}
                    onChange={(e) =>
                      setEditingRegulation({
                        ...editingRegulation,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Enacted">Enacted</option>
                    <option value="Amended">Amended</option>
                    <option value="Draft / Public Consultation">Draft / Public Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Regulation Nature *
                  </label>
                  <select
                    value={editingRegulation.regulationNature || (editingRegulation.isTech ? 'Tech' : 'Non-Tech')}
                    onChange={(e) => {
                      const nat = e.target.value as RegulationNature;
                      setEditingRegulation({
                        ...editingRegulation,
                        regulationNature: nat,
                        isTech: nat === 'Tech' || nat === 'Hybrid',
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {REGULATION_NATURE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Enactment Period (mm/yyyy) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YYYY (e.g. 09/2024)"
                    value={editingRegulation.enactmentPeriod || formatEnactmentPeriod(undefined, editingRegulation.effectiveDate, editingRegulation.yearEnacted)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.split('/');
                      const year = parts.length === 2 && !isNaN(Number(parts[1])) ? Number(parts[1]) : editingRegulation.yearEnacted;
                      setEditingRegulation({
                        ...editingRegulation,
                        enactmentPeriod: val,
                        yearEnacted: year,
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Format: Month/Year (e.g. 09/2024)</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Period of Assessment / Review *
                  </label>
                  <select
                    value={editingRegulation.auditFrequency || 'Annually'}
                    onChange={(e) => {
                      const newFreq = e.target.value as AuditFrequency;
                      setEditingRegulation({
                        ...editingRegulation,
                        auditFrequency: newFreq,
                        auditTimeline: getAuditTimelineDefault(newFreq),
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {AUDIT_FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Audit Timeline & Attestation Window *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRegulation.auditTimeline || getAuditTimelineDefault(editingRegulation.auditFrequency)}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, auditTimeline: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. Annual Audit Cycle (Q4 Mandatory Statutory Attestation)"
                  />
                  <span className="text-[10px] text-slate-500">Auto-filled based on assessment frequency; customizable</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Scope & Executive Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingRegulation.scopeSummary}
                  onChange={(e) =>
                    setEditingRegulation({ ...editingRegulation, scopeSummary: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Portal URL</label>
                  <input
                    type="url"
                    value={editingRegulation.officialUrl}
                    onChange={(e) =>
                      setEditingRegulation({ ...editingRegulation, officialUrl: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Document PDF URL
                  </label>
                  <input
                    type="url"
                    value={editingRegulation.documentPdfUrl || ''}
                    onChange={(e) =>
                      setEditingRegulation({
                        ...editingRegulation,
                        documentPdfUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Target Sectors Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Target Mandated Sectors ({editingRegulation.targetSectors.length} Selected)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {ALL_SECTORS.map((sector) => {
                    const isSelected = editingRegulation.targetSectors.includes(sector);
                    return (
                      <button
                        type="button"
                        key={sector}
                        onClick={() => {
                          const updated = isSelected
                            ? editingRegulation.targetSectors.filter((s) => s !== sector)
                            : [...editingRegulation.targetSectors, sector];
                          setEditingRegulation({ ...editingRegulation, targetSectors: updated });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================
                  MANAGE CONTROLS — add / edit / remove the granular controls
                  (with NIST CSF / ISO 27001 / CSA CCM crosswalk mappings) that
                  render on the public regulation card. Persisted via
                  updateRegulation, exactly like the fields above.
                  ============================================================ */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block font-semibold text-slate-200">
                      Granular Controls &amp; Global Mappings
                      <span className="ml-2 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700/50">
                        {(editingRegulation.sampleControls?.length || 0)} authored
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      These are the fully-mapped sample controls shown on the regulation card. Total control count is {editingRegulation.controlStructure?.totalControlsCount ?? 0}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const existing = editingRegulation.sampleControls || [];
                      const seq = existing.length + 1;
                      const newControl: ControlDetail = {
                        id: `ctrl-${editingRegulation.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        code: '',
                        domainNumber: String(seq),
                        domainName: 'General',
                        subDomainName: '',
                        title: '',
                        description: '',
                        clauseReference: '',
                        mandatoryLevel: 'Mandatory',
                        applicableSectors: [],
                        mapping: { nistCsf: '', iso27001: '', csaCcm: '' },
                      };
                      setEditingRegulation({
                        ...editingRegulation,
                        sampleControls: [...existing, newControl],
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Control</span>
                  </button>
                </div>

                {(!editingRegulation.sampleControls || editingRegulation.sampleControls.length === 0) ? (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
                    No granular controls authored yet. Click "Add Control" to create the first fully-mapped control.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
                    {editingRegulation.sampleControls.map((ctrl, idx) => {
                      const updateCtrl = (changes: Partial<ControlDetail>) => {
                        const next = (editingRegulation.sampleControls || []).map((c, i) =>
                          i === idx ? { ...c, ...changes } : c
                        );
                        setEditingRegulation({ ...editingRegulation, sampleControls: next });
                      };
                      const updateMapping = (changes: Partial<ControlDetail['mapping']>) => {
                        updateCtrl({ mapping: { ...ctrl.mapping, ...changes } });
                      };
                      const removeCtrl = () => {
                        const next = (editingRegulation.sampleControls || []).filter((_, i) => i !== idx);
                        setEditingRegulation({ ...editingRegulation, sampleControls: next });
                      };
                      return (
                        <div key={ctrl.id} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500">Control #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={removeCtrl}
                              title="Remove this control"
                              className="p-1 rounded text-slate-500 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Control Code</label>
                              <input
                                type="text"
                                value={ctrl.code}
                                onChange={(e) => updateCtrl({ code: e.target.value })}
                                placeholder="e.g. ECC-2-1-3"
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Clause Reference</label>
                              <input
                                type="text"
                                value={ctrl.clauseReference}
                                onChange={(e) => updateCtrl({ clauseReference: e.target.value })}
                                placeholder="e.g. Article 29(2)"
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Mandatory Level</label>
                              <select
                                value={ctrl.mandatoryLevel}
                                onChange={(e) => updateCtrl({ mandatoryLevel: e.target.value as ControlDetail['mandatoryLevel'] })}
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                              >
                                <option value="Mandatory">Mandatory</option>
                                <option value="Recommended">Recommended</option>
                                <option value="Conditional">Conditional</option>
                                <option value="Guideline">Guideline</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Title</label>
                            <input
                              type="text"
                              value={ctrl.title}
                              onChange={(e) => updateCtrl({ title: e.target.value })}
                              placeholder="Short control title"
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Verbatim Description</label>
                            <textarea
                              rows={2}
                              value={ctrl.description}
                              onChange={(e) => updateCtrl({ description: e.target.value })}
                              placeholder="Full text of the control / sub-control requirement"
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-slate-800/70">
                            <div>
                              <label className="block text-[10px] font-semibold text-blue-300 mb-0.5">NIST CSF Mapping</label>
                              <input
                                type="text"
                                value={ctrl.mapping.nistCsf || ''}
                                onChange={(e) => updateMapping({ nistCsf: e.target.value })}
                                placeholder="e.g. PR.AC-01, GV.OC-01"
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-blue-500/30 text-blue-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-purple-300 mb-0.5">ISO 27001 Mapping</label>
                              <input
                                type="text"
                                value={ctrl.mapping.iso27001 || ''}
                                onChange={(e) => updateMapping({ iso27001: e.target.value })}
                                placeholder="e.g. A.5.15, A.8.20"
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-purple-500/30 text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-cyan-300 mb-0.5">CSA CCM Mapping</label>
                              <input
                                type="text"
                                value={ctrl.mapping.csaCcm || ''}
                                onChange={(e) => updateMapping({ csaCcm: e.target.value })}
                                placeholder="e.g. IAM-02, CRY-01"
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRegulation(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Regulation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW REGULATION MODAL */}
      {isAddModalOpen && (
        <AddNewRegulationModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(newReg) => {
            addRegulation(newReg);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-rose-500/40 rounded-xl max-w-sm w-full p-5 text-white shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-400 pb-2 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Confirm Regulation Deletion</h4>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Are you sure you want to remove this statutory instrument? This action will remove it
              from the registry, crosswalk, and compliance reports.
            </p>
            <div className="flex items-center justify-end space-x-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteRegulation(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Staged Pending Changes Dock */}
      <PendingChangesDock viewContext="admin" />
    </div>
  );
};

// Add New Regulation Sub-Component Modal
interface AddNewModalProps {
  onClose: () => void;
  onAdd: (newReg: Omit<Regulation, 'id'> & { id?: string }) => void;
}

const AddNewRegulationModal: React.FC<AddNewModalProps> = ({ onClose, onAdd }) => {
  const { countries } = useAdmin();
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [code, setCode] = useState('');
  const [authority, setAuthority] = useState('');
  const [countryId, setCountryId] = useState(countries[0]?.id || 'ksa');
  const [category, setCategory] = useState<RegulatoryCategory>('tech_cyber');
  const [regulationNature, setRegulationNature] = useState<RegulationNature>('Tech');
  const [status, setStatus] = useState<'Enacted' | 'Amended' | 'Draft / Public Consultation'>('Enacted');
  const [yearEnacted, setYearEnacted] = useState(2026);
  const [enactmentPeriod, setEnactmentPeriod] = useState('09/2026');
  const [auditFrequency, setAuditFrequency] = useState<AuditFrequency>('Annually');
  const [auditTimeline, setAuditTimeline] = useState(getAuditTimelineDefault('Annually'));
  const [scopeSummary, setScopeSummary] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [documentPdfUrl, setDocumentPdfUrl] = useState('');
  const [targetSectors, setTargetSectors] = useState<SectorType[]>([
    'Banking',
    'Critical Infrastructure',
    'Government',
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selCat = CATEGORY_OPTIONS.find((c) => c.id === category);
    const normalizedPeriod = formatEnactmentPeriod(enactmentPeriod, `${yearEnacted}-01-01`, yearEnacted);

    const newRegulation: Omit<Regulation, 'id'> = {
      name,
      arabicName: arabicName || undefined,
      code,
      authority,
      authorityShort: authority.split(' ')[0] || 'REG',
      countryId,
      category,
      categoryLabel: selCat?.label || 'Cybersecurity Baseline',
      isTech: regulationNature === 'Tech' || regulationNature === 'Hybrid',
      regulationNature,
      status,
      yearEnacted: Number(yearEnacted) || 2026,
      enactmentPeriod: normalizedPeriod,
      effectiveDate: `${yearEnacted}-01-01`,
      auditFrequency,
      auditTimeline: auditTimeline || getAuditTimelineDefault(auditFrequency),
      lastUpdated: new Date().toISOString().split('T')[0],
      scopeSummary,
      officialUrl,
      documentPdfUrl: documentPdfUrl || undefined,
      targetSectors,
      controlStructure: {
        domainsCount: 4,
        subDomainsCount: 16,
        totalControlsCount: 48,
        domainList: ['Governance & Strategy', 'Technical Protection', 'Operations', 'Assurance'],
      },
      sampleControls: [],
    };

    onAdd(newRegulation);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Add New Statutory Regulation</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Jurisdiction *</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Code / Citation *</label>
              <input
                type="text"
                required
                placeholder="e.g. SAMA-BCM-2026, NCA-CCC-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Regulation Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Post-Quantum Cryptography Migration Standard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Arabic / Native Script Name
              </label>
              <input
                type="text"
                placeholder="e.g. الإطار التنظيمي للأمن السيبراني..."
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Issuing Authority *</label>
              <input
                type="text"
                required
                placeholder="e.g. National Cybersecurity Authority (NCA)"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RegulatoryCategory)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Enacted">Enacted</option>
                <option value="Amended">Amended</option>
                <option value="Draft / Public Consultation">Draft / Public Consultation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Regulation Nature *</label>
              <select
                value={regulationNature}
                onChange={(e) => setRegulationNature(e.target.value as RegulationNature)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                {REGULATION_NATURE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Enactment Period (mm/yyyy) *</label>
              <input
                type="text"
                required
                placeholder="MM/YYYY e.g. 09/2026"
                value={enactmentPeriod}
                onChange={(e) => {
                  const val = e.target.value;
                  setEnactmentPeriod(val);
                  const parts = val.split('/');
                  if (parts.length === 2 && !isNaN(Number(parts[1]))) {
                    setYearEnacted(Number(parts[1]));
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500">Format: Month/Year (e.g. 09/2026)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Period of Assessment / Review *</label>
              <select
                value={auditFrequency}
                onChange={(e) => {
                  const freq = e.target.value as AuditFrequency;
                  setAuditFrequency(freq);
                  setAuditTimeline(getAuditTimelineDefault(freq));
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                {AUDIT_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Audit Timeline & Attestation Window *</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Audit Cycle (Q4 Mandatory Statutory Attestation)"
                value={auditTimeline}
                onChange={(e) => setAuditTimeline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500">Auto-filled based on assessment frequency; customizable</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Scope & Executive Summary *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Outline statutory scope, target entities, and core compliance mandates..."
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Portal URL *</label>
              <input
                type="url"
                required
                placeholder="https://authority.gov/..."
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Document PDF URL</label>
              <input
                type="url"
                placeholder="https://authority.gov/file.pdf"
                value={documentPdfUrl}
                onChange={(e) => setDocumentPdfUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Applicable Sectors ({targetSectors.length} Selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800">
              {ALL_SECTORS.map((sector) => {
                const isSelected = targetSectors.includes(sector);
                return (
                  <button
                    type="button"
                    key={sector}
                    onClick={() => {
                      const updated = isSelected
                        ? targetSectors.filter((s) => s !== sector)
                        : [...targetSectors, sector];
                      setTargetSectors(updated);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish to Registry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
