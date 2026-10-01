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
        <div className="mb-6">
            {/* Desktop Segmented Pill Dock */}
            <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl overflow-x-auto no-scrollbar shadow-inner" role="tablist">
                {PROFILE_TABS.map((tab) => {
                    const isSelected = activeProfileTab === tab.id;
                    if (tab.id === 'payroll' && !canViewPayroll) return null;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveProfileTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                isSelected
                                    ? 'bg-[#2C5E3B] text-white dark:bg-[#EAE5D9] dark:text-[#18201B] shadow-sm shadow-[#2C5E3B]/20'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={15} className={isSelected ? 'text-white dark:text-[#18201B]' : 'text-stone-400 dark:text-stone-500'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden relative">
                <button 
                    onClick={() => setIsMobileTabsOpen(!isMobileTabsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[#1E3F27] dark:text-[#EAE5D9] font-bold text-xs shadow-xs"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <activeTab.icon size={16} />
                        </div>
                        <span>{activeTab.label}</span>
                    </div>
                    <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${isMobileTabsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileTabsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#E2DCCE]/60 dark:divide-white/5 animate-in fade-in duration-150">
                        {PROFILE_TABS.map((tab) => {
                            if (tab.id === 'payroll' && !canViewPayroll) return null;
                            const isSelected = activeProfileTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveProfileTab(tab.id); setIsMobileTabsOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors text-left ${
                                        isSelected 
                                            ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]' 
                                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <tab.icon size={16} className={isSelected ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400'} />
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
