import React from 'react';
import { Scan, CheckCircle } from 'lucide-react';
import type { WMSJob, Product } from '../../../../types';
import { isPickLineResolved } from '../../../../utils/pickProgress';
import { getTransferQuantityConfig } from '../../transfer/transferQuantity';

interface Props {
    job: WMSJob; products: Product[]; sortedLineItems: WMSJob['lineItems']; totalItems: number;
    completedItems: number; progressPercent: number; isFullyPicked: boolean;
    getProduct: (item: WMSJob['lineItems'][number]) => Product | undefined;
    onUpdateItemPick?: (item: WMSJob['lineItems'][number], qty: number) => void;
    onStartPick: (job: WMSJob) => void; onAdvanceToStaging: () => void; t: (key: string) => string;
}
/** Collection always uses the verified bay → product → quantity workflow. */
export const Step2PickCollect: React.FC<Props> = ({ job, sortedLineItems, completedItems, totalItems, isFullyPicked, getProduct, onStartPick, onAdvanceToStaging }) => (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--theme-bg-app)]">
        <div className="p-4 border-b border-[var(--theme-border)]">
            <p className="font-semibold text-[var(--theme-text-primary)]">{completedItems} / {totalItems} lines verified</p>
            <p className="text-sm text-[var(--theme-text-secondary)]">Scan the source bay and product, then record the physical quantity. Record a reason for any shortage.</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--theme-border)]">
            {sortedLineItems.map((item, index) => {
                const product = getProduct(item);
                const resolved = isPickLineResolved(item);
                return <div key={`${item.productId}-${index}`} className="p-4 flex items-start gap-3 min-w-0">
                    {resolved ? <CheckCircle size={18} className="shrink-0 text-[var(--theme-accent)] mt-1"/> : <span className="shrink-0 text-[var(--theme-text-secondary)]">{index+1}</span>}
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--theme-text-primary)] break-words">{item.name || item.sku}</p>
                        <p className="text-sm text-[var(--theme-text-secondary)] break-words">{item.sku} · {item.location || product?.location || 'Source bin missing'}</p>
                        <p className="text-sm text-[var(--theme-text-primary)]">{item.pickedQty || 0} / {item.expectedQty} {getTransferQuantityConfig(product).quantityLabel} · {item.status || 'Pending'}</p>
                    </div>
                </div>;
            })}
        </div>

    </div>
);
