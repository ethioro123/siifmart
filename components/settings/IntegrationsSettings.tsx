import React, { useState } from 'react';
import {
    Globe, Key, Webhook, Plus, Trash2, CheckCircle, Copy,
    ExternalLink, Shield, Database, ShoppingCart, CreditCard, MessageSquare
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{title}</h3>
        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">{desc}</p>
    </div>
);

const IntegrationCard = ({ name, desc, icon: Icon, connected, category, onAction }: any) => (
    <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 hover:border-[#2C5E3B]/30 transition-all flex flex-col justify-between group relative overflow-hidden shadow-sm">
        {connected && (
            <div className="absolute top-0 right-0 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] text-[10px] uppercase font-black px-3 py-1 rounded-bl-2xl border-l border-b border-emerald-200 dark:border-emerald-950/30 flex items-center gap-1">
                <CheckCircle size={10} /> Active
            </div>
        )}
        <div>
            <div className="flex items-start gap-3.5 mb-3">
                <div className={`p-3 rounded-2xl border ${connected ? 'bg-emerald-50 text-[#2C5E3B] border-emerald-200 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] dark:border-emerald-950/30' : 'bg-white dark:bg-white/5 text-stone-500 dark:text-gray-400 border-[#E2DCCE] dark:border-white/10'}`}>
                    <Icon size={22} />
                </div>
                <div className="pr-12">
                    <h4 className="font-black text-[#1E3F27] dark:text-white text-sm">{name}</h4>
                    <div className="text-[10px] uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83] font-bold mt-0.5">{category}</div>
                </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-gray-400 leading-relaxed mb-4">{desc}</p>
        </div>

        <button
            type="button"
            onClick={onAction}
            className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm ${connected
                ? 'bg-white dark:bg-white/5 text-stone-700 dark:text-gray-200 border border-[#E2DCCE] dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10'
                : 'bg-[#2C5E3B] text-white hover:opacity-90'
                }`}
        >
            {connected ? 'Manage Configuration' : 'Connect Integration'}
        </button>
    </div>
);

interface ApiKey {
    id: number;
    name: string;
    key: string;
    created: string;
    lastUsed: string;
}

export default function IntegrationsSettings() {
    const { showToast } = useStore();
    const [activeTab, setActiveTab] = useState<'marketplace' | 'api' | 'webhooks'>('marketplace');

    // API Keys State
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
        const saved = localStorage.getItem('siifmart_api_keys');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return [
            { id: 1, name: 'External Storefront API', key: 'sk_live_9f8a7d6e5c4b3a298172', created: '2025-01-10', lastUsed: '2 mins ago' },
            { id: 2, name: 'Mobile App API', key: 'sk_live_1a2b3c4d5e6f7g8h9102', created: '2025-02-15', lastUsed: '1 hour ago' },
        ];
    });
    const [newKeyName, setNewKeyName] = useState('');

    const generateKey = () => {
        if (!newKeyName.trim()) return;
        const newKey = {
            id: Date.now(),
            name: newKeyName.trim(),
            key: `sk_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: 'Never'
        };
        const updated = [...apiKeys, newKey];
        setApiKeys(updated);
        localStorage.setItem('siifmart_api_keys', JSON.stringify(updated));
        setNewKeyName('');
        showToast('API Key Generated Successfully', 'success');
    };

    const deleteKey = (id: number) => {
        const updated = apiKeys.filter(k => k.id !== id);
        setApiKeys(updated);
        localStorage.setItem('siifmart_api_keys', JSON.stringify(updated));
        showToast('API Key Revoked', 'info');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard?.writeText(text);
        showToast('API Key copied to clipboard', 'success');
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Globe className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Enterprise Integration Hub</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Manage external connectors, ERP data pipelines, secure API keys, and event-driven webhooks.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* SIDEBAR */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'marketplace', label: 'App Marketplace', icon: ShoppingCart },
                        { id: 'api', label: 'API Credentials', icon: Key },
                        { id: 'webhooks', label: 'Event Webhooks', icon: Webhook },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#2C5E3B] text-white shadow-md font-bold'
                                : 'text-stone-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-[#1E3F27] dark:hover:text-white font-medium'
                                }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-stone-400'} />
                            <span className="text-xs">{tab.label}</span>
                        </button>
                    ))}

                    <div className="mt-6 p-4 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-3xl space-y-2">
                        <h5 className="text-[#1E3F27] dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Database size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Developer Docs
                        </h5>
                        <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-relaxed">
                            Access full REST & Webhook documentation to build custom integrations.
                        </p>
                        <button
                            type="button"
                            onClick={() => showToast('Opening API Documentation...', 'info')}
                            className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors w-full justify-center border border-emerald-200 dark:border-emerald-950/30 cursor-pointer mt-1"
                        >
                            View Documentation <ExternalLink size={12} />
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">

                    {/* MARKETPLACE */}
                    {activeTab === 'marketplace' && (
                        <div className="animate-in fade-in">
                            <SectionHeader title="App Marketplace" desc="Extend SIIFMART with enterprise ERP, payment, and CRM connectors" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <IntegrationCard
                                    name="SAP S/4HANA"
                                    category="Enterprise ERP"
                                    desc="Bi-directional sync of inventory ledger, general ledger journal entries, and purchase orders."
                                    icon={Database}
                                    connected={true}
                                    onAction={() => showToast('SAP S/4HANA configuration active', 'info')}
                                />
                                <IntegrationCard
                                    name="Stripe Connect"
                                    category="Payment Gateway"
                                    desc="Accept multi-currency card payments, digital wallets, and automated vendor payouts."
                                    icon={CreditCard}
                                    connected={true}
                                    onAction={() => showToast('Stripe Connect gateway operational', 'info')}
                                />
                                <IntegrationCard
                                    name="Salesforce CRM"
                                    category="Omnichannel CRM"
                                    desc="Synchronize B2B customer accounts, loyalty tier balances, and transaction history."
                                    icon={Shield}
                                    connected={false}
                                    onAction={() => showToast('Salesforce integration ready for setup', 'info')}
                                />
                                <IntegrationCard
                                    name="Slack Notifications"
                                    category="Communication"
                                    desc="Receive real-time security alerts, low-stock notifications, and manager approvals in Slack."
                                    icon={MessageSquare}
                                    connected={false}
                                    onAction={() => showToast('Slack webhook setup ready', 'info')}
                                />
                            </div>
                        </div>
                    )}

                    {/* API KEYS */}
                    {activeTab === 'api' && (
                        <div className="animate-in fade-in">
                            <SectionHeader title="API Credentials" desc="Manage secret access tokens for external warehouse and POS integrations" />

                            <div className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 mb-6 space-y-3">
                                <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Generate New API Key</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter client application name (e.g. 'Warehouse Handheld')"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="flex-1 bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateKey}
                                        disabled={!newKeyName.trim()}
                                        className="bg-[#2C5E3B] text-white font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                                    >
                                        Generate Key
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {apiKeys.map(key => (
                                    <div key={key.id} className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-[#2C5E3B]/30 transition-all">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2.5 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl">
                                                <Key size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">{key.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="bg-white dark:bg-black/40 px-2 py-0.5 rounded-lg text-[10px] text-stone-600 dark:text-gray-300 font-mono border border-[#E2DCCE]/60 dark:border-white/5">
                                                        {key.key.substring(0, 14)}••••••••
                                                    </code>
                                                    <span className="text-[10px] text-stone-400">• Created {key.created}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-3 hidden sm:block">
                                                <div className="text-[9px] text-stone-400 uppercase font-black">Last Used</div>
                                                <div className="text-xs font-bold text-[#1E3F27] dark:text-white">{key.lastUsed}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(key.key)}
                                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl text-stone-500 hover:text-[#1E3F27] dark:hover:text-white transition-colors cursor-pointer"
                                                title="Copy Key"
                                            >
                                                <Copy size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteKey(key.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                                title="Revoke Key"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* WEBHOOKS */}
                    {activeTab === 'webhooks' && (
                        <div className="animate-in fade-in">
                            <SectionHeader title="Event Webhooks" desc="Event-driven JSON notifications for real-time order and inventory sync" />

                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-3xl bg-[#FAF8F5]/60 dark:bg-white/5 p-6">
                                <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-full mb-3">
                                    <Webhook size={28} />
                                </div>
                                <h4 className="text-[#1E3F27] dark:text-white font-black text-sm mb-1">Webhook Dispatcher Ready</h4>
                                <p className="text-xs text-stone-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
                                    Register external URLs to receive automated HTTP POST webhooks on order creation, stock adjustment, and refund events.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => showToast('Webhook registration modal ready for future setup', 'info')}
                                    className="px-5 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                >
                                    + Add Webhook Endpoint
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
