import React from 'react';
import {
    CheckCircle, Shield, User, Printer, RotateCcw
} from 'lucide-react';
import Modal from '../../../components/Modal';
import { Protected } from '../../../components/Protected';
import { formatDateTime, formatPriceValue } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { SaleRecord, Site } from '../../../types';

interface SalesDetailModalProps {
    selectedSale: SaleRecord | null;
    onClose: () => void;
    detailTab: 'receipt' | 'audit';
    setDetailTab: (tab: 'receipt' | 'audit') => void;
    settings: any;
    sites: Site[];
    auditLogs: any[];
    handleReprint: () => void;
    addNotification: (type: any, message: string) => void;
}

export const SalesDetailModal: React.FC<SalesDetailModalProps> = ({
    selectedSale,
    onClose,
    detailTab,
    setDetailTab,
    settings,
    sites,
    auditLogs,
    handleReprint,
    addNotification
}) => {
    return (
        <Modal
            isOpen={!!selectedSale}
            onClose={onClose}
            title={`Transaction Details`}
            size="lg"
        >
            {selectedSale && (
                <div className="flex flex-col h-[600px] text-[#1E3F27] dark:text-white">
                    {/* Modal Header Info */}
                    <div className="flex items-center justify-between mb-6 bg-[#FAF8F5] dark:bg-[#18201B]/50 p-4 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/10">
                        <div>
                            <h3 className="text-xl font-bold text-[#1E3F27] dark:text-white font-mono">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</h3>
                            <p className="text-xs text-stone-400 dark:text-gray-550 mt-1">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-stone-500 dark:text-gray-555 uppercase font-black tracking-widest">Total Amount</p>
                            <p className="text-2xl font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-black">{CURRENCY_SYMBOL} {selectedSale.total.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#E2DCCE]/60 dark:border-white/10 mb-4 select-none">
                        <button
                            onClick={() => setDetailTab('receipt')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${detailTab === 'receipt' ? 'border-[#2C5E3B] dark:border-[#A9CBA2] text-[#1E3F27] dark:text-white' : 'border-transparent text-stone-500 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'}`}
                        >
                            Digital Receipt
                        </button>
                        <button
                            onClick={() => setDetailTab('audit')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${detailTab === 'audit' ? 'border-[#2C5E3B] dark:border-[#A9CBA2] text-[#1E3F27] dark:text-white' : 'border-transparent text-stone-500 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'}`}
                        >
                            Audit Log
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAF8F5]/80 dark:bg-black/20 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/10 p-6">

                        {/* TAB 1: RECEIPT VIEW */}
                        {detailTab === 'receipt' && (
                            <div className={`max-w-sm mx-auto bg-white text-black p-6 rounded shadow-xl relative ${settings.posReceiptFont === 'monospace' ? 'font-mono' : 'font-sans'}`}>
                                {/* Logo */}
                                {settings.posReceiptShowLogo && settings.posReceiptLogo && (
                                    <div className="flex justify-center mb-4">
                                        <img src={settings.posReceiptLogo} className="max-h-12 object-contain grayscale" alt="logo" />
                                    </div>
                                )}

                                {/* Receipt Paper styling */}
                                <div className="text-center border-b-2 border-black/10 pb-4 border-dashed mb-4">
                                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">
                                        {settings.storeName || sites.find(s => s.id === selectedSale.siteId)?.name || 'SIIFMART'}
                                    </h2>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                                        {settings.posReceiptHeader || 'SIIFMART RETAIL'}
                                    </p>
                                </div>

                                <div className="text-[10px] text-center space-y-0.5 mb-4 border-b-2 border-black/10 pb-4 border-dashed">
                                    {settings.posReceiptAddress && <p>{settings.posReceiptAddress}</p>}
                                    <div className="flex justify-center gap-2">
                                        {settings.posReceiptPhone && <p>Tel: {settings.posReceiptPhone}</p>}
                                        {settings.posReceiptEmail && <p>Email: {settings.posReceiptEmail}</p>}
                                    </div>
                                    {settings.posReceiptTaxId && <p className="font-bold">TIN: {settings.posReceiptTaxId}</p>}
                                </div>

                                <div className="text-[10px] space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span className="opacity-60">DATE:</span>
                                        <span>{formatDateTime(selectedSale.date, { showTime: true })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-60">RECEIPT #:</span>
                                        <span className="font-bold">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).toUpperCase()}`}</span>
                                    </div>
                                </div>

                                <div className="border-y border-black/10 py-3 mb-4 space-y-2">
                                    {selectedSale.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <div>
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-[9px] opacity-60">{item.quantity} x {CURRENCY_SYMBOL} {formatPriceValue(item.price)}</div>
                                            </div>
                                            <div className="font-bold">{formatPriceValue(item.price * item.quantity)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-right mb-4">
                                    <div className="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>{selectedSale.subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] opacity-60"><span>Tax ({settings.taxRate || 0}%)</span><span>{selectedSale.tax.toLocaleString()}</span></div>
                                    <div className="flex justify-between font-black text-base border-t border-black pt-2 mt-2"><span>TOTAL</span><span>{CURRENCY_SYMBOL} {selectedSale.total.toLocaleString()}</span></div>
                                </div>

                                <div className="text-center space-y-1 pt-4 border-t border-black/10 border-dashed">
                                    <p className="text-xs font-bold leading-tight mb-2">{settings.posReceiptFooter || 'Thank you for shopping with us!'}</p>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: REAL AUDIT LOG */}
                        {detailTab === 'audit' && (
                            <div className="space-y-6 relative text-[#1E3F27] dark:text-white">
                                <div className="absolute left-3 top-2 bottom-2 w-px bg-[#E2DCCE] dark:bg-white/10"></div>

                                {/* Header Event */}
                                <div className="flex gap-4 relative">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-[#2C5E3B]/20 text-emerald-700 dark:text-[#A9CBA2] border border-emerald-250/50 dark:border-[#2C5E3B]/30 flex items-center justify-center z-10 shrink-0"><CheckCircle size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">Transaction Completed</p>
                                        <p className="text-xs text-stone-400 dark:text-gray-550">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                                        <p className="text-xs text-stone-500 dark:text-gray-450 mt-1">Payment verified via {selectedSale.method} gateway.</p>
                                    </div>
                                </div>

                                {/* Dynamic Movements */}
                                {auditLogs.length > 0 ? (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="flex gap-4 relative">
                                            <div className="w-6 h-6 rounded-full bg-sky-55 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-500/20 flex items-center justify-center z-10 shrink-0"><Shield size={14} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{log.type === 'OUT' ? 'Stock Deducted' : 'Stock Return'}</p>
                                                <p className="text-xs text-stone-400 dark:text-gray-550">{formatDateTime(log.date, { showTime: true })}</p>
                                                <div className="mt-2 bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE]/60 dark:border-white/5 p-2.5 rounded-xl text-[10px] font-mono text-stone-750 dark:text-gray-300">
                                                    {log.type === 'OUT' ? '-' : '+'} {log.quantity} {log.productName} (ID: {log.productId})
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex gap-4 relative">
                                        <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-gray-400 border border-stone-250 dark:border-white/10 flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">System Log</p>
                                            <p className="text-xs text-stone-400 dark:text-gray-550">No detailed movement logs found for this legacy transaction.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Event */}
                                <div className="flex gap-4 relative">
                                    <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-gray-400 border border-stone-250 dark:border-white/10 flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">Session Active</p>
                                        <p className="text-xs text-stone-400 dark:text-gray-550">Cashier: {selectedSale.cashierName}</p>
                                        <p className="text-xs text-stone-500 dark:text-gray-450 mt-1">Terminal ID: POS-01</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 border-dashed">
                        <button
                            onClick={handleReprint}
                            className="flex-1 py-3 bg-stone-100 dark:bg-white/5 hover:bg-[#2C5E3B]/10 dark:hover:bg-white/10 border border-[#E2DCCE] dark:border-white/10 rounded-2xl text-[#1E3F27] dark:text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Printer size={18} /> Reprint
                        </button>
                        <Protected permission="REFUND_SALE">
                            <button
                                onClick={() => {
                                    addNotification('info', `Initiating Return Workflow for ${selectedSale.receiptNumber || selectedSale.id.substring(0, 12)}...`);
                                    onClose();
                                }}
                                className="flex-1 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-455 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                <RotateCcw size={18} /> Issue Return
                            </button>
                        </Protected>
                    </div>
                </div>
            )}
        </Modal>
    );
};
