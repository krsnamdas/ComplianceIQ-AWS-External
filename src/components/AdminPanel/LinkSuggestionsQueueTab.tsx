import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { RegulationSuggestionsSection } from './RegulationSuggestionsSection';
import {
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Globe2,
  FileText,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const LinkSuggestionsQueueTab: React.FC = () => {
  const { linkSuggestions = [], reviewLinkSuggestion, regulations, countries } = useAdmin();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const stats = useMemo(() => {
    const pending = linkSuggestions.filter((s) => s.status === 'pending').length;
    const accepted = linkSuggestions.filter((s) => s.status === 'accepted').length;
    const rejected = linkSuggestions.filter((s) => s.status === 'rejected').length;
    return {
      total: linkSuggestions.length,
      pending,
      accepted,
      rejected,
    };
  }, [linkSuggestions]);

  const filteredSuggestions = useMemo(() => {
    return linkSuggestions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          s.regulationCode.toLowerCase().includes(q) ||
          s.regulationName.toLowerCase().includes(q) ||
          s.submittedByUserName.toLowerCase().includes(q) ||
          s.suggestedUrl.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [linkSuggestions, statusFilter, searchTerm]);

  const handleAccept = (suggestionId: string, regCode: string) => {
    reviewLinkSuggestion(suggestionId, 'accept', 'Approved and verified by administrator.');
    setFeedbackMessage({
      type: 'success',
      text: `Approved! Link for ${regCode} has been updated in the statutory database and logged to the audit trail.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleReject = (suggestionId: string, regCode: string) => {
    reviewLinkSuggestion(suggestionId, 'reject', 'Rejected after manual review.');
    setFeedbackMessage({
      type: 'info',
      text: `Suggestion for ${regCode} has been marked as rejected.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* User Regulation Field-Correction Suggestions (all fields) */}
      <RegulationSuggestionsSection />

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  User Link Suggestions &amp; Correction Queue
                </h2>
                {stats.pending > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono animate-pulse">
                    {stats.pending} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review submitted URL corrections from compliance users for unverified, 404, or updated sovereign gazettes.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-500/30 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Pending Review</span>
            </div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{stats.pending}</div>
            <div className="text-[10px] text-slate-400 mt-1">Awaiting admin action</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('accepted')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'accepted'
                ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Accepted &amp; Applied</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.accepted}</div>
            <div className="text-[10px] text-slate-400 mt-1">Updated in database</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-500/30 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-rose-400 flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>Rejected</span>
            </div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{stats.rejected}</div>
            <div className="text-[10px] text-slate-400 mt-1">Declined suggestions</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800/90 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-slate-400">Total Submissions</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-1">All lifecycle states</div>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by regulation, code, user, or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Link Suggestions Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'All user link suggestions have been reviewed and resolved! New submissions will appear here.'
                : 'No link suggestions matched your current filter criteria.'}
            </p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => {
            const reg = regulations.find((r) => r.id === suggestion.regulationId);
            const country = reg ? countries.find((c) => c.id === reg.countryId) : undefined;

            return (
              <div
                key={suggestion.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {suggestion.regulationCode}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{suggestion.regulationName}</h4>
                      <p className="text-[11px] text-slate-400">
                        {country ? country.name : 'MENAT Region'} •{' '}
                        <strong className="text-slate-300">{reg?.authority || 'Sovereign Regulator'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        suggestion.linkType === 'officialUrl'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {suggestion.linkType === 'officialUrl' ? (
                        <>
                          <Globe2 className="w-3 h-3" />
                          <span>Official Portal</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>PDF Document</span>
                        </>
                      )}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase font-mono border ${
                        suggestion.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : suggestion.status === 'accepted'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {suggestion.status}
                    </span>
                  </div>
                </div>

                {/* Submitter & Justification */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 gap-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      Submitted by: <strong className="text-slate-200">{suggestion.submittedByUserName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.submittedAt}</span>
                  </div>
                </div>

                {suggestion.notes && (
                  <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-slate-400 block mb-0.5">Submitter Note:</span>
                    <p className="italic">{suggestion.notes}</p>
                  </div>
                )}

                {/* URL Comparison Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Current URL */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Current Stored Link
                    </span>
                    <div className="text-slate-400 font-mono break-all truncate">
                      {suggestion.currentUrl || 'None recorded'}
                    </div>
                  </div>

                  {/* Suggested URL */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                        Suggested Working Link
                      </span>
                      <a
                        href={suggestion.suggestedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-indigo-300 hover:text-white flex items-center space-x-1 font-semibold underline cursor-pointer"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-indigo-200 font-mono font-bold break-all select-all">
                      {suggestion.suggestedUrl}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 font-mono">
                    {suggestion.status === 'accepted' && (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved &amp; updated by {suggestion.reviewedBy || 'Admin'} at {suggestion.reviewedAt}</span>
                      </span>
                    )}
                    {suggestion.status === 'rejected' && (
                      <span className="text-rose-400 flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Declined by {suggestion.reviewedBy || 'Admin'} at {suggestion.reviewedAt}</span>
                      </span>
                    )}
                  </div>

                  {suggestion.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleReject(suggestion.id, suggestion.regulationCode)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(suggestion.id, suggestion.regulationCode)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept &amp; Apply Link</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
