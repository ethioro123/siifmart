import React from 'react';
import { ChevronDown, LayoutDashboard, Trophy, ClipboardList, Calendar, FileText, DollarSign, Settings } from 'lucide-react';

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
    isMobileTabsOpen: boolean;
    setIsMobileTabsOpen: (val: boolean) => void;
    canViewPayroll: boolean;
}

export default function StaffProfileNavigation({
    activeProfileTab, setActiveProfileTab, isMobileTabsOpen, setIsMobileTabsOpen, canViewPayroll
}: StaffProfileNavigationProps) {
    const activeTab = PROFILE_TABS.find(t => t.id === activeProfileTab) || PROFILE_TABS[0];

    return (
        <div className="mb-5">
            {/* Desktop Segmented Control Dock */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl overflow-x-auto no-scrollbar select-none" role="tablist">
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

            {/* Mobile Dropdown */}
            <div className="md:hidden relative">
                <button 
                    type="button"
                    onClick={() => setIsMobileTabsOpen(!isMobileTabsOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-semibold text-xs shadow-xs"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[var(--theme-accent)] flex items-center justify-center">
                            <activeTab.icon size={13} />
                        </div>
                        <span>{activeTab.label}</span>
                    </div>
                    <ChevronDown size={14} className={`text-[var(--theme-text-muted)] transition-transform duration-200 ${isMobileTabsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileTabsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-[var(--shadow-modal)] z-50 overflow-hidden divide-y divide-[var(--theme-border-subtle)] animate-in fade-in duration-150">
                        {PROFILE_TABS.map((tab) => {
                            if (tab.id === 'payroll' && !canViewPayroll) return null;
                            const isSelected = activeProfileTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => { setActiveProfileTab(tab.id); setIsMobileTabsOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs transition-colors text-left ${
                                        isSelected 
                                            ? 'bg-blue-500/10 text-[var(--theme-accent)] font-semibold' 
                                            : 'text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] font-medium'
                                    }`}
                                >
                                    <tab.icon size={15} className={isSelected ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
