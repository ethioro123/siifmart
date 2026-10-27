import React from 'react';
import type { Product } from '../../../types';
import type { StockConfig } from '../../../types/product-control';
import { getSellUnit } from '../../../utils/units';
import { stockPolicyPreview } from '../../../utils/productControlLogic';
import { ControlSection, ControlField, ControlFact, ProposalAction, controlInput } from './ControlPrimitives';
export type { StockConfig } from '../../../types/product-control';
interface Props { product: Product; stockCfg: StockConfig; setStockCfg: React.Dispatch<React.SetStateAction<StockConfig>>; handleSaveStock: () => Promise<void>; isSaving: boolean; submitted?: boolean; sellUnit: string }
export const StockTab: React.FC<Props> = ({ product, stockCfg, setStockCfg, handleSaveStock, isSaving, submitted }) => {
    const unit = getSellUnit(product.unit).shortLabel;
    let preview: ReturnType<typeof stockPolicyPreview> | null = null; let error = '';
    try { preview = stockPolicyPreview(product, stockCfg); } catch (cause) { error = (cause as Error).message; }
    const changed = Boolean(preview && (preview.min !== (product.minStock ?? undefined) || preview.max !== (product.maxStock ?? undefined)));
    return <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
            <ControlSection title="Replenishment limits" description="Propose the minimum on-hand threshold and maximum target for this location.">
                <ControlField label={`Minimum stock (${unit})`} help={`Recorded: ${product.minStock ?? 'Not set'}. Blank leaves the recorded minimum unchanged.`}><input type="number" min="0" step="1" value={stockCfg.minStock} className={controlInput} onChange={event => setStockCfg(cfg => ({ ...cfg, minStock: event.target.value }))} placeholder="Leave unchanged" /></ControlField>
                <ControlField label={`Maximum stock (${unit})`} help={`Recorded: ${product.maxStock ?? 'Not set'}. Must be at least the minimum; zero is a valid limit.`}><input type="number" min="0" step="1" value={stockCfg.maxStock} className={controlInput} onChange={event => setStockCfg(cfg => ({ ...cfg, maxStock: event.target.value }))} placeholder="Leave unchanged" /></ControlField>
                <p className="text-xs leading-relaxed text-[var(--theme-text-secondary)]">These limits do not change the stock count or create a replenishment order.</p>
            </ControlSection>
            <ControlSection title="Policy impact" description="Current on-hand stock evaluated against your proposed limits.">
                <p className="text-3xl font-semibold tabular-nums">{product.stock.toLocaleString()} <span className="text-base font-normal text-[var(--theme-text-secondary)]">{unit} on hand</span></p>
                {preview && <><p className="text-base font-medium">{preview.state}</p>{preview.fill !== null && <progress aria-label="On-hand stock relative to proposed maximum" max={100} value={preview.fill} className="h-2 w-full accent-[var(--theme-accent)]" />}<dl className="grid grid-cols-2 gap-4"><ControlFact label="Proposed minimum" value={preview.min ?? 'Not set'} /><ControlFact label="Proposed maximum" value={preview.max ?? 'Not set'} /><ControlFact label="Gap to maximum" value={preview.gap === null ? 'Maximum not set' : `${preview.gap.toLocaleString()} ${unit}`} /><ControlFact label="Recorded policy" value={stockPolicyPreview(product, { minStock: '', maxStock: '' }).state} /></dl><p className="text-xs leading-relaxed text-[var(--theme-text-secondary)]">The gap is a calculation from on-hand stock. Open orders, reserved stock and lead times are not included.</p></>}
            </ControlSection>
        </div>
        <ProposalAction pending={isSaving} disabled={submitted || !changed || Boolean(error)} error={error} label="Submit stock policy proposal" onClick={handleSaveStock} />
    </div>;
};
