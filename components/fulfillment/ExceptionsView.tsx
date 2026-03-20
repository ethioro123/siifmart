
import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, RefreshCw, Loader2, CheckCircle, Package
} from 'lucide-react';
import { User, WMSJob } from '../../types';
import { wmsJobsService } from '../../services/supabase.service';
import Button from '../../components/shared/Button';

interface ExceptionsViewProps {
    currentUser: User | null;
    activeSite: any;
    onResolve: (job: WMSJob, item: any, index: number) => void;
}

export function ExceptionsView({ currentUser, activeSite, onResolve }: ExceptionsViewProps) {
    const [loading, setLoading] = useState(true);
    const [discrepancies, setDiscrepancies] = useState<{ job: WMSJob, item: any, index: number }[]>([]);

    const loadData = async () => {
        if (!activeSite?.id) return;
        setLoading(true);
        try {
            const jobs = await wmsJobsService.getDiscrepancies(activeSite.id);
            const flatItems: any[] = [];
            jobs.forEach(job => {
                (job.lineItems || []).forEach((item: any, index: number) => {
                    if (item.status === 'Discrepancy') {
                        flatItems.push({ job, item, index });
                    }
                });
            });
            flatItems.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());
            setDiscrepancies(flatItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeSite?.id]);

    return (
        <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in bg-black/80">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        Exception Management
                    </h2>
                    <p className="text-gray-400">Resolve outstanding inventory discrepancies across all operations.</p>
                </div>
                <Button onClick={loadData} variant="secondary"><RefreshCw size={16} className="mr-2" /> Refresh</Button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyber-primary" size={48} />
                </div>
            ) : discrepancies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <CheckCircle size={64} className="mb-4 text-green-500/50" />
                    <p className="text-xl font-bold">All Clear</p>
                    <p>No open discrepancies found.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-black/40 border border-white/10 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Job Ref</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Variance</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discrepancies.map((d, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm text-gray-400">
                                        {new Date(d.job.createdAt || '').toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-bold text-white">{d.job.jobNumber || d.job.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-500">{d.job.type}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-black flex items-center justify-center overflow-hidden border border-white/10">
                                                {d.item.image && !d.item.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={d.item.image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={14} className="text-gray-700" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white font-medium">{d.item.productName || d.item.name}</div>
                                                <div className="text-xs text-gray-500">{d.item.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
                                            ACTION REQ
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400">Exp: {d.item.expectedQty}</span>
                                            <span className="text-yellow-400">Rec: {d.item.receivedQty || 0}</span>
                                            <span className="text-red-500 font-bold border-t border-white/10 pt-1 mt-1">
                                                Leaf: {(d.item.receivedQty || 0) - (d.item.expectedQty || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => onResolve(d.job, d.item, d.index)}
                                            className="px-4 py-2 bg-cyber-primary text-black font-bold text-xs rounded hover:bg-cyber-primary/90 transition-colors uppercase tracking-wider shadow-lg shadow-cyber-primary/20"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
