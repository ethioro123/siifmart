import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { hasPermission, PERMISSIONS } from '../utils/permissions';

interface ProtectedProps {
    children: React.ReactNode;
    permission: keyof typeof PERMISSIONS;
    fallback?: React.ReactNode;
    showMessage?: boolean;
}

/**
 * Protected Component
 * Renders children only if user has the required permission
 * 
 * Usage:
 * <Protected permission="ADD_PRODUCT">
 *   <button>Add Product</button>
 * </Protected>
 */
export function Protected({ children, permission, fallback = null, showMessage = false }: ProtectedProps) {
    const { user } = useStore();

    const allowed = hasPermission(user?.role, permission);

    if (!allowed) {
        if (showMessage) {
            return (
                <div className="text-xs text-gray-500 italic">
                    Access restricted
                </div>
            );
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * ProtectedButton Component
 * Shows a disabled button with tooltip if user doesn't have permission
 */
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    permission: keyof typeof PERMISSIONS;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    title?: string;
}

export function ProtectedButton({ permission, children, className, ...props }: ProtectedButtonProps) {
    const { user } = useStore();
    const allowed = hasPermission(user?.role, permission);

    if (!allowed) {
        return (
            <button
                {...props}
                disabled
                className={`${className} opacity-50 cursor-not-allowed`}
                title="You don't have permission for this action"
            >
                {children}
            </button>
        );
    }

    return (
        <button {...props} className={className}>
            {children}
        </button>
    );
}

export default Protected;
