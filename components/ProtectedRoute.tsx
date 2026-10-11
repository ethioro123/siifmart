import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { canAccessModule, hasPermission, PERMISSIONS } from '../utils/permissions';
import { native } from '../utils/native';
import { logger } from '../utils/logger';
import { getRoleDashboardRoute } from '../utils/roleDashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string; // Optional: Check access to a specific module (e.g., 'inventory')
  permission?: keyof typeof PERMISSIONS; // Optional: Check a specific permission
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * Enforces strict role-based & site-type access control for routes.
 * Blocks cross-site/admin leakage based on activeSite context.
 */
export function ProtectedRoute({
  children,
  module,
  permission,
  redirectTo
}: ProtectedRouteProps) {
  const { user } = useStore();
  const { activeSite } = useData();
  const location = useLocation();

  // 1. Check authentication
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1.5. Clean Mobile / Android Mode: Strictly limit to Fulfillment and POS
  if (native.isCleanMobileMode()) {
    const allowedMobileModules = ['warehouse', 'pos', 'inventory', 'profile', 'location'];
    if (module && !allowedMobileModules.includes(module)) {
      const siteType = activeSite?.type || '';
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      return <Navigate to={redirectTo || (isWarehouse ? "/wms-ops" : "/pos")} replace />;
    }
  }

  // 2. Check site-type content isolation (Strict isolation: WMS blocked at stores, POS blocked at warehouses)
  if (activeSite) {
    const siteType = activeSite.type || '';
    const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
    const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);
    const isExecutive = ['super_admin', 'CEO', 'ceo', 'regional_manager', 'operations_manager'].includes(user.role);

    const isSpecialistForModule = (mod: string): boolean => {
      if (isExecutive) return true;
      if (mod === 'pricing') return ['merchandising_manager', 'merchandiser'].includes(user.role);
      if (mod === 'finance') return ['finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'auditor'].includes(user.role);
      if (mod === 'procurement') return ['procurement_manager', 'supply_chain_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector'].includes(user.role);
      return false;
    };

    if (isWarehouse) {
      // In WMS site: strictly warehouse operations. POS is blocked for warehouse staff.
      const blockedInWms = ['pos', 'sales', 'customers'];
      if (!isExecutive) {
        if (!isSpecialistForModule('pricing')) blockedInWms.push('pricing');
        if (!isSpecialistForModule('finance')) blockedInWms.push('finance');
        blockedInWms.push('admin', 'settings');
      }
      if (module && blockedInWms.includes(module)) {
        logger.warn('ProtectedRoute', `Blocked module "${module}" while active site is WMS (${activeSite.name})`);
        const fallback = redirectTo || getRoleDashboardRoute(user.role, activeSite?.type);
        return <Navigate to={fallback === location.pathname ? "/profile" : fallback} replace />;
      }
    }

    if (isStore) {
      // In POS store site: strictly store operations. Floor staff cannot access external tools.
      const blockedInStore = ['warehouse'];
      if (!isExecutive) {
        if (!isSpecialistForModule('procurement')) blockedInStore.push('procurement');
        if (!isSpecialistForModule('pricing')) blockedInStore.push('pricing');
        if (!isSpecialistForModule('finance')) blockedInStore.push('finance');
        blockedInStore.push('admin', 'settings');
      }
      if (module && blockedInStore.includes(module)) {
        logger.warn('ProtectedRoute', `Blocked module "${module}" while active site is POS Store (${activeSite.name})`);
        const fallback = redirectTo || getRoleDashboardRoute(user.role, activeSite?.type);
        return <Navigate to={fallback === location.pathname ? "/profile" : fallback} replace />;
      }
    }
  }

  // 3. Check module access
  if (module && !canAccessModule(user.role, module)) {
    const dashboardRoute = getRoleDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `User ${user.name} (${user.role}) attempted to access module: ${module}`);
    const fallback = redirectTo || dashboardRoute;
    return <Navigate to={fallback === location.pathname ? "/profile" : fallback} replace />;
  }

  // 4. Check specific permission
  if (permission && !hasPermission(user.role, permission)) {
    const dashboardRoute = getRoleDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `User ${user.name} (${user.role}) lacks permission: ${permission}`);
    const fallback = redirectTo || dashboardRoute;
    return <Navigate to={fallback === location.pathname ? "/profile" : fallback} replace />;
  }

  // Access granted
  return <>{children}</>;
}

export default ProtectedRoute;