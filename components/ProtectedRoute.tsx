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

  const siteType = activeSite?.type || '';
  const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
  const isStore = ['Store', 'Retail', 'POS'].includes(siteType);
  const normalizedRole = (user?.role || '').toLowerCase().trim().replace(/[\s-]/g, '_');
  const isExecutive = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director'].includes(normalizedRole);

  // 1. Check authentication
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1.1 Global CEO has 100% complete access, control, and operation to every module and route
  if (normalizedRole === 'group_ceo') {
    return <>{children}</>;
  }

  // 1.5. Clean Mobile / Android Mode: Strictly limit to Fulfillment for WMS and POS for stores
  if (native.isCleanMobileMode()) {
    const mobileRoute = getRoleDashboardRoute(user.role, activeSite?.type);
    const isWmsMobile = mobileRoute.startsWith('/wms-ops');
    const isPosMobile = mobileRoute.startsWith('/pos');
    const allowedMobileModules = isWmsMobile
      ? ['warehouse', 'inventory', 'profile', 'location']
      : isPosMobile
        ? ['pos', 'sales', 'customers', 'profile', 'location']
        : ['profile', 'location'];
    if (module && !allowedMobileModules.includes(module)) {
      const fallback = redirectTo || mobileRoute;
      const fallbackPath = fallback.split('?')[0];
      return <Navigate to={fallbackPath === location.pathname ? '/profile' : fallback} replace />;
    }
  }

  // 2. Check site-type content isolation (Strict isolation: WMS blocked at stores, POS blocked at warehouses)
  if (activeSite) {

    const isSpecialistForModule = (mod: string): boolean => {
      if (isExecutive) return true;
      if (mod === 'pricing') return ['country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser'].includes(normalizedRole);
      if (mod === 'finance') return ['country_finance_director', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'country_compliance_manager', 'auditor'].includes(normalizedRole);
      if (mod === 'procurement') return ['country_commercial_director', 'country_supply_chain_director', 'buyer', 'demand_planner', 'replenishment_planner', 'vendor_relations_manager', 'customs_import_specialist'].includes(normalizedRole);
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
        const fallbackPath = fallback.split('?')[0];
        return <Navigate to={fallbackPath === location.pathname ? "/profile" : fallback} replace />;
      }
    }

    if (isStore) {
      // In POS store site: strictly store operations. Inventory is strictly for warehouse and distribution center.
      const blockedInStore = ['warehouse', 'inventory'];
      if (!isExecutive) {
        if (!isSpecialistForModule('procurement')) blockedInStore.push('procurement');
        if (!isSpecialistForModule('pricing')) blockedInStore.push('pricing');
        if (!isSpecialistForModule('finance')) blockedInStore.push('finance');
        blockedInStore.push('admin', 'settings');
      }
      if (module && blockedInStore.includes(module)) {
        logger.warn('ProtectedRoute', `Blocked module "${module}" while active site is POS Store (${activeSite.name})`);
        const fallback = redirectTo || getRoleDashboardRoute(user.role, activeSite?.type);
        const fallbackPath = fallback.split('?')[0];
        return <Navigate to={fallbackPath === location.pathname ? "/profile" : fallback} replace />;
      }
    }
  }

  // 3. Check module access
  if (module && !canAccessModule(user.role, module)) {
    const dashboardRoute = getRoleDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `Role ${user.role} attempted to access module: ${module}`);
    const fallback = redirectTo || dashboardRoute;
    const fallbackPath = fallback.split('?')[0];
    return <Navigate to={fallbackPath === location.pathname ? "/profile" : fallback} replace />;
  }

  // 4. Check specific permission
  if (permission && !hasPermission(user.role, permission)) {
    const dashboardRoute = getRoleDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `Role ${user.role} lacks permission: ${permission}`);
    const fallback = redirectTo || dashboardRoute;
    const fallbackPath = fallback.split('?')[0];
    return <Navigate to={fallbackPath === location.pathname ? "/profile" : fallback} replace />;
  }

  // Access granted
  return <>{children}</>;
}

export default ProtectedRoute;
