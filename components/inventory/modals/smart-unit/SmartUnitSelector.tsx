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
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[10px] flex items-center justify-center font-bold">1</span>
                    Charged at POS by…
                </label>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => onCategoryChange('count')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'count'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <Box size={16} />
                            {category === 'count' && <Check size={14} />}
                        </div>
                        <div>
                            <p className="text-xs font-bold">By Count</p>
                            <p className="text-[9px] opacity-80 leading-tight mt-0.5">Units, packs, bottles</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onCategoryChange('weight')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'weight'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <Scale size={16} />
                            {category === 'weight' && <Check size={14} />}
                        </div>
                        <div>
                            <p className="text-xs font-bold">By Weight</p>
                            <p className="text-[9px] opacity-80 leading-tight mt-0.5">Kg, grams — weighed</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onCategoryChange('volume')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            category === 'volume'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <Sparkles size={16} />
                            {category === 'volume' && <Check size={14} />}
                        </div>
                        <div>
                            <p className="text-xs font-bold">By Volume</p>
                            <p className="text-[9px] opacity-80 leading-tight mt-0.5">Litres, ml — measured</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Step 2: Selling Unit */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-[10px] flex items-center justify-center font-bold">2</span>
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
                                        ? 'bg-[var(--theme-pill-bg)] border-[var(--theme-primary)] text-[var(--theme-text-primary)] font-bold shadow-sm'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                                }`}
                            >
                                <div>
                                    <p className="text-xs font-bold">{unit.label}</p>
                                    <p className="text-[10px] font-mono opacity-75">{unit.shortLabel}</p>
                                </div>
                                {isSelected && <Check size={14} className="text-[var(--theme-text-primary)]" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
