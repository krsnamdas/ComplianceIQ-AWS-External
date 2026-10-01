import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  X,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface PendingChangesDockProps {
  viewContext?: 'admin' | 'timeline';
}

export const PendingChangesDock: React.FC<PendingChangesDockProps> = ({ viewContext = 'admin' }) => {
  const {
    hasPendingEdits,
    totalPendingEditsCount,
    pendingTimelineEdits,
    pendingRegulationEdits,
    unstageTimelineEdit,
    unstageRegulationEdit,
    discardPendingEdits,
    applyPendingEdits,
    timelineEvents,
    regulations,
  } = useAdmin();

  const [isExpanded, setIsExpanded] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!hasPendingEdits && !successToast) {
    return null;
  }

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      const result = applyPendingEdits();
      setIsApplying(false);
      setIsExpanded(false);
      if (result.success) {
        const parts: string[] = [];
        if (result.timelineCount > 0) parts.push(`${result.timelineCount} statutory deadline${result.timelineCount === 1 ? '' : 's'}`);
        if (result.regulationCount > 0) parts.push(`${result.regulationCount} regulatory status${result.regulationCount === 1 ? '' : 'es'}`);
        setSuccessToast(`✓ Successfully applied ${parts.join(' and ')} in a single atomic transaction!`);
        setTimeout(() => setSuccessToast(null), 5000);
      }
    }, 250);
  };

  const handleDiscard = () => {
    discardPendingEdits();
    setIsExpanded(false);
  };

  const timelineKeys = Object.keys(pendingTimelineEdits);
  const regulationKeys = Object.keys(pendingRegulationEdits);

  return (
    <>
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-24 right-6 z-50 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Bottom Dock */}
      {hasPendingEdits && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 sm:p-4 text-slate-100 ring-2 ring-amber-500/30">
            {/* Top Bar inside Dock */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                      {totalPendingEditsCount} Pending {totalPendingEditsCount === 1 ? 'Change' : 'Changes'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      Unsaved Statutory Updates Staged
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Modifications to deadlines and statuses will only take effect once applied atomically.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Inspect staged changes"
                >
                  <span>Review Diffs ({totalPendingEditsCount})</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-100 border border-rose-800/50 flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Discard all pending changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Discard</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border border-emerald-400/50 flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/50 disabled:opacity-50"
                  title="Persist all staged changes in a single atomic transaction"
                >
                  {isApplying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Diffs Breakdown */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-800/90 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Staged Modifications</span>
                  <span className="text-slate-500 font-normal">Atomic commit will apply all items simultaneously</span>
                </div>

                {/* Timeline edits */}
                {timelineKeys.map((id) => {
                  const evt = timelineEvents.find((e) => e.id === id);
                  const changes = pendingTimelineEdits[id];
                  if (!changes) return null;

                  return (
                    <div
                      key={id}
                      className="p-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-cyan-400 font-bold text-[11px]">
                            {evt?.regulationCode || id}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">
                            {evt?.title || 'Statutory Timeline Event'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {evt?.countryFlag} {evt?.countryName}
                          </span>
                        </div>

                        {/* Diff badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                          {changes.deadlineDate && changes.deadlineDate !== evt?.deadlineDate && (
                            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              <Calendar className="w-3 h-3 text-rose-400" />
                              <span className="text-slate-400">Deadline:</span>
                              <span className="line-through text-slate-500">{evt?.deadlineDate}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-rose-300">{changes.deadlineDate}</span>
                            </div>
                          )}

                          {changes.transitionStartDate && changes.transitionStartDate !== evt?.transitionStartDate && (
                            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span className="text-slate-400">Grace:</span>
                              <span className="line-through text-slate-500">{evt?.transitionStartDate || 'None'}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-amber-300">{changes.transitionStartDate}</span>
                            </div>
                          )}

                          {changes.urgency && changes.urgency !== evt?.urgency && (
                            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              <span className="text-slate-400">Urgency:</span>
                              <span className="line-through text-slate-500">{evt?.urgency}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-amber-300">{changes.urgency}</span>
                            </div>
                          )}

                          {changes.status && changes.status !== evt?.status && (
                            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              <span className="text-slate-400">Status:</span>
                              <span className="line-through text-slate-500">{evt?.status}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-teal-300">{changes.status}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Unstage single item */}
                      <button
                        type="button"
                        onClick={() => unstageTimelineEdit(id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Unstage this modification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Regulation Status edits */}
                {regulationKeys.map((id) => {
                  const reg = regulations.find((r) => r.id === id);
                  const changes = pendingRegulationEdits[id];
                  if (!changes) return null;

                  return (
                    <div
                      key={id}
                      className="p-2.5 bg-slate-950/80 border border-teal-500/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-teal-400 font-bold text-[11px]">
                            {reg?.code || id}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">
                            {reg?.name || 'Regulation'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {reg?.countryId?.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                          {changes.status && changes.status !== reg?.status && (
                            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              <span className="text-slate-400">Regulatory Status:</span>
                              <span className="line-through text-slate-500">{reg?.status}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="font-bold text-teal-300">{changes.status}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => unstageRegulationEdit(id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Unstage this modification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
