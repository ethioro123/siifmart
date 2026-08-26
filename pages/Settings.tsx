import React, { useState } from 'react';
import {
    Globe, ShoppingCart, Box, Shield, Bell, Database, Printer,
    FileText, Tag, Users, DollarSign, MapPin, List, Trophy, CloudLightning
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

type SettingsTab = 'general' | 'inventory' | 'pos' | 'discounts' | 'finance' | 'roles' | 'locations' | 'infrastructure' | 'integrations' | 'security' | 'notifications' | 'data' | 'audit' | 'gamification';

export default function SettingsPage() {
    const { user } = useStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isNavOpen, setIsNavOpen] = useState(false);

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
        <button
            type="button"
            onClick={() => {
                setActiveTab(id);
                setIsNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold mb-1.5 cursor-pointer ${activeTab === id
                ? 'bg-[#2C5E3B] text-white shadow-md'
                : 'text-stone-600 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                }`}
        >
            <Icon size={16} className={activeTab === id ? 'text-white' : 'text-stone-500 dark:text-gray-400'} />
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
                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-4 h-full overflow-y-auto custom-scrollbar shadow-sm">
                    <div className="flex items-center justify-between mb-4 px-2 lg:hidden">
                        <p className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">Configuration</p>
                        <button onClick={() => setIsNavOpen(false)} title="Close Menu" className="text-stone-500 hover:text-[#1E3F27] dark:hover:text-white text-xl font-bold">
                            &times;
                        </button>
                    </div>

                    <p className="text-[10px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">Operational Rules</p>
                    <Protected permission="ACCESS_SETTINGS">
                        <TabButton id="general" icon={Globe} label="General & Branding" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="locations" icon={MapPin} label="Locations & Sites" />
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
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="infrastructure" icon={Printer} label="Infrastructure & Devices" />
                    </Protected>

                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <>
                            <p className="text-[10px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mt-5 mb-3 px-2">Enterprise Security</p>
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
            <div className="flex-1 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] flex flex-col relative overflow-hidden h-full shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-[#E2DCCE]/60 dark:border-white/5 flex justify-between items-center bg-[#FAF8F5]/80 dark:bg-black/20 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsNavOpen(true)}
                            title="Open Configuration Menu"
                            className="p-2 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors lg:hidden cursor-pointer"
                        >
                            <List size={18} />
                        </button>
                        <div className="text-xs text-stone-500 dark:text-gray-400 font-bold">
                            Configuration / <span className="text-[#1E3F27] dark:text-white capitalize font-black">{activeTab}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'locations' && <LocationSettings />}
                    {activeTab === 'pos' && <POSSettings />}
                    {activeTab === 'discounts' && <DiscountCodesSettings />}
                    {activeTab === 'finance' && <FinanceSettings />}
                    {activeTab === 'roles' && <RoleSettings />}
                    {activeTab === 'integrations' && <IntegrationsSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'audit' && <AuditSettings />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'inventory' && <WMSSettings />}
                    {activeTab === 'infrastructure' && <InfrastructureSettings />}
                    {activeTab === 'data' && <DataSettings />}
                    {activeTab === 'gamification' && <GamificationSettings />}
                </div>
            </div>
        </div>
    );
}
