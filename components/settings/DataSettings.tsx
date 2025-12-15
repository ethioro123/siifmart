import React, { useState } from 'react';
import {
    Database, Upload, Download, RefreshCw, AlertTriangle, FileText, Trash2
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

export default function DataSettings() {
    const { showToast } = useStore();

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
