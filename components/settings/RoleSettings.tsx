import React, { useState, useEffect } from 'react';
import {
    Shield, UserCog, Users, Lock, Unlock, Eye, Edit2, Trash2, Check, X,
    AlertTriangle, Clock, MapPin, Smartphone, Key, Globe, Activity, ShieldCheck
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const PermissionToggle = ({ enabled, onChange, danger, ariaLabel }: { enabled: boolean, onChange: () => void, danger?: boolean, ariaLabel?: string }) => (
    <button
        onClick={onChange}
        aria-label={ariaLabel || (enabled ? 'Disable' : 'Enable')}
        className={`w-9 h-5 rounded-full p-1 transition-all relative ${enabled ? (danger ? 'bg-red-500' : 'bg-cyber-primary') : 'bg-white/10'}`}
    >
        <div className={`w-3 h-3 rounded-full bg-black shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
);

// ... (Rest of file context needed? No, I'll use multi_replace if they are far apart, but here I can't. I'll use multi_replace for safety)

const SecurityScore = ({ policies, role }: any) => {
    let score = 100;
    const issues = [];

    // Simple heuristic scoring
    if (!policies.mfa_required && role === 'admin') { score -= 30; issues.push("Admin without MFA"); }
    if (policies.session_timeout > 30) { score -= 10; issues.push("Long session timeout"); }
    if (!policies.ip_restriction && role === 'admin') { score -= 10; issues.push("Admin remote access unrestricted"); }
    if (policies.password_complexity !== 'high') { score -= 10; issues.push("Weak password policy"); }

    const getColor = (s: number) => {
        if (s >= 90) return 'text-green-400 border-green-500/50';
        if (s >= 70) return 'text-yellow-400 border-yellow-500/50';
        return 'text-red-400 border-red-500/50';
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl bg-black/50 ${getColor(score)}`}>
                    {score}%
                </div>
                <div>
                    <h5 className="font-bold text-white text-sm">Security Health Score</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Automated role audit</p>
                </div>
            </div>
            {issues.length > 0 && (
                <div className="text-xs text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-1 font-bold mb-1"><AlertTriangle size={12} /> Risks Detected:</div>
                    <ul className="list-disc list-inside opacity-80">
                        {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function RoleSettings() {
    const { showToast } = useStore();
    const { employees } = useData();

    // Default Permissions
    const defaultPermissions = {
        'POS & Sales': [
            { id: 'pos_access', label: 'Access POS Terminal', admin: true, manager: true, cashier: true, warehouse: false },
            { id: 'void_bill', label: 'Void Transaction', admin: true, manager: true, cashier: false, warehouse: false },
            { id: 'give_discount', label: 'Apply Custom Discount', admin: true, manager: true, cashier: false, warehouse: false },
        ],
        'Inventory': [
            { id: 'view_stock', label: 'View Stock Levels', admin: true, manager: true, cashier: true, warehouse: true },
            { id: 'adjust_stock', label: 'Manual Stock Adjustment', admin: true, manager: true, cashier: false, warehouse: true },
            { id: 'cost_price', label: 'View Cost Prices', admin: true, manager: true, cashier: false, warehouse: false },
        ],
        'Finance': [
            { id: 'view_reports', label: 'View Financial Reports', admin: true, manager: true, cashier: false, warehouse: false },
            { id: 'approve_expense', label: 'Approve Expenses', admin: true, manager: false, cashier: false, warehouse: false },
        ],
        'System Notifications': [
            { id: 'alert_low_stock', label: 'Low Stock Alerts', admin: true, manager: true, cashier: false, warehouse: true },
            { id: 'alert_void', label: 'Void / Refund Alerts', admin: true, manager: true, cashier: false, warehouse: false },
            { id: 'alert_security', label: 'Security & Login Alerts', admin: true, manager: false, cashier: false, warehouse: false },
            { id: 'alert_shift', label: 'Shift End Reports', admin: true, manager: true, cashier: false, warehouse: false },
        ]
    };

    // Default Security Policies
    const defaultPolicies = {
        admin: { mfa_required: true, session_timeout: 15, ip_restriction: false, time_restriction: false, password_complexity: 'high' },
        manager: { mfa_required: false, session_timeout: 30, ip_restriction: false, time_restriction: true, password_complexity: 'medium' },
        cashier: { mfa_required: false, session_timeout: 60, ip_restriction: true, time_restriction: true, password_complexity: 'low' },
        warehouse: { mfa_required: false, session_timeout: 60, ip_restriction: false, time_restriction: true, password_complexity: 'low' }
    };

    const [activeRole, setActiveRole] = useState('admin');
    const [subTab, setSubTab] = useState<'permissions' | 'policies'>('policies');
    const [permissions, setPermissions] = useState<any>(defaultPermissions);
    const [policies, setPolicies] = useState<any>(defaultPolicies);
    const [roles, setRoles] = useState([
        { id: 'admin', name: 'System Admin', users: 0, badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
        { id: 'manager', name: 'Store Manager', users: 0, badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { id: 'cashier', name: 'Retail Staff', users: 0, badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
        { id: 'warehouse', name: 'Warehouse Ops', users: 0, badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    ]);

    // Load Data
    useEffect(() => {
        // Load custom
        const savedPerms = localStorage.getItem('siifmart_permissions');
        if (savedPerms) setPermissions(JSON.parse(savedPerms));

        const savedPolicies = localStorage.getItem('siifmart_role_policies');
        if (savedPolicies) setPolicies(JSON.parse(savedPolicies));

        // Calculate counts
        if (employees) {
            const counts: any = { admin: 0, manager: 0, cashier: 0, warehouse: 0 };
            employees.forEach(emp => { if (counts[emp.role] !== undefined) counts[emp.role]++; });
            setRoles(prev => prev.map(r => ({ ...r, users: counts[r.id] || 0 })));
        }
    }, [employees]);

    const handleTogglePermission = (category: string, permId: string) => {
        setPermissions((prev: any) => {
            const newPerms = { ...prev };
            newPerms[category] = newPerms[category].map((p: any) => p.id === permId ? { ...p, [activeRole]: !p[activeRole] } : p);
            localStorage.setItem('siifmart_permissions', JSON.stringify(newPerms));
            return newPerms;
        });
        showToast('Permission Updated', 'success');
    };

    const updatePolicy = (key: string, value: any) => {
        setPolicies((prev: any) => {
            const newPolicies = { ...prev, [activeRole]: { ...prev[activeRole], [key]: value } };
            localStorage.setItem('siifmart_role_policies', JSON.stringify(newPolicies));
            return newPolicies;
        });
        showToast('Security Policy Updated', 'info');
    }

    const currentPolicy = policies[activeRole] || defaultPolicies.admin;

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-900/50 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                        <ShieldCheck className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">Enterprise Security Engine</h4>
                        <p className="text-xs text-gray-400">Zero-Trust Access Control & Policy Enforcement</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">System Armed</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* SIDEBAR */}
                <div className="space-y-3">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setActiveRole(role.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${activeRole === role.id
                                ? 'bg-white/10 border-white/20 shadow-lg ring-1 ring-cyber-primary/50'
                                : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${role.badge}`}>
                                    {role.id}
                                </span>
                                {activeRole === role.id && <Shield size={14} className="text-cyber-primary" />}
                            </div>
                            <div className="font-bold text-white mb-0.5">{role.name}</div>
                            <div className="text-xs text-gray-500">{role.users} Active Users</div>
                        </button>
                    ))}
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">

                    {/* TABS */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            {roles.find(r => r.id === activeRole)?.name}
                            <span className="text-sm font-normal text-gray-500 uppercase tracking-wider px-2 py-1 bg-white/5 rounded-md border border-white/5">Configuration</span>
                        </h3>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                            {[
                                { id: 'permissions', label: 'Access Rights', icon: Unlock },
                                { id: 'policies', label: 'Security Policies', icon: Shield }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSubTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${subTab === tab.id ? 'bg-cyber-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PERMISSIONS VIEW */}
                    {subTab === 'permissions' && (
                        <div className="space-y-8 animate-in fade-in">
                            {Object.entries(permissions).map(([category, items]: [string, any]) => (
                                <div key={category}>
                                    <h5 className="text-xs font-bold text-cyber-primary mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyber-primary rounded-full" /> {category}
                                    </h5>
                                    <div className="bg-black/20 border border-white/5 rounded-xl divide-y divide-white/5">
                                        {items.map((perm: any) => (
                                            <div key={perm.id} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                                <div>
                                                    <div className="text-sm font-bold text-white mb-0.5">{perm.label}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] uppercase font-bold ${perm[activeRole] ? 'text-green-400' : 'text-red-400'}`}>
                                                        {perm[activeRole] ? 'Granted' : 'Revoked'}
                                                    </span>
                                                    <PermissionToggle
                                                        enabled={perm[activeRole]}
                                                        onChange={() => handleTogglePermission(category, perm.id)}
                                                        danger={activeRole === 'admin' && perm.id === 'pos_access'} // Example danger flag
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* POLICIES VIEW */}
                    {subTab === 'policies' && (
                        <div className="space-y-6 animate-in fade-in">

                            <SecurityScore policies={currentPolicy} role={activeRole} />

                            {/* Session Security */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Clock size={18} /></div>
                                        <div>
                                            <h5 className="font-bold text-white text-sm">Session Timeout</h5>
                                            <p className="text-xs text-gray-500">Auto-logout inactive users</p>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="5" max="120" step="5"
                                        aria-label="Session Timeout"
                                        value={currentPolicy.session_timeout}
                                        onChange={(e) => updatePolicy('session_timeout', parseInt(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-2 text-xs font-mono text-blue-400">
                                        <span>5m</span>
                                        <span className="font-bold bg-blue-500/10 px-2 rounded">{currentPolicy.session_timeout} mins</span>
                                        <span>120m</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Smartphone size={18} /></div>
                                            <div>
                                                <h5 className="font-bold text-white text-sm">MFA Enforcement</h5>
                                                <p className="text-xs text-gray-500">Require 2FA for login</p>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.mfa_required}
                                            onChange={() => updatePolicy('mfa_required', !currentPolicy.mfa_required)}
                                        />
                                    </div>
                                    <div className="text-[10px] text-gray-400 bg-white/5 p-2 rounded border border-white/5">
                                        {currentPolicy.mfa_required ? 'Users must verify via Authenticator App.' : 'Standard password login allowed.'}
                                    </div>
                                </div>
                            </div>

                            {/* Context Access */}
                            <div className="p-5 bg-black/20 border border-white/5 rounded-xl">
                                <h5 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                    <Globe size={16} className="text-cyber-primary" /> Context-Aware Access
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-orange-400" />
                                            <div>
                                                <div className="text-sm font-bold text-white">Location Fencing (Geo-IP)</div>
                                                <div className="text-xs text-gray-500">Restrict login to corporate IP ranges only</div>
                                            </div>
                                        </div>
                                        <PermissionToggle
                                            enabled={currentPolicy.ip_restriction}
                                            onChange={() => updatePolicy('ip_restriction', !currentPolicy.ip_restriction)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-pink-400" />
                                            <div>
                                                <div className="text-sm font-bold text-white">Shift Hours Only</div>
                                                <div className="text-xs text-gray-500">Block access outside 08:00 - 22:00</div>
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
