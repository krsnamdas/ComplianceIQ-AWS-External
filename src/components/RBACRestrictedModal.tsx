import React from 'react';
import { useRBAC, ROLES } from '../context/RBACContext';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  X,
  Check,
  Lock,
  Sparkles,
} from 'lucide-react';

export const RBACRestrictedModal: React.FC = () => {
  const { restrictedModal, closeRestrictedModal, setRole } = useRBAC();

  if (!restrictedModal.isOpen) return null;

  const handleElevate = () => {
    setRole('compliance_manager');
    closeRestrictedModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={closeRestrictedModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/70 uppercase tracking-wider">
                RBAC Access Guard
              </span>
              <span className="text-xs text-slate-400 font-mono">Permission Denied</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-1">
              Role Elevation Required
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {restrictedModal.description}
            </p>
          </div>
        </div>

        {/* Action Detail Pill */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Attempted Action:</span>
          <span className="font-bold text-amber-400 font-mono bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
            {restrictedModal.actionName}
          </span>
        </div>

        {/* Roles Comparison Matrix */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Role Permissions Overview
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Analyst Column */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-sky-400 font-bold">
                <UserCheck className="w-4 h-4" />
                <span>Analyst (Active)</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Browse 24 MENAT Portals</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>View Heatmaps & Radar</span>
                </li>
                <li className="flex items-center space-x-1.5 text-rose-400">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Trigger Live Scraper</span>
                </li>
                <li className="flex items-center space-x-1.5 text-rose-400">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Manage Watchlist Pins</span>
                </li>
                <li className="flex items-center space-x-1.5 text-rose-400">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Generate Report Exports</span>
                </li>
              </ul>
            </div>

            {/* Compliance Manager Column */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Compliance Manager</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>All Analytical Features</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Execute On-Demand Scrapes</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Pin & Track Regulations</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Configure Alert Thresholds</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Export PDF/CSV/JSON Dossiers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={closeRestrictedModal}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Stay as Analyst
          </button>
          <button
            type="button"
            onClick={handleElevate}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Compliance Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
