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
            <div className="space-y-5">
                {!canApprove && (
                    <div className="p-3.5 rounded-2xl bg-[var(--theme-status-warning-bg)]/10 border border-[var(--theme-status-warning-border)]/20 flex items-center gap-2.5 text-[var(--theme-status-warning-text)] text-[12px] font-semibold">
                        <Shield size={15} className="shrink-0" />
                        <span>Central HQ Approval Required. Your adjustment request will route to HQ before inventory is modified.</span>
                    </div>
                )}
                <div className="p-3.5 bg-[var(--theme-bg-hover)]/40 rounded-2xl border border-[var(--theme-border)] flex items-center gap-3.5 shadow-xs">
                    <div className="w-14 h-14 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shrink-0 flex items-center justify-center">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[var(--theme-text-secondary)] text-[11px] font-semibold">No img</span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-[var(--theme-text-primary)] tracking-tight">{product.name}</h4>
                        <p className="text-[12px] text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">{product.sku}</p>
                        <div className="mt-2 text-[11px] font-mono tabular-nums font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full inline-block">
                            Current Stock: {product.stock}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setAdjustType('IN')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                            adjustType === 'IN'
                                ? 'bg-[var(--theme-status-success-bg)]/10 border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] shadow-xs'
                                : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-hover)]'
                        }`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-current/15 flex items-center justify-center">
                            <Plus size={16} />
                        </div>
                        <span className="font-semibold text-[13px]">Stock In (+)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setAdjustType('OUT')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                            adjustType === 'OUT'
                                ? 'bg-[var(--theme-status-danger-bg)]/10 border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] shadow-xs'
                                : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-hover)]'
                        }`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-current/15 flex items-center justify-center">
                            <Minus size={16} />
                        </div>
                        <span className="font-semibold text-[13px]">Stock Out (-)</span>
                    </button>
                </div>
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">Quantity</label>
                    <input
                        type="number"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        className="w-full h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 text-base font-semibold font-mono tabular-nums text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all shadow-xs"
                        placeholder="0"
                        min="0.01"
                        step="any"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">Reason</label>
                    <select
                        aria-label="Adjustment Reason"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 text-[13px] font-medium text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all shadow-xs cursor-pointer"
                    >
                        <option>Stock Correction</option>
                        <option>Damaged Goods</option>
                        <option>Received Shipment</option>
                        <option>Return</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="flex justify-end items-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!adjustQty || parseFloat(adjustQty) <= 0 || isSubmitting}
                        className={`h-9 px-4 rounded-xl text-[13px] font-semibold text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            adjustType === 'IN' ? 'bg-[var(--theme-status-success-bg)] hover:opacity-95' : 'bg-[var(--theme-status-danger-bg)] hover:opacity-95'
                        }`}
                    >
                        {canApprove ? 'Confirm Adjustment' : 'Submit for HQ Approval'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
