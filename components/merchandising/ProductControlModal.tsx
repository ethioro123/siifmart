import React, { useState, useEffect } from 'react';
import { X, Package, Scale, DollarSign, Layers, Info } from 'lucide-react';
import { Product } from '../../types';
import { productsService, inventoryRequestsService } from '../../services/supabase.service';
import { systemLogsService } from '../../services/system-logs.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { canViewCostPrice } from '../../utils/roles';
import { logger } from '../../utils/logger';
import { ProfileTab } from './product-control/ProfileTab';
import { UnitTab, UnitConfig, SellMode } from './product-control/UnitTab';
import { PricingTab, PricingConfig } from './product-control/PricingTab';
import { StockTab, StockConfig } from './product-control/StockTab';
import { getSellUnit } from '../../utils/units';
import { getCountryProfile } from '../../utils/localization';
import { buildPriceChangeRequest } from '../../utils/pricingGovernance';

type ModalTab = 'profile' | 'unit' | 'pricing' | 'stock';

interface Props {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    currencySymbol?: string;
}

function modeFromUnit(unitCode?: string): SellMode {
    if (!unitCode) return 'count';
    const u = getSellUnit(unitCode);
    if (u.category === 'weight') return 'weight';
    if (u.category === 'volume') return 'volume';
    return 'count';
}

