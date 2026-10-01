import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';

export type UserRole = 'analyst' | 'compliance_manager' | 'admin';

export interface RoleDefinition {
  id: string;
  name: string;
  badgeLabel: string;
  shortDescription: string;
  fullDescription: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  permissions: {
    canTriggerScraper: boolean;
    canManageWatchlist: boolean;
    canExportReports: boolean;
    canEditControls: boolean;
  };
}

export const ROLES: Record<string, RoleDefinition> = {
  admin: {
    id: 'admin',
    name: 'Super Admin',
    badgeLabel: 'Super Admin (Full Root Access)',
    shortDescription: 'Unrestricted backend & operational access: Manage regulations, users, and features.',
    fullDescription:
      'Super Administrators hold full platform authority: updating regulations, modifying statutory links, toggling system features, managing team users, publishing alerts, and auditing operations.',
    color: 'text-amber-400',
    accentBg: 'bg-amber-950/40',
    accentBorder: 'border-amber-500/30',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
    },
  },
  compliance_manager: {
    id: 'compliance_manager',
    name: 'Compliance Manager',
    badgeLabel: 'Compliance Manager (Operational)',
    shortDescription: 'Full operational access: Edit, Update, Scrape & Export.',
    fullDescription:
      'Compliance Managers have unrestricted governance privileges: executing live scraper crawls, pinning/managing watchlist items, configuring threshold alert digests, and generating executive PDF/CSV compliance dossiers.',
    color: 'text-emerald-400',
    accentBg: 'bg-emerald-950/40',
    accentBorder: 'border-emerald-500/30',
    permissions: {
      canTriggerScraper: true,
      canManageWatchlist: true,
      canExportReports: true,
      canEditControls: true,
    },
  },
  analyst: {
    id: 'analyst',
    name: 'Compliance Analyst',
    badgeLabel: 'Analyst (View Only)',
    shortDescription: 'View-only analytical access to regulations, radar, and crosswalks.',
    fullDescription:
      'Analysts have complete visibility into MENAT statutory registries, maturity heatmaps, radar trends, and controls crosswalks. Scraper triggering and exports are restricted.',
    color: 'text-sky-400',
    accentBg: 'bg-sky-950/40',
    accentBorder: 'border-sky-500/30',
    permissions: {
      canTriggerScraper: false,
      canManageWatchlist: true,
      canExportReports: false,
      canEditControls: false,
    },
  },
};

interface RBACModalState {
  isOpen: boolean;
  actionName: string;
  requiredRoleName: string;
  description: string;
}

interface RBACContextType {
  currentRole: UserRole;
  roleDefinition: RoleDefinition;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  isComplianceManager: boolean;
  isAnalyst: boolean;
  isAdmin: boolean;
  canTriggerScraper: boolean;
  canManageWatchlist: boolean;
  canExportReports: boolean;
  canEditControls: boolean;
  restrictedModal: RBACModalState;
  triggerRestrictedAction: (actionName: string, customDescription?: string) => void;
  closeRestrictedModal: () => void;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAdmin();

  // Determine role based on currentUser
  const currentRole: UserRole = useMemo(() => {
    if (currentUser.isAdmin || currentUser.role === 'admin') return 'admin';
    if (currentUser.role === 'compliance_officer') return 'compliance_manager';
    return 'analyst';
  }, [currentUser]);

  const [restrictedModal, setRestrictedModal] = useState<RBACModalState>({
    isOpen: false,
    actionName: '',
    requiredRoleName: 'Compliance Manager',
    description: '',
  });

  const roleDefinition = ROLES[currentRole] || ROLES.compliance_manager;
  const isComplianceManager = currentRole === 'compliance_manager' || currentRole === 'admin';
  const isAnalyst = currentRole === 'analyst';
  const isAdmin = currentRole === 'admin';

  const triggerRestrictedAction = (actionName: string, customDescription?: string) => {
    setRestrictedModal({
      isOpen: true,
      actionName,
      requiredRoleName: 'Compliance Officer or Admin',
      description:
        customDescription ||
        `The "${actionName}" action requires administrative authorization. Your current profile "${currentUser.name}" (${currentUser.roleLabel}) has restricted permissions for this operation.`,
    });
  };

  const closeRestrictedModal = () => {
    setRestrictedModal((prev) => ({ ...prev, isOpen: false }));
  };

  const setRole = (_role: UserRole) => {
    // Delegated to Admin user switcher
  };

  const toggleRole = () => {
    // Delegated to Admin user switcher
  };

  return (
    <RBACContext.Provider
      value={{
        currentRole,
        roleDefinition,
        setRole,
        toggleRole,
        isComplianceManager,
        isAnalyst,
        isAdmin,
        canTriggerScraper: currentUser.permissions.canTriggerScraper,
        canManageWatchlist: currentUser.permissions.canManageWatchlist,
        canExportReports: currentUser.permissions.canExportReports,
        canEditControls: currentUser.permissions.canEditControls,
        restrictedModal,
        triggerRestrictedAction,
        closeRestrictedModal,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
