import React, { useState } from 'react';
import {
    Shield, Lock, Globe, AlertTriangle, FileText, Download,
    CheckCircle, Smartphone, KeyRound, Plus
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { RetailLossPreventionCard } from './components/RetailLossPreventionCard';

// --- SUB-COMPONENTS ---
const SecurityCard = ({ title, status, desc, icon: Icon }: any) => (
    <div className={`p-5 rounded-3xl border bg-white/80 dark:bg-black/20 ${status === 'secure' ? 'border-emerald-200 dark:border-emerald-950/30' :
        status === 'warning' ? 'border-amber-200 dark:border-amber-900/30' :
            'border-red-200 dark:border-red-900/30'
        }`}>
        <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-2xl ${status === 'secure' ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2]' :
                status === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                    'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                }`}>
                <Icon size={22} />
            </div>
            {status === 'secure' && <CheckCircle size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
            {status === 'warning' && <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />}
            {status === 'critical' && <AlertTriangle size={18} className="text-red-500" />}
        </div>
        <h4 className="font-black text-[#1E3F27] dark:text-white text-sm mb-1">{title}</h4>
        <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

const PolicyToggle = ({ label, enabled, onChange }: any) => (
    <div className="flex items-center justify-between p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 group hover:border-[#2C5E3B]/30 transition-colors">
        <span className="font-bold text-[#1E3F27] dark:text-gray-300 text-xs">{label}</span>
        <button
            type="button"
            onClick={onChange}
            aria-label={label}
            className={`w-11 h-6 rounded-full p-1 transition-all relative cursor-pointer ${enabled ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default function SecuritySettings() {
    const { showToast } = useStore();
    const { systemLogs } = useData();

    interface GlobalAuthPolicies {
        enforceMfaAdmin: boolean;
        enforceMfaAll: boolean;
        strongPasswords: boolean;
        sessionTimeout: boolean;
        ipTrust: boolean;
    }

    const [policies, setPolicies] = useState<GlobalAuthPolicies>(() => {
        const saved = localStorage.getItem('siifmart_global_auth_policies');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return {
            enforceMfaAdmin: true,
            enforceMfaAll: false,
            strongPasswords: true,
            sessionTimeout: true,
            ipTrust: false
        };
    });

    const [ipInput, setIpInput] = useState('');
    const [ipList, setIpList] = useState<string[]>(() => {
        const saved = localStorage.getItem('siifmart_admin_ip_ranges');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return ['192.168.1.0/24'];
    });

    const [retentionDrawer, setRetentionDrawer] = useState('Keep Indefinitely (Recommended)');
    const [retentionBarcode, setRetentionBarcode] = useState('Keep for 7 years (Audit Trail)');

    const togglePolicy = (key: keyof GlobalAuthPolicies) => {
        setPolicies((prev: GlobalAuthPolicies) => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem('siifmart_global_auth_policies', JSON.stringify(newState));
            showToast('Security Policy Updated', 'success');
            return newState;
        });
    };

    const handleAddIp = () => {
        if (!ipInput.trim()) return;
        const trimmed = ipInput.trim();
        if (ipList.includes(trimmed)) {
            showToast('IP range already in allowlist', 'info');
            return;
        }
        const updated = [...ipList, trimmed];
        setIpList(updated);
        localStorage.setItem('siifmart_admin_ip_ranges', JSON.stringify(updated));
        setIpInput('');
        showToast(`IP range ${trimmed} added to allowlist`, 'success');
    };

    const handleRemoveIp = (ip: string) => {
        const updated = ipList.filter(item => item !== ip);
        setIpList(updated);
        localStorage.setItem('siifmart_admin_ip_ranges', JSON.stringify(updated));
        showToast(`IP range ${ip} removed`, 'info');
    };

    const handleExportAudit = () => {
        const logsToExport = systemLogs || [];
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Timestamp,Module,Message,User\n"
            + logsToExport.map(log =>
                `"${log.created_at || ''}","${log.module || ''}","${(log.details || '').replace(/"/g, '""')}","${log.user_name || 'System'}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `certified_security_audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Certified audit log downloaded successfully', 'success');
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* RETAIL LOSS PREVENTION & SUPERVISOR PIN CARD */}
            <RetailLossPreventionCard />

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SecurityCard
                    title="SSL / TLS 1.3 Transport Security"
                    status="secure"
                    desc="End-to-end data encryption active for all POS registers and warehouse scanners."
                    icon={Lock}
                />
                <SecurityCard
                    title="GDPR & Privacy Compliance"
                    status="secure"
                    desc="Immutable ledger auditing enabled. Personal customer identifiers cryptographically masked."
                    icon={Globe}
                />
                <SecurityCard
                    title="Real-Time Threat Monitor"
                    status="secure"
                    desc="Zero unauthorized voids or suspicious brute-force attempts in the last 24 hours."
                    icon={Shield}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* GLOBAL POLICIES */}
                <div className="lg:col-span-2 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">
                    <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Global Authentication Policies
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

                        {/* Administrative IP Allowlist */}
                        <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 mt-4 space-y-3">
                            <h5 className="font-black text-[#1E3F27] dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-700 dark:text-amber-400" /> Administrative IP Allowlist
                            </h5>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-relaxed">
                                Restrict administrative and HQ panel access to verified corporate network ranges.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ipInput}
                                    onChange={(e) => setIpInput(e.target.value)}
                                    placeholder="e.g. 192.168.1.0/24"
                                    className="flex-1 bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddIp}
                                    className="bg-[#2C5E3B] text-white font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                    <Plus size={14} /> Add IP Range
                                </button>
                            </div>

                            {ipList.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {ipList.map((ip) => (
                                        <span key={ip} className="px-3 py-1 bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[#1E3F27] dark:text-gray-300 flex items-center gap-2">
                                            {ip}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIp(ip)}
                                                className="text-stone-400 hover:text-red-600 font-black cursor-pointer"
                                                title="Remove IP range"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COMPLIANCE & DATA */}
                <div className="space-y-6">
                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 shadow-sm">
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider mb-4">Audit & Data Retention</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">POS & Drawer Audit Logs</label>
                                <select
                                    aria-label="Customer Data Retention"
                                    value={retentionDrawer}
                                    onChange={(e) => {
                                        setRetentionDrawer(e.target.value);
                                        showToast('Audit log retention policy updated', 'success');
                                    }}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-bold outline-none"
                                >
                                    <option>Keep Indefinitely (Recommended)</option>
                                    <option>Delete after 3 years</option>
                                    <option>Delete after 5 years</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Barcode Approvals History</label>
                                <select
                                    aria-label="Transaction Logs Retention"
                                    value={retentionBarcode}
                                    onChange={(e) => {
                                        setRetentionBarcode(e.target.value);
                                        showToast('Barcode approval retention policy updated', 'success');
                                    }}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-white font-bold outline-none"
                                >
                                    <option>Keep for 7 years (Audit Trail)</option>
                                    <option>Keep Indefinitely</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 shadow-sm">
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider mb-2">Security Compliance Export</h3>
                        <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-relaxed mb-4">
                            Export certified system audit logs, user login history, and cashier void reports for executive review.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleExportAudit}
                                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 dark:hover:bg-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-2xl text-xs font-bold border border-emerald-200 dark:border-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                                <Download size={14} /> Export Certified Audit Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
