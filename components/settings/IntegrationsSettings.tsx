import React, { useState } from 'react';
import {
    Globe, Key, Webhook, Plus, Trash2, CheckCircle2, Copy,
    ExternalLink, Shield, Database, ShoppingCart, CreditCard,
    MessageSquare, Smartphone, Zap, LucideIcon
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { Country, getCountryProfile } from '../../utils/localization';

// --- SUB-COMPONENTS ---
const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="mb-6 pb-4 border-b border-[var(--theme-border)]">
        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{desc}</p>
    </div>
);

interface IntegrationCardProps {
    name: string;
    desc: string;
    icon: LucideIcon;
    connected: boolean;
    category: string;
    badge?: string;
    onAction: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
    name, desc, icon: Icon, connected, category, badge, onAction
}) => (
    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col justify-between hover:border-[var(--theme-accent)]/30 transition-all shadow-xs relative">
        {connected && (
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> Active
            </div>
        )}
        <div>
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                    connected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                }`}>
                    <Icon size={18} />
                </div>
                <div className="pr-12">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{name}</h4>
                        {badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                {badge}
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--theme-text-secondary)] font-medium mt-0.5">
                        {category}
                    </div>
                </div>
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed mb-4">{desc}</p>
        </div>

        <button
            type="button"
            onClick={onAction}
            className={`w-full h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center ${
                connected
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)]'
                    : 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98]'
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

type TabType = 'marketplace' | 'api' | 'webhooks';

