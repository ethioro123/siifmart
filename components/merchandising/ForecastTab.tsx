import React, { useState, useMemo, useEffect } from 'react';
import { useMerchandising } from './MerchandisingContext';
import { useMerchandisingForecastData } from '../../hooks/useMerchandisingForecastData';
import { useData } from '../../contexts/DataContext';
import { CreatePOModal } from '../procurement/CreatePOModal';
import { DemandChartSection } from './forecast/DemandChartSection';
import { ForecastInsightsSection } from './forecast/ForecastInsightsSection';
import { ReplenishmentTableSection } from './forecast/ReplenishmentTableSection';
import {
    consolidateInventoryBySku,
    computeWeeklyDemand,
    generateDemandChartData,
    buildReplenishmentQueue,
    type ReplenishmentRecommendation
} from '../../utils/merchandisingForecast';
import { buildCatalogSalesMetricsIndex } from '../../utils/merchandisingAnalytics';
import { useStore } from '../../contexts/CentralStore';
import { hasPermission } from '../../utils/permissions';
import { initialUnitConfig } from '../../utils/productControlLogic';
import type { PurchaseOrder } from '../../types';

export const ForecastTab: React.FC = () => {
    const { addNotification, refreshData } = useMerchandising();
    const { activeSite, effectiveCountry } = useData();
    const { user } = useStore();
    const canCreatePO = hasPermission(user?.role, 'CREATE_PO') && ['Warehouse', 'Distribution Center'].includes(activeSite?.type || '');
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [selectedPOProduct, setSelectedPOProduct] = useState<PurchaseOrder | null>(null);

    useEffect(() => { setIsPOModalOpen(false); setSelectedPOProduct(null); }, [activeSite?.id, effectiveCountry]);

    // Rule 10 & Gap 4: Load 30-day completed sales dataset, open POs, and catalog products
    const { data: forecastDataset, isLoading, isError, isFetching, refetch } = useMerchandisingForecastData(true);

    const activeProducts = forecastDataset?.products || [];
    const sales30d = forecastDataset?.sales30d || [];
    const openPOs = forecastDataset?.openPOs || [];
    const openTransfers = forecastDataset?.openTransfers || [];

    // Pure 30-day POS sales metrics computed per product
    const salesMetricsIndex = useMemo(() => {
        return buildCatalogSalesMetricsIndex(activeProducts, sales30d, forecastDataset ? new Date(forecastDataset.asOf) : new Date());
    }, [activeProducts, sales30d]);

    // Gap 9: Consolidate inventory by SKU/site; Gap 8: Preserve minStock 0; Gap 7: Subtract pipeline
    const consolidatedInventory = useMemo(() => {
        return consolidateInventoryBySku(activeProducts, openPOs, openTransfers, activeSite?.id);
    }, [activeProducts, openPOs, openTransfers, activeSite?.id]);

    // Build replenishment recommendations
    const recommendedOrders = useMemo(() => {
        return buildReplenishmentQueue(consolidatedInventory, salesMetricsIndex);
    }, [consolidatedInventory, salesMetricsIndex]);

    // Gap 1: 4-week actual sales from real completed sales data
    const weeklyDemand = useMemo(() => {
        return computeWeeklyDemand(sales30d, activeSite?.id, effectiveCountry, forecastDataset ? new Date(forecastDataset.asOf) : new Date());
    }, [sales30d, activeSite?.id, effectiveCountry]);

    // Gap 1 & 2: Real regression forecast and statistical confidence (no fake 94.8% or stock multipliers)
    const { chartData, confidencePct, confidenceLabel } = useMemo(() => {
        return generateDemandChartData(weeklyDemand.weeklyActuals, weeklyDemand.totalSales, forecastDataset ? new Date(forecastDataset.asOf) : new Date());
    }, [weeklyDemand]);

    // Gap 5 & 6: PO Initiation with accurate pack multiplier and zero cost guessing
    const handleInitiatePO = (rec: ReplenishmentRecommendation) => {
        const { product, packSize, suggestedBuyPacks, suggestedBuySellable, unitCost, orderUnitCost, totalCost, costUnrecorded } = rec;
        if (!canCreatePO || isFetching || isError || costUnrecorded || rec.blockedReason) return;
        const supplierId = product.preferredSupplierId || '';
        const packaging = initialUnitConfig(product);
        const supplierName = '';

        const prefilledPO: Partial<PurchaseOrder> = {
            supplierId: supplierId,
            supplierName: supplierName,
            siteId: product.siteId || activeSite?.id || '',
            priority: rec.urgency === 'high' ? 'High' : 'Normal',
            notes: `Demand review draft for ${product.name} (Suggested: ${suggestedBuySellable} selling units in ${suggestedBuyPacks} pack${suggestedBuyPacks > 1 ? 's' : ''} of ${packSize}).${costUnrecorded ? ' [Notice: Unit cost is unrecorded in catalog—enter verified cost before submission]' : ''}`,
            lineItems: [
                {
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku || '',
                    quantity: suggestedBuyPacks, // Gap 5: Order quantity in packs
                    packQuantity: Number(packaging.packOf) || 1,
                    caseSize: Number(packaging.caseOf) || 0,
                    customAttributes: product.customAttributes,
                    unitCost: orderUnitCost, // Gap 6: Accurate cost per pack, 0 if unrecorded
                    totalCost: totalCost,
                    retailPrice: product.price ? Math.round(product.price) : 0, // Gap 6: Actual retail or 0
                    identityType: 'known',
                    category: product.category || 'General',
                    brand: product.brand,
                    size: product.size,
                    unit: product.unit
                }
            ]
        };

        setSelectedPOProduct(prefilledPO as PurchaseOrder);
        setIsPOModalOpen(true);
    };

    if (!activeSite?.id || activeSite.id === 'All') return <p className="p-6 text-[var(--theme-text-secondary)]">Select a location to evaluate demand.</p>;
    if (isError) return <div role="alert" className="p-6 space-y-3 text-[var(--theme-text-primary)]"><p>Forecast data could not be loaded completely. Recommendations are unavailable.</p><button type="button" onClick={() => refetch()}>Retry loading data</button></div>;
    if (isLoading) return <p role="status" className="p-6 text-[var(--theme-text-secondary)]">Loading sales, inventory and incoming stock…</p>;
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="text-sm text-[var(--theme-text-secondary)] space-y-2">
                <p className="font-semibold text-[var(--theme-text-primary)]">{activeSite.name} · {effectiveCountry} · 30-day demand review</p>
                <p>Completed, unrefunded sales only. Partial refunds are excluded until net line quantities are available. Baseline assumes the next 30 days match the observed period; seasonality and promotions are not modelled.</p>
                <p>Chart totals combine selling units across products; they are an activity trend, not a purchase quantity.</p>
                <p>Stock includes recorded reservations, expired stock deductions and approved incoming orders. Arrival timing and unrecorded commitments require review.</p>
                {forecastDataset && <p>Observed {new Date(forecastDataset.start).toLocaleDateString()}–{new Date(forecastDataset.asOf).toLocaleDateString()} · Updated {new Date(forecastDataset.asOf).toLocaleTimeString()}</p>}
                <button type="button" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Refreshing…' : 'Refresh analysis'}</button>
            </div>
            {/* Top Grid: Demand Forecast Chart + Replenishment Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DemandChartSection
                    chartData={chartData}
                    confidencePct={confidencePct}
                    hasSalesData={weeklyDemand.totalSales > 0}
                    totalSales={weeklyDemand.totalSales}
                />

                <ForecastInsightsSection
                    recommendations={recommendedOrders}
                    confidencePct={confidencePct}
                    confidenceLabel={confidenceLabel}
                    totalProductsEvaluated={consolidatedInventory.length}
                />
            </div>

            {/* Bottom Table: Recommended Replenishment Orders with Pagination & Full Pipeline */}
            <ReplenishmentTableSection
                recommendations={recommendedOrders}
                isLoading={isLoading}
                totalProductsEvaluated={consolidatedInventory.length}
                onInitiatePO={handleInitiatePO}
                canCreatePO={canCreatePO && !isFetching}
            />

            {/* Live Create PO Modal with verified recommendation */}
            {isPOModalOpen && (
                <CreatePOModal
                    isOpen={isPOModalOpen}
                    onClose={() => {
                        setIsPOModalOpen(false);
                        setSelectedPOProduct(null);
                    }}
                    initialDraft={selectedPOProduct}
                    onSuccess={() => {
                        addNotification('success', 'Purchase order created successfully from replenishment recommendation.');
                        refetch();
                        refreshData();
                    }}
                />
            )}
        </div>
    );
};
