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
        <div className={`flex gap-2 bg-black/30 p-1 rounded-xl border border-white/5 ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                            ? 'bg-cyber-primary text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                            : tab.disabled
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {tab.icon && <span className="text-lg">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id
                                ? 'bg-black/20 text-black'
                                : 'bg-white/10 text-gray-400'
                            }`}>
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
