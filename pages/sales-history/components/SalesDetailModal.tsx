import React from 'react';
import {
    CheckCircle, Shield, User, Printer, RotateCcw
} from 'lucide-react';
import Modal from '../../../components/Modal';
import { Protected } from '../../../components/Protected';
import { formatDateTime, formatPriceValue, maskPhoneNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { SaleRecord, Site } from '../../../types';
import { useStore } from '../../../contexts/CentralStore';
import { isAdmin } from '../../../utils/permissions';

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
    currencySymbol?: string;
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
    addNotification,
    currencySymbol = CURRENCY_SYMBOL
}) => {
    const { user } = useStore();
    const canViewFullCustomerPII = isAdmin(user?.role) || user?.role === 'finance_manager';

    return (
        <Modal
            isOpen={!!selectedSale}
            onClose={onClose}
            title={`Transaction Details`}
            size="lg"
        >
            {selectedSale && (
                <div className="flex flex-col h-[600px] text-[var(--theme-text-primary)]">
                    {/* Modal Header Info */}
                    <div className="flex items-center justify-between mb-6 bg-[var(--theme-bg-panel)] p-4 rounded-2xl border border-[var(--theme-border)]">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--theme-text-primary)] font-mono">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Total Amount</p>
                            <p className="text-2xl font-mono text-[var(--theme-text-primary)] font-bold">{currencySymbol} {selectedSale.total.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--theme-border)] mb-4 select-none">
                        <button
                            type="button"
                            onClick={() => setDetailTab('receipt')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${detailTab === 'receipt' ? 'border-[var(--theme-text-primary)] text-[var(--theme-text-primary)]' : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            Digital Receipt
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailTab('audit')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${detailTab === 'audit' ? 'border-[var(--theme-text-primary)] text-[var(--theme-text-primary)]' : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            Audit Log
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)] p-6">

                        {/* TAB 1: RECEIPT VIEW */}
                        {detailTab === 'receipt' && (
                            <div className={`max-w-sm mx-auto bg-white text-black p-6 rounded shadow-xl relative ${settings.posReceiptFont === 'monospace' ? 'font-mono' : 'font-sans'}`}>
                                {/* Logo */}
                                {settings.posReceiptShowLogo && (settings.posReceiptLogo || settings.logoUrl) && (
                                    <div className="flex justify-center mb-4">
                                        <img src={settings.posReceiptLogo || settings.logoUrl} className="max-h-12 object-contain grayscale" alt="logo" />
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
                                    {settings.slogan && settings.slogan !== (settings.posReceiptHeader || 'SIIFMART RETAIL') && (
                                        <p className="text-[9px] italic opacity-70 mt-0.5">
                                            {settings.slogan}
                                        </p>
                                    )}
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
                                                <div className="text-[9px] opacity-60">{item.quantity} x {currencySymbol} {formatPriceValue(item.price)}</div>
                                            </div>
                                            <div className="font-bold">{formatPriceValue(item.price * item.quantity)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-right mb-4">
                                    <div className="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>{selectedSale.subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] opacity-60"><span>Tax ({settings.taxRate || 0}%)</span><span>{selectedSale.tax.toLocaleString()}</span></div>
                                    <div className="flex justify-between font-black text-base border-t border-black pt-2 mt-2"><span>TOTAL</span><span>{currencySymbol} {selectedSale.total.toLocaleString()}</span></div>
                                </div>

                                <div className="text-[10px] font-bold border-t border-black/10 border-dashed pt-3 mb-4">
                                    <div className="flex justify-between">
                                        <span>PAID ({selectedSale.mobilePaymentChannel ? selectedSale.mobilePaymentChannel.replace(/_/g, ' ') : selectedSale.method.toUpperCase()})</span>
                                        <span>{currencySymbol} {selectedSale.total.toLocaleString()}</span>
                                    </div>
                                    {selectedSale.mobileTransactionRef && (
                                        <div className="flex justify-between text-[9px] opacity-75 font-mono mt-0.5">
                                            <span>TX REF:</span>
                                            <span className="font-bold">{selectedSale.mobileTransactionRef}</span>
                                        </div>
                                    )}
                                    {selectedSale.customerPhone && (
                                        <div className="flex justify-between text-[9px] opacity-60 font-mono">
                                            <span>PHONE:</span>
                                            <span>{canViewFullCustomerPII ? selectedSale.customerPhone : maskPhoneNumber(selectedSale.customerPhone)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center space-y-1 pt-4 border-t border-black/10 border-dashed">
                                    <p className="text-xs font-bold leading-tight mb-2">{settings.posReceiptFooter || 'Thank you for shopping with us!'}</p>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: REAL AUDIT LOG */}
                        {detailTab === 'audit' && (
                            <div className="space-y-6 relative text-[var(--theme-text-primary)]">
                                <div className="absolute left-3 top-2 bottom-2 w-px bg-[var(--theme-border)]"></div>

                                {/* Header Event */}
                                <div className="flex gap-4 relative">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center z-10 shrink-0"><CheckCircle size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--theme-text-primary)]">Transaction Completed</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)]">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Payment verified via {selectedSale.mobilePaymentChannel || selectedSale.method}{selectedSale.mobileTransactionRef ? ` (Ref: ${selectedSale.mobileTransactionRef})` : ''} gateway.</p>
                                    </div>
                                </div>

                                {/* Dynamic Movements */}
                                {auditLogs.length > 0 ? (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="flex gap-4 relative">
                                            <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center z-10 shrink-0"><Shield size={14} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--theme-text-primary)]">{log.type === 'OUT' ? 'Stock Deducted' : 'Stock Return'}</p>
                                                <p className="text-xs text-[var(--theme-text-secondary)]">{formatDateTime(log.date, { showTime: true })}</p>
                                                <div className="mt-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-2.5 rounded-xl text-[10px] font-mono text-[var(--theme-text-secondary)]">
                                                    {log.type === 'OUT' ? '-' : '+'} {log.quantity} {log.productName} (ID: {log.productId})
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex gap-4 relative">
                                        <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--theme-text-primary)]">System Log</p>
                                            <p className="text-xs text-[var(--theme-text-secondary)]">No detailed movement logs found for this transaction.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Event */}
                                <div className="flex gap-4 relative">
                                    <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--theme-text-primary)]">Session Active</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)]">Cashier: {selectedSale.cashierName}</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Terminal ID: POS-01</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={handleReprint}
                            className="flex-1 py-3 bg-[var(--theme-bg-panel)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Printer size={18} /> Reprint
                        </button>
                        <Protected permission="REFUND_SALE">
                            <button
                                type="button"
                                onClick={() => {
                                    addNotification('info', `Initiating Return Workflow for ${selectedSale.receiptNumber || selectedSale.id.substring(0, 12)}...`);
                                    onClose();
                                }}
                                className="flex-1 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
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
