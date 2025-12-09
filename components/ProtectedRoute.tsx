import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { canAccessModule, hasPermission, PERMISSIONS } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string; // Optional: Check access to a specific module (e.g., 'inventory')
  permission?: keyof typeof PERMISSIONS; // Optional: Check a specific permission
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * Enforces strict role-based access control for routes.
 * Redirects unauthorized users to their appropriate dashboard or login.
 */
export function ProtectedRoute({
  children,
  module,
  permission,
  redirectTo
}: ProtectedRouteProps) {
  const { user } = useStore();
  const location = useLocation();

  // 1. Check authentication
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check module access
  if (module && !canAccessModule(user.role, module)) {
    const dashboardRoute = getDashboardRoute(user.role);
    console.warn(`User ${user.name} (${user.role}) attempted to access module: ${module}`);
    return <Navigate to={redirectTo || dashboardRoute} replace />;
  }

  // 3. Check specific permission
  if (permission && !hasPermission(user.role, permission)) {
    const dashboardRoute = getDashboardRoute(user.role);
    console.warn(`User ${user.name} (${user.role}) lacks permission: ${permission}`);
    return <Navigate to={redirectTo || dashboardRoute} replace />;
  }

  // Access granted
  return <>{children}</>;
}

/**
 * Helper to determine the correct dashboard route based on role
 */
function getDashboardRoute(role: string): string {
  switch (role) {
    case 'wms':
    case 'picker':
    case 'driver':
      return '/wms-ops';
    case 'pos':
      return '/pos';
    default:
      return '/dashboard';
  }
}

export default ProtectedRoute;