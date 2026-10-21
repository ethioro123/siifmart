import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building, Store, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
    MapPin, Package, Shield, Truck, ChevronRight
} from 'lucide-react';
import Modal from '../Modal';
import { Product, Site } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { supabase } from '../../lib/supabase';
import { productsService } from '../../services/products.service';

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
    const navigate = useNavigate();
    const [fetchedInstances, setFetchedInstances] = useState<Product[]>([]);

    useEffect(() => {
        if (!isOpen || !product) {
            setFetchedInstances([]);
            return;
        }

        // RULE 10: On-demand SKU distribution lookup
        const sku = (product.sku || '').trim();
        let query = supabase.from('products').select('*');
        if (sku && sku !== 'N/A') {
            query = query.eq('sku', sku);
        } else {
            query = query.eq('name', product.name);
        }

        query.neq('status', 'archived').then(({ data, error }) => {
            if (!error && data && data.length > 0) {
                setFetchedInstances(data.map((p: any) => productsService._mapProduct(p)));
            }
        });
    }, [isOpen, product]);

    if (!product) return null;

    const targetSku = (product.sku || '').trim().toUpperCase();
    const targetName = (product.name || '').trim().toLowerCase();

    // Find all instances of this product across every operational site
    const distribution = useMemo(() => {
        const pool = fetchedInstances.length > 0 ? fetchedInstances : (allProducts || []);
        const matchingInstances = pool.filter(p => {
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
                <span className="flex items-center gap-1 text-[10px] font-semibold font-mono text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] px-2 py-0.5 rounded-lg">
                    <XCircle size={11} /> 0 Units (Out of Stock)
                </span>
            );
        }
        if (stock <= minStock) {
            return (
                <span className="flex items-center gap-1 text-[10px] font-semibold font-mono text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-lg">
                    <AlertTriangle size={11} /> {stock} Units (Low Stock ≤ {minStock})
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-[10px] font-semibold font-mono text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] px-2 py-0.5 rounded-lg">
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
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-14 h-14 rounded-xl object-cover border border-[var(--theme-border)] shrink-0"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                                <Package size={24} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">{product.name}</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">
                                SKU: {product.sku || 'N/A'} • {product.category || 'General'}
                            </p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--theme-border)]">
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Total On-Hand</span>
                        <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">
                            {distribution.totalNetworkUnits} <span className="text-xs font-semibold text-[var(--theme-text-secondary)]">units</span>
                        </p>
                    </div>
                </div>

                {/* Smart Transfer Recommendation Alert (if warehouses have surplus and stores are low) */}
                {distribution.bestSourceWarehouse && distribution.lowStoreCount > 0 && (
                    <div className="bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <Truck size={18} className="text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-bold text-[var(--theme-status-warning-text)]">
                                    Rebalance Opportunity Detected
                                </h5>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                    {distribution.lowStoreCount} store(s) are low on stock. <strong className="text-[var(--theme-text-primary)]">{distribution.bestSourceWarehouse.site.name}</strong> currently holds a surplus of {distribution.bestSourceWarehouse.stock} units available for inter-site transfer.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                navigate(`/wms-ops?tab=transfers&source=${distribution.bestSourceWarehouse?.site.id}&sku=${encodeURIComponent(product.sku || product.name)}`);
                            }}
                            className="shrink-0 min-h-11 px-3.5 py-2 bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] hover:opacity-90 rounded-xl text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            <span>Initiate Transfer</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                )}

                {/* Split Breakdown: Warehouses vs Stores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warehouses Column */}
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                            <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={14} className="text-[var(--theme-accent)]" />
                                Warehouses & Hubs
                            </h4>
                            <span className="text-[10px] font-mono font-semibold text-[var(--theme-text-secondary)]">
                                {distribution.warehouseNodes.length} Locations
                            </span>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                            {distribution.warehouseNodes.map((node, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-xl border transition-all ${
                                        node.isOut
                                            ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]'
                                            : node.isLow
                                                ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">{node.site.name}</p>
                                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5">Bin: {node.location}</p>
                                        </div>
                                        {getStatusBadge(node.stock, node.minStock)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Retail Stores Column */}
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                            <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Store size={14} className="text-[var(--theme-accent)]" />
                                Retail Stores
                            </h4>
                            <span className="text-[10px] font-mono font-semibold text-[var(--theme-text-secondary)]">
                                {distribution.storeNodes.length} Locations
                            </span>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                            {distribution.storeNodes.map((node, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-xl border transition-all ${
                                        node.isOut
                                            ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)]'
                                            : node.isLow
                                                ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">{node.site.name}</p>
                                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5">Shelf: {node.location}</p>
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
