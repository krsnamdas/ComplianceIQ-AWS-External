import React, { useState, useEffect, useMemo } from 'react';
import { Regulation, RegulationRequirementsAnalysis, RequirementConfidenceResult } from '../types/regulatory';
import { useRBAC } from '../context/RBACContext';
import { useAdmin } from '../context/AdminContext';
import { SmartInsightCard } from './SmartInsightCard';
import { RegulationDocuments } from './RegulationDocuments';
import { SuggestLinkModal } from './SuggestLinkModal';
import { SuggestCorrectionModal } from './SuggestCorrectionModal';
import { calculateUrgencyScore } from '../utils/urgencyScore';
import { analyzeRegulationMandate, analyzeControlMandate } from '../utils/mandateConfidence';
import { ConfidenceLevelLegendModal } from './ConfidenceLevelLegendModal';
import { formatEnactmentPeriod, getAuditTimelineDefault } from '../utils/auditTimelineHelper';
import {
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Cpu,
  Database,
  Cloud,
  Lock,
  Globe,
  Radio,
  FileCheck,
  GitCompare,
  Scale,
  Calendar,
  History,
  Clock,
  Bookmark,
  BookmarkCheck,
  Download,
  Flame,
  Info,
  Sparkles,
  PenTool,
  BookOpen,
  Filter,
  Link2,
  PencilLine,
} from 'lucide-react';

interface RegulationCardProps {
  regulation: Regulation;
  countryName: string;
  countryFlag: string;
  minConfidenceFilter?: number;
  onViewDiff?: (diffId: string) => void;
  isPinned?: boolean;
  onTogglePin?: (regulationId: string) => void;
  onExportSingle?: (regulationId: string) => void;
  onCompare?: (regulationId: string) => void;
  onInterpretControl?: (controlText: string, controlId: string, regulationName: string, jurisdiction: string) => void;
  onRedlinePolicy?: (regulationId: string) => void;
}

