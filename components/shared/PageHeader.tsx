import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    stats?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions, stats }: PageHeaderProps) {
    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
            </div>
            {stats && <div>{stats}</div>}
        </div>
    );
}
