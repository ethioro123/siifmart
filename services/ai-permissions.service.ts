/**
 * Permission Service for AI Navigation
 * Ensures AI respects role-based access control
 */

import { UserRole } from '../types';

// Route permissions - defines which roles can access which routes
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
    '/dashboard': ['super_admin', 'admin', 'manager', 'warehouse_manager', 'finance_manager', 'procurement_manager', 'hr', 'cs_manager', 'auditor', 'it_support'],
    '/inventory': ['super_admin', 'admin', 'manager', 'warehouse_manager', 'inventory_specialist', 'picker', 'procurement_manager', 'store_supervisor'],
    '/procurement': ['super_admin', 'admin', 'procurement_manager', 'warehouse_manager', 'dispatcher'],
    '/pos': ['super_admin', 'admin', 'manager', 'pos', 'store_supervisor'],
    '/wms': ['super_admin', 'admin', 'warehouse_manager', 'dispatcher', 'picker', 'inventory_specialist', 'driver'],
    '/employees': ['super_admin', 'admin', 'hr', 'manager', 'warehouse_manager'],
    '/customers': ['super_admin', 'admin', 'manager', 'pos', 'cs_manager', 'store_supervisor'],
    '/finance': ['super_admin', 'admin', 'finance_manager', 'auditor'],
    '/settings': ['super_admin', 'admin', 'it_support'],
    '/reports': ['super_admin', 'admin', 'manager', 'warehouse_manager', 'finance_manager', 'auditor']
};

export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
    suggestedRoute?: string;
}

class AIPermissionService {
    /**
     * Check if user can access a route
     */
    canAccessRoute(userRole: UserRole | undefined, route: string): PermissionCheck {
        if (!userRole) {
            return {
                allowed: false,
                reason: 'User not authenticated',
                suggestedRoute: '/login'
            };
        }

        // Extract base route (remove query params)
        const baseRoute = route.split('?')[0];

        // Check if route has permissions defined
        const allowedRoles = ROUTE_PERMISSIONS[baseRoute];

        if (!allowedRoles) {
            // Route not in permissions list - allow by default (public route)
            return { allowed: true };
        }

        // Check if user's role is in allowed list
        if (allowedRoles.includes(userRole)) {
            return { allowed: true };
        }

        // Permission denied
        return {
            allowed: false,
            reason: `Your role (${userRole}) cannot access ${baseRoute}`,
            suggestedRoute: this.getSuggestedRoute(userRole)
        };
    }

    /**
     * Get suggested route based on user role
     */
    private getSuggestedRoute(userRole: UserRole): string {
        const roleRoutes: Record<UserRole, string> = {
            super_admin: '/dashboard',
            admin: '/dashboard',
            hr: '/employees',
            finance_manager: '/finance',
            procurement_manager: '/procurement',
            cs_manager: '/customers',
            it_support: '/settings',
            auditor: '/finance',
            warehouse_manager: '/wms',
            dispatcher: '/wms',
            picker: '/wms',
            driver: '/wms',
            inventory_specialist: '/inventory',
            manager: '/dashboard',
            store_supervisor: '/pos',
            pos: '/pos'
        };

        return roleRoutes[userRole] || '/dashboard';
    }

    /**
     * Filter suggestions based on user permissions
     */
    filterSuggestionsByPermissions(suggestions: string[], userRole: UserRole | undefined): string[] {
        if (!userRole) return [];

        return suggestions.filter(suggestion => {
            // Extract potential route from suggestion
            // This is a simple heuristic - can be improved
            const lowerSuggestion = suggestion.toLowerCase();

            // Check common keywords and their routes
            const routeMap: Record<string, string> = {
                'inventory': '/inventory',
                'product': '/inventory',
                'stock': '/inventory',
                'order': '/procurement',
                'po': '/procurement',
                'purchase': '/procurement',
                'employee': '/employees',
                'staff': '/employees',
                'customer': '/customers',
                'pos': '/pos',
                'sale': '/pos',
                'warehouse': '/wms',
                'wms': '/wms',
                'pick': '/wms',
                'pack': '/wms',
                'dispatch': '/wms',
                'dashboard': '/dashboard',
                'finance': '/finance',
                'settings': '/settings'
            };

            // Find matching route
            for (const [keyword, route] of Object.entries(routeMap)) {
                if (lowerSuggestion.includes(keyword)) {
                    const check = this.canAccessRoute(userRole, route);
                    return check.allowed;
                }
            }

            // If no route found, allow (might be a generic suggestion)
            return true;
        });
    }

    /**
     * Get permission-aware error message
     */
    getPermissionDeniedMessage(userRole: UserRole | undefined, route: string): string {
        const check = this.canAccessRoute(userRole, route);

        if (check.allowed) {
            return '';
        }

        const messages: Record<UserRole, string> = {
            pos: 'As a cashier, you can access POS, customers, and your dashboard.',
            picker: 'As a picker, you can access warehouse operations and inventory.',
            driver: 'As a driver, you can access warehouse operations and delivery jobs.',
            dispatcher: 'As a dispatcher, you can access warehouse operations and procurement.',
            warehouse_manager: 'As a warehouse manager, you have access to warehouse, inventory, and procurement.',
            store_supervisor: 'As a store supervisor, you can access POS, inventory, and customers.',
            manager: 'As a store manager, you have access to most features except Central Ops-specific functions.',
            inventory_specialist: 'As an inventory specialist, you can access inventory and warehouse operations.',
            hr: 'As HR, you can access employee management and reports.',
            finance_manager: 'As finance manager, you can access financial reports and expenses.',
            procurement_manager: 'As procurement manager, you can access procurement and suppliers.',
            cs_manager: 'As customer service manager, you can access customers and reports.',
            it_support: 'As IT support, you can access system settings and all pages for troubleshooting.',
            auditor: 'As an auditor, you can access financial reports and compliance data.',
            admin: 'As an admin, you have access to most features.',
            super_admin: 'As super admin, you have full access to all features.'
        };

        return messages[userRole!] || check.reason || 'You do not have permission to access this page.';
    }
}

export const aiPermissionService = new AIPermissionService();
