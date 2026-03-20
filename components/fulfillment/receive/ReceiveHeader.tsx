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
            {/* Global Scan Input for Active Receive */}
            <div className="p-3 md:p-6 bg-white dark:bg-black/40 rounded-2xl border border-zinc-300 dark:border-white/5 shrink-0 backdrop-blur-xl shadow-sm relative overflow-hidden group/header">
                {/* 🌟 Futuristic Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none opacity-0 group-hover/header:opacity-100 transition-opacity duration-1000" />
                <div className="hidden md:block absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/5 dark:bg-violet-500/10 blur-[80px] rounded-full -ml-10 -mb-10 pointer-events-none opacity-0 group-hover/header:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-300 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                            <Scan size={20} />
                        </div>
                        <input
                            ref={scanInputRef}
                            autoFocus
                            type="text"
                            placeholder="Scan barcode or enter SKU..."
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-black border-2 border-zinc-300 dark:border-white/10 rounded-xl text-zinc-950 dark:text-zinc-100 font-mono text-sm focus:border-cyan-500/50 dark:focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/5 focus:outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 shadow-sm"
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
                        className="h-12 px-8 bg-zinc-100 dark:bg-cyan-500 hover:bg-zinc-200 dark:hover:bg-cyan-400 text-zinc-950 dark:text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-sm dark:shadow-cyan-500/20 active:scale-[0.98] border border-zinc-300 dark:border-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
            </div >

            {/* UNRESOLVED ITEMS QUEUE */}
            {
                unresolvedScans.length > 0 && (
                    <div className="bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-300 dark:border-zinc-800 rounded-xl md:rounded-2xl p-3 md:p-5 shrink-0 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                                    <AlertTriangle size={18} className="text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-300 uppercase tracking-[0.2em]">Unresolved Barcodes</span>
                                    <span className="ml-2 px-2.5 py-0.5 bg-zinc-200 dark:bg-zinc-100 text-zinc-900 dark:text-black text-[10px] font-black rounded-lg border border-zinc-300 dark:border-white/10 shadow-sm">{unresolvedScans.length}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setUnresolvedScans([])}
                                className="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {unresolvedScans.map((scan, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-black border-2 border-zinc-300 dark:border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3 group hover:border-zinc-900 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-all shadow-sm dark:shadow-none"
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
                                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">{scan.barcode}</span>
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-black uppercase tracking-tighter mt-0.5">Qty: {scan.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Decrease logic would go here if implemented in main ReceiveTab
                                            }}
                                            className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/5"
                                            title="Decrease Quantity"
                                            aria-label={`Decrease quantity for ${scan.barcode}`}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="w-16 text-center font-mono font-black text-zinc-900 dark:text-zinc-100 text-lg" aria-live="polite">
                                            {scan.qty}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Increase logic
                                            }}
                                            className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/5"
                                            title="Increase Quantity"
                                            aria-label={`Increase quantity for ${scan.barcode}`}
                                        >
                                            <Plus size={14} className="text-zinc-900 dark:text-zinc-100" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUnresolvedScans(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <X size={14} className="text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-zinc-200" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* RECEIVE INTELLIGENCE HEADER */}
            <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-300 dark:border-white/5 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden shadow-sm group/intel">
                {/* 🌈 Futuristic Mesh Accent — hidden on mobile */}
                <div className="hidden md:block absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none opacity-50 group-hover/intel:opacity-100 transition-opacity duration-1000" />
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-zinc-200/5 to-transparent dark:from-white/5 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-6 relative z-10">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <Truck className="text-zinc-900 dark:text-zinc-300" size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{t('warehouse.receivingQueue')}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse" />
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">{t('warehouse.approvedPOsWillAppear')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        {/* VIEW MODE TOGGLE */}
                        <div className="bg-zinc-100 dark:bg-black/30 p-1 rounded-xl border border-zinc-300 dark:border-zinc-800 flex">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Process' ? 'bg-white dark:bg-cyan-500 text-zinc-950 dark:text-black shadow-md dark:shadow-cyan-500/20' : 'text-zinc-600 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-cyan-400'}`}
                            >
                                Process
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'History' ? 'bg-white dark:bg-violet-500 text-zinc-950 dark:text-black shadow-md dark:shadow-violet-500/20' : 'text-zinc-600 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-violet-400'}`}
                            >
                                History
                            </button>
                        </div>

                        {viewMode === 'Process' && (
                            <>
                                <div className="relative group flex-1 sm:flex-none">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-600 dark:text-zinc-300 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search Manifest / Supplier..."
                                        value={receiveSearch}
                                        onChange={(e) => setReceiveSearch(e.target.value)}
                                        className="w-full sm:w-64 bg-zinc-50 dark:bg-black/30 border border-zinc-300 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-500 transition-all shadow-sm"
                                    />
                                    {receiveSearch && (
                                        <button onClick={() => setReceiveSearch('')} className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" title="Clear search">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="hidden md:flex gap-3">
                                    <div className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-50 dark:bg-black/30 border border-zinc-300 dark:border-zinc-800 rounded-xl">
                                        <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Pending Units</p>
                                        <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
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
