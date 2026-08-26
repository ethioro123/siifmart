import React, { useState, useMemo } from 'react';
import {
    FileText, Search, Download, User, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { formatDateTime } from '../../utils/formatting';

export default function AuditSettings() {
    const { systemLogs, employees, sites, products } = useData();
    const { showToast } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 25;

    // Lookup map of employee UUID -> Staff Name
    const employeeMap = useMemo(() => {
        const map = new Map<string, string>();
        (employees || []).forEach(emp => {
            if (emp.id && emp.name) {
                map.set(emp.id.toLowerCase(), emp.name);
            }
        });
        return map;
    }, [employees]);

    // Lookup map of site UUID -> Site Name
    const siteMap = useMemo(() => {
        const map = new Map<string, string>();
        (sites || []).forEach(site => {
            if (site.id && site.name) {
                map.set(site.id.toLowerCase(), site.name);
            }
        });
        return map;
    }, [sites]);

    // Lookup map of product UUID -> Product Name
    const productMap = useMemo(() => {
        const map = new Map<string, string>();
        (products || []).forEach(prod => {
            if (prod.id && prod.name) {
                map.set(prod.id.toLowerCase(), prod.name);
            }
        });
        return map;
    }, [products]);

    const resolveStaffName = (userNameOrId: string | undefined): string => {
        if (!userNameOrId) return 'System Automation';
        const cleaned = userNameOrId.trim();
        const mapped = employeeMap.get(cleaned.toLowerCase());
        if (mapped) return mapped;
        return cleaned;
    };

    const resolveDetailsText = (details: string | undefined): string => {
        if (!details) return '';
        let text = details;

        // 1. Resolve site UUIDs (e.g. "created in site 3f957b9b-..." -> "created in site Bole Store")
        siteMap.forEach((name, id) => {
            if (text.toLowerCase().includes(id)) {
                const regex = new RegExp(id, 'gi');
                text = text.replace(regex, `"${name}"`);
            }
        });

        // 2. Resolve product UUIDs (e.g. "OUT 20 for 9dcbf522-..." -> "OUT 20 for Mbala Cake:")
        productMap.forEach((name, id) => {
            if (text.toLowerCase().includes(id)) {
                const regex = new RegExp(id, 'gi');
                text = text.replace(regex, `"${name}"`);
            }
        });

        // 3. Resolve employee UUIDs
        employeeMap.forEach((name, id) => {
            if (text.toLowerCase().includes(id)) {
                const regex = new RegExp(id, 'gi');
                text = text.replace(regex, name);
            }
        });

        return text;
    };

    // Filter logs safely with human-readable staff names and descriptions
    const filteredLogs = useMemo(() => {
        return (systemLogs || []).map(log => {
            const resolvedName = resolveStaffName(log.user_name);
            const resolvedDetails = resolveDetailsText(log.details);
            return {
                ...log,
                resolvedName,
                resolvedDetails
            };
        }).filter(log => {
            const detailsStr = log.resolvedDetails || '';
            const userNameStr = log.resolvedName || '';
            const matchesSearch = detailsStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                userNameStr.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLevel = filterLevel === 'all' || (log.module || '').toLowerCase() === filterLevel.toLowerCase();
            return matchesSearch && matchesLevel;
        });
    }, [systemLogs, employeeMap, siteMap, productMap, searchTerm, filterLevel]);

    // Pagination calculations
    const totalItems = filteredLogs.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // Reset to page 1 if current page is out of bounds
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedLogs = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
        return filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filteredLogs, safeCurrentPage]);

    const getLevelBadge = (module: string) => {
        switch ((module || '').toLowerCase()) {
            case 'system':
                return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
            case 'compliance':
            case 'security':
                return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
            case 'inventory':
            case 'wms':
                return 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30';
            case 'hr':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/30';
            case 'finance':
            case 'pos':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
            default:
                return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
        }
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Timestamp,Module,Message,User\n"
            + filteredLogs.map(log =>
                `"${log.created_at || ''}","${log.module || ''}","${(log.resolvedDetails || '').replace(/"/g, '""')}","${log.resolvedName || 'System'}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported audit logs to CSV', 'success');
    };

    const startIndex = totalItems > 0 ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;
    const endIndex = Math.min(safeCurrentPage * PAGE_SIZE, totalItems);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <FileText className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">System Audit Log</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Comprehensive record of system events, security logins, shift events, and transaction history.
                    </p>
                </div>
            </div>

            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">

                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search logs by message, product, site, or staff member..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-medium focus:border-[#2C5E3B] outline-none transition-all placeholder:text-stone-400"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={filterLevel}
                            onChange={(e) => {
                                setFilterLevel(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter Logs by Module"
                            className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none cursor-pointer focus:border-[#2C5E3B]"
                        >
                            <option value="all">All Modules</option>
                            <option value="Security">Security</option>
                            <option value="HR">HR & Shift</option>
                            <option value="Inventory">Inventory / WMS</option>
                            <option value="POS">Retail & POS</option>
                            <option value="Finance">Finance</option>
                            <option value="System">System Engine</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="bg-[#2C5E3B] hover:opacity-90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* LOG TABLE */}
                <div className="overflow-x-auto border border-[#E2DCCE]/60 dark:border-white/5 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5] dark:bg-black/40">
                                <th className="p-3.5 text-[10px] font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                                <th className="p-3.5 text-[10px] font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                                <th className="p-3.5 text-[10px] font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">Event Details</th>
                                <th className="p-3.5 text-[10px] font-black text-stone-500 dark:text-gray-400 uppercase tracking-wider">Staff / Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5 bg-white dark:bg-transparent">
                            {paginatedLogs.length > 0 ? paginatedLogs.map((log: any, i) => (
                                <tr key={log.id || i} className="hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition-colors">
                                    <td className="p-3.5 text-xs text-stone-600 dark:text-gray-400 font-mono whitespace-nowrap">
                                        {formatDateTime(log.created_at, { showTime: true })}
                                    </td>
                                    <td className="p-3.5 whitespace-nowrap">
                                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${getLevelBadge(log.module)}`}>
                                            {log.module || 'System'}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-xs font-bold text-[#1E3F27] dark:text-stone-200 max-w-md truncate" title={log.resolvedDetails}>
                                        {log.resolvedDetails}
                                    </td>
                                    <td className="p-3.5 text-xs text-stone-600 dark:text-gray-300 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <User size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                            <span className="truncate max-w-[150px]">{log.resolvedName}</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-stone-400 dark:text-gray-500 text-xs font-medium">
                                        No logs found matching search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS (LIMITED TO 25) */}
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5">
                        <div className="text-xs text-stone-500 dark:text-gray-400 font-medium">
                            Showing <strong className="text-[#1E3F27] dark:text-white font-bold">{startIndex}</strong> to <strong className="text-[#1E3F27] dark:text-white font-bold">{endIndex}</strong> of <strong className="text-[#1E3F27] dark:text-white font-bold">{totalItems}</strong> audit logs
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={safeCurrentPage === 1}
                                className="px-3.5 py-1.5 rounded-xl border border-[#E2DCCE] dark:border-white/10 text-xs font-bold text-stone-700 dark:text-gray-200 hover:bg-[#FAF8F5] dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>

                            <div className="flex items-center gap-1 px-2">
                                <span className="text-xs font-bold text-[#1E3F27] dark:text-white">
                                    Page {safeCurrentPage} of {totalPages}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safeCurrentPage >= totalPages}
                                className="px-3.5 py-1.5 rounded-xl border border-[#E2DCCE] dark:border-white/10 text-xs font-bold text-stone-700 dark:text-gray-200 hover:bg-[#FAF8F5] dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
