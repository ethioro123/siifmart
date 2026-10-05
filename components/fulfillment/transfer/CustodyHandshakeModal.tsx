import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Truck, UserCheck, X, FileText } from 'lucide-react';
import { WMSJob, ReceivingItem, Product, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface CustodyHandshakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (discrepancyDetails?: { hasDiscrepancy: boolean; discrepancyCount: number; driverAcknowledged: boolean }) => Promise<void>;
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    allProducts: Product[];
    currentUser: User | null;
    driverName?: string;
    isSubmitting: boolean;
}

export const CustodyHandshakeModal: React.FC<CustodyHandshakeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    activeTransferJob,
    transferReceiveItems,
    allProducts,
    currentUser,
    driverName = 'Assigned Driver / Logistics Courier',
    isSubmitting
}) => {
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

    const hasDiscrepancy = discrepantItems.length > 0;
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#151D18] border border-[#E2DCCE] dark:border-[#2C5E3B]/30 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E2DCCE]/60 dark:border-white/10 flex items-center justify-between bg-stone-50/80 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${hasDiscrepancy ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                            {hasDiscrepancy ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                Digital Dual-Handshake
                            </h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                                Chain of Custody & Acceptance Responsibility
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
                    
                    {/* Legal Custody Notice */}
                    <div className="p-3.5 rounded-2xl bg-stone-100/70 dark:bg-white/[0.03] border border-[#E2DCCE]/70 dark:border-white/5 text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        <span className="font-black text-stone-900 dark:text-white uppercase mr-1">Custody Principle:</span>
                        You inspect before you accept. By certifying receipt, custody of this cargo is legally transferred to you. Any unrecorded shortage or damage becomes the accepting receiver's administrative liability.
                    </div>

                    {/* Parties Handshake Card */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl border border-stone-200 dark:border-white/5 bg-stone-50/50 dark:bg-black/20">
                            <div className="flex items-center gap-2 mb-1 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                <Truck size={12} className="text-amber-600 dark:text-amber-400" /> Relinquishing Custody
                            </div>
                            <p className="font-black text-stone-850 dark:text-stone-100 truncate">{driverName}</p>
                            <p className="text-[10px] text-stone-400 font-mono">Transit Driver / Courier</p>
                        </div>

                        <div className="p-3 rounded-2xl border border-[#2C5E3B]/20 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5">
                            <div className="flex items-center gap-2 mb-1 text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">
                                <UserCheck size={12} /> Assuming Custody
                            </div>
                            <p className="font-black text-stone-850 dark:text-stone-100 truncate">{currentUser?.name || 'Receiver Staff'}</p>
                            <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">Store Receiving Custodian</p>
                        </div>
                    </div>

                    {/* Clean Receipt vs Discrepancy Alert */}
                    {!hasDiscrepancy ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <p className="font-black text-sm uppercase tracking-tight">100% Count Match — Zero Discrepancies</p>
                                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 mt-0.5">
                                    All units received in Good Condition matching manifest ({formatJobId(activeTransferJob)}).
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black uppercase tracking-tight">Discrepancy Detected ({totalDiscrepantUnits} Units Affected)</p>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/75 mt-0.5">
                                        This variance will be permanently recorded in enterprise audit logs. Transit driver's accuracy score on the national gamification leaderboard will be penalized.
                                    </p>
                                </div>
                            </div>

                            {/* Discrepant Items List */}
                            <div className="border border-stone-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
                                {discrepantItems.map((item, idx) => {
                                    const product = allProducts.find(p => p.id === item.productId);
                                    const expected = item.expectedQty || 0;
                                    const received = item.receivedQty || 0;
                                    const variance = received - expected;

                                    return (
                                        <div key={idx} className="p-3 flex items-center justify-between bg-stone-50/40 dark:bg-white/[0.01]">
                                            <div className="min-w-0 flex-1 mr-3">
                                                <p className="font-black text-stone-850 dark:text-stone-200 truncate">{product?.name || 'Item'}</p>
                                                <p className="text-[10px] text-stone-400 font-mono">{product?.sku} · Condition: <span className="font-bold text-amber-600 dark:text-amber-400">{item.condition}</span></p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${variance < 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                                    {variance > 0 ? `+${variance}` : variance} ({received}/{expected})
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dual-Signoff Checkboxes */}
                    <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-white/10">
                        <label className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5 cursor-pointer hover:border-[#2C5E3B]/40 transition-colors">
                            <input
                                type="checkbox"
                                checked={receiverCertified}
                                onChange={(e) => setReceiverCertified(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded text-[#2C5E3B] focus:ring-[#2C5E3B] border-stone-300 dark:border-stone-700"
                            />
                            <span className="text-[11px] text-stone-700 dark:text-stone-300 font-medium">
                                <strong className="text-stone-900 dark:text-white font-black block mb-0.5">Receiver Certification</strong>
                                I certify that I have physically counted and inspected this load. I assume 100% custody and responsibility for the accepted items.
                            </span>
                        </label>

                        {hasDiscrepancy && (
                            <label className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={driverAcknowledged}
                                    onChange={(e) => setDriverAcknowledged(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700"
                                />
                                <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                                    <strong className="text-stone-900 dark:text-white font-black block mb-0.5">Driver Discrepancy Acknowledgement</strong>
                                    Delivering driver co-signs and acknowledges the recorded cargo variance before departing dock.
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-[#E2DCCE]/60 dark:border-white/10 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-black/20">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-white/5 transition-all text-xs"
                    >
                        Revise Counts
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={!canSubmit || isSubmitting}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${canSubmit && !isSubmitting
                            ? hasDiscrepancy 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-98'
                                : 'woody-btn-primary hover:scale-[1.01] active:scale-98'
                            : 'bg-stone-200 dark:bg-white/10 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                        }`}
                    >
                        <ShieldCheck size={16} />
                        {isSubmitting ? 'Sealing Custody...' : hasDiscrepancy ? 'Seal Discrepancy Handshake' : 'Execute Clean Custody Handshake'}
                    </button>
                </div>
            </div>
        </div>
    );
};
