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
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-6 overflow-x-hidden animate-in fade-in duration-200">
            <button
                onClick={() => setDriverScannerOpen(false)}
                title={t('warehouse.misc.closeScanner')}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0 touch-manipulation"
            >
                <X size={20} />
            </button>
 
            <div className="w-full max-w-sm space-y-6 text-center">
                <div className="relative inline-block">
                    <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-dashed border-[var(--theme-primary)]/50 rounded-3xl flex items-center justify-center relative overflow-hidden bg-black/40">
                        <div className="absolute left-0 w-full h-1 bg-[var(--theme-primary)]/80 animate-[scan_2s_infinite]" />
                        <QrCode className="text-[var(--theme-primary)] opacity-20 w-24 h-24 sm:w-28 sm:h-28" />
                    </div>
                </div>
 
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('warehouse.driverHub.readyToScan')}</h3>
                    <p className="text-gray-300 text-xs mt-1.5">{t('warehouse.driverHub.scanPrompt')}</p>
                </div>
 
                <div className="grid grid-cols-1 gap-2.5">
                    <button
                        onClick={async () => {
                            if (selectedJob) {
                                try {
                                    if (selectedJob.status === 'Completed') {
                                        addNotification('info', t('warehouse.driverHub.jobAlreadyFinalized'));
                                        return;
                                    }
                                    const timestamp = new Date().toISOString();
                                    await wmsJobsService.update(selectedJob.id, {
                                        transferStatus: 'Delivered',
                                        deliveredAt: timestamp
                                    } as any);

                                    // Ensure parent transfer job / record reflects Delivered status so POS receiving unlocks live
                                    if (selectedJob.orderRef) {
                                        try {
                                            await wmsJobsService.update(selectedJob.orderRef, {
                                                status: 'Pending',
                                                transferStatus: 'Delivered',
                                                deliveredAt: timestamp
                                            } as any);
                                        } catch {}

                                        try {
                                            const { transfersService } = await import('../../../services/transfers.service');
                                            await transfersService.update(selectedJob.orderRef, {
                                                transferStatus: 'Delivered',
                                                deliveredAt: timestamp
                                            });
                                        } catch {}
                                    }

                                    addNotification('success', t('warehouse.driverHub.jobCompletedSuccess'));
                                    await refreshData();
                                } catch (err) {
                                    addNotification('alert', t('warehouse.driverHub.errorCompleting'));
                                }
                            }
                            setDriverScannerOpen(false);
                            setSelectedJob(null);
                        }}
                        className="w-full min-h-[44px] py-3 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] text-xs sm:text-sm shadow-sm touch-manipulation cursor-pointer"
                    >
                        {t('warehouse.driverHub.completeDeliveryBtn')}
                    </button>
                    <button
                        onClick={() => setDriverScannerOpen(false)}
                        className="w-full min-h-[44px] py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/15 transition-colors text-xs sm:text-sm touch-manipulation"
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
