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
        <>
            {/* Desktop Tabs */}
            <div className="hidden md:flex border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar" role="tablist">
                {PROFILE_TABS.map((tab) => {
                    const isSelected = activeProfileTab === tab.id;
                    if (tab.id === 'payroll' && !canViewPayroll) return null;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveProfileTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${isSelected ? 'text-cyber-primary border-cyber-primary bg-cyber-primary/5' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden mb-6 relative">
                <button 
                    onClick={() => setIsMobileTabsOpen(!isMobileTabsOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <activeTab.icon size={20} className="text-cyber-primary" />
                        {activeTab.label}
                    </div>
                    <ChevronDown size={20} className={`text-cyber-primary transition-transform duration-300 ${isMobileTabsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileTabsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-cyber-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {PROFILE_TABS.map((tab) => {
                            if (tab.id === 'payroll' && !canViewPayroll) return null;
                            const isSelected = activeProfileTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveProfileTab(tab.id); setIsMobileTabsOpen(false); }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-bold transition-colors ${isSelected ? 'bg-cyber-primary/10 text-cyber-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
