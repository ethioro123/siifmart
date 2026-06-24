import React from 'react';
import { Package, Tag, Hash, Layers, Box, Info, ScanBarcode, Thermometer, ShieldAlert, Droplets, Weight, Ruler, Lock, Edit2, Check, X } from 'lucide-react';
import { Product, StockMovement, Employee } from '../../types';
import Modal from '../Modal';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { getSellUnit, formatProductSize } from '../../utils/units';
import { useStore } from '../../contexts/CentralStore';
import { productsService } from '../../services/products.service';

// ── Compact Attribute Badge ──
const AttrBadge = ({ label, value, color }: { label: string; value?: string | number | boolean | null; color?: string }) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean' && !value) return null;

    const displayValue = typeof value === 'boolean' ? label : value;
    const displayLabel = typeof value === 'boolean' ? '' : label;

    const colorMap: Record<string, string> = {
        red: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
        pink: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400',
    };
    const colorClasses = color && colorMap[color] ? colorMap[color] : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300';

    return (
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded px-2 py-1 min-w-0`}>
            {displayLabel && <span className="text-[9px] opacity-70 uppercase tracking-tighter font-bold">{displayLabel}</span>}
            <span className="text-[10px] font-black leading-none truncate">{displayValue}</span>
        </div>
    );
};

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
    const { movements, employees, refreshData, deleteProduct } = useData();
    const { user, showToast } = useStore();

    const [isEditingThresholds, setIsEditingThresholds] = React.useState(false);
    const [minVal, setMinVal] = React.useState<number | ''>('');
    const [maxVal, setMaxVal] = React.useState<number | ''>('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (product) {
            setMinVal(product.minStock !== undefined && product.minStock !== null ? product.minStock : '');
            setMaxVal(product.maxStock !== undefined && product.maxStock !== null ? product.maxStock : '');
        }
    }, [product, isEditingThresholds]);

    if (!product) return null;

    const isCEO = user?.role === 'super_admin';
    const isStoreManager = user?.role === 'store_manager';
    const showDeleteButton = isCEO || isStoreManager;
    const isDeleteDisabled = isStoreManager && product.stock > 0;

    const handleDelete = async () => {
        if (!isCEO && !isStoreManager) return;

        if (isCEO) {
            const confirmation = window.prompt(
                `WARNING: You are about to permanently delete "${product.name}" (${product.sku}).\n` +
                `This action cannot be undone and will update related transaction records.\n\n` +
                `To confirm deletion, please type "DELETE" below:`
            );
            if (confirmation !== 'DELETE') {
                showToast('Deletion cancelled. Confirmation text did not match.', 'info');
                return;
            }
        } else if (isStoreManager) {
            if (product.stock > 0) {
                showToast('Store Managers can only delete products that are out of stock.', 'error');
                return;
            }
            const confirm = window.confirm(
                `Are you sure you want to permanently delete "${product.name}"?\n` +
                `All related records will be updated.`
            );
            if (!confirm) return;
        }

        try {
            await deleteProduct(product.id);
            showToast('Product successfully deleted', 'success');
            onClose();
            await refreshData();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete product', 'error');
        }
    };

    const canEditThresholds = user?.role === 'super_admin' || user?.role === 'store_manager';

    const customAttrs = product.customAttributes || (product as any).custom_attributes;
    const unitObj = product.unit ? getSellUnit(product.unit) : null;
    const physicalUnitLabel = customAttrs?.physical?.sizeType || customAttrs?.physical?.unit ||
        (unitObj && unitObj.category !== 'count' ? unitObj.shortLabel : '') || '';

    // Smart Quantity Calculation
    const isWeightOrVolume = product.unit && ['KG', 'L', 'G', 'ML'].includes(product.unit.toUpperCase());
    const sizeNum = product.size ? parseFloat(product.size.replace(/[^0-9.]/g, '')) : 1;
    const physicalQty = isWeightOrVolume && !isNaN(sizeNum) ? product.stock * sizeNum : null;

    // Check if the brand is already part of the product name to avoid duplication
    const brandAlreadyInName = product.brand && product.name.toLowerCase().startsWith(product.brand.toLowerCase());

    // Compute system description (mirrors procurement ItemPreviewCard)
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
    ].filter(Boolean).join(' ') + (
        (customAttrs?.packaging?.packQty && parseInt(customAttrs.packaging.packQty) > 1)
            ? ` – Pack of ${customAttrs.packaging.packQty}`
            : ''
    ) + (
        customAttrs?.packaging?.packageType
            ? ` (${customAttrs.packaging.packageType})`
            : ''
    );

    // Collect all barcodes
    const allBarcodes = new Set<string>();
    if (product.barcode) allBarcodes.add(product.barcode.trim());
    if ((product as any).barcodes && Array.isArray((product as any).barcodes)) {
        (product as any).barcodes.forEach((b: string) => { if (b?.trim()) allBarcodes.add(b.trim()); });
    }
    const barcodeList = Array.from(allBarcodes);

    // Check if any attributes exist
    const hasPhysical = customAttrs?.physical && Object.values(customAttrs.physical).some((v: any) => v !== '' && v !== null && v !== undefined);
    const hasPackaging = customAttrs?.packaging && Object.values(customAttrs.packaging).some((v: any) => v !== '' && v !== null && v !== undefined && v !== false);
    const hasStorage = customAttrs?.storage && Object.values(customAttrs.storage).some((v: any) => v !== '' && v !== null && v !== undefined && v !== false);
    const hasCommercial = customAttrs?.commercial && Object.values(customAttrs.commercial).some((v: any) => v !== '' && v !== null && v !== undefined && v !== false);
    const hasDescriptive = customAttrs?.descriptive && Object.values(customAttrs.descriptive).some((v: any) => v !== '' && v !== null && v !== undefined);
    const hasAnyAttributes = hasPhysical || hasPackaging || hasStorage || hasCommercial || hasDescriptive;
    const recentReceives = movements
        ? movements
            .filter(m => (m.productId === product.id || m.productId === product.productId) && m.type === 'IN')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        : [];

    const modalFooter = (
        <div className="flex items-center justify-between w-full">
            <div>
                {showDeleteButton && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleteDisabled}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                            isDeleteDisabled
                                ? 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/5 text-stone-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                : 'bg-red-500/10 hover:bg-red-500/25 border-red-500/20 text-red-600 dark:text-red-400 hover:scale-105 active:scale-95'
                        }`}
                        title={isDeleteDisabled ? 'Store Managers can only delete products when they are out of stock' : 'Permanently delete this product'}
                    >
                        Delete Product
                    </button>
                )}
            </div>
            <button
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 font-bold text-xs rounded-xl border border-stone-200 dark:border-white/10 transition-colors uppercase tracking-wider"
            >
                Close
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Details" size="xl" footer={modalFooter}>
            <div className="space-y-5">

                {/* ── Product Header ── */}
                <div className="p-5 bg-[#faf8f5]/65 dark:bg-[#18201B]/40 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md shadow-sm">
                    <div className="flex gap-5 items-start">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                            {product.image && !product.image.includes('placeholder.com') ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={28} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-black text-[#1E3F27] dark:text-white uppercase tracking-tight leading-tight">
                                {product.brand && !brandAlreadyInName && <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">{product.brand} </span>}
                                {product.name}
                            </h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 font-mono font-bold uppercase">
                                {customAttrs?.identity?.variant ? `${customAttrs.identity.variant} • ` : ''}
                                {formatProductSize(product) || 'Size'} • {product.category || 'Category'}
                                {customAttrs?.identity?.subcategory ? ` • ${customAttrs.identity.subcategory}` : ''}
                            </p>

                            {/* Tag Badges */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#2C5E3B]/10 text-[#2C5E3B] border border-[#2C5E3B]/30 dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2] dark:border-[#A9CBA2]/30 rounded text-[10px] font-black font-mono tracking-widest">
                                    <Hash size={10} /> {product.sku}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:bg-[#F3EAD3]/10 dark:text-[#F3EAD3] dark:border-[#F3EAD3]/25 rounded text-[10px] font-bold uppercase tracking-widest">
                                    <Tag size={10} /> {product.category}
                                </span>
                                {product.size && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 dark:bg-white/5 dark:text-stone-300 dark:border-white/10 rounded text-[10px] font-bold uppercase tracking-widest">
                                        {formatProductSize(product)}
                                    </span>
                                )}
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${product.status === 'active' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                                    product.status === 'low_stock' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                        'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                    }`}>
                                    {product.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Price/Stock Quick View */}
                        <div className="text-right flex-shrink-0">
                            <p className="text-lg font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                                {CURRENCY_SYMBOL}{product.price.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Retail Price</p>
                            <p className={`text-lg font-black font-mono mt-2 ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {product.stock}
                            </p>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                {unitObj?.code !== 'UNIT' ? unitObj?.shortLabel : 'Units'} in Stock
                            </p>
                            {(product.minStock || product.maxStock) && (
                                <div className="mt-2 flex items-center gap-2 justify-end">
                                    {product.minStock !== undefined && product.minStock > 0 && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-amber-500/10 text-amber-600 border-amber-500/20">
                                            Min {product.minStock}
                                        </span>
                                    )}
                                    {product.maxStock !== undefined && product.maxStock > 0 && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-green-500/10 text-green-600 border-green-500/20">
                                            Max {product.maxStock}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Physical Quantity Breakdown (for weight/volume items) */}
                    {physicalQty !== null && (
                        <div className="mt-3 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-100 dark:bg-white/5 inline-block px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                                {sizeNum} {physicalUnitLabel || unitObj?.shortLabel || product.unit} × {product.stock} Units = {physicalQty} {physicalUnitLabel || unitObj?.shortLabel || product.unit}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── System Description ── */}
                <div className="glass-panel-pushed px-4 py-3 shadow-inner">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Info size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-black tracking-widest leading-none">System Description</span>
                    </div>
                    <p className="text-[11px] text-gray-900 dark:text-gray-300 font-mono leading-relaxed font-bold">
                        {systemDesc}
                    </p>
                    {customAttrs?.descriptive?.keyFeatures && (
                        <p className="text-[10px] text-gray-500 mt-1.5 italic border-t border-white/5 pt-1.5">
                            Features: {customAttrs.descriptive.keyFeatures}
                        </p>
                    )}
                </div>

                {/* ── Stock Policies & Thresholds ── */}
                <div className="p-5 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Stock Policies & Limits</h3>
                        </div>
                        {canEditThresholds ? (
                            !isEditingThresholds ? (
                                <button
                                    onClick={() => setIsEditingThresholds(true)}
                                    className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-lg transition-colors flex items-center gap-1 border border-[#2C5E3B]/25"
                                >
                                    <Edit2 size={10} /> Edit Limits
                                </button>
                            ) : null
                        ) : (
                            <span className="text-[9px] text-stone-400 dark:text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 bg-stone-150 dark:bg-white/5 px-2 py-0.5 rounded-full border border-stone-200 dark:border-white/5 select-none">
                                <Lock size={10} /> Read Only (Manager/CEO Edit)
                            </span>
                        )}
                    </div>

                    {!isEditingThresholds ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Min Stock (Reorder Point)</p>
                                <p className="text-sm font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                                    {product.minStock !== undefined && product.minStock !== null ? `${product.minStock} units` : 'Not configured'}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Max Stock (Capacity)</p>
                                <p className="text-sm font-black font-mono mt-1 text-green-600 dark:text-green-400">
                                    {product.maxStock !== undefined && product.maxStock !== null ? `${product.maxStock} units` : 'Not configured'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">Min Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={minVal}
                                        onChange={(e) => setMinVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                        placeholder="e.g. 10"
                                        className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">Max Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={maxVal}
                                        onChange={(e) => setMaxVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                        placeholder="e.g. 100"
                                        className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]/50"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                                <button
                                    onClick={() => setIsEditingThresholds(false)}
                                    disabled={isSaving}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl transition-all flex items-center gap-1"
                                >
                                    <X size={12} /> Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const finalMin = minVal === '' ? null : minVal;
                                            const finalMax = maxVal === '' ? null : maxVal;
                                            
                                            await productsService.update(product.id, {
                                                minStock: finalMin ?? undefined,
                                                maxStock: finalMax ?? undefined
                                            });

                                            product.minStock = finalMin ?? undefined;
                                            product.maxStock = finalMax ?? undefined;

                                            showToast('Stock limits updated successfully', 'success');
                                            setIsEditingThresholds(false);
                                            await refreshData();
                                        } catch (err: any) {
                                            showToast(err.message || 'Failed to save limits', 'error');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="px-3.5 py-1.5 text-[10px] font-black uppercase bg-[#2C5E3B] hover:bg-[#1E3F27] text-white rounded-xl transition-all flex items-center gap-1 shadow-sm"
                                >
                                    <Check size={12} /> {isSaving ? 'Saving...' : 'Save Limits'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Product Attributes (Dense Badge Grid) ── */}
                {hasAnyAttributes && (
                    <div className="p-5 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Product Attributes</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {/* Physical */}
                            <AttrBadge label="Net" value={customAttrs?.physical?.netWeight ? `${customAttrs.physical.netWeight}${customAttrs?.physical?.sizeType || product.unit || ''}` : null} />
                            <AttrBadge label="Gross" value={customAttrs?.physical?.grossWeight ? `${customAttrs.physical.grossWeight}kg` : null} />
                            <AttrBadge label="Form" value={customAttrs?.physical?.form} />
                            <AttrBadge label="Color" value={customAttrs?.physical?.color} />
                            <AttrBadge label="Texture" value={customAttrs?.physical?.texture} />
                            <AttrBadge label="Dims" value={customAttrs?.physical?.dims} />

                            {/* Packaging */}
                            <AttrBadge label="Pack" value={customAttrs?.packaging?.packQty ? `×${customAttrs.packaging.packQty}` : null} />
                            <AttrBadge label="Case" value={customAttrs?.packaging?.caseSize ? `×${customAttrs.packaging.caseSize}` : null} />
                            <AttrBadge label="Level" value={customAttrs?.packaging?.packagingLevel} />
                            <AttrBadge label="Type" value={customAttrs?.packaging?.packageType} />
                            <AttrBadge label="Mat" value={customAttrs?.packaging?.material} />
                            <AttrBadge label="Breakable" value={customAttrs?.packaging?.isBreakable} color="red" />

                            {/* Storage */}
                            <AttrBadge label="Storage" value={customAttrs?.storage?.type} color={customAttrs?.storage?.type === 'Frozen' ? 'blue' : customAttrs?.storage?.type === 'Chilled' ? 'cyan' : undefined} />
                            <AttrBadge label="Perishable" value={customAttrs?.storage?.isPerishable} color="orange" />
                            <AttrBadge label="Hazardous" value={customAttrs?.storage?.isHazardous} color="red" />
                            <AttrBadge label="Fragile" value={customAttrs?.storage?.isFragile} color="orange" />
                            <AttrBadge label="Light Sensitive" value={customAttrs?.storage?.isLightSensitive} color="yellow" />
                            <AttrBadge label="Stack" value={customAttrs?.storage?.stackLimit ? `Max ${customAttrs.storage.stackLimit}` : null} />

                            {/* Commercial */}
                            <AttrBadge label="Sell By" value={customAttrs?.commercial?.sellBy} />
                            <AttrBadge label="Price" value={customAttrs?.commercial?.priceType} />
                            <AttrBadge label="Weighted" value={customAttrs?.commercial?.isWeighted} color="purple" />
                            <AttrBadge label="Returnable" value={customAttrs?.commercial?.isReturnable} color="green" />
                            <AttrBadge label="Bundle" value={customAttrs?.commercial?.isBundleEligible} color="blue" />

                            {/* Descriptive */}
                            <AttrBadge label="Use" value={customAttrs?.descriptive?.usage} />
                            <AttrBadge label="Target" value={customAttrs?.descriptive?.audience} />
                            <AttrBadge label="Scent" value={customAttrs?.descriptive?.scent} color="pink" />
                            <AttrBadge label="Flavor" value={customAttrs?.descriptive?.flavor} color="orange" />
                            <AttrBadge label="Strength" value={customAttrs?.descriptive?.strength} />
                        </div>
                    </div>
                )}

                {/* ── Identification & Sales ── */}
                <div className="p-5 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ScanBarcode size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Identification & Sales</h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Registered Barcodes</p>
                            {barcodeList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {barcodeList.map((bc, i) => (
                                        <span key={i} className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded text-xs font-mono tracking-tight">
                                            {bc}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-gray-400 dark:text-gray-600">—</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sell Unit</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{unitObj ? `${unitObj.label} (${unitObj.shortLabel})` : (product.unit || '—')}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sale Price</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {product.salePrice ? formatCompactNumber(product.salePrice, { currency: CURRENCY_SYMBOL }) : 'No active discount'}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Date Added</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {product.createdAt || (product as any).created_at ? new Date(product.createdAt || (product as any).created_at).toLocaleDateString() : '—'}
                            </p>
                        </div>
                        {product.expiryDate && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Expiry Date</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{new Date(product.expiryDate).toLocaleDateString()}</p>
                            </div>
                        )}
                        {product.batchNumber && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Batch Number</p>
                                <p className="text-sm font-medium font-mono text-gray-900 dark:text-gray-200">{product.batchNumber}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recent Receiving History ── */}
                <div className="p-5 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers size={14} className="text-purple-500" />
                        <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Recent Restocks</h3>
                    </div>

                    {recentReceives.length > 0 ? (
                        <div className="space-y-2">
                            {recentReceives.map(movement => {
                                const employee = employees?.find(e => e.id === movement.performedBy || e.name === movement.performedBy);
                                const employeeName = employee ? employee.name : movement.performedBy || 'System';
                                return (
                                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center font-black text-xs">
                                                +{movement.quantity}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase">{employeeName}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                    {new Date(movement.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-gray-500 italic text-center py-3">No recent receiving history available for this product.</p>
                    )}
                </div>

            </div>
        </Modal>
    );
};
