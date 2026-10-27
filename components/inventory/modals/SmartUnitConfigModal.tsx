import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../Modal';
import { Product } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit, SELL_UNITS } from '../../../utils/units';
import { useCreateInventoryRequestMutation } from '../../../hooks/useInventoryRequestMutations';
import { systemLogsService } from '../../../services/system-logs.service';
import { logger } from '../../../utils/logger';
import { SmartUnitIntelligencePanel } from './smart-unit/SmartUnitIntelligencePanel';
import { SmartUnitSelector } from './smart-unit/SmartUnitSelector';
import { Check, Info, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SmartUnitConfigModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

type ScopeType = 'THIS_SITE' | 'SELECTED_SITES' | 'ALL_SITES';
type CategoryType = 'count' | 'weight' | 'volume';

export const SmartUnitConfigModal: React.FC<SmartUnitConfigModalProps> = ({
    product,
    isOpen,
    onClose,
    onSaveSuccess
}) => {
    const { t } = useLanguage();
    const { sites, activeSite, updateProduct, refreshData, effectiveCountry } = useData();
    const { user, showToast } = useStore();

    // Form States
    const [scope, setScope] = useState<ScopeType>('THIS_SITE');
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
    const [category, setCategory] = useState<CategoryType>('count');
    const [selectedUnitCode, setSelectedUnitCode] = useState<string>('UNIT');
    const [isSaving, setIsSaving] = useState(false);

    const createEditRequest = useCreateInventoryRequestMutation();

    useEffect(() => {
        if (product) {
            const sellUnit = getSellUnit(product.unit);
            setCategory(sellUnit.category);
            setSelectedUnitCode(sellUnit.code);
            if (activeSite?.id) {
                setSelectedSiteIds([activeSite.id]);
            }
        }
    }, [product, activeSite]);

    const availableUnits = useMemo(() => {
        return SELL_UNITS.filter(u => u.category === category);
    }, [category]);

    const smartIntelligence = useMemo(() => {
        if (!product) return null;
        const sellUnit = getSellUnit(selectedUnitCode);
        const price = product.price || 0;

        let autoConversionText = `1 unit = 1 ${sellUnit.shortLabel}`;
        let subUnitRateText = '';

        if (sellUnit.code === 'L') {
            autoConversionText = `1 unit = 1 L = 1000 ml`;
            subUnitRateText = `${(price / 1000).toFixed(4)} ${CURRENCY_SYMBOL} per ml`;
        } else if (sellUnit.code === 'ML') {
            autoConversionText = `1 unit = 1 ml = 0.001 L`;
            subUnitRateText = `${(price * 1000).toFixed(2)} ${CURRENCY_SYMBOL} per L`;
        } else if (sellUnit.code === 'KG') {
            autoConversionText = `1 unit = 1 kg = 1000 g`;
            subUnitRateText = `${(price / 1000).toFixed(4)} ${CURRENCY_SYMBOL} per g`;
        } else if (sellUnit.code === 'G') {
            autoConversionText = `1 unit = 1 g = 0.001 kg`;
            subUnitRateText = `${(price * 1000).toFixed(2)} ${CURRENCY_SYMBOL} per kg`;
        } else if (sellUnit.code === 'CL') {
            autoConversionText = `1 unit = 1 cl = 10 ml`;
            subUnitRateText = `${(price / 10).toFixed(3)} ${CURRENCY_SYMBOL} per ml`;
        } else if (sellUnit.code === 'GAL') {
            autoConversionText = `1 unit = 1 gal = 3.785 L`;
            subUnitRateText = `${(price / 3.785).toFixed(2)} ${CURRENCY_SYMBOL} per L`;
        }

        return {
            sellUnit,
            autoConversionText,
            subUnitRateText,
            priceFormatted: `${CURRENCY_SYMBOL} ${formatPriceValue(price)}`
        };
    }, [product, selectedUnitCode]);

    if (!product) return null;

    const customAttrs = product.customAttributes || (product as any).custom_attributes;
    const supplierSpec = {
        packSize: customAttrs?.physical?.netWeight || product.size || '1 unit',
        sizeType: customAttrs?.physical?.sizeType || product.unit || 'UNIT',
        poRef: (product as any).poNumber || 'Captured on PO Receipt',
        vendorName: (product as any).supplier || product.brand || 'Supplier Record'
    };

    const handleCategoryChange = (newCat: CategoryType) => {
        setCategory(newCat);
        const defaultForCat = SELL_UNITS.find(u => u.category === newCat);
        if (defaultForCat) {
            setSelectedUnitCode(defaultForCat.code);
        }
    };

    const handleSave = async () => {
        if (!product) return;
        setIsSaving(true);
        try {
            const targetSiteIds: string[] = [];
            if (scope === 'THIS_SITE' && activeSite?.id) {
                targetSiteIds.push(activeSite.id);
            } else if (scope === 'ALL_SITES') {
                sites.forEach(s => targetSiteIds.push(s.id));
            } else if (scope === 'SELECTED_SITES') {
                targetSiteIds.push(...selectedSiteIds);
            }

            const countryCode = effectiveCountry || (activeSite as any)?.country || (user as any)?.country || 'ET';

                await createEditRequest.mutateAsync({
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    siteId: product.siteId || (product as any).site_id || activeSite?.id || '',
                    countryCode,
                    changeType: 'edit',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    proposedChanges: { unit: selectedUnitCode },
                    adjustmentReason: `Smart unit change to ${selectedUnitCode}`,
                });

                // Tamper-proof audit trail
                try {
                    await systemLogsService.create({
                        action: 'PRODUCT_UNIT_CHANGE_REQUESTED',
                        details: {
                            productId: product.id,
                            sku: product.sku,
                            name: product.name,
                            previousUnit: product.unit,
                            requestedUnit: selectedUnitCode,
                            scope,
                            targetSiteIds,
                        },
                        module: 'Inventory',
                        user_name: user?.name || 'Unknown',
                        employee_id: user?.id,
                        site_id: product.siteId || (product as any).site_id || activeSite?.id,
                        country_code: countryCode,
                        entity_type: 'inventory_request',
                        entity_id: product.id,
                    });
                } catch (logErr) {
                    logger.warn('SmartUnitConfigModal', 'Failed to log unit request', { error: String(logErr) });
                }

                showToast(
                    `Unit change to ${selectedUnitCode} submitted for Operations, Supply Chain and Merchandising approval`,
                    'info'
                );

            if (onSaveSuccess) onSaveSuccess();
            await refreshData(['products']);
            onClose();
        } catch (error: any) {
            logger.error('SmartUnitConfigModal', 'Failed to update unit config', error);
            showToast(error?.message || 'Failed to save smart unit configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Smart Intelligence Unit & Selling Spec"
            size="xl"
        >
            <div className="space-y-6 text-[var(--theme-text-primary)]">
                {/* Main 2-Column Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Intelligence Panel */}
                    <SmartUnitIntelligencePanel
                        product={product}
                        smartIntelligence={smartIntelligence}
                        supplierSpec={supplierSpec}
                    />

                    {/* Right Column: How You Sell It Form */}
                    {/* Right Column: How You Sell It Form */}
                    <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">How You Sell It</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                                Requires 3 approvals
                            </span>
                        </div>

                        {/* Step 0: Location Scope */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-accent)] text-white text-[11px] flex items-center justify-center font-bold">0</span>
                                Apply to which location(s)?
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScope('THIS_SITE')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'THIS_SITE'
                                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs ring-1 ring-[var(--theme-accent)]/30'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">This Site</p>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-mono truncate">{activeSite?.name || 'Current'}</p>
                                        </div>
                                        {scope === 'THIS_SITE' && <CheckCircle2 size={14} className="text-[var(--theme-accent)] shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScope('SELECTED_SITES')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'SELECTED_SITES'
                                                ? 'bg-amber-500/10 border-amber-500 text-[var(--theme-text-primary)] shadow-xs ring-1 ring-amber-500/30'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">Several Places</p>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-mono">{selectedSiteIds.length} selected</p>
                                        </div>
                                        {scope === 'SELECTED_SITES' && <CheckCircle2 size={14} className="text-amber-500 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScope('ALL_SITES')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                            scope === 'ALL_SITES'
                                                ? 'bg-blue-500/10 border-blue-500 text-[var(--theme-text-primary)] shadow-xs ring-1 ring-blue-500/30'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">All Locations</p>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-mono">{sites.length} sites</p>
                                        </div>
                                        {scope === 'ALL_SITES' && <CheckCircle2 size={14} className="text-blue-500 shrink-0" />}
                                    </button>
                                </div>

                                {scope === 'SELECTED_SITES' && (
                                    <div className="bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] p-3 grid grid-cols-2 gap-1.5 max-h-[130px] overflow-y-auto">
                                        {sites.map(site => (
                                            <label key={site.id} className="flex items-center gap-2 text-[11px] font-medium cursor-pointer p-1.5 hover:bg-[var(--theme-bg-card-hover)] rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSiteIds.includes(site.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSiteIds([...selectedSiteIds, site.id]);
                                                        } else {
                                                            setSelectedSiteIds(selectedSiteIds.filter(id => id !== site.id));
                                                        }
                                                    }}
                                                    className="rounded border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]"
                                                />
                                                <span className="truncate text-[var(--theme-text-primary)]">{site.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 1 & 2: Unit Category and Selling Unit Selection */}
                        <SmartUnitSelector
                            category={category}
                            onCategoryChange={handleCategoryChange}
                            availableUnits={availableUnits}
                            selectedUnitCode={selectedUnitCode}
                            onSelectUnit={(code) => setSelectedUnitCode(code)}
                        />

                        {/* Smart Conversion Summary Box */}
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] font-bold uppercase text-[11px]">
                                <Info size={13} className="text-[var(--theme-accent)]" />
                                <span>Smart Conversion Summary</span>
                            </div>
                            <p className="font-medium text-[var(--theme-text-secondary)]">
                                Checkout quantity entry is configured for <span className="font-bold uppercase text-[var(--theme-text-primary)]">{smartIntelligence?.sellUnit.label} ({smartIntelligence?.sellUnit.shortLabel})</span>.
                            </p>
                            {smartIntelligence?.sellUnit.allowDecimal && (
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                    Decimal entry enabled (step: {smartIntelligence.sellUnit.step}). Cashiers can weigh/measure fractional quantities at POS checkout.
                                </p>
                            )}
                        </div>

                        {(
                            <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300">
                                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-bold">Selling unit changes require Operations, Supply Chain and Merchandising approval. Your save will submit an inventory change request.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-semibold text-xs transition-all cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-[var(--theme-accent)] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Applying Spec…</span>
                            </>
                        ) : (
                            <>
                                <Check size={14} />
                                <span>Submit for Approval</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
