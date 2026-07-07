import React, { useState } from 'react';
import {
    Globe, ShoppingCart, Box, Shield, Bell, Database, Printer, Key,
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
            onClick={() => {
                setActiveTab(id);
                setIsNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium mb-2 ${activeTab === id
                ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar Overlay */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] animate-in fade-in duration-300"
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 w-72 z-[50]
                transition-all duration-500 ease-out transform
                ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:z-0
            `}>
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 h-full overflow-y-auto custom-scrollbar shadow-2xl">
                    <div className="flex items-center justify-between mb-6 px-2 lg:hidden">
                        <p className="text-xs font-black text-cyber-primary uppercase tracking-widest">Configuration</p>
                        <button onClick={() => setIsNavOpen(false)} title="Close Menu" className="text-gray-500 hover:text-white">
                            <span className="text-2xl font-bold">&times;</span>
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">System Config</p>
                    <Protected permission="ACCESS_SETTINGS">
                        <TabButton id="general" icon={Globe} label="General" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="locations" icon={MapPin} label="Locations" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="inventory" icon={Box} label="WMS Rules" />
                    </Protected>
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="pos" icon={ShoppingCart} label="POS & Retail" />
                    </Protected>
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="discounts" icon={Tag} label="Discount Codes" />
                    </Protected>
                    <Protected permission="ACCESS_FINANCE">
                        <TabButton id="finance" icon={DollarSign} label="Finance" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="infrastructure" icon={Printer} label="Infrastructure" />
                    </Protected>

                    {user?.role === 'super_admin' && (
                        <>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-4 px-2">Infrastructure</p>
                            <Protected permission="MANAGE_ROLES">
                                <TabButton id="roles" icon={Users} label="Roles & Access" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="integrations" icon={CloudLightning} label="Integrations" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="security" icon={Shield} label="Security" />
                            </Protected>
                            <Protected permission="VIEW_AUDIT_LOGS">
                                <TabButton id="audit" icon={FileText} label="Audit Log" />
                            </Protected>
                            <Protected permission="ACCESS_SETTINGS">
                                <TabButton id="notifications" icon={Bell} label="Notifications" />
                            </Protected>
                            <Protected permission="EDIT_SYSTEM_SETTINGS">
                                <TabButton id="data" icon={Database} label="Data Mgmt" />
                            </Protected>
                            <Protected permission="MANAGE_WAREHOUSE">
                                <TabButton id="gamification" icon={Trophy} label="Gamification" />
                            </Protected>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl flex flex-col relative overflow-hidden h-full">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsNavOpen(true)}
                            title="Open Configuration Menu"
                            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors lg:hidden"
                        >
                            <List size={20} />
                        </button>
                        <div className="text-xs text-gray-500">
                            Configuration / <span className="text-white capitalize">{activeTab}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
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
