import React from 'react';
import { LayoutDashboard, Trophy, ClipboardList, Calendar, FileText, DollarSign, Settings } from 'lucide-react';

export const PROFILE_TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'timeoff', label: 'Leave', icon: Calendar },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings }
];

interface StaffProfileNavigationProps {
    activeProfileTab: string;
    setActiveProfileTab: (id: string) => void;
    canViewPayroll: boolean;
}

export default function StaffProfileNavigation({
    activeProfileTab, setActiveProfileTab, canViewPayroll
}: StaffProfileNavigationProps) {
    const activeTab = PROFILE_TABS.find(t => t.id === activeProfileTab) || PROFILE_TABS[0];

    return (
        <div className="mb-4 sm:mb-5">
            {/* Desktop Segmented Control Dock */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl overflow-x-auto no-scrollbar select-none" role="tablist" aria-label="Profile sections">
                {PROFILE_TABS.map((tab) => {
                    const isSelected = activeProfileTab === tab.id;
                    if (tab.id === 'payroll' && !canViewPayroll) return null;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveProfileTab(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                isSelected
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium'
                            }`}
                        >
                            <tab.icon size={14} className={isSelected ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile section switcher: swipeable, always visible, and avoids a menu layer. */}
            <div className="md:hidden -mx-1 overflow-x-auto no-scrollbar overscroll-x-contain" role="tablist" aria-label="Profile sections">
                <div className="flex w-max min-w-full gap-2 px-1 pb-1">
                    {PROFILE_TABS.map((tab) => {
                        if (tab.id === 'payroll' && !canViewPayroll) return null;
                        const isSelected = activeProfileTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                onClick={() => setActiveProfileTab(tab.id)}
                                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                    isSelected
                                        ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-semibold'
                                        : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] font-medium'
                                }`}
                            >
                                <tab.icon size={16} aria-hidden="true" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
