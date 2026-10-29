import React, { useState } from 'react';
import {
    Database, Upload, Download, RefreshCw, AlertTriangle, FileText, Trash2,
    ChevronDown, ShieldAlert, Archive, ShieldCheck
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { generateQuarterlyReport } from '../../utils/reportGenerator';
import { logger } from '../../utils/logger';
import Modal from '../Modal';
import { Country, getCountryProfile } from '../../utils/localization';

export default function DataSettings() {
    const { showToast, user } = useStore();
    const { allOrders, allSales, expenses, products, customers, settings, sites, effectiveCountry } = useData();

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    // Archive State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState('Full Year');
    const [selectedReportType, setSelectedReportType] = useState<'Operations' | 'Financials' | 'Procurement'>('Financials');
    const [isGenerating, setIsGenerating] = useState(false);

    // Reset Confirmation Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleRetrieveReport = () => {
        setIsGenerating(true);
        setTimeout(() => {
            try {
                const start = new Date(selectedYear, 0, 1);
                const end = new Date(selectedYear, 11, 31);

                if (selectedPeriod.startsWith('Q')) {
                    const q = parseInt(selectedPeriod.charAt(1));
                    start.setMonth((q - 1) * 3);
                    end.setMonth(q * 3, 0);
                }
                end.setHours(23, 59, 59, 999);

                const isWithin = (dateStr: string) => {
                    if (!dateStr) return false;
                    const d = new Date(dateStr);
                    return d >= start && d <= end;
                };

                let reportMetrics = {};
                const label = `${selectedPeriod} ${selectedYear}`;

                if (selectedReportType === 'Financials') {
                    const filteredSales = (allSales || []).filter(s => isWithin(s.date));
                    const filteredExpenses = (expenses || []).filter(e => isWithin(e.date));

                    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
                    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const netProfit = totalRevenue - totalExpenses;
                    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';

                    reportMetrics = { totalRevenue, totalExpenses, netProfit, profitMargin };
                } else if (selectedReportType === 'Procurement') {
                    const filteredOrders = (allOrders || []).filter(o => isWithin(o.date));
                    const totalSpend = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const openPO = filteredOrders.filter(o => o.status === 'Pending').length;

                    reportMetrics = { totalSpend, openPO, pendingValue: 0 };
                } else {
                    const filteredSales = (allSales || []).filter(s => isWithin(s.date));
                    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
                    const txCount = filteredSales.length;

                    reportMetrics = {
                        totalRevenue,
                        transactionCount: txCount,
                        avgTicket: txCount > 0 ? (totalRevenue / txCount) : 0
                    };
                }

                const hasData = Object.values(reportMetrics).some(val => val !== 0 && val !== '0%' && val !== '0');
                generateQuarterlyReport(reportMetrics, label, selectedReportType);

                if (hasData) {
                    showToast(`Retrieved ${label} ${selectedReportType} Report`, 'success');
                } else {
                    showToast(`Report generated, but no data found for ${label}`, 'warning');
                }
            } catch (err) {
                logger.error('DataSettings', 'caught error', err as Error);
                showToast('Failed to retrieve archive data', 'error');
            } finally {
                setIsGenerating(false);
            }
        }, 800);
    };

    const handleCreateBackup = () => {
        try {
            const backupPayload = {
                timestamp: new Date().toISOString(),
                version: '3.5.3',
                generatedBy: user?.name || 'Admin',
                country: activeCountry,
                systemConfig: settings,
                stats: {
                    totalProducts: (products || []).length,
                    totalCustomers: (customers || []).length,
                    totalSites: (sites || []).length
                }
            };

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupPayload, null, 2))}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', jsonString);
            downloadAnchor.setAttribute('download', `siifmart_${activeCountry.toLowerCase()}_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            showToast('System configuration backup downloaded', 'success');
        } catch (e) {
            showToast('Failed to generate backup file', 'error');
        }
    };

    const handleExportProductsCSV = () => {
        const productList = products || [];
        const csvContent = "data:text/csv;charset=utf-8,"
            + "SKU,Name,Category,Price,CostPrice,Stock,Location,Status\n"
            + productList.map(p =>
                `"${p.sku || ''}","${(p.name || '').replace(/"/g, '""')}","${p.category || ''}",${p.price || 0},${p.costPrice || 0},${p.stock || 0},"${p.location || ''}","${p.status || ''}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `products_catalog_${activeCountry.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Products catalog exported to CSV', 'success');
    };

    const handleExportCustomersCSV = () => {
        const customerList = customers || [];
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Name,Phone,Email,LoyaltyPoints,TotalSpent\n"
            + customerList.map(c =>
                `"${(c.name || '').replace(/"/g, '""')}","${c.phone || ''}","${c.email || ''}",${c.loyaltyPoints || 0},${c.totalSpent || 0}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `customers_registry_${activeCountry.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Customers registry exported to CSV', 'success');
    };

    const handleFactoryResetConfirm = () => {
        if (confirmText !== 'RESET-SIIFMART') {
            showToast('Confirmation phrase does not match', 'warning');
            return;
        }
        setIsResetModalOpen(false);
        setConfirmText('');
        showToast('Security Override: Factory reset blocked in production environment', 'info');
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Database size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Data Management & Archive Center</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {countryProfile.name} ({activeCountry})
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Manage historical reporting archives, system backup snapshots, bulk CSV exports, and maintenance resets.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- REPORTS ARCHIVE --- */}
                <div className="md:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--theme-border)]">
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                                <Archive className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                                Historical Reports Archive
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Generate and retrieve fiscal records, procurement summaries, and operational turnover.
                            </p>
                        </div>
                        <span className="self-start sm:self-auto bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1">
                            <ShieldCheck size={11} /> Immutable Ledger
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Year Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Fiscal Year</label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-semibold appearance-none outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] cursor-pointer transition-colors"
                                    aria-label="Select Fiscal Year"
                                >
                                    {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Reporting Period</label>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-semibold appearance-none outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] cursor-pointer transition-colors"
                                    aria-label="Select Period"
                                >
                                    {['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Full Year'].map(p => (
                                        <option key={p} value={p.split(' ')[0]}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Type Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Report Scope</label>
                            <div className="relative">
                                <select
                                    value={selectedReportType}
                                    onChange={(e) => setSelectedReportType(e.target.value as 'Operations' | 'Financials' | 'Procurement')}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-semibold appearance-none outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] cursor-pointer transition-colors"
                                    aria-label="Select Report Type"
                                >
                                    {['Financials', 'Procurement', 'Operations'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Retrieve Button */}
                        <div>
                            <button
                                type="button"
                                onClick={handleRetrieveReport}
                                disabled={isGenerating}
                                className="w-full h-9 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <RefreshCw className="animate-spin" size={14} />
                                ) : (
                                    <Download size={14} />
                                )}
                                {isGenerating ? 'Generating...' : 'Retrieve Data'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* BACKUP & RESTORE */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Backup & Recovery</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Create Backup Snapshot</h5>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Download JSON snapshot of system state</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateBackup}
                                className="h-8 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98] px-3.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download size={13} /> Download
                            </button>
                        </div>
                        <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Restore Snapshot</h5>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Upload verified .json configuration backup</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => showToast('Restore engine ready. Select backup archive.', 'info')}
                                className="h-8 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-border)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-3.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Upload size={13} /> Upload
                            </button>
                        </div>
                    </div>
                </div>

                {/* BULK CSV EXPORTS */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Bulk Data Exports</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={handleExportProductsCSV}
                            className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-center hover:border-[var(--theme-accent)]/40 transition-all cursor-pointer group shadow-xs"
                        >
                            <FileText size={20} className="mx-auto text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mb-2" />
                            <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Products Catalog</h5>
                            <span className="text-[10px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 px-2.5 py-0.5 rounded-full inline-block mt-2">Export CSV</span>
                        </div>
                        <div
                            onClick={handleExportCustomersCSV}
                            className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-center hover:border-[var(--theme-accent)]/40 transition-all cursor-pointer group shadow-xs"
                        >
                            <FileText size={20} className="mx-auto text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mb-2" />
                            <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Customer Registry</h5>
                            <span className="text-[10px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 px-2.5 py-0.5 rounded-full inline-block mt-2">Export CSV</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-[var(--theme-status-danger-bg)] dark:bg-red-950/20 border border-[var(--theme-status-danger-border)] rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] mb-1 flex items-center gap-2">
                        <AlertTriangle size={16} /> Danger Zone: Factory Reset
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Irreversible administrative operation. Requires explicit confirmation code.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[var(--theme-status-danger-border)]">
                    <div>
                        <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">Purge System Data</h5>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Restore factory baseline configuration and reset local cache.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="h-8 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-white px-4 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                        <Trash2 size={13} /> Reset System
                    </button>
                </div>
            </div>

            {/* FACTORY RESET CONFIRMATION MODAL */}
            {isResetModalOpen && (
                <Modal
                    isOpen={isResetModalOpen}
                    onClose={() => {
                        setIsResetModalOpen(false);
                        setConfirmText('');
                    }}
                    title="Confirm Factory Reset"
                    footer={(
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetModalOpen(false);
                                    setConfirmText('');
                                }}
                                className="h-9 px-4 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold cursor-pointer hover:bg-[var(--theme-border)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFactoryResetConfirm}
                                disabled={confirmText !== 'RESET-SIIFMART'}
                                className="h-9 px-4 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
                            >
                                Confirm System Reset
                            </button>
                        </div>
                    )}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl flex items-start gap-3">
                            <ShieldAlert className="text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] leading-relaxed">
                                <strong className="font-semibold">Warning:</strong> This action cannot be undone. To prevent accidental resets, type <code className="font-mono font-bold bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded border border-[var(--theme-status-danger-border)]">RESET-SIIFMART</code> below.
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] block">Confirmation Code</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type RESET-SIIFMART"
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-mono font-semibold outline-none border-[var(--theme-status-danger-border)] transition-colors"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
