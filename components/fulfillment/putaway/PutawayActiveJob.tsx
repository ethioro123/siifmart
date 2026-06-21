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
        <div className="flex flex-col h-full glass-panel overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/30 dark:bg-black/20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-[#2C5E3B]/10 dark:bg-white/5 rounded-xl hover:bg-[#2C5E3B]/20 dark:hover:bg-white/10 text-[#2C5E3B] dark:text-white transition-all" aria-label="Go Back">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Job {formatJobId(job)}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                job.priority === 'Critical' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' :
                                job.priority === 'High' ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' : 
                                'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30'
                            }`}>
                                {job.priority} Priority
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                            {completedItems} of {totalItems} items processed
                        </p>
                    </div>
                </div>

                {/* Progress Radial or Bar */}
                <div className="w-32">
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold mb-1">
                        <span>Completion</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E2DCCE]/40 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] transition-all duration-500"
                            ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    {job.lineItems?.map((item, idx) => {
                        const isCompleted = item.status === 'Picked' || item.status === 'Completed';
                        const isCurrent = !isCompleted && item === currentItem;
                        const product = allProducts.find(p => p.id === item.productId);
                        const location = product?.location || 'Unassigned';

                        return (
                            <div key={idx} className={`p-4 rounded-2xl border transition-all ${
                                isCompleted ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-500/20 opacity-60' :
                                isCurrent ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/40 dark:border-[#A9CBA2]/40 ring-1 ring-[#2C5E3B]/20' :
                                'bg-[#FAF8F5]/30 dark:bg-white/5 border-[#E2DCCE]/60 dark:border-white/10'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                                            isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                                            isCurrent ? 'bg-[#2C5E3B]/20 border-[#2C5E3B]/40 text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                            'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-slate-400 dark:text-gray-500'
                                        }`}>
                                            {isCompleted ? <CheckCircle size={20} strokeWidth={3} /> : <Box size={20} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-gray-905 dark:text-white'}`}>
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] font-mono text-slate-500 dark:text-gray-500 bg-[#E2DCCE]/30 dark:bg-black/30 px-1.5 py-0.5 rounded border border-[#E2DCCE]/60 dark:border-white/5">
                                                    {item.sku}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-gray-400">
                                                    <MapPin size={12} className={isCurrent ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-slate-400 dark:text-gray-600'} />
                                                    <span className={isCurrent ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : ''}>{location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                                            {item.pickedQty ?? item.expectedQty ?? 0}
                                        </div>
                                        <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-gray-550">Units</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {totalItems === 0 && (
                        <div className="text-center py-10">
                            <Info size={40} className="mx-auto text-slate-300 dark:text-gray-600 mb-4" />
                            <p className="text-slate-500 dark:text-gray-450">No items in this job.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40 backdrop-blur-md">
                {progress === 100 ? (
                    <button
                        onClick={onCompleteJob}
                        disabled={isSubmitting}
                        className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-emerald-400/50 shadow-md uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={24} /> Complete Job
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={onStartScanning}
                        disabled={isSubmitting}
                        className="woody-btn-primary w-full h-16 text-xs flex items-center justify-center gap-3 shadow-md"
                    >
                        {isSubmitting ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <Smartphone size={24} /> START SCANNING TO LOCATION
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
