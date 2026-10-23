import React from 'react';
/** Physical inventory does not imply approval or retail readiness. Report only the missing price. */
export function InventoryPriceReadiness({ price }: { price?: number }) {
    if (typeof price === 'number' && Number.isFinite(price) && price > 0) return null;
    return <span className="inline-flex max-w-full whitespace-normal rounded border border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--theme-status-warning-text)]" title="A selling price has not been configured. Set pricing through Merchandising.">Selling price not set</span>;
}
