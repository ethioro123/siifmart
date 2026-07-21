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

export function generatePOHTML(po: PurchaseOrder, sites: any[], user: any, allProducts: any[]): string {
    const siteName = sites?.find(s => s.id === po.siteId)?.name || po.destination || 'SIIFMART Main HQ';
    const poDate = po.date || (po.created_at ? formatDateTime(po.created_at, { showTime: false }) : 'N/A');
    const subtotal = po.totalAmount - ((po.taxAmount || 0) + (po.shippingCost || 0));

    const itemsRows = (po.lineItems || []).map((item, i) => {
        const sku = item.sku || allProducts?.find(p => p.id === item.productId)?.sku || allProducts?.find(p => p.name === item.productName)?.sku || '—';
        const desc = formatPOItemDescription(item);
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;">
                <td style="padding: 8px 6px; color: #4b5563; font-size: 11px;">${i + 1}</td>
                <td style="padding: 8px 6px; font-family: monospace; color: #374151; font-size: 11px; font-weight: bold;">${sku}</td>
                <td style="padding: 8px 6px; font-weight: 600; color: #111827; font-size: 11px;">${desc}</td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: #111827; font-size: 11px;">${item.quantity}</td>
                <td style="padding: 8px 6px; text-align: right; color: #374151; font-size: 11px;">${formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}</td>
                <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #111827; font-size: 11px;">${formatCompactNumber(item.totalCost, { currency: CURRENCY_SYMBOL })}</td>
            </tr>
        `;
    }).join('');

    const cleanNotes = po.notes ? po.notes.replace(/\[APPROVED_BY:.*?\]/g, '').replace(/\[SITES:.*?\]/g, '').replace(/\[Multi-Site Order.*?\]/g, '').trim() : '';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order ${formatPONumber(po)}</title>
    <style>
        @page { size: letter portrait; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; background: #fff; margin: 0; padding: 20px; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
        .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
        .subbrand { font-size: 12px; color: #4b5563; margin-top: 2px; font-weight: 500; }
        .po-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1f2937; margin: 0; text-align: right; }
        .po-ref { font-size: 13px; font-weight: 700; margin-top: 4px; text-align: right; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
        .box-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.05em; }
        .strip { display: flex; gap: 24px; background: #f9fafb; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px; flex-wrap: wrap; }
        .strip-item { display: flex; flex-direction: column; }
        .strip-lbl { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .strip-val { font-size: 12px; font-weight: 700; color: #111827; margin-top: 1px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { text-align: left; padding: 8px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-top: 1px solid #111827; border-bottom: 1px solid #111827; letter-spacing: 0.05em; }
        .footer-zone { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; }
        .totals-table { width: 240px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 4px 0; font-size: 12px; }
        .total-row { border-top: 2px solid #111827; font-weight: 800; font-size: 16px; }
        .footer-note { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af; page-break-inside: avoid; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="brand">SIIFMART HQ</h1>
            <div class="subbrand">Supply Chain & Procurement</div>
        </div>
        <div>
            <div class="po-title">Purchase Order</div>
            <div class="po-ref">Ref: ${formatPONumber(po)}</div>
            <div style="font-size: 11px; color: #4b5563; text-align: right; margin-top: 2px;">Date: ${poDate}</div>
        </div>
    </div>

    <div class="grid-2">
        <div>
            <div class="box-title">Vendor</div>
            <div style="font-weight: 700; font-size: 14px;">${po.supplierName}</div>
            ${po.supplierId?.startsWith('MANUAL') ? `<div style="font-size: 11px; color: #6b7280; font-style: italic; margin-top: 2px;">Unregistered Vendor</div>` : ''}
        </div>
        <div>
            <div class="box-title">Ship To</div>
            <div style="font-weight: 700; font-size: 14px;">${siteName}</div>
            <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">Requested By: ${po.requestedBy || po.createdBy || 'Unknown'}</div>
        </div>
    </div>

    <div class="strip">
        <div class="strip-item"><span class="strip-lbl">Status</span><span class="strip-val">${po.status}</span></div>
        <div class="strip-item"><span class="strip-lbl">Expected By</span><span class="strip-val">${po.expectedDelivery || 'N/A'}</span></div>
        ${po.paymentTerms ? `<div class="strip-item"><span class="strip-lbl">Terms</span><span class="strip-val">${po.paymentTerms}</span></div>` : ''}
        ${po.approvedBy ? `<div class="strip-item"><span class="strip-lbl">Approved By</span><span class="strip-val">${po.approvedBy}</span></div>` : ''}
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 30px;">Item</th>
                <th style="width: 90px;">SKU</th>
                <th>Description</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 110px; text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemsRows || '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #6b7280; font-style: italic;">No items in this order</td></tr>'}
        </tbody>
    </table>

    <div class="footer-zone">
        <div style="width: 55%;">
            ${cleanNotes && !cleanNotes.includes('Order received and processed') ? `
                <div class="box-title">Notes & Instructions</div>
                <div style="font-size: 11px; color: #374151; white-space: pre-wrap;">${cleanNotes}</div>
            ` : ''}
        </div>
        <div style="width: 40%;">
            <table class="totals-table">
                <tr>
                    <td style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700;">Subtotal</td>
                    <td style="text-align: right; font-weight: 600;">${CURRENCY_SYMBOL} ${subtotal.toLocaleString()}</td>
                </tr>
                ${po.shippingCost && po.shippingCost > 0 ? `
                <tr>
                    <td style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700;">Shipping</td>
                    <td style="text-align: right; font-weight: 600;">${CURRENCY_SYMBOL} ${po.shippingCost.toLocaleString()}</td>
                </tr>` : ''}
                ${po.taxAmount && po.taxAmount > 0 ? `
                <tr>
                    <td style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700;">Tax</td>
                    <td style="text-align: right; font-weight: 600;">${CURRENCY_SYMBOL} ${po.taxAmount.toLocaleString()}</td>
                </tr>` : ''}
                <tr class="total-row">
                    <td style="text-transform: uppercase; padding-top: 8px;">Total</td>
                    <td style="text-align: right; padding-top: 8px;">${CURRENCY_SYMBOL} ${po.totalAmount.toLocaleString()}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer-note">
        Document generated by SIIFMART System. Ref: ${formatPONumber(po)} &bull; Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} by ${user?.name || 'System User'}
    </div>
</body>
</html>`;
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
