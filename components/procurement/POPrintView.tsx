import React from 'react';
import { PurchaseOrder } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { formatPOItemDescription } from './utils';

interface POPrintViewProps {
    po: PurchaseOrder;
    sites: any[];
    user: any;
    allProducts: any[];
}

export const POPrintView: React.FC<POPrintViewProps> = ({ po, sites, user, allProducts }) => {
    return (
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
                {po.approvedBy && <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5 tracking-wider">Approved By</span> <span className="font-bold text-sm text-black">{po.approvedBy}</span></div>}
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

            {/* Footer */}
            <div className="mt-16 pt-4 text-center text-[10px] text-gray-400 border-t border-gray-200 break-inside-avoid">
                <p>Document generated by SIIFMART System. Ref: {formatPONumber(po)}</p>
                <p>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} by {user?.name || 'System User'}</p>
            </div>
        </div>
    );
};
