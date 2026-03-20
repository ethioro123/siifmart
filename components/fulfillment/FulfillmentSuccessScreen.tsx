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
            case 'PICK': return <PackageCheck className="text-purple-400" size={40} />;
            case 'PACK': return <Package className="text-cyan-400" size={40} />;
            default: return <CheckCircle2 className="text-emerald-400" size={40} />;
        }
    };

    const getChainingMessage = () => {
        if (jobData.type === 'PICK') return "Items sent to Packing Station 1";
        if (jobData.type === 'PACK') return "Ready for Dispatch Bay";
        return "Task successfully recorded";
    };

    const accentColor = jobData.type === 'PICK' ? 'purple' : jobData.type === 'PACK' ? 'cyan' : 'emerald';
    const accentHex = accentColor === 'purple' ? '#a855f7' : accentColor === 'cyan' ? '#06b6d4' : '#10b981';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            >
                {/* Background Glows */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-${accentColor}-500/10 blur-[120px] rounded-full pointer-events-none`} />
                
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-[#0f0f11] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Top Accent Bar */}
                    <div className={`h-1.5 w-full bg-${accentColor}-500 shadow-[0_0_20px_${accentHex}66]`} />

                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                        {/* Animated Success Icon */}
                        <div className="relative mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.6, delay: 0.1, duration: 0.6 }}
                                className={`w-24 h-24 rounded-3xl bg-${accentColor}-500/20 border-2 border-${accentColor}-500/30 flex items-center justify-center shadow-[0_0_30px_${accentHex}33]`}
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
                                    className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-${accentColor}-400 blur-[1px]`}
                                />
                            ))}
                        </div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic mb-3">
                                {title || "Mission Complete!"}
                            </h2>
                            <p className="text-gray-400 font-medium text-lg mb-6 max-w-sm">
                                {message || `Job ${jobData.jobNumber || jobData.id.slice(0, 8)} has been successfully finalized.`}
                            </p>
                            
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">
                                <span className={`w-2 h-2 rounded-full bg-${accentColor}-500 animate-pulse`} />
                                {getChainingMessage()}
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="flex flex-col w-full gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className={`w-full py-4 bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white font-black rounded-2xl shadow-[0_0_30px_${accentHex}44] flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-sm`}
                            >
                                Back to Missions
                                <ArrowLeft size={18} />
                            </motion.button>
                            
                            {onViewHistory && (
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onViewHistory}
                                    className="w-full py-4 bg-white/5 text-gray-400 hover:text-white font-black rounded-2xl border border-white/5 flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-sm"
                                >
                                    <History size={18} />
                                    View History
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Footer decoration */}
                    <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
