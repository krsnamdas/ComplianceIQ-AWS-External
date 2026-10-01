import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { RegulatoryUpdate } from '../../types/regulatory';
import {
  BellRing,
  ExternalLink,
  Pencil,
  Check,
  X,
  Building,
  Clock,
  Globe2,
  Link2,
} from 'lucide-react';

/**
 * Admin editor for the Regional Regulatory Digest feed.
 * ---------------------------------------------------------------------------
 * The digest updates are file-backed (data/regions/<REGION>/digest-updates.json)
 * and surfaced via AdminContext.digestUpdates. This tab lets an admin correct
 * each alert's "Official Gazette" link (sourceUrl) and core presentation fields
 * without touching code. Saving persists through updateDigestUpdate -> the
 * server PUT endpoint -> the region JSON file.
 */
export const DigestFeedTab: React.FC = () => {
  const { digestUpdates, updateDigestUpdate } = useAdmin();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<RegulatoryUpdate>>({});

  const startEdit = (u: RegulatoryUpdate) => {
    setEditingId(u.id);
    setDraft({
      title: u.title,
      authority: u.authority,
      summary: u.summary,
      sourceUrl: u.sourceUrl,
      verifiedOfficialSource: u.verifiedOfficialSource,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = (id: string) => {
    updateDigestUpdate(id, draft);
    setEditingId(null);
    setDraft({});
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header / explainer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Regional Regulatory Digest Feed</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit the alerts shown on the Regional Regulatory Digest page — including each
              alert&apos;s <span className="text-cyan-300 font-medium">Official Gazette</span> link.
              Changes persist to the region data file.
            </p>
          </div>
          <div className="ml-auto text-center px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Alerts</span>
            <span className="font-bold text-rose-400 text-sm">{digestUpdates.length}</span>
          </div>
        </div>
      </div>

      {/* Alert rows */}
      <div className="space-y-3">
        {digestUpdates.map((u) => {
          const isEditing = editingId === u.id;
          return (
            <div
              key={u.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm">{u.countryName}</span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>{u.authority}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      u.impactLevel === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : u.impactLevel === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    {u.impactLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{u.publicationDate}</span>
                </div>
              </div>

              {!isEditing ? (
                <div className="mt-3 space-y-2">
                  <h3 className="text-sm font-semibold text-white leading-snug">{u.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{u.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={u.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center space-x-1 font-mono break-all"
                      title="Open the current Official Gazette link"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[420px]">{u.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="ml-auto px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Title
                    </span>
                    <input
                      type="text"
                      value={draft.title ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Authority
                    </span>
                    <input
                      type="text"
                      value={draft.authority ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, authority: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Summary
                    </span>
                    <textarea
                      rows={3}
                      value={draft.summary ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wide flex items-center space-x-1.5">
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Official Gazette Link (sourceUrl)</span>
                    </span>
                    <input
                      type="url"
                      value={draft.sourceUrl ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, sourceUrl: e.target.value }))}
                      placeholder="https://..."
                      className="mt-1 w-full px-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.verifiedOfficialSource ?? false}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, verifiedOfficialSource: e.target.checked }))
                      }
                      className="accent-emerald-500"
                    />
                    <span>Marked as verified official source</span>
                  </label>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => saveEdit(u.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
