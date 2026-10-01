import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Users,
  GitBranch,
  Cpu,
  Layers,
  CheckCircle,
  Copy,
  ExternalLink,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
} from 'lucide-react';
import { INTERPRETER_PRESETS } from '../data/interpreterPresets';
import { ControlInterpretationResult, InterpreterPreset } from '../types/interpreter';

interface ControlInterpreterProps {
  initialControlText?: string;
  initialControlId?: string;
  initialRegulationName?: string;
  initialJurisdiction?: string;
}

export const ControlInterpreter: React.FC<ControlInterpreterProps> = ({
  initialControlText = '',
  initialControlId = '',
  initialRegulationName = '',
  initialJurisdiction = 'Saudi Arabia',
}) => {
  const [controlText, setControlText] = useState<string>(initialControlText);
  const [controlId, setControlId] = useState<string>(initialControlId);
  const [regulationName, setRegulationName] = useState<string>(initialRegulationName);
  const [jurisdiction, setJurisdiction] = useState<string>(initialJurisdiction || 'Saudi Arabia');
  const [cloudModelTarget, setCloudModelTarget] = useState<'All' | 'IaaS' | 'PaaS' | 'SaaS' | 'Hybrid'>('All');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ControlInterpretationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inSimpleTerms' | 'controlsToCheck' | 'alignments' | 'auditorChecklist'>('inSimpleTerms');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);

  // If initial props are passed or change, update state
  useEffect(() => {
    if (initialControlText) {
      setControlText(initialControlText);
      setControlId(initialControlId);
      setRegulationName(initialRegulationName);
      if (initialJurisdiction) setJurisdiction(initialJurisdiction);
    }
  }, [initialControlText, initialControlId, initialRegulationName, initialJurisdiction]);

  // Load a preset
  const handleSelectPreset = (preset: InterpreterPreset) => {
    setControlText(preset.controlText);
    setControlId(preset.controlId);
    setRegulationName(preset.regulationName);
    setJurisdiction(preset.jurisdiction);
    setCloudModelTarget(preset.cloudModelTarget);
    setError(null);
  };

  // Submit to interpret
  const handleInterpret = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!controlText.trim()) {
      setError('Please paste or type a control requirement text to interpret.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/control/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlText: controlText.trim(),
          controlId: controlId.trim() || undefined,
          regulationName: regulationName.trim() || undefined,
          jurisdiction: jurisdiction.trim() || undefined,
          cloudModelTarget,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${res.status}`);
      }

      const data: ControlInterpretationResult = await res.json();
      setResult(data);
      setActiveTab('inSimpleTerms');
    } catch (err: any) {
      console.error('Interpret error:', err);
      setError(err?.message || 'Failed to interpret control text. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-interpreter-${result.sourceInput.controlId || 'control'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wide border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Framework Regulatory Control Interpreter</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Regulatory Control & Sub-Control Interpreter
            </h1>
            <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
              Paste the verbatim text of any statutory control or sub-control requirement from any regulation. Instantly receive an authoritative breakdown in simple terms, concrete <span className="text-amber-300 font-medium">People</span>, <span className="text-emerald-300 font-medium">Process</span>, and <span className="text-sky-300 font-medium">Technical</span> checks, and rigorous alignments across NIST 800-53, CSF v2, NIST AI RMF, ISO 27001, CIS Controls, and the CSA Cloud Controls Matrix (CCM v4.1 with SSRM ownership & continuous audit metrics).
            </p>
          </div>
          <div className="flex md:flex-col gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-xs text-indigo-200">Aligned Frameworks</div>
              <div className="text-lg font-bold text-white">6 Industry Standards</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-xs text-indigo-200">Grounded Standard</div>
              <div className="text-lg font-bold text-emerald-300">CSA CCM v4.1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick-Load Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Sample Control Benchmarks (Click to load)</span>
          </div>
          <span className="text-xs text-slate-400">6 Pre-Configured Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {INTERPRETER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {preset.badge}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  {preset.controlId}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {preset.regulationName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleInterpret} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Control Identifier (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ECC-2-1-3, Art. 29, AIS-08"
              value={controlId}
              onChange={(e) => setControlId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 text-slate-100 placeholder:text-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Regulation / Standard
            </label>
            <input
              type="text"
              placeholder="e.g. Saudi PDPL, NCA ECC, SAMA"
              value={regulationName}
              onChange={(e) => setRegulationName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 text-slate-100 placeholder:text-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Jurisdiction
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
              <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
              <option value="Qatar">Qatar</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Bahrain">Bahrain</option>
              <option value="Oman">Oman</option>
              <option value="Egypt">Egypt</option>
              <option value="Jordan">Jordan</option>
              <option value="Morocco">Morocco</option>
              <option value="Global / Multi-Jurisdiction">Global / Multi-Jurisdiction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Cloud SSRM Scope
            </label>
            <select
              value={cloudModelTarget}
              onChange={(e) => setCloudModelTarget(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Delivery Models</option>
              <option value="IaaS">Infrastructure as a Service (IaaS)</option>
              <option value="PaaS">Platform as a Service (PaaS)</option>
              <option value="SaaS">Software as a Service (SaaS)</option>
              <option value="Hybrid">Hybrid Cloud / Multi-Tenant</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Control / Sub-Control Verbatim Text <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {controlText.length} characters
            </span>
          </div>
          <textarea
            rows={5}
            placeholder="Paste your typical control or sub-control requirement here (e.g., from NCA ECC, SAMA Framework, UAE ISR, Saudi PDPL, Central Bank Circular, or internal audit charter)..."
            value={controlText}
            onChange={(e) => setControlText(e.target.value)}
            className="w-full px-4 py-3 text-sm font-sans bg-slate-800 text-slate-100 placeholder:text-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setControlText('');
              setControlId('');
              setRegulationName('');
              setError(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Clear Fields
          </button>

          <button
            type="submit"
            disabled={isLoading || !controlText.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Interpreting Control...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Interpret & Align Control</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results View */}
      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden space-y-0">
          {/* Result Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                  {result.sourceInput.controlId || 'Custom Control'}
                </span>
                {result.sourceInput.regulationName && (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {result.sourceInput.regulationName}
                  </span>
                )}
                {result.sourceInput.jurisdiction && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({result.sourceInput.jurisdiction})
                  </span>
                )}
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  SSRM: {result.sourceInput.cloudModelTarget}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Engine: <span className="font-medium text-slate-700 dark:text-slate-300">{result.modelUsed}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Export as structured JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => handleCopyText(JSON.stringify(result, null, 2), 'all')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSection === 'all' ? 'Copied!' : 'Copy Results'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-5 flex gap-2 overflow-x-auto bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('inSimpleTerms')}
              className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'inSimpleTerms'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>In Simple Terms</span>
            </button>

            <button
              onClick={() => setActiveTab('controlsToCheck')}
              className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'controlsToCheck'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>What To Check (People, Process, Tech)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {result.controlsToCheck.people.length + result.controlsToCheck.process.length + result.controlsToCheck.technical.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alignments')}
              className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'alignments'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Standard Alignments (NIST, ISO, CIS, CSA CCM)</span>
            </button>

            <button
              onClick={() => setActiveTab('auditorChecklist')}
              className={`py-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'auditorChecklist'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Auditor Proof Checklist</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {result.auditorChecklist.length}
              </span>
            </button>
          </div>

          {/* Tab 1: In Simple Terms */}
          {activeTab === 'inSimpleTerms' && (
            <div className="p-6 space-y-6">
              {/* Plain English Translation Card */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-sm uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Plain Language Summary</span>
                </div>
                <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {result.inSimpleTerms.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Core Mandatory Requirement</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.inSimpleTerms.coreRequirement}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Why Regulators Demand It</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.inSimpleTerms.whyItMatters}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Exposure / Non-Compliance Risk</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.inSimpleTerms.riskIfNotCompliant}
                  </p>
                </div>
              </div>

              {/* Source Text Verification Box */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Input Control Requirement Text Analyzed
                </div>
                <blockquote className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 whitespace-pre-wrap leading-relaxed">
                  {result.sourceInput.controlText}
                </blockquote>
              </div>
            </div>
          )}

          {/* Tab 2: What To Check (People, Process, Tech) */}
          {activeTab === 'controlsToCheck' && (
            <div className="p-6 space-y-8">
              {/* People Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        1. People Controls to Check
                      </h3>
                      <p className="text-xs text-slate-500">Personnel, competencies, training cadence, and designated accountability</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {result.controlsToCheck.people.length} Verification Checks
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.controlsToCheck.people.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-3 hover:border-amber-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.id}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">Governance RACI</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                          Audit Verification:
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {item.whatToCheck}
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-500">Key Roles:</span>
                          {item.keyRoles.map((role, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Competency: </span>
                          {item.competencyOrTraining}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        2. Process & Governance Controls to Check
                      </h3>
                      <p className="text-xs text-slate-500">Policies, standard operating procedures, approval gates, and exceptions</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {result.controlsToCheck.process.length} Verification Checks
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.controlsToCheck.process.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-3 hover:border-emerald-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.id}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          Cadence: {item.reviewCadence}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-0.5">
                          Audit Verification:
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {item.whatToCheck}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                        <span className="text-[11px] font-medium text-slate-500">Required Artifacts:</span>
                        {item.governanceArtifacts.map((art, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                            {art}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        3. Technical & System Controls to Check
                      </h3>
                      <p className="text-xs text-slate-500">Infrastructure tooling, automated safeguards, cipher suites, and configurations</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {result.controlsToCheck.technical.length} Verification Checks
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.controlsToCheck.technical.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-3 hover:border-sky-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                          {item.id}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">Technical Baseline</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="p-2.5 bg-sky-50/60 dark:bg-sky-950/30 rounded-lg border border-sky-100 dark:border-sky-900/50">
                        <div className="text-[11px] font-bold text-sky-900 dark:text-sky-300 mb-0.5">
                          System Verification:
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {item.whatToCheck}
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-500">Tooling Stack:</span>
                          {item.toolingCategories.map((tool, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                              {tool}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-500">Enforced Safeguards:</span>
                          {item.technicalSafeguards.map((safe, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-mono font-medium">
                              {safe}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Standard Alignments (NIST, ISO, CIS, CSA CCM) */}
          {activeTab === 'alignments' && (
            <div className="p-6 space-y-6">
              {/* Highlighted Banner: CSA Cloud Controls Matrix v4.1 Grounded SSRM Mapping */}
              <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider">
                      CSA CCM v4.1 Primary Anchor
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {result.technicalAlignments.csaCcmV4.controlId}: {result.technicalAlignments.csaCcmV4.controlTitle}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Domain: {result.technicalAlignments.csaCcmV4.domainName} ({result.technicalAlignments.csaCcmV4.domainId})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                  {result.technicalAlignments.csaCcmV4.controlSpecification}
                </p>

                {/* SSRM Ownership Matrix per Cloud Delivery Model */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500 mb-1">IaaS Ownership</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {result.technicalAlignments.csaCcmV4.ssrmOwnership.iaas}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500 mb-1">PaaS Ownership</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {result.technicalAlignments.csaCcmV4.ssrmOwnership.paas}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500 mb-1">SaaS Ownership</div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {result.technicalAlignments.csaCcmV4.ssrmOwnership.saas}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">SSRM Ownership Rationale: </span>
                  {result.technicalAlignments.csaCcmV4.ownershipRationale}
                </div>

                {/* Continuous Audit Metric from CSA Continuous Audit Metrics Catalog */}
                {result.technicalAlignments.csaCcmV4.continuousAuditMetric && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Continuous Audit Metric: {result.technicalAlignments.csaCcmV4.continuousAuditMetric.metricId}</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">
                        SLO: {result.technicalAlignments.csaCcmV4.continuousAuditMetric.sloRecommendation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {result.technicalAlignments.csaCcmV4.continuousAuditMetric.description}
                    </p>
                    <div className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200">
                      Formula: {result.technicalAlignments.csaCcmV4.continuousAuditMetric.expression}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid of Global Framework Alignments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. NIST SP 800-53 Rev. 5 */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>NIST SP 800-53 Rev. 5 Controls</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{result.technicalAlignments.nist800_53.length} Mapped</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.technicalAlignments.nist800_53.map((n, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{n.controlId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{n.family}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{n.controlName}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{n.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. NIST Cybersecurity Framework (CSF v2.0) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>NIST CSF v2.0 Functions & Categories</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{result.technicalAlignments.nistCsfV2.length} Mapped</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.technicalAlignments.nistCsfV2.map((c, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.subcategoryId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">{c.functionName}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{c.category}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. ISO/IEC 27001:2022 Annex A */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>ISO/IEC 27001:2022 Annex A Controls</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{result.technicalAlignments.iso27001_2022.length} Mapped</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.technicalAlignments.iso27001_2022.map((iso, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">{iso.clauseId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">{iso.category}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{iso.title}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{iso.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. CIS Controls v8.1 Safeguards */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                      <span>CIS Controls v8.1 Safeguards</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{result.technicalAlignments.cisControlsV8.length} Mapped</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.technicalAlignments.cisControlsV8.map((cis, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">CIS {cis.safeguardId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">{cis.implementationGroup}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{cis.safeguardTitle}</div>
                        <div className="text-[10px] text-slate-500">Asset Type: {cis.assetType} • Control {cis.controlNumber}: {cis.controlTitle}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{cis.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Optional NIST AI RMF (if AI related) */}
              {result.technicalAlignments.nistAiRmf && (
                <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-violet-200 dark:border-violet-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>NIST AI RMF 1.0 (Artificial Intelligence Risk Management Framework)</span>
                    </span>
                    <span className="text-[11px] text-violet-700 dark:text-violet-400">
                      {result.technicalAlignments.nistAiRmf.length} Functions Mapped
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {result.technicalAlignments.nistAiRmf.map((ai, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-violet-100 dark:border-violet-900/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">{ai.subcategoryId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-bold">{ai.functionId}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{ai.title}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{ai.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Auditor Proof Checklist */}
          {activeTab === 'auditorChecklist' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Auditor Verification Evidence Checklist
                  </h3>
                  <p className="text-xs text-slate-500">Exact questions, required evidence artifacts, and test methods to satisfy regulatory inspection</p>
                </div>
                <span className="text-xs text-slate-400">5 Essential Audit Tests</span>
              </div>

              <div className="space-y-3">
                {result.auditorChecklist.map((check) => (
                  <div
                    key={check.checkId}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-400 transition"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {check.checkId}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            check.domain === 'Technical'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : check.domain === 'Process'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {check.domain}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            check.severityIfMissing === 'Critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : check.severityIfMissing === 'High'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {check.severityIfMissing} Severity If Deficient
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {check.auditQuestion}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Required Audit Evidence: </span>
                        {check.requiredEvidence}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Test Method</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{check.testMethod}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
