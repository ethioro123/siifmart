import React from 'react';
import {
    Package, Tag, Hash, Layers, Box, Info, ScanBarcode, Lock, Edit2, Check, X,
    TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, Calendar, Building2, User, Clock
} from 'lucide-react';
import { Product } from '../../types';
import Modal from '../Modal';
import { formatCompactNumber, formatPriceValue } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { useData } from '../../contexts/DataContext';
import { getSellUnit, formatProductSize, getEffectivePackageSize } from '../../utils/units';
import { getRoleHierarchy, canViewCostPrice } from '../../utils/roles';
import { useStore } from '../../contexts/CentralStore';
import { productsService } from '../../services/products.service';
import { ProductAttributesPanel } from './components/ProductAttributesPanel';

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const DetailField = ({ label, value, icon: Icon, colorClass, highlight }: { label: string; value: React.ReactNode; icon?: any; colorClass?: string; highlight?: boolean }) => {
    return (
        <div className={`p-3 rounded-xl flex items-start gap-3 border ${
            highlight 
                ? 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-400/5 dark:border-amber-400/10' 
                : 'bg-stone-50/50 dark:bg-black/10 border-stone-200/50 dark:border-white/5'
        }`}>
            {Icon && <Icon size={14} className={`mt-0.5 flex-shrink-0 ${colorClass || 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`} />}
            <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{label}</span>
                <div className="text-xs font-black text-gray-950 dark:text-stone-100 leading-tight">
                    {value !== undefined && value !== null && value !== '' ? value : <span className="text-gray-300 dark:text-gray-650 font-bold">—</span>}
                </div>
            </div>
        </div>
    );
};

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
    const { movements, employees, refreshData, deleteProduct } = useData();
    const { user, showToast } = useStore();
    const showCostPrice = canViewCostPrice(user?.role);

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
                `This action cannot be undone.\n\nType "DELETE" to confirm:`
            );
            if (confirmation !== 'DELETE') {
                showToast('Deletion cancelled.', 'info');
                return;
            }
        } else if (isStoreManager) {
            if (product.stock > 0) {
                showToast('Store Managers can only delete products that are out of stock.', 'error');
                return;
            }
            if (!window.confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
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

    const canEditThresholds = user?.role ? getRoleHierarchy(user.role) >= 80 : false;
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
    if (product.barcode) allBarcodes.add(product.barcode.trim());
    if ((product as any).barcodes && Array.isArray((product as any).barcodes)) {
        (product as any).barcodes.forEach((b: string) => { if (b?.trim()) allBarcodes.add(b.trim()); });
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

    let healthColor = 'text-green-500 border-green-500/25 bg-green-500/5';
    let healthLabel = 'Optimal Level';
    if (product.stock === 0) {
        healthColor = 'text-red-500 border-red-500/25 bg-red-500/5';
        healthLabel = 'Out of Stock';
    } else if (product.minStock && product.stock < product.minStock) {
        healthColor = product.stock <= product.minStock * 0.5 ? 'text-red-500 border-red-500/25 bg-red-500/5' : 'text-amber-500 border-amber-500/25 bg-amber-500/5';
        healthLabel = 'Low Stock';
    }

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
                    className={`px-4 py-2 text-xs font-black uppercase rounded-xl border ${isDeleteDisabled ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}
                >
                    Delete Product
                </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl">Close</button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Profile & Inventory Console" size="xl" footer={modalFooter}>
            <div className="flex flex-col gap-6 text-[#1E3F27] dark:text-[#EAE5D9]">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between pb-6 border-b border-stone-200 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.image && !product.image.includes('placeholder.com') ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={24} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {product.category || 'Uncategorised'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${healthColor}`}>
                                    {healthLabel}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mt-1 leading-none">
                                {product.brand && !brandAlreadyInName && <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{product.brand} </span>}
                                {product.name}
                            </h2>
                        </div>
                    </div>
                    <div className="flex gap-8 items-center self-stretch md:self-auto justify-around text-center md:text-right min-w-[200px]">
                        <div>
                            <p className="text-xl font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] tracking-tighter">
                                {CURRENCY_SYMBOL}{formatPriceValue(product.price)}
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Retail Price</p>
                        </div>
                        <div>
                            <p className={`text-xl font-black font-mono tracking-tighter ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {product.stock.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Units in Stock</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-black/15 p-5 rounded-2xl border border-stone-200 dark:border-white/5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-stone-100 dark:border-white/5 pb-2">
                        <Info size={14} className="text-[#2C5E3B]" />
                        <h3 className="text-[10px] font-black uppercase tracking-wider">Product Specifications</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailField label="SKU" value={product.sku} icon={Hash} />
                        <DetailField label="Barcodes" value={barcodeList.length > 0 ? <span className="font-mono">{barcodeList.join(', ')}</span> : null} icon={ScanBarcode} />
                        <DetailField label="Category" value={product.category} icon={Tag} />
                        <DetailField label="Sell Unit" value={unitObj ? `${unitObj.label} (${unitObj.shortLabel})` : product.unit} icon={Package} />
                        <DetailField label="Size / Weight" value={formatProductSize(product)} icon={Box} />
                        <DetailField label="Variant" value={customAttrs?.identity?.variant} icon={Tag} />
                        <DetailField label="Batch / Lot No" value={product.batchNumber} icon={Layers} />
                        <DetailField label="Expiry Date" value={product.expiryDate ? `${new Date(product.expiryDate).toLocaleDateString()}${expiryAlert ? ` (${expiryAlert})` : ''}` : null} icon={Calendar} colorClass={expiryColor || undefined} />
                        <DetailField label="Shelf Position" value={product.shelfPosition} icon={Layers} />
                        <DetailField label="Storage Location" value={product.location} icon={Building2} />
                        <DetailField label="Date Registered" value={product.createdAt || (product as any).created_at ? new Date(product.createdAt || (product as any).created_at).toLocaleDateString() : null} icon={Clock} />
                        {(product as any).salesVelocity && <DetailField label="Sales Velocity" value={(product as any).salesVelocity} icon={TrendingUp} />}
                    </div>
                </div>

                <div className="bg-white dark:bg-black/15 p-5 rounded-2xl border border-stone-200 dark:border-white/5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-stone-100 dark:border-white/5 pb-2">
                        <DollarSign size={14} className="text-[#2C5E3B]" />
                        <h3 className="text-[10px] font-black uppercase tracking-wider">Financial & Pricing Details</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailField label="Retail Price" value={`${CURRENCY_SYMBOL} ${formatPriceValue(product.price)}`} icon={DollarSign} />
                        <DetailField label="Promo Price" value={salePrice > 0 ? `${CURRENCY_SYMBOL} ${formatPriceValue(salePrice)}` : null} icon={Tag} highlight />
                        <DetailField label="Discount" value={salePrice > 0 && discountPct > 0 ? `${discountPct.toFixed(1)}%` : null} icon={Percent} highlight />
                        {compPrice > 0 && <DetailField label="Competitor Price" value={`${CURRENCY_SYMBOL} ${formatPriceValue(compPrice)}`} icon={compDiff > 0 ? TrendingDown : TrendingUp} colorClass={compDiff > 0 ? 'text-red-500' : 'text-green-500'} />}
                        {showCostPrice && (
                            <>
                                <DetailField label="Cost Price (COGS)" value={cost > 0 ? `${CURRENCY_SYMBOL} ${formatPriceValue(cost)}` : null} icon={Lock} colorClass="text-stone-400" />
                                <DetailField label="Gross Profit" value={grossProfit > 0 ? `${CURRENCY_SYMBOL} ${grossProfit.toFixed(2)}` : null} icon={TrendingUp} />
                                <DetailField label="Gross Margin" value={marginPct > 0 ? `${marginPct.toFixed(1)}%` : null} icon={Percent} />
                                <DetailField label="Markup Rate" value={markupPct > 0 ? `${markupPct.toFixed(1)}%` : null} icon={Percent} />
                            </>
                        )}
                    </div>
                </div>

                <ProductAttributesPanel product={product} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-black/15 p-5 rounded-2xl border border-stone-200 dark:border-white/5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-2">
                            <div className="flex items-center gap-2"><Layers size={14} className="text-[#2C5E3B]"/><h3 className="text-[10px] font-black uppercase tracking-wider">Stock Policies</h3></div>
                            {canEditThresholds && !isEditingThresholds && <button onClick={() => setIsEditingThresholds(true)} className="px-2 py-0.5 text-[9px] font-black uppercase bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-lg border border-[#2C5E3B]/25">Edit</button>}
                        </div>
                        {!isEditingThresholds ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-xl border border-stone-200/50 dark:border-white/5 text-center">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Min Stock</span>
                                    <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 block mt-1">{product.minStock !== undefined && product.minStock !== null ? `${product.minStock} units` : '—'}</span>
                                </div>
                                <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-xl border border-stone-200/50 dark:border-white/5 text-center">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Max Stock</span>
                                    <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400 block mt-1">{product.maxStock !== undefined && product.maxStock !== null ? `${product.maxStock} units` : '—'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="min-stock-input" className="text-[8px] text-gray-500 font-bold uppercase block mb-1">Min Stock</label>
                                        <input id="min-stock-input" type="number" min="0" value={minVal} onChange={(e) => setMinVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 10" className="w-full bg-gray-100 dark:bg-black/40 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none" />
                                    </div>
                                    <div>
                                        <label htmlFor="max-stock-input" className="text-[8px] text-gray-500 font-bold uppercase block mb-1">Max Stock</label>
                                        <input id="max-stock-input" type="number" min="0" value={maxVal} onChange={(e) => setMaxVal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 100" className="w-full bg-gray-100 dark:bg-black/40 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none" />
                                    </div>
                                </div>
                                <div className="flex gap-1.5 justify-end pt-1">
                                    <button onClick={() => setIsEditingThresholds(false)} className="px-2 py-1 text-[9px] font-black uppercase bg-stone-100 dark:bg-white/5 text-stone-500 rounded-lg">Cancel</button>
                                    <button onClick={async () => { setIsSaving(true); try { await productsService.update(product.id, { minStock: minVal === '' ? undefined : minVal, maxStock: maxVal === '' ? undefined : maxVal }); showToast('Updated', 'success'); setIsEditingThresholds(false); await refreshData(); } catch (err: any) { showToast('Error', 'error'); } finally { setIsSaving(false); } }} className="px-2 py-1 text-[9px] font-black uppercase bg-[#2C5E3B] text-white rounded-lg">Save</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-black/15 p-5 rounded-2xl border border-stone-200 dark:border-white/5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-stone-100 dark:border-white/5 pb-2">
                            <TrendingUp size={14} className="text-[#2C5E3B]" />
                            <h3 className="text-[10px] font-black uppercase tracking-wider">Restock Log & Audits</h3>
                        </div>
                        {recentReceives.length > 0 ? (
                            <div className="space-y-3 pl-2 border-l border-stone-200 dark:border-white/5 ml-2 max-h-[140px] overflow-y-auto">
                                {recentReceives.map(m => (
                                    <div key={m.id} className="relative flex flex-col gap-0.5">
                                        <div className="absolute -left-[14px] top-1.5 w-1.5 h-1.5 rounded-full bg-green-500 border border-white dark:border-black" />
                                        <div className="flex items-center justify-between text-[11px]"><span className="font-bold text-gray-900 dark:text-white uppercase">{employees?.find(e => e.id === m.performedBy)?.name || m.performedBy || 'System'}</span><span className="font-mono text-green-600 font-bold">+{m.quantity}</span></div>
                                        <span className="text-[9px] text-gray-400 font-mono">{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs font-bold text-gray-400 text-center py-2">No recent restocks</p>}
                        <div className="pt-3 border-t border-stone-200 dark:border-white/5 text-[10px] space-y-1.5">
                            <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Created:</span><span className="font-semibold">{product.createdBy || 'System'}</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-stone-50/50 dark:bg-black/10 rounded-xl border border-stone-200 dark:border-white/5 text-[11px] leading-relaxed font-mono">
                    <span className="text-gray-400 font-bold uppercase block mb-1">Catalog Description Spec:</span>
                    <span className="text-gray-800 dark:text-stone-200 font-bold">{systemDesc || '—'}</span>
                    {customAttrs?.descriptive?.keyFeatures && <p className="mt-2 text-stone-600 dark:text-stone-400 italic">Features: {customAttrs.descriptive.keyFeatures}</p>}
                </div>
            </div>
        </Modal>
    );
};
