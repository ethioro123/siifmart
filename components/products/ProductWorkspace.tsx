import { createPortal } from 'react-dom';
import { useProductWorkspaceRecord } from '../../hooks/useProductWorkspaceRecord';
import { ProductOverview } from './ProductOverview';
import { ProductChangesTab } from './ProductChangesTab';
import { useProductChanges } from '../../hooks/useProductChanges';
import { getRoleHierarchy } from '../../utils/roles';
import { useProductControlProposals } from '../../hooks/useProductControlProposals';
import { PriceBatchPreview } from '../merchandising/components/PriceBatchPreview';
import { initialUnitConfig } from '../../utils/productControlLogic';
import { productSiteName } from '../../utils/priceManager';
import type { ProfileConfig } from '../../types/product-control';
import { useProductControlDialog } from '../../hooks/useProductControlDialog';
import { formatLocationIdentity } from '../../utils/locationIdentity';
import React, { useState, useEffect, useId, useRef } from 'react';
import { X, Package, Scale, DollarSign, Layers, Info, History, PackageSearch, type LucideIcon } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { canViewCostPrice } from '../../utils/roles';
import { ProfileTab } from '../merchandising/product-control/ProfileTab';
import { UnitTab, UnitConfig } from '../merchandising/product-control/UnitTab';
import { PricingTab, PricingConfig } from '../merchandising/product-control/PricingTab';
import { StockTab, StockConfig } from '../merchandising/product-control/StockTab';
import { getCountryProfile } from '../../utils/localization';

export type ProductWorkspaceTab = 'overview' | 'profile' | 'unit' | 'pricing' | 'stock' | 'history';
type ModalTab = ProductWorkspaceTab;

interface Props {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    currencySymbol?: string;
    initialTab?: ProductWorkspaceTab;
    readOnly?: boolean;
}

