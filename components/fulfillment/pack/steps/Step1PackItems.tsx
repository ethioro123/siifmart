import React from 'react';
import { CheckCircle, PackageCheck } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { ProgressBar } from '../../../shared/ProgressBar';
import { PackJobItemCard } from '../components/PackJobItemCard';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface Step1PackItemsProps {
    job: WMSJob;
    products: Product[];
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    isFullyPacked: boolean;
}

export const Step1PackItems: React.FC<Step1PackItemsProps> = ({
    job,
    products,
    totalItems,
    completedItems,
    progressPercent,
    isFullyPacked,
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-app)]">
            <div className="shrink-0 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-4 py-3 md:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-text-primary)]">
                        <PackageCheck size={18} className="text-[var(--theme-accent)]" />
                        <span>{t('warehouse.packing.itemsInThisPack') || 'Items in this pack'}</span>
                    </div>
                    <span className="shrink-0 text-xs font-mono font-semibold text-[var(--theme-text-secondary)]">
                        {completedItems} / {totalItems} {t('warehouse.packing.packed') || 'packed'}
                    </span>
                </div>
                <ProgressBar
                    progress={progressPercent}
                    containerClassName="mt-2 h-2 rounded-full bg-[var(--theme-bg-subtle)]"
                    fillClassName={`h-full rounded-full transition-all duration-300 ${isFullyPacked ? 'bg-[var(--theme-status-success-bg)]' : 'bg-[var(--theme-accent)]'}`}
                />
            </div>

            {isFullyPacked && (
                <div className="shrink-0 flex items-center gap-2 border-b border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)] px-4 py-3 text-sm font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] md:px-6">
                    <CheckCircle size={18} />
                    <span>{t('warehouse.packing.allItemsVerifiedContinue') || 'All items verified. Continue with the bottom action.'}</span>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-2.5">
                {job.lineItems?.map((item, idx) => (
                    <PackJobItemCard
                        key={`${item.productId || item.sku || 'item'}-${idx}`}
                        item={item}
                        job={job}
                        products={products}
                    />
                ))}
                {!job.lineItems?.length && (
                    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-6 text-center text-sm text-[var(--theme-text-secondary)]">
                        {t('warehouse.packing.noItemLines') || 'This pack job has no item lines.'}
                    </div>
                )}
            </div>
        </div>
    );
};