export const RegulationCard: React.FC<RegulationCardProps> = ({
  regulation,
  countryName,
  countryFlag,
  minConfidenceFilter = 0,
  onViewDiff,
  isPinned = false,
  onTogglePin,
  onExportSingle,
  onCompare,
  onInterpretControl,
  onRedlinePolicy,
}) => {
  const { canManageWatchlist } = useRBAC();
  const { getLinkAudit, addAuditLog, effectiveFeatureFlags: featureFlags, timelineEvents, isCurrentUserAdmin, isAuthenticated } = useAdmin();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUrgencyBreakdown, setShowUrgencyBreakdown] = useState(false);
  const [showConfidenceExplainer, setShowConfidenceExplainer] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [suggestModal, setSuggestModal] = useState<{
    isOpen: boolean;
    linkType: 'officialUrl' | 'documentPdfUrl';
  }>({
    isOpen: false,
    linkType: 'officialUrl',
  });
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Non-admin authenticated users may propose corrections (admins edit directly).
  const canSuggestCorrection = isAuthenticated && !isCurrentUserAdmin;

  // Backend AI Requirement Confidence Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<RegulationRequirementsAnalysis | null>(null);
  const [isLoadingConfidence, setIsLoadingConfidence] = useState(false);

  // Fetch requirement confidence extracted and analyzed by the backend AI service
  const fetchRequirementConfidence = async (force = false) => {
    try {
      setIsLoadingConfidence(true);
      const res = await fetch('/api/ai/analyze-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regulationId: regulation.id,
          regulationCode: regulation.code,
          regulationName: regulation.name,
          authority: regulation.authority,
          countryName,
          scopeSummary: regulation.scopeSummary,
          requirements: regulation.sampleControls,
          forceRefresh: force,
        }),
      });
      if (res.ok) {
        const data: RegulationRequirementsAnalysis = await res.json();
        setAiAnalysis(data);
      }
    } catch (err) {
      console.warn('[Requirement Confidence fetch error]', err);
    } finally {
      setIsLoadingConfidence(false);
    }
  };

  // Load confidence analysis on initial mount or when card expands
  useEffect(() => {
    if (isExpanded && !aiAnalysis && !isLoadingConfidence) {
      fetchRequirementConfidence(false);
    }
  }, [isExpanded]);

  // Helper to extract requirement confidence for a specific granular control/requirement
  const getRequirementConfidence = (ctrl: any): RequirementConfidenceResult => {
    if (aiAnalysis?.requirements) {
      const found = aiAnalysis.requirements.find(
        (r) => r.id === ctrl.id || r.code.toLowerCase() === ctrl.code.toLowerCase()
      );
      if (found) {
        return found;
      }
    }
    const fallback = analyzeControlMandate(ctrl);
    return {
      id: ctrl.id,
      code: ctrl.code,
      label: fallback.level,
      confidenceScore: fallback.confidenceScore,
      confidenceInterval: fallback.confidenceInterval,
      rationale: fallback.rationale,
      statutoryKeyword: fallback.level === 'Mandatory' ? 'shall / must implement' : 'should / recommended',
      enforcementType: fallback.level === 'Mandatory' ? 'Primary Statutory Obligation' : 'Supervisory Guideline',
      isGeminiExtracted: false,
    };
  };

  const displayedControls = useMemo(() => {
    if (!regulation.sampleControls) return [];
    if (!minConfidenceFilter || minConfidenceFilter <= 0) return regulation.sampleControls;
    return regulation.sampleControls.filter((ctrl) => {
      const reqConf = getRequirementConfidence(ctrl);
      return reqConf.confidenceScore >= minConfidenceFilter;
    });
  }, [regulation.sampleControls, minConfidenceFilter, aiAnalysis]);

  const urgency = calculateUrgencyScore(regulation, timelineEvents);

  const getUrgencyBadgeColor = (tier: string) => {
    switch (tier) {
      case 'Critical':
        return 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25';
      case 'High':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25';
      case 'Moderate':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25';
      case 'Monitored':
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'tech_cyber':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'tech_ai':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'tech_data_privacy':
        return <Database className="w-4 h-4 text-cyan-400" />;
      case 'tech_cloud':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'tech_space_quantum':
        return <Radio className="w-4 h-4 text-indigo-400" />;
      case 'non_tech_impact':
        return <FileCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Lock className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all">
      {/* Top Banner */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Country & Code */}
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl" role="img" aria-label={countryName}>
              {countryFlag}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {regulation.code}
                </span>
                <span className="text-xs text-slate-400">{countryName}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{regulation.authority}</div>
            </div>
          </div>

          {/* Badges & Watchlist Action */}
          <div className="flex flex-wrap items-center gap-2">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(regulation.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm ${
                  isPinned
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-amber-300'
                }`}
                title={
                  !canManageWatchlist
                    ? 'Pinning requires Compliance Manager role'
                    : isPinned
                    ? 'Tracked in your Watchlist (Click to unpin)'
                    : 'Pin this regulation to your Watchlist dashboard'
                }
              >
                {!canManageWatchlist && !isPinned ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pin to Watchlist</span>
                  </>
                ) : isPinned ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Watchlist Active</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pin to Watchlist</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUrgencyBreakdown(!showUrgencyBreakdown)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${getUrgencyBadgeColor(
                urgency.tier
              )}`}
              title="Click to inspect regulatory urgency score breakdown (Sentiment, Sector Risk, Upcoming Deadlines)"
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  urgency.tier === 'Critical'
                    ? 'text-red-400 animate-pulse'
                    : urgency.tier === 'High'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
              <span>Urgency: {urgency.score}/100</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/20">
                {urgency.tier}
              </span>
            </button>

            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full flex items-center space-x-1 ${
                regulation.regulationNature === 'Tech' || (!regulation.regulationNature && regulation.isTech)
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : regulation.regulationNature === 'Hybrid'
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {getCategoryIcon(regulation.category)}
              <span>{regulation.regulationNature ? `${regulation.regulationNature} Regulation` : (regulation.isTech ? 'Tech Regulation' : 'Non-Tech')}</span>
            </span>

            <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-800 text-cyan-300 border border-slate-700 flex items-center space-x-1" title="Statutory Enactment Period">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Enacted: {formatEnactmentPeriod(regulation.enactmentPeriod, regulation.effectiveDate, regulation.yearEnacted)}</span>
            </span>

            <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center space-x-1" title={regulation.auditTimeline || `Assessment Period: ${regulation.auditFrequency || 'Annually'}`}>
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Review: {regulation.auditFrequency || 'Annually'}</span>
            </span>

            <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
              {regulation.status}
            </span>

            {/* Compliance Requirement Confidence Visual Badge (Extracted & Analyzed by AI) */}
            {(() => {
              const mandate = aiAnalysis?.overallMandate || analyzeRegulationMandate(regulation);
              const label = aiAnalysis?.overallMandate ? aiAnalysis.overallMandate.label : (mandate as any).type;
              const isMandatory = label === 'Mandatory';
              const isConditional = label === 'Conditional' || label === 'Conditional Mandate';

              return (
                <button
                  type="button"
                  onClick={() => setShowConfidenceExplainer(!showConfidenceExplainer)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                    isMandatory
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                      : isConditional
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/25'
                  }`}
                  title="Click to inspect AI-analyzed Compliance Requirement Confidence breakdown"
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Compliance Requirement Confidence:
                  </span>
                  <span className="font-extrabold uppercase">{label}</span>
                  <span className="font-mono text-[11px] font-bold bg-black/30 px-1.5 py-0.2 rounded text-white">
                    {mandate.confidenceScore}%
                  </span>
                  <span className="font-mono text-[10px] opacity-75 hidden sm:inline">
                    [{mandate.confidenceInterval}]
                  </span>
                  {aiAnalysis?.isLiveGemini && (
                    <span title="Extracted and analyzed by Autonomous AI Model">
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                    </span>
                  )}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Compliance Requirement Confidence Explainer Panel (Expandable) */}
        {showConfidenceExplainer && (
          <div className="mt-3.5 p-3.5 bg-slate-950/95 border border-cyan-900/50 rounded-xl space-y-2.5 text-xs animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Autonomous AI Statutory Confidence Analysis</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  {aiAnalysis?.modelUsed || 'Autonomous Statutory AI Engine'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLegendModal(true)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
                  title="View Confidence Scoring Methodology and Interval Legend"
                >
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                  <span>Scoring Legend</span>
                </button>
                <button
                  type="button"
                  onClick={() => fetchRequirementConfidence(true)}
                  disabled={isLoadingConfidence}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Re-run Autonomous AI statutory analysis"
                >
                  <Sparkles className={`w-3 h-3 ${isLoadingConfidence ? 'animate-spin' : ''}`} />
                  <span>{isLoadingConfidence ? 'Analyzing...' : 'Re-analyze'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfidenceExplainer(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {(() => {
              const mandate = aiAnalysis?.overallMandate || analyzeRegulationMandate(regulation);
              const label = aiAnalysis?.overallMandate ? aiAnalysis.overallMandate.label : (mandate as any).type;
              return (
                <div className="space-y-2 text-slate-300 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-[11px]">Classification:</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {label}
                    </span>
                    <span className="text-slate-400 text-[11px]">Confidence Score:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {mandate.confidenceScore}% [{mandate.confidenceInterval}]
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <strong className="text-white block mb-0.5">Statutory Jurist Rationale:</strong>
                    {mandate.rationale}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    * Analyzed by Autonomous AI Model based on statutory instrument backing (Decree vs. Circular), mandatory auxiliary verbs (shall/must), and enforcement penalty exposure.
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Urgency Score Detailed Breakdown Panel (Expandable) */}
        {showUrgencyBreakdown && (
          <div className="mt-3.5 p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Regulatory Urgency Score Analysis</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {urgency.score} / 100 ({urgency.tier})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUrgencyBreakdown(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Factor 1: Sentiment Analysis */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  1. Regulatory Sentiment (35%)
                </span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      urgency.sentiment === 'Impactful'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : urgency.sentiment === 'Consultation Phase'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {urgency.sentiment}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    ({urgency.breakdown.sentimentScore} pts)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {urgency.sentimentRationale}
                </p>
              </div>

              {/* Factor 2: Sector Risk Weighting */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  2. Sector Exposure (35%)
                </span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="text-amber-300 font-bold font-mono text-xs">
                    {urgency.sectorMultiplier.toFixed(2)}x Multiplier
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    ({urgency.breakdown.sectorRiskScore} pts)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Evaluates systemic impact across designated sectors ({regulation.targetSectors.slice(0, 2).join(', ') || 'Cross-sector'}).
                </p>
              </div>

              {/* Factor 3: Upcoming Deadlines */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  3. Deadline Proximity (30%)
                </span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white font-bold text-xs">{urgency.targetDeadline}</span>
                  <span className="text-amber-400 text-[10px] font-mono">
                    ({urgency.daysRemaining}d left)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Next scheduled compliance review, statutory amendment, or supervisory audit milestone.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              * {urgency.urgencyRationale}
            </p>
          </div>
        )}

        {/* Title */}
        <div className="mt-3">
          <h3 className="text-base font-bold text-white tracking-tight">{regulation.name}</h3>
          {regulation.arabicName && (
            <p className="text-xs text-slate-400 font-arabic mt-0.5" dir="rtl">
              {regulation.arabicName}
            </p>
          )}
        </div>

        {/* Scope Summary */}
        <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">{regulation.scopeSummary}</p>

        {/* Target Sectors */}
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Sector Applicability:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {regulation.targetSectors.map((sector) => (
              <span
                key={sector}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-800/80 text-slate-300 border border-slate-700 font-medium"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>

        {/* Version & Timeline Lifecycle Strip */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <History className="w-3 h-3 text-cyan-400" />
              <span>Version</span>
            </span>
            <span
              className="font-mono font-semibold text-cyan-300 text-xs truncate block mt-0.5"
              title={regulation.currentVersion || `v${regulation.yearEnacted}.1`}
            >
              {regulation.currentVersion || `v${regulation.yearEnacted}.1`}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Enacted</span>
            </span>
            <span className="font-mono font-bold text-cyan-300 text-xs block mt-0.5">
              {formatEnactmentPeriod(regulation.enactmentPeriod, regulation.effectiveDate, regulation.yearEnacted)}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Audit Review</span>
            </span>
            <span className="font-semibold text-amber-300 text-xs block mt-0.5 truncate" title={regulation.auditTimeline || getAuditTimelineDefault(regulation.auditFrequency)}>
              {regulation.auditFrequency || 'Annually'}
            </span>
            <span className="text-[9px] text-slate-400 block truncate" title={regulation.auditTimeline || getAuditTimelineDefault(regulation.auditFrequency)}>
              {regulation.auditTimeline || getAuditTimelineDefault(regulation.auditFrequency)}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Scale className="w-3 h-3 text-slate-400" />
              <span>Enforcement</span>
            </span>
            <span className="font-medium text-slate-200 text-xs block mt-0.5">
              {regulation.effectiveDate}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Last Verified</span>
            </span>
            <span className="font-medium text-emerald-300 text-xs block mt-0.5">
              {regulation.lastUpdated}
            </span>
          </div>
        </div>

        {/* Control Structure High-Level Stats */}
        <div className="mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-400 text-[11px] block">Control Domains</span>
              <span className="font-bold text-white text-sm">{regulation.controlStructure.domainsCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 text-[11px] block">Sub-Domains</span>
              <span className="font-bold text-white text-sm">{regulation.controlStructure.subDomainsCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Controls / Articles</span>
              <span className="font-bold text-emerald-400 text-sm">
                {regulation.controlStructure.totalControlsCount}
              </span>
            </div>
          </div>

          {/* Action Links & Version Diff Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {onCompare && (
              <button
                type="button"
                onClick={() => onCompare(regulation.id)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                title="Compare this framework against another regulation for overlap and LOE"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>Compare Framework</span>
              </button>
            )}

            {onRedlinePolicy && (
              <button
                type="button"
                onClick={() => onRedlinePolicy(regulation.id)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                title="Redline and benchmark your draft policy against this regulation in real time"
              >
                <PenTool className="w-3.5 h-3.5 text-rose-400" />
                <span>AI Redline Policy</span>
              </button>
            )}

            {regulation.versionDiffId && onViewDiff && (
              <button
                type="button"
                onClick={() => onViewDiff(regulation.versionDiffId!)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 flex items-center space-x-1.5 transition-colors shadow-sm"
                title="View granular diff between previous version and latest version"
              >
                <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Compare Version Diff</span>
              </button>
            )}

            {regulation.versionHistory && regulation.versionHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              >
                <History className="w-3 h-3 text-slate-400" />
                <span>Timeline ({regulation.versionHistory.length})</span>
                {showVersionHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Official Portal Link with Verified / Unverified Indicator */}
            {(() => {
              const audit = getLinkAudit ? getLinkAudit(regulation.id, 'officialUrl') : undefined;
              // Three states, so we never assert "Verified 200 OK" for a link we
              // have not actually probed:
              //   - broken   : an audit ran and the link failed reachability
              //   - verified : an audit ran and confirmed the link is reachable
              //   - unchecked: no audit has run yet (default) -> neutral status
              const isBroken = audit?.isBroken === true;
              const isVerified = audit?.isReachable === true && !audit?.isBroken;

              return (
                <div className="inline-flex items-center space-x-1.5">
                  <a
                    href={regulation.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border flex items-center space-x-1.5 transition-colors group ${
                      isBroken
                        ? 'border-rose-500/50 hover:border-rose-500'
                        : 'border-slate-700 hover:border-emerald-500/50'
                    }`}
                    title={`Direct link to statutory authority portal: ${regulation.officialUrl}`}
                  >
                    <ShieldCheck
                      className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                        isBroken ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    />
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-300" />
                  </a>

                  {/* Reachability Status Indicator: Verified / Unverified / Not checked */}
                  {isBroken ? (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40"
                      title={`Statutory Link Check: Unreachable or missing (${audit?.statusText || 'HTTP 404/Error'}) as of ${audit?.lastChecked || 'last daemon scan'}. Some government portals block automated checks, so a link flagged here may still open in a browser. Flagged for admin remediation.`}
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Unverified / Missing</span>
                    </span>
                  ) : isVerified ? (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      title={`Statutory Link Check: Reachable (HTTP ${audit?.status || 200} OK) • Last Checked: ${audit?.lastChecked || 'recent daemon scan'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>Verified (200 OK)</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30"
                      title="Statutory Link Check: not yet independently verified. Run the Link Integrity audit in the Admin Console to confirm reachability."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span>Not checked</span>
                    </span>
                  )}

                  {/* Button to suggest link correction to admin */}
                  <button
                    type="button"
                    onClick={() => setSuggestModal({ isOpen: true, linkType: 'officialUrl' })}
                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
                    title="Suggest a verified working URL for this regulation to the admin"
                  >
                    <Link2 className="w-2.5 h-2.5" />
                    <span>Suggest Link</span>
                  </button>
                </div>
              );
            })()}

            {onExportSingle && (
              <button
                type="button"
                onClick={() => onExportSingle(regulation.id)}
                className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Export compliance report & crosswalk for this regulation"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export Report</span>
              </button>
            )}

            {/* Suggest a Correction (non-admin authenticated users only) */}
            {canSuggestCorrection && (
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(true)}
                className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                title="Propose a correction to any field of this regulation for admin review"
              >
                <PencilLine className="w-3 h-3 text-indigo-300" />
                <span>Suggest Correction</span>
              </button>
            )}

            {/* Gazette PDF Document Link with Verified vs Missing Indicator */}
            {regulation.documentPdfUrl && (() => {
              const pdfAudit = getLinkAudit ? getLinkAudit(regulation.id, 'documentPdfUrl') : undefined;
              const isPdfBroken = pdfAudit?.isBroken === true;
              const isPdfVerified = pdfAudit?.isReachable === true && !pdfAudit?.isBroken;

              return (
                <div className="inline-flex items-center space-x-1.5">
                  <a
                    href={regulation.documentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (addAuditLog) {
                        addAuditLog(
                          'REGULATORY_DOWNLOAD',
                          `${regulation.code} Official PDF`,
                          `Accessed / downloaded official sovereign PDF gazette for ${regulation.name} (${regulation.authority}, ${countryName}).`
                        );
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border flex items-center space-x-1.5 transition-colors ${
                      isPdfBroken
                        ? 'border-amber-500/50 hover:border-amber-500'
                        : 'border-slate-700 hover:border-red-500/40'
                    }`}
                    title={`Direct link to official statutory PDF gazette: ${regulation.documentPdfUrl}`}
                  >
                    <FileText className={`w-3.5 h-3.5 ${isPdfBroken ? 'text-amber-400' : 'text-red-400'}`} />
                    <span>PDF Document</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {/* PDF Reachability Status: Verified / Missing / Not checked */}
                  {isPdfBroken ? (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40"
                      title={`PDF Gazette Check: PDF Missing or unreachable (${pdfAudit?.statusText || 'Inaccessible'}) as of ${pdfAudit?.lastChecked || 'last daemon scan'}. Automated checks can be blocked by the portal, so the PDF may still open in a browser. Flagged for admin verification.`}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>PDF Missing</span>
                    </span>
                  ) : isPdfVerified ? (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      title={`PDF Gazette Check: Verified Reachable (HTTP ${pdfAudit?.status || 200} OK) • Last Checked: ${pdfAudit?.lastChecked || 'recent daemon scan'}`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>PDF Verified</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30"
                      title="PDF Gazette Check: not yet independently verified. Run the Link Integrity audit in the Admin Console to confirm reachability."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span>PDF Not checked</span>
                    </span>
                  )}

                  {/* Suggest PDF Link button */}
                  {isPdfBroken && (
                    <button
                      type="button"
                      onClick={() => setSuggestModal({ isOpen: true, linkType: 'documentPdfUrl' })}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
                      title="Suggest a verified working PDF gazette link to the admin"
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      <span>Suggest PDF</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Attached Documents (all users download; admins upload). Renders nothing
            for non-admins when a regulation has no documents, so it is zero-impact. */}
        <RegulationDocuments regulationId={regulation.id} regulationCode={regulation.code} />

        {/* Smart Insight Summary Card (Powered by Autonomous AI Model, Toggleable by Admin) */}
        {featureFlags?.smartInsights !== false && (
          <SmartInsightCard regulation={regulation} countryName={countryName} />
        )}

        {/* Expandable Version History Accordion */}
        {showVersionHistory && regulation.versionHistory && (
          <div className="mt-3 p-3.5 bg-slate-950/80 rounded-lg border border-cyan-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Version Evolution & Release Timeline</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {regulation.versionHistory.length} Releases Documented
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {regulation.versionHistory.map((v, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-white">{v.version}</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                          v.status === 'Current Version'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : v.status === 'Superseded'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{v.summaryOfChanges}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 space-y-0.5 shrink-0 font-mono">
                    <div>Issued: {v.releaseDate}</div>
                    <div className="text-emerald-400">Effective: {v.effectiveDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordion Toggle for Domains & Controls */}
      <div className="border-t border-slate-800 bg-slate-900/50 px-5 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            {isExpanded ? 'Hide Control Domains & Mappings' : 'View Control Domains & Global Mappings'}
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[11px] text-slate-400">
          Last Verified: {regulation.lastUpdated}
        </span>
      </div>

      {/* Expandable Domain & Controls Details */}
      {isExpanded && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/40 space-y-4">
          {/* Domains List */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Formal Control Domains Architecture:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {regulation.controlStructure.domainList.map((domain, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2"
                >
                  <span className="font-mono text-emerald-400 font-bold text-[11px] mt-0.5">
                    0{idx + 1}
                  </span>
                  <span>{domain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Granular Controls with Clause Reference & Standard Mapping */}
          {regulation.sampleControls && regulation.sampleControls.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-800 gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <span>Granular Statutory Requirements &amp; Global Mappings:</span>
                    {aiAnalysis?.isLiveGemini && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        AI EXTRACTED
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Each requirement explicitly features a Compliance Requirement Confidence score (Mandatory vs. Guideline) extracted &amp; analyzed by Autonomous AI Model.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowLegendModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                    title="View Confidence Scoring Methodology and Interval Legend"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Scoring Legend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchRequirementConfidence(true)}
                    disabled={isLoadingConfidence}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/40 flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Re-run Autonomous AI extraction and legal confidence analysis on these requirements"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingConfidence ? 'animate-spin' : ''}`} />
                    <span>{isLoadingConfidence ? 'Analyzing...' : 'Re-analyze'}</span>
                  </button>
                </div>
              </div>

              {/* Representative-sample notice — clarifies that the controls
                  shown are a curated key subset, not the regulation's full
                  control catalogue, so users aren't misled into thinking these
                  are the only controls. */}
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Showing <strong>{regulation.sampleControls.length} key sample control{regulation.sampleControls.length === 1 ? '' : 's'}</strong> — a representative subset selected for illustration
                  {typeof regulation.controlStructure?.totalControlsCount === 'number' && regulation.controlStructure.totalControlsCount > regulation.sampleControls.length
                    ? <> out of approximately <strong>{regulation.controlStructure.totalControlsCount}</strong> total controls / articles in this regulation.</>
                    : <>.</>} This is not the complete control set.
                </span>
              </div>

              {/* Minimum Confidence Level Active Filter Notice */}
              {minConfidenceFilter > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      Filtered by Minimum Confidence: <strong>&ge;{minConfidenceFilter}%</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-700/60">
                    {displayedControls.length} of {regulation.sampleControls.length} clauses match
                  </span>
                </div>
              )}

              {displayedControls.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-1">
                  <p>No requirement clauses meet the active &ge;{minConfidenceFilter}% confidence threshold.</p>
                  <p className="text-[11px] text-slate-500">Lower the Minimum Confidence Level in the filters above to inspect all statutory controls.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedControls.map((ctrl) => {
                  const reqConf = getRequirementConfidence(ctrl);

                  return (
                    <div
                      key={ctrl.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-xs hover:border-slate-700/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {ctrl.code}
                          </span>
                          <span className="font-bold text-white">{ctrl.title}</span>
                        </div>

                        {/* Explicit Compliance Requirement Confidence Visual Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-xs transition-all ${
                              reqConf.label === 'Mandatory'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                                : reqConf.label === 'Conditional'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/25'
                            }`}
                            title={`Compliance Requirement Confidence: ${reqConf.label} (${reqConf.confidenceScore}% [${reqConf.confidenceInterval}]). Rationale: ${reqConf.rationale} (Analyzed by Autonomous AI Model)`}
                          >
                            <Scale className="w-3 h-3 shrink-0 opacity-80" />
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden md:inline">
                              Compliance Requirement Confidence:
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-black/40 text-white">
                              {reqConf.label}
                            </span>
                            <span className="font-mono font-bold text-white bg-slate-900/60 px-1 py-0.2 rounded border border-slate-700/60">
                              {reqConf.confidenceScore}%
                            </span>
                            <span className="font-mono text-[10px] opacity-80 hidden lg:inline">
                              [{reqConf.confidenceInterval}]
                            </span>
                            {reqConf.isGeminiExtracted && (
                              <span className="text-cyan-300 flex items-center" title="Extracted by Autonomous AI Service">
                                <Sparkles className="w-3 h-3 ml-0.5" />
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {ctrl.clauseReference}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-xs">{ctrl.description}</p>

                      {/* Autonomous AI Statutory Jurist Rationale Bar */}
                      {reqConf.rationale && (
                        <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-start sm:items-center space-x-1.5 text-slate-300">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 shrink-0 uppercase tracking-wider">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              Autonomous AI Jurist Rationale
                            </span>
                            <span className="italic text-slate-300 leading-snug">
                              "{reqConf.rationale}"
                            </span>
                          </div>
                          {reqConf.statutoryKeyword && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300 shrink-0 self-start sm:self-auto">
                              <span className="text-slate-500 font-sans">Trigger:</span>
                              <span>{reqConf.statutoryKeyword}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Mappings */}
                      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-400">Global Crosswalk:</span>

                        {ctrl.mapping.nistCsf && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                            NIST CSF: {ctrl.mapping.nistCsf}
                          </span>
                        )}

                        {ctrl.mapping.iso27001 && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                            ISO 27001: {ctrl.mapping.iso27001}
                          </span>
                        )}

                        {ctrl.mapping.csaCcm && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            CSA CCM: {ctrl.mapping.csaCcm}
                          </span>
                        )}
                      </div>

                      {onInterpretControl && (
                        <button
                          type="button"
                          onClick={() =>
                            onInterpretControl(
                              ctrl.description,
                              ctrl.code,
                              regulation.name,
                              countryName
                            )
                          }
                          className="px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 flex items-center space-x-1.5 transition-colors cursor-pointer text-[11px] font-semibold"
                          title="Interpret this control clause with AI and full multi-standard alignment"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Interpret Clause</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {/* Confidence Level Scoring Legend Modal */}
      <ConfidenceLevelLegendModal
        isOpen={showLegendModal}
        onClose={() => setShowLegendModal(false)}
      />

      {/* Suggest Link Correction Modal */}
      <SuggestLinkModal
        isOpen={suggestModal.isOpen}
        onClose={() => setSuggestModal((prev) => ({ ...prev, isOpen: false }))}
        regulation={regulation}
        initialLinkType={suggestModal.linkType}
        countryName={countryName}
      />

      {/* Suggest Full Field Correction Modal */}
      {isCorrectionModalOpen && (
        <SuggestCorrectionModal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          regulation={regulation}
          countryName={countryName}
        />
      )}
    </div>
  );
};
