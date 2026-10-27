import {isLocationBarcode} from '../../utils/locationEncoder';
import {formatLocationIdentity} from '../../utils/locationIdentity';
import { ProductHandlingDetails } from './components/ProductHandlingDetails';
import { FloorAuditTimeline } from '../fulfillment/discrepancies/FloorAuditTimeline';
import React from 'react';
import {
    Package, Tag, Hash, Layers, Box, Info, ScanBarcode, Lock, Edit2, Check, X,
    TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, Calendar, Building2, User, Clock, Sparkles
} from 'lucide-react';
import { Product } from '../../types';
import Modal from '../Modal';
import { formatCompactNumber, formatPriceValue } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { getSellUnit, formatProductSize, getEffectivePackageSize, formatStockDisplay } from '../../utils/units';
import { getRoleHierarchy, canViewCostPrice } from '../../utils/roles';
import { useStore } from '../../contexts/CentralStore';
import { productsService, inventoryRequestsService } from '../../services/supabase.service';
import { systemLogsService } from '../../services/system-logs.service';
import { ProductAttributesPanel } from './components/ProductAttributesPanel';
import { ProductLocationBreakdown } from './components/ProductLocationBreakdown';
import { ProductProfileHeader } from './components/ProductProfileHeader';
import { parseBatchNumber } from '../../utils/batchNumber';
import { SmartUnitConfigModal } from './modals/SmartUnitConfigModal';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
    onEdit?: (product: Product) => void;
}

