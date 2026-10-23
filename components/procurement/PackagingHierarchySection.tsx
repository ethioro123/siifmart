import React from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryPackagingDefaults } from './categoryLogistics';

export interface PackagingHierarchySectionProps {
    packagingLevel: 'single' | 'case' | 'bale' | 'two_tier';
    setPackagingLevel: (level: 'single' | 'case' | 'bale' | 'two_tier') => void;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
    multiplier: number;
    selectedMainCategory?: string;
    errors?: Record<string, string>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const PackagingHierarchySection: React.FC<PackagingHierarchySectionProps> = ({
    packagingLevel,
    setPackagingLevel,
    customAttributes,
    setCustomAttributes,
    multiplier,
    selectedMainCategory = '',
    errors = {},
    setErrors
}) => {
    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const domainId = specGroup.id;
    const pkgDefaults = getCategoryPackagingDefaults(domainId);
    const containerOptions = pkgDefaults.containers;

    const tiers = [
        {
            id: 'single',
            label: pkgDefaults.levelLabels?.single || 'Single Consumer Unit',
            sub: '1:1 Individual Each'
        },
        {
            id: 'case',
            label: pkgDefaults.levelLabels?.case || 'Master Case / Carton',
            sub: 'Wholesale shipping case'
        },
        {
            id: 'bale',
            label: pkgDefaults.levelLabels?.bale || 'Bulk Bale / Bundle',
            sub: 'Commodity bale / bundle'
        },
        {
            id: 'two_tier',
            label: pkgDefaults.levelLabels?.two_tier || '2-Tier Master Case',
            sub: 'Inner packs in master case'
        },
    ];

    return (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    <Layers size={12} className="text-amber-500" />
                    <span>4. Supply Chain Packaging Hierarchy (GS1 Logistics Standard)</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[9px] font-mono font-bold text-[var(--theme-accent)]">
                    {packagingLevel === 'single' ? '1 order unit = 1 consumer unit' : multiplier > 0 ? `1 order unit = ${multiplier} consumer units` : 'Enter packaging counts to calculate units'}
                </div>
            </div>

            {/* Packaging Level Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tiers.map(tier => (
                    <button
                        key={tier.id}
                        type="button"
                        onClick={() => setPackagingLevel(tier.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            packagingLevel === tier.id
                                ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-accent)] shadow-sm'
                                : 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)] hover:border-[var(--theme-border-subtle)]'
                        }`}
                    >
                        <div className={`text-xs font-bold ${packagingLevel === tier.id ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-primary)]'}`}>
                            {tier.label}
                        </div>
                        <div className="text-[9px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            {tier.sub}
                        </div>
                    </button>
                ))}
            </div>

            {/* Container Type + Multipliers */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3.5 pt-1">
                <div className="col-span-full sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Package Container Type</label>
                    <div className="relative">
                        <select 
                            title="Package Container Type" 
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer" 
                            value={customAttributes.packaging?.packageType || ''} 
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packageType: e.target.value } }))}
                        >
                            <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Container...</option>
                            {containerOptions.map(t => <option key={t} value={t} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{t}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                    </div>
                </div>

                {packagingLevel !== 'single' && (
                    <div className="col-span-full sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            {packagingLevel === 'two_tier' ? 'Inner Pack Qty' : packagingLevel === 'bale' ? 'Bale Qty' : 'Case Qty'}{' '}
                            <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">
                                ({packagingLevel === 'two_tier' ? 'units per inner pack' : packagingLevel === 'bale' ? 'units per bale' : 'units per case'})
                            </span>{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="2"
                            className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.packQty ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                            placeholder="e.g. 12 or 24"
                            data-po-field="packQty" value={customAttributes.packaging?.packQty || ''}
                            onChange={e => {
                                if (errors.packQty && setErrors) setErrors(prev => ({ ...prev, packQty: '' }));
                                setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: e.target.value } }));
                            }}
                        />
                        {errors.packQty && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.packQty}</span>}
                    </div>
                )}

                {packagingLevel === 'two_tier' && (
                    <div className="col-span-full sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Case Size <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">(inner packs per case)</span> <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.caseSize ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                            placeholder="e.g. 4"
                            data-po-field="caseSize" value={customAttributes.packaging?.caseSize || ''}
                            onChange={e => {
                                if (errors.caseSize && setErrors) setErrors(prev => ({ ...prev, caseSize: '' }));
                                setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, caseSize: e.target.value } }));
                            }}
                        />
                        {errors.caseSize && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.caseSize}</span>}
                    </div>
                )}

                <div className="col-span-full sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Packaging Material</label>
                    <div className="relative">
                        <select
                            title="Packaging Material"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                            value={customAttributes.packaging?.material || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, material: e.target.value } }))}
                        >
                            <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Material...</option>
                            {['Paper / Cardboard', 'Plastic', 'Glass', 'Metal', 'Aluminium', 'Fabric', 'Wood'].map(m => <option key={m} value={m} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{m}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};
