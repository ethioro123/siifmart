import React from 'react';
import { Thermometer, ShieldCheck, ChevronDown, AlertTriangle } from 'lucide-react';
import { STORAGE_CONDITIONS } from './utils';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryStorageDefaults } from './categoryLogistics';

export interface DynamicStorageHandlingSectionProps {
    selectedMainCategory: string;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
}

export const DynamicStorageHandlingSection: React.FC<DynamicStorageHandlingSectionProps> = ({
    selectedMainCategory,
    customAttributes,
    setCustomAttributes,
}) => {
    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const domainId = specGroup.id;
    const storageConfig = getCategoryStorageDefaults(domainId);

    const storageType = customAttributes.storage?.type || storageConfig.defaultStorage;
    const isPerishable = customAttributes.storage?.isPerishable !== undefined 
        ? customAttributes.storage?.isPerishable 
        : storageConfig.defaultPerishable;

    const handleFlagChange = (flagId: string, checked: boolean) => {
        setCustomAttributes((prev: any) => {
            const nextStorage = { ...prev.storage };
            const nextPackaging = { ...prev.packaging };

            if (flagId === 'isBreakable') {
                nextPackaging.isBreakable = checked;
            } else if (flagId === 'isFragile') {
                nextStorage.isFragile = checked;
            } else if (flagId === 'isHazardous') {
                nextStorage.isHazardous = checked;
            } else if (flagId === 'isLightSensitive') {
                nextStorage.isLightSensitive = checked;
            } else if (flagId === 'isPerishable') {
                nextStorage.isPerishable = checked;
            } else {
                nextStorage[flagId] = checked;
            }

            return {
                ...prev,
                storage: nextStorage,
                packaging: nextPackaging
            };
        });
    };

    const getFlagValue = (flagId: string): boolean => {
        if (flagId === 'isBreakable') return Boolean(customAttributes.packaging?.isBreakable);
        if (flagId === 'isFragile') return Boolean(customAttributes.storage?.isFragile);
        if (flagId === 'isHazardous') return Boolean(customAttributes.storage?.isHazardous);
        if (flagId === 'isLightSensitive') return Boolean(customAttributes.storage?.isLightSensitive);
        if (flagId === 'isPerishable') return Boolean(isPerishable);
        return Boolean(customAttributes.storage?.[flagId]);
    };

    return (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    <Thermometer size={12} className="text-purple-500" />
                    <span>5. Storage, Inbound QC & Handling Directives</span>
                </div>
                <span className="text-[9px] text-[var(--theme-text-secondary)] font-medium">
                    Category-tailored receiving protocol & facility climate rules
                </span>
            </div>

            <div className="grid grid-cols-6 gap-3.5">
                {/* Storage Temperature Condition */}
                <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Storage Temperature</label>
                    <div className="relative">
                        <select
                            title="Storage Temperature"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                            value={storageType}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, type: e.target.value } }))}
                        >
                            {STORAGE_CONDITIONS.map(s => (
                                <option key={s} value={s} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                    {s}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                    </div>
                </div>

                {/* Shelf Life Days */}
                <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                        Shelf Life (Days) {storageConfig.defaultPerishable && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                        placeholder={storageConfig.defaultShelfLife ? `e.g. ${storageConfig.defaultShelfLife}` : 'Leave blank if durable'}
                        value={customAttributes.storage?.shelfLifeDays || ''}
                        onChange={e => setCustomAttributes((p: any) => ({
                            ...p,
                            storage: {
                                ...p.storage,
                                shelfLifeDays: e.target.value,
                                isPerishable: Boolean(e.target.value && parseInt(e.target.value) > 0)
                            }
                        }))}
                    />
                </div>

                {/* Max Stack Limit */}
                <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Max Stack Limit</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                        placeholder="e.g. 5 cartons high"
                        value={customAttributes.storage?.stackLimit || ''}
                        onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, stackLimit: e.target.value } }))}
                    />
                </div>
            </div>

            {/* Inbound QC Receiving Verification Protocol */}
            <div className="space-y-1 pt-1">
                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-500" />
                    <span>Inbound QC Receiving Protocol & Verification Directive</span>
                </label>
                <div className="relative">
                    <select
                        title="Inbound QC Directive"
                        className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                        value={customAttributes.storage?.inboundQcDirective || ''}
                        onChange={e => setCustomAttributes((p: any) => ({
                            ...p,
                            storage: { ...p.storage, inboundQcDirective: e.target.value }
                        }))}
                    >
                        <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                            Standard Receiving Audit ({storageConfig.inboundDirectives[0] || 'Visual Inspection'})
                        </option>
                        {storageConfig.inboundDirectives.map((directive, idx) => (
                            <option key={idx} value={directive} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                {directive}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                </div>
            </div>

            {/* Category-Tailored Compliance Flags */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
                {storageConfig.flags.map(flag => {
                    const isChecked = getFlagValue(flag.id);
                    return (
                        <label key={flag.id} className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className={`w-3.5 h-3.5 rounded border-[var(--theme-border)] ${flag.isAlert ? 'accent-rose-500' : 'accent-[var(--theme-accent)]'}`}
                                checked={isChecked}
                                onChange={e => handleFlagChange(flag.id, e.target.checked)}
                            />
                            <span className={`text-xs font-semibold transition-colors ${
                                flag.isAlert && isChecked
                                    ? 'text-rose-500 font-bold'
                                    : 'text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)]'
                            }`}>
                                {flag.label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};
