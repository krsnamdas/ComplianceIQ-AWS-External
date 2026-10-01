import React, { useState, useMemo } from 'react';
import { Regulation } from '../types/regulatory';
import { useAdmin } from '../context/AdminContext';
import {
  computeRegulationOverlap,
  POPULAR_COMPARISON_PRESETS,
  ComparisonPreset,
} from '../utils/regulationComparison';
import {
  Scale,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Clock,
  FileCheck,
  ShieldAlert,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Globe2,
  ListFilter,
  Check,
  Building,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface RegulationComparatorProps {
  initialRegAId?: string;
  initialRegBId?: string;
  onNavigateToRegistry?: (searchQuery?: string) => void;
}

export const RegulationComparator: React.FC<RegulationComparatorProps> = ({
  initialRegAId,
  initialRegBId,
  onNavigateToRegistry,
}) => {
  const { regulations, countries } = useAdmin();

  // Find defaults
  const defaultAId = initialRegAId || (regulations.length > 0 ? regulations[0].id : 'ksa-ecc-1');
  const defaultBId =
    initialRegBId ||
    (regulations.length > 1
      ? regulations[1].id
      : regulations.length > 0
      ? regulations[0].id
      : 'uae-nesa-ias');

  const [selectedAId, setSelectedAId] = useState<string>(defaultAId);
  const [selectedBId, setSelectedBId] = useState<string>(defaultBId);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'controls' | 'ai_memo'>('overview');
  const [aiMemo, setAiMemo] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Resolved Regulation objects
  const regulationA = useMemo(() => {
    return (
      regulations.find((r) => r.id === selectedAId) ||
      regulations.find((r) => r.code === selectedAId) ||
      regulations[0]
    );
  }, [regulations, selectedAId]);

  const regulationB = useMemo(() => {
    return (
      regulations.find((r) => r.id === selectedBId) ||
      regulations.find((r) => r.code === selectedBId) ||
      regulations[1] ||
      regulations[0]
    );
  }, [regulations, selectedBId]);

  // Country details lookup
  const countryA = useMemo(() => {
    return countries.find((c) => c.id.toLowerCase() === regulationA?.countryId.toLowerCase());
  }, [countries, regulationA]);

  const countryB = useMemo(() => {
    return countries.find((c) => c.id.toLowerCase() === regulationB?.countryId.toLowerCase());
  }, [countries, regulationB]);

  // Execute comparison computation
  const comparison = useMemo(() => {
    if (!regulationA || !regulationB) return null;
    return computeRegulationOverlap(regulationA, regulationB);
  }, [regulationA, regulationB]);

  // Swap Regulation A and B
  const handleSwap = () => {
    const temp = selectedAId;
    setSelectedAId(selectedBId);
    setSelectedBId(temp);
    setAiMemo(null);
  };

  // Apply a preset
  const handleApplyPreset = (preset: ComparisonPreset) => {
    setSelectedAId(preset.regAId);
    setSelectedBId(preset.regBId);
    setAiMemo(null);
  };

  // Trigger AI deep statutory synthesis
  const handleGenerateAIMemo = async () => {
    if (!regulationA || !regulationB || !comparison) return;
    setIsAiLoading(true);
    setActiveTab('ai_memo');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'Principal Regulatory Compliance Architect',
          messages: [
            {
              role: 'user',
              content: `Conduct a rigorous statutory comparison and audit Level of Effort (LOE) assessment memo between these two MENAT regulatory frameworks:
1. Baseline Regulation (Audit Previously Conducted): [${regulationA.code}] ${regulationA.name} (${regulationA.authorityShort}, ${countryA?.name || regulationA.countryId.toUpperCase()}). Category: ${regulationA.categoryLabel}.
2. Target Regulation (New Assessment Required): [${regulationB.code}] ${regulationB.name} (${regulationB.authorityShort}, ${countryB?.name || regulationB.countryId.toUpperCase()}). Category: ${regulationB.categoryLabel}.
Calculated Overlap: ~${comparison.overlapPercentage}%. Is Unrelated: ${comparison.isUnrelated}.

Provide:
1. Executive Harmonization Overview & Overlap Rationale
2. Evidence Carryover: Top 5 audit workpapers that can be directly reused
3. Jurisdiction-Specific Gotchas: Statutory nuances, sovereign data residency, or regulator reporting windows unique to ${regulationB.code}
4. Actionable 3-Phase Assessment Sequencing Plan
Format as an executive advisory briefing in clean Markdown.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate comparison analysis');
      }

      const data = await response.json();
      setAiMemo(data.text || 'Unable to generate synthesis text.');
    } catch (err) {
      // Fallback structured memo
      setAiMemo(`### Executive Comparative Advisory Memo: ${regulationA.code} vs. ${regulationB.code}

#### 1. Strategic Overlap & Harmonization Overview
Comparing **${regulationA.name}** (${countryA?.name || regulationA.countryId}) with **${regulationB.name}** (${countryB?.name || regulationB.countryId}):
${
  comparison.isUnrelated
    ? `**Critical Divergence Warning**: These two frameworks govern fundamentally distinct statutory categories (${regulationA.categoryLabel} vs. ${regulationB.categoryLabel}). Evidence collected for ${regulationA.code} provides negligible compliance value for ${regulationB.code}. A comprehensive de novo gap assessment must be initiated.`
    : `Both frameworks share common foundational control objectives derived from global benchmarks (ISO/IEC 27001 and NIST CSF). The calculated rough order of magnitude overlap of **${comparison.overlapPercentage}%** indicates high audit acceleration potential.`
}

#### 2. Reusable Audit Evidence & Workpapers
- **Corporate Governance & CISO Charter**: Formal executive security steering and risk appetite statements.
- **Identity & Access Management (IAM)**: Centralized Active Directory/IdP architecture, MFA enforcement logs, and privileged access review sign-offs.
- **Incident Response Runbooks**: Formal breach notification playbooks, tabletop exercise minutes, and SOC escalation matrix.
- **Disaster Recovery & Backup Validations**: Immutable backup logs, RTO/RPO verification tests, and annual failover drills.

#### 3. Sovereign Delta Requirements for ${regulationB.code}
- **In-Country Telemetry & Data Residency**: Ensure logs and sensitive workload telemetry remain within ${countryB?.name || 'the local sovereign boundary'}.
- **Statutory Incident SLA**: Verify breach notification conforms to ${regulationB.authorityShort}'s mandatory reporting deadline.
- **Regulator-Specific Gazetted Forms**: Submission must utilize local filing templates.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export comparison to CSV
  const handleExportCSV = () => {
    if (!comparison || !regulationA || !regulationB) return;

    const rows = [
      ['Metric', 'Value'],
      ['Baseline Regulation (Reg A)', `${regulationA.code} - ${regulationA.name}`],
      ['Baseline Jurisdiction', countryA?.name || regulationA.countryId],
      ['Target Regulation (Reg B)', `${regulationB.code} - ${regulationB.name}`],
      ['Target Jurisdiction', countryB?.name || regulationB.countryId],
      ['Estimated Overlap Percentage', `${comparison.overlapPercentage}%`],
      ['Harmonization Tier', comparison.harmonizationTier],
      ['Is Unrelated Domains', comparison.isUnrelated ? 'YES (Divergent Mandates)' : 'NO (Harmonized)'],
      ['Level of Effort (LOE) Tier', comparison.levelOfEffort.tier],
      ['Estimated New Work Delta', `${comparison.levelOfEffort.estimatedPercentageNewWork}%`],
      ['Estimated Timeline Duration', comparison.levelOfEffort.estimatedWeeks],
      ['Audit Timeline Reduction', `${comparison.levelOfEffort.timelineReductionPercentage}% Savings`],
      ['Total Controls Reg A', String(comparison.controlsCount.totalA)],
      ['Total Controls Reg B', String(comparison.controlsCount.totalB)],
      ['Equivalent Controls Count', String(comparison.controlsCount.equivalentCount)],
      ['Partially Overlapping Controls', String(comparison.controlsCount.partialCount)],
      ['Unique Controls in Reg B', String(comparison.controlsCount.uniqueToBCount)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Comparison_${regulationA.code}_vs_${regulationB.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!regulationA || !regulationB || !comparison) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
        <p>Please ensure at least two regulations exist in the regulatory registry to run comparisons.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Cross-Regulation Overlap &amp; Assessment LOE Comparator</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold uppercase">
                    Decision Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Benchmark any two statutory instruments to estimate rough order of magnitude overlap, identify reusable audit evidence, and determine the exact Level of Effort (LOE) required.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleGenerateAIMemo}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Executive Synthesis</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Export comparison metrics to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Analysis</span>
            </button>
          </div>
        </div>

        {/* Preset Quick-Pill Selectors */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">Popular Cross-Border Benchmarks &amp; Divergence Presets:</span>
          </div>
          <div className="flex overflow-x-auto pb-1 space-x-2 scrollbar-thin">
            {POPULAR_COMPARISON_PRESETS.map((preset) => {
              const isActive = selectedAId === preset.regAId && selectedBId === preset.regBId;
              const isUnrelatedPreset = preset.scenarioType === 'unrelated';
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-950/80 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={preset.description}
                >
                  <span className="font-semibold text-slate-200">{preset.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isUnrelatedPreset
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DUAL REGULATION SELECTION COMMAND CONSOLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* REGULATION A: BASELINE (AUDIT ALREADY CONDUCTED) */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                1. Baseline Regulation (Prior Audit Completed)
              </span>
              <span className="text-xs">{countryA?.flag || '🌐'}</span>
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Framework You Have Already Assessed:
            </label>
            <select
              value={selectedAId}
              onChange={(e) => {
                setSelectedAId(e.target.value);
                setAiMemo(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {regulations.map((reg) => {
                const c = countries.find((item) => item.id.toLowerCase() === reg.countryId.toLowerCase());
                return (
                  <option key={`a-${reg.id}`} value={reg.id}>
                    {c?.flag || '🌐'} [{reg.code}] {reg.name} ({reg.authorityShort})
                  </option>
                );
              })}
            </select>

            {/* Selected A Snapshot */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
              <div>
                <span className="text-white font-semibold block">{regulationA.authority}</span>
                <span className="text-[11px] text-slate-400">{regulationA.categoryLabel}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-emerald-400 font-bold block">{regulationA.controlStructure?.totalControlsCount || 80}</span>
                <span className="text-[10px] text-slate-500 uppercase">Controls</span>
              </div>
            </div>
          </div>

          {/* SWAP CONTROLLER */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-2">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-slate-200 transition-transform active:scale-95 shadow-md cursor-pointer group"
              title="Swap Baseline and Target Regulations"
            >
              <ArrowRightLeft className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
            </button>
            <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">Swap Order</span>
          </div>

          {/* REGULATION B: TARGET (SCOPE EXPANSION) */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                2. Target Regulation (New Assessment Scope)
              </span>
              <span className="text-xs">{countryB?.flag || '🌐'}</span>
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Framework You Need to Assess Now:
            </label>
            <select
              value={selectedBId}
              onChange={(e) => {
                setSelectedBId(e.target.value);
                setAiMemo(null);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              {regulations.map((reg) => {
                const c = countries.find((item) => item.id.toLowerCase() === reg.countryId.toLowerCase());
                return (
                  <option key={`b-${reg.id}`} value={reg.id}>
                    {c?.flag || '🌐'} [{reg.code}] {reg.name} ({reg.authorityShort})
                  </option>
                );
              })}
            </select>

            {/* Selected B Snapshot */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
              <div>
                <span className="text-white font-semibold block">{regulationB.authority}</span>
                <span className="text-[11px] text-slate-400">{regulationB.categoryLabel}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-cyan-400 font-bold block">{regulationB.controlStructure?.totalControlsCount || 80}</span>
                <span className="text-[10px] text-slate-500 uppercase">Controls</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIVERGENT DOMAINS WARNING BANNER (When regulations are unrelated) */}
      {comparison.isUnrelated && (
        <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-xl p-5 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-rose-200 tracking-tight">
                  Statutory Domain Divergence Detected — Full De Novo Assessment Mandated
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Overlap &lt; 15%
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
                {comparison.unrelatedReason}
              </p>
              <div className="mt-3.5 pt-3 border-t border-rose-500/30 flex flex-wrap items-center gap-4 text-xs text-rose-300">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white">Baseline Mandate:</span>
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-rose-500/30">{regulationA.categoryLabel}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white">Target Mandate:</span>
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-rose-500/30">{regulationB.categoryLabel}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white">Effort Carryover:</span>
                  <span className="text-rose-400 font-bold">0% Direct Control Credit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIGH-LEVEL EXECUTIVE METRIC TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overlap Percentage */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overlap Index
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
                comparison.overlapPercentage >= 75
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : comparison.overlapPercentage >= 45
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : comparison.overlapPercentage >= 20
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {comparison.harmonizationTier}
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                comparison.overlapPercentage >= 75
                  ? 'text-emerald-400'
                  : comparison.overlapPercentage >= 45
                  ? 'text-cyan-400'
                  : comparison.overlapPercentage >= 20
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              ~{comparison.overlapPercentage}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Rough Order of Magnitude</span>
          </div>

          {/* Mini Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                comparison.overlapPercentage >= 75
                  ? 'bg-emerald-500'
                  : comparison.overlapPercentage >= 45
                  ? 'bg-cyan-500'
                  : comparison.overlapPercentage >= 20
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${comparison.overlapPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {comparison.isUnrelated
              ? 'Negligible statutory overlap. Disjoint legal obligations.'
              : `${comparison.overlapPercentage}% of requirements share common control objectives.`}
          </p>
        </div>

        {/* Metric 2: Level of Effort Needed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assessment LOE
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-3">
            <span
              className={`text-lg font-bold block ${
                comparison.levelOfEffort.tier.includes('Low')
                  ? 'text-emerald-400'
                  : comparison.levelOfEffort.tier.includes('Moderate')
                  ? 'text-cyan-400'
                  : comparison.levelOfEffort.tier.includes('High')
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {comparison.levelOfEffort.tier}
            </span>
            <span className="text-xs text-slate-300 font-mono mt-0.5 block">
              ~{comparison.levelOfEffort.estimatedPercentageNewWork}% Net-New Work Required
            </span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            <span>Estimated Duration: </span>
            <span className="text-white font-semibold">{comparison.levelOfEffort.estimatedWeeks}</span>
          </div>
        </div>

        {/* Metric 3: Audit Timeline Reduction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Timeline Acceleration
            </span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {comparison.levelOfEffort.timelineReductionPercentage > 0
                ? `-${comparison.levelOfEffort.timelineReductionPercentage}%`
                : '0%'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Cycle Reduction</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            {comparison.levelOfEffort.timelineReductionPercentage > 0
              ? `Reusing ${regulationA.code} audit artifacts saves ~${comparison.levelOfEffort.timelineReductionPercentage}% of standard review time.`
              : 'No acceleration possible due to divergent statutory domains.'}
          </p>
        </div>

        {/* Metric 4: Shared Controls Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Requirements Count
            </span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {comparison.controlsCount.equivalentCount}
            </span>
            <span className="text-xs text-slate-400">/ {comparison.controlsCount.totalB} Target Controls</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            <span className="text-emerald-400 font-semibold">{comparison.controlsCount.equivalentCount} Fully Similar</span>
            {' • '}
            <span className="text-amber-400 font-semibold">{comparison.controlsCount.partialCount} Partial</span>
            {' • '}
            <span className="text-rose-400 font-semibold">{comparison.controlsCount.uniqueToBCount} Unique</span>
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS FOR COMPARATIVE DETAILS */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-indigo-300 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Executive Overview &amp; Evidence Reuse</span>
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'controls'
              ? 'bg-slate-800 text-indigo-300 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Control-by-Control Mapping &amp; Similarity ({comparison.sampleControlMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'domains'
              ? 'bg-slate-800 text-indigo-300 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Domain Breakdown ({comparison.domainBreakdown.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ai_memo');
            if (!aiMemo) handleGenerateAIMemo();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'ai_memo'
              ? 'bg-slate-800 text-purple-300 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Advisory Memo</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW & EVIDENCE REUSE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Controls Distribution Visual Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Target Requirements Harmonization Spectrum ({comparison.controlsCount.totalB} Total Requirements in {regulationB.code})</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round((comparison.controlsCount.equivalentCount / comparison.controlsCount.totalB) * 100)}% Direct Portability
              </span>
            </h4>

            {/* Stacked Bar */}
            <div className="w-full h-4 rounded-lg bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                className="bg-emerald-500 hover:bg-emerald-400 transition-all"
                style={{ width: `${(comparison.controlsCount.equivalentCount / comparison.controlsCount.totalB) * 100}%` }}
                title={`Equivalent Controls: ${comparison.controlsCount.equivalentCount}`}
              />
              <div
                className="bg-amber-500 hover:bg-amber-400 transition-all"
                style={{ width: `${(comparison.controlsCount.partialCount / comparison.controlsCount.totalB) * 100}%` }}
                title={`Partial Overlap: ${comparison.controlsCount.partialCount}`}
              />
              <div
                className="bg-rose-500 hover:bg-rose-400 transition-all"
                style={{ width: `${(comparison.controlsCount.uniqueToBCount / comparison.controlsCount.totalB) * 100}%` }}
                title={`Unique Controls in Reg B: ${comparison.controlsCount.uniqueToBCount}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    {comparison.controlsCount.equivalentCount} Equivalent Controls
                  </span>
                  <span className="text-[11px] text-slate-400">100% reusable evidence from {regulationA.code}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    {comparison.controlsCount.partialCount} Partially Overlapping
                  </span>
                  <span className="text-[11px] text-slate-400">Shared base, localized parameters</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    {comparison.controlsCount.uniqueToBCount} Unique Net-New Mandates
                  </span>
                  <span className="text-[11px] text-slate-400">Net-new audit testing required</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN AUDIT EXECUTION ROADMAP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Evidence Carryover & Savings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reusable Audit Evidence (Carried Over from {regulationA.code})</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {comparison.isUnrelated
                  ? 'Due to statutory divergence, direct technical evidence cannot be cross-credited.'
                  : `These verification artifacts and governance documentation from your ${regulationA.code} assessment can be directly presented during ${regulationB.code} compliance reviews:`}
              </p>

              <ul className="mt-3.5 space-y-2.5">
                {comparison.levelOfEffort.reusableArtifacts.map((art, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2 text-xs"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200">{art}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Delta Requirements (Net-New Work for Reg B) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Unique Delta Mandates to Execute for {regulationB.code}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Specific regulatory nuances, local filing requirements, and technical additions enacted by{' '}
                <strong className="text-slate-200">{regulationB.authority}</strong> that require net-new testing:
              </p>

              <ul className="mt-3.5 space-y-2.5">
                {comparison.levelOfEffort.uniqueDeltaRequirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2 text-xs"
                  >
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL-BY-CONTROL SIDE-BY-SIDE MAPPING */}
      {activeTab === 'controls' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Sample Control-by-Control Harmonization Matrix
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluating clause-level equivalency, standard mappings, and LOE action items.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
              {comparison.sampleControlMatches.length} Evaluated Control Pairs
            </span>
          </div>

          <div className="table-scroll-x">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Domain &amp; Topic</th>
                  <th className="py-3 px-4 w-1/3">{regulationA.code} Baseline Control</th>
                  <th className="py-3 px-4 w-1/3">{regulationB.code} Target Control</th>
                  <th className="py-3 px-4">Similarity Tier</th>
                  <th className="py-3 px-4">LOE Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {comparison.sampleControlMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-300 whitespace-nowrap">
                      {m.domainName}
                    </td>

                    {/* Control A */}
                    <td className="py-3 px-4">
                      {m.controlA ? (
                        <div>
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">
                            {m.controlA.code}
                          </span>
                          <span className="text-white font-medium block mt-0.5">{m.controlA.title}</span>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {m.controlA.description}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No direct corresponding clause</span>
                      )}
                    </td>

                    {/* Control B */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-cyan-400 font-bold text-[11px]">
                            {m.controlB.code}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {m.controlB.mandatoryLevel}
                          </span>
                        </div>
                        <span className="text-white font-medium block mt-0.5">{m.controlB.title}</span>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {m.controlB.description}
                        </p>
                      </div>
                    </td>

                    {/* Similarity Level */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.similarityLevel === 'Equivalent'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : m.similarityLevel === 'Partial'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.similarityLevel}
                      </span>
                    </td>

                    {/* LOE Assessment */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-[11px]">
                      <span
                        className={
                          m.loeAssessment === 'Reuse Prior Evidence'
                            ? 'text-emerald-400 font-bold'
                            : m.loeAssessment === 'Minor Delta Review'
                            ? 'text-amber-400'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {m.loeAssessment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOMAIN-BY-DOMAIN OVERLAP */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparison.domainBreakdown.map((dom, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{dom.domainName}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    dom.overlapPercentage >= 75
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : dom.overlapPercentage >= 45
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  ~{dom.overlapPercentage}% Overlap
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full ${
                    dom.overlapPercentage >= 75
                      ? 'bg-emerald-500'
                      : dom.overlapPercentage >= 45
                      ? 'bg-cyan-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${dom.overlapPercentage}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{dom.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: AI ADVISORY MEMO */}
      {activeTab === 'ai_memo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Executive Synthesis &amp; Strategic Sequencing Memo
              </h4>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateAIMemo}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>
            </div>
          </div>

          {isAiLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">
                Synthesizing statutory divergence, crosswalk evidence, and sovereign LOE timelines with Autonomous AI Model...
              </p>
            </div>
          ) : aiMemo ? (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 space-y-3 whitespace-pre-line font-sans">
              {aiMemo}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Click &quot;AI Executive Synthesis&quot; to generate an automated executive advisory briefing.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
