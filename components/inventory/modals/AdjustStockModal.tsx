import React from 'react';
import { Plus, Minus } from 'lucide-react';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { Product } from '../../../types';

interface AdjustStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    adjustType: 'IN' | 'OUT';
    setAdjustType: (type: 'IN' | 'OUT') => void;
    adjustQty: string;
    setAdjustQty: (qty: string) => void;
    adjustReason: string;
    setAdjustReason: (reason: string) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
    isOpen,
    onClose,
    product,
    adjustType,
    setAdjustType,
    adjustQty,
    setAdjustQty,
    adjustReason,
    setAdjustReason,
    onConfirm,
    isSubmitting
}) => {
    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock Level" size="md">
            <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-black/20 overflow-hidden">
                        {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{product.name}</h4>
                        <p className="text-xs text-secondary font-mono mt-1">{product.sku}</p>
                        <div className="mt-2 text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-2 py-0.5 rounded inline-block">
                            Current Stock: {product.stock}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setAdjustType('IN')} 
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'IN' ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:border-[#A9CBA2] dark:text-[#A9CBA2]' : 'border-gray-200 dark:border-white/10 text-stone-500'}`}
                    >
                        <div className="p-2 rounded-full bg-current bg-opacity-10"><Plus size={20} /></div>
                        <span className="font-bold text-sm">Stock In (+)</span>
                    </button>
                    <button 
                        onClick={() => setAdjustType('OUT')} 
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'OUT' ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-white/10 text-stone-500'}`}
                    >
                        <div className="p-2 rounded-full bg-current bg-opacity-10"><Minus size={20} /></div>
                        <span className="font-bold text-sm">Stock Out (-)</span>
                    </button>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Quantity</label>
                    <input 
                        type="number" 
                        value={adjustQty} 
                        onChange={(e) => setAdjustQty(e.target.value)} 
                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all" 
                        placeholder="0" 
                        min="1" 
                        autoFocus 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Reason</label>
                    <select 
                        aria-label="Adjustment Reason" 
                        value={adjustReason} 
                        onChange={(e) => setAdjustReason(e.target.value)} 
                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                    >
                        <option>Stock Correction</option>
                        <option>Damaged Goods</option>
                        <option>Received Shipment</option>
                        <option>Return</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant={adjustType === 'IN' ? 'success' : 'danger'} 
                        onClick={onConfirm} 
                        disabled={!adjustQty || parseInt(adjustQty) <= 0 || isSubmitting} 
                        loading={isSubmitting}
                    >
                        Confirm Adjustment
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
