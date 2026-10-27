import { useProductControlProposals } from '../../hooks/useProductControlProposals';
import { PriceBatchPreview } from './components/PriceBatchPreview';
import { formatLocationIdentity } from '../../utils/locationIdentity';
import React, { useState, useEffect } from 'react';
import { X, Package, Scale, DollarSign, Layers, Info } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { canViewCostPrice } from '../../utils/roles';
import { ProfileTab } from './product-control/ProfileTab';
import { UnitTab, UnitConfig, SellMode } from './product-control/UnitTab';
import { PricingTab, PricingConfig } from './product-control/PricingTab';
import { StockTab, StockConfig } from './product-control/StockTab';
import { getSellUnit } from '../../utils/units';
import { getCountryProfile } from '../../utils/localization';

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
    const { user } = useStore();
    const { sites, allProducts, effectiveCountry, settings } = useData();
    const activeCountry = (effectiveCountry || settings?.country || 'ET') as any;
    const dynamicCurrency = currencySymbol || getCountryProfile(activeCountry).currencySymbol || 'ETB';
    const showCost = canViewCostPrice(user?.role);
    const canDirectEdit = false;
    const proposals = useProductControlProposals(product, activeCountry, onSaved);
    const isSaving = proposals.isSaving;

    const [activeTab, setActiveTab] = useState<ModalTab>('pricing');

    const [unitCfg, setUnitCfg] = useState<UnitConfig>({
        sellMode: 'count', sellUnit: 'UNIT', physicalQty: '', physicalUnit: 'g', packOf: '', caseOf: '', label: '', scope: 'single', selectedSiteIds: []
    });
    const [pricingCfg, setPricingCfg] = useState<PricingConfig>({
        price: 0, costPrice: 0, salePrice: 0, isOnSale: false, competitorPrice: 0, scope: 'single', selectedSiteIds: []
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
            scope: 'single',
            selectedSiteIds: allSiteIds.length > 0 ? allSiteIds : [product.siteId || '']
        });
        setStockCfg({
            minStock: product.minStock != null ? String(product.minStock) : '',
            maxStock: product.maxStock != null ? String(product.maxStock) : ''
        });
    }, [product]);

    if (!isOpen || !product) return null;

    const handleSaveUnit = () => proposals.saveUnit(unitCfg);
    const handleSavePricing = () => proposals.preparePricing(pricingCfg);
    const handleSaveStock = () => proposals.saveStock(stockCfg);

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

                <PriceBatchPreview batch={proposals.priceBatch} failures={proposals.batchFailures} sites={sites} currency={dynamicCurrency} pending={isSaving} onConfirm={proposals.confirmPricing} onClose={proposals.cancelPricing} />
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
                        <p className="text-xs text-[var(--theme-text-secondary)] truncate">Location: {formatLocationIdentity(product.location) || 'Unassigned'}</p>
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
