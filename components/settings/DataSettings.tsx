import React, { useState } from 'react';
import {
    Database, Upload, Download, RefreshCw, AlertTriangle, FileText, Trash2,
    Calendar, ChevronDown, CheckCircle, ShieldAlert, Archive
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { generateQuarterlyReport } from '../../utils/reportGenerator';
import { logger } from '../../utils/logger';
import Modal from '../Modal';

export default function DataSettings() {
    const { showToast, user } = useStore();
    const { allOrders, allSales, expenses, products, customers, settings, sites } = useData();

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
            downloadAnchor.setAttribute('download', `siifmart_backup_${new Date().toISOString().split('T')[0]}.json`);
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
        link.setAttribute("download", `products_catalog_${new Date().toISOString().split('T')[0]}.csv`);
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
        link.setAttribute("download", `customers_registry_${new Date().toISOString().split('T')[0]}.csv`);
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

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Database className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Data Management & Archive Center</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Manage historical reporting archives, system backup snapshots, bulk CSV exports, and maintenance resets.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- REPORTS ARCHIVE --- */}
                <div className={`md:col-span-2 ${cardBase} relative overflow-hidden`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                        <div>
                            <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                                <Archive className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                                Historical Reports Archive
                            </h3>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                                Generate and retrieve fiscal records, procurement summaries, and operational turnover.
                            </p>
                        </div>
                        <span className="self-start sm:self-auto bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-950/30">
                            Immutable Ledger
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Year Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Fiscal Year</label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold appearance-none outline-none focus:border-[#2C5E3B] cursor-pointer"
                                    aria-label="Select Fiscal Year"
                                >
                                    {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Reporting Period</label>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold appearance-none outline-none focus:border-[#2C5E3B] cursor-pointer"
                                    aria-label="Select Period"
                                >
                                    {['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Full Year'].map(p => (
                                        <option key={p} value={p.split(' ')[0]}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Type Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Report Scope</label>
                            <div className="relative">
                                <select
                                    value={selectedReportType}
                                    onChange={(e) => setSelectedReportType(e.target.value as 'Operations' | 'Financials' | 'Procurement')}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold appearance-none outline-none focus:border-[#2C5E3B] cursor-pointer"
                                    aria-label="Select Report Type"
                                >
                                    {['Financials', 'Procurement', 'Operations'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Retrieve Button */}
                        <div>
                            <button
                                type="button"
                                onClick={handleRetrieveReport}
                                disabled={isGenerating}
                                className="w-full bg-[#2C5E3B] hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
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
                <div className={cardBase}>
                    <h3 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider mb-4">Backup & Recovery</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">Create Backup Snapshot</h5>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400">Download JSON snapshot of system state</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateBackup}
                                className="bg-[#2C5E3B] text-white hover:opacity-90 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download size={13} /> Download
                            </button>
                        </div>
                        <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">Restore Snapshot</h5>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400">Upload verified .json configuration backup</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => showToast('Restore engine ready. Select backup archive.', 'info')}
                                className="bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-gray-200 border border-[#E2DCCE] dark:border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <Upload size={13} /> Upload
                            </button>
                        </div>
                    </div>
                </div>

                {/* BULK CSV EXPORTS */}
                <div className={cardBase}>
                    <h3 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider mb-4">Bulk Data Exports</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={handleExportProductsCSV}
                            className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 text-center hover:border-[#2C5E3B]/40 transition-all cursor-pointer group shadow-sm"
                        >
                            <FileText size={22} className="mx-auto text-[#2C5E3B] dark:text-[#A9CBA2] mb-1.5" />
                            <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">Products Catalog</h5>
                            <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2 py-0.5 rounded-md inline-block mt-2">Export CSV</span>
                        </div>
                        <div
                            onClick={handleExportCustomersCSV}
                            className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 text-center hover:border-[#2C5E3B]/40 transition-all cursor-pointer group shadow-sm"
                        >
                            <FileText size={22} className="mx-auto text-[#2C5E3B] dark:text-[#A9CBA2] mb-1.5" />
                            <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">Customer Registry</h5>
                            <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2 py-0.5 rounded-md inline-block mt-2">Export CSV</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-[32px] p-6 lg:p-8">
                <h3 className="text-base font-black text-red-800 dark:text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle size={18} /> Danger Zone: Factory Reset
                </h3>
                <p className="text-xs text-red-900/80 dark:text-red-300 mb-4 pb-3 border-b border-red-200 dark:border-red-900/20">
                    Irreversible administrative operation. Requires explicit authorization.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h5 className="font-black text-xs text-[#1E3F27] dark:text-white">Purge System Data</h5>
                        <p className="text-[11px] text-stone-500 dark:text-gray-400">Restore factory baseline configuration and reset local cache.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
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
                                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFactoryResetConfirm}
                                disabled={confirmText !== 'RESET-SIIFMART'}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                            >
                                Confirm System Reset
                            </button>
                        </div>
                    )}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                            <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-red-900 dark:text-red-200 leading-relaxed">
                                <strong className="font-bold">Warning:</strong> This action cannot be undone. To prevent accidental resets, type <code className="font-mono font-bold bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded">RESET-SIIFMART</code> below.
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-600 dark:text-gray-400 uppercase tracking-wide block">Confirmation Code</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type RESET-SIIFMART"
                                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-red-600"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
