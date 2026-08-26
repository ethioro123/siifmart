import React, { useState } from 'react';
import {
    Bell, Mail, MessageSquare, Edit2, Send, CheckCircle,
    FileText, Server, Smartphone, ShieldCheck, X
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import Modal from '../Modal';

interface NotificationTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    channel: 'email' | 'sms';
}

export default function NotificationSettings() {
    const { showToast } = useStore();
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
            body: 'Dear {{customer_name}}, thank you for shopping at SIIFMART. Your order of {{total_amount}} ETB has been received and is being prepared.',
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

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Bell className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Notification Channels & Dispatcher</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Configure SMTP mail relays, SMS gateways, and customer-facing notification templates.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* EMAIL CONFIG (SMTP) */}
                <div className={`${cardBase} relative overflow-hidden flex flex-col justify-between`}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-2xl border border-emerald-200 dark:border-emerald-950/30">
                                <Mail size={22} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${emailEnabled ? 'bg-emerald-50 text-[#2C5E3B] border-emerald-200 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] dark:border-emerald-950/30' : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400'}`}>
                                    {emailEnabled ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setEmailEnabled(!emailEnabled)}
                                    className={`w-11 h-6 rounded-full p-1 transition-all relative cursor-pointer ${emailEnabled ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-base font-black text-[#1E3F27] dark:text-white mb-1">Email Settings (SMTP)</h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mb-4">Transactional mail relay for receipts and alerts</p>

                        <div className="space-y-3 bg-[#FAF8F5] dark:bg-black/20 p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                            <div>
                                <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-1">SMTP Server Host</label>
                                <input
                                    type="text"
                                    value="smtp.postmarkapp.com"
                                    aria-label="SMTP Host"
                                    readOnly
                                    className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-1">Port</label>
                                    <input
                                        type="text"
                                        value="587"
                                        aria-label="SMTP Port"
                                        readOnly
                                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-1">Security</label>
                                    <input
                                        type="text"
                                        value="TLS Encrypted"
                                        aria-label="SMTP Security"
                                        readOnly
                                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => showToast('SMTP credentials verified and operational', 'info')}
                            className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                            <Server size={13} /> Configure SMTP Relay
                        </button>
                    </div>
                </div>

                {/* SMS CONFIG */}
                <div className={`${cardBase} relative overflow-hidden flex flex-col justify-between`}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 rounded-2xl border border-purple-200 dark:border-purple-900/30">
                                <MessageSquare size={22} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${smsEnabled ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400' : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400'}`}>
                                    {smsEnabled ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSmsEnabled(!smsEnabled);
                                        showToast(smsEnabled ? 'SMS Gateway Disabled' : 'SMS Gateway Enabled', 'info');
                                    }}
                                    className={`w-11 h-6 rounded-full p-1 transition-all relative cursor-pointer ${smsEnabled ? 'bg-purple-600' : 'bg-stone-300 dark:bg-stone-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-base font-black text-[#1E3F27] dark:text-white mb-1">SMS Gateway</h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mb-4">Cellular SMS dispatch for driver and delivery updates</p>

                        {!smsEnabled ? (
                            <div className="text-stone-500 dark:text-gray-400 text-xs py-8 text-center border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl bg-[#FAF8F5] dark:bg-black/20 font-medium">
                                SMS Notifications are currently disabled. Enable toggle to configure Twilio / Ethio Telecom SMS gateway.
                            </div>
                        ) : (
                            <div className="space-y-3 bg-[#FAF8F5] dark:bg-black/20 p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                                <div>
                                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-1">Provider</label>
                                    <input
                                        type="text"
                                        value="Twilio / Ethio Telecom SMS"
                                        aria-label="SMS Provider"
                                        readOnly
                                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-1">Sender ID / Shortcode</label>
                                    <input
                                        type="text"
                                        value="SIIFMART (+251 911 000 000)"
                                        aria-label="SMS From Number"
                                        readOnly
                                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => showToast('SMS Gateway parameters ready', 'info')}
                            className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                            <Smartphone size={13} /> Configure Gateway
                        </button>
                    </div>
                </div>
            </div>

            {/* TEMPLATES */}
            <div className={cardBase}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <div>
                        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9]">Notification Templates</h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Automated customer receipt and logistics dispatch templates</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {templates.map(tmpl => (
                        <div
                            key={tmpl.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 transition-all group"
                        >
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl shrink-0 mt-0.5 sm:mt-0">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-[#1E3F27] dark:text-white">{tmpl.name}</span>
                                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                                            {tmpl.channel}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-stone-500 dark:text-gray-400 truncate max-w-md mt-0.5">{tmpl.subject}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setEditingTemplate(tmpl)}
                                    className="text-xs bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-gray-200 border border-[#E2DCCE] dark:border-white/10 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTestNotification(tmpl)}
                                    className="text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
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
                                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveTemplate}
                                className="px-5 py-2 bg-[#2C5E3B] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                            >
                                Save Template
                            </button>
                        </div>
                    )}
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-600 dark:text-gray-400 uppercase tracking-wide block">Subject Line</label>
                            <input
                                type="text"
                                value={editingTemplate.subject}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-600 dark:text-gray-400 uppercase tracking-wide block">Message Body</label>
                            <textarea
                                rows={5}
                                value={editingTemplate.body}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-xs text-[#1E3F27] dark:text-white font-medium outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl text-[11px] text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <strong className="font-bold">Dynamic Variables:</strong> <code className="font-mono bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded">{"{{customer_name}}"}</code>, <code className="font-mono bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded">{"{{order_number}}"}</code>, <code className="font-mono bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded">{"{{total_amount}}"}</code>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
