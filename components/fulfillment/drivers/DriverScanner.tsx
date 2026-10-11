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
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 overflow-x-hidden">
            <button
                onClick={() => setDriverScannerOpen(false)}
                title={t('warehouse.misc.closeScanner')}
                className="absolute top-4 right-4 sm:top-10 sm:right-10 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0 touch-manipulation"
            >
                <X size={22} />
            </button>
 
            <div className="w-full max-w-lg space-y-6 sm:space-y-8 text-center">
                <div className="relative inline-block">
                    <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 border-2 border-dashed border-primary/50 rounded-3xl flex items-center justify-center relative overflow-hidden bg-black/40">
                        <div className="absolute left-0 w-full h-1 bg-primary/70 animate-[scan_2s_infinite]" />
                        <QrCode className="text-primary opacity-20 w-24 h-24 sm:w-[120px] sm:h-[120px]" />
                    </div>
                </div>
 
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('warehouse.driverHub.readyToScan')}</h3>
                    <p className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] sm:text-xs mt-2">{t('warehouse.driverHub.scanPrompt')}</p>
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
                        className="w-full min-h-[48px] py-3.5 sm:py-4 bg-primary text-white font-bold uppercase tracking-wider rounded-2xl hover:opacity-90 transition-all active:scale-[0.99] text-xs sm:text-sm shadow-xs touch-manipulation cursor-pointer"
                    >
                        {t('warehouse.driverHub.completeDeliveryBtn')}
                    </button>
                    <button
                        onClick={() => setDriverScannerOpen(false)}
                        className="w-full min-h-[48px] py-3.5 sm:py-4 bg-white/5 text-white font-semibold uppercase tracking-wider rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-xs sm:text-sm touch-manipulation"
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
