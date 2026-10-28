import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMerchandising } from './MerchandisingContext';
import { useMerchandisingForecastData } from '../../hooks/useMerchandisingForecastData';
import { useData } from '../../contexts/DataContext';
import { CreatePOModal } from '../procurement/CreatePOModal';
import { DemandChartSection } from './forecast/DemandChartSection';
import { ForecastInsightsSection } from './forecast/ForecastInsightsSection';
import { ReplenishmentTableSection } from './forecast/ReplenishmentTableSection';
import { generateDemandChartData, type ReplenishmentRecommendation } from '../../utils/merchandisingForecast';
import { analyzeForecastSnapshot } from '../../utils/forecastSnapshot';
import { useForecastReplenishment } from '../../hooks/useForecastReplenishment';
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


    // Rule 10 & Gap 4: Load 30-day completed sales dataset, open POs, and catalog products
    const { data: forecastDataset, isLoading, isError, isFetching, refetch } = useMerchandisingForecastData(true);

    const request = useForecastReplenishment(effectiveCountry, activeSite?.id, user?.id);
    const [requestMessage, setRequestMessage] = useState('');
    const currentScope = `${effectiveCountry}:${activeSite?.id}:${user?.id}`;
    const scopeRef = useRef(currentScope);
    scopeRef.current = currentScope;
    useEffect(() => { setIsPOModalOpen(false); setSelectedPOProduct(null); setRequestMessage(''); request.reset(); }, [activeSite?.id, effectiveCountry]);

    const analysis = useMemo(() => forecastDataset ? analyzeForecastSnapshot(forecastDataset) : null, [forecastDataset]);
    const recommendedOrders = analysis?.recommendations || [];
    const consolidatedInventory = analysis?.consolidated || [];
    const weeklyDemand = { weeklyActuals: analysis?.weeklyActuals || [0, 0, 0, 0], totalSales: analysis?.totalSales || 0 };
    const { chartData, confidencePct, confidenceLabel } = generateDemandChartData(weeklyDemand.weeklyActuals, weeklyDemand.totalSales, forecastDataset ? new Date(forecastDataset.asOf) : new Date());
    const requestInternal = async (rec: ReplenishmentRecommendation) => {
        if (rec.blockedReason || isFetching || isError || request.isPending) return;
        const submittedScope = currentScope;
        setRequestMessage('');
        try {
            const result = await request.mutateAsync({ productId: rec.product.id, quantity: rec.suggestedBuySellable, country: effectiveCountry!, siteId: activeSite!.id });
            if (scopeRef.current !== submittedScope) return;
            setRequestMessage(result.existing ? 'An active request already exists for this product. No duplicate was created.' : 'Internal replenishment request saved. Source approval is pending.');
        } catch (error) {
            if (scopeRef.current !== submittedScope) return;
            setRequestMessage(error instanceof Error ? error.message : 'The request could not be saved.');
        }
    };

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
                    customAttributes: { ...(product.customAttributes || {}), packaging: { ...(product.customAttributes?.packaging || {}), packQty: Number(packaging.packOf) || 1, caseSize: Number(packaging.caseOf) || 0 } },
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
                <p>Completed sales form the baseline. Products with refunded receipts are flagged for reconciliation and blocked from ordering because historical net quantities are unavailable. Baseline assumes the next 30 days match the observed period; seasonality and promotions are not modelled.</p>
                <p>Chart totals combine selling units across products; they are an activity trend, not a purchase quantity.</p>
                <p>Stock includes recorded reservations and expired stock deductions. Purchase orders offset demand only when their recorded delivery date precedes projected stockout. Other incoming stock requires review.</p>
                {forecastDataset && <p>Observed {new Date(forecastDataset.start).toLocaleDateString()}–{new Date(forecastDataset.asOf).toLocaleDateString()} · Updated {new Date(forecastDataset.asOf).toLocaleTimeString()}</p>}
                <button type="button" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Refreshing…' : 'Refresh analysis'}</button>
            </div>
            {requestMessage && <p role="status" className="text-sm text-[var(--theme-text-primary)]">{requestMessage}</p>}
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
                canRequestInternal={['group_ceo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'country_commercial_director', 'regional_operations_manager', 'regional_supply_chain_manager', 'regional_merchandising_manager', 'merchandising_specialist', 'merchandiser', 'store_manager', 'inventory_manager'].includes(user?.role || '') && !['Warehouse', 'Distribution Center', 'Administration'].includes(activeSite.type || '') && !isFetching}
                onRequestInternal={requestInternal}
                requestPending={request.isPending}
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
