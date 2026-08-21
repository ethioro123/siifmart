import React, { useState, useEffect } from 'react';
import { X, Package, Scale, DollarSign, Layers, Info } from 'lucide-react';
import { Product } from '../../types';
import { productsService } from '../../services/supabase.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { canViewCostPrice } from '../../utils/roles';
import { logger } from '../../utils/logger';
import { ProfileTab } from './product-control/ProfileTab';
import { UnitTab, UnitConfig, SellMode } from './product-control/UnitTab';
import { PricingTab, PricingConfig } from './product-control/PricingTab';
import { StockTab, StockConfig } from './product-control/StockTab';
import { getSellUnit } from '../../utils/units';

type ModalTab = 'profile' | 'unit' | 'pricing' | 'stock';

interface Props {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

function modeFromUnit(unitCode?: string): SellMode {
    if (!unitCode) return 'count';
    const u = getSellUnit(unitCode);
    if (u.category === 'weight') return 'weight';
    if (u.category === 'volume') return 'volume';
    return 'count';
}

export const ProductControlModal: React.FC<Props> = ({ product, isOpen, onClose, onSaved }) => {
    const { user, showToast } = useStore();
    const { refreshData, updateProduct, updatePricesBySKU, sites, allProducts } = useData();
    const showCost = canViewCostPrice(user?.role);
    const canDirectEdit = user?.role === 'super_admin';

    const [activeTab, setActiveTab] = useState<ModalTab>('unit');
    const [isSaving, setIsSaving] = useState(false);

    const [unitCfg, setUnitCfg] = useState<UnitConfig>({
        sellMode: 'count', sellUnit: 'UNIT', physicalQty: '', physicalUnit: 'g', packOf: '', caseOf: '', label: '', scope: 'single', selectedSiteIds: []
    });
    const [pricingCfg, setPricingCfg] = useState<PricingConfig>({
        price: 0, costPrice: 0, salePrice: 0, isOnSale: false, competitorPrice: 0, scope: 'all', selectedSiteIds: []
    });
    const [stockCfg, setStockCfg] = useState<StockConfig>({ minStock: '', maxStock: '' });

    useEffect(() => {
        if (!product) return;
        const mode = modeFromUnit(product.unit);
        const customAttrs = product.customAttributes || (product as any).custom_attributes;
        const physUnit = customAttrs?.physical?.unit || customAttrs?.physical?.sizeType || (mode === 'weight' ? 'g' : mode === 'volume' ? 'ml' : 'g');
        const allSiteIds = (sites || []).map(s => s.id);
        setUnitCfg({
            sellMode: mode,
            sellUnit: product.unit?.toUpperCase() || 'UNIT',
            physicalQty: product.size ? String(product.size) : '',
            physicalUnit: physUnit,
            packOf: customAttrs?.packaging?.packQty || (product.packQuantity && product.packQuantity > 1 ? String(product.packQuantity) : ''),
            caseOf: customAttrs?.packaging?.caseSize ? String(customAttrs.packaging.caseSize) : '',
            label: customAttrs?.commercial?.labelOverride || '',
            scope: 'single',
            selectedSiteIds: allSiteIds.length > 0 ? allSiteIds : [product.siteId || '']
        });
        setPricingCfg({
            price: product.price || 0,
            costPrice: product.costPrice || 0,
            salePrice: product.salePrice || 0,
            isOnSale: product.isOnSale || false,
            competitorPrice: product.competitorPrice || 0,
            scope: 'all',
            selectedSiteIds: allSiteIds.length > 0 ? allSiteIds : [product.siteId || '']
        });
        setStockCfg({
            minStock: product.minStock != null ? String(product.minStock) : '',
            maxStock: product.maxStock != null ? String(product.maxStock) : ''
        });
    }, [product]);

    if (!isOpen || !product) return null;

    const handleSaveUnit = async () => {
        setIsSaving(true);
        try {
            const customAttrs = product.customAttributes || (product as any).custom_attributes || {};
            const updatePayload = {
                unit: unitCfg.sellUnit,
                size: unitCfg.physicalQty || undefined,
                packQuantity: unitCfg.packOf ? parseInt(unitCfg.packOf) : 1,
                customAttributes: {
                    ...customAttrs,
                    physical: {
                        ...(customAttrs.physical || {}),
                        unit: unitCfg.physicalUnit,
                        sizeType: unitCfg.physicalUnit,
                        netWeight: unitCfg.physicalQty || undefined,
                    },
                    packaging: {
                        ...(customAttrs.packaging || {}),
                        packQty: unitCfg.packOf || undefined,
                        caseSize: unitCfg.caseOf || undefined,
                    },
                    commercial: {
                        ...(customAttrs.commercial || {}),
                        sellBy: unitCfg.sellMode === 'weight' ? 'Weight' : unitCfg.sellMode === 'volume' ? 'Volume' : 'Count',
                        sellUnit: unitCfg.sellUnit,
                        labelOverride: unitCfg.label || undefined,
                    }
                },
            };

            const scope = unitCfg.scope || 'single';
            if (scope === 'all' && product.sku) {
                const matchingProducts = (allProducts || []).filter(p => p.sku === product.sku);
                if (matchingProducts.length > 0) {
                    await Promise.all(matchingProducts.map(p => productsService.update(p.id, updatePayload)));
                } else {
                    await productsService.update(product.id, updatePayload);
                }
                showToast(`Selling configuration updated across all network locations for SKU ${product.sku}`, 'success');
            } else if (scope === 'custom' && (unitCfg.selectedSiteIds || []).length > 0) {
                const targetSiteIds = new Set(unitCfg.selectedSiteIds);
                const matchingProducts = (allProducts || []).filter(
                    p => (p.sku === product.sku || p.id === product.id) && targetSiteIds.has(p.siteId || (p as any).site_id || '')
                );
                if (matchingProducts.length > 0) {
                    await Promise.all(matchingProducts.map(p => productsService.update(p.id, updatePayload)));
                } else {
                    await productsService.update(product.id, updatePayload);
                }
                showToast(`Selling configuration updated across ${targetSiteIds.size} selected location(s)`, 'success');
            } else {
                await productsService.update(product.id, updatePayload);
                showToast('Selling & Packaging Configuration saved for this location', 'success');
            }

            await refreshData();
            onSaved?.();
        } catch (err: any) {
            logger.error('ProductControlModal', 'Failed to save unit config', err);
            showToast(err?.message || 'Failed to save configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePricing = async () => {
        setIsSaving(true);
        try {
            const updates = {
                price: pricingCfg.price,
                costPrice: pricingCfg.costPrice,
                salePrice: pricingCfg.salePrice,
                isOnSale: pricingCfg.isOnSale,
                competitorPrice: pricingCfg.competitorPrice,
            };

            if (pricingCfg.scope === 'single') {
                await updateProduct({ ...product, ...updates });
                showToast(`Pricing saved for ${product.location || 'this location'}`, 'success');
            } else if (pricingCfg.scope === 'all') {
                await updateProduct({ ...product, ...updates });
                if (product.sku) {
                    await updatePricesBySKU(product.sku, {
                        price: pricingCfg.price,
                        costPrice: pricingCfg.costPrice,
                        salePrice: pricingCfg.salePrice,
                        isOnSale: pricingCfg.isOnSale,
                    });
                }
                showToast(`Pricing saved & synced across all network sites for SKU ${product.sku}`, 'success');
            } else if (pricingCfg.scope === 'custom') {
                const targetSiteIds = new Set(pricingCfg.selectedSiteIds);
                if (targetSiteIds.size === 0) {
                    showToast('Please select at least one store location to apply pricing', 'error');
                    setIsSaving(false);
                    return;
                }

                const matchingProducts = (allProducts || []).filter(
                    p => (p.sku === product.sku || p.id === product.id) && targetSiteIds.has(p.siteId || (p as any).site_id || '')
                );

                if (matchingProducts.length === 0) {
                    await updateProduct({ ...product, ...updates });
                } else {
                    await Promise.all(
                        matchingProducts.map(p => updateProduct({ ...p, ...updates }))
                    );
                }

                const totalSitesCount = (sites || []).length || targetSiteIds.size;
                const unselectedCount = Math.max(0, totalSitesCount - targetSiteIds.size);

                showToast(
                    `Pricing updated across ${targetSiteIds.size} selected location(s)${unselectedCount > 0 ? ` (${unselectedCount} left unchanged)` : ''}`,
                    'success'
                );
            }

            await refreshData();
            onSaved?.();
        } catch (err: any) {
            logger.error('ProductControlModal', 'Failed to save pricing', err);
            showToast(err?.message || 'Failed to save pricing', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStock = async () => {
        setIsSaving(true);
        try {
            await productsService.update(product.id, {
                minStock: stockCfg.minStock === '' ? undefined : parseInt(stockCfg.minStock),
                maxStock: stockCfg.maxStock === '' ? undefined : parseInt(stockCfg.maxStock),
            });
            showToast('Stock policies saved', 'success');
            await refreshData();
            onSaved?.();
        } catch (err: any) {
            logger.error('ProductControlModal', 'Failed to save stock policies', err);
            showToast(err?.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: { id: ModalTab; label: string; icon: any }[] = [
        { id: 'profile', label: 'Profile', icon: Info },
        { id: 'unit', label: 'Unit & Packaging', icon: Scale },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'stock', label: 'Stock Policy', icon: Layers },
    ];

    const inputCls = 'w-full bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#0f1710] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-stone-200 dark:border-white/10 overflow-hidden">

                {/* Header */}
                <div className="flex items-start gap-4 p-5 border-b border-stone-200 dark:border-white/10 flex-shrink-0 bg-stone-50 dark:bg-black/20">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image && !product.image.includes('placeholder.com') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={20} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                {product.sku}
                            </span>
                            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">{product.category}</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white truncate mt-0.5">{product.name}</h3>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">Location: {product.location || 'Default Shelf'}</p>
                    </div>
                    <button onClick={onClose} title="Close" aria-label="Close" className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-200 dark:border-white/10 bg-stone-50/50 dark:bg-black/10 px-5 flex-shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'border-[#2C5E3B] text-[#2C5E3B] dark:border-[#A9CBA2] dark:text-[#A9CBA2]'
                                    : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                            }`}
                        >
                            <tab.icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'profile' && (
                        <ProfileTab product={product} />
                    )}

                    {activeTab === 'unit' && (
                        <UnitTab
                            product={product}
                            unitCfg={unitCfg}
                            setUnitCfg={setUnitCfg}
                            handleSaveUnit={handleSaveUnit}
                            isSaving={isSaving}
                            canDirectEdit={canDirectEdit}
                            inputCls={inputCls}
                            sites={sites || []}
                        />
                    )}

                    {activeTab === 'pricing' && (
                        <PricingTab
                            product={product}
                            pricingCfg={pricingCfg}
                            setPricingCfg={setPricingCfg}
                            handleSavePricing={handleSavePricing}
                            isSaving={isSaving}
                            showCost={showCost}
                            sites={sites || []}
                            allProducts={allProducts || []}
                        />
                    )}

                    {activeTab === 'stock' && (
                        <StockTab
                            product={product}
                            stockCfg={stockCfg}
                            setStockCfg={setStockCfg}
                            handleSaveStock={handleSaveStock}
                            isSaving={isSaving}
                            sellUnit={unitCfg.sellUnit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
