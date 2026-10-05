import React from 'react';

interface DashboardSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
}

export const DashboardSection = ({ title, icon: Icon, children, className = "" }: DashboardSectionProps) => (
    <div className={`space-y-4 mb-10 ${className}`}>
        <div className="flex items-center gap-3 px-2">
            <div className="p-1.5 bg-[#FFDBBB]/15 dark:bg-[#FFDBBB]/15 rounded-lg border border-[#997E67]/30">
                <Icon size={16} className="text-[#664930] dark:text-[#FFDBBB]" />
            </div>
            <h2 className="text-xs font-black text-[#664930] dark:text-[#CCBEB1] uppercase tracking-[0.25em]">{title}</h2>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-[#CCBEB1]/40 to-transparent dark:from-[#CCBEB1]/20 dark:to-transparent ml-4"></div>
        </div>
        {children}
    </div>
);

