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
                    className="bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 rounded-xl p-4 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClass(role.color)} flex items-center justify-center shrink-0 shadow-inner`}>
                            <Percent size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{role.role}</h4>
                            <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1">
                                Gets {role.percentage}% of store bonus pool
                            </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openRoleModal(role)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                                title={`Edit ${role.role}`}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                                title={`Delete ${role.role}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
