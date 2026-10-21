import React from 'react';
import {
    CheckCircle, Shield, User, Printer, RotateCcw, Receipt
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
    onIssueReturn: () => void;
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
    onIssueReturn,
    currencySymbol = CURRENCY_SYMBOL
}) => {
    const { user } = useStore();
    const canViewFullCustomerPII = isAdmin(user?.role) || user?.role === 'finance_manager';

    return (
        <Modal
            isOpen={!!selectedSale}
            onClose={onClose}
            title="Transaction Details"
            size="lg"
        >
            {selectedSale && (
                <div className="flex flex-col text-[var(--theme-text-primary)]">
                    {/* Modal Header Card */}
                    <div className="flex items-center justify-between mb-5 bg-[var(--theme-bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                                <Receipt size={18} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight">
                                    {selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}
                                </h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                    {formatDateTime(selectedSale.date, { showTime: true })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">
                                Total Amount
                            </p>
                            <p className="text-xl sm:text-2xl font-mono tabular-nums text-[var(--theme-text-primary)] font-bold tracking-tight">
                                {currencySymbol} {selectedSale.total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Apple Segmented Control for Tabs */}
                    <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl inline-flex gap-1 mb-5 self-start select-none">
                        <button
                            type="button"
                            onClick={() => setDetailTab('receipt')}
                            className={`px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                                detailTab === 'receipt'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium'
                            }`}
                        >
                            Digital Receipt
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailTab('audit')}
                            className={`px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                                detailTab === 'audit'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium'
                            }`}
                        >
                            Audit Log
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="h-[420px] overflow-y-auto custom-scrollbar bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-4 sm:p-6">
                        {/* TAB 1: RECEIPT VIEW */}
                        {detailTab === 'receipt' && (
                            <div className={`max-w-sm mx-auto bg-white text-zinc-950 p-6 rounded-2xl border border-black/10 shadow-lg relative ${settings?.posReceiptFont === 'monospace' ? 'font-mono' : 'font-sans'}`}>
                                {/* Logo */}
                                {settings?.posReceiptShowLogo && (settings?.posReceiptLogo || settings?.logoUrl) && (
                                    <div className="flex justify-center mb-4">
                                        <img src={settings.posReceiptLogo || settings.logoUrl} className="max-h-12 object-contain grayscale" alt="logo" />
                                    </div>
                                )}

                                {/* Receipt Header */}
                                <div className="text-center border-b border-black/10 pb-4 border-dashed mb-4">
                                    <h2 className="text-lg font-bold uppercase tracking-tight leading-none mb-1">
                                        {settings?.storeName || sites.find(s => s.id === selectedSale.siteId)?.name || 'SIIFMART'}
                                    </h2>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
                                        {settings?.posReceiptHeader || 'SIIFMART Retail'}
                                    </p>
                                    {settings?.slogan && settings.slogan !== (settings?.posReceiptHeader || 'SIIFMART Retail') && (
                                        <p className="text-[11px] italic text-black/60 mt-0.5">
                                            {settings.slogan}
                                        </p>
                                    )}
                                </div>

                                <div className="text-[11px] text-center space-y-0.5 mb-4 border-b border-black/10 pb-4 border-dashed text-black/75">
                                    {settings?.posReceiptAddress && <p>{settings.posReceiptAddress}</p>}
                                    <div className="flex justify-center gap-2">
                                        {settings?.posReceiptPhone && <p>Tel: {settings.posReceiptPhone}</p>}
                                        {settings?.posReceiptEmail && <p>Email: {settings.posReceiptEmail}</p>}
                                    </div>
                                    {settings?.posReceiptTaxId && <p className="font-semibold text-black">TIN: {settings.posReceiptTaxId}</p>}
                                </div>

                                <div className="text-[11px] space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-black/60">DATE:</span>
                                        <span className="font-medium">{formatDateTime(selectedSale.date, { showTime: true })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black/60">RECEIPT #:</span>
                                        <span className="font-mono font-semibold">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).toUpperCase()}`}</span>
                                    </div>
                                </div>

                                <div className="border-y border-black/10 py-3 mb-4 space-y-2.5">
                                    {selectedSale.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <div>
                                                <div className="font-semibold text-black">{item.name}</div>
                                                <div className="text-[11px] text-black/60 font-mono tabular-nums">
                                                    {item.quantity} × {currencySymbol} {formatPriceValue(item.price)}
                                                </div>
                                            </div>
                                            <div className="font-mono tabular-nums font-semibold text-black">
                                                {formatPriceValue(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-right mb-4">
                                    <div className="flex justify-between text-[11px] text-black/70">
                                        <span>Subtotal</span>
                                        <span className="font-mono tabular-nums">{selectedSale.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-black/70">
                                        <span>Tax ({settings?.taxRate || 0}%)</span>
                                        <span className="font-mono tabular-nums">{selectedSale.tax.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm border-t border-black/20 pt-2 mt-2 text-black">
                                        <span>TOTAL</span>
                                        <span className="font-mono tabular-nums">{currencySymbol} {selectedSale.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="text-[11px] border-t border-black/10 border-dashed pt-3 mb-4 space-y-1">
                                    <div className="flex justify-between font-semibold text-black">
                                        <span>PAID ({selectedSale.mobilePaymentChannel ? selectedSale.mobilePaymentChannel.replace(/_/g, ' ') : selectedSale.method.toUpperCase()})</span>
                                        <span className="font-mono tabular-nums">{currencySymbol} {selectedSale.total.toLocaleString()}</span>
                                    </div>
                                    {selectedSale.mobileTransactionRef && (
                                        <div className="flex justify-between text-[11px] text-black/70 font-mono">
                                            <span>TX REF:</span>
                                            <span className="font-semibold">{selectedSale.mobileTransactionRef}</span>
                                        </div>
                                    )}
                                    {selectedSale.customerPhone && (
                                        <div className="flex justify-between text-[11px] text-black/70 font-mono">
                                            <span>PHONE:</span>
                                            <span>{canViewFullCustomerPII ? selectedSale.customerPhone : maskPhoneNumber(selectedSale.customerPhone)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center pt-3 border-t border-black/10 border-dashed">
                                    <p className="text-xs font-semibold text-black/80">{settings?.posReceiptFooter || 'Thank you for shopping with us!'}</p>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: AUDIT LOG */}
                        {detailTab === 'audit' && (
                            <div className="space-y-5 relative text-[var(--theme-text-primary)] pl-2">
                                <div className="absolute left-6 top-3 bottom-3 w-px bg-[var(--theme-border)]" />

                                {/* Event 1: Completed */}
                                <div className="flex gap-4 relative items-start">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 z-10">
                                        <CheckCircle size={15} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)]">Transaction Settled</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">
                                            {formatDateTime(selectedSale.date, { showTime: true })}
                                        </p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 font-normal">
                                            Payment verified via {selectedSale.mobilePaymentChannel || selectedSale.method}
                                            {selectedSale.mobileTransactionRef ? ` (Ref: ${selectedSale.mobileTransactionRef})` : ''} gateway.
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Inventory Movements */}
                                {auditLogs.length > 0 ? (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="flex gap-4 relative items-start">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-blue-500/20 flex items-center justify-center shrink-0 z-10">
                                                <Shield size={15} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                                    {log.type === 'OUT' ? 'Stock Depleted (FEFO)' : 'Stock Restocked'}
                                                </p>
                                                <p className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">
                                                    {formatDateTime(log.date, { showTime: true })}
                                                </p>
                                                <div className="mt-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-2 rounded-xl text-xs font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                                    {log.type === 'OUT' ? '−' : '+'} {log.quantity} {log.productName} (SKU: {log.productId})
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex gap-4 relative items-start">
                                        <div className="w-8 h-8 rounded-xl bg-neutral-500/10 text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 z-10">
                                            <User size={15} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--theme-text-primary)]">Zero-Trust Telemetry</p>
                                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                                Audit log synced via Supabase edge transaction journal.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Cashier & Terminal attribution */}
                                <div className="flex gap-4 relative items-start">
                                    <div className="w-8 h-8 rounded-xl bg-neutral-500/10 text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 z-10">
                                        <User size={15} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)]">Operator Attribution</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                            Cashier: <span className="text-[var(--theme-text-primary)] font-medium">{selectedSale.cashierName || 'Frontline Staff'}</span>
                                        </p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-mono">
                                            Site: {sites.find(s => s.id === selectedSale.siteId)?.name || selectedSale.siteId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={handleReprint}
                            className="flex-1 h-11 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Printer size={16} /> Reprint Receipt
                        </button>
                        <Protected permission="REFUND_SALE">
                            <button
                                type="button"
                                onClick={onIssueReturn}
                                className="flex-1 h-11 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                            >
                            <RotateCcw size={16} /> Continue return in POS
                            </button>
                        </Protected>
                    </div>
                </div>
            )}
        </Modal>
    );
};
