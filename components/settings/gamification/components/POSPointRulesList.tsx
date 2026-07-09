import React from 'react';
import { ToggleRight, ToggleLeft, Edit2, Trash2 } from 'lucide-react';
import type { StorePointRule } from '../../../../types';
import { CURRENCY_SYMBOL } from '../../../../constants';

interface POSPointRulesListProps {
    posPointRules: StorePointRule[];
    togglePointRule: (id: string) => void;
    getColorClass: (color: string) => string;
    getRuleTypeIcon: (type: any) => React.ReactNode;
    openPointRuleModal: (rule?: StorePointRule) => void;
    handleDeletePointRule: (id: string) => void;
}

export const POSPointRulesList: React.FC<POSPointRulesListProps> = ({
    posPointRules,
    togglePointRule,
    getColorClass,
    getRuleTypeIcon,
    openPointRuleModal,
    handleDeletePointRule
}) => {
    return (
        <div className="space-y-3">
            {posPointRules.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(rule => (
                <div
                    key={rule.id}
                    className={`bg-stone-50/50 dark:bg-black/25 border rounded-xl p-4 transition-all group ${
                        rule.enabled 
                            ? 'border-[#2C5E3B]/30 hover:border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 dark:hover:border-[#A9CBA2]/50 shadow-sm' 
                            : 'border-transparent opacity-50 shadow-none'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => togglePointRule(rule.id)}
                            className={`p-2 rounded-lg transition-all cursor-pointer ${
                                rule.enabled 
                                    ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' 
                                    : 'bg-stone-200/50 text-stone-500 dark:bg-stone-800/50 dark:text-stone-400'
                            }`}
                        >
                            {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>

                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClass(rule.color || 'blue')} flex items-center justify-center shrink-0 shadow-inner text-white`}>
                            {getRuleTypeIcon(rule.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] text-sm">{rule.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    rule.type === 'category' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' :
                                    rule.type === 'product' ? 'bg-purple-500/20 text-purple-500 dark:text-purple-400' :
                                    rule.type === 'revenue' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                    rule.type === 'quantity' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                    'bg-pink-500/20 text-pink-500 dark:text-pink-400'
                                }`}>
                                    {rule.type}
                                </span>
                                {rule.multiplier && rule.multiplier > 1 && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                        {rule.multiplier}x
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-stone-500 dark:text-[#7A9E83] mt-1 truncate">
                                {rule.description || `${rule.pointsPerUnit} pts per unit`}
                            </p>
                            {rule.categoryId && rule.categoryId !== 'all' && (
                                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                                    Category: {rule.categoryId}
                                </p>
                            )}
                        </div>

                        <div className="text-right px-4 border-l border-[#E2DCCE] dark:border-emerald-950/20">
                            <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Points/Unit</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-500">+{rule.pointsPerUnit}</p>
                        </div>

                        {rule.pointsPerRevenue && (
                            <div className="text-right px-4 border-l border-[#E2DCCE] dark:border-emerald-950/20">
                                <p className="text-xs text-stone-500 dark:text-[#7A9E83]">Per {CURRENCY_SYMBOL}{rule.revenueThreshold}</p>
                                <p className="text-xl font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">+{rule.pointsPerRevenue}</p>
                            </div>
                        )}

                        <div className="text-center px-3">
                            <p className="text-[10px] text-stone-400 dark:text-stone-500">Priority</p>
                            <p className="text-sm font-bold text-stone-500 dark:text-[#7A9E83]">{rule.priority || 1}</p>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openPointRuleModal(rule)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-500 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                                title="Edit Rule"
                                aria-label="Edit Rule"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeletePointRule(rule.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                                title="Delete Rule"
                                aria-label="Delete Rule"
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
