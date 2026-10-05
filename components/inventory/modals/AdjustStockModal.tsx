import React from 'react';
import { Plus, Minus, Shield } from 'lucide-react';
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
    canApprove?: boolean;
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
    isSubmitting,
    canApprove = true
}) => {
    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock Level" size="md">
            <div className="space-y-6">
                {!canApprove && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        <Shield size={14} className="shrink-0" />
                        <span>Central HQ Approval Required. Your adjustment request will route to HQ before inventory is modified.</span>
                    </div>
                )}
                <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden">
                        {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-[var(--theme-text-primary)]">{product.name}</h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-mono mt-1">{product.sku}</p>
                        <div className="mt-2 text-xs font-bold text-[var(--theme-text-primary)] bg-[var(--theme-pill-bg)] border border-[var(--theme-pill-border)] px-2 py-0.5 rounded inline-block">
                            Current Stock: {product.stock}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setAdjustType('IN')} 
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'IN' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-card-hover)]'}`}
                    >
                        <div className="p-2 rounded-full bg-current bg-opacity-10"><Plus size={20} /></div>
                        <span className="font-bold text-sm">Stock In (+)</span>
                    </button>
                    <button 
                        onClick={() => setAdjustType('OUT')} 
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'OUT' ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-card-hover)]'}`}
                    >
                        <div className="p-2 rounded-full bg-current bg-opacity-10"><Minus size={20} /></div>
                        <span className="font-bold text-sm">Stock Out (-)</span>
                    </button>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-[var(--theme-text-muted)] mb-1">Quantity</label>
                    <input 
                        type="number" 
                        value={adjustQty} 
                        onChange={(e) => setAdjustQty(e.target.value)} 
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-lg font-bold text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-all" 
                        placeholder="0" 
                        min="0.01"
                        step="any" 
                        autoFocus 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-[var(--theme-text-muted)] mb-1">Reason</label>
                    <select 
                        aria-label="Adjustment Reason" 
                        value={adjustReason} 
                        onChange={(e) => setAdjustReason(e.target.value)} 
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-all"
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
                        disabled={!adjustQty || parseFloat(adjustQty) <= 0 || isSubmitting} 
                        loading={isSubmitting}
                    >
                        {canApprove ? 'Confirm Adjustment' : 'Submit for HQ Approval'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
