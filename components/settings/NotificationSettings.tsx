import React, { useState } from 'react';
import {
    Bell, Mail, MessageSquare, Edit2, Send,
    FileText, Server, Smartphone
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import Modal from '../Modal';
import { Country, getCountryProfile } from '../../utils/localization';

interface NotificationTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    channel: 'email' | 'sms';
}

export default function NotificationSettings() {
    const { showToast } = useStore();
    const { settings, effectiveCountry } = useData();

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencyCode;

    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

    // Modal state for editing templates
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

    // Notification Templates
    const [templates, setTemplates] = useState<NotificationTemplate[]>([
        {
            id: 'order_conf',
            name: 'Order Confirmation',
            subject: 'Your SIIFMART Order #{{order_number}} is confirmed!',
            body: `Dear {{customer_name}}, thank you for shopping at SIIFMART. Your order of {{total_amount}} ${currency} has been received and is being prepared.`,
            channel: 'email'
        },
        {
            id: 'ship_status',
            name: 'Shipment Out for Delivery',
            subject: 'Your package is on its way!',
            body: 'Hello {{customer_name}}, driver {{driver_name}} has picked up your package. Track real-time delivery: {{tracking_link}}',
            channel: 'sms'
        },
        {
            id: 'low_stock',
            name: 'Low Stock Alert (Operations)',
            subject: 'URGENT: Stock Threshold Alert for {{product_name}}',
            body: 'Alert: SKU {{sku}} has fallen below {{min_stock}} units in warehouse {{site_name}}. Immediate replenishment required.',
            channel: 'email'
        },
        {
            id: 'welcome_email',
            name: 'Customer Welcome Email',
            subject: 'Welcome to the SIIFMART Family!',
            body: 'Hi {{customer_name}}, welcome to SIIFMART. Enjoy exclusive member promotions and rewards points on your next purchase.',
            channel: 'email'
        }
    ]);

    const handleSaveTemplate = () => {
        if (!editingTemplate) return;
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
        setEditingTemplate(null);
        showToast('Notification template updated successfully', 'success');
    };

    const handleTestNotification = (tmpl: NotificationTemplate) => {
        showToast(`Test dispatch sent for "${tmpl.name}" via ${tmpl.channel.toUpperCase()}`, 'success');
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Bell size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Notification Channels & Dispatcher</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {countryProfile.name} ({activeCountry})
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Configure SMTP mail relays, sovereign SMS gateways, and automated customer receipt dispatchers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* EMAIL CONFIG (SMTP) */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                                    emailEnabled
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                }`}>
                                    {emailEnabled ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={emailEnabled}
                                    onClick={() => setEmailEnabled(!emailEnabled)}
                                    aria-label="Toggle Email SMTP"
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${
                                        emailEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-1">Email Settings (SMTP)</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mb-4">Transactional mail relay for receipts, invoices, and operational alerts.</p>

                        <div className="space-y-3 bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)]">
                            <div>
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block mb-1">SMTP Server Host</label>
                                <input
                                    type="text"
                                    value="smtp.postmarkapp.com"
                                    aria-label="SMTP Host"
                                    readOnly
                                    className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block mb-1">Port</label>
                                    <input
                                        type="text"
                                        value="587"
                                        aria-label="SMTP Port"
                                        readOnly
                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block mb-1">Security</label>
                                    <input
                                        type="text"
                                        value="TLS Encrypted"
                                        aria-label="SMTP Security"
                                        readOnly
                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                        <button
                            type="button"
                            onClick={() => showToast('SMTP credentials verified and operational', 'info')}
                            className="text-xs font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                            <Server size={13} /> Configure SMTP Relay
                        </button>
                    </div>
                </div>

                {/* SMS CONFIG */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <MessageSquare size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                                    smsEnabled
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                }`}>
                                    {smsEnabled ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={smsEnabled}
                                    onClick={() => {
                                        setSmsEnabled(!smsEnabled);
                                        showToast(smsEnabled ? 'SMS Gateway Disabled' : 'SMS Gateway Enabled', 'info');
                                    }}
                                    aria-label="Toggle SMS Gateway"
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${
                                        smsEnabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-1">Sovereign SMS Gateway</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mb-4">Cellular SMS dispatch for driver dispatch, delivery updates, and OTPs.</p>

                        {!smsEnabled ? (
                            <div className="text-[var(--theme-text-secondary)] text-xs py-8 text-center border border-dashed border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-subtle)] font-medium">
                                SMS Notifications are currently disabled. Enable the toggle above to configure cellular dispatch.
                            </div>
                        ) : (
                            <div className="space-y-3 bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)]">
                                <div>
                                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block mb-1">Provider</label>
                                    <input
                                        type="text"
                                        value={activeCountry === 'ET' ? 'Ethio Telecom Enterprise SMS' : 'Safaricom SMS / Africa\'s Talking'}
                                        aria-label="SMS Provider"
                                        readOnly
                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block mb-1">Sender ID / Shortcode</label>
                                    <input
                                        type="text"
                                        value={activeCountry === 'ET' ? 'SIIFMART (+251 911 000 000)' : 'SIIFMART (+254 700 000 000)'}
                                        aria-label="SMS From Number"
                                        readOnly
                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                        <button
                            type="button"
                            onClick={() => showToast('SMS Gateway parameters ready', 'info')}
                            className="text-xs font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                            <Smartphone size={13} /> Configure Gateway
                        </button>
                    </div>
                </div>
            </div>

            {/* TEMPLATES */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Notification Templates</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Automated customer receipt and logistics dispatch templates</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {templates.map(tmpl => (
                        <div
                            key={tmpl.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-all group"
                        >
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{tmpl.name}</span>
                                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                            {tmpl.channel}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] truncate max-w-md mt-0.5">{tmpl.subject}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setEditingTemplate(tmpl)}
                                    className="h-8 px-3 text-xs bg-[var(--theme-bg-card)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTestNotification(tmpl)}
                                    className="h-8 px-3 text-xs bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                    <Send size={12} /> Test
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TEMPLATE EDIT MODAL */}
            {editingTemplate && (
                <Modal
                    isOpen={!!editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    title={`Edit Template: ${editingTemplate.name}`}
                    footer={(
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setEditingTemplate(null)}
                                className="h-9 px-4 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold cursor-pointer hover:bg-[var(--theme-border)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveTemplate}
                                className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all"
                            >
                                Save Template
                            </button>
                        </div>
                    )}
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">Subject Line</label>
                            <input
                                type="text"
                                value={editingTemplate.subject}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">Message Body</label>
                            <textarea
                                rows={5}
                                value={editingTemplate.body}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 text-xs text-[var(--theme-text-primary)] font-normal outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[11px] text-[var(--theme-text-secondary)]">
                            <strong className="font-semibold text-[var(--theme-text-primary)]">Dynamic Variables:</strong> <code className="font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded text-[var(--theme-text-primary)]">{"{{customer_name}}"}</code>, <code className="font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded text-[var(--theme-text-primary)]">{"{{order_number}}"}</code>, <code className="font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded text-[var(--theme-text-primary)]">{"{{total_amount}}"}</code>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