export const ProductControlModal: React.FC<Props> = ({ product, isOpen, onClose, onSaved, currencySymbol }) => {
    const { user, showToast } = useStore();
    const { refreshData, updateProduct, updatePricesBySKU, sites, allProducts, effectiveCountry, settings } = useData();
    const activeCountry = (effectiveCountry || settings?.country || 'ET') as any;
    const dynamicCurrency = currencySymbol || getCountryProfile(activeCountry).currencySymbol || 'ETB';
    const showCost = canViewCostPrice(user?.role);
    const isCEO = user?.role === 'group_ceo';
    const canDirectEdit = isCEO;

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

            if (!canDirectEdit) {
                // Zero Autonomous Authority: Non-CEO staff submit for CEO approval
                await inventoryRequestsService.create({
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    siteId: product.siteId || (product as any).site_id || '',
                    countryCode: activeCountry,
                    changeType: 'edit',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    proposedChanges: { ...product, ...updatePayload },
                    adjustmentReason: `Unit & Packaging config update to ${unitCfg.sellUnit}`,
                });

                try {
                    await systemLogsService.create({
                        action: 'PRODUCT_UNIT_CHANGE_REQUESTED',
                        details: {
                            productId: product.id,
                            sku: product.sku,
                            requestedUnit: unitCfg.sellUnit,
                            siteId: product.siteId,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: product.siteId,
                        country_code: activeCountry,
                        entity_type: 'inventory_request',
                        entity_id: product.id,
                    });
                } catch (logErr) {
                    logger.warn('ProductControlModal', 'Failed to log unit request', { error: String(logErr) });
                }

                showToast('Selling configuration submitted for CEO approval', 'info');
            } else {
                // CEO direct edit - strictly respects country boundaries
                const scope = unitCfg.scope || 'single';
                if (scope === 'all' && product.sku) {
                    const countrySiteIds = new Set((sites || []).map(s => s.id));
                    const matchingProducts = (allProducts || []).filter(
                        p => p.sku === product.sku && countrySiteIds.has(p.siteId || (p as any).site_id || '')
                    );
                    if (matchingProducts.length > 0) {
                        await Promise.all(matchingProducts.map(p => updateProduct({ ...p, ...updatePayload })));
                    } else {
                        await updateProduct({ ...product, ...updatePayload });
                    }
                    showToast(`Selling configuration updated across national network for SKU ${product.sku}`, 'success');
                } else if (scope === 'custom' && (unitCfg.selectedSiteIds || []).length > 0) {
                    const targetSiteIds = new Set(unitCfg.selectedSiteIds);
                    const matchingProducts = (allProducts || []).filter(
                        p => (p.sku === product.sku || p.id === product.id) && targetSiteIds.has(p.siteId || (p as any).site_id || '')
                    );
                    if (matchingProducts.length > 0) {
                        await Promise.all(matchingProducts.map(p => updateProduct({ ...p, ...updatePayload })));
                    } else {
                        await updateProduct({ ...product, ...updatePayload });
                    }
                    showToast(`Selling configuration updated across ${targetSiteIds.size} selected location(s)`, 'success');
                } else {
                    await updateProduct({ ...product, ...updatePayload });
                    showToast('Selling & Packaging Configuration saved for this location', 'success');
                }
            }

            await refreshData(['products']);
            onSaved?.();
        } catch (err: any) {
            logger.error('ProductControlModal', 'Failed to save unit config', err);
            showToast(err?.message || 'Failed to save configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePricing = async () => {
        if (!product) return;
        setIsSaving(true);
        try {
            const updates = {
                price: pricingCfg.price,
                costPrice: pricingCfg.costPrice,
                salePrice: pricingCfg.salePrice,
                isOnSale: pricingCfg.isOnSale,
                competitorPrice: pricingCfg.competitorPrice,
            };

            if (!canDirectEdit) {
                // Scoped staff prepare a price proposal for a merchandising lead.
                const priceRequest = buildPriceChangeRequest({
                    product,
                    proposal: {
                        price: pricingCfg.price,
                        costPrice: pricingCfg.costPrice,
                        salePrice: pricingCfg.salePrice,
                        isOnSale: pricingCfg.isOnSale,
                    },
                    requestedBy: user?.name || 'Unknown',
                    countryCode: activeCountry,
                    source: 'Product control pricing update',
                });
                await inventoryRequestsService.create(priceRequest);

                try {
                    await systemLogsService.create({
                        action: 'PRODUCT_PRICE_CHANGE_REQUESTED',
                        details: {
                            productId: product.id,
                            sku: product.sku,
                            price: pricingCfg.price,
                            costPrice: pricingCfg.costPrice,
                            salePrice: pricingCfg.salePrice,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: product.siteId,
                        country_code: activeCountry,
                        entity_type: 'inventory_request',
                        entity_id: product.id,
                    });
                } catch (logErr) {
                    logger.warn('ProductControlModal', 'Failed to log pricing request', { error: String(logErr) });
                }

                showToast('Pricing proposal submitted for merchandising lead approval', 'info');
            } else {
                // CEO direct edit: strictly partitioned by country
                if (pricingCfg.scope === 'single') {
                    await updateProduct({ ...product, ...updates });
                    showToast(`Pricing saved for ${product.location || 'this location'}`, 'success');
                } else if (pricingCfg.scope === 'all') {
                    await updateProduct({ ...product, ...updates });
                    if (product.sku) {
                        const nationalSiteIds = (sites || []).map(s => s.id);
                        await updatePricesBySKU(product.sku, updates, nationalSiteIds);
                    }
                    showToast(`Pricing synchronized across all national locations for SKU ${product.sku}`, 'success');
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

                    showToast(`Pricing updated across ${targetSiteIds.size} selected location(s)`, 'success');
                }
            }

            await refreshData(['products']);
            onSaved?.();
        } catch (err: any) {
            logger.error('ProductControlModal', 'Failed to save pricing', err);
            showToast(err?.message || 'Failed to save pricing', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStock = async () => {
        if (!product) return;
        setIsSaving(true);
        try {
            const stockUpdates = {
                minStock: stockCfg.minStock === '' ? undefined : parseInt(stockCfg.minStock),
                maxStock: stockCfg.maxStock === '' ? undefined : parseInt(stockCfg.maxStock),
            };

            if (!canDirectEdit) {
                // Zero Autonomous Authority: Submit stock policy update for CEO approval
                await inventoryRequestsService.create({
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    siteId: product.siteId || (product as any).site_id || '',
                    countryCode: activeCountry,
                    changeType: 'edit',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    proposedChanges: { ...product, ...stockUpdates },
                    adjustmentReason: `Stock policy update: Min ${stockCfg.minStock}, Max ${stockCfg.maxStock}`,
                });

                try {
                    await systemLogsService.create({
                        action: 'PRODUCT_STOCK_POLICY_REQUESTED',
                        details: {
                            productId: product.id,
                            sku: product.sku,
                            minStock: stockCfg.minStock,
                            maxStock: stockCfg.maxStock,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: product.siteId,
                        country_code: activeCountry,
                        entity_type: 'inventory_request',
                        entity_id: product.id,
                    });
                } catch (logErr) {
                    logger.warn('ProductControlModal', 'Failed to log stock policy request', { error: String(logErr) });
                }

                showToast('Stock policy changes submitted for CEO approval', 'info');
            } else {
                await updateProduct({
                    ...product,
                    ...stockUpdates,
                });
                showToast('Stock policies saved', 'success');
            }

            await refreshData(['products']);
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

    const inputCls = 'w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-medium text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[var(--theme-bg-card)] rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-[var(--theme-border)] overflow-hidden">

                {/* Header */}
                <div className="flex items-start gap-4 p-5 border-b border-[var(--theme-border)] flex-shrink-0 bg-[var(--theme-bg-subtle)]">
                    <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image && !product.image.includes('placeholder.com') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={20} className="text-[var(--theme-text-secondary)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                                {product.sku}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase">{product.category}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] truncate mt-0.5">{product.name}</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] truncate">Location: {product.location || 'Default Shelf'}</p>
                    </div>
                    <button onClick={onClose} title="Close" aria-label="Close" className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/50 px-5 flex-shrink-0 gap-1 pt-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-accent)] shadow-xs border-t border-x border-[var(--theme-border)] -mb-px'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50'
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
                        <ProfileTab product={product} currencySymbol={dynamicCurrency} />
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
                            currencySymbol={dynamicCurrency}
                            canDirectEdit={canDirectEdit}
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
