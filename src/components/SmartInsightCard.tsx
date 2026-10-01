import React, { useState } from 'react';
import { Regulation } from '../types/regulatory';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

interface SmartInsightCardProps {
  regulation: Regulation;
  countryName: string;
}

interface InsightBullet {
  title: string;
  impact: string;
}

interface SmartInsightResponse {
  sector: string;
  regulationCode: string;
  bullets: InsightBullet[];
  executiveSummary: string;
  model: string;
  timestamp: string;
  isLiveAI?: boolean;
}

// Comprehensive cross-industry sector list for deep analysis
const GENERAL_MENAT_SECTORS = [
  'Banking & Financial Services',
  'FinTech & Digital Payments',
  'Healthcare & Life Sciences',
  'Cloud & Enterprise SaaS',
  'Oil, Gas & Energy',
  'Telecommunications & Digital Infra',
  'Critical Infrastructure & Utilities',
  'Government & Public Sector',
  'Retail & E-Commerce',
  'Manufacturing & Industrial / OT',
  'Transportation & Logistics',
];

export const SmartInsightCard: React.FC<SmartInsightCardProps> = ({
  regulation,
  countryName,
}) => {
  // Available sectors combines regulation's specific targetSectors and common industries
  const directSectors = regulation.targetSectors || [];
  const otherSectors = GENERAL_MENAT_SECTORS.filter(
    (s) => !directSectors.some((ds) => ds.toLowerCase() === s.toLowerCase())
  );

  const initialSector = directSectors.length > 0 ? directSectors[0] : 'Banking & Financial Services';
  const [selectedSector, setSelectedSector] = useState<string>(initialSector);
  const [isLoading, setIsLoading] = useState(false);
  const [insightData, setInsightData] = useState<SmartInsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async (targetSector: string = selectedSector) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/smart-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regulationCode: regulation.code,
          regulationName: regulation.name,
          countryName: countryName,
          authority: regulation.authority,
          category: regulation.category,
          scopeSummary: regulation.scopeSummary,
          sector: targetSector,
          sampleControls: regulation.sampleControls || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: SmartInsightResponse = await response.json();
      setInsightData(data);
    } catch (err: any) {
      console.error('[Smart Insight Error]', err);
      setError('Unable to dynamically generate insight. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSector = (sec: string) => {
    setSelectedSector(sec);
    // If user selects a new sector and we already had an insight for a different sector,
    // they can click Generate Insight or we can keep old one until clicked.
  };

  const handleCopySummary = () => {
    if (!insightData) return;
    const textToCopy = `[Smart Insight Summary - ${regulation.code} for ${insightData.sector}]
Executive Summary: ${insightData.executiveSummary}

${insightData.bullets
  .map((b, idx) => `0${idx + 1}. ${b.title}\n${b.impact}`)
  .join('\n\n')}

Jurisdiction: ${countryName} (${regulation.authority})
Generated via ${insightData.model} at ${new Date(insightData.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const getBulletTheme = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          borderClass: 'border-emerald-500/20 bg-emerald-950/10',
          numberColor: 'text-emerald-400',
        };
      case 1:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          borderClass: 'border-amber-500/20 bg-amber-950/10',
          numberColor: 'text-amber-400',
        };
      case 2:
      default:
        return {
          icon: <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
          badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          borderClass: 'border-blue-500/20 bg-blue-950/10',
          numberColor: 'text-blue-400',
        };
    }
  };

  const isCurrentSectorGenerated =
    insightData !== null && insightData.sector.toLowerCase() === selectedSector.toLowerCase();

  return (
    <div className="mt-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-all">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">Smart Insight Summary</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Autonomous AI Model
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sector-specific statutory impact, architecture mandates & enforcement risks
            </p>
          </div>
        </div>

        {/* Sector Selection Control */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSector}
              onChange={(e) => handleSelectSector(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs bg-slate-900 text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              title="Select the target business sector to evaluate"
            >
              <optgroup label="Directly Targeted by Regulation">
                {directSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </optgroup>
              {otherSectors.length > 0 && (
                <optgroup label="Other Industry Sectors">
                  {otherSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Generate Insight Button */}
          <button
            type="button"
            onClick={() => handleGenerate(selectedSector)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm ${
              isLoading
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : isCurrentSectorGenerated
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
            title="Dynamically calculate sector regulatory impact via AI model"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : isCurrentSectorGenerated ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Regenerate</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Generate Insight</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Sector Suggestion Pills (if not generated yet) */}
      {!insightData && !isLoading && directSectors.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400">Quick Select:</span>
          {directSectors.slice(0, 4).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                setSelectedSector(sec);
                handleGenerate(sec);
              }}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                selectedSector === sec
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Prompt State (Before Generation) */}
      {!insightData && !isLoading && (
        <div className="mt-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              Click <strong className="text-white">Generate Insight</strong> to run dynamic AI analysis for{' '}
              <strong className="text-emerald-300">{selectedSector}</strong> under {regulation.code}.
            </p>
            <p className="text-[11px] text-slate-400">
              Evaluates core technical mandates, penalty exposure under {regulation.authority}, and critical statutory incident SLAs.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="mt-3.5 space-y-2.5 animate-pulse">
          <div className="flex items-center space-x-2 text-xs text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>
              Analyzing regulatory impact for <strong className="text-white">{selectedSector}</strong> via AI Model...
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/70 space-y-2">
            <div className="h-3.5 bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-800/70 rounded w-full"></div>
            <div className="h-3 bg-slate-800/70 rounded w-4/5"></div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/70 space-y-2">
            <div className="h-3.5 bg-slate-800 rounded w-2/5"></div>
            <div className="h-3 bg-slate-800/70 rounded w-full"></div>
            <div className="h-3 bg-slate-800/70 rounded w-3/4"></div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/70 space-y-2">
            <div className="h-3.5 bg-slate-800 rounded w-1/4"></div>
            <div className="h-3 bg-slate-800/70 rounded w-full"></div>
            <div className="h-3 bg-slate-800/70 rounded w-5/6"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleGenerate(selectedSector)}
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded font-semibold text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Generated 3-Bullet Point Summary */}
      {insightData && !isLoading && (
        <div className="mt-3 space-y-3">
          {/* Executive Synthesis Banner */}
          <div className="px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-600/30 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Impact Assessment:</span>
              <span className="italic text-emerald-300/90">{insightData.executiveSummary}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0 ml-2">
              {insightData.sector}
            </span>
          </div>

          {/* 3 Impact Bullets Grid / Stack */}
          <div className="grid grid-cols-1 gap-2.5">
            {insightData.bullets.map((bullet, idx) => {
              const theme = getBulletTheme(idx);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${theme.borderClass} transition-all hover:bg-slate-900/70`}
                >
                  <div className="flex items-start space-x-2.5">
                    <span className={`font-mono text-xs font-bold ${theme.numberColor} shrink-0 mt-0.5`}>
                      0{idx + 1}
                    </span>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center space-x-2">
                        {theme.icon}
                        <h4 className="text-xs font-bold text-white tracking-tight">{bullet.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{bullet.impact}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Footer Actions & Metadata */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-slate-400 font-mono">
                <span>Model: {insightData.model}</span>
              </span>
              <span>•</span>
              <span>Evaluated: {new Date(insightData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex items-center space-x-2">
              {selectedSector !== insightData.sector && (
                <button
                  type="button"
                  onClick={() => handleGenerate(selectedSector)}
                  className="px-2 py-1 text-[11px] rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Update for {selectedSector}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopySummary}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors font-medium"
                title="Copy 3-bullet insight summary to clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
