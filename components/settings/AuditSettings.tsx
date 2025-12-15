import React, { useState } from 'react';
import {
    FileText, Search, Filter, Download, Calendar, User, Activity, AlertCircle
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

export default function AuditSettings() {
    const { systemLogs } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');

    // Filter logs
    const filteredLogs = (systemLogs || []).filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'success': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* HEADER BANNER */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                <FileText className="text-indigo-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-indigo-400 font-bold text-sm">System Audit Log</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Comprehensive record of system events, user actions, and error reports.
                    </p>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">

                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search logs by message or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-cyber-primary outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            aria-label="Filter Logs by Level"
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                        >
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                            <option value="success">Success</option>
                        </select>
                        <button className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors">
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* LOG TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Timestamp</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Level</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Message</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.length > 0 ? filteredLogs.map((log: any, i) => (
                                <tr key={log.id || i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getLevelColor(log.level)}`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-white max-w-md truncate" title={log.message}>
                                        {log.message}
                                    </td>
                                    <td className="p-4 text-xs text-gray-300 flex items-center gap-2">
                                        <User size={12} className="text-gray-500" />
                                        {log.user || 'System'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                                        No logs found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
