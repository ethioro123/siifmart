import React from 'react';
import { QrCode, AlertTriangle, FileText, LogOut, Scan } from 'lucide-react';

interface DriverToolsProps {
    setDriverScannerOpen: (val: boolean) => void;
    addNotification: (type: string, message: string) => void;
}

export const DriverTools: React.FC<DriverToolsProps> = ({
    setDriverScannerOpen,
    addNotification
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Driver Actions
                </h4>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group h-full">
                <div className="grid grid-cols-2 gap-3 h-full content-start">
                    {[
                        {
                            icon: QrCode, label: 'SCAN', color: 'cyan',
                            action: () => setDriverScannerOpen(true)
                        },
                        {
                            icon: AlertTriangle, label: 'REPORT', color: 'orange',
                            action: () => addNotification('alert', 'Incident Reported to Dispatch.')
                        },
                        {
                            icon: FileText, label: 'DOCS', color: 'blue',
                            action: () => addNotification('info', 'Manifest loaded.')
                        },
                        {
                            icon: LogOut, label: 'FINISH', color: 'red',
                            action: () => {
                                if (window.confirm("Complete shift and logout?")) {
                                    // Handle logout or shift end logic if needed
                                }
                            }
                        }
                    ].map((act, i) => (
                        <button
                            key={i}
                            onClick={act.action}
                            className="group/btn relative aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-${act.color}-500 blur-2xl opacity-0 group-hover/btn:opacity-10 transition-opacity`} />
                            <act.icon size={28} className={`text-${act.color}-400 group-hover/btn:scale-110 transition-transform`} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{act.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
