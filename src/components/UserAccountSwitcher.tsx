import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sliders,
  LogOut,
  KeyRound,
  X,
} from 'lucide-react';

interface UserAccountSwitcherProps {
  onOpenAdminPanel?: () => void;
  onNavigateHome?: () => void;
}

/**
 * Account menu for the signed-in user.
 *
 * Security model (post Track A): this menu intentionally does NOT list other
 * accounts, allow one-click switching, or reveal any credentials. To use a
 * different account you must sign out and sign in again. Admin access still
 * passes through the separate admin-console password gate.
 */
export const UserAccountSwitcher: React.FC<UserAccountSwitcherProps> = ({
  onOpenAdminPanel,
  onNavigateHome,
}) => {
  const { currentUser, isCurrentUserAdmin, logout, changeOwnPassword } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Self-service change-password modal state
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New password and confirmation do not match.'); return; }
    setPwSubmitting(true);
    const res = await changeOwnPassword(currentPw, newPw);
    setPwSubmitting(false);
    if (res?.success) {
      // Security: once the password changes, the current session is no longer
      // valid for that credential. Force a sign-out so the user must re-login
      // with the NEW password (the old password no longer works server-side).
      setPwSuccess('Password changed. Signing you out — please log in again with your new password.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => {
        setIsChangePwOpen(false);
        setPwSuccess(null);
        logout();
        if (onNavigateHome) onNavigateHome();
      }, 1500);
    } else {
      setPwError(res?.error || 'Could not change password.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    if (onNavigateHome) onNavigateHome();
  };

  const handleOpenAdmin = () => {
    setIsOpen(false);
    if (onOpenAdminPanel) onOpenAdminPanel();
  };

  const roleBadge = isCurrentUserAdmin ? 'ADMIN' : 'USER';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
        title="Account menu"
      >
        <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-300">
          {currentUser.avatarInitials || currentUser.username?.slice(0, 2).toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-white max-w-[120px] truncate">{currentUser.username}</span>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            isCurrentUserAdmin
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}
        >
          {roleBadge}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Current identity */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-300">
                {currentUser.avatarInitials || currentUser.username?.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  {currentUser.username}
                  {isCurrentUserAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.roleLabel}</div>
              </div>
            </div>
          </div>

          {/* Admin console entry (still gated by the admin password) */}
          {isCurrentUserAdmin && (
            <button
              type="button"
              onClick={handleOpenAdmin}
              className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Open Admin Console</span>
            </button>
          )}

          {/* Change own password (self-service) */}
          <button
            type="button"
            onClick={() => { setIsOpen(false); setIsChangePwOpen(true); setPwError(null); setPwSuccess(null); }}
            className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 border-t border-slate-800 transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>Change Password</span>
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 border-t border-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Change Password modal */}
      {isChangePwOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Change Password</h4>
              </div>
              <button type="button" onClick={() => setIsChangePwOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitChangePassword} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Current Password</label>
                <input type="password" required value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">New Password</label>
                <input type="password" required value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              {pwError && <p className="text-rose-400">{pwError}</p>}
              {pwSuccess && <p className="text-emerald-400">{pwSuccess}</p>}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsChangePwOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={pwSubmitting}
                  className="px-4 py-1.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer disabled:opacity-50">
                  {pwSubmitting ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
