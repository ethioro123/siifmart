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
import { mapUserRoleToManagedRole } from '../../services/zeroTrustPolicies.service';

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
        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
            disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${
            enabled
                ? danger ? 'bg-[var(--theme-status-danger-bg)]' : 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]'
                : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
    >
        <div
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
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
        if (s >= 90) return 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border-[var(--theme-accent)]/30';
        if (s >= 70) return 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]';
        return 'text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]';
    };

    return (
        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-base bg-[var(--theme-bg-card)] ${getColor(score)}`}>
                    {score}%
                </div>
                <div>
                    <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Security Health Score</h5>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Automated Zero-Trust role policy audit</p>
                </div>
            </div>
            {issues.length > 0 && (
                <div className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--theme-status-warning-border)]">
                    <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <AlertTriangle size={13} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" /> Audit Advisories:
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
    store_manager: { mfa_required: false, session_timeout: 30, ip_restriction: true, time_restriction: true, password_complexity: 'medium' },
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
                const r = mapUserRoleToManagedRole(emp.role);
                if (r && counts[r] !== undefined) counts[r]++;
            });
        }

        return [
            { id: 'admin', name: 'Assistant CEO / Admin', users: counts.admin, badge: 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)] border-[var(--theme-accent)]/20', description: 'HQ executive administration with complete audit visibility' },
            { id: 'store_manager', name: 'Store Manager', users: counts.store_manager, badge: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]', description: 'Branch retail oversight constrained by Zero-Trust approval rules' },
            { id: 'cashier', name: 'Retail Staff (Cashier)', users: counts.cashier, badge: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]', description: 'POS checkout operators locked to local terminal registers' },
            { id: 'warehouse', name: 'Warehouse Ops', users: counts.warehouse, badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', description: 'Fulfillment and putaway personnel governed by blind scanning' },
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
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Enterprise Security Engine</h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Zero-Trust Access Control & Role Policy Enforcement</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-full border border-[var(--theme-border)]">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-status-success-bg)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--theme-status-success-bg)]"></span>
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] uppercase tracking-wider">Active & Enforced</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ROLE SIDEBAR */}
                <div className="space-y-2.5">
                    {roleDefinitions.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setActiveRole(role.id)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                activeRole === role.id
                                    ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] dark:border-[var(--theme-accent)] shadow-xs ring-1 ring-[var(--theme-accent)]/30'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full border ${role.badge}`}>
                                    {role.id}
                                </span>
                                {activeRole === role.id && <Shield size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />}
                            </div>
                            <div className="font-semibold text-xs text-[var(--theme-text-primary)] mb-0.5">{role.name}</div>
                            <div className="text-[11px] text-[var(--theme-text-secondary)]">{role.users} Active Staff Assigned</div>
                        </button>
                    ))}
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 lg:p-6 shadow-xs">
                    {/* TABS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--theme-border)]">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2">
                                {roleDefinitions.find(r => r.id === activeRole)?.name}
                                <span className="text-[9px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider px-2 py-0.5 bg-[var(--theme-bg-subtle)] rounded-full border border-[var(--theme-border)]">Scope</span>
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                {roleDefinitions.find(r => r.id === activeRole)?.description}
                            </p>
                        </div>
                        <div className="flex bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] self-start sm:self-auto">
                            {[
                                { id: 'policies', label: 'Security Policies', icon: Shield },
                                { id: 'permissions', label: 'Access Rights', icon: Unlock }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSubTab(tab.id as 'policies' | 'permissions')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                        subTab === tab.id
                                            ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                    }`}
                                >
                                    <tab.icon size={13} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PERMISSIONS VIEW */}
                    {subTab === 'permissions' && (
                        <div className="space-y-5 animate-in fade-in">
                            {Object.entries(persistedPermissions).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    <h5 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] rounded-full" /> {category}
                                    </h5>
                                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl divide-y divide-[var(--theme-border)] overflow-hidden">
                                        {items.map((perm: RolePermissionItem) => {
                                            const isGranted = perm[activeRole];
                                            const isRestrictedByPolicy = perm.hqApprovalRequired && activeRole !== 'admin';

                                            return (
                                                <div key={perm.id} className="p-3 flex items-center justify-between hover:bg-[var(--theme-bg-card)] transition-colors">
                                                    <div className="pr-4">
                                                        <div className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                                                            {perm.label}
                                                            {perm.hqApprovalRequired && (
                                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                                                    HQ Control
                                                                </span>
                                                            )}
                                                        </div>
                                                        {perm.description && (
                                                            <div className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                                                {perm.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`text-[10px] uppercase font-semibold ${
                                                            isGranted
                                                                ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)]'
                                                                : 'text-[var(--theme-text-secondary)]'
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
                        <div className="space-y-5 animate-in fade-in">
                            <SecurityScore policies={currentPolicy} role={activeRole} />

                            {activeRole === 'admin' && (
                                <div className="p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-start gap-2.5">
                                    <AlertCircle className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" size={16} />
                                    <div className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] leading-relaxed font-medium">
                                        <strong className="font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">Admin Safety Guardrail:</strong> Modifying Geo-IP or Shift Hour restrictions on the <strong>Admin</strong> role can prevent emergency system recovery outside working hours. Keep emergency bypass credentials secure.
                                    </div>
                                </div>
                            )}

                            {/* Session Security */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)] rounded-lg flex items-center justify-center border border-[var(--theme-accent)]/20">
                                            <Clock size={15} />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-xs text-[var(--theme-text-primary)] uppercase">Session Timeout</h5>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)]">Auto-logout inactive terminals</p>
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
                                        className="w-full accent-[var(--theme-accent)] dark:accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-border)] rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] font-mono font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                        <span>5m</span>
                                        <span className="bg-[var(--theme-bg-card)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                            {currentPolicy.session_timeout} mins
                                        </span>
                                        <span>120m</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)] rounded-lg flex items-center justify-center border border-[var(--theme-accent)]/20">
                                                <Smartphone size={15} />
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-xs text-[var(--theme-text-primary)] uppercase">MFA Enforcement</h5>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)]">Require 2FA for login</p>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.mfa_required}
                                            onChange={() => updatePolicy('mfa_required', !currentPolicy.mfa_required)}
                                        />
                                    </div>
                                    <div className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] p-2.5 rounded-lg border border-[var(--theme-border)] font-medium mt-2">
                                        {currentPolicy.mfa_required
                                            ? 'Users must verify via Authenticator App OTP.'
                                            : 'Standard email/password credential login allowed.'}
                                    </div>
                                </div>
                            </div>

                            {/* Context Access */}
                            <div className="p-4.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-3">
                                <h5 className="font-semibold text-xs text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                                    <Shield size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" /> Context-Aware Access Rules
                                </h5>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between p-3 border border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-card)]">
                                        <div className="flex items-center gap-2.5 pr-2">
                                            <MapPin size={15} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" />
                                            <div>
                                                <div className="text-xs font-semibold text-[var(--theme-text-primary)]">Location Fencing (Geo-IP)</div>
                                                <div className="text-[11px] text-[var(--theme-text-secondary)]">Restrict login to corporate IP / VPN ranges only</div>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.ip_restriction}
                                            onChange={() => updatePolicy('ip_restriction', !currentPolicy.ip_restriction)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 border border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-card)]">
                                        <div className="flex items-center gap-2.5 pr-2">
                                            <Clock size={15} className="text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <div className="text-xs font-semibold text-[var(--theme-text-primary)]">Shift Hours Only</div>
                                                <div className="text-[11px] text-[var(--theme-text-secondary)]">Block staff access outside operational shift hours (08:00 - 22:00)</div>
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
