import React from 'react';
import { CheckCircle2, PackageCheck, ArrowLeft, History, Package } from 'lucide-react';

interface FulfillmentSuccessScreenProps {
    isOpen: boolean;
    onClose: () => void;
    jobData: {
        id: string;
        jobNumber?: string;
        type: 'PICK' | 'PACK' | 'DISPATCH' | 'PUTAWAY' | 'RECEIVE';
        chainedJobId?: string;
    };
    onViewHistory?: () => void;
    title?: string;
    message?: string;
}

export const FulfillmentSuccessScreen: React.FC<FulfillmentSuccessScreenProps> = ({
    isOpen,
    onClose,
    jobData,
    onViewHistory,
    title,
    message
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (jobData.type) {
            case 'PICK': return <PackageCheck className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={40} />;
            case 'PACK': return <Package className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={40} />;
            default: return <CheckCircle2 className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={40} />;
        }
    };

    const getChainingMessage = () => {
        if (jobData.type === 'PICK') return "Items sent to Packing Station 1";
        if (jobData.type === 'PACK') return "Ready for Dispatch Bay";
        return "Task successfully recorded";
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/80 dark:bg-black/90 animate-in fade-in duration-200">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative glass-panel w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Top Accent Bar */}
                <div className="h-1.5 w-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />

                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-2 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center">
                            {getIcon()}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <h2 className="text-3xl font-black text-stone-850 dark:text-white tracking-tight uppercase italic mb-3">
                            {title || "Mission Complete!"}
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 font-medium text-lg mb-6 max-w-sm">
                            {message || `Job ${jobData.jobNumber || jobData.id.slice(0, 8)} has been successfully finalized.`}
                        </p>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100/50 dark:bg-black/20 rounded-2xl border border-[#E2DCCE]/50 dark:border-[#A9CBA2]/[0.04] text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
                            {getChainingMessage()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onClose}
                            className="w-full woody-btn-primary flex items-center justify-center gap-3 py-3"
                        >
                            Back to Missions
                            <ArrowLeft size={18} />
                        </button>
                        
                        {onViewHistory && (
                            <button
                                onClick={onViewHistory}
                                className="w-full woody-btn-secondary flex items-center justify-center gap-3 py-3"
                            >
                                <History size={18} />
                                View History
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer decoration */}
                <div className="p-4 bg-stone-100/10 dark:bg-black/20 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                    <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                    <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                </div>
            </div>
        </div>
    );
};
