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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative glass-panel rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* 🌟 Background Glows (Futuristic Accents) */}
                <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 dark:bg-amber-700/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex justify-between items-center bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 rounded-xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm">
                            <Printer size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Advanced Printing</h3>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest">Dimensions and layout attributes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setReprintItem(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-mono"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Product Summary HUD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-panel-pushed p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/50 dark:bg-black/30 rounded-xl border border-[#E2DCCE]/20 dark:border-[#A9CBA2]/[0.02] flex items-center justify-center text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60">
                                <Box size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-[0.2em] mb-0.5">Product</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase drop-shadow-sm">{reprintItem.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-gray-500 font-black tracking-widest mt-1 truncate border-t border-[#E2DCCE]/20 dark:border-[#A9CBA2]/[0.02] pt-1">{reprintItem.sku}</p>
                            </div>
                        </div>

                        <div className="glass-panel-pushed p-4">
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Print Quantity</p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, qty: Math.max(1, reprintItem.qty - 1) })}
                                    title="Decrease Quantity"
                                    className="w-9 h-9 bg-white/85 dark:bg-black/30 rounded-xl flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2] transition-all shadow-sm shrink-0"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    title="Quantity to Print"
                                    aria-label="Quantity to Print"
                                    value={reprintItem.qty}
                                    onChange={(e) => setReprintItem({ ...reprintItem, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-16 bg-transparent border-none text-center text-xl font-black text-slate-900 dark:text-white focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, qty: reprintItem.qty + 1 })}
                                    title="Increase Quantity"
                                    className="w-9 h-9 bg-white/85 dark:bg-black/30 rounded-xl flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2] transition-all shadow-sm shrink-0"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Size Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <LayoutTemplate size={12} className="text-slate-400 dark:text-zinc-400" /> Label Size
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setReprintSize(size)}
                                    className={`py-2 text-[10px] font-black font-mono border rounded-lg transition-all ${reprintSize === size
                                        ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] border-[#2C5E3B] dark:border-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md scale-105'
                                        : 'bg-white/50 dark:bg-black/10 border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35]/60 dark:text-[#A9CBA2]/40 hover:border-[#2C5E3B]/50 dark:hover:border-[#A9CBA2]/30'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <Tags size={12} className="text-slate-400 dark:text-zinc-400" /> Identifier Format
                        </label>
                        <div className="flex gap-2">
                            {formats.map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setReprintFormat(format)}
                                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl border font-black font-mono text-[10px] uppercase tracking-wider transition-all ${reprintFormat === format
                                        ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] border-[#2C5E3B] dark:border-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-lg scale-105'
                                        : 'bg-white/50 dark:bg-black/10 border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35]/60 dark:text-[#A9CBA2]/40 hover:border-[#2C5E3B]/50 dark:hover:border-[#A9CBA2]/30'
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
                        <label className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-black tracking-[0.2em] pl-1 flex items-center gap-2">
                            <Eye size={12} className="text-slate-400 dark:text-zinc-400" /> Display Attributes
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(reprintOptions) as Array<keyof typeof reprintOptions>).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => toggleOption(opt)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${reprintOptions[opt]
                                        ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] border-[#2C5E3B] dark:border-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] font-black font-mono shadow-md scale-[1.02]'
                                        : 'bg-white/50 dark:bg-black/10 border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35]/60 dark:text-[#A9CBA2]/40 hover:border-[#2C5E3B]/20 dark:hover:border-[#A9CBA2]/10'
                                        }`}
                                >
                                    <span className="text-[10px] uppercase tracking-widest">{opt.replace('show', '')}</span>
                                    {reprintOptions[opt] ? <Eye size={14} className="text-[#FAF8F5] dark:text-[#1E3B24]" /> : <EyeOff size={14} className="text-[#2C4D35]/40 dark:text-[#A9CBA2]/40" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 bg-white/20 dark:bg-[#1C2620]/20 shrink-0 backdrop-blur-md">
                    <button
                        disabled={isSubmitting}
                        onClick={handleReprintLabels}
                        className="w-full relative group shadow-lg"
                    >
                        <div className="absolute -inset-1 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-2xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition duration-1000 group-disabled:opacity-0" />
                        <div className="relative flex items-center justify-center gap-3 py-4 woody-btn-primary w-full text-[#FAF8F5] dark:text-[#1E3B24] font-black shadow-md transition-all disabled:opacity-50 disabled:grayscale">
                            {isSubmitting ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <Printer size={20} />
                            )}
                            GENERATE {reprintItem.qty} {reprintItem.qty === 1 ? 'LABEL' : 'LABELS'}
                        </div>
                    </button>
                    <p className="text-[9px] text-center text-slate-400 dark:text-zinc-600 mt-6 uppercase tracking-[0.3em] font-black">Unified Template System v2.4</p>
                </div>
            </motion.div>
        </div>
    );
};

