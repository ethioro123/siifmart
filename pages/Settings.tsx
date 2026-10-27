import React, { useState } from 'react';
import {
    LucideIcon, Globe, ShoppingCart, Box, Shield, Bell, Database, Printer,
    FileText, Tag, Users, DollarSign, MapPin, List, Trophy, CloudLightning, X, Network
} from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { Protected } from '../components/Protected';
import { canSwitchCountry } from '../utils/permissions';

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

const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
    general: 'General & Slogan', inventory: 'WMS & Inbound Rules', pos: 'POS & Retail Station',
    discounts: 'Discount & Promo Codes', finance: 'Financial & Tax Policy', hr: 'HR & Workforce Policy',
    roles: 'Roles & Zero-Trust', locations: 'Locations & Sites', regions: 'Regional Administration',
    infrastructure: 'Infrastructure & Devices', integrations: 'API & Integrations', security: 'Loss Prevention & PIN',
    notifications: 'Alert Notifications', data: 'Data Management', audit: 'System Audit Log',
    gamification: 'Warehouse Gamification'
};

export default function SettingsPage() {
    const { user } = useStore();
    const isRegionalStaff = user?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL' || ['regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_it_manager', 'regional_compliance_manager'].includes(user?.role || '');

    const getDefaultSettingsTab = (): SettingsTab => {
        if (['regional_security_manager', 'regional_compliance_manager', 'auditor', 'country_compliance_manager', 'store_operations_auditor'].includes(user?.role || '')) {
            return 'audit';
        }
        if (['regional_it_manager', 'it_support', 'country_technology_director'].includes(user?.role || '')) {
            return 'infrastructure';
        }
        return isRegionalStaff ? 'regions' : 'general';
    };

    const [activeTab, setActiveTab] = useState<SettingsTab>(() => getDefaultSettingsTab());
    const [isNavOpen, setIsNavOpen] = useState(false);

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: LucideIcon, label: string }) => (
        <button
            type="button"
            onClick={() => {
                setActiveTab(id);
                setIsNavOpen(false);
            }}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`w-full min-h-11 flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-medium mb-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${activeTab === id
                ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] border border-[var(--theme-accent)] font-semibold'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                }`}
        >
            <Icon size={16} className={activeTab === id ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar Overlay */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[40] animate-in fade-in duration-200"
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav aria-label="Settings sections" className={`
                fixed inset-y-0 left-0 w-72 z-[50]
                transition-all duration-300 ease-out transform
                ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:z-0
            `}>
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3.5 h-full overflow-y-auto custom-scrollbar shadow-xs">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div>
                            <p className="text-base font-semibold text-[var(--theme-text-primary)]">Settings</p>
                            <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">Configuration for your authorized scope</p>
                        </div>
                        <button type="button" onClick={() => setIsNavOpen(false)} aria-label="Close settings navigation" className="p-2 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] cursor-pointer lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
                            <X size={18} />
                        </button>
                    </div>

                    {isRegionalStaff ? (
                        <>
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 px-2">Regional Operational Config</p>
                            <Protected permission="ACCESS_REGIONAL_OPS">
                                <TabButton id="regions" icon={Network} label="Regional Administration" />
                            </Protected>
                            <Protected permission="MANAGE_WAREHOUSE">
                                <TabButton id="locations" icon={MapPin} label="Locations & Sites" />
                            </Protected>
                            <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                                <TabButton id="pos" icon={ShoppingCart} label="POS & Retail Station" />
                            </Protected>
                            <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                                <TabButton id="discounts" icon={Tag} label="Discount & Promo Codes" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="infrastructure" icon={Printer} label="Infrastructure & Devices" />
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
                        </>
                    ) : (
                        <>
                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 px-2">Operational Rules</p>
                            <Protected permission="ACCESS_SETTINGS">
                                <TabButton id="general" icon={Globe} label="General & Slogan" />
                            </Protected>
                            <Protected permission="MANAGE_WAREHOUSE">
                                <TabButton id="locations" icon={MapPin} label="Locations & Sites" />
                            </Protected>
                            <Protected permission="ACCESS_REGIONAL_OPS">
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

                            {(['group_ceo', 'country_managing_director', 'country_technology_director', 'it_support', 'country_compliance_manager', 'auditor', 'regional_security_manager', 'country_operations_director'].includes(user?.role || '') || canSwitchCountry(user)) && (
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
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex flex-col relative overflow-hidden h-full shadow-xs">
                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-card)] z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsNavOpen(true)}
                            title="Open Settings sections"
                            aria-label="Open settings navigation"
                            aria-expanded={isNavOpen}
                            className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors lg:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            <List size={18} />
                        </button>
                        <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Settings <span aria-hidden="true" className="mx-1">/</span><span className="text-[var(--theme-text-primary)] font-semibold">{SETTINGS_TAB_LABELS[activeTab]}</span>
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
                        <Protected permission="ACCESS_REGIONAL_OPS">
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
