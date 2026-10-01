import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Regulation, RegulatoryCategory, AuditFrequency } from '../types/regulatory';
import { RegulationFieldChange } from '../types/admin';
import { PencilLine, X, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface SuggestCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  regulation: Regulation;
  countryName: string;
}

// Local option sets (mirror the admin regulation form so users pick from the same choices)
const CATEGORY_OPTIONS: { id: RegulatoryCategory; label: string }[] = [
  { id: 'tech_cyber', label: 'Cybersecurity Baseline' },
  { id: 'tech_ai', label: 'Artificial Intelligence & Algorithmic Governance' },
  { id: 'tech_data_privacy', label: 'Data Privacy & Sovereignty' },
  { id: 'tech_cloud', label: 'Cloud & Infrastructure' },
  { id: 'tech_operational_resilience', label: 'Operational Resilience' },
  { id: 'tech_ot_ics', label: 'OT / ICS & Critical Infrastructure' },
  { id: 'tech_space_quantum', label: 'Space & Quantum Technology' },
  { id: 'tech_fintech_payments', label: 'FinTech, Payments & Crypto Assets' },
  { id: 'tech_risk_others', label: 'Technology Risk & Other' },
  { id: 'non_tech_impact', label: 'Non-Tech / Broader Statutory Impact' },
];

const STATUS_OPTIONS: Regulation['status'][] = ['Enacted', 'Amended', 'Draft / Public Consultation'];
const AUDIT_FREQ_OPTIONS: AuditFrequency[] = ['Annually', 'Quarterly', 'Bi-Annually', 'Monthly', 'NA', 'Unknown'];

/**
 * A field descriptor for the suggestion form. `key` maps to a Regulation field.
 */
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Regulation Name', type: 'text' },
  { key: 'code', label: 'Code / Citation', type: 'text' },
  { key: 'authority', label: 'Issuing Authority', type: 'text' },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: CATEGORY_OPTIONS.map((c) => ({ value: c.id, label: c.label })),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
  { key: 'yearEnacted', label: 'Year Enacted', type: 'number' },
  { key: 'enactmentPeriod', label: 'Enactment Period (mm/yyyy)', type: 'text', placeholder: 'e.g. 09/2026' },
  { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
  {
    key: 'auditFrequency',
    label: 'Period of Assessment / Review',
    type: 'select',
    options: AUDIT_FREQ_OPTIONS.map((f) => ({ value: f, label: f })),
  },
  { key: 'auditTimeline', label: 'Audit Timeline & Attestation Window', type: 'text' },
  { key: 'scopeSummary', label: 'Scope & Executive Summary', type: 'textarea' },
  { key: 'officialUrl', label: 'Official Portal URL', type: 'url', placeholder: 'https://authority.gov/...' },
  { key: 'documentPdfUrl', label: 'Document PDF URL', type: 'url', placeholder: 'https://authority.gov/file.pdf' },
];

export const SuggestCorrectionModal: React.FC<SuggestCorrectionModalProps> = ({
  isOpen,
  onClose,
  regulation,
  countryName,
}) => {
  const { submitRegulationSuggestion } = useAdmin();

  // Seed the form with the regulation's current values (as strings for editing)
  const seed = () => {
    const s: Record<string, string> = {};
    FIELDS.forEach((f) => {
      const v = (regulation as unknown as Record<string, unknown>)[f.key];
      s[f.key] = v === undefined || v === null ? '' : String(v);
    });
    return s;
  };

  const [values, setValues] = useState<Record<string, string>>(seed);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStr = (key: string): string => {
    const v = (regulation as unknown as Record<string, unknown>)[key];
    return v === undefined || v === null ? '' : String(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Compute the diff: only fields whose value changed become part of the suggestion
    const changes: RegulationFieldChange[] = [];
    const proposedValues: Record<string, unknown> = {};

    for (const f of FIELDS) {
      const before = currentStr(f.key).trim();
      const after = (values[f.key] ?? '').trim();
      if (after !== before) {
        // Basic URL validation
        if (f.type === 'url' && after && !after.startsWith('http://') && !after.startsWith('https://')) {
          setError(`${f.label} must start with http:// or https://`);
          return;
        }
        let proposed: unknown = after;
        if (f.type === 'number') {
          const n = Number(after);
          if (isNaN(n)) {
            setError(`${f.label} must be a number.`);
            return;
          }
          proposed = n;
        }
        changes.push({
          field: f.key,
          fieldLabel: f.label,
          currentValue: before || '(empty)',
          suggestedValue: after || '(empty)',
        });
        proposedValues[f.key] = proposed;
      }
    }

    if (changes.length === 0) {
      setError('No changes detected. Edit at least one field to suggest a correction.');
      return;
    }

    const res = submitRegulationSuggestion(regulation.id, changes, proposedValues, notes.trim());
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNotes('');
        onClose();
      }, 1900);
    } else {
      setError(res.message);
    }
  };

  // Count changed fields for the live indicator
  const changedCount = FIELDS.filter((f) => (values[f.key] ?? '').trim() !== currentStr(f.key).trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <PencilLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Suggest a Correction</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Propose updates to any field. An administrator reviews before it goes live.
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

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Correction Submitted!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Your suggested changes were routed to the Administrator review queue. Once approved, they will
              appear across the platform.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            {/* Regulation target info */}
            <div className="px-5 pt-4 shrink-0">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400">{regulation.code}</span>
                  <span className="text-slate-400">{countryName}</span>
                </div>
                <div className="text-white font-medium">{regulation.name}</div>
              </div>
            </div>

            {/* Scrollable fields */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto text-xs">
              <p className="text-[11px] text-slate-500">
                Only fields you change will be submitted. Leave the rest as-is.
              </p>
              {FIELDS.map((f) => {
                const changed = (values[f.key] ?? '').trim() !== currentStr(f.key).trim();
                return (
                  <div key={f.key}>
                    <label className="flex items-center justify-between font-semibold text-slate-300 mb-1">
                      <span>{f.label}</span>
                      {changed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          CHANGED
                        </span>
                      )}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                        rows={3}
                        className={`w-full px-3 py-1.5 rounded-lg bg-slate-950 border text-white focus:outline-none resize-none ${
                          changed ? 'border-amber-500/60 focus:border-amber-400' : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                        className={`w-full px-3 py-1.5 rounded-lg bg-slate-950 border text-white focus:outline-none ${
                          changed ? 'border-amber-500/60' : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      >
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={values[f.key] ?? ''}
                        placeholder={f.placeholder}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                        className={`w-full px-3 py-1.5 rounded-lg bg-slate-950 border text-white focus:outline-none ${
                          changed ? 'border-amber-500/60 focus:border-amber-400' : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes for the reviewer (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Explain the source or reason for the correction (e.g. official gazette update)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-[11px] flex items-center space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                {changedCount > 0 ? (
                  <span className="text-amber-300 font-medium">{changedCount} field(s) changed</span>
                ) : (
                  'No changes yet'
                )}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changedCount === 0}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
