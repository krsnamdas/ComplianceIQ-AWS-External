import React, { useState, useRef, useEffect } from 'react';
import { useRBAC, ROLES, UserRole } from '../context/RBACContext';
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Lock,
  Check,
  Sparkles,
  Info,
  Shield,
  Eye,
} from 'lucide-react';

export const RBACRoleSwitcher: React.FC = () => {
  const { currentRole, setRole, roleDefinition } = useRBAC();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectRole = (role: UserRole) => {
    setRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Role Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          currentRole === 'compliance_manager'
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/70 hover:border-emerald-500/60'
            : 'bg-sky-950/50 border-sky-500/40 text-sky-300 hover:bg-sky-950/70 hover:border-sky-500/60'
        }`}
        title="Simulated RBAC: Switch between Analyst and Compliance Manager roles"
      >
        <div className="flex items-center space-x-1.5">
          {currentRole === 'compliance_manager' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span className="hidden md:inline font-bold">
            {currentRole === 'compliance_manager' ? 'Compliance Manager' : 'Analyst'}
          </span>
          <span className="md:hidden font-bold">
            {currentRole === 'compliance_manager' ? 'Mgr' : 'Analyst'}
          </span>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
            currentRole === 'compliance_manager'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
          }`}
        >
          {currentRole === 'compliance_manager' ? 'Full' : 'Read-Only'}
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Role Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 text-white animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated RBAC Persona</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">2 Active Profiles</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Switch your profile to experience how Role-Based Access Control gates administrative crawlers, watchlist updates, and compliance report exports.
          </p>

          <div className="space-y-2">
            {/* Compliance Manager Option */}
            <div
              onClick={() => selectRole('compliance_manager')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                currentRole === 'compliance_manager'
                  ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Compliance Manager</span>
                </div>
                {currentRole === 'compliance_manager' ? (
                  <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 hover:text-emerald-400">Select</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Full privileges: Trigger background scrapers, pin regulations, manage threshold alerts, and export compliance PDF/CSV dossiers.
              </p>
              <div className="flex flex-wrap gap-1 mt-2 text-[9px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ✓ Scraper Sync
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ✓ Watchlist Edit
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ✓ Bulk Export
                </span>
              </div>
            </div>

            {/* Analyst Option */}
            <div
              onClick={() => selectRole('analyst')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                currentRole === 'analyst'
                  ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Compliance Analyst</span>
                </div>
                {currentRole === 'analyst' ? (
                  <span className="flex items-center space-x-1 text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 hover:text-sky-400">Select</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                View-only access: Inspect regulations, explore maturity heatmaps, and research controls crosswalks. Scraper triggers, watchlist changes, and exports are restricted.
              </p>
              <div className="flex flex-wrap gap-1 mt-2 text-[9px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  ✓ View & Search
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  ✕ Scraper Locked
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  ✕ Watchlist Read-Only
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  ✕ Export Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
