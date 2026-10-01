import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FeatureTogglesTab } from './FeatureTogglesTab';
import { RegulationEditorTab } from './RegulationEditorTab';
import { CountryManagementTab } from './CountryManagementTab';
import { UserManagementTab } from './UserManagementTab';
import { BroadcastBannerTab } from './BroadcastBannerTab';
import { AuditTrailTab } from './AuditTrailTab';
import { SystemBackupTab } from './SystemBackupTab';
import { LinkIntegrityTab } from './LinkIntegrityTab';
import { LinkSuggestionsQueueTab } from './LinkSuggestionsQueueTab';
import { TimelineManagerTab } from './TimelineManagerTab';
import { DigestFeedTab } from './DigestFeedTab';
import { ComplianceIQLogo } from '../ComplianceIQLogo';
import {
  ShieldAlert,
  Sliders,
  BookOpen,
  Users,
  Megaphone,
  FileSpreadsheet,
  Database,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Globe2,
  Link2,
  CalendarClock,
  BellRing,
} from 'lucide-react';

export type AdminSubTab =
  | 'countries'
  | 'regulations'
  | 'digest'
  | 'timeline'
  | 'link_integrity'
  | 'link_suggestions'
  | 'features'
  | 'users'
  | 'broadcast'
  | 'activity_log'
  | 'audit'
  | 'backup';

