import React from 'react';
import { X, QrCode } from 'lucide-react';
import { WMSJob } from '../../../types';

interface DriverScannerProps {
    t: (key: string) => string;
    setDriverScannerOpen: (val: boolean) => void;
    selectedJob: WMSJob | null;
    wmsJobsService: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    setSelectedJob: (job: WMSJob | null) => void;
}

export const DriverScanner: React.FC<DriverScannerProps> = ({
    t,
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
                title={t('warehouse.misc.closeScanner')}
                className="absolute top-4 right-4 sm:top-10 sm:right-10 p-2.5 sm:p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shrink-0"
            >
                <X size={20} className="sm:w-[32px] sm:h-[32px]" />
            </button>
 
            <div className="w-full max-w-lg space-y-6 sm:space-y-8 text-center">
                <div className="relative inline-block">
                    <div className="absolute-inset-4 bg-[#2C5E3B]/20 blur-xl animate-pulse rounded-full" />
                    <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 border-2 border-dashed border-[#A9CBA2]/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                         <div className="absolute left-0 w-full h-1 bg-[#A9CBA2]/50 shadow-[0_0_15px_rgba(169,203,162,0.8)] animate-[scan_2s_infinite]" />
                        <QrCode className="text-[#A9CBA2] opacity-20 w-24 h-24 sm:w-[120px] sm:h-[120px]" />
                    </div>
                </div>
 
                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">{t('warehouse.driverHub.readyToScan')}</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-2">{t('warehouse.driverHub.scanPrompt')}</p>
                </div>
 
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <button
                        onClick={async () => {
                            if (selectedJob) {
                                try {
                                    if (selectedJob.status === 'Completed') {
                                        addNotification('info', t('warehouse.driverHub.jobAlreadyFinalized'));
                                        return;
                                    }
                                    await wmsJobsService.update(selectedJob.id, {
                                        transferStatus: 'Delivered',
                                        deliveredAt: new Date().toISOString()
                                    } as any);
                                    addNotification('success', t('warehouse.driverHub.jobCompletedSuccess'));
                                    await refreshData();
                                } catch (err) {
                                    addNotification('alert', t('warehouse.driverHub.errorCompleting'));
                                }
                            }
                            setDriverScannerOpen(false);
                            setSelectedJob(null);
                        }}
                        className="w-full py-3.5 sm:py-4 bg-[#2C5E3B] text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(44,94,59,0.4)] hover:bg-[#3a7a4d] transition-all active:scale-95 text-xs sm:text-sm"
                    >
                        {t('warehouse.driverHub.completeDeliveryBtn')}
                    </button>
                    <button
                        onClick={() => setDriverScannerOpen(false)}
                        className="w-full py-3.5 sm:py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-xs sm:text-sm"
                    >
                        {t('warehouse.driverHub.abortScan')}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
            `}</style>
        </div>
    );
};
