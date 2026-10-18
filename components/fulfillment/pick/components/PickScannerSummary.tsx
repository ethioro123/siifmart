import React from 'react';
import { PackageCheck } from 'lucide-react';
import { WMSJob } from '../../../../types';

interface PickScannerSummaryProps {
    job: WMSJob;
    t: (key: string) => string;
}

export const PickScannerSummary: React.FC<PickScannerSummaryProps> = ({ job, t }) => {
    const totalItems = job.lineItems?.length || 0;

    return (
        <div className="w-full max-w-lg mx-auto z-10 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-2 sm:mb-4">
                <PackageCheck size={30} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                {t('warehouse.picking.missionComplete') || 'Mission Complete'}
            </h2>
            <div className="mt-3 sm:mt-5 inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
                <span className="text-4xl sm:text-5xl leading-none font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{totalItems}</span>
                <span className="text-left text-sm sm:text-base font-semibold text-[var(--theme-text-primary)]">
                    {totalItems === 1 ? 'item picked' : 'items picked'}
                    <span className="block text-xs sm:text-sm font-medium text-[var(--theme-text-secondary)]">Ready for packing</span>
                </span>
            </div>
        </div>
    );
};
