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
            case 'PICK': return <PackageCheck className="text-primary" size={40} />;
            case 'PACK': return <Package className="text-primary" size={40} />;
            default: return <CheckCircle2 className="text-primary" size={40} />;
        }
    };

    const getChainingMessage = () => {
        if (jobData.type === 'PICK') return "Items sent to Packing Station 1";
        if (jobData.type === 'PACK') return "Ready for Dispatch Bay";
        return "Task successfully recorded";
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] animate-in fade-in duration-200">
            <div className="relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            {getIcon()}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase mb-2">
                            {title || "Mission Complete!"}
                        </h2>
                        <p className="text-[var(--theme-text-secondary)] font-medium text-base mb-6 max-w-sm">
                            {message || `Job ${jobData.jobNumber || jobData.id.slice(0, 8)} has been successfully finalized.`}
                        </p>
                        
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider mb-8">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {getChainingMessage()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onClose}
                            className="w-full min-h-[44px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold rounded-xl flex items-center justify-center gap-2 py-3 hover:opacity-90 active:scale-95 transition-all touch-manipulation text-sm cursor-pointer"
                        >
                            Back to Missions
                            <ArrowLeft size={16} />
                        </button>
                        
                        {onViewHistory && (
                            <button
                                onClick={onViewHistory}
                                className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold rounded-xl flex items-center justify-center gap-2 py-3 hover:bg-[var(--theme-bg-card)] active:scale-95 transition-all touch-manipulation text-sm"
                            >
                                <History size={16} />
                                View History
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
