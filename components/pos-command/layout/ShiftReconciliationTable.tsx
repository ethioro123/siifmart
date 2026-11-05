import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ShiftRecord } from '../../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Search, Printer, X } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatting';
import { generateZReportReceiptHtml } from '../utils/receiptTemplate';

export const ShiftReconciliationTable: React.FC = () => {
    const { shifts, reconcileShift, activeSite, addNotification, effectiveCountry } = useData();
    const { currencySymbol, t } = useLanguage();
    const currency = currencySymbol || (effectiveCountry === 'KE' ? 'KSh' : 'ETB');
    const { user } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Closed' | 'Audited' | 'Flagged'>('All');
    const [reconcilingId, setReconcilingId] = useState<string | null>(null);

    const isHQOrManager = ['group_ceo', 'country_finance_director', 'regional_operations_manager', 'country_operations_director', 'country_managing_director', 'store_manager'].includes(user?.role?.toLowerCase() || '');

    // Filter shifts for active store and search term
    const siteShifts = (shifts || []).filter(s => !activeSite?.id || s.siteId === activeSite.id);

    const filteredShifts = siteShifts.filter(s => {
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        const matchesSearch = !searchTerm.trim() ||
            (s.cashierName && s.cashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.cashierCode && s.cashierCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.counterNumber && s.counterNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleReconcile = async (shiftId: string, status: 'Reconciled' | 'Discrepancy_Flagged') => {
        if (!isHQOrManager) return;
        setReconcilingId(shiftId);
        try {
            await reconcileShift(shiftId, user?.name || 'HQ Supervisor', status);
            addNotification('success', `Shift ${shiftId.slice(-6)} marked as ${status.replace('_', ' ')}.`);
        } catch {
            addNotification('alert', 'Failed to update shift reconciliation status.');
        } finally {
            setReconcilingId(null);
        }
    };

    const handlePrintShiftZReport = (shift: ShiftRecord) => {
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (printWindow) {
            const html = generateZReportReceiptHtml(
                shift,
                undefined,
                activeSite?.name || 'SIIFMART Store',
                user?.name || shift.cashierName || 'Staff'
            );
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xs space-y-4 sm:space-y-6 isolate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                            {t('posCommand.reconciliationTableTitle')}
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            {t('posCommand.reconciliationTableSubtitle')}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="flex flex-1 items-center bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl px-3 py-1.5 focus-within:border-[var(--theme-primary)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/15 focus-within:bg-[var(--theme-bg-card)] transition-all group shadow-2xs">
                        <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0 group-focus-within:bg-[var(--theme-primary)] group-focus-within:text-[var(--theme-primary-text)] transition-all">
                            <Search size={12} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('posCommand.searchCashierOrId') || "Search cashier or ID..."}
                            className="bg-transparent border-none ml-2 text-xs text-[var(--theme-text-primary)] font-mono outline-none placeholder-[var(--theme-text-muted)] w-full sm:w-48"
                        />
                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="w-5 h-5 rounded-full bg-[var(--theme-bg-panel)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-all cursor-pointer active:scale-90 touch-manipulation"
                                aria-label="Clear search"
                            >
                                <X size={10} />
                            </button>
                        ) : null}
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="min-h-11 sm:min-h-0 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] font-semibold outline-none cursor-pointer transition-colors shadow-2xs touch-manipulation"
                    >
                        <option value="All">{t('posCommand.filterAllShifts')}</option>
                        <option value="Open">{t('posCommand.filterOpenShifts')}</option>
                        <option value="Closed">{t('posCommand.filterClosedShifts')}</option>
                        <option value="Audited">{t('posCommand.filterAuditedShifts')}</option>
                        <option value="Flagged">{t('posCommand.filterFlaggedShifts')}</option>
                    </select>
                </div>
            </div>

            {/* Mobile Shift Cards View (Small screens) */}
            <div className="block md:hidden space-y-3">
                {filteredShifts.length === 0 ? (
                    <div className="p-8 text-center text-[var(--theme-text-muted)] font-sans text-xs bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        {t('posCommand.noShiftsMatching')}
                    </div>
                ) : (
                    filteredShifts.map((shift: ShiftRecord) => {
                        const hasVariance = Math.abs(shift.variance || 0) > 0.01;
                        return (
                            <div key={shift.id} className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-3 shadow-2xs">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                                                {shift.cashierCode || shift.cashier_code || 'STAFF'}
                                            </span>
                                            <span className="font-semibold text-xs text-[var(--theme-text-primary)]">{shift.cashierName}</span>
                                        </div>
                                        <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">
                                            {shift.counterNumber || shift.counter_number || 'Counter 1'}
                                            {shift.startTime ? ` • ${formatDateTime(shift.startTime)}` : ''}
                                        </div>
                                    </div>
                                    <div>
                                        {shift.status === 'Open' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                                <Clock size={10} /> {t('posCommand.statusOpen')}
                                            </span>
                                        ) : shift.status === 'Audited' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                                <CheckCircle size={10} /> {t('posCommand.statusAudited')}
                                            </span>
                                        ) : shift.status === 'Flagged' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                                                <AlertTriangle size={10} /> {t('posCommand.statusFlagged')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                                <Clock size={10} /> {t('posCommand.statusAwaitingHQ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[var(--theme-bg-card)] p-2.5 rounded-xl border border-[var(--theme-border-subtle)]">
                                    <div>
                                        <span className="text-[10px] font-sans text-[var(--theme-text-muted)] uppercase block">{t('posCommand.thExpected')}</span>
                                        <span className="font-semibold text-[var(--theme-text-secondary)]">{currency} {(shift.expectedCash || 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-sans text-[var(--theme-text-muted)] uppercase block">{t('posCommand.thActualCount')}</span>
                                        <span className="font-bold text-[var(--theme-text-primary)]">
                                            {shift.status === 'Open' ? (t('posCommand.statusActive') || 'Active...') : `${currency} ${(shift.actualCash || 0).toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-sans text-[var(--theme-text-muted)] uppercase block">{t('posCommand.thCashSales')}</span>
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{currency} {(shift.cashSales || 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-sans text-[var(--theme-text-muted)] uppercase block">{t('posCommand.thVariance')}</span>
                                        <span className={`font-bold ${hasVariance ? 'text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-text-primary)]'}`}>
                                            {shift.status === 'Open' ? '-' : `${(shift.variance || 0) > 0 ? '+' : ''}${(shift.variance || 0).toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {shift.status !== 'Open' && (
                                        <button
                                            type="button"
                                            onClick={() => handlePrintShiftZReport(shift)}
                                            className="flex-1 min-h-11 px-3 py-2 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-98 shadow-2xs touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                        >
                                            <Printer size={13} className="text-[var(--theme-accent)]" />
                                            <span>{t('posCommand.zReportBtn')}</span>
                                        </button>
                                    )}
                                    {shift.status === 'Closed' && isHQOrManager && (
                                        <>
                                            <button
                                                onClick={() => handleReconcile(shift.id, 'Reconciled')}
                                                disabled={reconcilingId === shift.id}
                                                className="flex-1 min-h-11 px-3 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                            >
                                                {t('posCommand.signOff')}
                                            </button>
                                            <button
                                                onClick={() => handleReconcile(shift.id, 'Discrepancy_Flagged')}
                                                disabled={reconcilingId === shift.id}
                                                className="flex-1 min-h-11 px-3 py-2 bg-[var(--theme-status-danger)] hover:opacity-90 text-[var(--theme-status-danger-text)] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                                            >
                                                {t('posCommand.flagDiscrepancy')}
                                            </button>
                                        </>
                                    )}
                                    {shift.reconciledBy && (
                                        <div className="w-full text-[11px] text-[var(--theme-text-muted)] flex items-center gap-1 font-sans">
                                            <CheckCircle size={12} className="text-[var(--theme-status-success)] shrink-0" />
                                            <span>{shift.reconciledBy}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Shift List Table */}
            <div className="hidden md:block overflow-x-auto border border-[var(--theme-border)] rounded-xl isolate">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase font-semibold tracking-wider text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]/70">
                            <th className="py-2.5 px-3">{t('posCommand.thStatus')}</th>
                            <th className="py-2.5 px-3">{t('posCommand.thCashierCounter')}</th>
                            <th className="py-2.5 px-3">{t('posCommand.thStartTime')}</th>
                            <th className="py-2.5 px-3 text-right">{t('posCommand.thFloat')}</th>
                            <th className="py-2.5 px-3 text-right">{t('posCommand.thCashSales')}</th>
                            <th className="py-2.5 px-3 text-right">{t('posCommand.thExpected')}</th>
                            <th className="py-2.5 px-3 text-right">{t('posCommand.thActualCount')}</th>
                            <th className="py-2.5 px-3 text-right">{t('posCommand.thVariance')}</th>
                            <th className="py-2.5 px-3 text-center">{t('posCommand.thAuditAction')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)] font-mono">
                        {filteredShifts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-[var(--theme-text-muted)] font-sans text-xs">
                                    {t('posCommand.noShiftsMatching')}
                                </td>
                            </tr>
                        ) : (
                            filteredShifts.map((shift: ShiftRecord) => {
                                const hasVariance = Math.abs(shift.variance || 0) > 0.01;
                                return (
                                    <tr key={shift.id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                        {/* Status Badge */}
                                        <td className="py-2 px-3 font-sans">
                                            {shift.status === 'Open' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                                    <Clock size={10} /> {t('posCommand.statusOpen')}
                                                </span>
                                            ) : shift.status === 'Audited' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                                    <CheckCircle size={10} /> {t('posCommand.statusAudited')}
                                                </span>
                                            ) : shift.status === 'Flagged' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                                                    <AlertTriangle size={10} /> {t('posCommand.statusFlagged')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                                    <Clock size={10} /> {t('posCommand.statusAwaitingHQ')}
                                                </span>
                                            )}
                                        </td>

                                        {/* Cashier & Counter */}
                                        <td className="py-2 px-3 font-sans">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                                                    {shift.cashierCode || shift.cashier_code || 'STAFF'}
                                                </span>
                                                <span className="font-semibold text-[var(--theme-text-primary)] break-words leading-tight max-w-[160px] text-xs">{shift.cashierName}</span>
                                            </div>
                                            <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5 font-medium">
                                                {shift.counterNumber || shift.counter_number || 'Counter 1'}
                                            </div>
                                            {shift.terminalId && <div className="text-[9px] text-[var(--theme-text-muted)] font-mono mt-0.5">{t('posCommand.counterIdentifier')}: {shift.terminalId}</div>}
                                        </td>

                                        {/* Start Time */}
                                        <td className="py-2 px-3 text-[11px] text-[var(--theme-text-secondary)]">
                                            {shift.startTime ? formatDateTime(shift.startTime) : 'N/A'}
                                        </td>

                                        {/* Opening Float */}
                                        <td className="py-2 px-3 text-right text-[var(--theme-text-secondary)] tabular-nums">
                                            {currency} {(shift.openingFloat || 0).toLocaleString()}
                                        </td>

                                        {/* Cash Sales */}
                                        <td className="py-2 px-3 text-right text-[var(--theme-text-primary)] font-bold tabular-nums">
                                            {currency} {(shift.cashSales || 0).toLocaleString()}
                                        </td>

                                        {/* Expected Cash */}
                                        <td className="py-2 px-3 text-right font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                            {currency} {(shift.expectedCash || 0).toLocaleString()}
                                        </td>

                                        {/* Actual Counted */}
                                        <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)] tabular-nums">
                                            {shift.status === 'Open' ? (t('posCommand.statusActive') || 'Active...') : `${currency} ${(shift.actualCash || 0).toLocaleString()}`}
                                        </td>

                                        {/* Variance */}
                                        <td className={`py-2 px-3 text-right font-bold tabular-nums ${
                                            hasVariance ? 'text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-text-primary)]'
                                        }`}>
                                            {shift.status === 'Open' ? '-' : (
                                                <>
                                                    {(shift.variance || 0) > 0 ? '+' : ''}
                                                    {(shift.variance || 0).toLocaleString()}
                                                </>
                                            )}
                                        </td>

                                        {/* HQ Action */}
                                        <td className="py-2 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-sans">
                                                {shift.status !== 'Open' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintShiftZReport(shift)}
                                                        className="px-2.5 py-1 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl transition-all flex items-center gap-1 text-[10px] font-semibold cursor-pointer active:scale-95 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                                        title="Print Z-Report Slip"
                                                    >
                                                        <Printer size={11} className="text-[var(--theme-accent)]" />
                                                        <span>{t('posCommand.zReportBtn')}</span>
                                                    </button>
                                                )}

                                                {shift.status === 'Closed' && isHQOrManager ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Reconciled')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[10px] font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                                        >
                                                            {t('posCommand.signOff')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Discrepancy_Flagged')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-[var(--theme-status-danger)] hover:opacity-90 text-[var(--theme-status-danger-text)] text-[10px] font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                                                        >
                                                            {t('posCommand.flagDiscrepancy')}
                                                        </button>
                                                    </>
                                                ) : shift.reconciledBy ? (
                                                    <span className="text-[10px] text-[var(--theme-text-muted)] font-sans inline-flex items-center gap-1" title={`Reconciled at ${shift.reconciledAt}`}>
                                                        <CheckCircle size={10} className="text-[var(--theme-status-success)] shrink-0" />
                                                        <span>{shift.reconciledBy}</span>
                                                    </span>
                                                ) : shift.status === 'Open' ? (
                                                    <span className="text-[var(--theme-text-muted)]">-</span>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
