import React, { useMemo } from 'react';
import {
    Building, Store, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
    MapPin, Package, Shield, Truck, ChevronRight
} from 'lucide-react';
import Modal from '../Modal';
import { Product, Site } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

interface ProductNetworkStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    allProducts: Product[];
    sites: Site[];
    onInitiateTransfer?: (sourceSiteId: string, targetSiteId: string, sku: string) => void;
}

export const ProductNetworkStockModal: React.FC<ProductNetworkStockModalProps> = ({
    isOpen,
    onClose,
    product,
    allProducts,
    sites
}) => {
    if (!product) return null;

    const targetSku = (product.sku || '').trim().toUpperCase();
    const targetName = (product.name || '').trim().toLowerCase();

    // Find all instances of this product across every operational site
    const distribution = useMemo(() => {
        const matchingInstances = allProducts.filter(p => {
            if ((p.status || (p as any).status) === 'archived') return false;
            const pSku = (p.sku || '').trim().toUpperCase();
            if (targetSku && targetSku !== 'N/A' && targetSku === pSku) return true;
            return (p.name || '').trim().toLowerCase() === targetName;
        });

        // Map through active non-admin sites
        const inventorySites = sites.filter(s => {
            const isAdmin = s.type === 'Administration' || s.type === 'Administrative' ||
                s.name?.toLowerCase().includes('admin') || s.name?.toLowerCase().includes('headquarters');
            return !isAdmin;
        });

        const warehouseNodes: any[] = [];
        const storeNodes: any[] = [];

        inventorySites.forEach(site => {
            const inst = matchingInstances.find(p => p.siteId === site.id || p.site_id === site.id);
            const stock = inst ? inst.stock : 0;
            const minStock = (inst && inst.minStock && inst.minStock > 0) ? inst.minStock : 10;

            const nodeData = {
                site,
                stock,
                minStock,
                location: inst?.location || 'Unassigned',
                isStocked: Boolean(inst),
                isLow: stock > 0 && stock <= minStock,
                isOut: stock <= 0
            };

            if (site.type === 'Warehouse' || site.type === 'Distribution Center') {
                warehouseNodes.push(nodeData);
            } else {
                storeNodes.push(nodeData);
            }
        });

        const totalNetworkUnits = matchingInstances.reduce((sum, p) => sum + (p.stock || 0), 0);
        const lowStoreCount = storeNodes.filter(n => n.isLow || n.isOut).length;
        const lowWarehouseCount = warehouseNodes.filter(n => n.isLow || n.isOut).length;

        // Find best source warehouse for transfer (highest stock)
        const bestSourceWarehouse = [...warehouseNodes].sort((a, b) => b.stock - a.stock)[0];

        return {
            warehouseNodes,
            storeNodes,
            totalNetworkUnits,
            lowStoreCount,
            lowWarehouseCount,
            bestSourceWarehouse: bestSourceWarehouse?.stock > 20 ? bestSourceWarehouse : null
        };
    }, [allProducts, sites, targetSku, targetName]);

    const getStatusBadge = (stock: number, minStock: number) => {
        if (stock <= 0) {
            return (
                <span className="flex items-center gap-1 text-[10px] font-black font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-lg">
                    <XCircle size={11} /> 0 Units (Out of Stock)
                </span>
            );
        }
        if (stock <= minStock) {
            return (
                <span className="flex items-center gap-1 text-[10px] font-black font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-lg">
                    <AlertTriangle size={11} /> {stock} Units (Low Stock ≤ {minStock})
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-[10px] font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 px-2 py-0.5 rounded-lg">
                <CheckCircle2 size={11} /> {stock} Units (Healthy)
            </span>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Multi-Site Stock Health Breakdown"
            size="2xl"
        >
            <div className="space-y-6">
                {/* Product Summary Header Banner */}
                <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-14 h-14 rounded-2xl object-cover border border-[#E2DCCE] dark:border-white/10 shrink-0"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center shrink-0">
                                <Package size={24} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-black text-[#1E3F27] dark:text-white">{product.name}</h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                                SKU: {product.sku || 'N/A'} • {product.category || 'General'}
                            </p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2DCCE]/60 dark:border-white/5">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total On-Hand</span>
                        <p className="text-2xl font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                            {distribution.totalNetworkUnits} <span className="text-xs font-bold text-stone-400">units</span>
                        </p>
                    </div>
                </div>

                {/* Smart Transfer Recommendation Alert (if warehouses have surplus and stores are low) */}
                {distribution.bestSourceWarehouse && distribution.lowStoreCount > 0 && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
                        <Truck size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs font-black text-amber-800 dark:text-amber-300">
                                Rebalance Opportunity Detected
                            </h5>
                            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 mt-0.5">
                                {distribution.lowStoreCount} store(s) are low on stock. <strong>{distribution.bestSourceWarehouse.site.name}</strong> currently holds a surplus of {distribution.bestSourceWarehouse.stock} units available for inter-site transfer.
                            </p>
                        </div>
                    </div>
                )}

                {/* Split Breakdown: Warehouses vs Stores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warehouses Column */}
                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E2DCCE]/60 dark:border-white/5">
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={14} className="text-blue-600" />
                                Warehouses & Hubs
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-stone-400">
                                {distribution.warehouseNodes.length} Locations
                            </span>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                            {distribution.warehouseNodes.map((node, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-2xl border transition-all ${
                                        node.isOut
                                            ? 'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/20'
                                            : node.isLow
                                                ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/20'
                                                : 'bg-[#FAF8F5] dark:bg-black/30 border-[#E2DCCE]/60 dark:border-white/5'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-[#1E3F27] dark:text-white">{node.site.name}</p>
                                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">Bin: {node.location}</p>
                                        </div>
                                        {getStatusBadge(node.stock, node.minStock)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Retail Stores Column */}
                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E2DCCE]/60 dark:border-white/5">
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Store size={14} className="text-emerald-600" />
                                Retail Stores
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-stone-400">
                                {distribution.storeNodes.length} Locations
                            </span>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                            {distribution.storeNodes.map((node, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-2xl border transition-all ${
                                        node.isOut
                                            ? 'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/20'
                                            : node.isLow
                                                ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/20'
                                                : 'bg-[#FAF8F5] dark:bg-black/30 border-[#E2DCCE]/60 dark:border-white/5'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-[#1E3F27] dark:text-white">{node.site.name}</p>
                                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">Shelf: {node.location}</p>
                                        </div>
                                        {getStatusBadge(node.stock, node.minStock)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
export default ProductNetworkStockModal;
