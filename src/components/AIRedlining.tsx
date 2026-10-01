import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Search,
  BookOpen,
  Scale,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  PenTool,
  Sliders,
  Check,
} from 'lucide-react';
import { Regulation } from '../types/regulatory';
import { RedlineAnalysisResult, PolicyFinding, DraftPolicyPreset } from '../types/redline';
import { DRAFT_POLICY_PRESETS } from '../data/redlinePresets';
import { analyzePolicyAgainstRegulation } from '../utils/redlineEngine';
import { useAdmin } from '../context/AdminContext';

interface AIRedliningProps {
  regulations: Regulation[];
  onNavigateToRegulation?: (regulationId: string) => void;
  onInterpretControl?: (controlText: string, controlId: string, regulationName: string, jurisdiction: string) => void;
}

export const AIRedlining: React.FC<AIRedliningProps> = ({
  regulations,
  onNavigateToRegulation,
  onInterpretControl,
}) => {
  const { addAuditLog } = useAdmin();

  // Input Form State
  const [policyDraftText, setPolicyDraftText] = useState<string>(DRAFT_POLICY_PRESETS[0].policyDraftText);
  const [policyName, setPolicyName] = useState<string>(DRAFT_POLICY_PRESETS[0].name);
  const [selectedRegulationId, setSelectedRegulationId] = useState<string>(DRAFT_POLICY_PRESETS[0].targetRegulationId);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'redline_diff' | 'findings_grid' | 'recommendations' | 'clean_export'>('redline_diff');

  // Filter & UI State
  const [findingFilter, setFindingFilter] = useState<'ALL' | 'Missing Clause' | 'Non-Compliant' | 'Compliant'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High' | 'Pass'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState<RedlineAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected regulation lookup
  const selectedRegulation = regulations.find((r) => r.id === selectedRegulationId) || regulations[0];

  // Preset Selection
  const handleSelectPreset = (preset: DraftPolicyPreset) => {
    setPolicyName(preset.name);
    setPolicyDraftText(preset.policyDraftText);
    setSelectedRegulationId(preset.targetRegulationId);
    setAnalysisResult(null);
  };

  // File Upload Handler (.txt, .md, .doc text files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPolicyName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPolicyDraftText(content);
        setAnalysisResult(null);
      }
    };
    reader.readAsText(file);
  };

  // Run Real-time Redline Analysis
  const handleRunAnalysis = async () => {
    if (!policyDraftText.trim()) return;
    setIsAnalyzing(true);

    try {
      let finalResult: RedlineAnalysisResult;

      // First attempt backend API call with AI enhancement
      const res = await fetch('/api/ai/redline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyDraftText,
          policyName: policyName || 'Uploaded Internal Policy',
          regulationId: selectedRegulation.id,
        }),
      });

      if (res.ok) {
        finalResult = await res.json();
      } else {
        // Fallback to client-side engine
        finalResult = analyzePolicyAgainstRegulation({
          policyDraftText,
          policyName: policyName || 'Uploaded Internal Policy',
          regulation: selectedRegulation,
        });
      }
      setAnalysisResult(finalResult);

      if (addAuditLog) {
        addAuditLog(
          'POLICY_REDLINING',
          `${finalResult.policyName} vs ${selectedRegulation.code}`,
          `Executed AI policy redlining audit against ${selectedRegulation.name}. Score: ${finalResult.summary.overallComplianceScore}% (${finalResult.summary.complianceGrade}), ${finalResult.findings.length} findings (${finalResult.summary.missingClausesCount} missing, ${finalResult.summary.nonCompliantCount} non-compliant).`
        );
      }
    } catch (err) {
      console.warn('[AI Redline] Falling back to local deterministic analysis engine:', err);
      const fallback = analyzePolicyAgainstRegulation({
        policyDraftText,
        policyName: policyName || 'Uploaded Internal Policy',
        regulation: selectedRegulation,
      });
      setAnalysisResult(fallback);

      if (addAuditLog) {
        addAuditLog(
          'POLICY_REDLINING',
          `${fallback.policyName} vs ${selectedRegulation.code}`,
          `Executed local AI policy redlining audit against ${selectedRegulation.name}. Score: ${fallback.summary.overallComplianceScore}% (${fallback.summary.complianceGrade}), ${fallback.findings.length} findings.`
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download Redlined Policy Markdown
  const handleDownloadMarkdown = () => {
    if (!analysisResult) return;

    if (addAuditLog) {
      addAuditLog(
        'REGULATORY_DOWNLOAD',
        `Redline Report: ${analysisResult.policyName}`,
        `Downloaded markdown redline audit report benchmarked against ${analysisResult.selectedRegulationCode} (${analysisResult.selectedRegulationName}).`
      );
    }
    const content = `# COMPLIANCEIQ AI REDLINE AUDIT REPORT
Policy: ${analysisResult.policyName}
Benchmark Regulation: ${analysisResult.selectedRegulationName} (${analysisResult.selectedRegulationCode})
Date: ${analysisResult.analyzedAt}
Score: ${analysisResult.summary.overallComplianceScore}/100 (Grade: ${analysisResult.summary.complianceGrade})
Risk Assessment: ${analysisResult.summary.riskRating}

---
## EXECUTIVE SUMMARY
${analysisResult.summary.executiveSummary}

## STATUTORY GAP OVERVIEW
- Fully Compliant Controls: ${analysisResult.summary.fullyCompliantCount}
- Non-Compliant / Deficient Clauses: ${analysisResult.summary.nonCompliantCount}
- Missing Mandatory Clauses: ${analysisResult.summary.missingClausesCount}

---
## REDLINED POLICY DRAFT WITH AMENDED CLAUSES
${analysisResult.redlinedPolicyDraft}

---
Generated by ComplianceIQ MENAT Regulatory Intelligence Platform
`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${analysisResult.policyName.replace(/\s+/g, '_')}_REDLINED.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered findings list
  const filteredFindings = (analysisResult?.findings || []).filter((f) => {
    if (findingFilter !== 'ALL' && f.category !== findingFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.title.toLowerCase().includes(q) ||
        f.regulationControlCode.toLowerCase().includes(q) ||
        f.gapAnalysis.toLowerCase().includes(q) ||
        f.suggestedDraftClause.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-800/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <PenTool className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 uppercase tracking-wider font-mono">
                AI Redlining & Gap Detection
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                Real-Time Benchmark
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Internal Policy Redlining & Statutory Compliance Verifier
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl mt-1 leading-relaxed">
              Upload your draft information security, data governance, or cloud policy. ComplianceIQ compares your text against statutory controls across 24 MENAT jurisdictions, automatically highlighting non-compliant clauses, flagging omitted mandatory requirements, and drafting audit-ready replacement text.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4 text-rose-400" />
              <span>Upload Draft Policy</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.doc,.json"
              className="hidden"
            />
          </div>
        </div>

        {/* QUICK DRAFT PRESETS */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-rose-400" />
            <span>Load Curated Policy Benchmarks (Try Deficient Drafts):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {DRAFT_POLICY_PRESETS.map((preset) => {
              const isSelected = policyName === preset.name;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/60 border-rose-500/60 text-white shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold truncate text-rose-300">{preset.name}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    Target: {preset.targetRegulationName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* INPUT EDITOR & BENCHMARK CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: POLICY EDITOR (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex-1 mr-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Draft Policy Title / Document Name
              </label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g. Enterprise Cloud Security and Transfer Policy"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono">
                {policyDraftText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </div>

          {/* DRAFT TEXTAREA */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Draft Policy Content (Paste or Edit Clauses):</span>
              </label>
              <button
                type="button"
                onClick={() => setPolicyDraftText('')}
                className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
              >
                Clear Text
              </button>
            </div>
            <textarea
              value={policyDraftText}
              onChange={(e) => setPolicyDraftText(e.target.value)}
              rows={16}
              placeholder="Paste your organization's draft policy clauses here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 resize-y"
            ></textarea>
          </div>
        </div>

        {/* RIGHT COLUMN: BENCHMARK REGULATION SELECTOR & ACTION (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Benchmark Against Regulation:</span>
              </label>
              <select
                value={selectedRegulationId}
                onChange={(e) => {
                  setSelectedRegulationId(e.target.value);
                  setAnalysisResult(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {regulations.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.countryId.toUpperCase()}: {reg.code} - {reg.name} ({reg.authority})
                  </option>
                ))}
              </select>
            </div>

            {/* SELECTED REGULATION SUMMARY CARD */}
            {selectedRegulation && (
              <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300">{selectedRegulation.code}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                    {selectedRegulation.authority}
                  </span>
                </div>
                <div className="text-slate-200 font-medium">{selectedRegulation.name}</div>
                <p className="text-slate-400 line-clamp-2 text-[11px] leading-relaxed">
                  {selectedRegulation.scopeSummary}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-indigo-900/50 text-[11px] text-slate-400">
                  <span>Mandatory Controls in Scope:</span>
                  <span className="font-bold text-white font-mono">
                    {selectedRegulation.controlStructure?.totalControlsCount || selectedRegulation.sampleControls?.length || 0} Controls
                  </span>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !policyDraftText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Comparing Against Statutory Controls...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Execute AI Redline & Gap Analysis</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Evaluates against MENAT control clauses and international crosswalks (NIST CSF / ISO 27001 / CSA CCM v4.1).
            </p>
          </div>

          {/* QUICK AUDIT TIPS */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>How ComplianceIQ Redlining Works:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>
                <strong className="text-slate-300">Missing Clauses:</strong> Identifies statutory mandates required by the authority that are completely absent from your draft.
              </li>
              <li>
                <strong className="text-slate-300">Non-Compliant Clauses:</strong> Flags language that conflicts with law (e.g. unlawful breach response times or obsolete cipher algorithms).
              </li>
              <li>
                <strong className="text-slate-300">Suggested Insertions:</strong> Supplies exact replacement text ready to copy directly into your policy repository.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ANALYSIS RESULTS DASHBOARD */}
      {analysisResult && (
        <div className="space-y-6 pt-4">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Score */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Compliance Score
              </div>
              <div className="text-3xl font-black mt-1 font-mono text-white">
                {analysisResult.summary.overallComplianceScore}
                <span className="text-sm text-slate-400 font-normal">/100</span>
              </div>
              <div className="mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    analysisResult.summary.complianceGrade === 'A+' || analysisResult.summary.complianceGrade === 'A'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : analysisResult.summary.complianceGrade === 'B'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : analysisResult.summary.complianceGrade === 'C'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  Grade: {analysisResult.summary.complianceGrade}
                </span>
              </div>
            </div>

            {/* Risk Rating */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Risk Posture
              </div>
              <div
                className={`text-sm font-bold mt-2 truncate ${
                  analysisResult.summary.riskRating.includes('Low')
                    ? 'text-emerald-400'
                    : analysisResult.summary.riskRating.includes('Moderate')
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {analysisResult.summary.riskRating}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Audit Exposure</div>
            </div>

            {/* Total Evaluated */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mandates Evaluated
              </div>
              <div className="text-2xl font-bold mt-1 text-slate-200 font-mono">
                {analysisResult.summary.totalMandatesChecked}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Statutory Clauses</div>
            </div>

            {/* Non-Compliant */}
            <div className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-4 shadow text-center bg-rose-950/20">
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                Non-Compliant
              </div>
              <div className="text-2xl font-bold mt-1 text-rose-400 font-mono">
                {analysisResult.summary.nonCompliantCount}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-1">Deficient Clauses</div>
            </div>

            {/* Missing Clauses */}
            <div className="bg-slate-900/90 border border-amber-900/40 rounded-xl p-4 shadow text-center bg-amber-950/20">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Missing Clauses
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-400 font-mono">
                {analysisResult.summary.missingClausesCount}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-1">Zero Policy Coverage</div>
            </div>

            {/* Compliant */}
            <div className="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-4 shadow text-center bg-emerald-950/20">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Compliant
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-400 font-mono">
                {analysisResult.summary.fullyCompliantCount}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">Statutorily Aligned</div>
            </div>
          </div>

          {/* EXECUTIVE GAP SUMMARY */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Executive Gap Assessment
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">Engine:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {analysisResult.modelUsed}
                </span>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>Export Redlined Policy (.MD)</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {analysisResult.summary.executiveSummary}
            </p>

            {/* PRIMARY RISK AREAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                <div className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Primary Risk Exposures:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {analysisResult.summary.primaryRiskAreas.map((risk, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                <div className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Priority Remediation Actions:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {analysisResult.summary.keyRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* VIEW NAVIGATION TABS */}
          <div className="border-b border-slate-800 flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('redline_diff')}
                className={`py-2 px-1 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'redline_diff'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Side-by-Side Redlined Draft</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono">
                  Diff
                </span>
              </button>

              <button
                onClick={() => setActiveTab('findings_grid')}
                className={`py-2 px-1 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'findings_grid'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Detailed Findings & Replacement Clauses</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                  {analysisResult.findings.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: SIDE-BY-SIDE REDLINED TEXT */}
          {activeTab === 'redline_diff' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ORIGINAL POLICY */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Original Uploaded Policy Draft
                  </span>
                  <button
                    onClick={() => handleCopy(policyDraftText, 'orig')}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === 'orig' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'orig' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                  {policyDraftText}
                </pre>
              </div>

              {/* REDLINED DRAFT WITH STATUTORY INSERTIONS */}
              <div className="bg-slate-900/90 border border-rose-900/50 rounded-xl p-4 shadow-lg space-y-2 bg-gradient-to-b from-rose-950/10 to-slate-900/90">
                <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Redlined Policy Draft (AI Amended)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(analysisResult.redlinedPolicyDraft, 'redline')}
                    className="text-[11px] text-rose-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === 'redline' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'redline' ? 'Copied' : 'Copy Redline'}</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-slate-200 bg-slate-950 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto border border-rose-900/30">
                  {analysisResult.redlinedPolicyDraft.split('\n').map((line, idx) => {
                    const isStrike = line.includes('<<< [REDLINE STRIKE');
                    const isInsert = line.includes('<<< [REDLINE INSERTION') || line.includes('STATUTORY INSERTION') || line.includes('MANDATORY ADDITION');
                    const isMissingHeader = line.includes('=== REQUIRED ADDITIONS:');

                    if (isStrike) {
                      return (
                        <div key={idx} className="bg-rose-950/60 text-rose-300 font-bold px-1.5 py-0.5 rounded my-1 border border-rose-500/40">
                          {line}
                        </div>
                      );
                    }
                    if (isInsert) {
                      return (
                        <div key={idx} className="bg-emerald-950/60 text-emerald-300 font-bold px-1.5 py-0.5 rounded my-1 border border-emerald-500/40">
                          {line}
                        </div>
                      );
                    }
                    if (isMissingHeader) {
                      return (
                        <div key={idx} className="bg-amber-950/60 text-amber-300 font-bold px-2 py-1 rounded my-2 border border-amber-500/40">
                          {line}
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED FINDINGS GRID */}
          {activeTab === 'findings_grid' && (
            <div className="space-y-4">
              {/* FILTERS TOOLBAR */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-400">Category:</span>
                  {(['ALL', 'Non-Compliant', 'Missing Clause', 'Compliant'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFindingFilter(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        findingFilter === cat
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter findings by clause or keyword..."
                      className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:outline-none focus:border-rose-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* FINDINGS ACCORDION CARDS */}
              <div className="space-y-3">
                {filteredFindings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                    No findings match the selected category filter.
                  </div>
                ) : (
                  filteredFindings.map((finding) => {
                    const isExpanded = expandedFindingId === finding.id;
                    const isNonCompliant = finding.category === 'Non-Compliant';
                    const isMissing = finding.category === 'Missing Clause';
                    const isPass = finding.category === 'Compliant';

                    return (
                      <div
                        key={finding.id}
                        className={`border rounded-xl transition-all shadow ${
                          isNonCompliant
                            ? 'bg-slate-900/95 border-rose-800/60'
                            : isMissing
                            ? 'bg-slate-900/95 border-amber-800/60'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        {/* CARD HEADER */}
                        <div
                          onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                          className="p-4 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
                            <span className="shrink-0">
                              {isNonCompliant && (
                                <XCircle className="w-5 h-5 text-rose-400" />
                              )}
                              {isMissing && (
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                              )}
                              {isPass && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              )}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                  {finding.regulationControlCode}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                                    isNonCompliant
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : isMissing
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {finding.category}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Clause Ref: {finding.clauseReference}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-200 mt-1 truncate">
                                {finding.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            {onInterpretControl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onInterpretControl(
                                    finding.regulatoryRequirementText,
                                    finding.regulationControlCode,
                                    analysisResult.selectedRegulationName,
                                    analysisResult.selectedRegulationJurisdiction
                                  );
                                }}
                                className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                                title="Open in Control Interpreter"
                              >
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                <span>Interpret</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* EXPANDED CONTENT */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs">
                            {/* Statutory Benchmark Text */}
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                              <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                                Statutory Mandate ({finding.regulationControlCode}):
                              </span>
                              <p className="text-slate-300 leading-relaxed">
                                {finding.regulatoryRequirementText}
                              </p>
                            </div>

                            {/* Detected Policy Text if present */}
                            {finding.detectedPolicyText && (
                              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40">
                                <span className="font-bold text-rose-300 block mb-1 uppercase tracking-wider text-[10px]">
                                  Detected Non-Compliant Clause in Policy:
                                </span>
                                <p className="text-rose-200/90 font-mono text-[11px] leading-relaxed">
                                  "{finding.detectedPolicyText}"
                                </p>
                              </div>
                            )}

                            {/* Gap Analysis */}
                            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                              <span className="font-bold text-slate-300 block mb-1 text-[11px]">
                                Gap Analysis & Legal Exposure:
                              </span>
                              <p className="text-slate-300 leading-relaxed">
                                {finding.gapAnalysis}
                              </p>
                              <div className="text-[11px] text-slate-400 mt-1 italic">
                                {finding.rationale}
                              </div>
                            </div>

                            {/* Suggested Redlined Replacement Clause */}
                            <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Suggested Statutory Replacement Clause:</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(finding.suggestedDraftClause, finding.id)}
                                  className="text-[11px] text-emerald-400 hover:text-white flex items-center space-x-1 cursor-pointer font-semibold"
                                >
                                  {copiedId === finding.id ? (
                                    <Check className="w-3 h-3 text-emerald-300" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedId === finding.id ? 'Copied' : 'Copy Clause'}</span>
                                </button>
                              </div>
                              <pre className="text-xs font-mono text-emerald-200 bg-slate-950/80 p-3 rounded border border-emerald-900/50 whitespace-pre-wrap leading-relaxed">
                                {finding.suggestedDraftClause}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
