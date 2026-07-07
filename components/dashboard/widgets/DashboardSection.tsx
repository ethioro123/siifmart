import React from 'react';

interface DashboardSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
}

export const DashboardSection = ({ title, icon: Icon, children, className = "" }: DashboardSectionProps) => (
    <div className={`space-y-4 mb-12 ${className}`}>
        <div className="flex items-center gap-3 px-2">
            <div className="p-1.5 bg-white/50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <Icon size={16} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">{title}</h2>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-200 to-transparent dark:from-white/10 dark:to-transparent ml-4"></div>
        </div>
        {children}
    </div>
);
