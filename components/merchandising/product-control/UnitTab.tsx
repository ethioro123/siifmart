import React from 'react';
import type { Product, Site } from '../../../types';
import type { UnitConfig, SellMode, UnitScope } from '../../../types/product-control';
import { getSellUnit, SELL_UNITS } from '../../../utils/units';
import { initialUnitConfig, packagingPreview, unitProposal, netContentPreview } from '../../../utils/productControlLogic';
import { ControlFact, ControlField, ControlSection, ProposalAction, controlInput } from './ControlPrimitives';
export type { UnitConfig, SellMode, UnitScope } from '../../../types/product-control';
interface Props {
    product: Product; unitCfg: UnitConfig; setUnitCfg: React.Dispatch<React.SetStateAction<UnitConfig>>;
    handleSaveUnit: () => Promise<void>; isSaving: boolean; submitted?: boolean; canDirectEdit?: boolean; inputCls?: string; sites?: Site[];
}
export function buildPreview(cfg: UnitConfig): string {
    const unit = getSellUnit(cfg.sellUnit);
    return cfg.sellMode === 'count' ? `${cfg.label.trim() || unit.label}${cfg.packOf && Number(cfg.packOf) > 1 ? ` · ${cfg.packOf} units per pack` : ''}` : `Sold per ${unit.shortLabel}`;
}
export const UnitTab: React.FC<Props> = ({ product, unitCfg, setUnitCfg, handleSaveUnit, isSaving, submitted }) => {
    const saved = initialUnitConfig(product);
    const units = SELL_UNITS.filter(unit => unit.category === unitCfg.sellMode);
    const packaging = packagingPreview(unitCfg);
    const net = netContentPreview(unitCfg);
    const recordedContents = saved.physicalQty && saved.physicalUnit ? `${saved.physicalQty} ${saved.physicalUnit}` : product.size || 'Not recorded';
    let error = ''; let changed = false;
    try { changed = Object.keys(unitProposal(product, unitCfg)).length > 0; } catch (cause) { error = (cause as Error).message; }
    const setMode = (mode: SellMode) => setUnitCfg(cfg => ({ ...cfg, sellMode: mode, sellUnit: mode === 'count' ? 'UNIT' : mode === 'weight' ? 'KG' : 'L' }));
    return <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="space-y-4">
                <ControlSection title="How this product is sold" description="Choose what one quantity at checkout represents. Physical contents and the selling unit are separate.">
                    <fieldset><legend className="mb-2 text-sm font-medium">Charging method</legend><div className="grid grid-cols-3 gap-2">{(['count', 'weight', 'volume'] as const).map(mode => <label key={mode} className={`cursor-pointer rounded-xl border p-3 text-sm ${unitCfg.sellMode === mode ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-subtle)]' : 'border-[var(--theme-border)]'}`}><input className="mr-2 accent-[var(--theme-accent)]" type="radio" name="selling-mode" value={mode} checked={unitCfg.sellMode === mode} onChange={() => setMode(mode)} />{mode === 'count' ? 'Count' : mode === 'weight' ? 'Weight' : 'Volume'}</label>)}</div></fieldset>
                    <ControlField label="Selling unit" help="This is the quantity unit used at checkout."><select className={controlInput} value={unitCfg.sellUnit} onChange={event => setUnitCfg(cfg => ({ ...cfg, sellUnit: event.target.value }))}>{units.map(unit => <option key={unit.code} value={unit.code}>{unit.label} ({unit.shortLabel})</option>)}</select></ControlField>
                    <ControlField label="Receipt label" help="Optional display label; it does not change quantity conversion."><input maxLength={100} className={controlInput} value={unitCfg.label} placeholder={getSellUnit(unitCfg.sellUnit).label} onChange={event => setUnitCfg(cfg => ({ ...cfg, label: event.target.value }))} /></ControlField>
                </ControlSection>
                <ControlSection title="Contents and packaging" description="Use the supplier specification. Leave unchanged values as they are.">
                    <div className="grid grid-cols-2 gap-3"><ControlField label="Net quantity per item"><input type="number" min="0" step="any" className={controlInput} value={unitCfg.physicalQty} onChange={event => setUnitCfg(cfg => ({ ...cfg, physicalQty: event.target.value }))} /></ControlField><ControlField label="Measurement unit"><select className={controlInput} value={unitCfg.physicalUnit} onChange={event => setUnitCfg(cfg => ({ ...cfg, physicalUnit: event.target.value }))}><option value="">Select measure</option>{['g', 'kg', 'ml', 'L', 'pcs'].map(unit => <option key={unit}>{unit}</option>)}</select></ControlField></div>
                    <div className="grid grid-cols-2 gap-3"><ControlField label="Units per pack" help="Blank means one unit."><input type="number" min="1" step="1" className={controlInput} value={unitCfg.packOf} placeholder="1" onChange={event => setUnitCfg(cfg => ({ ...cfg, packOf: event.target.value }))} /></ControlField><ControlField label="Packs per case" help="Leave blank if cases are not defined."><input type="number" min="1" step="1" className={controlInput} value={unitCfg.caseOf} onChange={event => setUnitCfg(cfg => ({ ...cfg, caseOf: event.target.value }))} /></ControlField></div>
                </ControlSection>
            </div>
            <div className="space-y-4">
                <ControlSection title="Proposed checkout setup" description="Preview only. The recorded setup remains active until approval.">
                    <p className="text-lg font-semibold leading-snug">{buildPreview(unitCfg)}</p>
                    <dl className="grid grid-cols-2 gap-4"><ControlFact label="Quantity precision" value={getSellUnit(unitCfg.sellUnit).allowDecimal ? 'Decimal quantities' : 'Whole quantities'} /><ControlFact label="Quantity step" value={getSellUnit(unitCfg.sellUnit).step} /><ControlFact label="One pack" value={Number.isFinite(packaging.perPack) ? `${packaging.perPack} unit(s)` : 'Enter pack quantity'} /><ControlFact label="One case" value={packaging.unitsPerCase !== null && Number.isFinite(packaging.unitsPerCase) ? `${packaging.packsPerCase} packs · ${packaging.unitsPerCase} units` : 'Not defined'} /></dl>
                    {net && <dl className="grid grid-cols-2 gap-4 border-t border-[var(--theme-border)] pt-4"><ControlFact label="Equivalent per item" value={net.equivalent} /><ControlFact label="Net contents per pack" value={net.pack} /><ControlFact label="Net contents per case" value={net.case || 'Case not defined'} /></dl>}
                    <p className="text-xs leading-relaxed text-[var(--theme-text-secondary)]">Changing packaging does not receive, move, or adjust existing stock.</p>
                </ControlSection>
                <ControlSection title="Recorded specification"><dl className="grid grid-cols-2 gap-4"><ControlFact label="Current selling unit" value={getSellUnit(product.unit).label} /><ControlFact label="Brand" value={product.brand || 'Not recorded'} /><ControlFact label="Net contents" value={recordedContents} /><ControlFact label="Pack / case" value={`${saved.packOf || 1} units per pack · ${saved.caseOf || '—'} packs per case`} /></dl></ControlSection>
                <button type="button" disabled={isSaving || !changed} onClick={() => setUnitCfg(saved)} className="min-h-[44px] text-sm font-medium text-[var(--theme-text-secondary)] underline underline-offset-4 disabled:opacity-50">Reset to recorded setup</button>
            </div>
        </div>
        <ProposalAction pending={isSaving} disabled={submitted || !changed || Boolean(error)} error={error} label="Submit unit proposal" onClick={handleSaveUnit} />
    </div>;
};
