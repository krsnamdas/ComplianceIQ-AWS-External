import React, { useState, useEffect } from 'react';
import { VersionDiff } from '../types/regulatory';
import { MENAT_VERSION_DIFFS } from '../data/versionDiffsData';
import {
  GitCompare,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  Bookmark,
} from 'lucide-react';

interface VersionDiffViewerProps {
  initialSelectedDiffId?: string;
  onBackToRegulations?: () => void;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  initialSelectedDiffId,
  onBackToRegulations,
}) => {
  const [selectedDiffId, setSelectedDiffId] = useState<string>(
    initialSelectedDiffId || MENAT_VERSION_DIFFS[0].id
  );

  useEffect(() => {
    if (initialSelectedDiffId) {
      setSelectedDiffId(initialSelectedDiffId);
    }
  }, [initialSelectedDiffId]);

  const activeDiff =
    MENAT_VERSION_DIFFS.find((d) => d.id === selectedDiffId) || MENAT_VERSION_DIFFS[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GitCompare className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Regulatory Version Diff & Statutory Evolution Analyzer
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Side-by-side comparative analysis between previous and latest regulatory revisions across MENAT, highlighting operational impacts, compliance delta, and transition deadlines.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              {MENAT_VERSION_DIFFS.length} Key Evolution Diffs
            </span>
          </div>
        </div>
      </div>

      {/* Selector Pills */}
      <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-thin">
        {MENAT_VERSION_DIFFS.map((diff) => {
          const isSelected = diff.id === activeDiff.id;
          return (
            <button
              key={diff.id}
              onClick={() => setSelectedDiffId(diff.id)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{diff.countryFlag}</span>
              <span className="font-semibold">{diff.regulationCode}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {diff.changeType}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Diff Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        {/* Title and Versions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{activeDiff.countryFlag}</span>
              <span className="font-semibold text-slate-300">{activeDiff.countryName}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400 font-bold">{activeDiff.regulationCode}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                {activeDiff.changeType}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1.5">{activeDiff.regulationName}</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-4xl leading-relaxed">
              {activeDiff.headlineSummary}
            </p>
          </div>

          {activeDiff.officialAmendmentUrl && (
            <div className="shrink-0">
              <a
                href={activeDiff.officialAmendmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              >
                <span>Official Amendment Gazette</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Timeline Progression Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Previous Version
            </span>
            <div className="mt-1 font-bold text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeDiff.previousVersion}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{activeDiff.previousDate}</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Latest Enacted Version
            </span>
            <div className="mt-1 font-bold text-emerald-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeDiff.latestVersion}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Effective: {activeDiff.latestDate}</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Enforcement & Sunset Deadline
            </span>
            <div className="mt-1 font-bold text-white flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeDiff.transitionDeadline || 'Mandatory with immediate effect'}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Statutory grace period status</span>
          </div>
        </div>

        {/* Key Differences Table / Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Substantive Legal & Technical Differences</span>
            </h4>
            <span className="text-xs text-slate-400">
              {activeDiff.keyDifferences.length} Major Alterations Cataloged
            </span>
          </div>

          <div className="space-y-4">
            {activeDiff.keyDifferences.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-all"
              >
                {/* Category & Impact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      0{idx + 1}
                    </span>
                    <h5 className="font-bold text-sm text-white">{item.category}</h5>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center space-x-1 self-start sm:self-auto ${
                      item.impactLevel === 'Critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : item.impactLevel === 'High'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>{item.impactLevel} Operational Impact</span>
                  </span>
                </div>

                {/* Side-by-Side Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Previous State */}
                  <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 space-y-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                      Previous Requirement / Baseline:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-xs">{item.previousState}</p>
                  </div>

                  {/* New State */}
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      New Mandatory Standard (Latest):
                    </span>
                    <p className="text-emerald-100/90 leading-relaxed text-xs">{item.newState}</p>
                  </div>
                </div>

                {/* Practical Guidance */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start space-x-2 text-xs">
                  <Bookmark className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-200">Advisory Action:</strong> {item.practicalGuidance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items & Migration Checklist */}
        <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Mandatory Transition & Migration Checklist:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {activeDiff.complianceActionItems.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Sectors */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Directly Affected Sectors:</span>
          {activeDiff.affectedSectors.map((sector) => (
            <span
              key={sector}
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium"
            >
              {sector}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