interface AdminPanelProps {
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateHome }) => {
  const {
    currentUser,
    isCurrentUserAdmin,
    users,
    switchUser,
    countries,
    regulations,
    timelineEvents = [],
    featureFlags,
    auditLogs,
    isAdminUnlocked,
    unlockAdmin,
    lockAdmin,
    quickLoginAs,
    linkSuggestions = [],
    regulationSuggestions = [],
    digestUpdates = [],
  } = useAdmin();

  const pendingSuggestionsCount =
    linkSuggestions.filter((s) => s.status === 'pending').length +
    regulationSuggestions.filter((s) => s.status === 'pending').length;

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('regulations');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isFlashingSuccess, setIsFlashingSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Strict RBAC: Normal users are strictly forbidden from viewing or operating the Administrative Console
  if (!isCurrentUserAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-rose-500/40 rounded-2xl text-center shadow-2xl animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied: Administrator Role Required</h2>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          The ComplianceIQ Administrative Console and modular platform feature toggles require Root Administrator authorization. Normal user accounts (<span className="font-mono text-cyan-300">{currentUser.name}</span>, Role: {currentUser.roleLabel}) are strictly barred from viewing or editing administrative settings.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Return to Overview (Main Page)
        </button>
      </div>
    );
  }

  // If Admin session is NOT unlocked, show Admin Authentication Flash Gateway
  if (!isAdminUnlocked) {
    const adminUser = users.find((u) => u.isAdmin || u.role === 'admin') || users[0];

    const handleUnlockSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setIsVerifying(true);

      setTimeout(() => {
        setIsVerifying(false);
        const success = unlockAdmin(adminPasswordInput);
        if (success) {
          setIsFlashingSuccess(true);
          // If current user is not admin, elevate to ciadmin1
          if (!currentUser.isAdmin) {
            quickLoginAs('ciadmin1');
          }
          setTimeout(() => {
            setIsFlashingSuccess(false);
          }, 600);
        } else {
          setAuthError('Invalid administrator credentials. Please verify your administrator password.');
        }
      }, 350);
    };

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

          {/* Flash success overlay */}
          {isFlashingSuccess && (
            <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-1">
                Administrative Credentials Verified
              </h3>
              <p className="text-xs text-emerald-400 font-mono">
                Initializing Full Backend Administrative Console...
              </p>
            </div>
          )}

          <div className="text-center max-w-lg mx-auto space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted Operations Console</span>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Backend Administrative Gateway
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Access to sovereign regulation editing, feature flag toggles, IAM roles, and system backups requires administrative verification.
            </p>
          </div>

          {/* Security Guidance Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Security Authentication:</span>
              <span className="text-emerald-400 font-mono font-bold">Local Auth Enforced</span>
            </div>
            <p className="text-slate-300">
              Please enter your assigned administrator password to verify authorization and open the Root Console.
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2 mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter administrator password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-rose-500 transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isVerifying ? 'Verifying Admin Password...' : 'Verify Credentials & Open Console'}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              >
                Return to Overview
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const enabledFeaturesCount = Object.values(featureFlags).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Executive Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <ComplianceIQLogo size={42} className="mt-1" />
            <div>
              <div className="flex items-center space-x-2.5 mb-1">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Compliance<span className="text-cyan-400">IQ</span> Administrative Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ROOT PRIVILEGES
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Middle East, North Africa &amp; Türkiye Regulations &amp; Controls Management
              </p>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Central administrative command center for platform governance, systematic link-integrity scanning (404 and broken URL remediation across official gazettes), statutory regulation database editing, feature module toggling, user access management, and audit trail logs.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 px-4 text-xs shrink-0">
            <div className="text-center pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Countries</span>
              <span className="font-bold text-cyan-400 text-sm">{countries.length}</span>
            </div>
            <div className="text-center pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Regulations</span>
              <span className="font-bold text-emerald-400 text-sm">{regulations.length}</span>
            </div>
            <div className="text-center pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Deadlines</span>
              <span className="font-bold text-teal-400 text-sm">{timelineEvents.length}</span>
            </div>
            <div className="text-center pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Features</span>
              <span className="font-bold text-amber-400 text-sm">
                {enabledFeaturesCount}/{Object.keys(featureFlags).length}
              </span>
            </div>
            <div className="text-center pr-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Users</span>
              <span className="font-bold text-sky-400 text-sm">{users.length}</span>
            </div>
            <div className="text-left pl-1">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Operator</span>
              <span className="font-bold text-slate-200 text-xs truncate max-w-[120px] block">
                {currentUser.name}
              </span>
            </div>
            <button
              type="button"
              onClick={lockAdmin}
              className="ml-2 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer"
              title="Lock administrative console session"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Console</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('countries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'countries'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Jurisdictions &amp; Countries ({countries.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('regulations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'regulations'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Regulations Editor ({regulations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('digest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'digest'
                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50'
                : 'bg-slate-950/60 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/20'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-rose-400" />
            <span>Digest Feed ({digestUpdates.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'timeline'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/50'
                : 'bg-slate-950/60 hover:bg-slate-800 text-teal-300 hover:text-white border border-teal-500/20'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-teal-400" />
            <span>Timeline &amp; Deadlines ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('link_integrity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'link_integrity'
                ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                : 'bg-slate-950/60 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/20'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Link Integrity &amp; 404 Scanner</span>
          </button>

          <button
            onClick={() => setActiveSubTab('link_suggestions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'link_suggestions'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                : 'bg-slate-950/60 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/20'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>User Suggestions</span>
            {pendingSuggestionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                {pendingSuggestionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('features')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'features'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Feature Toggles ({enabledFeaturesCount} Active)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({users.length} Users)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'broadcast'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>System Broadcast</span>
          </button>

          <button
            onClick={() => setActiveSubTab('activity_log')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'activity_log' || activeSubTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Activity Log &amp; Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>State Backup & Reset</span>
          </button>
        </div>
      </div>

      {/* Active Tab Content Area */}
      <div>
        {activeSubTab === 'countries' && <CountryManagementTab />}
        {activeSubTab === 'regulations' && <RegulationEditorTab />}
        {activeSubTab === 'digest' && <DigestFeedTab />}
        {activeSubTab === 'timeline' && <TimelineManagerTab />}
        {activeSubTab === 'link_integrity' && <LinkIntegrityTab />}
        {activeSubTab === 'link_suggestions' && <LinkSuggestionsQueueTab />}
        {activeSubTab === 'features' && <FeatureTogglesTab />}
        {activeSubTab === 'users' && <UserManagementTab />}
        {activeSubTab === 'broadcast' && <BroadcastBannerTab />}
        {(activeSubTab === 'activity_log' || activeSubTab === 'audit') && <AuditTrailTab />}
        {activeSubTab === 'backup' && <SystemBackupTab />}
      </div>
    </div>
  );
};
