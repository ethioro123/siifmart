import { ArrowRight, Package, RefreshCw } from 'lucide-react';
import { Product, PendingInventoryChange } from '../../../types';
import {
    isPriceChangeRequest,
    requiresFinanceCoApproval,
    computeMarginPct,
    effectivePrice,
    MARGIN_FLOOR_PCT
} from '../../../utils/pricingGovernance';

interface InventoryChangeDiffProps {
    change: PendingInventoryChange;
    allProducts: Product[];
}

export const renderChangeDiff = (change: PendingInventoryChange, allProducts: Product[]) => {
    if (change.changeType !== 'edit' || !change.proposedChanges) return null;

    const original = allProducts.find(p => p.id === change.productId);
    if (!original) return <span className="text-[var(--theme-text-secondary)] italic text-[11px]">Original product not found</span>;

    const diffs: React.ReactNode[] = [];
    const propsToCompare: (keyof Product)[] = ['name', 'category', 'price', 'costPrice', 'salePrice', 'stock', 'sku', 'location', 'image'];

    propsToCompare.forEach(prop => {
        const oldValue = original[prop];
        // @ts-ignore
        const newValue = change.proposedChanges[prop];

        if (newValue !== undefined && newValue !== oldValue) {
            diffs.push(
                <div key={prop as string} className="flex items-center gap-1.5 text-[11px] bg-[var(--theme-bg-hover)] rounded-md px-2 py-0.5 border border-[var(--theme-border)]">
                    <span className="text-[var(--theme-text-secondary)] uppercase font-semibold text-[11px]">{prop as string}:</span>
                    <span className="text-[#FF3B30] line-through truncate max-w-[70px]">{String(oldValue || 'None')}</span>
                    <ArrowRight size={11} className="text-[var(--theme-accent)] shrink-0" />
                    <span className="text-[#34C759] font-semibold truncate max-w-[90px]">{String(newValue)}</span>
                </div>
            );
        }
    });

    if (diffs.length === 0) return <span className="text-[#FF9F0A]/70 italic text-[11px]">No visible differences</span>;

    return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
            {diffs}
        </div>
    );
};

interface DetailedComparisonProps {
    requestForDetails: PendingInventoryChange | null;
    allProducts: Product[];
}

