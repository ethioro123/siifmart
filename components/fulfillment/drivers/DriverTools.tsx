import React from 'react';
import { QrCode, AlertTriangle, FileText, LogOut, Scan } from 'lucide-react';

interface DriverToolsProps {
    t: (key: string) => string;
    setDriverScannerOpen: (val: boolean) => void;
    onIssue: () => void;
    onDocs: () => void;
    onEnd: () => void;
    addNotification: (type: string, message: string) => void;
}

export const DriverTools: React.FC<DriverToolsProps> = ({
    t,
    setDriverScannerOpen,
    onIssue,
    onDocs,
    onEnd,
    addNotification
}) => {
    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-2 flex items-center justify-between gap-2 shadow-sm dark:shadow-inner">
            {[
                { icon: QrCode, label: t('warehouse.driverHub.scan'), action: () => setDriverScannerOpen(true), color: 'text-[#2C5E3B] dark:text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10' },
                { icon: AlertTriangle, label: t('warehouse.driverHub.report'), action: onIssue, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
                { icon: FileText, label: t('warehouse.driverHub.docs'), action: onDocs, color: 'text-[#2C5E3B] dark:text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10' },
                { icon: LogOut, label: t('warehouse.driverHub.finish'), action: onEnd, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' }
            ].map((btn, i) => (
                <button
                    key={i}
                    onClick={btn.action}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all border border-gray-200 dark:border-white/5 shadow-sm"
                >
                    <div className={`p-1.5 rounded-md ${btn.bg}`}>
                        <btn.icon size={14} className={btn.color} />
                    </div>
                    <span className="text-[8px] font-black text-gray-900 dark:text-white uppercase tracking-wider">{btn.label}</span>
                </button>
            ))}
        </div>
    );
};