export const ProductWorkspace: React.FC<Props> = ({ product: selectedProduct, isOpen, onClose, onSaved, currencySymbol, initialTab = 'pricing', readOnly = false }) => {
    const { user } = useStore();
    const { sites, allProducts, effectiveCountry, settings } = useData();
    const activeCountry = (effectiveCountry || settings?.country || 'ET') as any;
    const record = useProductWorkspaceRecord(selectedProduct, activeCountry, isOpen);
    const product = record.data || selectedProduct;
    const previousCountry = useRef(activeCountry);
    useEffect(() => {
        if (previousCountry.current !== activeCountry && isOpen) onClose();
        previousCountry.current = activeCountry;
    }, [activeCountry, isOpen, onClose]);
    const dynamicCurrency = currencySymbol || getCountryProfile(activeCountry).currencySymbol || 'ETB';
    const showCost = canViewCostPrice(user?.role);
    const canDirectEdit = false;
    const proposals = useProductControlProposals(product, activeCountry, onSaved);
    const isSaving = proposals.isSaving;
    const titleId = useId();
    const dialogRef = useProductControlDialog(isOpen, Boolean(proposals.priceBatch), isSaving, onClose);
    const [profileCfg, setProfileCfg] = useState<ProfileConfig>({ name: '', brand: '', description: '' });
    const [submitted, setSubmitted] = useState<Partial<Record<ModalTab, string>>>({});

    const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

    const [historyPage, setHistoryPage] = useState(1);
    const canEdit = !readOnly && getRoleHierarchy(user?.role || '') >= 70;
    const changes = useProductChanges(isOpen ? product : null, activeCountry, historyPage, activeTab === 'history' && isOpen);
    const [unitCfg, setUnitCfg] = useState<UnitConfig>({
        sellMode: 'count', sellUnit: 'UNIT', physicalQty: '', physicalUnit: 'g', packOf: '', caseOf: '', label: '', scope: 'single', selectedSiteIds: []
    });
    const [pricingCfg, setPricingCfg] = useState<PricingConfig>({
        price: 0, costPrice: 0, salePrice: 0, isOnSale: false, competitorPrice: 0, scope: 'single', selectedSiteIds: []
    });
    const [stockCfg, setStockCfg] = useState<StockConfig>({ minStock: '', maxStock: '' });

    useEffect(() => {
        if (!product) return;
        setActiveTab(canEdit ? initialTab : 'overview');
        setHistoryPage(1);
        setProfileCfg({ name: product.name, brand: product.brand || '', description: product.description || '' });
        setUnitCfg(initialUnitConfig(product));
        setSubmitted({});
        proposals.clearFeedback();
        setPricingCfg({
            price: product.price || 0,
            costPrice: product.costPrice || 0,
            salePrice: product.salePrice || 0,
            isOnSale: product.isOnSale || false,
            competitorPrice: product.competitorPrice || 0,
            scope: 'single',
            selectedSiteIds: [product.siteId || product.site_id || ''].filter(Boolean)
        });
        setStockCfg({
            minStock: product.minStock != null ? String(product.minStock) : '',
            maxStock: product.maxStock != null ? String(product.maxStock) : ''
        });
    }, [product?.id, isOpen]);

    if (!isOpen || !product) return null;

    const markSubmitted = async (tab: ModalTab, signature: string, save: () => Promise<boolean | undefined>) => {
        if (await save()) setSubmitted(previous => ({ ...previous, [tab]: signature }));
    };
    const handleSaveProfile = () => markSubmitted('profile', JSON.stringify(profileCfg), () => proposals.saveProfile(profileCfg));
    const handleSaveUnit = () => markSubmitted('unit', JSON.stringify(unitCfg), () => proposals.saveUnit(unitCfg));
    const handleSavePricing = () => proposals.preparePricing(pricingCfg);
    const handleSaveStock = () => markSubmitted('stock', JSON.stringify(stockCfg), () => proposals.saveStock(stockCfg));
    const handleConfirmPrice = () => markSubmitted('pricing', JSON.stringify(pricingCfg), proposals.confirmPricing);

    const tabs: { id: ModalTab; label: string; icon: LucideIcon }[] = [
        { id: 'overview', label: 'Overview', icon: PackageSearch },
        { id: 'unit', label: 'Specifications & Packaging', icon: Scale },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'stock', label: 'Stock Policy', icon: Layers },
        { id: 'history', label: 'Changes & History', icon: History },
    ].filter(tab => canEdit || ['overview','unit','history'].includes(tab.id)) as { id: ModalTab; label: string; icon: LucideIcon }[];

    const inputCls = 'w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-medium text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors';

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
            <div className="relative bg-[var(--theme-bg-card)] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94dvh] flex flex-col border border-[var(--theme-border)] overflow-hidden">

                <PriceBatchPreview batch={proposals.priceBatch} failures={proposals.batchFailures} sites={sites} currency={dynamicCurrency} pending={isSaving} onConfirm={handleConfirmPrice} onClose={proposals.cancelPricing} />
                {/* Header */}
                <div className="flex items-start gap-3 p-4 sm:p-5 border-b border-[var(--theme-border)] flex-shrink-0 bg-[var(--theme-bg-subtle)]">
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
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{product.category}</span>
                        </div>
                        <h3 id={titleId} className="mt-1 text-xl font-semibold leading-snug text-[var(--theme-text-primary)]">{product.name}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--theme-text-secondary)]">{productSiteName(product, sites)} <span aria-hidden="true">·</span> {formatLocationIdentity(product.location)}</p>
                    </div>
                    <button disabled={isSaving} onClick={onClose} title="Close" aria-label="Close" className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div role="tablist" aria-label="Product detail sections" className="flex overflow-x-auto border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/50 px-5 flex-shrink-0 gap-1 pt-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            id={`${titleId}-${tab.id}-tab`} role="tab" aria-selected={activeTab === tab.id}
                            aria-controls={`${titleId}-${tab.id}-panel`} tabIndex={activeTab === tab.id ? 0 : -1}
                            onKeyDown={event => {
                                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                                event.preventDefault();
                                const index = tabs.findIndex(item => item.id === activeTab);
                                const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                                setActiveTab(tabs[next].id);
                                document.getElementById(`${titleId}-${tabs[next].id}-tab`)?.focus();
                            }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap text-sm font-medium rounded-t-xl transition-all cursor-pointer ${
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
                <div id={`${titleId}-${activeTab}-panel`} role="tabpanel" aria-labelledby={`${titleId}-${activeTab}-tab`} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                    {record.isError && <p role="alert" className="mb-4 text-sm">The latest product record could not be loaded. Displaying the selected snapshot.</p>}
                    {changes.pending.isError && <p role="alert" className="mb-4 text-sm">Pending-change check unavailable. Review Changes & History before submitting edits.</p>}
                    {changes.pending.data && changes.pending.data.totalCount > 0 && activeTab !== 'history' && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-sm"><p>{changes.pending.data.totalCount} pending proposal(s) already exist for this product location. Review them to avoid conflicting edits.</p><button className="min-h-[44px] underline" onClick={() => setActiveTab('history')}>Review pending changes</button></div>}
                    {canEdit && <p className="mb-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">Scope: this product record at {productSiteName(product, sites)}. Identity and specification proposals apply to this location record. Country-master changes and other locations require their own authorized review.</p>}
                    {proposals.lastSubmitted && <p role="status" className="mb-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-sm">{proposals.lastSubmitted} submitted for review. Recorded values stay active until approval.</p>}
                    {activeTab === 'overview' && <ProductOverview product={product} currency={dynamicCurrency} />}
                    {activeTab === 'history' && <><ProductChangesTab product={product} country={activeCountry} currency={dynamicCurrency} changes={changes} allowDecisions={canEdit} /><div className="mt-4 flex items-center justify-between gap-3 text-sm"><button className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-4 disabled:opacity-50" disabled={historyPage === 1} onClick={() => setHistoryPage(page => page - 1)}>Previous</button><span>History page {historyPage}</span><button className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-4 disabled:opacity-50" disabled={!changes.history.data?.hasMore && (changes.prices.data?.length || 0) < 10} onClick={() => setHistoryPage(page => page + 1)}>Next</button></div></>}
                    {activeTab === 'unit' && canEdit && (
                        <ProfileTab product={product} currencySymbol={dynamicCurrency} siteName={productSiteName(product, sites)} showCost={showCost} profileCfg={profileCfg} setProfileCfg={setProfileCfg} handleSaveProfile={handleSaveProfile} isSaving={isSaving} submitted={submitted.profile === JSON.stringify(profileCfg)} />
                    )}

                    {activeTab === 'unit' && (
                        <UnitTab
                            product={product}
                            unitCfg={unitCfg}
                            setUnitCfg={setUnitCfg}
                            handleSaveUnit={handleSaveUnit}
                            readOnly={!canEdit}
                            submitted={submitted.unit === JSON.stringify(unitCfg)}
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
                            submitted={submitted.pricing === JSON.stringify(pricingCfg)}
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
                            submitted={submitted.stock === JSON.stringify(stockCfg)}
                            isSaving={isSaving}
                            sellUnit={product.unit || 'UNIT'}
                        />
                    )}
                </div>
            </div>
        </div>, document.body
    );
};
