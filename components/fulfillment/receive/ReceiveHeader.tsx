import React from 'react';
import { Scan, AlertTriangle, X, Truck, Search, Plus, Minus, Loader2 } from 'lucide-react';
import { PurchaseOrder } from '../../../types';

interface ReceiveHeaderProps {
    scanInputRef: React.RefObject<HTMLInputElement | null>;
    handleGlobalScan: (val: string) => void;
    unresolvedScans: Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>;
    setUnresolvedScans: React.Dispatch<React.SetStateAction<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>>;
    setReceivingPO: (po: PurchaseOrder | null) => void;
    filteredReceiveOrders: PurchaseOrder[];
    receiveSearch: string;
    setReceiveSearch: (val: string) => void;
    setResolvingBarcode: (val: { barcode: string; qty: number } | null) => void;
    setResolutionSearch: (val: string) => void;
    setResolutionMode: (val: 'map' | 'new' | 'hold') => void;
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    orders: PurchaseOrder[];
    t: (key: string) => string;
    isSubmitting: boolean;
}

export const ReceiveHeader: React.FC<ReceiveHeaderProps> = ({
    scanInputRef,
    handleGlobalScan,
    unresolvedScans,
    setUnresolvedScans,
    setReceivingPO,
    filteredReceiveOrders,
    receiveSearch,
    setReceiveSearch,
    setResolvingBarcode,
    setResolutionSearch,
    setResolutionMode,
    viewMode,
    setViewMode,
    orders,
    t,
    isSubmitting
}) => {
    return (
        <>
            {/* Global Scan Input for Active Receive */}
            <div className="p-3 md:p-6 glass-panel shrink-0 relative overflow-hidden group/header">
                {/* 🌟 Futuristic Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute top-0 right-0 w-[400px] h-[400px] bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none opacity-0 group-hover/header:opacity-100 transition-opacity duration-1000" />
                <div className="hidden md:block absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-600/10 dark:bg-amber-700/3 blur-[80px] rounded-full -ml-10 -mb-10 pointer-events-none opacity-0 group-hover/header:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4D6E56] dark:text-[#7A9E83] group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors">
                            <Scan size={20} />
                        </div>
                        <input
                            ref={scanInputRef}
                            autoFocus
                            type="text"
                            placeholder="Scan barcode or enter SKU..."
                            className="w-full h-12 pl-12 pr-4 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl text-[#1E3F27] dark:text-[#EAE5D9] font-mono text-sm focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 focus:outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    handleGlobalScan(val);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (isSubmitting) return;
                            if (scanInputRef.current) {
                                const val = scanInputRef.current.value.trim();
                                handleGlobalScan(val);
                                scanInputRef.current.value = '';
                            }
                        }}
                        disabled={isSubmitting}
                        className="h-12 px-8 bg-[#224429] dark:bg-[#EAE5D9] hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] text-[#FAF8F5] dark:text-[#1E3B24] font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-transparent dark:border-[#EAE5D9]/20">
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <span className="hidden sm:inline">Submit</span>
                                <span className="sm:hidden">Go</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* UNRESOLVED ITEMS QUEUE */}
            {
                unresolvedScans.length > 0 && (
                    <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl md:rounded-2xl p-3 md:p-5 shrink-0 backdrop-blur-sm shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Unresolved Barcodes</span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase drop-shadow-sm">Scan Diagnostics</span>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white text-[10px] font-black rounded border border-slate-200 dark:border-white/10 shadow-sm">{unresolvedScans.length}</span>
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setUnresolvedScans([])}
                                className="text-xs text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest transition-all hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {unresolvedScans.map((scan, idx) => (
                                <div
                                    key={idx}
                                    className="glass-panel-pushed px-4 py-2.5 flex items-center gap-3 group hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1C2620]/40 cursor-pointer transition-all shadow-sm"
                                    onClick={() => {
                                        if (filteredReceiveOrders.length === 1) {
                                            setReceivingPO(filteredReceiveOrders[0]);
                                        } else if (filteredReceiveOrders.length > 0 && receiveSearch) {
                                            setReceivingPO(filteredReceiveOrders[0]);
                                        }
                                        setResolvingBarcode({ barcode: scan.barcode, qty: scan.qty });
                                        setResolutionSearch('');
                                        setResolutionMode('map');
                                    }}
                                    aria-label={`Resolve barcode ${scan.barcode}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">{scan.barcode}</span>
                                        <span className="text-[9px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-tighter mt-1 bg-slate-100 dark:bg-white/5 px-1.5 rounded self-start">Qty: {scan.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Decrease logic would go here if implemented in main ReceiveTab
                                            }}
                                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
                                            title="Decrease Quantity"
                                            aria-label={`Decrease quantity for ${scan.barcode}`}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="w-12 text-center font-mono font-black text-slate-900 dark:text-white text-base" aria-live="polite">
                                            {scan.qty}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Increase logic
                                            }}
                                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
                                            title="Increase Quantity"
                                            aria-label={`Increase quantity for ${scan.barcode}`}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUnresolvedScans(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors group/close"
                                        title="Remove"
                                    >
                                        <X size={14} className="text-slate-400 dark:text-gray-600 group-hover/close:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* RECEIVE INTELLIGENCE HEADER */}
            <div className="glass-panel p-3 md:p-6 relative overflow-hidden group/intel">
                {/* 🌈 Futuristic Mesh Accent — hidden on mobile */}
                <div className="hidden md:block absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(44,94,59,0.04),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(169,203,162,0.1),transparent_50%)] pointer-events-none opacity-50 group-hover/intel:opacity-100 transition-opacity duration-1000" />
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-slate-200/5 to-transparent dark:from-white/5 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-6 relative z-10">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="p-3 bg-white/80 dark:bg-[#18201B]/50 rounded-xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 shadow-sm">
                            <Truck className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-tight">{t('warehouse.receivingQueue')}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse shadow-[0_0_8px_rgba(44,94,59,0.4)] dark:shadow-[0_0_8px_rgba(169,203,162,0.4)]" />
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">{t('warehouse.approvedPOsWillAppear')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        {/* VIEW MODE TOGGLE */}
                        <div className="glass-panel-pushed p-1 flex">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md' : 'text-stone-500 dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2]'}`}
                            >
                                Process
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-md' : 'text-stone-500 dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2]'}`}
                            >
                                History
                            </button>
                        </div>

                        {viewMode === 'Process' && (
                            <>
                                <div className="relative group flex-1 sm:flex-none">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#4D6E56] dark:text-[#7A9E83] group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search Manifest / Supplier..."
                                        value={receiveSearch}
                                        onChange={(e) => setReceiveSearch(e.target.value)}
                                        className="w-full sm:w-64 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl py-2.5 pl-10 pr-10 text-xs font-black uppercase tracking-widest text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all shadow-sm"
                                    />
                                    {receiveSearch && (
                                        <button onClick={() => setReceiveSearch('')} className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors" title="Clear search">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="hidden md:flex gap-3">
                                    <div className="flex-1 sm:flex-none px-4 py-2 bg-stone-100/40 dark:bg-black/20 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl flex flex-col justify-center">
                                        <p className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-0.5">Pending Manifests</p>
                                        <p className="text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] tabular-nums drop-shadow-sm font-mono leading-none">
                                            {orders.filter(o => o.status === 'Approved').reduce((sum, o) => sum + (o.lineItems?.length || 0), 0)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
