import React from 'react';
import { Box, Scale, Sparkles, Check } from 'lucide-react';
import { SellUnit } from '../../../../utils/units';

type CategoryType = 'count' | 'weight' | 'volume';

interface SmartUnitSelectorProps {
    category: CategoryType;
    onCategoryChange: (cat: CategoryType) => void;
    availableUnits: SellUnit[];
    selectedUnitCode: string;
    onSelectUnit: (code: string) => void;
}

export const SmartUnitSelector: React.FC<SmartUnitSelectorProps> = ({
    category,
    onCategoryChange,
    availableUnits,
    selectedUnitCode,
    onSelectUnit,
}) => {
    return (
        <div className="space-y-4">
            {/* Step 1: Charged at POS by */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-accent)] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    Charged at POS by…
                </label>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => onCategoryChange('count')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'count'
                                ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-text-primary)] border-[var(--theme-accent)] shadow-xs ring-1 ring-[var(--theme-accent)]/30'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1.5">
                            <Box size={16} className={category === 'count' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'} />
                            {category === 'count' && <Check size={14} className="text-[var(--theme-accent)]" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">By Count</p>
                            <p className="text-[11px] text-[var(--theme-text-muted)] leading-tight mt-0.5">Units, packs, bottles</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onCategoryChange('weight')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'weight'
                                ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] border-[var(--theme-status-warning-border)] shadow-xs ring-1 ring-[var(--theme-status-warning-border)]'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1.5">
                            <Scale size={16} className={category === 'weight' ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-text-secondary)]'} />
                            {category === 'weight' && <Check size={14} className="text-[var(--theme-status-warning-text)]" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">By Weight</p>
                            <p className="text-[11px] text-[var(--theme-text-muted)] leading-tight mt-0.5">Kg, grams — weighed</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onCategoryChange('volume')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'volume'
                                ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-text-primary)] border-[var(--theme-status-info-border)] shadow-xs ring-1 ring-[var(--theme-status-info-border)]'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1.5">
                            <Sparkles size={16} className={category === 'volume' ? 'text-[var(--theme-status-info-text)]' : 'text-[var(--theme-text-secondary)]'} />
                            {category === 'volume' && <Check size={14} className="text-[var(--theme-status-info-text)]" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">By Volume</p>
                            <p className="text-[11px] text-[var(--theme-text-muted)] leading-tight mt-0.5">Litres, ml — measured</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Step 2: Selling Unit */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-accent)] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    Selling unit — what is "1" at checkout?
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableUnits.map(unit => {
                        const isSelected = selectedUnitCode === unit.code;
                        return (
                            <button
                                key={unit.code}
                                type="button"
                                onClick={() => onSelectUnit(unit.code)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                    isSelected
                                        ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-text-primary)] font-bold shadow-xs ring-1 ring-[var(--theme-accent)]/30'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)]'
                                }`}
                            >
                                <div>
                                    <p className="text-xs font-bold">{unit.label}</p>
                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)]">{unit.shortLabel}</p>
                                </div>
                                {isSelected && <Check size={14} className="text-[var(--theme-accent)]" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
