import React, { useState } from 'react';
import {
    Globe, Key, Webhook, Plus, Trash2, CheckCircle, XCircle, Copy,
    RefreshCw, ExternalLink, Shield, Database, ShoppingCart
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const IntegrationCard = ({ name, desc, icon: Icon, connected, category }: any) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group relative overflow-hidden">
        {connected && (
            <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg border-l border-b border-green-500/20 flex items-center gap-1">
                <CheckCircle size={10} /> Active
            </div>
        )}
        <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg ${connected ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-white/5 text-gray-400'}`}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className="font-bold text-white">{name}</h4>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">{category}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
        </div>
        <button className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${connected
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-gray-400 hover:bg-cyber-primary hover:text-black'
            }`}>
            {connected ? 'Manage Configuration' : 'Connect Integration'}
        </button>
    </div>
);

export default function IntegrationsSettings() {
    const { showToast } = useStore();
    const [activeTab, setActiveTab] = useState<'marketplace' | 'api' | 'webhooks'>('marketplace');

    // API Keys State (Migrated from Settings.tsx)
    const [apiKeys, setApiKeys] = useState([
        { id: 1, name: 'External Storefront', key: 'sk_live_9f8a7d6e5c4b3a2', created: '2024-12-01', lastUsed: '2 mins ago' },
        { id: 2, name: 'Mobile App API', key: 'sk_live_1a2b3c4d5e6f7g8', created: '2024-11-15', lastUsed: '1 hour ago' },
    ]);
    const [newKeyName, setNewKeyName] = useState('');

    const generateKey = () => {
        if (!newKeyName) return;
        const newKey = {
            id: Date.now(),
            name: newKeyName,
            key: `sk_live_${Math.random().toString(36).substring(2, 18)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: 'Never'
        };
        setApiKeys([...apiKeys, newKey]);
        setNewKeyName('');
        showToast('API Key Generated Successfully', 'success');
    };

    const deleteKey = (id: number) => {
        setApiKeys(apiKeys.filter(k => k.id !== id));
        showToast('API Key Revoked', 'error'); // 'error' used for destructive color
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
                <Globe className="text-purple-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-purple-400 font-bold text-sm">Integration Hub</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage external connections, API keys, and marketplace extensions.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* SIDEBAR */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
                        { id: 'api', label: 'API Keys', icon: Key },
                        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === tab.id
                                    ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-cyber-primary' : ''} />
                            <span className="font-bold text-sm">{tab.label}</span>
                        </button>
                    ))}

                    <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                        <h5 className="text-blue-400 font-bold text-xs mb-2 flex items-center gap-2">
                            <Database size={12} /> Developer Docs
                        </h5>
                        <p className="text-[10px] text-gray-400 mb-3">
                            Access our full API documentation to build custom integrations.
                        </p>
                        <button className="text-[10px] text-white bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-500/30 transition-colors w-full justify-center border border-blue-500/20">
                            View Documentation <ExternalLink size={10} />
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">

                    {/* MARKETPLACE */}
                    {activeTab === 'marketplace' && (
                        <div className="animate-in fade-in">
                            <SectionHeader title="App Marketplace" desc="Extend functionality with third-party tools" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <IntegrationCard
                                    name="SAP S/4HANA"
                                    category="ERP"
                                    desc="Sync inventory, finance, and procurement data with enterprise ERP."
                                    icon={Database}
                                    connected={true}
                                />
                                <IntegrationCard
                                    name="Stripe Connect"
                                    category="Payments"
                                    desc="Accept credit cards, digital wallets, and payout to vendors."
                                    icon={CreditCard} // Using imported icon from lucide requires import
                                    connected={true}
                                />
                                <IntegrationCard
                                    name="Salesforce CRM"
                                    category="CRM"
                                    desc="Sync customer profiles and purchase history for marketing."
                                    icon={Shield}
                                    connected={false}
                                />
                                <IntegrationCard
                                    name="Slack Notifications"
                                    category="Communication"
                                    desc="Receive system alerts and approval requests in Slack channels."
                                    icon={Webhook}
                                    connected={false}
                                />
                            </div>
                        </div>
                    )}

                    {/* API KEYS */}
                    {activeTab === 'api' && (
                        <div className="animate-in fade-in">
                            <SectionHeader title="API Credentials" desc="Manage access tokens for external applications" />

                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-6">
                                <h4 className="text-sm font-bold text-white mb-4">Generate New Key</h4>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Enter key name (e.g. 'Warehouse Tablet')"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-cyber-primary outline-none"
                                    />
                                    <button
                                        onClick={generateKey}
                                        disabled={!newKeyName}
                                        className="bg-cyber-primary text-black font-bold px-4 py-2 rounded-lg text-xs hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Generate Key
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {apiKeys.map(key => (
                                    <div key={key.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                                                <Key size={20} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-white text-sm">{key.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="bg-black/50 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono border border-white/5">
                                                        {key.key.substring(0, 12)}...
                                                    </code>
                                                    <span className="text-[10px] text-gray-500">• Created {key.created}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right mr-2">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Last Used</div>
                                                <div className="text-xs text-white">{key.lastUsed}</div>
                                            </div>
                                            <button
                                                onClick={() => showToast('Key copied to clipboard', 'success')}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                title="Copy Key"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteKey(key.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                title="Revoke Key"
                                            >
                                                <Trash2 size={16} />
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
                            <SectionHeader title="Webhooks" desc="Event-driven notifications for real-time sync" />

                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <Webhook size={32} className="text-gray-500" />
                                </div>
                                <h4 className="text-white font-bold mb-1">No Webhooks Configured</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
                                    Register endpoints to receive realtime JSON payloads when specific events occur.
                                </p>
                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/10">
                                    + Add Endpoint
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Helper for icon dummy
const CreditCard = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
);
