import React from 'react';
import { WMSJob, Product } from '../../../../types';
interface Step2PutawayRoutingProps {
    job: WMSJob;
    products: Product[];
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    isFullySlotted: boolean;
    getProduct: (item: any) => Product | undefined;
    onUpdateItemSlot: (item: any, qty: number) => void;
    onStartPutaway: (job: WMSJob) => void;
    onAdvanceToPlacement: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const Step2PutawayRouting: React.FC<Step2PutawayRoutingProps> = ({ job, t }) => <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
    <p className="text-sm text-[var(--theme-text-secondary)]">
        {t('warehouse.putaway.step2RoutingPrompt') || 'Review the items. Live bin suggestions are recalculated from current site stock when scanning starts. Use the bottom scanning action to verify the actual location, SKU, and physical quantity before stock is posted.'}
    </p>
    {(job.lineItems || []).map((item, index) => {
        return <article key={index} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 space-y-1">
            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">{item.name || item.sku}</h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">SKU: {item.sku} · {item.expectedQty} {t('warehouse.unitsLabel') || 'units'}</p>
            <p className="text-xs text-[var(--theme-text-secondary)]">
                {['Picked', 'Completed', 'Short'].includes(item.status)
                    ? (t('warehouse.putaway.recordedBin', { bin: item.location || '—' }) || `Recorded bin: ${item.location || '—'}`)
                    : (t('warehouse.putaway.routingStrategyDesc') || 'Same SKU and lot first, then a compatible bin near this category.')}
            </p>
            <p className="text-xs text-[var(--theme-text-primary)]">
                {item.status === 'Picked' || item.status === 'Completed'
                    ? (t('warehouse.putaway.placementRecorded') || 'Placement recorded')
                    : item.status === 'Short'
                        ? (t('warehouse.putaway.shortPlacementRecorded') || 'Short placement recorded')
                        : (t('warehouse.putaway.awaitingPlacement') || 'Awaiting physical placement')}
            </p>
        </article>;
    })}
</div>;
