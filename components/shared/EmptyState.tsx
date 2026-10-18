import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {icon && (
                <div className="text-[var(--theme-text-muted)] mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold tracking-tight text-[var(--theme-text-primary)] mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-[var(--theme-text-secondary)] mb-6 max-w-md">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-5 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold rounded-xl hover:bg-[var(--theme-primary-hover)] transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
