import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { StorePointRule } from '../../../../types';
import { useData } from '../../../../contexts/DataContext';
import { Country, getCountryProfile } from '../../../../utils/localization';

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
    const { settings, effectiveCountry } = useData();
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || countryProfile.currencyCode;

    return (
        <div className="space-y-3">
            {posPointRules.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(rule => (
                <div
                    key={rule.id}
                    className={`bg-[var(--theme-bg-subtle)] border rounded-xl p-3.5 transition-all group ${
                        rule.enabled
                            ? 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50 shadow-xs'
                            : 'border-transparent opacity-50'
                    }`}
                >
                    <div className="flex items-center gap-3.5">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={rule.enabled}
                            onClick={() => togglePointRule(rule.id)}
                            aria-label={`Toggle rule ${rule.name}`}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${
                                rule.enabled ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>

                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getColorClass(rule.color || 'blue')} flex items-center justify-center shrink-0 shadow-xs text-white`}>
                            {getRuleTypeIcon(rule.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-[var(--theme-text-primary)] text-xs">{rule.name}</h4>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                    {rule.type}
                                </span>
                                {rule.multiplier && rule.multiplier > 1 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                        {rule.multiplier}x
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 truncate">
                                {rule.description || `${rule.pointsPerUnit} pts per unit`}
                            </p>
                            {rule.categoryId && rule.categoryId !== 'all' && (
                                <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">
                                    Category: {rule.categoryId}
                                </p>
                            )}
                        </div>

                        <div className="text-right px-3 border-l border-[var(--theme-border)]">
                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Points/Unit</p>
                            <p className="text-sm font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">+{rule.pointsPerUnit}</p>
                        </div>

                        {rule.pointsPerRevenue && (
                            <div className="text-right px-3 border-l border-[var(--theme-border)]">
                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Per {currency}{rule.revenueThreshold}</p>
                                <p className="text-sm font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">+{rule.pointsPerRevenue}</p>
                            </div>
                        )}

                        <div className="text-center px-2">
                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Priority</p>
                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{rule.priority || 1}</p>
                        </div>

                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => openPointRuleModal(rule)}
                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                                title="Edit Rule"
                                aria-label="Edit Rule"
                            >
                                <Edit2 size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeletePointRule(rule.id)}
                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] transition-colors cursor-pointer"
                                title="Delete Rule"
                                aria-label="Delete Rule"
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
