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
                    <h4 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">Select System Access Role</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Filtered strictly by your hierarchy authority and facility domain</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-stone-600 dark:text-stone-300">
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
                                    ? 'bg-[#2C5E3B]/10 dark:bg-emerald-500/15 border-[#2C5E3B] dark:border-emerald-500/50 shadow-sm'
                                    : 'bg-white dark:bg-black/20 border-[#E2DCCE] dark:border-white/5 hover:border-stone-400 dark:hover:border-white/20'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                isSelected ? 'border-[#2C5E3B] dark:border-emerald-400' : 'border-stone-300 dark:border-stone-600'
                            }`}>
                                {isSelected && <div className="w-2 h-2 bg-[#2C5E3B] dark:bg-emerald-400 rounded-full" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`font-bold text-xs uppercase tracking-wide ${isSelected ? 'text-[#1E3F27] dark:text-[#EAE5D9]' : 'text-stone-800 dark:text-stone-200'}`}>
                                        {roleObj.label}
                                    </p>
                                    {hasViolations && (
                                        <div className="group/sod relative" title={`Separation of duties warning: ${violations.join(', ')}`}>
                                            <AlertTriangle size={13} className="text-amber-500" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
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
