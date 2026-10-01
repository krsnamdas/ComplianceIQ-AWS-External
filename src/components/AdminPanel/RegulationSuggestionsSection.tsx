import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PencilLine, CheckCircle2, XCircle, Clock, Check, X, ArrowRight, UserCheck } from 'lucide-react';

/**
 * Admin review section for user-submitted regulation field corrections.
 * Renders each suggestion with a per-field before -> after diff and
 * Accept / Reject actions. Accept applies the changes to the regulation
 * (persisted to the region file) via reviewRegulationSuggestion.
 */
export const RegulationSuggestionsSection: React.FC = () => {
  const { regulationSuggestions = [], reviewRegulationSuggestion, countries } = useAdmin();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [feedback, setFeedback] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: regulationSuggestions.length,
      pending: regulationSuggestions.filter((s) => s.status === 'pending').length,
      accepted: regulationSuggestions.filter((s) => s.status === 'accepted').length,
      rejected: regulationSuggestions.filter((s) => s.status === 'rejected').length,
    };
  }, [regulationSuggestions]);

  const filtered = useMemo(() => {
    return regulationSuggestions.filter((s) => statusFilter === 'all' || s.status === statusFilter);
  }, [regulationSuggestions, statusFilter]);

  const handleAccept = (id: string, code: string) => {
    reviewRegulationSuggestion(id, 'accept', 'Approved and applied by administrator.');
    setFeedback(`Approved — the correction for ${code} has been applied to the regulation and saved.`);
    setTimeout(() => setFeedback(null), 4000);
  };
  const handleReject = (id: string, code: string) => {
    reviewRegulationSuggestion(id, 'reject', 'Rejected after manual review.');
    setFeedback(`Suggestion for ${code} was rejected.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <PencilLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                User Regulation Corrections
              </h2>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono animate-pulse">
                  {stats.pending} PENDING
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Field-level correction proposals submitted by compliance users. Accept to apply the changes
              to the regulation; reject to discard.
            </p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-1.5">
          {(['pending', 'accepted', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s} {s !== 'all' ? `(${stats[s]})` : `(${stats.total})`}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/60 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          {statusFilter === 'pending'
            ? 'No pending regulation corrections. New user submissions will appear here.'
            : 'No regulation corrections match this filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const country = countries.find((c) => c.id === s.regulationId.split('-')[0]);
            return (
              <div key={s.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {s.regulationCode}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{s.regulationName}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{s.submittedByUserName} • {s.submittedAt}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono self-start ${
                      s.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : s.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </div>

                {/* Field changes diff */}
                <div className="space-y-2">
                  {s.changes.map((chg) => (
                    <div key={chg.field} className="text-[11px]">
                      <div className="font-semibold text-slate-300 mb-1">{chg.fieldLabel}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="flex-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-500/20 text-rose-200 line-through decoration-rose-500/50 break-all">
                          {chg.currentValue}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
                        <span className="flex-1 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 break-all">
                          {chg.suggestedValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {s.notes && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                    <span className="font-semibold text-slate-300">Submitter notes:</span> {s.notes}
                  </div>
                )}

                {/* Actions */}
                {s.status === 'pending' ? (
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleReject(s.id, s.regulationCode)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/60 text-rose-300 border border-slate-700 hover:border-rose-500/50 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(s.id, s.regulationCode)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept &amp; Apply</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-1">
                    {s.status === 'accepted' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-400" />
                    )}
                    <span>
                      {s.status === 'accepted' ? 'Applied' : 'Rejected'} by {s.reviewedBy || 'admin'} • {s.reviewedAt}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
