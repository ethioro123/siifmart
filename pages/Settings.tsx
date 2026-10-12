import React, { useState } from 'react';
import {
    LucideIcon, Globe, ShoppingCart, Box, Shield, Bell, Database, Printer,
    FileText, Tag, Users, DollarSign, MapPin, List, Trophy, CloudLightning, X, Network
} from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { Protected } from '../components/Protected';

import GeneralSettings from '../components/settings/GeneralSettings';
import WMSSettings from '../components/settings/WMSSettings';
import POSSettings from '../components/settings/POSSettings';
import FinanceSettings from '../components/settings/FinanceSettings';
import InfrastructureSettings from '../components/settings/InfrastructureSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AuditSettings from '../components/settings/AuditSettings';
import DataSettings from '../components/settings/DataSettings';
import RoleSettings from '../components/settings/RoleSettings';
import GamificationSettings from '../components/settings/GamificationSettings';
import DiscountCodesSettings from '../components/settings/DiscountCodesSettings';
import LocationSettings from '../components/settings/LocationSettings';
import RegionsSettingsTab from '../components/settings/RegionsSettingsTab';
import HRSettings from '../components/settings/HRSettings';

type SettingsTab = 'general' | 'inventory' | 'pos' | 'discounts' | 'finance' | 'hr' | 'roles' | 'locations' | 'regions' | 'infrastructure' | 'integrations' | 'security' | 'notifications' | 'data' | 'audit' | 'gamification';

export default function SettingsPage() {
    const { user } = useStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isNavOpen, setIsNavOpen] = useState(false);

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: LucideIcon, label: string }) => (
        <button
            type="button"
            onClick={() => {
                setActiveTab(id);
                setIsNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-medium mb-1 cursor-pointer ${activeTab === id
                ? 'bg-[#0071E3] dark:bg-[#2997FF] text-white shadow-xs font-semibold'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                }`}
        >
            <Icon size={16} className={activeTab === id ? 'text-white' : 'text-[var(--theme-text-secondary)]'} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar Overlay */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] animate-in fade-in duration-200"
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 w-72 z-[50]
                transition-all duration-300 ease-out transform
                ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:z-0
            `}>
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3.5 h-full overflow-y-auto custom-scrollbar shadow-xs">
                    <div className="flex items-center justify-between mb-4 px-2 lg:hidden">
                        <p className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Configuration</p>
                        <button onClick={() => setIsNavOpen(false)} title="Close Menu" className="p-1 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 px-2">Operational Rules</p>
                    <Protected permission="ACCESS_SETTINGS">
                        <TabButton id="general" icon={Globe} label="General & Slogan" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="locations" icon={MapPin} label="Locations & Sites" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="regions" icon={Network} label="Regional Administration" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="inventory" icon={Box} label="WMS & Inbound Rules" />
                    </Protected>
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="pos" icon={ShoppingCart} label="POS & Retail Station" />
                    </Protected>
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="discounts" icon={Tag} label="Discount & Promo Codes" />
                    </Protected>
                    <Protected permission="ACCESS_FINANCE">
                        <TabButton id="finance" icon={DollarSign} label="Financial & Tax Policy" />
                    </Protected>
                    <Protected permission="EDIT_EMPLOYEE">
                        <TabButton id="hr" icon={Users} label="HR & Workforce Policy" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="infrastructure" icon={Printer} label="Infrastructure & Devices" />
                    </Protected>

                    {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'auditor') && (
                        <>
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mt-4 mb-2 px-2">Enterprise Security</p>
                            <Protected permission="MANAGE_ROLES">
                                <TabButton id="roles" icon={Users} label="Roles & Zero-Trust" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="security" icon={Shield} label="Loss Prevention & PIN" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="integrations" icon={CloudLightning} label="API & Integrations" />
                            </Protected>
                            <Protected permission="VIEW_AUDIT_LOGS">
                                <TabButton id="audit" icon={FileText} label="System Audit Log" />
                            </Protected>
                            <Protected permission="ACCESS_SETTINGS">
                                <TabButton id="notifications" icon={Bell} label="Alert Notifications" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="data" icon={Database} label="Data Management" />
                            </Protected>
                            <Protected permission="MANAGE_WAREHOUSE">
                                <TabButton id="gamification" icon={Trophy} label="Warehouse Gamification" />
                            </Protected>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex flex-col relative overflow-hidden h-full shadow-xs">
                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-card)]/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsNavOpen(true)}
                            title="Open Configuration Menu"
                            className="p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors lg:hidden cursor-pointer"
                        >
                            <List size={18} />
                        </button>
                        <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Configuration / <span className="text-[var(--theme-text-primary)] capitalize font-semibold">{activeTab === 'general' ? 'General & Slogan' : activeTab}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'locations' && (
                        <Protected permission="MANAGE_WAREHOUSE">
                            <LocationSettings />
                        </Protected>
                    )}
                    {activeTab === 'regions' && (
                        <Protected permission="MANAGE_WAREHOUSE">
                            <RegionsSettingsTab />
                        </Protected>
                    )}
                    {activeTab === 'pos' && (
                        <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                            <POSSettings />
                        </Protected>
                    )}
                    {activeTab === 'discounts' && (
                        <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                            <DiscountCodesSettings />
                        </Protected>
                    )}
                    {activeTab === 'finance' && (
                        <Protected permission="ACCESS_FINANCE">
                            <FinanceSettings />
                        </Protected>
                    )}
                    {activeTab === 'hr' && (
                        <Protected permission="EDIT_EMPLOYEE">
                            <HRSettings />
                        </Protected>
                    )}
                    {activeTab === 'roles' && (
                        <Protected permission="MANAGE_ROLES">
                            <RoleSettings />
                        </Protected>
                    )}
                    {activeTab === 'integrations' && (
                        <Protected permission="EDIT_SYSTEM_SETTINGS">
                            <IntegrationsSettings />
                        </Protected>
                    )}
                    {activeTab === 'security' && (
                        <Protected permission="EDIT_SYSTEM_SETTINGS">
                            <SecuritySettings />
                        </Protected>
                    )}
                    {activeTab === 'audit' && (
                        <Protected permission="VIEW_AUDIT_LOGS">
                            <AuditSettings />
                        </Protected>
                    )}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'inventory' && (
                        <Protected permission="MANAGE_WAREHOUSE">
                            <WMSSettings />
                        </Protected>
                    )}
                    {activeTab === 'infrastructure' && (
                        <Protected permission="EDIT_SYSTEM_SETTINGS">
                            <InfrastructureSettings />
                        </Protected>
                    )}
                    {activeTab === 'data' && (
                        <Protected permission="EDIT_SYSTEM_SETTINGS">
                            <DataSettings />
                        </Protected>
                    )}
                    {activeTab === 'gamification' && <GamificationSettings />}
                </div>
            </div>
        </div>
    );
}
