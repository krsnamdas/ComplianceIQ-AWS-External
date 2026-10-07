/**
 * Server-side user roster + authentication store.
 * ---------------------------------------------------------------------------
 * Users (name, username, email, role, status, isAdmin, ...) plus a bcrypt
 * password HASH live in the region file users.json. Passwords are NEVER stored
 * or transmitted in plaintext: the server hashes on write and compares on login.
 *
 * This replaces the previous localStorage + plaintext-password model, so that:
 *   - user MACDs (create / edit / delete / role change) sync across all admins,
 *   - passwords are stored only as bcrypt hashes (one-way),
 *   - login verification happens server-side (the hash never leaves the server).
 *
 * Server-side only (uses fs via regionLoader + bcryptjs). The browser bundle
 * must not import it.
 */
import bcrypt from 'bcryptjs';
import { loadUsers, saveUsers } from './regionLoader';

const BCRYPT_COST = 12; // strong work factor

/** Stored user record. `passwordHash` is bcrypt; there is NO plaintext field. */
export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  isAdmin: boolean;
  avatarInitials?: string;
  jobTitle?: string;
  organization?: string;
  jurisdiction?: string;
  countryFlag?: string;
  status: string;
  lastActive?: string;
  dateCreated?: string;
  permissions?: Record<string, boolean>;
  /** bcrypt hash of the password — never the plaintext. */
  passwordHash: string;
}

/** The public shape returned to clients — identical to StoredUser WITHOUT the hash. */
export type PublicUser = Omit<StoredUser, 'passwordHash'>;

/** Strip the hash before sending a user to any client. */
export function toPublic(u: StoredUser): PublicUser {
  const { passwordHash, ...pub } = u;
  return pub;
}

/** Default roster seeded on first run when users.json does not yet exist. */
const SEED_SPECS: Array<{ base: Omit<StoredUser, 'passwordHash'>; password: string }> = [
  {
    password: 'ciadmin123',
    base: {
      id: 'ciadmin1', username: 'ciadmin1', name: 'ciadmin1', email: 'ciadmin1@complianceiq.io',
      role: 'admin', roleLabel: 'System Administrator / Lead Compliance Architect', isAdmin: true,
      avatarInitials: 'CA1', jobTitle: 'Chief Compliance Systems Administrator',
      organization: 'ComplianceIQ Regional Governance', jurisdiction: 'Saudi Arabia', countryFlag: '🇸🇦',
      status: 'active', lastActive: 'Just now', dateCreated: '2025-01-10',
      permissions: { canTriggerScraper: true, canManageWatchlist: true, canExportReports: true, canEditControls: true, canAccessAdminPanel: true, canManageRegulations: true, canToggleFeatures: true, canManageUsers: true },
    },
  },
  {
    password: 'ciadmin123',
    base: {
      id: 'ciadmin2', username: 'ciadmin2', name: 'ciadmin2', email: 'ciadmin2@complianceiq.io',
      role: 'admin', roleLabel: 'Regional Administrator & Systems Architect', isAdmin: true,
      avatarInitials: 'CA2', jobTitle: 'Principal Regulatory Systems Administrator',
      organization: 'ComplianceIQ Regional Governance', jurisdiction: 'United Arab Emirates', countryFlag: '🇦🇪',
      status: 'active', lastActive: '12 mins ago', dateCreated: '2025-02-14',
      permissions: { canTriggerScraper: true, canManageWatchlist: true, canExportReports: true, canEditControls: true, canAccessAdminPanel: true, canManageRegulations: true, canToggleFeatures: true, canManageUsers: true },
    },
  },
  {
    password: 'sasuser123',
    base: {
      id: 'sasuser1', username: 'sasuser1', name: 'sasuser1', email: 'sasuser1@complianceiq.io',
      role: 'compliance_officer', roleLabel: 'Senior Compliance Officer', isAdmin: false,
      avatarInitials: 'SU1', jobTitle: 'Senior Compliance Officer',
      organization: 'ComplianceIQ Client Services', jurisdiction: 'Saudi Arabia', countryFlag: '🇸🇦',
      status: 'active', lastActive: '1 hour ago', dateCreated: '2025-03-01',
      permissions: { canTriggerScraper: true, canManageWatchlist: true, canExportReports: true, canEditControls: true, canAccessAdminPanel: false, canManageRegulations: false, canToggleFeatures: false, canManageUsers: false },
    },
  },
  {
    password: 'sasuser123',
    base: {
      id: 'sasuser2', username: 'sasuser2', name: 'sasuser2', email: 'sasuser2@complianceiq.io',
      role: 'risk_analyst', roleLabel: 'Cyber Risk & Cloud Governance Analyst', isAdmin: false,
      avatarInitials: 'SU2', jobTitle: 'Cyber Risk & Cloud Governance Analyst',
      organization: 'ComplianceIQ Client Services', jurisdiction: 'United Arab Emirates', countryFlag: '🇦🇪',
      status: 'active', lastActive: '3 hours ago', dateCreated: '2025-03-05',
      permissions: { canTriggerScraper: false, canManageWatchlist: true, canExportReports: false, canEditControls: false, canAccessAdminPanel: false, canManageRegulations: false, canToggleFeatures: false, canManageUsers: false },
    },
  },
  {
    password: 'sasuser123',
    base: {
      id: 'sasuser3', username: 'sasuser3', name: 'sasuser3', email: 'sasuser3@complianceiq.io',
      role: 'compliance_officer', roleLabel: 'FinTech & CASP Regulatory Specialist', isAdmin: false,
      avatarInitials: 'SU3', jobTitle: 'FinTech & CASP Regulatory Specialist',
      organization: 'ComplianceIQ Client Services', jurisdiction: 'Bahrain', countryFlag: '🇧🇭',
      status: 'active', lastActive: '5 hours ago', dateCreated: '2025-03-09',
      permissions: { canTriggerScraper: true, canManageWatchlist: true, canExportReports: true, canEditControls: true, canAccessAdminPanel: false, canManageRegulations: false, canToggleFeatures: false, canManageUsers: false },
    },
  },
  {
    password: 'sasuser123',
    base: {
      id: 'sasuser4', username: 'sasuser4', name: 'sasuser4', email: 'sasuser4@complianceiq.io',
      role: 'auditor', roleLabel: 'Lead IT Assurance & Critical Infra Auditor', isAdmin: false,
      avatarInitials: 'SU4', jobTitle: 'Lead IT Assurance & Critical Infra Auditor',
      organization: 'ComplianceIQ Client Services', jurisdiction: 'Qatar', countryFlag: '🇶🇦',
      status: 'active', lastActive: '1 day ago', dateCreated: '2025-03-12',
      permissions: { canTriggerScraper: false, canManageWatchlist: true, canExportReports: false, canEditControls: false, canAccessAdminPanel: false, canManageRegulations: false, canToggleFeatures: false, canManageUsers: false },
    },
  },
];

