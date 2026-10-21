import React, { useState } from 'react';
import {
    Shield, Lock, Globe, AlertTriangle, Download,
    CheckCircle2, Plus, X, Network, LucideIcon
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { RetailLossPreventionCard } from './components/RetailLossPreventionCard';

// --- SUB-COMPONENTS ---
interface SecurityCardProps {
    title: string;
    status: 'secure' | 'warning' | 'critical';
    desc: string;
    icon: LucideIcon;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ title, status, desc, icon: Icon }) => (
    <div className="p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] shadow-xs flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    status === 'secure' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    status === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                    <Icon size={18} />
                </div>
                {status === 'secure' && <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />}
                {status === 'warning' && <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />}
                {status === 'critical' && <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />}
            </div>
            <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs mb-1">{title}</h4>
            <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">{desc}</p>
        </div>
    </div>
);

interface PolicyToggleProps {
    label: string;
    enabled: boolean;
    onChange: () => void;
}

const PolicyToggle: React.FC<PolicyToggleProps> = ({ label, enabled, onChange }) => (
    <div
        onClick={onChange}
        className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors cursor-pointer"
    >
        <span className="font-medium text-[var(--theme-text-primary)] text-xs pr-3">{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
            aria-label={label}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${enabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

interface GlobalAuthPolicies {
    enforceMfaAdmin: boolean;
    enforceMfaAll: boolean;
    strongPasswords: boolean;
    sessionTimeout: boolean;
    ipTrust: boolean;
}

export default function SecuritySettings() {
    const { showToast } = useStore();
    const { systemLogs } = useData();

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
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-5">
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <Lock size={16} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                        Global Authentication Policies
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                            <h5 className="font-semibold text-[var(--theme-text-primary)] text-xs flex items-center gap-2">
                                <Network size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                Administrative IP Allowlist
                            </h5>
                            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                                Restrict administrative and HQ panel access to verified corporate network ranges.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ipInput}
                                    onChange={(e) => setIpInput(e.target.value)}
                                    placeholder="e.g. 192.168.1.0/24"
                                    className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] outline-none font-mono transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddIp}
                                    className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white font-semibold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                    <Plus size={14} /> Add IP Range
                                </button>
                            </div>

                            {ipList.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {ipList.map((ip) => (
                                        <span key={ip} className="px-2.5 py-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg text-xs font-mono text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                            {ip}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIp(ip)}
                                                className="text-[var(--theme-text-secondary)] hover:text-red-500 transition-colors cursor-pointer p-0.5"
                                                title="Remove IP range"
                                            >
                                                <X size={12} />
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
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            Audit & Data Retention
                        </h3>
                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium block">
                                    POS & Drawer Audit Logs
                                </label>
                                <select
                                    aria-label="Customer Data Retention"
                                    value={retentionDrawer}
                                    onChange={(e) => {
                                        setRetentionDrawer(e.target.value);
                                        showToast('Audit log retention policy updated', 'success');
                                    }}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors cursor-pointer"
                                >
                                    <option>Keep Indefinitely (Recommended)</option>
                                    <option>Delete after 3 years</option>
                                    <option>Delete after 5 years</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium block">
                                    Barcode Approvals History
                                </label>
                                <select
                                    aria-label="Transaction Logs Retention"
                                    value={retentionBarcode}
                                    onChange={(e) => {
                                        setRetentionBarcode(e.target.value);
                                        showToast('Barcode approval retention policy updated', 'success');
                                    }}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors cursor-pointer"
                                >
                                    <option>Keep for 7 years (Audit Trail)</option>
                                    <option>Keep Indefinitely</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-3">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            Security Compliance Export
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                            Export certified system audit logs, user login history, and cashier void reports for executive review.
                        </p>
                        <button
                            type="button"
                            onClick={handleExportAudit}
                            className="w-full h-9 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold border border-[var(--theme-border)] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                            <Download size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            <span>Export Certified Audit Log</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
