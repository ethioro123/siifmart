import React, { useState } from 'react';
import { X, Package, Undo2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface ReturnToWarehouseModalProps {
    job: WMSJob;
    products: Product[];
    user: any;
    onClose: () => void;
    addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any;
    wmsJobsService?: any;  // For marking source job and cancelling active jobs
    jobs?: WMSJob[];       // Full jobs array to find active downstream jobs
    returnType?: 'warehouse' | 'procurement'; // 'procurement' requires procurement mgr / super_admin approval
}

const RETURN_REASONS = [
    'Wrong Item Picked',
    'Damaged',
    'Overstock',
    'Customer Refused',
    'Quality Issue',
    'Expired'
];

const RETURN_CONDITIONS = ['Good', 'Damaged', 'Expired'];

interface ReturnItem {
    productId: string;
    name: string;
    sku: string;
    maxQty: number;
    returnQty: number;
    reason: string;
    condition: string;
    selected: boolean;
}

export const ReturnToWarehouseModal: React.FC<ReturnToWarehouseModalProps> = ({
    job,
    products,
    user,
    onClose,
    addNotification,
    inventoryRequestsService,
    wmsJobsService,
    jobs = [],
    returnType = 'warehouse'
}) => {
    const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [returnItems, setReturnItems] = useState<ReturnItem[]>(() => {
        return (job.lineItems || []).map((item: any) => ({
            productId: item.productId,
            name: item.name || 'Unknown',
            sku: item.sku || '',
            maxQty: item.pickedQty || item.receivedQty || item.expectedQty || item.quantity || 1,
            returnQty: item.pickedQty || item.receivedQty || item.expectedQty || item.quantity || 1,
            reason: RETURN_REASONS[0],
            condition: RETURN_CONDITIONS[0],
            selected: false
        }));
    });

    const selectedItems = returnItems.filter(i => i.selected);

    const handleToggle = (idx: number) => {
        setReturnItems(prev => prev.map((item, i) =>
            i === idx ? { ...item, selected: !item.selected } : item
        ));
    };

    const handleFieldChange = (idx: number, field: keyof ReturnItem, value: any) => {
        setReturnItems(prev => prev.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item
        ));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;
        setIsSubmitting(true);

        try {
            for (const item of selectedItems) {
                const product = products.find(p => p.id === item.productId || p.sku === item.sku);
                const siteId = job.siteId || (job as any).site_id || product?.siteId || product?.site_id || user?.siteId || '';

                const request: any = {
                    productId: item.productId,
                    productName: item.name,
                    productSku: item.sku,
                    siteId,
                    changeType: 'stock_adjustment',
                    requestedBy: user?.name || 'WMS',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    adjustmentType: 'IN',
                    adjustmentQty: item.returnQty,
                    adjustmentReason: returnType === 'procurement'
                        ? `PO-RTN: ${item.reason} (${item.condition}) — PO ${formatJobId(job)} [REQUIRES PROCUREMENT APPROVAL]`
                        : `RTW: ${item.reason} (${item.condition}) — Job ${formatJobId(job)}`,
                    approvalRole: returnType === 'procurement' ? 'procurement_manager' : 'warehouse_manager'
                };

                await inventoryRequestsService.create(request);
            }

            // --- MARK SOURCE JOB LINE ITEMS AS RETURNED ---
            if (wmsJobsService) {
                try {
                    const now = new Date().toISOString();
                    const updatedLineItems = (job.lineItems || []).map((li: any) => {
                        const returned = selectedItems.find(si => si.productId === li.productId || si.sku === li.sku);
                        if (returned) {
                            return {
                                ...li,
                                returnedQty: (li.returnedQty || 0) + returned.returnQty,
                                returnedAt: now
                            };
                        }
                        return li;
                    });

                    await wmsJobsService.update(job.id, {
                        lineItems: updatedLineItems,
                        notes: `${job.notes || ''}\n[RTW] ${selectedItems.length} item(s) returned on ${new Date().toLocaleDateString()}`.trim()
                    });

                    // --- CANCEL ACTIVE DOWNSTREAM JOBS ---
                    const returnedProductIds = new Set(selectedItems.map(si => si.productId));
                    const returnedSkus = new Set(selectedItems.map(si => si.sku));
                    const activeDownstream = jobs.filter(j =>
                        j.id !== job.id &&
                        (j.status === 'Pending' || j.status === 'In-Progress') &&
                        j.orderRef === job.orderRef &&
                        (j.lineItems || []).some((li: any) =>
                            returnedProductIds.has(li.productId) || returnedSkus.has(li.sku)
                        )
                    );

                    for (const downstream of activeDownstream) {
                        await wmsJobsService.update(downstream.id, {
                            status: 'Cancelled',
                            notes: `Auto-cancelled: items returned via RTW from ${formatJobId(job)}`
                        });
                    }

                    if (activeDownstream.length > 0) {
                        addNotification('info', `${activeDownstream.length} active job(s) cancelled due to return`);
                    }
                } catch (markErr: any) {
                    console.error('Failed to mark job items as returned:', markErr);
                    // Non-blocking — the inventory request was still created
                }
            }

            setStep('done');
            addNotification('success', `${selectedItems.length} item(s) submitted for return approval`);
        } catch (err: any) {
            addNotification('alert', 'Failed to submit return: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f0f11] w-full max-w-2xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="relative p-6 border-b border-white/10 bg-black/40 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                <Undo2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                    {returnType === 'procurement' ? 'Return to Supplier / Warehouse' : 'Return to Warehouse'}
                                </h2>
                                <p className="text-xs text-gray-500 font-mono uppercase">Job {formatJobId(job)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

                    {step === 'done' ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <CheckCircle className="text-green-500" size={40} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-white uppercase">Return Submitted</h3>
                                <p className="text-gray-400 text-sm">
                                    {selectedItems.length} item(s) are now pending {returnType === 'procurement' ? 'procurement manager' : 'warehouse manager'} approval.
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Once approved, stock will be added back to the warehouse inventory.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                            >
                                Done
                            </button>
                        </div>
                    ) : step === 'confirm' ? (
                        <>
                            {/* Confirm Step */}
                            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                                <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                                <p className="text-amber-300 text-sm font-bold">
                                    This will create <span className="text-white">{selectedItems.length}</span> pending stock adjustment(s) requiring {returnType === 'procurement' ? 'procurement manager / super admin' : 'warehouse manager'} approval.
                                </p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[9px] text-gray-600 bg-white/[0.02] uppercase font-black tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3">Reason</th>
                                            <th className="px-4 py-3">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3">
                                                    <p className="text-white font-bold text-sm">{item.name}</p>
                                                    <p className="text-gray-600 text-[10px] font-mono">{item.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                                        {item.returnQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300 text-xs">{item.reason}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${item.condition === 'Good' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        item.condition === 'Damaged' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                        }`}>
                                                        {item.condition}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Select Step */}
                            <p className="text-gray-400 text-sm">Select items to return to warehouse inventory. A stock adjustment will be created pending manager approval.</p>

                            <div className="space-y-3">
                                {returnItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`border rounded-2xl p-4 transition-all ${item.selected
                                            ? 'bg-amber-500/5 border-amber-500/30'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => handleToggle(idx)}
                                                className="w-5 h-5 accent-amber-500 cursor-pointer shrink-0"
                                                aria-label={`Select ${item.name}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold truncate">{item.name}</p>
                                                <p className="text-gray-500 text-[10px] font-mono">{item.sku}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
                                                {returnType === 'procurement' ? 'Received' : 'Picked'}: {item.maxQty}
                                            </span>
                                        </div>

                                        {item.selected && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 tracking-widest">Return Qty</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={item.maxQty}
                                                        value={item.returnQty}
                                                        onChange={(e) => {
                                                            const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.maxQty);
                                                            handleFieldChange(idx, 'returnQty', val);
                                                        }}
                                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm font-mono focus:border-amber-500/50 focus:outline-none transition-colors"
                                                        aria-label="Return Quantity"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 tracking-widest">Reason</label>
                                                    <select
                                                        value={item.reason}
                                                        onChange={(e) => handleFieldChange(idx, 'reason', e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-amber-500/50 focus:outline-none transition-colors"
                                                        aria-label="Return Reason"
                                                    >
                                                        {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-1.5 tracking-widest">Condition</label>
                                                    <select
                                                        value={item.condition}
                                                        onChange={(e) => handleFieldChange(idx, 'condition', e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-amber-500/50 focus:outline-none transition-colors"
                                                        aria-label="Item Condition"
                                                    >
                                                        {RETURN_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {step !== 'done' && (
                    <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
                        <button
                            onClick={step === 'confirm' ? () => setStep('select') : onClose}
                            className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-sm uppercase tracking-widest transition-all"
                        >
                            {step === 'confirm' ? 'Back' : 'Cancel'}
                        </button>

                        {step === 'select' ? (
                            <button
                                disabled={selectedItems.length === 0}
                                onClick={() => setStep('confirm')}
                                className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${selectedItems.length > 0
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                <Package size={16} />
                                Review ({selectedItems.length})
                            </button>
                        ) : (
                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="px-8 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
