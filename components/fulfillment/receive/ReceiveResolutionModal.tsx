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
    t: (key: string) => string;
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
    isSubmitting,
    t
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden">
            <div className="glass-panel rounded-3xl w-full max-w-2xl overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[100px] rounded-full pointer-events-none opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/10 dark:bg-amber-700/5 blur-[80px] rounded-full pointer-events-none opacity-50" />
                <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-[0.2em] leading-tight">{t('warehouse.resolveUnknownBarcode')}: <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono underline decoration-slate-900/20 dark:decoration-zinc-700">{resolvingBarcode.barcode}</span></h3>
                    <button onClick={() => setResolvingBarcode(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-all" aria-label="Close Resolution Modal"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchProductToMap')}
                            value={resolutionSearch}
                            onChange={(e) => setResolutionSearch(e.target.value)}
                            className="woody-input !pl-11 py-4 text-[10px] uppercase tracking-widest font-mono"
                            aria-label="Search product to map"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {products.filter(p => !resolutionSearch || p.name.toLowerCase().includes(resolutionSearch.toLowerCase()) || p.sku.toLowerCase().includes(resolutionSearch.toLowerCase())).slice(0, 10).map(product => (
                            <div key={product.id} onClick={async () => {
                                if (isSubmitting) return;

                                const getBarcodesArray = (barcodes: any): string[] => {
                                    if (!barcodes) return [];
                                    if (Array.isArray(barcodes)) return barcodes.filter(b => typeof b === 'string');
                                    if (typeof barcodes === 'string') {
                                        let clean = barcodes.trim();
                                        if (clean.startsWith('{') && clean.endsWith('}')) {
                                            return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                                        }
                                        if (clean.startsWith('[') && clean.endsWith(']')) {
                                            try {
                                                return JSON.parse(clean);
                                            } catch (e) {
                                                return clean.substring(1, clean.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                                            }
                                        }
                                        return [clean];
                                    }
                                    return [];
                                };

                                const currentBarcodes = getBarcodesArray(product.barcodes);
                                let updatedBarcodes = currentBarcodes;
                                const newBarcode = resolvingBarcode.barcode.trim();
                                if (!currentBarcodes.includes(newBarcode)) {
                                    updatedBarcodes = [...currentBarcodes, newBarcode];
                                }

                                await productsService.update(product.id, { barcodes: updatedBarcodes });
                                setUnresolvedScans(prev => prev.filter(s => s.barcode !== resolvingBarcode.barcode));
                                setResolvingBarcode(null);
                                addNotification('success', `Mapped to ${product.name}`);
                                refreshData();
                            }} className={`p-4 bg-white/40 dark:bg-[#1C2620]/40 border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] rounded-2xl flex justify-between items-center group transition-all hover:scale-[1.01] shadow-sm hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2C5E3B]/10'}`}>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight text-xs group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{product.name}</p>
                                    <p className="text-[9px] text-slate-400 dark:text-zinc-600 tracking-[0.2em] uppercase mt-1 font-mono transition-colors group-hover:text-[#2C5E3B]/60 dark:group-hover:text-[#A9CBA2]/60">{product.sku}</p>
                                </div>
                                <div className="p-2 bg-[#FAF8F5] dark:bg-[#1C2620]/30 rounded-lg group-hover:bg-[#2C5E3B] dark:group-hover:bg-[#A9CBA2] transition-all border border-[#E2DCCE] dark:border-emerald-950/20">
                                    <ChevronRight size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:text-white dark:group-hover:text-[#1E3B24]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
