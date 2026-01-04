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
import { systemLogsService, LogEntry, LogCategory, LogSeverity } from '../services/systemLogs.service';
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
            case 'CRITICAL': return 'text-red-600 bg-red-100';
            case 'ERROR': return 'text-red-500 bg-red-50';
            case 'WARNING': return 'text-orange-500 bg-orange-50';
            case 'INFO': return 'text-blue-500 bg-blue-50';
            default: return 'text-gray-500 bg-gray-50';
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
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-blue-600" />
                        Security Audit Logs
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Monitoring system access, security events, and policy violations.
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        aria-label="Filter by Category"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
                    <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        aria-label="Filter by Severity"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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

                <div className="flex items-center justify-end text-sm text-gray-500">
                    Showing {filteredLogs.length} events
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                            <th className="p-4 border-b">Timestamp</th>
                            <th className="p-4 border-b">Severity</th>
                            <th className="p-4 border-b">Category</th>
                            <th className="p-4 border-b">Action</th>
                            <th className="p-4 border-b">User</th>
                            <th className="p-4 border-b">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            {formatDateTime(log.timestamp, { showTime: true })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            {getCategoryIcon(log.category)}
                                            {log.category}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-gray-800">
                                        {log.action}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.userName}</span>
                                            <span className="text-xs text-gray-400">{log.userRole}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Info className="text-blue-600" />
                                Log Details
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Timestamp</span>
                                    <span className="text-sm font-medium">{formatDateTime(selectedLog.timestamp, { showTime: true })}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Log Reference</span>
                                    <span className="text-sm font-mono text-gray-600">LR-{selectedLog.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className={`flex-1 p-3 rounded-lg border ${getSeverityColor(selectedLog.severity)} border-opacity-20`}>
                                    <span className="text-xs opacity-70 uppercase block mb-1">Severity</span>
                                    <span className="font-bold">{selectedLog.severity}</span>
                                </div>
                                <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Category</span>
                                    <span className="font-bold text-gray-700">{selectedLog.category}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-xs text-gray-500 uppercase block mb-2">User Information</span>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-gray-900">{selectedLog.userName}</div>
                                        <div className="text-sm text-gray-500">UID-{selectedLog.userId.substring(0, 8).toUpperCase()}</div>
                                    </div>
                                    <span className="px-3 py-1 bg-white border rounded text-sm font-medium text-gray-600">
                                        {selectedLog.userRole}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-gray-500 uppercase block mb-2">Event Details</span>
                                <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap">
                                    {selectedLog.details}
                                </div>
                            </div>

                            {selectedLog.metadata && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase block mb-2">Metadata</span>
                                    <pre className="p-4 bg-gray-50 rounded-lg text-xs overflow-auto border border-gray-200">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
