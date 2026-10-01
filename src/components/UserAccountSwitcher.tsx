import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Lock,
  Check,
  Shield,
  Sliders,
  Users,
  LogIn,
  Key,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface UserAccountSwitcherProps {
  onOpenAdminPanel?: () => void;
  onNavigateHome?: () => void;
}

export const UserAccountSwitcher: React.FC<UserAccountSwitcherProps> = ({
  onOpenAdminPanel,
  onNavigateHome,
}) => {
  const { currentUser, isCurrentUserAdmin, users, switchUser, loginWithCredentials, logout, lockAdmin } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'login'>('roster');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // User Swap Re-Authentication State
  const [reauthTargetUser, setReauthTargetUser] = useState<typeof users[0] | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthShowPassword, setReauthShowPassword] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthSuccess, setReauthSuccess] = useState<string | null>(null);

  // Launch Admin Console Re-Authentication State
  const [isAdminLaunchModalOpen, setIsAdminLaunchModalOpen] = useState(false);
  const [adminLaunchPassword, setAdminLaunchPassword] = useState('');
  const [adminLaunchError, setAdminLaunchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setReauthTargetUser(null);
        setIsAdminLaunchModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminUsers = users.filter((u) => u.isAdmin || u.role === 'admin');
  const normalUsers = users.filter((u) => !u.isAdmin && u.role !== 'admin');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    if (!usernameInput.trim()) {
      setLoginError('Please enter username (e.g., ciadmin1 or sasuser1)');
      return;
    }
    const result = loginWithCredentials(usernameInput, passwordInput);
    if (result.success && result.user) {
      setLoginSuccess(`Authenticated as ${result.user.username}`);
      setTimeout(() => {
        setIsOpen(false);
        setLoginSuccess(null);
        setUsernameInput('');
        setPasswordInput('');
        if (onNavigateHome) onNavigateHome();
      }, 700);
    } else {
      setLoginError(result.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const prefillCredentials = (user: typeof users[0]) => {
    setUsernameInput(user.username);
    setPasswordInput(''); // Do not prefill password per security guidelines
    setActiveTab('login');
    setLoginError(null);
  };

  const handleInitiateSwap = (targetUser: typeof users[0]) => {
    if (targetUser.id === currentUser.id) return;
    setReauthTargetUser(targetUser);
    setReauthPassword('');
    setReauthError(null);
    setReauthSuccess(null);
  };

  const handleReauthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reauthTargetUser) return;
    setReauthError(null);
    setReauthSuccess(null);

    const result = loginWithCredentials(reauthTargetUser.username, reauthPassword);
    if (result.success && result.user) {
      setReauthSuccess(`Authenticated! Switching session to ${result.user.username}...`);
      setTimeout(() => {
        setReauthTargetUser(null);
        setReauthPassword('');
        setReauthSuccess(null);
        setIsOpen(false);
        if (onNavigateHome) onNavigateHome();
      }, 700);
    } else {
      setReauthError(
        result.message ||
          `Invalid password for ${reauthTargetUser.username}. Note: ${
            reauthTargetUser.isAdmin ? 'cisadmin123' : 'sasuser123'
          }`
      );
    }
  };

  const handleAdminLaunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLaunchError(null);
    const clean = adminLaunchPassword.trim();
    if (clean === 'cisadmin123' || clean === 'ciadmin123' || clean === currentUser.password) {
      setIsAdminLaunchModalOpen(false);
      setAdminLaunchPassword('');
      setIsOpen(false);
      if (onOpenAdminPanel) {
        onOpenAdminPanel();
      }
    } else {
      setAdminLaunchError('Invalid Administrator Password. Expected cisadmin123.');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active User Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          isCurrentUserAdmin
            ? 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-950/70 hover:border-amber-500/60'
            : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
        }`}
        title="Switch Account Persona (2 Admins: ciadmin1, ciadmin2 | 4 Normal: sasuser1, sasuser2, sasuser3, sasuser4)"
      >
        <div className="flex items-center space-x-1.5">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
              isCurrentUserAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/50'
            }`}
          >
            {currentUser.avatarInitials}
          </div>
          <span className="hidden md:inline font-bold truncate max-w-[110px]">
            {currentUser.username || currentUser.name}
          </span>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
            isCurrentUserAdmin
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
          }`}
        >
          {isCurrentUserAdmin ? 'Admin' : 'User'}
        </span>

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Account Switcher Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 text-white animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>ComplianceIQ Account Access</span>
            </span>
            <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'roster'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Accounts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>
          </div>

          {activeTab === 'login' ? (
            /* Interactive Login with Password */
            <form onSubmit={handleLoginSubmit} className="space-y-3 py-1">
              <div className="text-[11px] text-slate-400">
                Enter user credentials to authenticate into ComplianceIQ:
              </div>

              {loginError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  USERNAME
                </label>
                <input
                  type="text"
                  placeholder="ciadmin1, ciadmin2, sasuser1, etc."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-slate-400">PASSWORD</label>
                  <span className="text-[10px] text-slate-500 font-mono">ciadmin123 / sasuser123</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 pr-8 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Authenticate Session</span>
              </button>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                  Quick Select Preset (Usernames):
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => prefillCredentials(u)}
                      className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left font-mono truncate cursor-pointer text-slate-300 hover:text-white"
                    >
                      {u.username} ({u.isAdmin ? 'Admin' : 'User'})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : reauthTargetUser ? (
            /* Re-Authentication Prompt when switching accounts */
            <form onSubmit={handleReauthSubmit} className="space-y-3 py-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setReauthTargetUser(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <span>← Back to Accounts</span>
                </button>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase font-bold">
                  Authentication Required
                </span>
              </div>

              {/* Target User Summary Card */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                    reauthTargetUser.isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  }`}
                >
                  {reauthTargetUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white font-mono">{reauthTargetUser.username}</span>
                    <span className="text-xs">{reauthTargetUser.countryFlag}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{reauthTargetUser.role}</p>
                </div>
              </div>

              {reauthError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reauthError}</span>
                </div>
              )}

              {reauthSuccess && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{reauthSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  ENTER PASSWORD FOR {reauthTargetUser.username.toUpperCase()}
                </label>
                <div className="relative">
                  <input
                    type={reauthShowPassword ? 'text' : 'password'}
                    placeholder={`Enter password (${reauthTargetUser.isAdmin ? 'cisadmin123' : 'sasuser123'})`}
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1.5 pr-8 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setReauthShowPassword(!reauthShowPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    {reauthShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Default credentials: <span className="font-mono text-slate-400">{reauthTargetUser.isAdmin ? 'cisadmin123' : 'sasuser123'}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Authenticate &amp; Switch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReauthTargetUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : isAdminLaunchModalOpen ? (
            /* Admin Console Launch Re-Authentication Challenge */
            <form onSubmit={handleAdminLaunchSubmit} className="space-y-3 py-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdminLaunchModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <span>← Back</span>
                </button>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase font-bold">
                  Admin Gateway
                </span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
                <p className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Backend Admin Console Protected</span>
                </p>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  Re-enter Administrator Password to unlock and launch the backend administration panel:
                </p>
              </div>

              {adminLaunchError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminLaunchError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  ADMINISTRATOR PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Enter cisadmin123"
                  value={adminLaunchPassword}
                  onChange={(e) => setAdminLaunchPassword(e.target.value)}
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Unlock &amp; Launch Console</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminLaunchModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Accounts Roster with Credentials Display */
            <>
              {/* Quick link to Admin Console if user is Admin */}
              {isCurrentUserAdmin && onOpenAdminPanel && (
                <button
                  onClick={() => setIsAdminLaunchModalOpen(true)}
                  className="w-full mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Launch Backend Admin Console</span>
                </button>
              )}

              {/* Admin Accounts Section */}
              <div className="mb-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin Users (2 Accounts)</span>
                  </span>
                  <span className="text-[9px] text-amber-400/80 font-mono">Role: Super Admin</span>
                </div>
                <div className="space-y-1.5">
                  {adminUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleInitiateSwap(user)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {user.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-white font-mono">{user.username}</span>
                                <span className="text-xs">{user.countryFlag}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.role}</p>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 hover:underline shrink-0 font-medium">
                              Switch (Auth)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Normal Users Section */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Normal Users (4 Accounts)</span>
                  </span>
                  <span className="text-[9px] text-sky-400/80 font-mono">Role: Compliance User</span>
                </div>
                <div className="space-y-1.5">
                  {normalUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleInitiateSwap(user)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {user.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-white font-mono">{user.username}</span>
                                <span className="text-xs">{user.countryFlag}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.role}</p>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-sky-400 hover:underline shrink-0 font-medium">
                              Switch (Auth)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sign Out Option */}
              <div className="p-3 pt-2 border-t border-slate-800 bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    if (onNavigateHome) onNavigateHome();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign Out (Return to Guest Mode)</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

