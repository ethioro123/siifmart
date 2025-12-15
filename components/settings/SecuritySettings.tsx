import React, { useState } from 'react';
import {
    Shield, Lock, Globe, AlertTriangle, FileText, Download, Upload,
    RefreshCw, CheckCircle, Smartphone, Eye, EyeOff
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SecurityCard = ({ title, status, desc, icon: Icon, color }: any) => (
    <div className={`p-5 rounded-xl border border-white/5 bg-gradient-to-br ${status === 'secure' ? 'from-green-900/10 to-transparent' :
        status === 'warning' ? 'from-yellow-900/10 to-transparent' :
            'from-red-900/10 to-transparent'
        }`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${status === 'secure' ? 'bg-green-500/10 text-green-400' :
                status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                }`}>
                <Icon size={24} />
            </div>
            {status === 'secure' && <CheckCircle size={18} className="text-green-500" />}
            {status === 'warning' && <AlertTriangle size={18} className="text-yellow-500" />}
            {status === 'critical' && <AlertTriangle size={18} className="text-red-500" />}
        </div>
        <h4 className="font-bold text-white text-lg mb-1">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

const PolicyToggle = ({ label, enabled, onChange }: any) => (
    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
        <span className="font-bold text-gray-300 text-sm">{label}</span>
        <button
            onClick={onChange}
            aria-label={label}
            className={`w-11 h-6 rounded-full p-1 transition-all relative ${enabled ? 'bg-cyber-primary' : 'bg-gray-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-black shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default function SecuritySettings() {
    const { showToast } = useStore();
    const [policies, setPolicies] = useState({
        enforceMfaAdmin: true,
        enforceMfaAll: false,
        strongPasswords: true,
        sessionTimeout: true,
        ipTrust: false
    });

    const togglePolicy = (key: keyof typeof policies) => {
        setPolicies(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            showToast('Security Policy Updated', 'info');
            return newState;
        });
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <Shield className="text-red-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-red-400 font-bold text-sm">System Security & Compliance</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure global security policies, SSL encryption, and data retention rules.
                    </p>
                </div>
            </div>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SecurityCard
                    title="SSL Encryption"
                    status="secure"
                    desc="Data in transit is encrypted via TLS 1.3. Certificate valid until Dec 2025."
                    icon={Lock}
                />
                <SecurityCard
                    title="GDPR Compliance"
                    status="warning"
                    desc="Data Retention Policy needs review. Cookie consent banner active."
                    icon={Globe}
                />
                <SecurityCard
                    title="Threat Monitor"
                    status="secure"
                    desc="No suspicious login attempts detected in the last 24 hours."
                    icon={Shield}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* GLOBAL POLICIES */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-cyber-primary" /> Authentication Policies
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PolicyToggle
                                label="Enforce MFA for Admins"
                                enabled={policies.enforceMfaAdmin}
                                onChange={() => togglePolicy('enforceMfaAdmin')}
                            />
                            <PolicyToggle
                                label="Enforce MFA for All Users"
                                enabled={policies.enforceMfaAll}
                                onChange={() => togglePolicy('enforceMfaAll')}
                            />
                            <PolicyToggle
                                label="Require Strong Passwords"
                                enabled={policies.strongPasswords}
                                onChange={() => togglePolicy('strongPasswords')}
                            />
                            <PolicyToggle
                                label="Idle Session Timeout (15m)"
                                enabled={policies.sessionTimeout}
                                onChange={() => togglePolicy('sessionTimeout')}
                            />
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 mt-4">
                            <h5 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-400" /> Administrative Access
                            </h5>
                            <p className="text-xs text-gray-400 mb-4">
                                Restrict administrative panel access to specific IP addresses (e.g. Corporate VPN).
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter IP Range (CIDR)"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                                />
                                <button className="bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-white/20 transition-colors">
                                    Add Allowlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COMPLIANCE & DATA */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Data Retention</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold block mb-2">Customer Data</label>
                                <select aria-label="Customer Data Retention" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                                    <option>Keep Indefinitely</option>
                                    <option>Delete after 3 years</option>
                                    <option>Delete after 5 years</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold block mb-2">Transaction Logs</label>
                                <select aria-label="Transaction Logs Retention" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                                    <option>Keep for 7 years (Audit)</option>
                                    <option>Keep for 10 years</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">GDPR Request</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Process "Right to be Forgotten" or "Data Export" requests for customers.
                        </p>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2">
                                <Download size={14} /> Export
                            </button>
                            <button className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={14} /> Erasure
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
const Trash2 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);
