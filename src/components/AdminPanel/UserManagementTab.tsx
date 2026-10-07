import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { UserProfile, UserRoleType } from '../../types/admin';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  LogIn,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  X,
  Save,
  Building,
  Mail,
  Lock,
} from 'lucide-react';

export const UserManagementTab: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    addUser,
    resetUserPassword,
    updateUser,
    deleteUser,
    toggleUserStatus,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleType>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      searchTerm === '' ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    return matchSearch && matchRole;
  });

  const adminCount = users.filter((u) => u.isAdmin || u.role === 'admin').length;
  const normalCount = users.length - adminCount;

  // Real password reset: admin enters a new password, which the server stores
  // as a fresh bcrypt hash. No password is ever revealed or copied.
  const handleResetPassword = async (user: UserProfile) => {
    const newPass = window.prompt(`Set a NEW password for @${user.username || user.id} (min 6 characters):`);
    if (newPass === null) return; // cancelled
    if (newPass.trim().length < 6) {
      setResetSuccessMessage('Password must be at least 6 characters.');
      setTimeout(() => setResetSuccessMessage(null), 4000);
      return;
    }
    const res = await resetUserPassword(user.id, newPass.trim());
    if (res?.success) {
      setResetSuccessMessage(`Password for @${user.username || user.id} has been reset.`);
    } else {
      setResetSuccessMessage(res?.error || 'Password reset failed.');
    }
    setTimeout(() => setResetSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Identity & Access Management (IAM)</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {adminCount} Admins (ciadmin1, ciadmin2)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {normalCount} Normal Users (sasuser1 - 4)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Server-managed user directory. Passwords are stored only as bcrypt hashes and are
            never displayed. Use <strong>Reset</strong> to set a new password for a user.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <input
          type="text"
          placeholder="Filter users by name, email, or organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Administrators ({adminCount})</option>
            <option value="compliance_officer">Compliance Officers</option>
            <option value="risk_analyst">Risk Analysts</option>
            <option value="auditor">Auditors</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="table-scroll-x">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role & Privileges</th>
                <th className="py-3 px-4">Organization & Jurisdiction</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Switch / Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser.id;
                const isAdmin = user.isAdmin || user.role === 'admin';

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* User & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          }`}
                        >
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-white">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ACTIVE SESSION
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username (password is never displayed) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                          @{user.username || user.id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono mt-1">
                        <KeyRound className="w-2.5 h-2.5 text-slate-500" />
                        <span>bcrypt-hashed</span>
                      </div>
                    </td>

                    {/* Role & Privileges */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        {isAdmin ? (
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {user.jobTitle}
                      </span>
                    </td>

                    {/* Organization & Jurisdiction */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center space-x-1.5">
                        <span>{user.countryFlag}</span>
                        <span className="text-slate-200 font-medium">{user.jurisdiction}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        {user.organization}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={isCurrent}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center space-x-1 cursor-pointer transition-colors ${
                          user.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        } disabled:opacity-50`}
                        title="Click to toggle active/suspended"
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{user.status}</span>
                      </button>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {user.lastActive}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Switch Account Button */}
                        {isCurrent && (
                          <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1">
                            Current
                          </span>
                        )}

                        <button
                          onClick={() => setEditingUser({ ...user })}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit User Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                          title="Send Password Reset Link"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete user account for ${user.name}?`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Reference */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Role Permissions Matrix</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30">
            <span className="font-bold text-amber-300 block mb-1">Super Admin (2 Users)</span>
            <p className="text-[11px] text-slate-400 mb-2">
              Full backend access, regulation CRUD, feature flags, user management, and exports.
            </p>
            <span className="text-[10px] font-mono text-emerald-400">✓ All Privileges Granted</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Compliance Officer</span>
            <p className="text-[11px] text-slate-400 mb-2">
              Trigger background crawlers, pin watchlists, manage alert thresholds, export compliance dossiers.
            </p>
            <span className="text-[10px] font-mono text-emerald-400">✓ Operational Governance</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-sky-400 block mb-1">Risk Analyst</span>
            <p className="text-[11px] text-slate-400 mb-2">
              Inspect regulations, maturity heatmaps, radar trends, and controls crosswalks.
            </p>
            <span className="text-[10px] font-mono text-sky-400">✓ Analytical Read-Only</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-indigo-400 block mb-1">IT Auditor</span>
            <p className="text-[11px] text-slate-400 mb-2">
              Audit attestation, controls inspection, and compliance report generation.
            </p>
            <span className="text-[10px] font-mono text-indigo-400">✓ Audit & Export</span>
          </div>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white">Edit User Profile: {editingUser.name}</h4>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser.id, editingUser);
                setEditingUser(null);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username (e.g. ciadmin1)</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password</label>
                  <p className="text-[11px] text-slate-500 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    Managed via the <strong>Reset</strong> action (stored as a bcrypt hash).
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Assignment</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as UserRoleType;
                    const isAdmin = nextRole === 'admin';
                    setEditingUser({
                      ...editingUser,
                      role: nextRole,
                      isAdmin,
                      roleLabel:
                        nextRole === 'admin'
                          ? 'Super Admin'
                          : nextRole === 'compliance_officer'
                          ? 'Compliance Officer'
                          : nextRole === 'risk_analyst'
                          ? 'Risk Analyst'
                          : 'IT Auditor',
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="admin">Super Admin (Root Backend Access)</option>
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="risk_analyst">Risk Analyst</option>
                  <option value="auditor">IT Auditor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={editingUser.jobTitle}
                  onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Organization</label>
                <input
                  type="text"
                  value={editingUser.organization}
                  onChange={(e) => setEditingUser({ ...editingUser, organization: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white">Create New User Account</h4>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const role = formData.get('role') as UserRoleType;
                const isAdmin = role === 'admin';

                addUser({
                  name: formData.get('name') as string,
                  username: (formData.get('username') as string) || (formData.get('name') as string).toLowerCase().replace(/\s+/g, ''),
                  password: (formData.get('password') as string) || (isAdmin ? 'ciadmin123' : 'sasuser123'),
                  email: formData.get('email') as string,
                  role,
                  roleLabel:
                    role === 'admin'
                      ? 'Super Admin'
                      : role === 'compliance_officer'
                      ? 'Compliance Officer'
                      : role === 'risk_analyst'
                      ? 'Risk Analyst'
                      : 'IT Auditor',
                  isAdmin,
                  avatarInitials: '',
                  jobTitle: (formData.get('jobTitle') as string) || 'Compliance Specialist',
                  organization: (formData.get('organization') as string) || 'Regional Authority',
                  jurisdiction: (formData.get('jurisdiction') as string) || 'Saudi Arabia',
                  countryFlag: (formData.get('countryFlag') as string) || '🇸🇦',
                  status: 'active',
                  permissions: {
                    canTriggerScraper: isAdmin || role === 'compliance_officer',
                    canManageWatchlist: true,
                    canExportReports: isAdmin || role === 'compliance_officer' || role === 'auditor',
                    canEditControls: isAdmin || role === 'compliance_officer',
                    canAccessAdminPanel: isAdmin,
                    canManageRegulations: isAdmin,
                    canToggleFeatures: isAdmin,
                    canManageUsers: isAdmin,
                  },
                });
                setIsAddUserOpen(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Faisal Al-Ghamdi"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    name="username"
                    type="text"
                    required
                    placeholder="e.g. sasuser5"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Set an initial password (min 6 chars)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Stored as a bcrypt hash. The user can change it after signing in.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Corporate Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="faisal.ghamdi@organization.sa"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Assignment *</label>
                <select
                  name="role"
                  defaultValue="compliance_officer"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="risk_analyst">Risk Analyst</option>
                  <option value="auditor">IT Auditor</option>
                  <option value="admin">Super Admin (Full Root)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jurisdiction</label>
                  <input
                    name="jurisdiction"
                    type="text"
                    defaultValue="Saudi Arabia"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Flag Emoji</label>
                  <input
                    name="countryFlag"
                    type="text"
                    defaultValue="🇸🇦"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Organization</label>
                <input
                  name="organization"
                  type="text"
                  defaultValue="Commercial Bank of Riyadh"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  name="jobTitle"
                  type="text"
                  defaultValue="Senior Regulatory Risk Lead"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
