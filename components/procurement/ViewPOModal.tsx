import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, Product } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { CheckCircle, XCircle, Printer, Edit3, Trash2, Package, Loader2, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { purchaseOrdersService } from '../../services/supabase.service';
import { formatCompactNumber } from '../../utils/formatting';
import { formatDateTime } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { formatPOItemDescription } from './utils';
import { POPrintView, generatePOHTML } from './POPrintView';
import { printHtmlContent } from '../../utils/printHelper';
import { logger } from '../../utils/logger';

interface ViewPOModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder | null;
    onEdit: (po: PurchaseOrder) => void;
    onSuccess: () => void; // Trigger refresh
}

export const ViewPOModal: React.FC<ViewPOModalProps> = ({ isOpen, onClose, po, onEdit, onSuccess }) => {
    const { allProducts, sites } = useData();
    const { user, showToast } = useStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

    const toggleItem = (index: number) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (!po) return null;

    const isCEO = user?.role === 'super_admin';
    const isProcurementManager = user?.role === 'procurement_manager';
    const isWarehouseManager = user?.role === 'warehouse_manager';
    const canApprove = isProcurementManager || user?.role === 'finance_manager' || user?.role === 'admin' || isCEO || isWarehouseManager;
    const canFullDelete = isCEO || isProcurementManager || isWarehouseManager;

    const handleApprovePO = async () => {
        if (!window.confirm(`Are you sure you want to approve PO ${formatPONumber(po)}?`)) return;
        setIsSubmitting(true);
        try {
            const updatedPO: PurchaseOrder = {
                ...po,
                status: 'Ordered', // Or 'Approved' based on logic, original code set to 'Ordered' in some places, but 'Approved' is standard workflow. Let's stick to what original code did if unclear, but 'Ordered' usually implies sent. Original code line 2661 sets to 'Ordered'.
                approvedBy: user?.name || 'Unknown',
                approvedAt: new Date().toISOString()
            };
            await purchaseOrdersService.update(updatedPO.id, updatedPO);
            showToast(`PO ${formatPONumber(po)} approved successfully`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('ViewPOModal', 'Error approving PO:', error);
            showToast('Failed to approve PO', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectPO = async () => {
        const reason = window.prompt("Reason for rejection:");
        if (!reason) return;

        setIsSubmitting(true);
        try {
            const updatedPO: PurchaseOrder = {
                ...po,
                status: 'Rejected',
                notes: po.notes ? `${po.notes}\n[REJECTED: ${reason}]` : `[REJECTED: ${reason}]`
            };
            await purchaseOrdersService.update(updatedPO.id, updatedPO);
            showToast(`PO ${formatPONumber(po)} rejected`, 'info');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('ViewPOModal', 'Error rejecting PO:', error);
            showToast('Failed to reject PO', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePO = async () => {
        if (!window.confirm(`Are you sure you want to delete PO ${formatPONumber(po)}? This cannot be undone.`)) return;

        try {
            await purchaseOrdersService.delete(po.id);
            showToast(`PO ${formatPONumber(po)} deleted successfully`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('ViewPOModal', 'Error deleting PO:', error);
            showToast('Failed to delete PO', 'error');
        }
    };

    const handlePrintPO = () => {
        if (!po) return;
        const html = generatePOHTML(po, sites, user, allProducts);
        printHtmlContent(html);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            {/* === SCREEN UI (Hidden in print) === */}
            <div className="space-y-6 print:hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {formatPONumber(po)}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {po.supplierName}
                            {po.supplierId?.startsWith('MANUAL') && (
                                <span className="ml-2 text-[10px] bg-[#2C5E3B]/15 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-1.5 py-0.5 rounded">MANUAL</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${po.status === 'Received' ? 'bg-green-500/20 text-green-400' :
                            po.status === 'Approved' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                po.status === 'Pending' ? 'bg-[#8C6239]/20 text-[#8C6239] dark:text-[#E2C899]' :
                                    po.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                            }`}>
                            {po.status}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                            po.priority === 'Low' ? 'text-[#8C6239] border-[#8C6239]/20 bg-[#8C6239]/10' :
                                'text-gray-400 border-gray-500/20 bg-gray-500/10'
                            }`}>
                            Priority: {po.priority || 'Normal'}
                        </div>
                    </div>
                </div>

                {/* Key Info - Dark Dashboard Grid */}
                <div className={`grid grid-cols-2 ${po.approvedBy ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
                    <div className="glass-panel rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <p className="text-[10px] text-gray-500 dark:text-secondary uppercase tracking-widest font-bold mb-1">Date</p>
                        <p className="text-gray-900 dark:text-white font-bold">{po.date || (po.created_at ? formatDateTime(po.created_at, { showTime: true }) : 'N/A')}</p>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <p className="text-[10px] text-gray-500 dark:text-secondary uppercase tracking-widest font-bold mb-1">Requested By</p>
                        <p className="text-gray-900 dark:text-white font-bold text-[clamp(11px,1.5vw,14px)] break-words leading-tight">{po.requestedBy || po.createdBy || 'Unknown'}</p>
                    </div>
                    {po.approvedBy && (
                        <div className="glass-panel rounded-xl p-4 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 shadow-sm dark:shadow-none">
                            <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest font-bold mb-1">Approved By</p>
                            <p className="text-gray-900 dark:text-white font-bold text-[clamp(11px,1.5vw,14px)] break-words leading-tight">{po.approvedBy}</p>
                        </div>
                    )}
                    <div className="glass-panel rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <p className="text-[10px] text-gray-500 dark:text-secondary uppercase tracking-widest font-bold mb-1">Destination</p>
                        <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
                            <p className="text-gray-900 dark:text-white font-bold text-[clamp(11px,1.5vw,14px)] break-words leading-tight">
                                {sites?.find(s => s.id === po.siteId)?.name || po.destination || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <p className="text-[10px] text-gray-500 dark:text-secondary uppercase tracking-widest font-bold mb-1">Expected</p>
                        <p className="text-gray-900 dark:text-white font-bold">{po.expectedDelivery || 'N/A'}</p>
                    </div>
                </div>

                {/* Additional Details Row */}
                {(po.paymentTerms || po.approvedBy) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                        {po.paymentTerms && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                                <span className="uppercase font-bold tracking-widest text-[9px]">Terms:</span>
                                <span className="text-gray-900 dark:text-white font-black italic">{po.paymentTerms}</span>
                            </div>
                        )}
                        {po.approvedBy && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest text-[9px]">Approved By:</span>
                                <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{po.approvedBy}</span>
                                {po.approvedAt && (
                                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">({formatDateTime(po.approvedAt, { showTime: true })})</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Items Table */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            Order Payload
                        </h3>
                        <span className="text-[10px] font-black text-[#8C6239] dark:text-[#E2C899] uppercase tracking-widest">
                            {po.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} Total Manifest Units
                        </span>
                    </div>
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100/50 dark:bg-black/20 border-b border-gray-200 dark:border-white/5">
                                    <th className="text-left p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest w-8">#</th>
                                    <th className="text-left p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest w-24">SKU</th>
                                    <th className="text-left p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest min-w-[250px]">Manifest Description</th>
                                    <th className="text-right p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest w-20">Qty</th>
                                    <th className="text-right p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest w-24">Cost</th>
                                    <th className="text-right p-4 text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest w-24">Total</th>
                                    <th className="w-10 px-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {po.lineItems?.map((item, i) => (
                                    <React.Fragment key={i}>
                                        <tr
                                            className={`hover:bg-stone-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer ${expandedItems[i] ? 'bg-stone-200/50 dark:bg-black/20' : ''}`}
                                            onClick={() => toggleItem(i)}
                                        >
                                            <td className="p-4 text-gray-400 dark:text-gray-500 text-[10px] font-black">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 text-xs font-mono font-bold">{item.sku || allProducts?.find(p => p.id === item.productId)?.sku || allProducts?.find(p => p.name === item.productName)?.sku || '—'}</td>
                                            <td className="p-4">
                                                <div className="text-gray-900 dark:text-white font-black tracking-tight text-[clamp(11px,1.5vw,14px)] break-words leading-tight max-w-[400px]">{formatPOItemDescription(item)}</div>
                                                {item.productId?.startsWith('CUSTOM') && (
                                                    <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase italic">Custom Resource</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-900 dark:text-white text-right font-black tabular-nums">{item.quantity}</td>
                                            <td className="p-4 text-gray-500 dark:text-gray-500 text-right font-black font-mono tabular-nums">{formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}</td>
                                            <td className="p-4 text-[#2C5E3B] dark:text-[#A9CBA2] text-right font-black font-mono tabular-nums">{formatCompactNumber(item.totalCost, { currency: CURRENCY_SYMBOL })}</td>
                                            <td className="p-4 text-gray-400 dark:text-gray-500">
                                                {expandedItems[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>
                                        {expandedItems[i] && item.customAttributes && (
                                            <tr className="bg-black/20">
                                                <td colSpan={7} className="p-4 pl-12">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-400">
                                                        {Object.entries(item.customAttributes).map(([category, attrs]) => (
                                                            <div key={category} className="space-y-1">
                                                                <h4 className="font-bold text-gray-500 uppercase text-[10px] mb-1">{category}</h4>
                                                                {Object.entries(attrs).map(([key, value]) => {
                                                                    if (!value) return null;
                                                                    return (
                                                                        <div key={key} className="flex justify-between border-b border-white/5 pb-0.5">
                                                                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                            <span className="text-gray-300 ml-2 text-right">
                                                                                {value === true ? 'Yes' : String(value)}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {(!po.lineItems || po.lineItems.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500 italic">No items in this order</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Minimalist Summary */}
                <div className="flex justify-end pt-8">
                    <div className="w-full md:w-80 space-y-6 text-sm">
                        <div className="flex justify-between items-end border-b border-gray-100 dark:border-white/5 pb-2">
                            <span className="uppercase tracking-widest text-[10px] font-bold text-gray-500">Base Payload</span>
                            <span className="font-mono text-gray-900 dark:text-white font-black tabular-nums">{CURRENCY_SYMBOL} {(po.totalAmount - ((po.taxAmount || 0) + (po.shippingCost || 0))).toLocaleString()}</span>
                        </div>
                        {po.shippingCost && po.shippingCost > 0 ? (
                            <div className="flex justify-between items-end border-b border-gray-100 dark:border-white/5 pb-2">
                                <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">Logistics</span>
                                <span className="font-mono text-gray-600 dark:text-gray-300 font-bold tabular-nums">{CURRENCY_SYMBOL} {po.shippingCost.toLocaleString()}</span>
                            </div>
                        ) : null}
                        {po.taxAmount && po.taxAmount > 0 ? (
                            <div className="flex justify-between items-end border-b border-gray-100 dark:border-white/5 pb-2">
                                <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">Tax</span>
                                <span className="font-mono text-gray-600 dark:text-gray-300 font-bold tabular-nums">{CURRENCY_SYMBOL} {po.taxAmount.toLocaleString()}</span>
                            </div>
                        ) : null}
                        <div className="flex justify-between items-end pt-2">
                            <span className="uppercase tracking-widest text-xs font-black text-gray-900 dark:text-white">Total Authority</span>
                            <span className="font-mono text-3xl font-black text-gray-900 dark:text-[#A9CBA2] tabular-nums tracking-tighter leading-none">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {po.notes && !po.notes.includes('Order received and processed') && (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 mt-8">
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest font-black mb-4">Protocol Notes & Instructions</p>
                        <p className="text-sm text-gray-700 dark:text-gray-400 whitespace-pre-wrap leading-relaxed italic">
                            {po.notes.replace(/\[APPROVED_BY:.*?\]/g, '').replace(/\[SITES:.*?\]/g, '').replace(/\[Multi-Site Order.*?\]/g, '').trim()}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                    {/* Primary Actions for Draft POs */}
                    {po.status === 'Draft' && canApprove && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleApprovePO}
                                disabled={isSubmitting}
                                className={`py-3 bg-[#2C5E3B] hover:bg-[#224429] dark:bg-[#A9CBA2] dark:hover:bg-[#8dae86] text-[#FAF8F5] dark:text-[#1E3B24] font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {isSubmitting ? 'Approving...' : 'Approve'}
                            </button>
                            {user?.role === 'super_admin' && (
                                <button
                                    onClick={handleRejectPO}
                                    className="py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl border border-red-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} /> Reject
                                </button>
                            )}
                        </div>
                    )}

                    {/* Status Messages */}
                    {po.status === 'Received' && (
                        <div className="py-3 px-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
                            <CheckCircle size={18} />
                            <span className="text-sm font-medium">Order received and processed</span>
                        </div>
                    )}

                    {(po.status === 'Approved' || po.status === 'Pending') && (
                        <div className="py-3 px-4 bg-[#8C6239]/10 border border-[#8C6239]/20 rounded-xl flex items-center gap-3 text-[#8C6239] dark:text-[#E2C899]">
                            <Package size={18} />
                            <span className="text-sm">Receive in WMS → Operations → Receiving</span>
                        </div>
                    )}

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={handlePrintPO}
                            className="py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Printer size={16} /> Print
                        </button>

                        {/* Edit & Delete Action Logic:
                            1. CEO/Procurement Manager can Edit/Delete anything NOT fully Received.
                            2. Other staff can ONLY Edit/Delete their own Draft POs.
                        */}
                        {((canFullDelete && po.status !== 'Received') || 
                          (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                            <>
                                <button
                                    onClick={() => {
                                        onEdit(po);
                                        onClose();
                                    }}
                                    className="py-3 bg-white/5 hover:bg-[#2C5E3B]/10 text-gray-300 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] rounded-xl transition-colors flex items-center justify-center gap-2 font-medium border border-transparent hover:border-[#2C5E3B]/20 dark:hover:border-[#A9CBA2]/20"
                                >
                                    <Edit3 size={16} /> Edit
                                </button>
                                <button
                                    onClick={handleDeletePO}
                                    className="py-3 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium border border-transparent hover:border-red-500/20"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {/* === BRAND NEW DEDICATED PRINT UI (Highly efficient invoice layout) === */}
            <POPrintView po={po} sites={sites} user={user} allProducts={allProducts} />
        </Modal>
    );
};
