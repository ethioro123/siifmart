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
    t: (key: string) => string;
}

export const Step2PutawayRouting: React.FC<Step2PutawayRoutingProps> = ({ job, getProduct }) => <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
    <p className="text-sm text-[var(--theme-text-secondary)]">Review the items and suggested bins. Use the bottom scanning action to verify the actual location, SKU, and physical quantity before stock is posted.</p>
    {(job.lineItems || []).map((item, index) => {
        const product = getProduct(item);
        return <article key={index} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 space-y-1">
            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">{item.name || item.sku}</h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">SKU: {item.sku} · {item.expectedQty} units</p>
            <p className="text-xs text-[var(--theme-text-secondary)]">Suggested bin: {item.location || product?.location || 'Scan an authorized storage bin'}</p>
            <p className="text-xs text-[var(--theme-text-primary)]">{item.status === 'Picked' || item.status === 'Completed' ? 'Placement recorded' : item.status === 'Short' ? 'Short placement recorded' : 'Awaiting physical placement'}</p>
        </article>;
    })}
</div>;
