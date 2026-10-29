import React, { useState, useMemo } from 'react';
import { Key, Sparkles, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { isManagerialRole } from '../../utils/roles';
import { formatRole } from '../../utils/formatting';
import { Employee } from '../../types';
import { CredentialHandoverModal } from './CredentialHandoverModal';

interface NewHireHandoverBannerProps {
    className?: string;
}

/**
 * NewHireHandoverBanner
 * Prominently alerts site managers (Store & Warehouse managers) when a recruit
 * is approved by HR & Finance, providing an immediate, elegant action to issue
 * their web login credentials and terminal PIN.
 *
 * Strictly hidden for Level 4 floor staff.
 */
export function NewHireHandoverBanner({ className = '' }: NewHireHandoverBannerProps) {
    const { user } = useStore();
    const { employees, activeSite } = useData();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem('siifmart_dismissed_handover_ids');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // Zero-Trust gate: Level 4 staff (cashiers, pickers, drivers) cannot see this banner
    const isManager = isManagerialRole(user?.role);
    if (!isManager) return null;

    // Filter newly approved employees for this active site
    const pendingHandovers = useMemo(() => {
        if (!activeSite?.id) return [];
        const siteId = activeSite.id;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        return employees.filter(emp => {
            const matchesSite = emp.siteId === siteId || (emp as any).site_id === siteId;
            if (!matchesSite) return false;
            if (emp.status !== 'Active') return false;

            // Check if already handed over or dismissed
            if (dismissedIds.includes(emp.id)) return false;
            if (emp.credentialsHandedOverAt || (emp as any).credentials_handed_over_at) return false;
            if (typeof window !== 'undefined' && localStorage.getItem(`siifmart_credentials_handed_over_${emp.id}`)) {
                return false;
            }

            // Must be a recent recruit or have new hire badge
            const hasNewBadge = Array.isArray(emp.badges) && (emp.badges.includes('New Hire') || emp.badges.includes('New Recruit'));
            const joinTs = emp.joinDate ? new Date(emp.joinDate).getTime() : 0;
            const isRecent = joinTs >= sevenDaysAgo;

            return hasNewBadge || isRecent;
        });
    }, [employees, activeSite?.id, dismissedIds]);

    if (pendingHandovers.length === 0) return null;

    const currentEmployee = pendingHandovers[Math.min(currentIndex, pendingHandovers.length - 1)];

    const handleDismiss = (empId: string) => {
        const next = [...dismissedIds, empId];
        setDismissedIds(next);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('siifmart_dismissed_handover_ids', JSON.stringify(next));
            } catch {
                // ignore
            }
        }
    };

    return (
        <>
            <div className={`p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-[var(--theme-status-info-border)] shadow-xs relative overflow-hidden transition-all ${className}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,113,227,0.3)]">
                            <Key size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center gap-1">
                                    <Sparkles size={13} />
                                    New Staff Approved & Ready for Duty
                                </span>
                                {pendingHandovers.length > 1 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-status-info-border)]">
                                        {currentIndex + 1} of {pendingHandovers.length}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--theme-text-primary)] font-medium mt-0.5">
                                <span className="font-bold">{currentEmployee.name}</span> ({formatRole(currentEmployee.role)}) has been approved by HR & Finance. Hand over their system credentials to start shift.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {pendingHandovers.length > 1 && (
                            <div className="flex items-center mr-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : pendingHandovers.length - 1))}
                                    className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer transition-colors"
                                    title="Previous recruit"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentIndex(prev => (prev < pendingHandovers.length - 1 ? prev + 1 : 0))}
                                    className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer transition-colors"
                                    title="Next recruit"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setSelectedEmployee(currentEmployee)}
                            className="px-3.5 py-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,113,227,0.25)] active:scale-95 transition-all cursor-pointer"
                        >
                            <span>Handover Credentials</span>
                            <ChevronRight size={14} />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDismiss(currentEmployee.id)}
                            className="p-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                            title="Dismiss notification"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Credential Handover Modal */}
            <CredentialHandoverModal
                employee={selectedEmployee}
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                onHandoverComplete={empId => {
                    handleDismiss(empId);
                    setSelectedEmployee(null);
                }}
            />
        </>
    );
}

export default NewHireHandoverBanner;
