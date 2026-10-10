import React from 'react';
import { Percent, Edit2, Trash2 } from 'lucide-react';
import type { POSRoleDistribution } from '../../../../types';

interface POSRoleDistributionListProps {
    posRoleDistribution: POSRoleDistribution[];
    getColorClass: (color: string) => string;
    openRoleModal: (role?: POSRoleDistribution) => void;
    handleDeleteRole: (id: string) => void;
}

export const POSRoleDistributionList: React.FC<POSRoleDistributionListProps> = ({
    posRoleDistribution,
    getColorClass,
    openRoleModal,
    handleDeleteRole
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {posRoleDistribution.map(role => (
                <div
                    key={role.id}
                    className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[#0071E3]/40 rounded-xl p-3.5 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getColorClass(role.color)} flex items-center justify-center shrink-0 shadow-xs`}>
                            <Percent size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-[var(--theme-text-primary)]">{role.role}</h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                Allocated {role.percentage}% of bonus pool
                            </p>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => openRoleModal(role)}
                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                                title={`Edit ${role.role}`}
                            >
                                <Edit2 size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title={`Delete ${role.role}`}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
