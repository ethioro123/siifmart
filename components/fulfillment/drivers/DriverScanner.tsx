import React from 'react';
import { X, QrCode } from 'lucide-react';
import { WMSJob } from '../../../types';

interface DriverScannerProps {
    setDriverScannerOpen: (val: boolean) => void;
    selectedJob: WMSJob | null;
    wmsJobsService: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    setSelectedJob: (job: WMSJob | null) => void;
}

export const DriverScanner: React.FC<DriverScannerProps> = ({
    setDriverScannerOpen,
    selectedJob,
    wmsJobsService,
    addNotification,
    refreshData,
    setSelectedJob
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 bg-opacity-95 backdrop-blur-xl">
            <button
                onClick={() => setDriverScannerOpen(false)}
                title="Close Scanner"
                className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
                <X size={32} />
            </button>

            <div className="w-full max-w-lg space-y-8 text-center">
                <div className="relative inline-block">
                    <div className="absolute-inset-4 bg-cyan-500/20 blur-xl animate-pulse rounded-full" />
                    <div className="w-64 h-64 border-2 border-dashed border-cyan-500/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2s_infinite]" />
                        <QrCode size={120} className="text-cyan-400 opacity-20" />
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ready to Scan</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Scan QR code to complete delivery</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={async () => {
                            if (selectedJob) {
                                try {
                                    if (selectedJob.status === 'Completed') {
                                        addNotification('info', 'Job already finalized.');
                                        return;
                                    }
                                    await wmsJobsService.update(selectedJob.id, {
                                        transferStatus: 'Delivered',
                                        deliveredAt: new Date().toISOString()
                                    } as any);
                                    addNotification('success', 'Job Completed Successfully.');
                                    await refreshData();
                                } catch (err) {
                                    addNotification('alert', 'Error completing delivery.');
                                }
                            }
                            setDriverScannerOpen(false);
                            setSelectedJob(null);
                        }}
                        className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition-all active:scale-95"
                    >
                        Complete Delivery
                    </button>
                    <button
                        onClick={() => setDriverScannerOpen(false)}
                        className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                        Abort Scan
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(256px); }
                    100% { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
