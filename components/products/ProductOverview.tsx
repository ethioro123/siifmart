import { ProductMasterReference } from './ProductMasterReference';
import React from 'react';
import type { Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { canViewCostPrice } from '../../utils/roles';
import { productLocationRows } from '../../utils/productDetailLogic';
import { productSiteName, sellingMargin } from '../../utils/priceManager';
import { effectivePrice } from '../../utils/pricingGovernance';
import { getSellUnit } from '../../utils/units';
import { productOrderUnits } from '../../utils/productControlLogic';
import { ControlSection, ControlFact } from '../merchandising/product-control/ControlPrimitives';
import { ProductProfileHeader } from '../inventory/components/ProductProfileHeader';
import { ProductLocationBreakdown } from '../inventory/components/ProductLocationBreakdown';
import { ProductHandlingDetails } from '../inventory/components/ProductHandlingDetails';
import { RecordedAttributes } from '../merchandising/product-control/RecordedAttributes';
import { isLocationBarcode } from '../../utils/locationEncoder';

export function ProductOverview({ product, currency }: { product: Product; currency: string }) {
    const { allProducts, sites, effectiveCountry, movements } = useData();
    const { user } = useStore();
    const showCost = canViewCostPrice(user?.role);
    const margin = sellingMargin(product);
    const price = effectivePrice(product);
    const locations = productLocationRows(product, allProducts || [], sites || [], effectiveCountry);
    const barcodes = [...new Set([product.barcode, ...(product.barcodes || [])].filter((value): value is string => Boolean(value?.trim()) && !isLocationBarcode(value!.trim())))];
    const receives = (movements || []).filter(row => row.siteId === (product.siteId || product.site_id) && (row.productId === product.id || row.productId === product.productId) && row.type === 'IN').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    return <div className="space-y-5">
        <ProductProfileHeader product={product} currencySymbol={currency} showCostPrice={showCost} />
        <div className="grid gap-4 lg:grid-cols-2">
            <ControlSection title="Catalog identity" description="Identity describes the product. Stock, price, lot and limits belong to the selected location."><dl className="grid grid-cols-2 gap-4"><ControlFact label="SKU" value={product.sku} /><ControlFact label="Brand" value={product.brand || 'Not recorded'} /><ControlFact label="Category" value={product.category || 'Not recorded'} /><ControlFact label="Selling unit" value={getSellUnit(product.unit).label} /><ControlFact label="Size / net contents" value={product.size || 'Not recorded'} /><ControlFact label="Sellable quantities per order unit" value={productOrderUnits(product)} /><div className="col-span-2"><ControlFact label="Product barcodes" value={barcodes.length ? barcodes.join(' · ') : 'Not recorded'} /></div></dl>{product.description && <p className="border-t border-[var(--theme-border)] pt-3 text-sm leading-relaxed">{product.description}</p>}</ControlSection>
            <ControlSection title="Location and commercial status" description={productSiteName(product, sites)}><dl className="grid grid-cols-2 gap-4"><ControlFact label="Catalog approval" value={product.approvalStatus || product.approval_status || 'Not confirmed'} /><ControlFact label="Stock status" value={product.status?.replace(/_/g, ' ') || 'Not recorded'} /><ControlFact label="Batch / lot" value={product.batchNumber || 'Not recorded'} /><ControlFact label="Expiry" value={product.expiryDate || 'Not recorded'} /><ControlFact label="Regular / sale price" value={`${currency} ${product.price} / ${product.isOnSale ? product.salePrice ?? 'Not set' : 'Sale inactive'}`} /><ControlFact label="Min / max stock" value={`${product.minStock ?? 'Not set'} / ${product.maxStock ?? 'Not set'}`} />{showCost && <><ControlFact label="Recorded cost per selling unit" value={product.costPrice && product.costPrice > 0 ? `${currency} ${product.costPrice}` : 'Unavailable'} /><ControlFact label="Margin at selling price" value={margin === null ? 'Unavailable' : `${margin.toFixed(1)}%`} /><ControlFact label="Profit per selling unit" value={price && product.costPrice && product.costPrice > 0 ? `${currency} ${(price - product.costPrice).toFixed(2)}` : 'Unavailable'} /></>}<ControlFact label="Previous effective price" value={product.oldPrice != null ? `${currency} ${product.oldPrice}` : 'Not recorded'} /><ControlFact label="Last price update" value={product.priceUpdatedAt ? new Date(product.priceUpdatedAt).toLocaleString() : 'Not recorded'} /></dl></ControlSection>
        </div>
        <details className="rounded-xl border border-[var(--theme-border)] p-4"><summary className="min-h-[44px] cursor-pointer text-sm font-medium">Stock locations and lots loaded in this session</summary><ProductLocationBreakdown product={product} locationBreakdown={locations} /></details>
        <ProductMasterReference product={product} country={effectiveCountry || ''} />
        <ProductHandlingDetails product={product} currencySymbol={currency} />
        <RecordedAttributes product={product} />
        <details className="rounded-xl border border-[var(--theme-border)] p-4"><summary className="min-h-[44px] cursor-pointer text-sm font-medium">Recent receipts loaded in this session</summary>{receives.length === 0 ? <p className="text-sm text-[var(--theme-text-secondary)]">No receipts loaded for this product and location.</p> : <ul className="space-y-3">{receives.map(row => <li key={row.id} className="text-sm">{new Date(row.date).toLocaleString()} · {row.quantity} {getSellUnit(product.unit).shortLabel} · {row.reason || 'Receipt recorded'}</li>)}</ul>}</details>
    </div>;
}
