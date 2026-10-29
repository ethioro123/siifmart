import React, { useState, useMemo } from 'react';
import {
    FileText, Search, Download, User, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { formatDateTime } from '../../utils/formatting';
import { SystemLog } from '../../types/infrastructure';
import { Country, getCountryProfile } from '../../utils/localization';

interface ResolvedSystemLog extends SystemLog {
    resolvedName: string;
    resolvedDetails: string;
}

export default function AuditSettings() {
    const { systemLogs, employees, sites, products, settings, effectiveCountry } = useData();
    const { showToast } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 25;

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

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

        // 1. Resolve site UUIDs
        siteMap.forEach((name, id) => {
            if (text.toLowerCase().includes(id)) {
                const regex = new RegExp(id, 'gi');
                text = text.replace(regex, `"${name}"`);
            }
        });

        // 2. Resolve product UUIDs
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
    const filteredLogs: ResolvedSystemLog[] = useMemo(() => {
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
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedLogs = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
        return filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filteredLogs, safeCurrentPage]);

    const getLevelBadge = (module: string) => {
        switch ((module || '').toLowerCase()) {
            case 'system':
                return 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]';
            case 'compliance':
            case 'security':
                return 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]';
            case 'inventory':
            case 'wms':
                return 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]';
            case 'hr':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'finance':
            case 'pos':
                return 'bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border-[var(--theme-status-info-border)]';
            default:
                return 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]';
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
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">System Audit Log</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] flex items-center gap-1">
                            <ShieldCheck size={11} /> Immutable Ledger
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {countryProfile.name} ({activeCountry})
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Comprehensive immutable record of supervisory events, security logins, shift handovers, and system mutations.
                    </p>
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs space-y-5">

                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={15} />
                        <input
                            type="text"
                            placeholder="Search logs by message, product, site, or staff member..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] outline-none transition-colors font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            value={filterLevel}
                            onChange={(e) => {
                                setFilterLevel(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter Logs by Module"
                            className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-semibold outline-none cursor-pointer focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors"
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
                            className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* LOG TABLE */}
                <div className="overflow-x-auto border border-[var(--theme-border)] rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                                <th className="p-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Timestamp</th>
                                <th className="p-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Module</th>
                                <th className="p-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Event Details</th>
                                <th className="p-3 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Staff / Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {paginatedLogs.length > 0 ? paginatedLogs.map((log, i) => (
                                <tr key={log.id || i} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                    <td className="p-3 text-xs text-[var(--theme-text-secondary)] font-mono whitespace-nowrap">
                                        {formatDateTime(log.created_at, { showTime: true })}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getLevelBadge(log.module)}`}>
                                            {log.module || 'System'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs font-medium text-[var(--theme-text-primary)] max-w-md truncate" title={log.resolvedDetails}>
                                        {log.resolvedDetails}
                                    </td>
                                    <td className="p-3 text-xs text-[var(--theme-text-secondary)] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <User size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                                            <span className="truncate max-w-[150px]">{log.resolvedName}</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-[var(--theme-text-secondary)] text-xs font-medium">
                                        No audit records found matching search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS (LIMITED TO 25) */}
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[var(--theme-border)]">
                        <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Showing <strong className="text-[var(--theme-text-primary)] font-semibold">{startIndex}</strong> to <strong className="text-[var(--theme-text-primary)] font-semibold">{endIndex}</strong> of <strong className="text-[var(--theme-text-primary)] font-semibold">{totalItems}</strong> audit logs
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={safeCurrentPage === 1}
                                className="h-8 px-3 rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>

                            <div className="flex items-center gap-1 px-2">
                                <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                    Page {safeCurrentPage} of {totalPages}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safeCurrentPage >= totalPages}
                                className="h-8 px-3 rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
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
