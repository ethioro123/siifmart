import React, { useState } from 'react';
import {
    Database, Upload, Download, RefreshCw, AlertTriangle, FileText, Trash2, Calendar, ChevronDown
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { generateQuarterlyReport } from '../../utils/reportGenerator';

export default function DataSettings() {
    const { showToast } = useStore();
    const { allOrders, allSales, expenses } = useData();

    // Archive State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState('Full Year');
    const [selectedReportType, setSelectedReportType] = useState<'Operations' | 'Financials' | 'Procurement'>('Financials');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRetrieveReport = () => {
        setIsGenerating(true);
        setTimeout(() => {
            try {
                // 1. Determine Date Range
                const start = new Date(selectedYear, 0, 1);
                const end = new Date(selectedYear, 11, 31);

                if (selectedPeriod.startsWith('Q')) {
                    const q = parseInt(selectedPeriod.charAt(1));
                    start.setMonth((q - 1) * 3);
                    end.setMonth(q * 3, 0); // Last day of previous month = last day of quarter
                }

                // Set to End of Day to ensure we capture all transactions on the last day
                end.setHours(23, 59, 59, 999);

                // 2. Filter Data
                const isWithin = (dateStr: string) => {
                    if (!dateStr) return false;
                    const d = new Date(dateStr);
                    return d >= start && d <= end;
                };

                let reportMetrics = {};
                let label = `${selectedPeriod} ${selectedYear}`;

                if (selectedReportType === 'Financials') {
                    // Filter Sales
                    const filteredSales = allSales.filter(s => isWithin(s.date));
                    const filteredExpenses = expenses.filter(e => isWithin(e.date));

                    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
                    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const netProfit = totalRevenue - totalExpenses;
                    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';

                    reportMetrics = {
                        totalRevenue,
                        totalExpenses,
                        netProfit,
                        profitMargin
                    };

                } else if (selectedReportType === 'Procurement') {
                    const filteredOrders = allOrders.filter(o => isWithin(o.date));
                    const totalSpend = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const openPO = filteredOrders.filter(o => o.status === 'Pending').length;

                    reportMetrics = {
                        totalSpend,
                        openPO,
                        pendingValue: 0 // Simplified for archive
                    };

                } else {
                    // Operations (Sales only)
                    const filteredSales = allSales.filter(s => isWithin(s.date));
                    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
                    const txCount = filteredSales.length;

                    reportMetrics = {
                        totalRevenue,
                        transactionCount: txCount,
                        avgTicket: txCount > 0 ? (totalRevenue / txCount) : 0
                    };
                }

                // Check if we actually found data
                const hasData = Object.values(reportMetrics).some(val => val !== 0 && val !== '0%' && val !== '0');

                generateQuarterlyReport(reportMetrics, label, selectedReportType);

                if (hasData) {
                    showToast(`Retrieved ${label} ${selectedReportType} Report`, 'success');
                } else {
                    showToast(`Report generated, but no data found for ${label}`, 'warning');
                }

            } catch (err) {
                console.error(err);
                showToast('Failed to retrieve archive data', 'error');
            } finally {
                setIsGenerating(false);
            }
        }, 1000); // Simulate network fetch/processing
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Database className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-blue-400 font-bold text-sm">Data Management Center</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Handle backups, bulk import/export operations, and system resets.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- REPORTS ARCHIVE (NEW) --- */}
                <div className="md:col-span-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-blue-400" />
                                Reports Archive
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Access historical financial and operational records from previous years.
                            </p>
                        </div>
                        <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                            SECURE STORAGE
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
                        {/* Year Selector */}
                        <div>
                            <label className="text-xs text-gray-400 font-bold mb-2 block uppercase">Fiscal Year</label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                    aria-label="Select Fiscal Year"
                                >
                                    {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div>
                            <label className="text-xs text-gray-400 font-bold mb-2 block uppercase">Period</label>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                    aria-label="Select Period"
                                >
                                    {['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Full Year'].map(p => (
                                        <option key={p} value={p.split(' ')[0]}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Type Selector */}
                        <div>
                            <label className="text-xs text-gray-400 font-bold mb-2 block uppercase">Report Type</label>
                            <div className="relative">
                                <select
                                    value={selectedReportType}
                                    onChange={(e) => setSelectedReportType(e.target.value as 'Operations' | 'Financials' | 'Procurement')}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                    aria-label="Select Report Type"
                                >
                                    {['Financials', 'Procurement', 'Operations'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Retrieve Button */}
                        <div>
                            <button
                                onClick={handleRetrieveReport}
                                disabled={isGenerating}
                                className="w-full bg-blue-500/80 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <RefreshCw className="animate-spin" size={18} />
                                ) : (
                                    <Download size={18} />
                                )}
                                {isGenerating ? 'Retrieving...' : 'Retrieve Data'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* BACKUP & RESTORE */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Backup & Recovery</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                                <h5 className="font-bold text-white text-sm">Create Backup</h5>
                                <p className="text-xs text-gray-500">Manual snapshot of current state</p>
                            </div>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center gap-2">
                                <Download size={14} /> Download
                            </button>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                                <h5 className="font-bold text-white text-sm">Restore from File</h5>
                                <p className="text-xs text-gray-500">Upload .json or .zip backup</p>
                            </div>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center gap-2">
                                <Upload size={14} /> Upload
                            </button>
                        </div>
                    </div>
                </div>

                {/* IMPORT / EXPORT */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Bulk Operations</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                            <FileText size={24} className="mx-auto text-gray-500 mb-2 group-hover:text-cyber-primary" />
                            <h5 className="font-bold text-white text-sm">Products</h5>
                            <div className="flex gap-2 justify-center mt-3">
                                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">CSV</span>
                            </div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                            <FileText size={24} className="mx-auto text-gray-500 mb-2 group-hover:text-cyber-primary" />
                            <h5 className="font-bold text-white text-sm">Customers</h5>
                            <div className="flex gap-2 justify-center mt-3">
                                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">CSV</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} /> Danger Zone
                </h3>
                <p className="text-xs text-gray-400 mb-6 border-b border-red-500/20 pb-4">
                    Irreversible actions. Please proceed with caution.
                </p>

                <div className="flex items-center justify-between">
                    <div>
                        <h5 className="font-bold text-white text-sm">Factory Reset</h5>
                        <p className="text-xs text-gray-500">Wipe all data and restore default settings</p>
                    </div>
                    <button
                        onClick={() => showToast('Reset feature locked for safety', 'error')}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-lg text-xs font-bold transition-colors border border-red-500/20 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Reset System
                    </button>
                </div>
            </div>
        </div>
    );
}
