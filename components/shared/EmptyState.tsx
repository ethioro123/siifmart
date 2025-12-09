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
                <div className="text-gray-600 mb-4 opacity-50">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-accent transition-colors shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
