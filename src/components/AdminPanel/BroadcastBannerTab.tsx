import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { SystemBroadcast } from '../../types/admin';
import {
  Megaphone,
  AlertTriangle,
  Info,
  AlertOctagon,
  Save,
  CheckCircle2,
  ExternalLink,
  Eye,
  Power,
} from 'lucide-react';

export const BroadcastBannerTab: React.FC = () => {
  const { broadcastBanner, updateBroadcastBanner } = useAdmin();

  const [formData, setFormData] = useState<SystemBroadcast>({ ...broadcastBanner });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBroadcastBanner(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Global Regulatory Advisory & Broadcast Engine</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                formData.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {formData.enabled ? 'BROADCAST ACTIVE' : 'MUTED / DISABLED'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Publish high-priority statutory advisories, mandatory compliance filing deadlines, or
            system announcements across the very top of the application for all users.
          </p>
        </div>

        <button
          onClick={() => {
            const next = !formData.enabled;
            setFormData({ ...formData, enabled: next });
            updateBroadcastBanner({ enabled: next });
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm ${
            formData.enabled
              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{formData.enabled ? 'Mute Broadcast' : 'Activate Broadcast'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Broadcast configuration published and updated system-wide!</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Live User Preview (Top-of-Screen Rendering)</span>
        </h4>

        <div className="rounded-lg overflow-hidden border border-slate-700 shadow-md">
          {formData.enabled ? (
            <div
              className={`p-3 text-xs flex items-center justify-between gap-3 ${
                formData.level === 'critical'
                  ? 'bg-rose-950/90 text-rose-200 border-rose-600/40'
                  : formData.level === 'warning'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-600/40'
                  : 'bg-sky-950/90 text-sky-200 border-sky-600/40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {formData.level === 'critical' ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                ) : formData.level === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                )}

                <div className="flex items-center space-x-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      formData.level === 'critical'
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                        : formData.level === 'warning'
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                        : 'bg-sky-600/30 text-sky-300 border border-sky-500/50'
                    }`}
                  >
                    {formData.title || 'Official Advisory'}
                  </span>
                  <span className="text-slate-100 font-medium">
                    {formData.message || 'Advisory text goes here...'}
                  </span>
                </div>
              </div>

              {formData.actionUrl && (
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white/10 text-white font-semibold shrink-0">
                  <span>{formData.actionLabel || 'Inspect Directive'}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-950 text-slate-500 text-center italic text-xs">
              Broadcast is currently muted. No banner will be displayed to users.
            </div>
          )}
        </div>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Megaphone className="w-4 h-4 text-emerald-400" />
          <span>Configure Broadcast Parameters</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Alert Severity Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="warning">Warning / Statutory Deadline (Amber)</option>
              <option value="critical">Critical / Immediate Action Mandate (Red)</option>
              <option value="info">Informational / General Circular (Blue)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Headline Badge Title</label>
            <input
              type="text"
              required
              placeholder="e.g. SAMA Mandate, Statutory Audit Alert, NCA Urgent Circular"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Broadcast Message Body</label>
          <textarea
            rows={2}
            required
            placeholder="Detailed alert explanation displayed on the banner..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Call-to-Action Link URL (Optional)</label>
            <input
              type="url"
              placeholder="https://official-portal.gov/circular-102.pdf"
              value={formData.actionUrl || ''}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Call-to-Action Button Label</label>
            <input
              type="text"
              placeholder="e.g. Review Directive, Open Gazette"
              value={formData.actionLabel || ''}
              onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Last updated: {formData.updatedAt} by {formData.author}
          </span>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Broadcast</span>
          </button>
        </div>
      </form>
    </div>
  );
};
