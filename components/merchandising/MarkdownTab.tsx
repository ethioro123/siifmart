import React, { useState, useMemo, useEffect } from 'react';
import { Package, Loader2, Calculator, TrendingDown, CheckCircle2, AlertTriangle, Send, Clock, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useMerchandising } from './MerchandisingContext';
import { useData } from '../../contexts/DataContext';
import { formatCompactNumber } from '../../utils/formatting';
import { useSubmitPriceChanges } from '../../hooks/useSubmitPriceChanges';
import { useProductChanges } from '../../hooks/useProductChanges';
import {
    validateMarkdownProduct,
    validateTargetExitDate,
    calculateMarkdownGlidePath
} from '../../utils/markdownGlidePath';

export const MarkdownTab: React.FC = () => {
    const {
        selectedMarkdownProduct,
        setSelectedMarkdownProduct,
        products,
        addNotification,
        activeCountry,
        currencySymbol,
        salesMetricsIndex
    } = useMerchandising();
    const { activeSite } = useData();

    const { submit, isPending: isSubmitPending } = useSubmitPriceChanges(activeCountry);
    const { pending: pendingChanges } = useProductChanges(
        selectedMarkdownProduct,
        activeCountry,
        1,
        Boolean(selectedMarkdownProduct)
    );

    const [targetExitDate, setTargetExitDate] = useState('');
    const [hasSimulated, setHasSimulated] = useState(false);
    const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Finding 6: Scope isolation - reset selection and simulation on country or site changes
    useEffect(() => {
        setSelectedMarkdownProduct(null);
        setHasSimulated(false);
        setTargetExitDate('');
        setValidationError(null);
    }, [activeCountry, activeSite?.id, setSelectedMarkdownProduct]);

    // Finding 2: Extract verified sales metrics without invented assumptions
    const currentMetrics = useMemo(() => {
        return selectedMarkdownProduct ? salesMetricsIndex?.get(selectedMarkdownProduct.id) : null;
    }, [selectedMarkdownProduct, salesMetricsIndex]);

    const productValidation = useMemo(() => {
        return validateMarkdownProduct(selectedMarkdownProduct, currentMetrics);
    }, [selectedMarkdownProduct, currentMetrics]);

    // Finding 1 & 7: Dynamic Glide Path Calculation with verified stock/cost & consistent boundaries
    const glidePathSimulation = useMemo(() => {
        if (!selectedMarkdownProduct || !hasSimulated || !targetExitDate) return null;
        return calculateMarkdownGlidePath({
            product: selectedMarkdownProduct,
            targetExitDate,
            metrics: currentMetrics
        });
    }, [selectedMarkdownProduct, hasSimulated, targetExitDate, currentMetrics]);

    const glidePathData = glidePathSimulation?.stages || [];

    // Stage 1 proposal pricing
    const stage1 = glidePathData.length >= 2 ? glidePathData[1] : null;
    const stage1Price = stage1?.price ?? 0;
    const stage1Discount = stage1?.actualDiscountPct ?? 0;

    // Finding 4: Separate active, pending, and ready-to-submit states
    const isAlreadyActiveAtPos = Boolean(
        selectedMarkdownProduct?.isOnSale &&
        selectedMarkdownProduct?.salePrice &&
        stage1 &&
        selectedMarkdownProduct.salePrice === stage1Price
    );

    const pendingRequestsList = pendingChanges.data?.data || [];
    const hasPendingProposal = pendingRequestsList.length > 0;
    const pendingRequest = pendingRequestsList[0];
    const pendingPrice = (pendingRequest?.proposedChanges as any)?.salePrice || (pendingRequest?.proposedChanges as any)?.price;

    // Finding 5: Lock submission state while saving and prevent duplicate proposals
    const isLocked = isSubmittingProposal || isSubmitPending || hasPendingProposal || isAlreadyActiveAtPos;

    // Finding 1 & 3: Validate deadline & remove fake elasticity timer
    const handleGenerate = () => {
        setValidationError(null);
        if (!selectedMarkdownProduct) return;

        if (!productValidation.isValid) {
            addNotification('alert', productValidation.reasons[0] || 'Selected product has insufficient data.');
            return;
        }

        const dateValidation = validateTargetExitDate(targetExitDate);
        if (!dateValidation.isValid) {
            setValidationError(dateValidation.errorReason || 'Invalid target exit date.');
            addNotification('alert', dateValidation.errorReason || 'Invalid target exit date.');
            return;
        }

        setHasSimulated(true);
        addNotification('success', `Markdown glide path calculated for "${selectedMarkdownProduct.name}"`);
    };

    // Finding 4, 5, 6: Submit Stage 1 Discount for Maker-Checker Approval with Scope Check
    const handleApplyPromo = async () => {
        if (isLocked || !selectedMarkdownProduct || !stage1) return;

        // Finding 6: Scope revalidation before mutation
        if (selectedMarkdownProduct.siteId && activeSite?.id && selectedMarkdownProduct.siteId !== activeSite.id) {
            addNotification('alert', 'Scope error: Product facility does not match active site.');
            setSelectedMarkdownProduct(null);
            setHasSimulated(false);
            return;
        }

        setIsSubmittingProposal(true);
        try {
            const result = await submit(
                [{
                    product: selectedMarkdownProduct,
                    proposal: {
                        price: selectedMarkdownProduct.price,
                        costPrice: selectedMarkdownProduct.costPrice,
                        isOnSale: true,
                        salePrice: stage1Price
                    }
                }],
                `Markdown clearance stage 1: ${stage1.discount} discount (${currencySymbol} ${stage1Price})`
            );
            if (result.submitted > 0) {
                setHasSimulated(false);
            }
        } catch (err: any) {
            addNotification('alert', `Failed to submit markdown proposal: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSubmittingProposal(false);
        }
    };

    // Date picker minimum: tomorrow
    const tomorrowStr = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* Left: Clearance Parameters Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 pb-3 mb-4 border-b border-[var(--theme-border)]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <TrendingDown size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Clearance Strategy</h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Automated markdown decay</p>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-5 leading-relaxed">
                        Calculate optimal discount schedules to clear slow-moving inventory by a target deadline without sacrificing unnecessary margin.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">Select Product</label>
                            <select
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                                value={selectedMarkdownProduct?.id || ''}
                                onChange={(e) => {
                                    setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null);
                                    setHasSimulated(false);
                                    setValidationError(null);
                                }}
                                aria-label="Select Product for Markdown"
                            >
                                <option value="">Choose SKU to Simulate...</option>
                                <optgroup label="Recommended for Clearance (High Days of Supply / Low Run-Rate)">
                                    {products.filter(p => {
                                        const m = salesMetricsIndex?.get(p.id);
                                        return m?.needsMarkdown ?? (p.salesVelocity === 'Low' || (p.stock || 0) > 30);
                                    }).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Catalog Products">
                                    {products.filter(p => {
                                        const m = salesMetricsIndex?.get(p.id);
                                        return !(m?.needsMarkdown ?? (p.salesVelocity === 'Low' || (p.stock || 0) > 30));
                                    }).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {selectedMarkdownProduct && (
                            <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2.5">
                                <div className="flex items-center gap-3 pb-2.5 border-b border-[var(--theme-border)]">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                                        {selectedMarkdownProduct.image && !selectedMarkdownProduct.image.includes('placeholder.com') ? (
                                            <img
                                                src={selectedMarkdownProduct.image}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <Package size={16} className="text-[var(--theme-text-secondary)]" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-xs text-[var(--theme-text-primary)] truncate leading-tight">{selectedMarkdownProduct.name}</p>
                                        <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">{selectedMarkdownProduct.sku || 'No SKU'}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--theme-text-secondary)]">Current Stock</span>
                                    <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{selectedMarkdownProduct.stock} units</span>
                                </div>
                                {currentMetrics && (
                                    <>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[var(--theme-text-secondary)]">30-Day POS Sales</span>
                                            <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">
                                                {currentMetrics.unitsSold30d} units ({currentMetrics.dailyRunRate}/day)
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[var(--theme-text-secondary)]">Days of Supply</span>
                                            <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">
                                                {currentMetrics.daysOfSupply} days
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--theme-text-secondary)]">Current Price</span>
                                    <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{formatCompactNumber(selectedMarkdownProduct.price, { currency: currencySymbol })}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--theme-text-secondary)]">Break-Even Cost</span>
                                    <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                        {selectedMarkdownProduct.costPrice ? formatCompactNumber(selectedMarkdownProduct.costPrice, { currency: currencySymbol }) : 'Unrecorded (PO required)'}
                                    </span>
                                </div>

                                {/* Finding 2: Insufficient Verified Data Banner */}
                                {!productValidation.isValid && (
                                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">Insufficient Verified Data</p>
                                            <p className="text-[11px] mt-0.5">{productValidation.reasons[0]}</p>
                                        </div>
                                    </div>
                                )}
                                {productValidation.isValid && productValidation.hasZeroVelocity && (
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-1.5 text-amber-600 dark:text-amber-400 text-[11px]">
                                        <Info size={13} className="shrink-0 mt-0.5" />
                                        <span>No sales in last 30 days. Baseline run-rate is 0 units/day.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Finding 1: Target Exit Date validation */}
                        <div>
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">Target Exit Date</label>
                            <input
                                type="date"
                                min={tomorrowStr}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium transition-colors"
                                value={targetExitDate}
                                onChange={(e) => {
                                    setTargetExitDate(e.target.value);
                                    setValidationError(null);
                                    setHasSimulated(false);
                                }}
                                aria-label="Target Exit Date"
                            />
                            {validationError && (
                                <p className="text-xs text-rose-500 font-medium mt-1">{validationError}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-5 border-t border-[var(--theme-border)] space-y-2.5 mt-4">
                    {/* Finding 3: Remove fake elasticity timer claim */}
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!selectedMarkdownProduct || !productValidation.isValid || !targetExitDate}
                        className="w-full py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-sm transition-colors"
                    >
                        <Calculator size={15} />
                        <span>Generate Glide Path</span>
                    </button>

                    {/* Finding 4 & 5: Submit for approval with active/pending status separation and repeat protection */}
                    {hasSimulated && selectedMarkdownProduct && stage1 && (
                        <div className="space-y-2 pt-1">
                            {isAlreadyActiveAtPos ? (
                                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                    <CheckCircle2 size={14} className="shrink-0" />
                                    <span>Active at POS: Stage 1 price ({currencySymbol} {stage1Price}) is currently live</span>
                                </div>
                            ) : hasPendingProposal ? (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                                    <Clock size={14} className="shrink-0" />
                                    <span>Pending Approval: Proposal for {currencySymbol} {pendingPrice} is in review</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleApplyPromo}
                                    disabled={isLocked}
                                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingProposal || isSubmitPending ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Submitting for Approval...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            <span>Submit Stage 1 Discount for Approval ({currencySymbol} {stage1Price})</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <p className="text-[10px] text-[var(--theme-text-tertiary)] text-center leading-normal">
                                Submits a price proposal to Regional Operations, Supply Chain & Merchandising Maker-Checker review.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Projected Depletion Chart & Metrics Card */}
            <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--theme-border)]">
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Projected Depletion Path</h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Inventory drawdown velocity vs dynamic price concessions
                            </p>
                        </div>
                        {selectedMarkdownProduct && glidePathSimulation && (
                            <div className="flex items-center gap-3 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1.5 rounded-full font-medium">
                                <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-[var(--theme-accent)] rounded-full"></span> Revenue</span>
                                <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Price</span>
                                <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Stock</span>
                            </div>
                        )}
                    </div>

                    {/* Finding 3: Clear assumptions disclaimer */}
                    <div className="mb-4 p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] flex items-start gap-2">
                        <Info size={14} className="shrink-0 text-[var(--theme-accent)] mt-0.5" />
                        <span>
                            <strong>Clearance Model Assumptions:</strong> Stepped price reductions capped at break-even cost (COGS). Drawdown velocity scaled from 30-day POS baseline run-rate. Final stock reflects demand drawdown without forced zero exit.
                        </span>
                    </div>

                    {selectedMarkdownProduct && glidePathSimulation ? (
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                <AreaChart data={glidePathData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} opacity={0.6} />
                                    <XAxis dataKey="week" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            border: '1px solid var(--theme-border)',
                                            borderRadius: '14px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: 'var(--theme-text-primary)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                                        }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={2.5} fillOpacity={0.08} fill="var(--theme-accent)" name="Cumulative Revenue" />
                                    <Line yAxisId="right" type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} name="Price Point" />
                                    <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#EF4444" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} name="Closing Stock" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[260px] flex flex-col items-center justify-center text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-2xl p-6">
                            <Package size={32} className="text-[var(--theme-text-tertiary)] mb-2" />
                            <p className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                {selectedMarkdownProduct
                                    ? 'Select target exit date and click "Generate Glide Path" to calculate schedule'
                                    : 'Select a product on the left to simulate markdown glide path'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Finding 7: Bottom Summary KPI Cards with Whole-Number Rounding */}
                {selectedMarkdownProduct && glidePathSimulation && (
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--theme-border)] mt-4">
                        <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Est. Clearance Rev</span>
                            <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5 block">
                                {currencySymbol} {formatCompactNumber(glidePathSimulation.projectedTotalRevenue)}
                            </span>
                        </div>
                        <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Retained Margin</span>
                            <span className="text-xs font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 block">
                                {glidePathSimulation.projectedMarginPct}%
                            </span>
                        </div>
                        <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Target Depletion</span>
                            <span className={`text-xs font-bold font-mono tabular-nums mt-0.5 flex items-center gap-1 ${
                                glidePathSimulation.isFullyCleared ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                                <CheckCircle2 size={13} />
                                {glidePathSimulation.isFullyCleared
                                    ? '100% Exit'
                                    : `${glidePathSimulation.clearancePercentage}% Exit (${glidePathSimulation.finalRemainingStock} left)`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
