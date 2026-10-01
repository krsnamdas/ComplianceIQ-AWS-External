import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Regulation } from '../types/regulatory';
import {
  Link2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  FileText,
  Globe2,
} from 'lucide-react';

interface SuggestLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  regulation: Regulation;
  initialLinkType?: 'officialUrl' | 'documentPdfUrl';
  countryName: string;
}

export const SuggestLinkModal: React.FC<SuggestLinkModalProps> = ({
  isOpen,
  onClose,
  regulation,
  initialLinkType = 'officialUrl',
  countryName,
}) => {
  const { submitLinkSuggestion, currentUser, isAuthenticated } = useAdmin();
  const [linkType, setLinkType] = useState<'officialUrl' | 'documentPdfUrl'>(initialLinkType);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl =
    linkType === 'officialUrl' ? regulation.officialUrl : regulation.documentPdfUrl || 'Not provided';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = suggestedUrl.trim();
    if (!trimmed) {
      setError('Please provide a valid URL.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('URL must begin with https:// or http://');
      return;
    }

    const res = submitLinkSuggestion(regulation.id, linkType, trimmed, notes.trim());
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSuggestedUrl('');
        setNotes('');
        onClose();
      }, 1800);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Submit Statutory Link Correction
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Send verified official link to compliance administrator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Link Correction Submitted!</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Your suggested link has been routed to the Administrator Link Review Queue for immediate verification and approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Regulation Target Info */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">{regulation.code}</span>
                <span className="text-slate-400">{countryName}</span>
              </div>
              <div className="text-white font-medium">{regulation.name}</div>
              <div className="text-[11px] text-slate-400">
                Authority: <strong className="text-slate-300">{regulation.authority}</strong>
              </div>
            </div>

            {/* Target Link Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Link to Update
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLinkType('officialUrl')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                    linkType === 'officialUrl'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Official Gazette Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('documentPdfUrl')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                    linkType === 'documentPdfUrl'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">PDF Gazette Document</span>
                </button>
              </div>
            </div>

            {/* Current Recorded Link */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                Current Recorded Link
              </label>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 truncate">
                {currentUrl}
              </div>
            </div>

            {/* Suggested URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verified Working URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://official-portal.gov.sa/regulations/..."
                value={suggestedUrl}
                onChange={(e) => setSuggestedUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Notes / Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source Notes / Verification Details
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Verified working link from official ministerial circular gazette archive..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submitter Info */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>
                Submitting as:{' '}
                <strong className="text-white font-mono">
                  {isAuthenticated ? currentUser.username : 'Compliance Guest'}
                </strong>
              </span>
              <span className="text-slate-500">Subject to Admin Review</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Suggestion to Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
