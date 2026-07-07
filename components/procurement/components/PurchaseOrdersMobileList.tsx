import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';

interface PurchaseOrdersMobileListProps {
    orders: PurchaseOrder[];
    sites: any[];
    user: any;
    canApprove: boolean;
    isCEO: boolean;
    selectedPOIds: string[];
    setSelectedPOIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedPO: (po: PurchaseOrder) => void;
    handleSingleApprove: (e: React.MouseEvent, po: PurchaseOrder) => void;
    onEdit: (po: PurchaseOrder) => void;
    handleDeletePO: (e: React.MouseEvent, po: PurchaseOrder) => void;
    formatPONumber: (po: PurchaseOrder) => string;
}

export const PurchaseOrdersMobileList: React.FC<PurchaseOrdersMobileListProps> = ({
    orders,
    sites,
    user,
    canApprove,
    isCEO,
    selectedPOIds,
    setSelectedPOIds,
    setSelectedPO,
    handleSingleApprove,
    onEdit,
    handleDeletePO,
    formatPONumber
}) => {
    return (
        <div className="md:hidden space-y-4">
            {orders.map((po) => {
                const isDraft = po.status === 'Draft';
                const isSelected = selectedPOIds.includes(po.id);
                return (
                    <div
                        key={po.id}
                        onClick={() => setSelectedPO(po)}
                        className={`glass-panel p-4 rounded-xl space-y-3 cursor-pointer border transition-all ${
                            isSelected
                                ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-[#2C5E3B] dark:border-[#A9CBA2]'
                                : 'border-[#E2DCCE]/50 dark:border-emerald-950/20'
                        }`}
                    >
                        {/* Header: PO Num & status */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {user?.role === 'super_admin' && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        {isDraft ? (
                                            <input
                                                type="checkbox"
                                                aria-label={`Select PO ${po.id}`}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedPOIds(prev => [...prev, po.id]);
                                                    else setSelectedPOIds(prev => prev.filter(id => id !== po.id));
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-black/50"
                                            />
                                        ) : <div className="w-4 h-4" />}
                                    </div>
                                )}
                                <div className="text-left">
                                    <span className="text-sm font-mono text-gray-900 dark:text-white font-bold">{formatPONumber(po)}</span>
                                    <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase text-center ${po.priority === 'High' || po.priority === 'Urgent' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                        po.priority === 'Low' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/5' :
                                            'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                        }`}>
                                        {po.priority || 'Normal'}
                                    </span>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${po.status === 'Received' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                po.status === 'Partially Received' ? 'text-amber-500 dark:text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                    po.status === 'Approved' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' :
                                        po.status === 'Ordered' ? 'text-amber-600 dark:text-[#E2C899] border-amber-500/20 dark:border-[#E2C899]/20 bg-amber-500/10 dark:bg-amber-500/5' :
                                            po.status === 'Draft' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                                po.status === 'Pending' ? 'text-[#8C6239] dark:text-[#E2C899] border-[#8C6239]/20 dark:border-[#E2C899]/20 bg-[#8C6239]/10 dark:bg-[#E2C899]/10' :
                                                    'text-red-400 border-red-500/20 bg-red-500/10'
                                }`}>
                                {po.status}
                            </span>
                        </div>

                        {/* Middle detail: Supplier & Destination */}
                        <div className="grid grid-cols-2 gap-2 text-left bg-gray-50/50 dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                            <div>
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Supplier</span>
                                <p className="text-xs text-gray-900 dark:text-white font-medium mt-0.5 truncate">{po.supplierName}</p>
                            </div>
                            <div>
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Destination</span>
                                <p className="text-xs text-gray-900 dark:text-white font-medium mt-0.5 truncate">
                                    {po.destination || sites.find((s: any) => s.id === po.siteId)?.name || 'Central Operations'}
                                </p>
                            </div>
                        </div>

                        {/* Expected and items/amount */}
                        <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex flex-col text-left">
                                <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Expected Delivery</span>
                                <span className="text-[10px] text-[#8C6239] dark:text-[#E2C899] font-bold mt-0.5">{po.expectedDelivery || 'N/A'}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Items</span>
                                    <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold mt-0.5">{po.itemsCount}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-gray-500 font-sans font-bold uppercase tracking-widest">Amount</span>
                                    <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold mt-0.5">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions & request info */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-gray-500 italic">By: {po.requestedBy || po.createdBy || 'Unknown'}</span>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setSelectedPO(po)}
                                    className="px-2.5 py-1 text-[10px] font-bold bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors"
                                >
                                    Details
                                </button>
                                {isDraft && canApprove && (
                                    <button
                                        onClick={(e) => handleSingleApprove(e, po)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors"
                                    >
                                        Approve
                                    </button>
                                )}
                                {((isCEO && po.status !== 'Received') ||
                                    (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                    <button
                                        onClick={() => onEdit(po)}
                                        className="p-1 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-lg"
                                        title="Edit PO"
                                        aria-label="Edit Purchase Order"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                )}
                                {((isCEO && po.status !== 'Received') ||
                                    (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                    <button
                                        onClick={(e) => handleDeletePO(e, po)}
                                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg"
                                        title="Delete PO"
                                        aria-label="Delete Purchase Order"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            {orders.length === 0 && (
                <div className="p-8 text-center text-gray-500 italic">No active purchase orders found.</div>
            )}
        </div>
    );
};
