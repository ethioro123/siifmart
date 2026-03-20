import React from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { Product } from '../../../types';
import { productsService } from '../../../services/supabase.service';

interface ReceiveResolutionModalProps {
    resolvingBarcode: { barcode: string; qty: number };
    setResolvingBarcode: (val: { barcode: string; qty: number } | null) => void;
    resolutionSearch: string;
    setResolutionSearch: (val: string) => void;
    products: Product[];
    setUnresolvedScans: React.Dispatch<React.SetStateAction<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    refreshData: () => Promise<void>;
    isSubmitting: boolean;
}

export const ReceiveResolutionModal: React.FC<ReceiveResolutionModalProps> = ({
    resolvingBarcode,
    setResolvingBarcode,
    resolutionSearch,
    setResolutionSearch,
    products,
    setUnresolvedScans,
    addNotification,
    refreshData,
    isSubmitting
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-black border-2 border-zinc-200 dark:border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative">
                {/* 🌟 Modal Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 dark:bg-violet-500/10 blur-[80px] rounded-full pointer-events-none opacity-50" />
                <div className="p-6 border-b border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-[0.2em] leading-tight">Resolve Unknown Barcode: <span className="text-zinc-900 dark:text-zinc-300 font-mono underline decoration-zinc-900/20 dark:decoration-zinc-700">{resolvingBarcode.barcode}</span></h3>
                    <button onClick={() => setResolvingBarcode(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all" aria-label="Close Resolution Modal"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search product to map..."
                            value={resolutionSearch}
                            onChange={(e) => setResolutionSearch(e.target.value)}
                            className="w-full bg-white dark:bg-black border-2 border-zinc-300 dark:border-white/10 rounded-2xl pl-11 py-4 text-zinc-950 dark:text-zinc-100 font-black uppercase tracking-widest text-[10px] focus:border-cyan-500/50 dark:focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10 transition-all focus:outline-none shadow-sm placeholder:text-zinc-600 dark:placeholder:text-zinc-700 font-mono"
                            aria-label="Search product to map"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {products.filter(p => !resolutionSearch || p.name.toLowerCase().includes(resolutionSearch.toLowerCase()) || p.sku.toLowerCase().includes(resolutionSearch.toLowerCase())).slice(0, 10).map(product => (
                            <div key={product.id} onClick={async () => {
                                if (isSubmitting) return;
                                const updatedBarcodes = [...(product.barcodes || []), resolvingBarcode.barcode];
                                await productsService.update(product.id, { barcodes: updatedBarcodes });
                                setUnresolvedScans(prev => prev.filter(s => s.barcode !== resolvingBarcode.barcode));
                                setResolvingBarcode(null);
                                addNotification('success', `Mapped to ${product.name}`);
                                await refreshData();
                            }} className={`p-4 bg-white dark:bg-black/40 border-2 border-zinc-200 dark:border-white/5 rounded-2xl flex justify-between items-center group transition-all hover:scale-[1.01] shadow-sm hover:border-cyan-500/30 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-cyan-500/5'}`}>
                                <div>
                                    <p className="font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-tight text-xs group-hover:text-cyan-400 transition-colors">{product.name}</p>
                                    <p className="text-[9px] text-zinc-600 dark:text-zinc-600 tracking-[0.2em] uppercase mt-1 font-mono transition-colors group-hover:text-cyan-500/60">{product.sku}</p>
                                </div>
                                <div className="p-2 bg-zinc-100 dark:bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500 dark:group-hover:bg-cyan-400 transition-all border border-zinc-200 dark:border-cyan-500/20">
                                    <ChevronRight size={16} className="text-zinc-950 dark:text-cyan-400 group-hover:text-white dark:group-hover:text-black" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
