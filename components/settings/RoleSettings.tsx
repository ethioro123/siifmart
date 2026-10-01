import React, { useState, useMemo } from 'react';
import {
    Shield, Clock, MapPin, Smartphone, AlertTriangle, ShieldCheck,
    AlertCircle, Lock, Unlock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import type { Country } from '../../utils/localization';
import type {
    RolePolicy,
    ManagedRoleId,
    RolePermissionItem,
    RolePermissionCategory,
    RoleDefinition
} from '../../types/roles';
import { useRoleSettingsMutation } from '../../hooks/useRoleSettingsMutation';

// --- SUB-COMPONENTS ---
interface PermissionToggleProps {
    enabled: boolean;
    onChange: () => void;
    danger?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({
    enabled,
    onChange,
    danger,
    disabled,
    ariaLabel
}) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        aria-label={ariaLabel || (enabled ? 'Disable' : 'Enable')}
        className={`w-11 h-6 rounded-full p-1 transition-all relative ${
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${
            enabled
                ? danger ? 'bg-red-600' : 'bg-[#2C5E3B]'
                : 'bg-stone-300 dark:bg-stone-700'
        }`}
    >
        <div
            className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);

interface SecurityScoreProps {
    policies: RolePolicy;
    role: ManagedRoleId;
}

const SecurityScore: React.FC<SecurityScoreProps> = ({ policies, role }) => {
    let score = 100;
    const issues: string[] = [];

    // Zero-Trust Heuristic Scoring
    if (!policies.mfa_required && role === 'admin') {
        score -= 30;
        issues.push('Admin role without mandatory MFA requirement');
    }
    if (policies.session_timeout > 30) {
        score -= 15;
        issues.push('Extended session timeout (>30 min) poses terminal hijacking risk');
    }
    if (!policies.ip_restriction && role === 'admin') {
        score -= 15;
        issues.push('Admin remote access unrestricted by Geo-IP fencing');
    }
    if (policies.password_complexity !== 'high') {
        score -= 10;
        issues.push('Password complexity below corporate enterprise standard');
    }

    const getColor = (s: number) => {
        if (s >= 90) return 'text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B] dark:border-[#A9CBA2]';
        if (s >= 70) return 'text-amber-800 dark:text-amber-400 border-amber-600';
        return 'text-red-700 dark:text-red-400 border-red-600';
    };

    return (
        <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg bg-white dark:bg-black/40 ${getColor(score)}`}>
                    {score}%
                </div>
                <div>
                    <h5 className="font-black text-sm text-[#1E3F27] dark:text-white">Security Health Score</h5>
                    <p className="text-[11px] text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Automated Zero-Trust role policy audit</p>
                </div>
            </div>
            {issues.length > 0 && (
                <div className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3.5 py-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/30">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle size={13} className="text-amber-700 dark:text-amber-400" /> Audit Advisories:
                    </div>
                    <ul className="list-disc list-inside text-[11px] opacity-90 space-y-0.5">
                        {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- ZERO-TRUST CORPORATE BASELINES ---
const DEFAULT_PERMISSIONS: RolePermissionCategory = {
    'POS & Sales': [
        { id: 'pos_access', label: 'Access POS Terminal', admin: true, store_manager: true, cashier: true, warehouse: false },
        { id: 'void_bill', label: 'Void Transaction', description: 'Requires HQ Dual-Control OTP or Admin Override', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
        { id: 'give_discount', label: 'Apply Custom Discount', description: 'Zero-Trust: Ad-hoc discounts blocked. Use HQ promo codes', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
    ],
    'Inventory': [
        { id: 'view_stock', label: 'View Stock Levels', admin: true, store_manager: true, cashier: true, warehouse: true },
        { id: 'adjust_stock', label: 'Manual Stock Adjustment', description: 'Zero Autonomous Authority: Must use inventory_requests', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
        { id: 'cost_price', label: 'View Cost Prices', description: 'Central HQ oversight only: Hidden from branch staff', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
    ],
    'Finance': [
        { id: 'view_reports', label: 'View Financial Reports', admin: true, store_manager: false, cashier: false, warehouse: false },
        { id: 'approve_expense', label: 'Approve Expenses', hqApprovalRequired: true, admin: true, store_manager: false, cashier: false, warehouse: false },
    ],
    'System Notifications': [
        { id: 'alert_low_stock', label: 'Low Stock Alerts', admin: true, store_manager: true, cashier: false, warehouse: true },
        { id: 'alert_void', label: 'Void / Refund Alerts', admin: true, store_manager: true, cashier: false, warehouse: false },
        { id: 'alert_security', label: 'Security & Login Alerts', admin: true, store_manager: false, cashier: false, warehouse: false },
        { id: 'alert_shift', label: 'Shift End Reports', admin: true, store_manager: true, cashier: false, warehouse: false },
    ]
};

const DEFAULT_POLICIES: Record<ManagedRoleId, RolePolicy> = {
    admin: { mfa_required: true, session_timeout: 15, ip_restriction: false, time_restriction: false, password_complexity: 'high' },
    store_manager: { mfa_required: true, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
    cashier: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
    warehouse: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' }
};

export default function RoleSettings() {
    const { user, showToast } = useStore();
    const { employees, settings, effectiveCountry } = useData();
    const roleMutation = useRoleSettingsMutation();

    const activeCountry: Country = (effectiveCountry || settings.country || 'ET') as Country;

    // Partitioned read from countryConfigs (100% background isolation, zero localStorage)
    const countryPartition = settings.countryConfigs?.[activeCountry] || {};
    const persistedPolicies: Record<ManagedRoleId, RolePolicy> = countryPartition.rolePolicies || settings.rolePolicies || DEFAULT_POLICIES;
    const persistedPermissions: RolePermissionCategory = countryPartition.rolePermissions || settings.rolePermissions || DEFAULT_PERMISSIONS;

    const [activeRole, setActiveRole] = useState<ManagedRoleId>('admin');
    const [subTab, setSubTab] = useState<'policies' | 'permissions'>('policies');

    const roleDefinitions: RoleDefinition[] = useMemo(() => {
        const counts: Record<ManagedRoleId, number> = { admin: 0, store_manager: 0, cashier: 0, warehouse: 0 };
        if (employees) {
            employees.forEach(emp => {
                const r = emp.role as ManagedRoleId;
                if (counts[r] !== undefined) counts[r]++;
            });
        }

        return [
            { id: 'admin', name: 'Assistant CEO / Admin', users: counts.admin, badge: 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30', description: 'HQ executive administration with complete audit visibility' },
            { id: 'store_manager', name: 'Store Manager', users: counts.store_manager, badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/30', description: 'Branch retail oversight constrained by Zero-Trust approval rules' },
            { id: 'cashier', name: 'Retail Staff (Cashier)', users: counts.cashier, badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30', description: 'POS checkout operators locked to local terminal registers' },
            { id: 'warehouse', name: 'Warehouse Ops', users: counts.warehouse, badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/30', description: 'Fulfillment and putaway personnel governed by blind scanning' },
        ];
    }, [employees]);

    const currentPolicy: RolePolicy = persistedPolicies[activeRole] || DEFAULT_POLICIES[activeRole];

    const handleTogglePermission = (category: string, permId: string) => {
        const categoryItems = persistedPermissions[category] || [];
        const targetPerm = categoryItems.find(p => p.id === permId);

        // Zero-Trust policy gate: Prevent granting autonomous stock adjustments or custom discounts to branch staff
        if (targetPerm?.hqApprovalRequired && activeRole !== 'admin') {
            showToast('Zero-Trust Policy: Autonomous override prohibited. High-risk operations require HQ approval workflow.', 'warning');
            return;
        }

        const newPerms: RolePermissionCategory = {
            ...persistedPermissions,
            [category]: categoryItems.map(p => {
                if (p.id !== permId) return p;
                return { ...p, [activeRole]: !p[activeRole] };
            })
        };

        roleMutation.mutate({
            section: 'permissions',
            roleId: activeRole,
            permissions: newPerms,
            targetCountry: activeCountry
        });
    };

    const updatePolicy = <K extends keyof RolePolicy>(key: K, value: RolePolicy[K]) => {
        if (activeRole === 'admin' && (key === 'time_restriction' || key === 'ip_restriction') && value === true) {
            showToast('Caution: Admin location/time restrictions activated. Emergency bypass must be verified.', 'info');
        }

        const newPolicies: Record<ManagedRoleId, RolePolicy> = {
            ...persistedPolicies,
            [activeRole]: {
                ...currentPolicy,
                [key]: value
            }
        };

        roleMutation.mutate({
            section: 'policies',
            roleId: activeRole,
            policies: newPolicies,
            targetCountry: activeCountry
        });
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#2C5E3B] text-white rounded-xl shadow-sm">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Enterprise Security Engine</h4>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Zero-Trust Access Control & Role Policy Enforcement</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-black/30 px-3 py-1.5 rounded-xl border border-[#E2DCCE] dark:border-white/10">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">Active & Enforced</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ROLE SIDEBAR */}
                <div className="space-y-3">
                    {roleDefinitions.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setActiveRole(role.id)}
                            className={`w-full text-left p-4 rounded-3xl border transition-all cursor-pointer ${
                                activeRole === role.id
                                    ? 'bg-white dark:bg-[#18201B] border-[#2C5E3B] dark:border-[#A9CBA2] shadow-md ring-1 ring-[#2C5E3B]/30'
                                    : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/10 hover:bg-white dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${role.badge}`}>
                                    {role.id}
                                </span>
                                {activeRole === role.id && <Shield size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                            </div>
                            <div className="font-black text-sm text-[#1E3F27] dark:text-white mb-0.5">{role.name}</div>
                            <div className="text-xs text-stone-500 dark:text-gray-400 font-medium">{role.users} Active Staff Assigned</div>
                        </button>
                    ))}
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">
                    {/* TABS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E2DCCE]/60 dark:border-white/5">
                        <div>
                            <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                                {roleDefinitions.find(r => r.id === activeRole)?.name}
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-0.5 bg-[#FAF8F5] dark:bg-white/5 rounded-lg border border-[#E2DCCE] dark:border-white/10">Scope</span>
                            </h3>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                                {roleDefinitions.find(r => r.id === activeRole)?.description}
                            </p>
                        </div>
                        <div className="flex bg-[#FAF8F5] dark:bg-black/40 p-1 rounded-2xl border border-[#E2DCCE] dark:border-white/10 self-start sm:self-auto">
                            {[
                                { id: 'policies', label: 'Security Policies', icon: Shield },
                                { id: 'permissions', label: 'Access Rights', icon: Unlock }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSubTab(tab.id as 'policies' | 'permissions')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                        subTab === tab.id
                                            ? 'bg-[#2C5E3B] text-white shadow-sm'
                                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white'
                                    }`}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PERMISSIONS VIEW */}
                    {subTab === 'permissions' && (
                        <div className="space-y-6 animate-in fade-in">
                            {Object.entries(persistedPermissions).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    <h5 className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full" /> {category}
                                    </h5>
                                    <div className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-2xl divide-y divide-[#E2DCCE]/40 dark:divide-white/5 overflow-hidden">
                                        {items.map((perm: RolePermissionItem) => {
                                            const isGranted = perm[activeRole];
                                            const isRestrictedByPolicy = perm.hqApprovalRequired && activeRole !== 'admin';

                                            return (
                                                <div key={perm.id} className="p-3.5 flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                                                    <div className="pr-4">
                                                        <div className="text-xs font-black text-[#1E3F27] dark:text-white flex items-center gap-2">
                                                            {perm.label}
                                                            {perm.hqApprovalRequired && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                                                    HQ Control
                                                                </span>
                                                            )}
                                                        </div>
                                                        {perm.description && (
                                                            <div className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">
                                                                {perm.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`text-[10px] uppercase font-black ${
                                                            isGranted
                                                                ? 'text-[#2C5E3B] dark:text-[#A9CBA2]'
                                                                : 'text-stone-400 dark:text-gray-500'
                                                        }`}>
                                                            {isGranted ? 'Granted' : 'Revoked'}
                                                        </span>
                                                        <PermissionToggle
                                                            enabled={isGranted}
                                                            disabled={isRestrictedByPolicy}
                                                            onChange={() => handleTogglePermission(category, perm.id)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* POLICIES VIEW */}
                    {subTab === 'policies' && (
                        <div className="space-y-6 animate-in fade-in">
                            <SecurityScore policies={currentPolicy} role={activeRole} />

                            {activeRole === 'admin' && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="text-amber-800 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                                        <strong className="font-bold">Admin Safety Guardrail:</strong> Modifying Geo-IP or Shift Hour restrictions on the <strong>Admin</strong> role can prevent emergency system recovery outside working hours. Keep emergency bypass credentials secure.
                                    </div>
                                </div>
                            )}

                            {/* Session Security */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-xs text-[#1E3F27] dark:text-white uppercase">Session Timeout</h5>
                                            <p className="text-[10px] text-stone-500 dark:text-gray-400">Auto-logout inactive terminals</p>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        aria-label="Session Timeout"
                                        value={currentPolicy.session_timeout}
                                        onChange={(e) => updatePolicy('session_timeout', parseInt(e.target.value, 10))}
                                        className="w-full accent-[#2C5E3B] h-1.5 bg-[#E2DCCE] dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
                                        <span>5m</span>
                                        <span className="bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2 py-0.5 rounded-lg">
                                            {currentPolicy.session_timeout} mins
                                        </span>
                                        <span>120m</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl">
                                                <Smartphone size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-xs text-[#1E3F27] dark:text-white uppercase">MFA Enforcement</h5>
                                                <p className="text-[10px] text-stone-500 dark:text-gray-400">Require 2FA for login</p>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.mfa_required}
                                            onChange={() => updatePolicy('mfa_required', !currentPolicy.mfa_required)}
                                        />
                                    </div>
                                    <div className="text-[10px] text-stone-500 dark:text-gray-400 bg-white dark:bg-white/5 p-2.5 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 font-medium mt-2">
                                        {currentPolicy.mfa_required
                                            ? 'Users must verify via Authenticator App OTP.'
                                            : 'Standard email/password credential login allowed.'}
                                    </div>
                                </div>
                            </div>

                            {/* Context Access */}
                            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-3xl space-y-3">
                                <h5 className="font-black text-xs text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Shield size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Context-Aware Access Rules
                                </h5>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 border border-[#E2DCCE]/60 dark:border-white/5 rounded-2xl bg-white dark:bg-black/30">
                                        <div className="flex items-center gap-3 pr-2">
                                            <MapPin size={16} className="text-amber-600" />
                                            <div>
                                                <div className="text-xs font-black text-[#1E3F27] dark:text-white">Location Fencing (Geo-IP)</div>
                                                <div className="text-[10px] text-stone-500 dark:text-gray-400">Restrict login to corporate IP / VPN ranges only</div>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.ip_restriction}
                                            onChange={() => updatePolicy('ip_restriction', !currentPolicy.ip_restriction)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3.5 border border-[#E2DCCE]/60 dark:border-white/5 rounded-2xl bg-white dark:bg-black/30">
                                        <div className="flex items-center gap-3 pr-2">
                                            <Clock size={16} className="text-purple-600" />
                                            <div>
                                                <div className="text-xs font-black text-[#1E3F27] dark:text-white">Shift Hours Only</div>
                                                <div className="text-[10px] text-stone-500 dark:text-gray-400">Block staff access outside operational shift hours (08:00 - 22:00)</div>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.time_restriction}
                                            onChange={() => updatePolicy('time_restriction', !currentPolicy.time_restriction)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