export default function IntegrationsSettings() {
    const { showToast } = useStore();
    const { settings, effectiveCountry } = useData();
    const [activeTab, setActiveTab] = useState<TabType>('marketplace');

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

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
        const newKey: ApiKey = {
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
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Globe size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Enterprise Integration Hub</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {countryProfile.name} ({activeCountry})
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Manage external connectors, sovereign payment rails, secure API keys, and event-driven webhooks.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* SIDEBAR TABS */}
                <div className="lg:col-span-1 space-y-1">
                    {[
                        { id: 'marketplace' as const, label: 'App Marketplace', icon: ShoppingCart },
                        { id: 'api' as const, label: 'API Credentials', icon: Key },
                        { id: 'webhooks' as const, label: 'Event Webhooks', icon: Webhook },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-xs font-medium ${
                                    isActive
                                        ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-white' : 'text-[var(--theme-text-secondary)]'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-4 p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2">
                        <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs flex items-center gap-1.5">
                            <Database size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            Developer Docs
                        </h5>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
                            Access full REST & Webhook documentation to build custom ERP and POS workflows.
                        </p>
                        <button
                            type="button"
                            onClick={() => showToast('Opening API Documentation...', 'info')}
                            className="text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-border)] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors w-full justify-center border border-[var(--theme-border)] cursor-pointer mt-1"
                        >
                            <span>View Documentation</span>
                            <ExternalLink size={12} className="text-[var(--theme-text-secondary)]" />
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs">

                    {/* MARKETPLACE */}
                    {activeTab === 'marketplace' && (
                        <div className="animate-in fade-in space-y-4">
                            <SectionHeader
                                title="App Marketplace"
                                desc={`Extend SIIFMART with sovereign payment gateways and enterprise ERP connectors for ${countryProfile.name}.`}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeCountry === 'ET' ? (
                                    <>
                                        <IntegrationCard
                                            name="Telebirr SuperApp"
                                            category="Sovereign Mobile Money"
                                            badge="ET Official"
                                            desc="Ethio Telecom direct merchant STK push, QR-code checkout, and automated B2C settlement."
                                            icon={Smartphone}
                                            connected={true}
                                            onAction={() => showToast('Telebirr gateway active', 'info')}
                                        />
                                        <IntegrationCard
                                            name="CBE Birr API"
                                            category="Direct Bank Rail"
                                            badge="ET Official"
                                            desc="Commercial Bank of Ethiopia real-time bank settlement and merchant collection rail."
                                            icon={CreditCard}
                                            connected={true}
                                            onAction={() => showToast('CBE Birr gateway operational', 'info')}
                                        />
                                        <IntegrationCard
                                            name="SAP S/4HANA"
                                            category="Enterprise ERP"
                                            desc="Bi-directional ledger synchronization, general ledger journal entries, and automated PO matching."
                                            icon={Database}
                                            connected={true}
                                            onAction={() => showToast('SAP S/4HANA sync operational', 'info')}
                                        />
                                        <IntegrationCard
                                            name="Chapa Checkout"
                                            category="Card & Payment Orchestration"
                                            desc="Accept Ethiopian debit cards, international Visa/Mastercard, and mobile wallets."
                                            icon={Zap}
                                            connected={false}
                                            onAction={() => showToast('Chapa configuration wizard ready', 'info')}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <IntegrationCard
                                            name="M-Pesa Daraja 2.0"
                                            category="Sovereign Mobile Money"
                                            badge="KE Official"
                                            desc="Safaricom STK push, C2B paybill reconciliation, and automated B2C vendor disbursements."
                                            icon={Smartphone}
                                            connected={true}
                                            onAction={() => showToast('M-Pesa Daraja 2.0 gateway active', 'info')}
                                        />
                                        <IntegrationCard
                                            name="Pesapal Gateway"
                                            category="Payment Orchestration"
                                            badge="KE Official"
                                            desc="Kenyan multi-bank debit card processing, mobile money fallback, and merchant settlement."
                                            icon={CreditCard}
                                            connected={true}
                                            onAction={() => showToast('Pesapal gateway operational', 'info')}
                                        />
                                        <IntegrationCard
                                            name="SAP S/4HANA"
                                            category="Enterprise ERP"
                                            desc="Bi-directional ledger synchronization, general ledger journal entries, and automated PO matching."
                                            icon={Database}
                                            connected={true}
                                            onAction={() => showToast('SAP S/4HANA sync operational', 'info')}
                                        />
                                        <IntegrationCard
                                            name="Stripe Connect"
                                            category="Global Card Gateway"
                                            desc="Accept international credit cards, Apple Pay, and digital wallet checkouts."
                                            icon={Zap}
                                            connected={false}
                                            onAction={() => showToast('Stripe Connect gateway ready', 'info')}
                                        />
                                    </>
                                )}

                                <IntegrationCard
                                    name="Salesforce CRM"
                                    category="Omnichannel CRM"
                                    desc="Synchronize B2B customer accounts, credit balances, and loyalty tier history."
                                    icon={Shield}
                                    connected={false}
                                    onAction={() => showToast('Salesforce integration ready for setup', 'info')}
                                />
                                <IntegrationCard
                                    name="Slack & Teams Alerts"
                                    category="Operational Notifications"
                                    desc="Receive real-time security alerts, shift variances, and low-stock escalation notices."
                                    icon={MessageSquare}
                                    connected={false}
                                    onAction={() => showToast('Team messaging setup ready', 'info')}
                                />
                            </div>
                        </div>
                    )}

                    {/* API KEYS */}
                    {activeTab === 'api' && (
                        <div className="animate-in fade-in space-y-5">
                            <SectionHeader
                                title="API Credentials"
                                desc="Manage secret access tokens for external warehouse scanners and POS stations."
                            />

                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                    Generate New API Key
                                </h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter client application name (e.g. 'Warehouse Handheld')"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateKey}
                                        disabled={!newKeyName.trim()}
                                        className="h-8 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white font-semibold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                                    >
                                        Generate Key
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {apiKeys.map(key => (
                                    <div
                                        key={key.id}
                                        className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 flex items-center justify-between hover:border-[var(--theme-accent)]/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                                                <Key size={15} />
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">{key.name}</h5>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <code className="bg-[var(--theme-bg-card)] px-2 py-0.5 rounded text-[11px] text-[var(--theme-text-primary)] font-mono border border-[var(--theme-border)]">
                                                        {key.key.substring(0, 14)}••••••••
                                                    </code>
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)]">Created {key.created}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-2 hidden sm:block">
                                                <div className="text-[9px] text-[var(--theme-text-secondary)] uppercase font-semibold">Last Used</div>
                                                <div className="text-xs font-semibold text-[var(--theme-text-primary)]">{key.lastUsed}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(key.key)}
                                                className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                                                title="Copy Key"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteKey(key.id)}
                                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-[var(--theme-text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                                                title="Revoke Key"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* WEBHOOKS */}
                    {activeTab === 'webhooks' && (
                        <div className="animate-in fade-in space-y-4">
                            <SectionHeader
                                title="Event Webhooks"
                                desc="Event-driven JSON notifications for real-time order, inventory, and shift events."
                            />

                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[var(--theme-border)] rounded-2xl bg-[var(--theme-bg-subtle)] p-6">
                                <div className="w-12 h-12 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] rounded-2xl flex items-center justify-center mb-3">
                                    <Webhook size={24} />
                                </div>
                                <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm mb-1">Webhook Dispatcher Ready</h4>
                                <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto mb-4 leading-relaxed">
                                    Register external URLs to receive automated HTTP POST webhooks on order creation, stock adjustments, and refund events.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => showToast('Webhook registration modal ready for future setup', 'info')}
                                    className="h-8 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Add Webhook Endpoint
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
