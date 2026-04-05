import React from 'react';
import { Package, Tag, Hash, Layers, Store, Calendar, MapPin, Search } from 'lucide-react';
import { Product, StockMovement, Employee } from '../../types';
import Modal from '../Modal';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { useData } from '../../contexts/DataContext';

import { getSellUnit } from '../../utils/units';

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
    const { movements, employees } = useData();

    if (!product) return null;

    // Smart Quantity Calculation (e.g., 30 units of 10 KG = 300 KG)
    const isWeightOrVolume = product.unit && ['KG', 'L', 'G', 'ML'].includes(product.unit.toUpperCase());
    const sizeNum = product.size ? parseFloat(product.size.replace(/[^0-9.]/g, '')) : 1;
    const physicalQty = isWeightOrVolume && !isNaN(sizeNum) ? product.stock * sizeNum : null;
    const unitObj = product.unit ? getSellUnit(product.unit) : null;

    const recentReceives = movements
        ? movements
            .filter(m => (m.productId === product.id || m.productId === product.productId) && m.type === 'IN')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        : [];

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

                {/* Sales & Identification (POS Focused) */}
                <div className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Tag size={16} className="text-blue-500" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Sales & Identification</h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Registered Barcodes</p>
                            {(() => {
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
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Measurement Unit</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.unit || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sale Price</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {product.salePrice ? formatCompactNumber(product.salePrice, { currency: CURRENCY_SYMBOL }) : 'No active discount'}
                            </p>
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
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">System Date Added</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {product.createdAt || (product as any).created_at ? new Date(product.createdAt || (product as any).created_at).toLocaleDateString() : '—'}
                            </p>
                        </div>
                        {product.brand && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Brand</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.brand}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Receiving History */}
                <div className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Layers size={16} className="text-purple-500" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Recent Restocks</h3>
                    </div>

                    {recentReceives.length > 0 ? (
                        <div className="space-y-3">
                            {recentReceives.map(movement => {
                                const employee = employees?.find(e => e.id === movement.performedBy || e.name === movement.performedBy);
                                const employeeName = employee ? employee.name : movement.performedBy || 'System';
                                return (
                                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center font-black text-xs">
                                                +{movement.quantity}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase">{employeeName}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                    {new Date(movement.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-gray-500 italic text-center py-4">No recent receiving history available for this product.</p>
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
