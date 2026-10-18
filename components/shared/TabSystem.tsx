import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number | string;
    disabled?: boolean;
}

interface TabSystemProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export default function TabSystem({ tabs, activeTab, onChange, className = '' }: TabSystemProps) {
    return (
        <div className={`flex gap-1.5 bg-[var(--theme-bg-subtle)] p-1 rounded-2xl border border-[var(--theme-border)] ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    className={`flex-1 px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === tab.id
                            ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-sm'
                            : tab.disabled
                                ? 'text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                        }`}
                >
                    {tab.icon && <span className="text-base">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id
                                ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'
                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)]'
                            }`}>
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
