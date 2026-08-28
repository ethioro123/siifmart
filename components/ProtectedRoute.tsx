import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { canAccessModule, hasPermission, PERMISSIONS } from '../utils/permissions';
import { native } from '../utils/native';
import { logger } from '../utils/logger';

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

  // 2. Check site-type content isolation (NOT for CEO/super_admin — they see all modules)
  const isCeo = user.role === 'super_admin' || (user.role as string) === 'CEO';

  if (activeSite && !isCeo) {
    const siteType = activeSite.type || '';
    const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
    const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);

    if (isWarehouse) {
      // In WMS site: NO administration content (admin, pricing, finance, settings) and NO POS content!
      const blockedInWms = ['admin', 'pricing', 'finance', 'settings', 'pos', 'customers'];
      if (module && blockedInWms.includes(module)) {
        logger.warn('ProtectedRoute', `Blocked administration/pos module "${module}" while active site is WMS (${activeSite.name})`);
        return <Navigate to={redirectTo || "/wms-ops"} replace />;
      }
    }

    if (isStore) {
      // In POS store site: NO administration content (admin, pricing, finance, settings) and NO WMS content!
      const blockedInStore = ['admin', 'warehouse', 'pricing', 'finance', 'settings', 'procurement'];
      if (module && blockedInStore.includes(module)) {
        logger.warn('ProtectedRoute', `Blocked administration/wms module "${module}" while active site is POS Store (${activeSite.name})`);
        return <Navigate to={redirectTo || "/pos-dashboard"} replace />;
      }
    }
  }

  // 3. Check module access
  if (module && !canAccessModule(user.role, module)) {
    const dashboardRoute = getDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `User ${user.name} (${user.role}) attempted to access module: ${module}`);
    return <Navigate to={redirectTo || dashboardRoute} replace />;
  }

  // 4. Check specific permission
  if (permission && !hasPermission(user.role, permission)) {
    const dashboardRoute = getDashboardRoute(user.role, activeSite?.type);
    logger.warn('ProtectedRoute', `User ${user.name} (${user.role}) lacks permission: ${permission}`);
    return <Navigate to={redirectTo || dashboardRoute} replace />;
  }

  // Access granted
  return <>{children}</>;
}

/**
 * Helper to determine the correct dashboard route based on role and active site type
 */
function getDashboardRoute(role: string, siteType?: string): string {
  const isWarehouse = siteType && ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
  const isStore = siteType && ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);

  if (isWarehouse) return '/wms-ops';
  if (isStore) return '/pos-dashboard';
  if (role === 'super_admin' || role === 'CEO') return '/admin';

  switch (role) {
    case 'wms':
    case 'picker':
    case 'driver':
      return '/wms-ops';
    case 'pos':
      return '/pos';
    default:
      return '/admin';
  }
}

export default ProtectedRoute;