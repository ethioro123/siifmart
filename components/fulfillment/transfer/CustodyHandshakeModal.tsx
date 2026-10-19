import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, CheckCircle, Truck, UserCheck, X } from 'lucide-react';
import { WMSJob, ReceivingItem, Product, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface CustodyHandshakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (discrepancyDetails?: { hasDiscrepancy: boolean; discrepancyCount: number; driverAcknowledged: boolean }) => Promise<void>;
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    allProducts: Product[];
    products?: Product[];
    currentUser: User | null;
    driverName?: string;
    isSubmitting: boolean;
    verifiedHasDiscrepancy?: boolean;
}

export const CustodyHandshakeModal: React.FC<CustodyHandshakeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    activeTransferJob,
    transferReceiveItems,
    allProducts,
    products = [],
    currentUser,
    driverName = 'Assigned Driver / Logistics Courier',
    isSubmitting,
    verifiedHasDiscrepancy
}) => {
    const isBlindReceiving = true;
    const [receiverCertified, setReceiverCertified] = useState(false);
    const [driverAcknowledged, setDriverAcknowledged] = useState(false);

    if (!isOpen) return null;

    // Evaluate discrepancies
    const discrepantItems = transferReceiveItems.filter(item => {
        const expected = item.expectedQty || 0;
        const received = item.receivedQty || 0;
        const isQtyMismatch = received !== expected;
        const isDamaged = item.condition === 'Damaged' || item.condition === 'Short';
        return isQtyMismatch || isDamaged;
    });

    const hasDiscrepancy = verifiedHasDiscrepancy ?? discrepantItems.length > 0;
    const displayedDiscrepantItems = discrepantItems;
    const totalDiscrepantUnits = discrepantItems.reduce((sum, item) => {
        const diff = Math.abs((item.expectedQty || 0) - (item.receivedQty || 0));
        return sum + (diff > 0 ? diff : (item.condition === 'Damaged' ? item.receivedQty || 1 : 0));
    }, 0);

    const canSubmit = receiverCertified && (!hasDiscrepancy || driverAcknowledged);

    const handleExecute = async () => {
        if (!canSubmit || isSubmitting) return;
        await onConfirm({
            hasDiscrepancy,
            discrepancyCount: totalDiscrepantUnits,
            driverAcknowledged
        });
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${hasDiscrepancy ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                            {hasDiscrepancy ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">
                                Digital Dual-Handshake
                            </h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                Chain of Custody & Acceptance Responsibility
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card)] transition-colors touch-manipulation"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                    
                    {/* Legal Custody Notice */}
                    <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] leading-relaxed font-normal">
                        <span className="font-bold text-[var(--theme-text-primary)] uppercase mr-1">Custody Principle:</span>
                        You inspect before you accept. By certifying receipt, custody of this cargo is legally transferred to you. Any unrecorded shortage or damage becomes the accepting receiver's administrative liability.
                    </div>

                    {/* Parties Handshake Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
                                <Truck size={14} /> Relinquishing Custody
                            </div>
                            <p className="font-bold text-[var(--theme-text-primary)] break-words text-sm leading-tight">{driverName}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">Transit Driver / Courier</p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                                <UserCheck size={14} /> Assuming Custody
                            </div>
                            <p className="font-bold text-[var(--theme-text-primary)] break-words text-sm leading-tight">{currentUser?.name || 'Receiver Staff'}</p>
                            <p className="text-[11px] text-primary font-mono">Store Receiving Custodian</p>
                        </div>
                    </div>

                    {/* Clean Receipt vs Discrepancy Alert */}
                    {!hasDiscrepancy ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <p className="font-bold text-sm tracking-tight">100% Count Match — Zero Discrepancies</p>
                                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                                    All units received in Good Condition matching manifest ({formatJobId(activeTransferJob)}).
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold tracking-tight">
                                        {isBlindReceiving
                                            ? `Discrepancy Detected (${discrepantItems.length} Line Item${discrepantItems.length > 1 ? 's' : ''} Affected)`
                                            : `Discrepancy Detected (${totalDiscrepantUnits} Units Affected)`}
                                    </p>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                                        This variance will be permanently recorded in enterprise audit logs. Transit driver's accuracy score on the national gamification leaderboard will be penalized.
                                    </p>
                                </div>
                            </div>

                            {/* Discrepant Items List */}
                            {displayedDiscrepantItems.length > 0 && <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden divide-y divide-[var(--theme-border)]">
                                {displayedDiscrepantItems.map((item, idx) => {
                                    const product = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
                                    const expected = item.expectedQty || 0;
                                    const received = item.receivedQty || 0;
                                    const variance = received - expected;

                                    return (
                                        <div key={idx} className="p-3 flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                                            <div className="min-w-0 flex-1 mr-3">
                                                <p className="font-bold text-[var(--theme-text-primary)] truncate">{product?.name || 'Item'}</p>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{product?.sku} · Condition: <span className="font-semibold text-amber-500">{item.condition}</span></p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${variance < 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                                    {isBlindReceiving
                                                        ? `Counted: ${received} (Variance)`
                                                        : `${variance > 0 ? `+${variance}` : variance} (${received}/${expected})`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>}
                        </div>
                    )}

                    {/* Dual-Signoff Checkboxes */}
                    <div className="space-y-3 pt-2 border-t border-[var(--theme-border)]">
                        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] cursor-pointer hover:border-primary/40 transition-colors touch-manipulation">
                            <input
                                type="checkbox"
                                checked={receiverCertified}
                                onChange={(e) => setReceiverCertified(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary border-[var(--theme-border)]"
                            />
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-normal leading-relaxed">
                                <strong className="text-[var(--theme-text-primary)] font-bold block mb-0.5">Receiver Certification</strong>
                                I certify that I have physically counted and inspected this load. I assume 100% custody and responsibility for the accepted items.
                            </span>
                        </label>

                        {hasDiscrepancy && (
                            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors touch-manipulation">
                                <input
                                    type="checkbox"
                                    checked={driverAcknowledged}
                                    onChange={(e) => setDriverAcknowledged(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700"
                                />
                                <span className="text-[11px] text-amber-900 dark:text-amber-200 font-normal leading-relaxed">
                                    <strong className="text-[var(--theme-text-primary)] font-bold block mb-0.5">Driver Discrepancy Acknowledgement</strong>
                                    Delivering driver co-signs and acknowledges the recorded cargo variance before departing dock.
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-[var(--theme-border)] flex items-center justify-between gap-3 bg-[var(--theme-bg-subtle)]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-semibold hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-all text-xs touch-manipulation"
                    >
                        Revise Counts
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={!canSubmit || isSubmitting}
                        className={`min-h-[44px] flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm touch-manipulation ${canSubmit && !isSubmitting
                            ? hasDiscrepancy 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-[0.99] cursor-pointer'
                                : 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] active:scale-[0.99] cursor-pointer'
                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                        }`}
                    >
                        <ShieldCheck size={16} />
                        {isSubmitting ? 'Sealing Custody...' : hasDiscrepancy ? 'Seal Discrepancy Handshake' : 'Execute Clean Custody Handshake'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
