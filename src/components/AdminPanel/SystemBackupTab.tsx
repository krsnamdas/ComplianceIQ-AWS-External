import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export const SystemBackupTab: React.FC = () => {
  const {
    exportFullBackupJSON,
    importFullBackupJSON,
    resetRegulationsToDefault,
    resetFeatureFlags,
    regulations,
    users,
  } = useAdmin();

  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importFullBackupJSON(content);
      if (success) {
        setImportStatus({
          success: true,
          message: 'System configuration and regulations snapshot restored successfully!',
        });
      } else {
        setImportStatus({
          success: false,
          message: 'Invalid snapshot format. Please ensure the JSON file is valid.',
        });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>System State Persistence, Backup & Disaster Recovery</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Export a full JSON database snapshot containing all customized regulations, link updates,
            feature toggle configurations, and user accounts.
          </p>
        </div>
      </div>

      {importStatus && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center space-x-2 border animate-in fade-in duration-200 ${
            importStatus.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Export Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Export Full JSON Snapshot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download the entire active state: {regulations.length} statutory regulations,{' '}
              {users.length} user profiles, custom official links, and feature flags.
            </p>
          </div>

          <button
            onClick={exportFullBackupJSON}
            className="mt-5 w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Import & Restore Snapshot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a previously exported backup file to restore regulations, user accounts, and
              system flags to that point in time.
            </p>
          </div>

          <label className="mt-5 w-full py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-sm text-center">
            <Upload className="w-3.5 h-3.5" />
            <span>Select JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Factory Reset Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Reset to Statutory Baseline</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discard all custom edits, restored regulations, and feature overrides, reverting
              back to the verified official statutory baseline.
            </p>
          </div>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to reset all regulations and feature flags to factory default? Any unsaved edits will be lost.'
                )
              ) {
                resetRegulationsToDefault();
                resetFeatureFlags();
                setImportStatus({
                  success: true,
                  message: 'System successfully reset to verified statutory baseline.',
                });
                setTimeout(() => setImportStatus(null), 5000);
              }
            }}
            className="mt-5 w-full py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Factory Reset Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
