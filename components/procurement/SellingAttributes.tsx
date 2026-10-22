import React from 'react';
import { getGroupedUnits, getSellUnit } from '../../utils/units';
import type { POItemFormDraft } from './POItemForm';

type Attributes = POItemFormDraft['customAttributes'];
export interface SellingAttributesProps {
    customItemUnit: string; setCustomItemUnit: (value: string) => void;
    currentRetailPrice: number; setCurrentRetailPrice: (value: number) => void;
    currentCost: number; customItemSize: string; sizeType: string;
    customAttributes: Attributes; setCustomAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
    currencySymbol?: string; selectedMainCategory?: string;
    errors: Record<string, string>; setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}
export const SellingAttributes: React.FC<SellingAttributesProps> = ({
    customItemUnit, setCustomItemUnit, customAttributes, setCustomAttributes, errors, setErrors
}) => {
    return <section className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] p-4">
        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Selling unit & pricing handoff</h3>
        <label className="block space-y-1 text-sm text-[var(--theme-text-secondary)]">Sell unit
            <select aria-label="Sell unit" value={customItemUnit} onChange={event => {
                const code = event.target.value;
                const unit = getSellUnit(code);
                setCustomItemUnit(code);
                setErrors(previous => ({ ...previous, unit: '' }));
                setCustomAttributes(previous => ({ ...previous, commercial: { ...previous.commercial,
                    sellBy: unit.category === 'weight' ? 'Weight' : unit.category === 'volume' ? 'Volume' : 'Unit',
                    isWeighted: unit.category === 'weight' || unit.category === 'volume'
                } }));
            }} className="min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
                <option value="">Select a sell unit</option>
                {Object.entries(getGroupedUnits()).map(([group, units]) => <optgroup key={group} label={group}>{units.map(unit => <option key={unit.code} value={unit.code}>{unit.label}</option>)}</optgroup>)}
            </select>
        </label>
        {errors.unit && <p role="alert" className="text-sm text-[var(--theme-text-primary)]">{errors.unit}</p>}
        <p className="text-sm text-[var(--theme-text-secondary)]">Retail price is set through Merchandising product approval. It is not required to prepare this purchase order.</p>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--theme-text-secondary)]">
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={customAttributes.commercial.isReturnable} onChange={event => setCustomAttributes(previous => ({ ...previous, commercial: { ...previous.commercial, isReturnable: event.target.checked } }))} />Returnable</label>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={customAttributes.commercial.isBundleEligible} onChange={event => setCustomAttributes(previous => ({ ...previous, commercial: { ...previous.commercial, isBundleEligible: event.target.checked } }))} />Bundle eligible</label>
        </div>
    </section>;
};
