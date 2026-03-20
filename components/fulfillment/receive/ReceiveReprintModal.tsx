import React from 'react';
import { X, Printer, Minus, Plus, RefreshCw, Box, Tags, Eye, EyeOff, LayoutTemplate, ScanLine, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiveReprintModalProps {
    reprintItem: {
        sku: string;
        name: string;
        qty: number;
        price?: string | number;
        category?: string;
    };
    setReprintItem: (val: any) => void;
    isSubmitting: boolean;
    handleReprintLabels: () => void;
    reprintSize: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
    setReprintSize: (val: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL') => void;
    reprintFormat: 'QR' | 'Barcode' | 'Both';
    setReprintFormat: (val: 'QR' | 'Barcode' | 'Both') => void;
    reprintOptions: {
        showPrice: boolean;
        showCategory: boolean;
        showName: boolean;
    };
    setReprintOptions: (val: any) => void;
}

export const ReceiveReprintModal: React.FC<ReceiveReprintModalProps> = ({
    reprintItem,
    setReprintItem,
    isSubmitting,
    handleReprintLabels,
    reprintSize,
    setReprintSize,
    reprintFormat,
    setReprintFormat,
    reprintOptions,
    setReprintOptions
}) => {
    const sizes: Array<'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'> = ['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'];
    const formats: Array<'QR' | 'Barcode' | 'Both'> = ['QR', 'Barcode', 'Both'];

    const toggleOption = (option: keyof typeof reprintOptions) => {
        setReprintOptions({ ...reprintOptions, [option]: !reprintOptions[option] });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white dark:bg-black border-2 border-zinc-900 dark:border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-2rem)]"
            >
                {/* 🌟 Background Glows (Futuristic Accents) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 dark:bg-violet-400/10 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-100 dark:bg-cyan-500 rounded-xl border border-zinc-300 dark:border-cyan-400 text-zinc-950 dark:text-black shadow-md dark:shadow-cyan-500/20">
                            <Printer size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Advanced Printing</h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-black uppercase tracking-widest">Dimensions and layout attributes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setReprintItem(null)}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full text-zinc-600 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all font-mono"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Product Summary HUD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-950 dark:text-zinc-400">
                                <Box size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-[0.2em] mb-0.5">Product</p>
                                <p className="text-sm font-black text-zinc-950 dark:text-zinc-100 truncate uppercase">{reprintItem.name}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-gray-500 font-black tracking-widest mt-0.5 truncate">{reprintItem.sku}</p>
                            </div>
                        </div>

                        <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Print Quantity</p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, qty: Math.max(1, reprintItem.qty - 1) })}
                                    title="Decrease Quantity"
                                    className="w-9 h-9 bg-white dark:bg-black rounded-xl flex items-center justify-center border border-zinc-300 dark:border-white/10 hover:border-zinc-950 dark:hover:border-zinc-300 text-zinc-950 dark:text-zinc-100 transition-all shadow-sm shrink-0"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    title="Quantity to Print"
                                    aria-label="Quantity to Print"
                                    value={reprintItem.qty}
                                    onChange={(e) => setReprintItem({ ...reprintItem, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-16 bg-transparent border-none text-center text-xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, qty: reprintItem.qty + 1 })}
                                    title="Increase Quantity"
                                    className="w-9 h-9 bg-white dark:bg-black rounded-xl flex items-center justify-center border border-zinc-300 dark:border-white/10 hover:border-zinc-950 dark:hover:border-zinc-300 text-zinc-950 dark:text-zinc-100 transition-all shadow-sm shrink-0"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Size Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-zinc-600 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <LayoutTemplate size={12} className="text-zinc-950 dark:text-zinc-400" /> Label Size
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setReprintSize(size)}
                                    className={`py-2 text-[10px] font-mono border rounded-lg transition-all ${reprintSize === size
                                        ? 'bg-white dark:bg-cyan-500 border-zinc-300 dark:border-cyan-400 text-zinc-950 dark:text-black shadow-md dark:shadow-cyan-500/20 scale-105'
                                        : 'bg-zinc-100 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-500 hover:border-cyan-500/50'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-zinc-600 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <Tags size={12} className="text-zinc-950 dark:text-zinc-400" /> Identifier Format
                        </label>
                        <div className="flex gap-2">
                            {formats.map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setReprintFormat(format)}
                                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl border font-mono text-[10px] uppercase tracking-wider transition-all ${reprintFormat === format
                                        ? 'bg-zinc-950 dark:bg-violet-500 border-zinc-950 dark:border-violet-400 text-white dark:text-black shadow-lg dark:shadow-violet-500/20 scale-105'
                                        : 'bg-zinc-100 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-500 hover:border-violet-500/50'
                                        }`}
                                >
                                    {format === 'QR' && <QrCode size={14} />}
                                    {format === 'Barcode' && <ScanLine size={14} />}
                                    {format === 'Both' && <Box size={14} />}
                                    {format}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility Options */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-zinc-600 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <Eye size={12} className="text-zinc-950 dark:text-zinc-400" /> Display Attributes
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(reprintOptions) as Array<keyof typeof reprintOptions>).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => toggleOption(opt)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${reprintOptions[opt]
                                        ? 'bg-white dark:bg-cyan-500 border-zinc-300 dark:border-cyan-400 text-zinc-950 dark:text-black font-mono shadow-md scale-[1.02]'
                                        : 'bg-zinc-950 dark:bg-black/20 border-zinc-900 dark:border-white/5 text-zinc-400 hover:border-cyan-500/20'
                                        }`}
                                >
                                    <span className="text-[10px] uppercase tracking-widest">{opt.replace('show', '')}</span>
                                    {reprintOptions[opt] ? <Eye size={14} className="text-white dark:text-black" /> : <EyeOff size={14} className="text-zinc-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
                    <button
                        disabled={isSubmitting}
                        onClick={handleReprintLabels}
                        className="w-full relative group"
                    >
                        <div className="absolute -inset-1 bg-cyan-500 dark:bg-cyan-400 rounded-2xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition duration-1000 group-disabled:opacity-0" />
                        <div className="relative flex items-center justify-center gap-3 py-4 bg-zinc-100 dark:bg-cyan-500 hover:bg-zinc-200 dark:hover:bg-cyan-400 text-zinc-950 dark:text-black font-black rounded-2xl shadow-md dark:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:grayscale border border-zinc-300 dark:border-cyan-400/30">
                            {isSubmitting ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <Printer size={20} />
                            )}
                            GENERATE {reprintItem.qty} {reprintItem.qty === 1 ? 'LABEL' : 'LABELS'}
                        </div>
                    </button>
                    <p className="text-[9px] text-center text-zinc-500 dark:text-zinc-600 mt-4 uppercase tracking-[0.3em] font-black">Unified Template System v2.4</p>
                </div>
            </motion.div>
        </div>
    );
};