const DetailField = ({ label, value }: { label: string; value: React.ReactNode; icon?: React.ElementType; colorClass?: string; highlight?: boolean }) => (
    <div className="min-w-0 space-y-1.5 py-2">
        <dt className="text-sm text-[var(--theme-text-secondary)]">{label}</dt>
        <dd className="text-sm leading-relaxed text-[var(--theme-text-primary)] break-words">{value !== undefined && value !== null && value !== '' ? value : '—'}</dd>
    </div>
);

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose, currencySymbol, onEdit }) => {
    const { movements, employees, refreshData, deleteProduct, updateProduct, allProducts, sites, activeSite, effectiveCountry, settings } = useData();
    const { user, showToast } = useStore();
    const showCostPrice = canViewCostPrice(user?.role);
    const activeCurrency = currencySymbol || (activeSite as any)?.currency || (effectiveCountry === 'KE' || settings?.country === 'KE' ? 'KSh' : CURRENCY_SYMBOL);

    const [isEditingThresholds, setIsEditingThresholds] = React.useState(false);
    const [minVal, setMinVal] = React.useState<number | ''>('');
    const [maxVal, setMaxVal] = React.useState<number | ''>('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [isSmartUnitModalOpen, setIsSmartUnitModalOpen] = React.useState(false);

    const locationBreakdown = React.useMemo(() => {
        if (!product?.sku || !allProducts) return [];
        const matches = allProducts.filter(p => p.sku === product.sku || (product.productId && p.productId === product.productId));

        // Group by unique siteId to prevent duplicate site entries
        const siteMap = new Map<string, typeof matches[0]>();
        matches.forEach(p => {
            const sId = p.siteId || (p as any).site_id || 'unknown';
            const existing = siteMap.get(sId);
            if (!existing) {
                siteMap.set(sId, p);
            } else {
                const pIsGhost = (p.location === 'On Order' || !p.location) && (!p.stock || p.stock === 0);
                const existingIsGhost = (existing.location === 'On Order' || !existing.location) && (!existing.stock || existing.stock === 0);
                if (existingIsGhost && !pIsGhost) {
                    siteMap.set(sId, p);
                } else if (!pIsGhost && (p.stock || 0) > (existing.stock || 0)) {
                    siteMap.set(sId, p);
                }
            }
        });

        return Array.from(siteMap.values()).map(p => {
            const sId = p.siteId || (p as any).site_id;
            const siteObj = sites?.find(s => s.id === sId);
            return {
                id: p.id,
                siteName: siteObj?.name || 'Main Location',
                location: p.location || 'General Area',
                stock: p.stock || 0,
                price: p.price,
                minStock: p.minStock,
                isCurrentSite: p.id === product.id || sId === (product.siteId || (product as any).site_id),
            };
        });
    }, [product, allProducts, sites]);

    React.useEffect(() => {
        if (product) {
            setMinVal(product.minStock !== undefined && product.minStock !== null ? product.minStock : '');
            setMaxVal(product.maxStock !== undefined && product.maxStock !== null ? product.maxStock : '');
        }
    }, [product, isEditingThresholds]);

    if (!product) return null;

    const isCEO = user?.role === 'group_ceo';
    const isWarehouseManager = user?.role === 'warehouse_manager';
    const isStoreManager = user?.role === 'store_manager';
    const isSeniorOperations = ['country_managing_director', 'group_ceo', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '');
    const showDeleteButton = isCEO || isStoreManager || isWarehouseManager || isSeniorOperations;
    const isDeleteDisabled = (isStoreManager || isWarehouseManager || isSeniorOperations) && product.stock > 0;
    // Only CEO can directly edit. Everyone else submits for CEO approval.
    const canDirectEdit = isCEO;

    const handleDelete = async () => {
        if (!isCEO && !isStoreManager && !isSeniorOperations && !isWarehouseManager) return;
        if (isCEO) {
            const confirmation = window.prompt(
                `WARNING: You are about to permanently delete "${product.name}" (${product.sku}).\n` +
                `This action cannot be undone.\n\nType "DELETE" to confirm:`
            );
            if (confirmation !== 'DELETE') {
                showToast('Deletion cancelled.', 'info');
                return;
            }
        } else {
            if (product.stock > 0) {
                showToast('Managers can only delete products that are out of stock.', 'error');
                return;
            }
            if (!window.confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
        }

        try {
            await deleteProduct(product.id);
            showToast('Product successfully deleted', 'success');
            onClose();
            await refreshData(['products', 'movements']);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete product', 'error');
        }
    };

    // Any manager can see the Edit button, but only CEO applies changes immediately.
    // All other managers submit a pending request for CEO approval.
    const canEditThresholds = user?.role ? getRoleHierarchy(user.role) >= 70 : false;
    const customAttrs = product.customAttributes || (product as any).custom_attributes;
    const unitObj = product.unit ? getSellUnit(product.unit) : null;

    const brandAlreadyInName = product.brand && product.name.toLowerCase().startsWith(product.brand.toLowerCase());

    const systemDesc = [
        brandAlreadyInName ? '' : product.brand,
        product.name,
        customAttrs?.identity?.variant,
        (() => {
            const physicalWeight = customAttrs?.physical?.netWeight || product.size;
            const physicalType = customAttrs?.physical?.sizeType || customAttrs?.physical?.unit ||
                (product.unit && !['UNIT', 'PACK', 'DOZEN'].includes(product.unit.toUpperCase().trim()) ? product.unit : '');
            return physicalWeight ? `${physicalWeight}${physicalType}` : '';
        })(),
    ].filter(Boolean).join(' ');

    const allBarcodes = new Set<string>();
    if (product.barcode && !isLocationBarcode(product.barcode.trim())) allBarcodes.add(product.barcode.trim());
    if ((product as any).barcodes && Array.isArray((product as any).barcodes)) {
        (product as any).barcodes.forEach((b: string) => { if (b?.trim() && !isLocationBarcode(b.trim())) allBarcodes.add(b.trim()); });
    }
    const barcodeList = Array.from(allBarcodes);

    const recentReceives = movements
        ? movements
            .filter(m => (m.productId === product.id || m.productId === product.productId) && m.type === 'IN')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        : [];

    const price = product.price || 0;
    const cost = product.costPrice || 0;
    const grossProfit = price - cost;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    const markupPct = cost > 0 ? (grossProfit / cost) * 100 : 0;
    const compPrice = product.competitorPrice || 0;
    const compDiff = compPrice > 0 ? price - compPrice : 0;
    const salePrice = product.salePrice || 0;
    const discountAmt = price - salePrice;
    const discountPct = price > 0 ? (discountAmt / price) * 100 : 0;

    let expiryAlert = '';
    let expiryColor = '';
    if (product.expiryDate) {
        const daysDiff = Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        if (daysDiff < 0) { expiryAlert = `Expired ${Math.abs(daysDiff)}d ago`; expiryColor = 'text-red-500'; }
        else if (daysDiff < 30) { expiryAlert = `${daysDiff}d left`; expiryColor = 'text-amber-500'; }
    }

    const modalFooter = (
        <div className="flex items-center justify-between w-full">
            {showDeleteButton && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleteDisabled}
                    className={`px-4 py-2.5 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${isDeleteDisabled ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50 border-[var(--theme-border)]' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                >
                    Delete Product
                </button>
            )}
            <div className="flex items-center gap-2.5 ml-auto">
                <button onClick={onClose} className="px-4 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold text-xs rounded-xl transition-all cursor-pointer">Close</button>
                {onEdit && (
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(product);
                        }}
                        className="px-5 py-2.5 bg-[var(--theme-accent)] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                        <Edit2 size={13} />
                        <span>Edit Product</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product details" size="xl" footer={modalFooter}>
            <div className="flex flex-col gap-1 text-[var(--theme-text-primary)]">
                {/* Executive Hero Product Profile Header */}
                <ProductProfileHeader product={product} showCostPrice={showCostPrice} currencySymbol={activeCurrency} />

                {/* Multi-Site & Store Stock Locations */}
                <details className="border-b border-[var(--theme-border)] pb-2"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Stock locations</summary><ProductLocationBreakdown product={product} locationBreakdown={locationBreakdown} /></details>

                <details className="border-b border-[var(--theme-border)] pb-2 space-y-3"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Product specifications</summary>
                    <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-[var(--theme-text-secondary)]" />
                            <h3 className="text-sm font-medium text-[var(--theme-text-primary)]">Product Specifications</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSmartUnitModalOpen(true)}
                            className="px-2.5 py-1 text-[11px] font-bold uppercase bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-lg border border-[var(--theme-border)] flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Sparkles size={13} className="text-amber-500" />
                            <span>Smart Unit Spec</span>
                        </button>
                    </div>

                    {(() => {
                        const smartProfile = resolveSmartProductAttributes(product, allProducts, activeCurrency);
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                <DetailField label="SKU" value={product.sku} icon={Hash} />
                                <DetailField label="Product barcode" value={barcodeList.length > 0 ? <span className="font-mono">{barcodeList.join(', ')}</span> : null} icon={ScanBarcode} />
                                <DetailField label="Brand" value={smartProfile.brand} icon={Building2} highlight={Boolean(smartProfile.brand)} />
                                <DetailField label="Department / Subcat" value={smartProfile.subcategory ? `${product.category} › ${smartProfile.subcategory}` : product.category} icon={Tag} />
                                <DetailField label="Net Content / Size" value={smartProfile.netContent || formatProductSize(product)} icon={Box} highlight={Boolean(smartProfile.netContent)} />
                                <DetailField label="Physical Form" value={smartProfile.physicalForm} icon={Layers} />
                                <DetailField label="Sell Unit" value={unitObj ? `${unitObj.label} (${unitObj.shortLabel})` : product.unit} icon={Package} />
                                <DetailField label="Wholesale Pack" value={smartProfile.packBadge} icon={Package} highlight />
                                <DetailField label="Variant" value={smartProfile.variant} icon={Tag} />
                                <DetailField label="Stock Breakdown" value={smartProfile.stockBreakdown} icon={Box} highlight={Boolean(smartProfile.stockBreakdown)} />
                                <DetailField
                                    label="Batch / Lot No"
                                    value={product.batchNumber ? (
                                        <span className="flex flex-col">
                                            <span className="font-mono">{product.batchNumber}</span>
                                            {(() => {
                                                const parsed = parseBatchNumber(product.batchNumber);
                                                if (parsed.isStandard && parsed.formattedDate) {
                                                    return <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold">Rcvd {parsed.formattedDate}</span>;
                                                }
                                                return null;
                                            })()}
                                        </span>
                                    ) : null}
                                    icon={Layers}
                                />
                                <DetailField label="Expiry Date" value={product.expiryDate ? `${new Date(product.expiryDate).toLocaleDateString()}${expiryAlert ? ` (${expiryAlert})` : ''}` : null} icon={Calendar} colorClass={expiryColor || undefined} />
                                <DetailField label="Shelf Position" value={product.shelfPosition} icon={Layers} />
                                <DetailField label="Storage Location" value={formatLocationIdentity(product.location)} icon={Building2} />
                                <DetailField label="Date Registered" value={product.createdAt || (product as any).created_at ? new Date(product.createdAt || (product as any).created_at).toLocaleDateString() : null} icon={Clock} />
                                {(product as any).salesVelocity && <DetailField label="Sales Velocity" value={(product as any).salesVelocity} icon={TrendingUp} />}
                            </div>
                        );
                    })()}
                </details>
                <ProductHandlingDetails product={product} currencySymbol={activeCurrency}/>
                <details className="border-b border-[var(--theme-border)] pb-2 space-y-3"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Pricing details</summary>
                    <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2.5">
                        <DollarSign size={14} className="text-[var(--theme-text-secondary)]" />
                        <h3 className="text-sm font-medium text-[var(--theme-text-primary)]">Financial & Pricing Details</h3>
                    </div>
                    {(() => {
                        const smartProfile = resolveSmartProductAttributes(product, allProducts, activeCurrency);
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                <DetailField label="Stock value at selling price" value={price > 0 ? `${activeCurrency} ${formatPriceValue((product.stock || 0) * price)}` : 'Selling price not set'} />
                                <DetailField label="Stock value calculation" value={`${product.stock || 0} × ${activeCurrency} ${formatPriceValue(price)}`} />
                                <DetailField label="Retail Price" value={`${activeCurrency} ${formatPriceValue(product.price)}`} icon={DollarSign} />
                                <DetailField label="Unit Price Equiv." value={smartProfile.unitPriceLabel} icon={Tag} highlight={Boolean(smartProfile.unitPriceLabel)} />
                                <DetailField label="Promo Price" value={salePrice > 0 ? `${activeCurrency} ${formatPriceValue(salePrice)}` : null} icon={Tag} highlight />
                                <DetailField label="Discount" value={salePrice > 0 && discountPct > 0 ? `${discountPct.toFixed(1)}%` : null} icon={Percent} highlight />
                                {compPrice > 0 && <DetailField label="Competitor Price" value={`${activeCurrency} ${formatPriceValue(compPrice)}`} icon={compDiff > 0 ? TrendingDown : TrendingUp} colorClass={compDiff > 0 ? 'text-red-500' : 'text-emerald-500'} />}
                                {showCostPrice && (
                                    <>
                                        <DetailField label="Stock value at cost" value={cost > 0 ? `${activeCurrency} ${formatPriceValue((product.stock || 0) * cost)}` : null} />
                                        <DetailField label="Cost Price (COGS)" value={cost > 0 ? `${activeCurrency} ${formatPriceValue(cost)}` : null} icon={Lock} colorClass="text-[var(--theme-text-muted)]" />
                                        <DetailField label="Gross Profit" value={price > 0 && cost > 0 ? `${activeCurrency} ${grossProfit.toFixed(2)}` : null} icon={TrendingUp} />
                                        <DetailField label="Gross Margin" value={price > 0 && cost > 0 ? `${marginPct.toFixed(1)}%` : null} icon={Percent} />
                                        <DetailField label="Markup Rate" value={price > 0 && cost > 0 ? `${markupPct.toFixed(1)}%` : null} icon={Percent} />
                                    </>
                                )}
                            </div>
                        );
                    })()}
                </details>

                <details className="border-b border-[var(--theme-border)] pb-2"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Stock policies and activity</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)] space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-[var(--theme-text-secondary)]" />
                                <h3 className="text-sm font-medium text-[var(--theme-text-primary)]">Stock Policies</h3>
                            </div>
                            {canEditThresholds && !isEditingThresholds && (
                                <button onClick={() => setIsEditingThresholds(true)} className="px-2.5 py-1 text-[11px] font-bold uppercase bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-lg border border-[var(--theme-border)] transition-colors cursor-pointer">
                                    Edit
                                </button>
                            )}
                        </div>
                        {!isEditingThresholds ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-center">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block">Min Stock</span>
                                    <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 block mt-1">{product.minStock !== undefined && product.minStock !== null ? `${product.minStock} units` : '—'}</span>
                                </div>
                                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-center">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block">Max Stock</span>
                                    <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{product.maxStock !== undefined && product.maxStock !== null ? `${product.maxStock} units` : '—'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="min-stock-input" className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block mb-1">Min Stock</label>
                                        <input id="min-stock-input" type="number" min="0" value={minVal} onChange={(e) => setMinVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 10" className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono focus:border-[var(--theme-accent)] focus:outline-none" />
                                    </div>
                                    <div>
                                        <label htmlFor="max-stock-input" className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block mb-1">Max Stock</label>
                                        <input id="max-stock-input" type="number" min="0" value={maxVal} onChange={(e) => setMaxVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 100" className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono focus:border-[var(--theme-accent)] focus:outline-none" />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                    <button onClick={() => setIsEditingThresholds(false)} className="px-3 py-1.5 text-sm font-normal uppercase bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] rounded-xl border border-[var(--theme-border)] transition-colors cursor-pointer">Cancel</button>
                                    <button onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            if (canDirectEdit) {
                                                // CEO: apply immediately via updateProduct (syncs posDB & audit logs)
                                                await updateProduct({
                                                    id: product.id,
                                                    minStock: minVal === '' ? undefined : minVal,
                                                    maxStock: maxVal === '' ? undefined : maxVal
                                                });
                                                showToast('Stock thresholds updated', 'success');
                                            } else {
                                                // Non-CEO managers: submit for CEO approval
                                                const country = effectiveCountry || (activeSite as any)?.country || 'ET';
                                                await inventoryRequestsService.create({
                                                    productId: product.id,
                                                    productName: product.name,
                                                    productSku: product.sku,
                                                    siteId: product.siteId || (product as any).site_id || '',
                                                    countryCode: country,
                                                    changeType: 'edit',
                                                    requestedBy: user?.name || 'Unknown',
                                                    requestedAt: new Date().toISOString(),
                                                    status: 'pending',
                                                    proposedChanges: { ...product, minStock: minVal === '' ? product.minStock : minVal, maxStock: maxVal === '' ? product.maxStock : maxVal },
                                                    adjustmentReason: `Stock thresholds: Min ${minVal}, Max ${maxVal}`,
                                                });

                                                try {
                                                    await systemLogsService.create({
                                                        action: 'PRODUCT_THRESHOLD_CHANGE_REQUESTED',
                                                        details: {
                                                            productId: product.id,
                                                            sku: product.sku,
                                                            name: product.name,
                                                            minStock: minVal,
                                                            maxStock: maxVal,
                                                            siteId: product.siteId || (product as any).site_id,
                                                        },
                                                        module: 'Inventory',
                                                        user_name: user?.name || 'Unknown',
                                                        employee_id: user?.id,
                                                        site_id: product.siteId || (product as any).site_id,
                                                        country_code: country,
                                                        entity_type: 'inventory_request',
                                                        entity_id: product.id,
                                                    });
                                                } catch (logErr) {
                                                    // Silent fallback for audit trail
                                                }

                                                showToast('Threshold change submitted for CEO approval', 'info');
                                            }
                                            setIsEditingThresholds(false);
                                            await refreshData(['products', 'movements']);
                                        } catch (err: any) {
                                            showToast(err?.message || 'Failed to save thresholds', 'error');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }} disabled={isSaving} className="px-3.5 py-1.5 text-[11px] font-bold uppercase bg-[var(--theme-accent)] text-white rounded-xl disabled:opacity-50 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-xs">
                                        {isSaving ? 'Saving…' : canDirectEdit ? 'Save' : 'Submit for Approval'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)] space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2.5">
                            <TrendingUp size={14} className="text-[var(--theme-text-secondary)]" />
                            <h3 className="text-sm font-medium text-[var(--theme-text-primary)]">Restock Log & Audits</h3>
                        </div>
                        {recentReceives.length > 0 ? (
                            <div className="space-y-3 pl-2 border-l border-[var(--theme-border)] ml-2 max-h-[140px] overflow-y-auto">
                                {recentReceives.map(m => (
                                    <div key={m.id} className="relative flex flex-col gap-0.5">
                                        <div className="absolute -left-[14px] top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-[var(--theme-bg-card)]" />
                                        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-[var(--theme-text-primary)] uppercase">{employees?.find(e => e.id === m.performedBy)?.name || m.performedBy || 'System'}</span><span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">+{m.quantity}</span></div>
                                        <span className="text-[11px] text-[var(--theme-text-muted)] font-mono">{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs font-medium text-[var(--theme-text-muted)] text-center py-2">No recent restocks</p>}
                        <div className="pt-3 border-t border-[var(--theme-border)] text-[11px] space-y-1.5">
                            <div className="flex justify-between"><span className="text-[var(--theme-text-muted)] font-medium uppercase">Created:</span><span className="font-semibold text-[var(--theme-text-primary)]">{product.createdBy || 'System'}</span></div>
                        </div>
                    </div>
                </div>

                </details>
                <details className="border-b border-[var(--theme-border)] pb-4 text-sm leading-relaxed"><summary className="min-h-[44px] cursor-pointer py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Description</summary>

                    <span className="text-[var(--theme-text-primary)] font-bold">{systemDesc || '—'}</span>
                    {customAttrs?.descriptive?.keyFeatures && <p className="mt-2 text-[var(--theme-text-secondary)]">{customAttrs.descriptive.keyFeatures}</p>}
                </details>
            </div>
            {product && (
                <SmartUnitConfigModal
                    product={product}
                    isOpen={isSmartUnitModalOpen}
                    onClose={() => setIsSmartUnitModalOpen(false)}
                />
            )}
            <FloorAuditTimeline scope={{kind:'product',id:product.id,siteId:product.siteId||product.site_id||'',country:effectiveCountry||''}}/>
        </Modal>
    );
};
