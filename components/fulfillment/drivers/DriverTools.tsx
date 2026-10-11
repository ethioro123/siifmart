import React from 'react';
import { QrCode, AlertTriangle, FileText, LogOut } from 'lucide-react';

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
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 shadow-xs">
            {[
                { icon: QrCode, label: t('warehouse.driverHub.scan'), action: () => setDriverScannerOpen(true), color: 'text-primary', bg: 'bg-primary/10' },
                { icon: AlertTriangle, label: t('warehouse.driverHub.report'), action: onIssue, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: FileText, label: t('warehouse.driverHub.docs'), action: onDocs, color: 'text-primary', bg: 'bg-primary/10' },
                { icon: LogOut, label: t('warehouse.driverHub.finish'), action: onEnd, color: 'text-red-500', bg: 'bg-red-500/10' }
            ].map((btn, i) => (
                <button
                    key={i}
                    onClick={btn.action}
                    className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] active:scale-[0.98] transition-all border border-[var(--theme-border)] shadow-xs touch-manipulation"
                >
                    <div className={`p-1.5 rounded-lg ${btn.bg}`}>
                        <btn.icon size={16} className={btn.color} />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">{btn.label}</span>
                </button>
            ))}
        </div>
    );
};
