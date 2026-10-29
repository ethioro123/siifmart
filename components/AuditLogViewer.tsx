import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    Info,
    FileText,
    Search,
    Filter,
    Download,
    Clock,
    User,
    Activity
} from 'lucide-react';
import { systemLogsService, LogEntry, LogCategory, LogSeverity } from '../services/local-logs.service';
import { formatDateTime } from '../utils/formatting';
import { authService } from '../services/auth.service';

export const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'ALL'>('ALL');
    const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    useEffect(() => {
        loadLogs();
        // Refresh logs every 30 seconds
        const interval = setInterval(loadLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterLogs();
    }, [logs, categoryFilter, severityFilter, searchTerm]);

    const loadLogs = () => {
        const allLogs = systemLogsService.getLogs();
        setLogs(allLogs);
    };

    const filterLogs = () => {
        let result = logs;

        if (categoryFilter !== 'ALL') {
            result = result.filter(log => log.category === categoryFilter);
        }

        if (severityFilter !== 'ALL') {
            result = result.filter(log => log.severity === severityFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(log =>
                log.action.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term) ||
                log.userName.toLowerCase().includes(term) ||
                log.userId.toLowerCase().includes(term)
            );
        }

        setFilteredLogs(result);
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Timestamp,Category,Severity,Action,User,Details\n"
            + filteredLogs.map(log =>
                `${log.timestamp},${log.category},${log.severity},${log.action},${log.userName},"${log.details.replace(/"/g, '""')}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Log the export action
        authService.logSecurityEvent('DATA_EXPORT', 'Exported audit logs to CSV', 'WARNING');
    };

    const getSeverityColor = (severity: LogSeverity) => {
        switch (severity) {
            case 'CRITICAL':
            case 'ERROR':
                return 'badge-status-danger';
            case 'WARNING':
                return 'badge-status-warning';
            case 'INFO':
                return 'badge-status-info';
            default:
                return 'badge-status-neutral';
        }
    };

    const getCategoryIcon = (category: LogCategory) => {
        switch (category) {
            case 'SECURITY': return <Shield size={16} />;
            case 'FINANCE': return <Activity size={16} />;
            case 'HR': return <User size={16} />;
            case 'SYSTEM': return <AlertTriangle size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-[var(--shadow-sm)] p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <Shield className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                        Security Audit Logs
                    </h2>
                    <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm mt-1">
                        Monitoring system access, security events, and policy violations.
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card-hover)] transition-all font-semibold text-xs cursor-pointer shadow-xs shrink-0"
                >
                    <Download size={15} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-9 pr-3.5 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] placeholder:[var(--theme-text-muted)] focus:border-[var(--theme-border-focus)] dark:focus:border-[var(--theme-border-focus)] outline-none transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                    <select
                        aria-label="Filter by Category"
                        className="w-full pl-9 pr-4 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] dark:focus:border-[var(--theme-border-focus)] outline-none transition-colors appearance-none cursor-pointer"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Categories</option>
                        <option value="SECURITY">Security</option>
                        <option value="FINANCE">Finance</option>
                        <option value="HR">HR</option>
                        <option value="OPERATIONS">Operations</option>
                        <option value="SYSTEM">System</option>
                    </select>
                </div>

                <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                    <select
                        aria-label="Filter by Severity"
                        className="w-full pl-9 pr-4 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] dark:focus:border-[var(--theme-border-focus)] outline-none transition-colors appearance-none cursor-pointer"
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Severities</option>
                        <option value="INFO">Info</option>
                        <option value="WARNING">Warning</option>
                        <option value="ERROR">Error</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>

                <div className="flex items-center justify-end text-xs text-[var(--theme-text-secondary)] font-mono">
                    Showing {filteredLogs.length} events
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border border-[var(--theme-border)] rounded-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider border-b border-[var(--theme-border)]">
                            <th className="p-3.5">Timestamp</th>
                            <th className="p-3.5">Severity</th>
                            <th className="p-3.5">Category</th>
                            <th className="p-3.5">Action</th>
                            <th className="p-3.5">User</th>
                            <th className="p-3.5">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-xs text-[var(--theme-text-muted)] font-medium">
                                    No logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-[var(--theme-table-row-hover)] cursor-pointer transition-colors"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <td className="p-3.5 text-xs text-[var(--theme-text-secondary)] font-mono whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-[var(--theme-text-muted)]" />
                                            {formatDateTime(log.timestamp, { showTime: true })}
                                        </div>
                                    </td>
                                    <td className="p-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getSeverityColor(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-primary)] font-medium">
                                            {getCategoryIcon(log.category)}
                                            {log.category}
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-xs font-semibold text-[var(--theme-text-primary)]">
                                        {log.action}
                                    </td>
                                    <td className="p-3.5 text-xs text-[var(--theme-text-secondary)]">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-[var(--theme-text-primary)]">{log.userName}</span>
                                            <span className="text-[11px] text-[var(--theme-text-muted)]">{log.userRole}</span>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-xs text-[var(--theme-text-secondary)] max-w-xs truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-3xl shadow-[var(--shadow-modal)] max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                                <Info className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={18} />
                                Log Details
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xl leading-none cursor-pointer"
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase block mb-0.5">Timestamp</span>
                                    <span className="text-xs font-mono font-medium text-[var(--theme-text-primary)]">{formatDateTime(selectedLog.timestamp, { showTime: true })}</span>
                                </div>
                                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase block mb-0.5">Log Reference</span>
                                    <span className="text-xs font-mono text-[var(--theme-text-secondary)]">LR-{selectedLog.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className={`flex-1 p-3 rounded-xl ${getSeverityColor(selectedLog.severity)}`}>
                                    <span className="text-[10px] font-semibold uppercase block mb-0.5">Severity</span>
                                    <span className="font-bold text-xs">{selectedLog.severity}</span>
                                </div>
                                <div className="flex-1 p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[10px] font-semibold text-[var(--theme-text-muted)] uppercase block mb-0.5">Category</span>
                                    <span className="font-bold text-xs text-[var(--theme-text-primary)]">{selectedLog.category}</span>
                                </div>
                            </div>

                            <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase block mb-1.5">User Information</span>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-xs text-[var(--theme-text-primary)]">{selectedLog.userName}</div>
                                        <div className="text-[11px] font-mono text-[var(--theme-text-muted)]">UID-{selectedLog.userId.substring(0, 8).toUpperCase()}</div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg text-xs font-semibold text-[var(--theme-text-secondary)]">
                                        {selectedLog.userRole}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase block mb-1.5">Event Details</span>
                                <div className="p-3.5 bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl font-mono text-xs whitespace-pre-wrap">
                                    {selectedLog.details}
                                </div>
                            </div>

                            {selectedLog.metadata && (
                                <div>
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase block mb-1.5">Metadata</span>
                                    <pre className="p-3.5 bg-[var(--theme-bg-app)] text-[var(--theme-text-secondary)] rounded-xl text-xs overflow-auto border border-[var(--theme-border)]">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-xl font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
