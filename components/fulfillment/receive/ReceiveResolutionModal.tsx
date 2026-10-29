import React, { useState } from 'react';
import { X, Search, ChevronRight, Loader2 } from 'lucide-react';
import { Product } from '../../../types';
import { productsService } from '../../../services/supabase.service';
import { posDB } from '../../../services/db/pos.db';
import { systemLogsService } from '../../../services/system-logs.service';

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
    t: (key: string, params?: Record<string, string | number>) => string;
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
    const [mappingProductId, setMappingProductId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-2xl">
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-between items-center">
                    <h3 className="text-sm md:text-base font-bold text-[var(--theme-text-primary)] leading-tight flex items-center gap-2">
                        <span>{t('warehouse.resolveUnknownBarcode')}:</span>
                        <span className="text-[var(--theme-text-primary)] font-mono px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs md:text-sm">{resolvingBarcode.barcode}</span>
                    </h3>
                    <button
                        onClick={() => setResolvingBarcode(null)}
                        className="p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close Resolution Modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 md:p-6 space-y-4 bg-[var(--theme-bg-app)]">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                        <input
                            type="text"
                            placeholder={t('warehouse.searchProductToMap')}
                            value={resolutionSearch}
                            onChange={(e) => setResolutionSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs md:text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)] font-mono min-h-[44px]"
                            aria-label="Search product to map"
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                        {products.filter(p => !resolutionSearch || p.name.toLowerCase().includes(resolutionSearch.toLowerCase()) || p.sku.toLowerCase().includes(resolutionSearch.toLowerCase())).slice(0, 10).map(product => {
                            const isMapping = mappingProductId === product.id;
                            const isBusy = isSubmitting || isMapping || mappingProductId !== null;

                            return (
                                <div key={product.id} onClick={async () => {
                                    if (isBusy) return;
                                    setMappingProductId(product.id);

                                    try {
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

                                        const targetSiteId = product.siteId || (product as any).site_id;
                                        if (targetSiteId) {
                                            posDB.getCachedProducts(targetSiteId).then(cached => {
                                                if (cached && Array.isArray(cached) && cached.length > 0) {
                                                    const updatedCache = cached.map(p => p.id === product.id ? { ...p, barcodes: updatedBarcodes } : p);
                                                    posDB.cacheProducts(targetSiteId, updatedCache);
                                                }
                                            }).catch(() => {});
                                        }

                                        systemLogsService.create({
                                            action: 'PRODUCT_BARCODE_MAPPED',
                                            details: {
                                                productId: product.id,
                                                sku: product.sku,
                                                name: product.name,
                                                newBarcode,
                                                barcodes: updatedBarcodes,
                                            },
                                            module: 'Inventory',
                                            user_name: 'Receiving Staff',
                                            site_id: targetSiteId,
                                            entity_type: 'product',
                                            entity_id: product.id,
                                        }).catch(() => {});

                                        setUnresolvedScans(prev => prev.filter(s => s.barcode !== resolvingBarcode.barcode));
                                        setResolvingBarcode(null);
                                        addNotification('success', t('warehouse.mappedToProduct', { name: product.name }) || `Mapped to ${product.name}`);
                                        await refreshData();
                                    } finally {
                                        setMappingProductId(null);
                                    }
                                }} className={`p-3.5 md:p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex justify-between items-center group transition-colors shadow-sm ${isBusy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--theme-bg-subtle)]'}`}>
                                    <div>
                                        <p className="font-semibold text-[var(--theme-text-primary)] text-xs md:text-sm transition-colors">{product.name}</p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">{product.sku}</p>
                                    </div>
                                    <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors">
                                        {isMapping ? (
                                            <Loader2 size={16} className="animate-spin text-[var(--theme-text-primary)]" />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
