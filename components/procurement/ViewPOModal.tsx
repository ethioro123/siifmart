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

    const canApprove = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin';

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
            console.error('Error approving PO:', error);
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
            console.error('Error rejecting PO:', error);
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
            console.error('Error deleting PO:', error);
            showToast('Failed to delete PO', 'error');
        }
    };

    const handlePrintPO = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            {/* === SCREEN UI (Hidden in print) === */}
            <div className="space-y-6 print:hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {formatPONumber(po)}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {po.supplierName}
                            {po.supplierId?.startsWith('MANUAL') && (
                                <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">MANUAL</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${po.status === 'Received' ? 'bg-green-500/20 text-green-400' :
                            po.status === 'Approved' || po.status === 'Pending' ? 'bg-blue-500/20 text-blue-400' :
                                po.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {po.status}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                            po.priority === 'Low' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                'text-gray-400 border-gray-500/20 bg-gray-500/10'
                            }`}>
                            Priority: {po.priority || 'Normal'}
                        </div>
                    </div>
                </div>

                {/* Key Info - Dark Dashboard Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-secondary uppercase tracking-widest font-medium mb-1">Date</p>
                        <p className="text-white font-medium">{po.date || (po.created_at ? formatDateTime(po.created_at, { showTime: true }) : 'N/A')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-secondary uppercase tracking-widest font-medium mb-1">Requested By</p>
                        <p className="text-white font-medium truncate">{po.requestedBy || po.createdBy || 'Unknown'}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-secondary uppercase tracking-widest font-medium mb-1">Destination</p>
                        <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-500" />
                            <p className="text-white font-medium truncate">
                                {sites?.find(s => s.id === po.siteId)?.name || po.destination || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-secondary uppercase tracking-widest font-medium mb-1">Expected</p>
                        <p className="text-white font-medium">{po.expectedDelivery || 'N/A'}</p>
                    </div>
                </div>

                {/* Additional Details Row */}
                {(po.paymentTerms || po.approvedBy) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                        {po.paymentTerms && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-gray-500 uppercase font-medium">Terms:</span>
                                <span className="text-white font-semibold">{po.paymentTerms}</span>
                            </div>
                        )}
                        {po.approvedBy && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-gray-500 uppercase font-medium">Auth:</span>
                                <span className="text-green-400 font-semibold">{po.approvedBy}</span>
                                {po.approvedAt && (
                                    <span className="text-gray-600">({formatDateTime(po.approvedAt, { showTime: true })})</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Items Table */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            Order Items
                        </h3>
                        <span className="text-xs text-gray-500">
                            {po.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} Total Units
                        </span>
                    </div>
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-8">#</th>
                                    <th className="text-left p-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-24">Item Code</th>
                                    <th className="text-left p-4 text-xs text-gray-500 font-medium uppercase tracking-wider min-w-[250px]">Description</th>
                                    <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-20">Qty</th>
                                    <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-24">Unit Price</th>
                                    <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-24">Amount</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {po.lineItems?.map((item, i) => (
                                    <React.Fragment key={i}>
                                        <tr
                                            className={`hover:bg-white/5 transition-colors cursor-pointer ${expandedItems[i] ? 'bg-white/5' : ''}`}
                                            onClick={() => toggleItem(i)}
                                        >
                                            <td className="p-4 text-gray-500 text-sm">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="p-4 text-gray-300 text-xs font-mono">{item.sku || allProducts?.find(p => p.id === item.productId)?.sku || allProducts?.find(p => p.name === item.productName)?.sku || '—'}</td>
                                            <td className="p-4">
                                                <div className="text-white font-bold truncate max-w-xs">{formatPOItemDescription(item)}</div>
                                                {item.productId?.startsWith('CUSTOM') && (
                                                    <span className="inline-block mt-1 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Custom</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-300 text-right font-black">{item.quantity}</td>
                                            <td className="p-4 text-gray-400 text-right font-mono">{formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}</td>
                                            <td className="p-4 text-cyber-primary text-right font-mono font-black">{formatCompactNumber(item.totalCost, { currency: CURRENCY_SYMBOL })}</td>
                                            <td className="p-4 text-gray-500">
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

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="bg-cyber-primary/10 border border-cyber-primary/30 rounded-xl p-5 min-w-[280px]">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span className="uppercase tracking-widest text-[10px] font-semibold">Subtotal</span>
                                <span className="font-mono text-white">{CURRENCY_SYMBOL} {(po.totalAmount - (po.taxAmount || 0)).toLocaleString()}</span>
                            </div>
                            {po.shippingCost && po.shippingCost > 0 ? (
                                <div className="flex justify-between text-gray-400">
                                    <span className="uppercase tracking-widest text-[10px] font-semibold">Shipping</span>
                                    <span className="font-mono text-white">{CURRENCY_SYMBOL} {po.shippingCost.toLocaleString()}</span>
                                </div>
                            ) : null}
                            {po.taxAmount && po.taxAmount > 0 ? (
                                <div className="flex justify-between text-gray-400">
                                    <span className="uppercase tracking-widest text-[10px] font-semibold">Tax</span>
                                    <span className="font-mono text-white">{CURRENCY_SYMBOL} {po.taxAmount.toLocaleString()}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between pt-4 mt-2 border-t border-cyber-primary/30">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Total</span>
                                <span className="text-2xl font-black text-cyber-primary font-mono">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {po.notes && !po.notes.includes('Order received and processed') && (
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Notes & Instructions</p>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap">
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
                                className={`py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        <div className="py-3 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400">
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

                        {(po.status === 'Draft' || po.status === 'Approved') && (
                            <button
                                onClick={() => {
                                    onEdit(po);
                                    onClose();
                                }}
                                className="py-3 bg-white/5 hover:bg-blue-500/10 text-gray-300 hover:text-blue-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium border border-transparent hover:border-blue-500/20"
                            >
                                <Edit3 size={16} /> Edit
                            </button>
                        )}

                        {(po.status === 'Approved' || po.status === 'Pending' || po.status === 'Draft' || po.status === 'Rejected' || po.status === 'Cancelled') && (
                            <button
                                onClick={handleDeletePO}
                                className="py-3 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium border border-transparent hover:border-red-500/20"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
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
            <div className="hidden print:block fixed inset-0 bg-white text-black font-sans z-[9999] p-8 min-h-screen break-inside-avoid w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black mb-1 leading-none">SIIFMART HQ</h1>
                        <p className="text-gray-600 font-medium text-sm">Supply Chain & Procurement</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-800 mb-1 leading-none">Purchase Order</h2>
                        <p className="text-base font-bold text-black mt-2">Ref: {formatPONumber(po)}</p>
                        <p className="text-sm text-gray-600 font-medium mt-0.5">Date: {po.date || (po.created_at ? formatDateTime(po.created_at, { showTime: false }) : 'N/A')}</p>
                    </div>
                </div>

                {/* Vendor & Ship To Grid */}
                <div className="grid grid-cols-2 gap-8 mb-4">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200 mb-2 pb-1 tracking-wider">Vendor</h3>
                        <p className="font-bold text-base text-black">{po.supplierName}</p>
                        {po.supplierId?.startsWith('MANUAL') && <p className="text-xs text-gray-500 italic mt-0.5">Unregistered Vendor</p>}
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200 mb-2 pb-1 tracking-wider">Ship To</h3>
                        <p className="font-bold text-base text-black">{sites?.find(s => s.id === po.siteId)?.name || po.destination || 'SIIFMART Main HQ'}</p>
                        <p className="text-sm text-gray-700 mt-0.5">Requested By: {po.requestedBy || po.createdBy || 'Unknown'}</p>
                    </div>
                </div>

                {/* Details Strip */}
                <div className="flex flex-wrap gap-8 mb-6 bg-gray-50 p-3 border border-gray-200 rounded">
                    <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5 tracking-wider">Status</span> <span className="font-bold text-sm text-black">{po.status}</span></div>
                    <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5 tracking-wider">Expected By</span> <span className="font-bold text-sm text-black">{po.expectedDelivery || 'N/A'}</span></div>
                    {po.paymentTerms && <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5 tracking-wider">Terms</span> <span className="font-bold text-sm text-black">{po.paymentTerms}</span></div>}
                    {po.approvedBy && <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5 tracking-wider">Authorized By</span> <span className="font-bold text-sm text-black">{po.approvedBy}</span></div>}
                </div>

                {/* Extremely Compact Items Table */}
                <table className="w-full mb-6 border-collapse">
                    <thead>
                        <tr className="border-y border-black text-xs">
                            <th className="text-left py-2 px-1 font-bold text-black w-10">Item</th>
                            <th className="text-left py-2 px-1 font-bold text-black w-24">SKU</th>
                            <th className="text-left py-2 px-1 font-bold text-black">Description</th>
                            <th className="text-center py-2 px-1 font-bold text-black w-16">Qty</th>
                            <th className="text-right py-2 px-1 font-bold text-black w-24">Unit Price</th>
                            <th className="text-right py-2 px-1 font-bold text-black w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {po.lineItems?.map((item, i) => (
                            <tr key={i} className="border-b border-gray-200 break-inside-avoid">
                                <td className="py-2 px-1 text-gray-600">{i + 1}</td>
                                <td className="py-2 px-1 font-mono text-gray-600">{item.sku || allProducts?.find(p => p.id === item.productId)?.sku || allProducts?.find(p => p.name === item.productName)?.sku || '—'}</td>
                                <td className="py-2 px-1 font-semibold text-black">{formatPOItemDescription(item)}</td>
                                <td className="py-2 px-1 text-center font-bold text-black">{item.quantity}</td>
                                <td className="py-2 px-1 text-right text-gray-800">{formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}</td>
                                <td className="py-2 px-1 text-right font-bold text-black">{formatCompactNumber(item.totalCost, { currency: CURRENCY_SYMBOL })}</td>
                            </tr>
                        ))}
                        {(!po.lineItems || po.lineItems.length === 0) && (
                            <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-500 italic">No items in this order</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totals & Notes Zone */}
                <div className="flex justify-between items-start break-inside-avoid mt-8">
                    <div className="w-2/3 pr-12">
                        {po.notes && !po.notes.includes('Order received and processed') && (
                            <div className="text-xs">
                                <h4 className="font-bold uppercase text-gray-500 border-b border-gray-200 mb-2 pb-1 tracking-wider text-[10px]">Notes & Instructions</h4>
                                <p className="text-black whitespace-pre-wrap leading-relaxed font-medium">{po.notes.replace(/\[APPROVED_BY:.*?\]/g, '').replace(/\[SITES:.*?\]/g, '').replace(/\[Multi-Site Order.*?\]/g, '').trim()}</p>
                            </div>
                        )}
                    </div>
                    <div className="w-1/3">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-1.5 text-gray-500 font-bold uppercase text-[10px] tracking-wider">Subtotal</td>
                                    <td className="py-1.5 text-right font-semibold text-gray-800">{CURRENCY_SYMBOL} {(po.totalAmount - (po.taxAmount || 0)).toLocaleString()}</td>
                                </tr>
                                {po.shippingCost && po.shippingCost > 0 ? (
                                    <tr className="border-b border-gray-100">
                                        <td className="py-1.5 text-gray-500 font-bold uppercase text-[10px] tracking-wider">Shipping</td>
                                        <td className="py-1.5 text-right font-semibold text-gray-800">{CURRENCY_SYMBOL} {po.shippingCost.toLocaleString()}</td>
                                    </tr>
                                ) : null}
                                {po.taxAmount && po.taxAmount > 0 ? (
                                    <tr className="border-b border-gray-100">
                                        <td className="py-1.5 text-gray-500 font-bold uppercase text-[10px] tracking-wider">Tax</td>
                                        <td className="py-1.5 text-right font-semibold text-gray-800">{CURRENCY_SYMBOL} {po.taxAmount.toLocaleString()}</td>
                                    </tr>
                                ) : null}
                                <tr className="border-t border-black">
                                    <td className="py-3 font-bold uppercase text-xs tracking-wider text-black">Total</td>
                                    <td className="py-3 text-right font-bold text-xl text-black">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer - Fixed to bottom of print page if possible, else just at end of flow */}
                <div className="mt-16 pt-4 text-center text-[10px] text-gray-400 border-t border-gray-200 break-inside-avoid">
                    <p>Document generated by SIIFMART System. Ref: {formatPONumber(po)}</p>
                    <p>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} by {user?.name || 'System User'}</p>
                </div>
            </div>
        </Modal>
    );
};