let USERS: StoredUser[] = [];

/** Load users from the region file; seed (with hashed passwords) on first run. */
export async function initUsers(): Promise<void> {
  const loaded = loadUsers<StoredUser>([]);
  if (loaded.source === 'file' && Array.isArray(loaded.data) && loaded.data.length > 0) {
    USERS = loaded.data;
    return;
  }
  // First run: seed the default roster with bcrypt-hashed passwords.
  const seeded: StoredUser[] = [];
  for (const spec of SEED_SPECS) {
    const passwordHash = await bcrypt.hash(spec.password, BCRYPT_COST);
    seeded.push({ ...spec.base, passwordHash });
  }
  USERS = seeded;
  saveUsers<StoredUser>(USERS);
}

function persist(): { ok: boolean; error?: string } {
  const res = saveUsers<StoredUser>(USERS);
  return { ok: res.ok, error: res.error };
}

/** All users (public shape, no hashes). */
export function listUsers(): PublicUser[] {
  return USERS.map(toPublic);
}

/** Verify a login. Returns the public user on success, null otherwise. */
export async function verifyLogin(usernameOrEmail: string, password: string): Promise<PublicUser | null> {
  const key = (usernameOrEmail || '').trim().toLowerCase();
  const user = USERS.find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key || u.id.toLowerCase() === key
  );
  if (!user) return null;
  if (user.status && user.status !== 'active') return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? toPublic(user) : null;
}

/** Create a user with a bcrypt-hashed password. Returns the public user. */
export async function createUser(
  input: Omit<StoredUser, 'passwordHash' | 'id'> & { id?: string; password: string }
): Promise<{ ok: boolean; user?: PublicUser; error?: string }> {
  const { password, id, ...rest } = input as any;
  if (!rest.username || !password) {
    return { ok: false, error: 'username and password are required.' };
  }
  const newId = (id && String(id).trim()) || String(rest.username).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (USERS.some((u) => u.id === newId || u.username.toLowerCase() === String(rest.username).toLowerCase())) {
    return { ok: false, error: 'A user with that id/username already exists.' };
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user: StoredUser = { ...(rest as any), id: newId, passwordHash };
  const snapshot = [...USERS];
  USERS = [...USERS, user];
  const p = persist();
  if (!p.ok) { USERS = snapshot; return { ok: false, error: p.error }; }
  return { ok: true, user: toPublic(user) };
}

/** Update non-secret fields of a user (never the password here). */
export function updateUser(id: string, updates: Partial<Omit<StoredUser, 'passwordHash' | 'id'>>): { ok: boolean; user?: PublicUser; error?: string } {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'User not found.' };
  const snapshot = [...USERS];
  USERS[idx] = { ...USERS[idx], ...updates, id: USERS[idx].id, passwordHash: USERS[idx].passwordHash };
  const p = persist();
  if (!p.ok) { USERS = snapshot; return { ok: false, error: p.error }; }
  return { ok: true, user: toPublic(USERS[idx]) };
}

/** Delete a user. */
export function deleteUser(id: string): { ok: boolean; error?: string } {
  if (!USERS.some((u) => u.id === id)) return { ok: false, error: 'User not found.' };
  const snapshot = [...USERS];
  USERS = USERS.filter((u) => u.id !== id);
  const p = persist();
  if (!p.ok) { USERS = snapshot; return { ok: false, error: p.error }; }
  return { ok: true };
}

/** Admin reset: set a new bcrypt hash for a user (no current-password check). */
export async function resetPassword(id: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'User not found.' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  const snapshot = [...USERS];
  USERS[idx] = { ...USERS[idx], passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST) };
  const p = persist();
  if (!p.ok) { USERS = snapshot; return { ok: false, error: p.error }; }
  return { ok: true };
}

/** Self-service change: verify current password, then set a new hash. */
export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'User not found.' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  const matches = await bcrypt.compare(currentPassword, USERS[idx].passwordHash);
  if (!matches) return { ok: false, error: 'Current password is incorrect.' };
  const snapshot = [...USERS];
  USERS[idx] = { ...USERS[idx], passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST) };
  const p = persist();
  if (!p.ok) { USERS = snapshot; return { ok: false, error: p.error }; }
  return { ok: true };
}
