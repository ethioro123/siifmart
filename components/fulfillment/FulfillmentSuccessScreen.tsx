import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, PackageCheck, ArrowRight, ArrowLeft, History, Package } from 'lucide-react';

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-xl"
            >
                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 blur-[120px] rounded-full pointer-events-none" />
                
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative glass-panel w-full max-w-lg rounded-[2.5rem] overflow-hidden"
                >
                    {/* Top Accent Bar */}
                    <div className="h-1.5 w-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />

                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                        {/* Animated Success Icon */}
                        <div className="relative mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.6, delay: 0.1, duration: 0.6 }}
                                className="w-24 h-24 rounded-3xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-2 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center"
                            >
                                {getIcon()}
                            </motion.div>
                            
                            {/* Orbiting particles or bursts */}
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                        scale: [0, 1, 0], 
                                        opacity: [0, 1, 0],
                                        x: [0, (i % 2 === 0 ? 1 : -1) * 60],
                                        y: [0, (i < 2 ? 1 : -1) * 60]
                                    }}
                                    transition={{ duration: 1, delay: 0.3 + i * 0.1, repeat: Infinity, repeatDelay: 2 }}
                                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] blur-[1px]"
                                />
                            ))}
                        </div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
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
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="flex flex-col w-full gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full woody-btn-primary flex items-center justify-center gap-3 py-3"
                            >
                                Back to Missions
                                <ArrowLeft size={18} />
                            </motion.button>
                            
                            {onViewHistory && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onViewHistory}
                                    className="w-full woody-btn-secondary flex items-center justify-center gap-3 py-3"
                                >
                                    <History size={18} />
                                    View History
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Footer decoration */}
                    <div className="p-4 bg-stone-100/10 dark:bg-black/20 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex items-center justify-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                        <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                        <div className="w-1 h-1 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20" />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
