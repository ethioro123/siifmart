import React, { useState, useMemo } from 'react';
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
import type { PurchaseOrder } from '../../types';

export const ForecastTab: React.FC = () => {
    const { addNotification, refreshData } = useMerchandising();
    const { activeSite, effectiveCountry } = useData();
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [selectedPOProduct, setSelectedPOProduct] = useState<PurchaseOrder | null>(null);

    // Rule 10 & Gap 4: Load 30-day completed sales dataset, open POs, and catalog products
    const { data: forecastDataset, isLoading, refetch } = useMerchandisingForecastData(true);

    const activeProducts = forecastDataset?.products || [];
    const sales30d = forecastDataset?.sales30d || [];
    const openPOs = forecastDataset?.openPOs || [];
    const openTransfers = forecastDataset?.openTransfers || [];

    // Pure 30-day POS sales metrics computed per product
    const salesMetricsIndex = useMemo(() => {
        return buildCatalogSalesMetricsIndex(activeProducts, sales30d);
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
        return computeWeeklyDemand(sales30d, activeSite?.id, effectiveCountry);
    }, [sales30d, activeSite?.id, effectiveCountry]);

    // Gap 1 & 2: Real regression forecast and statistical confidence (no fake 94.8% or stock multipliers)
    const { chartData, confidencePct, confidenceLabel } = useMemo(() => {
        return generateDemandChartData(weeklyDemand.weeklyActuals, weeklyDemand.totalSales);
    }, [weeklyDemand]);

    // Gap 5 & 6: PO Initiation with accurate pack multiplier and zero cost guessing
    const handleInitiatePO = (rec: ReplenishmentRecommendation) => {
        const { product, packSize, suggestedBuyPacks, suggestedBuySellable, unitCost, orderUnitCost, totalCost, costUnrecorded } = rec;
        const supplierId = product.preferredSupplierId || (product as any).supplier_id || '';
        const supplierName = (product as any).supplier || '';

        const prefilledPO: Partial<PurchaseOrder> = {
            supplierId: supplierId,
            supplierName: supplierName,
            siteId: product.siteId || activeSite?.id || '',
            priority: rec.urgency === 'high' ? 'High' : 'Normal',
            notes: `AI Replenishment Order for ${product.name} (Suggested: ${suggestedBuySellable} selling units in ${suggestedBuyPacks} pack${suggestedBuyPacks > 1 ? 's' : ''} of ${packSize}).${costUnrecorded ? ' [Notice: Unit cost is unrecorded in catalog—enter verified cost before submission]' : ''}`,
            lineItems: [
                {
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku || '',
                    quantity: suggestedBuyPacks, // Gap 5: Order quantity in packs
                    packQuantity: packSize, // Pack multiplier
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

    return (
        <div className="space-y-6 animate-in fade-in">
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