export const DetailedComparison: React.FC<DetailedComparisonProps> = ({ requestForDetails, allProducts }) => {
    if (!requestForDetails) return null;

    if (requestForDetails.changeType === 'create') {
        const prod = requestForDetails.proposedChanges as Product;
        return (
            <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 flex justify-center mb-2">
                    <div className="w-28 h-28 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-xs">
                        {prod?.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)]">
                                <Package size={28} className="opacity-30" />
                            </div>
                        )}
                    </div>
                </div>
                {Object.entries(prod || {}).map(([key, value]) => {
                    if (['id', 'image', 'description', 'reviews', 'related', 'createdAt'].includes(key)) return null;
                    if (typeof value === 'object') return null;
                    return (
                        <div key={key} className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                            <p className="text-[11px] uppercase text-[var(--theme-text-secondary)] font-semibold tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-[13px] font-medium text-[var(--theme-text-primary)] truncate">{String(value)}</p>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (requestForDetails.changeType === 'edit' && requestForDetails.proposedChanges) {
        const original = allProducts.find(p => p.id === requestForDetails.productId);
        if (!original) return <div className="text-center p-8 text-[var(--theme-text-secondary)] text-[13px]">Original product not found.</div>;

        const isPriceChange = isPriceChangeRequest(requestForDetails);
        const origSelling = effectivePrice(original);
        const origCost = original.costPrice;
        const origMargin = computeMarginPct(origSelling, origCost);

        const proposedSelling = effectivePrice(requestForDetails.proposedChanges);
        const proposedCost = requestForDetails.proposedChanges.costPrice ?? origCost;
        const proposedMargin = computeMarginPct(proposedSelling, proposedCost);
        const isBelowFloor = requiresFinanceCoApproval(requestForDetails);

        return (
            <div className="space-y-4">
                {isPriceChange && (
                    <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[12px] font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Margin Impact Analysis</h5>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                isBelowFloor
                                    ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                                    : 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30'
                            }`}>
                                {isBelowFloor ? `< ${MARGIN_FLOOR_PCT}% Floor (Finance Co-Approval Required)` : `≥ ${MARGIN_FLOOR_PCT}% Floor Compliant`}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)]">
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Current Price & Margin</p>
                                <p className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5 font-mono tabular-nums">
                                    {origSelling !== undefined ? origSelling.toLocaleString() : 'N/A'}
                                </p>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                                    Margin: <span className="font-semibold text-[var(--theme-text-primary)] tabular-nums">{origMargin !== null ? `${origMargin.toFixed(1)}%` : 'N/A'}</span>
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)]">
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Proposed Price & Margin</p>
                                <p className="text-sm font-semibold text-[var(--theme-accent)] mt-0.5 font-mono tabular-nums">
                                    {proposedSelling !== undefined ? proposedSelling.toLocaleString() : 'N/A'}
                                </p>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                                    Margin: <span className={`font-semibold tabular-nums ${isBelowFloor ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                                        {proposedMargin !== null ? `${proposedMargin.toFixed(1)}%` : 'N/A'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <h5 className="text-[12px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider border-b border-[var(--theme-border)] pb-2">Changed Fields</h5>
                <div className="grid grid-cols-1 gap-2">
                    {renderChangeDiff(requestForDetails, allProducts)}
                </div>
                <div className="mt-6">
                    <h5 className="text-[12px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider border-b border-[var(--theme-border)] pb-2 mb-3">Comparison</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                        <div className="p-3.5 rounded-xl bg-[#FF3B30]/5 border border-[#FF3B30]/15">
                            <h6 className="text-[#FF3B30] font-semibold mb-2 uppercase text-[11px] tracking-wider">Original</h6>
                            <pre className="whitespace-pre-wrap text-[var(--theme-text-secondary)] text-[11px] overflow-x-auto">{JSON.stringify(original, null, 2)}</pre>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#34C759]/5 border border-[#34C759]/15">
                            <h6 className="text-[#34C759] font-semibold mb-2 uppercase text-[11px] tracking-wider">Proposed</h6>
                            <pre className="whitespace-pre-wrap text-[var(--theme-text-secondary)] text-[11px] overflow-x-auto">{JSON.stringify({ ...original, ...requestForDetails.proposedChanges }, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (requestForDetails.changeType === 'stock_adjustment') {
        const currentStock = allProducts.find(p => p.id === requestForDetails.productId)?.stock || 0;
        return (
            <div className="p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 flex items-center justify-center text-[#FF9F0A] mx-auto">
                    <RefreshCw size={22} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">Stock Adjustment Request</h3>
                    <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">Physical ledger discrepancy resolution</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-xl font-mono tabular-nums py-2">
                    <span className="text-[var(--theme-text-secondary)] text-sm">Current: <span className="font-semibold text-[var(--theme-text-primary)]">{currentStock}</span></span>
                    <ArrowRight size={16} className="text-[var(--theme-text-secondary)]" />
                    <span className={`font-semibold text-lg ${requestForDetails.adjustmentType === 'IN' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {requestForDetails.adjustmentType === 'IN' ? '+' : '-'}{requestForDetails.adjustmentQty}
                    </span>
                </div>
                <div>
                    <p className="text-[11px] uppercase text-[var(--theme-text-secondary)] font-semibold tracking-wider mb-2">Reason Provided</p>
                    <div className="p-3.5 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] inline-block min-w-[280px]">
                        <span className="text-[var(--theme-text-primary)] text-[13px] font-medium block leading-normal">{requestForDetails.adjustmentReason}</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
