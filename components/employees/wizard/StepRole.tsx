import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../../types';
import { authService } from '../../../services/auth.service';

interface StepRoleProps {
    newEmpData: any;
    availableRoles: any[];
    handleRoleChange: (role: UserRole) => void;
}

export default function StepRole({
    newEmpData,
    availableRoles,
    handleRoleChange
}: StepRoleProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">Select App Access Profile</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">This profile controls system permissions. Enter the employee's job title separately in Details.</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    {availableRoles.length} Roles Authorized
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {availableRoles.map(roleObj => {
                    const violations = authService.validateSeparationOfDuties(roleObj.id);
                    const hasViolations = violations.length > 0;
                    const isSelected = newEmpData.role === roleObj.id;

                    return (
                        <div
                            key={roleObj.id}
                            onClick={() => handleRoleChange(roleObj.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                                isSelected
                                    ? 'bg-[var(--theme-primary)]/10 bg-[var(--theme-status-success-bg)] border-[var(--theme-border)] border-[var(--theme-status-success-border)] shadow-sm'
                                    : 'bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] hover:border-[var(--theme-border)] hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                isSelected ? 'border-[var(--theme-border)] border-[var(--theme-status-success-border)]' : 'border-[var(--theme-border)] border-[var(--theme-border)]'
                            }`}>
                                {isSelected && <div className="w-2 h-2 bg-[var(--theme-primary)] bg-[var(--theme-status-success-bg)] rounded-full" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`font-bold text-xs uppercase tracking-wide ${isSelected ? 'text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]'}`}>
                                        {roleObj.label}
                                    </p>
                                    {hasViolations && (
                                        <div className="group/sod relative" title={`Separation of duties warning: ${violations.join(', ')}`}>
                                            <AlertTriangle size={13} className="text-[var(--theme-status-warning-text)]" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                                    {roleObj.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
