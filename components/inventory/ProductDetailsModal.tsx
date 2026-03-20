import React from 'react';
import { Package, Tag, Hash, Layers, Store, Calendar, MapPin, Search } from 'lucide-react';
import { Product } from '../../types';
import Modal from '../Modal';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';

import { getSellUnit } from '../../utils/units';

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
    if (!product) return null;

    // Smart Quantity Calculation (e.g., 30 units of 10 KG = 300 KG)
    const isWeightOrVolume = product.unit && ['KG', 'L', 'G', 'ML'].includes(product.unit.toUpperCase());
    const sizeNum = product.size ? parseFloat(product.size.replace(/[^0-9.]/g, '')) : 1;
    const physicalQty = isWeightOrVolume && !isNaN(sizeNum) ? product.stock * sizeNum : null;
    const unitObj = product.unit ? getSellUnit(product.unit) : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Details" size="xl">
            <div className="space-y-6">

                {/* Core Product Info Header */}
                <div className="flex gap-6 items-start p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                        {product.image && !product.image.includes('placeholder.com') ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={32} className="text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{product.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 rounded-lg text-xs font-black font-mono tracking-widest">
                                <Hash size={12} /> {product.sku}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest">
                                <Tag size={12} /> {product.category}
                            </span>
                        </div>

                        <div className="mt-4 flex gap-6">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Stock</p>
                                {physicalQty !== null ? (
                                    <div className="mt-0.5">
                                        <p className={`text-lg font-black font-mono ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {physicalQty} <span className="text-xs ml-0.5 opacity-70">{unitObj?.shortLabel || product.unit}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 bg-gray-100 dark:bg-white/5 inline-block px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                                            {sizeNum} {unitObj?.shortLabel || product.unit} × {product.stock} {product.packQuantity ? 'Packs' : 'Units'} = {physicalQty} {unitObj?.shortLabel || product.unit}
                                        </p>
                                    </div>
                                ) : (
                                    <p className={`text-lg font-black font-mono mt-0.5 ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {product.stock} <span className="text-xs ml-1 opacity-70">{unitObj?.shortLabel || product.unit || 'Units'}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Retail Price</p>
                                <p className="text-lg font-black font-mono text-gray-900 dark:text-white mt-0.5">
                                    {formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PO & Purchasing Attributes */}
                <div className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Store size={16} className="text-cyber-primary" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Purchase Order Attributes</h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Brand</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.brand || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Size/Weight</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.size || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Measurement Unit</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.unit || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Pack Quantity</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.packQuantity || product.pack_quantity || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Minimum Stock</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.minStock || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Maximum Stock</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.maxStock || '—'}</p>
                        </div>
                    </div>

                    {/* Extended PO Description / Custom Attributes */}
                    {((product as any).description || (product as any).customAttributes) && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                            {(product as any).description && (
                                <div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Extended PO Description</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-black/40 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                                        {(product as any).description}
                                    </p>
                                </div>
                            )}

                            {(product as any).customAttributes && (
                                <div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Raw PO Attributes</p>
                                    <div className="text-xs font-mono text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-black/40 p-4 rounded-lg border border-gray-100 dark:border-white/5 overflow-x-auto">
                                        <pre>{JSON.stringify((product as any).customAttributes, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Location & Tracking Attributes */}
                <div className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <MapPin size={16} className="text-blue-500" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Logistics & Allocation</h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Assigned Location</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.location || 'Unassigned'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Shelf Position</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.shelfPosition || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Registered Barcodes</p>
                            {(() => {
                                // Combine primary barcode + all aliases, deduplicated
                                const allBarcodes = new Set<string>();
                                if (product.barcode) allBarcodes.add(product.barcode.trim());
                                if ((product as any).barcodes && Array.isArray((product as any).barcodes)) {
                                    (product as any).barcodes.forEach((b: string) => { if (b?.trim()) allBarcodes.add(b.trim()); });
                                }
                                const barcodeList = Array.from(allBarcodes);
                                return barcodeList.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {barcodeList.map((bc, i) => (
                                            <span key={i} className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded text-xs font-mono tracking-tight">
                                                {bc}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">—</p>
                                );
                            })()}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${product.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                    product.status === 'low_stock' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {product.status.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Date Added</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {product.createdAt || (product as any).created_at ? new Date(product.createdAt || (product as any).created_at).toLocaleDateString() : '—'}
                            </p>
                        </div>
                    </div>

                    {product.receivingNotes && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Receiving Notes</p>
                            <div className="text-sm text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 italic">
                                "{product.receivingNotes}"
                            </div>
                        </div>
                    )}
                </div>

                {/* Visual Notice: No Cost Display */}
                <div className="text-center pb-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">
                        Pricing details restricted • Cost visibility hidden
                    </p>
                </div>

            </div>
        </Modal>
    );
};
