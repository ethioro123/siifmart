import React from 'react';
import type { Product } from '../../../types';
import type { ProfileConfig } from '../../../types/product-control';
import { getSellUnit } from '../../../utils/units';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { sellingMargin } from '../../../utils/priceManager';
import { profileProposal } from '../../../utils/productControlLogic';
import { formatLocationIdentity } from '../../../utils/locationIdentity';
import { ControlSection, ControlFact, ControlField, ProposalAction, controlInput } from './ControlPrimitives';
import { RecordedAttributes } from './RecordedAttributes';
interface Props {
    product: Product; currencySymbol?: string; siteName: string; showCost: boolean;
    profileCfg: ProfileConfig; setProfileCfg: React.Dispatch<React.SetStateAction<ProfileConfig>>;
    handleSaveProfile: () => Promise<void>; isSaving: boolean; submitted?: boolean;
}
export const ProfileTab: React.FC<Props> = ({ product, currencySymbol = 'ETB', siteName, showCost, profileCfg, setProfileCfg, handleSaveProfile, isSaving, submitted }) => {
    const barcodes = [...new Set([product.barcode, ...(product.barcodes || [])].filter(Boolean))];
    const margin = sellingMargin(product);
    let error = ''; let changed = false;
    try { changed = Object.keys(profileProposal(product, profileCfg)).length > 0; } catch (cause) { error = (cause as Error).message; }
    return <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <ControlSection title="Product identity" description="Propose a clear product name, brand and description. The current catalog stays active during review.">
                <ControlField label="Product name"><input className={controlInput} value={profileCfg.name} maxLength={200} onChange={event => setProfileCfg(cfg => ({ ...cfg, name: event.target.value }))} /></ControlField>
                <ControlField label="Brand / manufacturer"><input className={controlInput} value={profileCfg.brand} maxLength={200} placeholder="Not recorded" onChange={event => setProfileCfg(cfg => ({ ...cfg, brand: event.target.value }))} /></ControlField>
                <ControlField label="Product description"><textarea className={`${controlInput} min-h-[108px] resize-y`} value={profileCfg.description} maxLength={4000} placeholder="What staff and customers should know about this product" onChange={event => setProfileCfg(cfg => ({ ...cfg, description: event.target.value }))} /></ControlField>
            </ControlSection>
            <ControlSection title="Recorded at this location"><dl className="grid grid-cols-2 gap-4"><ControlFact label="Facility" value={siteName} /><ControlFact label="Stock location" value={formatLocationIdentity(product.location)} /><ControlFact label="On-hand stock" value={`${product.stock.toLocaleString()} ${getSellUnit(product.unit).shortLabel}`} /><ControlFact label="Selling price" value={`${currencySymbol} ${effectivePrice(product) ?? 'Not set'}`} /><ControlFact label="Catalog approval" value={product.approvalStatus || product.approval_status || 'Not confirmed'} /><ControlFact label="Stock status" value={product.status?.replace(/_/g, ' ') || 'Not available'} /><ControlFact label="Batch / lot" value={product.batchNumber || 'Not recorded'} /><ControlFact label="Expiry date" value={product.expiryDate || 'Not recorded'} />{showCost && <><ControlFact label="Recorded cost" value={product.costPrice && product.costPrice > 0 ? `${currencySymbol} ${product.costPrice}` : 'Unavailable'} /><ControlFact label="Margin at selling price" value={margin === null ? 'Unavailable' : `${margin.toFixed(1)}%`} /></>}</dl></ControlSection>
        </div>
        <ControlSection title="Catalog reference" description="Product barcodes identify the item. Bay identity is shown separately under stock location."><dl className="grid gap-4 sm:grid-cols-3"><ControlFact label="SKU" value={product.sku} /><ControlFact label="Category" value={product.category || 'Not recorded'} /><ControlFact label="Selling unit / size" value={`${getSellUnit(product.unit).label} · ${product.size || 'Size not recorded'}`} /><div className="sm:col-span-3"><ControlFact label="Product barcodes" value={barcodes.length ? barcodes.join(' · ') : 'Not recorded'} /></div>{product.priceUpdatedAt && <ControlFact label="Last price update" value={new Date(product.priceUpdatedAt).toLocaleString()} />}</dl></ControlSection>
        <RecordedAttributes product={product} />
        <ProposalAction pending={isSaving} disabled={submitted || !changed || Boolean(error)} error={error} label="Submit profile proposal" onClick={handleSaveProfile} />
    </div>;
};
