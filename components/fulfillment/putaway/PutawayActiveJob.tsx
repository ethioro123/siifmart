import React from 'react';
import { ArrowLeft, CheckCircle, Smartphone, AlertTriangle, Box, MapPin, Package, Clock, Info, Loader2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PutawayActiveJobProps {
    job: WMSJob;
    onBack: () => void;
    onStartScanning: () => void;
    onCompleteJob: () => Promise<void>;
    currentProduct?: Product;
    currentItem?: WMSJob['lineItems'][0];
    allProducts: Product[];
    isSubmitting: boolean;
}

export const PutawayActiveJob: React.FC<PutawayActiveJobProps> = ({
    job,
    onBack,
    onStartScanning,
    onCompleteJob,
    currentProduct,
    currentItem,
    allProducts,
    isSubmitting
}) => {
    // Calculate progress
    const completedItems = job.lineItems?.filter(i => i.status === 'Picked' || i.status === 'Completed').length || 0;
    const totalItems = job.lineItems?.length || 0;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="flex flex-col h-full rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden relative shadow-[var(--shadow-sm)]">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-between items-center">
                <div className="flex items-center gap-3 md:gap-4">
                    <button 
                        onClick={onBack} 
                        className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight font-mono">Job {formatJobId(job)}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                                job.priority === 'Critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                                job.priority === 'High' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 
                                'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                            }`}>
                                {job.priority} Priority
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            {completedItems} of {totalItems} items processed
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-28 md:w-36">
                    <div className="flex justify-between text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1">
                        <span>Completion</span>
                        <span className="font-mono tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--theme-bg-app)]">
                <div className="space-y-3">
                    {job.lineItems?.map((item, idx) => {
                        const isCompleted = item.status === 'Picked' || item.status === 'Completed';
                        const isCurrent = !isCompleted && item === currentItem;
                        const product = allProducts.find(p => p.id === item.productId);
                        const location = product?.location || 'Unassigned';

                        return (
                            <div key={idx} className={`p-4 rounded-xl border transition-colors ${
                                isCompleted ? 'bg-[var(--theme-bg-card)] border-emerald-500/20 opacity-70' :
                                isCurrent ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent-muted)]' :
                                'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3.5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                            isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                            isCurrent ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-accent)] text-[var(--theme-text-primary)]' :
                                            'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                        }`}>
                                            {isCompleted ? <CheckCircle size={18} /> : <Box size={18} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-xs md:text-sm font-semibold ${isCompleted ? 'text-[var(--theme-text-secondary)] line-through' : 'text-[var(--theme-text-primary)]'}`}>
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center gap-2.5 mt-1.5">
                                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)]">
                                                    {item.sku}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-[var(--theme-text-secondary)]">
                                                    <MapPin size={12} className={isCurrent ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'} />
                                                    <span className={isCurrent ? 'text-[var(--theme-text-primary)] font-semibold' : ''}>{location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">
                                            {item.pickedQty ?? item.expectedQty ?? 0}
                                        </div>
                                        <div className="text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)]">Units</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {totalItems === 0 && (
                        <div className="text-center py-12">
                            <Info size={36} className="mx-auto text-[var(--theme-text-secondary)] mb-3" />
                            <p className="text-xs text-[var(--theme-text-secondary)]">No items in this job.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                {progress === 100 ? (
                    <button
                        onClick={onCompleteJob}
                        disabled={isSubmitting}
                        className="w-full h-12 md:h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm uppercase tracking-wider text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} /> Complete Job
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={onStartScanning}
                        disabled={isSubmitting}
                        className="w-full h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm uppercase tracking-wider text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Smartphone size={18} /> Start Scanning to Location
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
