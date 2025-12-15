import React, { useState } from 'react';
import {
    Bell, Mail, MessageSquare, Plus, Edit2, CheckCircle, Send
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

export default function NotificationSettings() {
    const { showToast } = useStore();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                <Bell className="text-orange-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-orange-400 font-bold text-sm">Notification Channels</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure SMTP for emails and SMS gateways for mobile alerts.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* EMAIL CONFIG */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                            <Mail size={24} />
                        </div>
                        <div className="form-control">
                            <label className="label cursor-pointer gap-2">
                                <span className="label-text text-white font-bold text-xs">{emailEnabled ? 'Active' : 'Disabled'}</span>
                                <input type="checkbox" aria-label="Toggle Email" className="toggle toggle-primary toggle-sm" checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
                            </label>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">Email Settings (SMTP)</h3>
                    <div className="space-y-4 opacity-80">
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase font-bold">Host</label>
                            <input type="text" value="smtp.postmarkapp.com" aria-label="SMTP Host" disabled className="w-full bg-black/40 border-none rounded px-3 py-2 text-sm text-gray-400" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Port</label>
                                <input type="text" value="587" aria-label="SMTP Port" disabled className="w-full bg-black/40 border-none rounded px-3 py-2 text-sm text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Secure</label>
                                <input type="text" value="TLS" aria-label="SMTP Security" disabled className="w-full bg-black/40 border-none rounded px-3 py-2 text-sm text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="text-xs text-blue-400 hover:text-white flex items-center gap-1">
                            <Edit2 size={12} /> Configure SMTP
                        </button>
                    </div>
                </div>

                {/* SMS CONFIG */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
                            <MessageSquare size={24} />
                        </div>
                        <div className="form-control">
                            <label className="label cursor-pointer gap-2">
                                <span className="label-text text-white font-bold text-xs">{smsEnabled ? 'Active' : 'Disabled'}</span>
                                <input type="checkbox" aria-label="Toggle SMS" className="toggle toggle-primary toggle-sm" checked={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} />
                            </label>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">SMS Gateway</h3>

                    {!smsEnabled ? (
                        <div className="text-gray-500 text-sm py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                            SMS Notifications are currently disabled.
                        </div>
                    ) : (
                        <div className="space-y-4 opacity-80">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Provider</label>
                                <input type="text" value="Twilio" aria-label="SMS Provider" disabled className="w-full bg-black/40 border-none rounded px-3 py-2 text-sm text-gray-400" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold">From Number</label>
                                <input type="text" value="+1 (555) 012-3456" aria-label="SMS From Number" disabled className="w-full bg-black/40 border-none rounded px-3 py-2 text-sm text-gray-400" />
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button className="text-xs text-green-400 hover:text-white flex items-center gap-1">
                            <Edit2 size={12} /> Configure Gateway
                        </button>
                    </div>
                </div>
            </div>

            {/* TEMPLATES */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Notification Templates</h3>
                <div className="space-y-2">
                    {['Order Confirmation', 'Shipment Shipped', 'Low Stock Alert', 'Welcome Email'].map(tmpl => (
                        <div key={tmpl} className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-gray-500 group-hover:text-cyber-primary" />
                                <span className="text-gray-300 font-bold text-sm">{tmpl}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-[10px] bg-white/10 text-white px-3 py-1 rounded hover:bg-cyber-primary hover:text-black font-bold">Edit</button>
                                <button className="text-[10px] bg-white/10 text-white px-3 py-1 rounded hover:bg-blue-500 hover:text-white font-bold gap-1 flex items-center"><Send size={10} />Test</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Icon helper
const FileText = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
);
