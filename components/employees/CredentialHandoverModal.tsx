import React, { useState } from 'react';
import { 
    Key, Copy, Check, Printer, ShieldCheck, 
    ExternalLink, CheckCircle2, User, Building2, Eye, EyeOff
} from 'lucide-react';
import Modal from '../Modal';
import { Employee } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { isManagerialRole } from '../../utils/roles';
import { parseEmployeeCode, formatDisplayEmployeeId } from '../../utils/employeeIdGenerator';
import { employeesService } from '../../services/employees.service';
import { logger } from '../../utils/logger';

interface CredentialHandoverModalProps {
    employee: Employee | null;
    isOpen: boolean;
    onClose: () => void;
    onHandoverComplete?: (employeeId: string) => void;
}

/**
 * CredentialHandoverModal
 * Executive Apple-styled handover slip for newly approved staff.
 * Allows site managers (Level 3) to securely issue credentials, PINs, and portal access
 * to their newly approved frontline staff.
 */
export function CredentialHandoverModal({
    employee,
    isOpen,
    onClose,
    onHandoverComplete
}: CredentialHandoverModalProps) {
    const { user, showToast } = useStore();
    const { sites, activeSite, addNotification } = useData();

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Strictly blocked for Level 4 floor staff
    const isManager = isManagerialRole(user?.role);
    if (!isManager || !isOpen || !employee) return null;

    const assignedSite = sites.find(s => s.id === employee.siteId) || activeSite;
    const parsed = parseEmployeeCode(employee.code || employee.id);
    const numericPin = parsed?.seq ? String(parsed.seq).padStart(4, '0') : (employee.code?.replace(/\D/g, '').slice(-4) || '1234');
    
    // Resolve saved password or standard initial password pattern across multiple identifier keys
    const codeKey = (employee.code || '').toLowerCase();
    const nameKey = (employee.name || '').toLowerCase();
    const nameUnderscore = nameKey.replace(/\s+/g, '_');
    const savedPassword = typeof window !== 'undefined'
        ? (localStorage.getItem(`siifmart_temp_pwd_${employee.id}`) ||
           (codeKey ? localStorage.getItem(`siifmart_temp_pwd_by_code_${codeKey}`) : null) ||
           (nameKey ? localStorage.getItem(`siifmart_temp_pwd_by_name_${nameKey}`) : null) ||
           (nameUnderscore ? localStorage.getItem(`siifmart_temp_pwd_by_name_${nameUnderscore}`) : null))
        : null;
    const initialPassword = savedPassword || `SiifMart@${numericPin}`;
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://siifmart.com';

    const handleCopy = (text: string, fieldName: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        showToast(`Copied ${fieldName} to clipboard`, 'success');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCopyAll = () => {
        const fullSlip = `
SIIF MART - STAFF ACCESS CREDENTIALS
====================================
Employee Name: ${employee.name}
Role: ${employee.role.toUpperCase()}
Facility: ${assignedSite?.name || 'Local Site'} (${assignedSite?.type || 'Branch'})
Staff ID: ${formatDisplayEmployeeId(employee, sites)}

WEB APP ACCESS:
- Portal URL: ${portalUrl}
- Login Email: ${employee.email}
- Initial Password: ${initialPassword}
- Terminal Quick PIN: ${numericPin}

FIRST LOGIN INSTRUCTIONS:
1. Navigate to the portal URL on your mobile phone or workplace workstation.
2. Sign in with your System Login Email and Initial Password.
3. Use your 4-digit PIN for quick till unlock and attendance check-in.
4. You will be prompted to set a permanent private password upon first sign-in.
====================================
Authorized by Site Management
        `.trim();

        navigator.clipboard.writeText(fullSlip);
        showToast('All credentials copied as formatted handover slip', 'success');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleMarkComplete = async () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`siifmart_credentials_handed_over_${employee.id}`, new Date().toISOString());
        }
        try {
            await employeesService.markCredentialsHandedOver(employee.id, user?.name || user?.role || 'Manager');
        } catch (err) {
            logger.warn('CredentialHandoverModal', 'Failed to persist handover to database', { error: err });
        }
        addNotification('success', `Credentials handed over to ${employee.name}. Staff member is ready for duty.`);
        onHandoverComplete?.(employee.id);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Staff Access Credentials & Handover" size="lg">
            <div className="space-y-6 print:m-0 print:p-0">
                {/* Employee Profile Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 flex items-center justify-center font-bold text-base shrink-0">
                            {employee.avatar ? (
                                <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                <User size={22} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                    {employee.name}
                                </h3>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active (Approved)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                <span className="font-semibold uppercase tracking-wider text-[11px] text-[#0071E3] dark:text-[#2997FF]">
                                    {employee.role.replace('_', ' ')}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Building2 size={12} />
                                    {assignedSite?.name || 'Local Site'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block">
                            Staff Code
                        </span>
                        <span className="text-sm font-mono font-bold text-[var(--theme-text-primary)]">
                            {formatDisplayEmployeeId(employee, sites)}
                        </span>
                    </div>
                </div>

                {/* Primary Credentials Grid */}
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                        <Key size={13} className="text-[#0071E3] dark:text-[#2997FF]" />
                        Web & Terminal Sign-In Credentials
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* System Login Email */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] block">
                                    System Login Email
                                </span>
                                <span className="text-xs sm:text-sm font-mono font-semibold text-[var(--theme-text-primary)] select-all">
                                    {employee.email}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopy(employee.email, 'Login Email')}
                                className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                title="Copy Email"
                            >
                                {copiedField === 'Login Email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Initial Temporary Password */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] block">
                                    Initial Password
                                </span>
                                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--theme-text-primary)] select-all">
                                    {showPassword ? initialPassword : '••••••••••••'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                    title={showPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(initialPassword, 'Password')}
                                    className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                    title="Copy Password"
                                >
                                    {copiedField === 'Password' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Quick Terminal PIN */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] block">
                                    Terminal / POS Quick PIN
                                </span>
                                <span className="text-base font-mono font-black tracking-widest text-[#0071E3] dark:text-[#2997FF] select-all">
                                    {numericPin}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopy(numericPin, 'Terminal PIN')}
                                className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                title="Copy PIN"
                            >
                                {copiedField === 'Terminal PIN' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Web Application URL */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] block">
                                    Web Access Portal URL
                                </span>
                                <span className="text-xs font-mono font-semibold text-[var(--theme-text-primary)] select-all truncate max-w-[180px] sm:max-w-[200px] block">
                                    {portalUrl}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopy(portalUrl, 'Portal URL')}
                                className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                title="Copy URL"
                            >
                                {copiedField === 'Portal URL' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Handover Guidance Note */}
                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-[var(--theme-text-secondary)] space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0071E3] dark:text-[#2997FF]">
                        <ShieldCheck size={14} />
                        <span>Security & Access Protocol</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                        Hand over this card to the new team member. They can log in to the web app on any mobile or desktop device using their email and initial password. At the till or scanning terminal, they can unlock directly using their 4-digit PIN.
                    </p>
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-4 border-t border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyAll}
                            className="px-3.5 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                            <Copy size={13} />
                            <span>Copy All</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3.5 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                            <Printer size={13} />
                            <span>Print Slip</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleMarkComplete}
                            className="px-4 py-2 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-95"
                        >
                            <CheckCircle2 size={14} />
                            <span>Mark as Handed Over</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default CredentialHandoverModal;
