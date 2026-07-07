import React, { useState } from 'react';
import { 
    X, AlertTriangle, Clock, Truck, ShieldAlert, 
    MessageSquare, Send, CheckCircle, Navigation
} from 'lucide-react';
import { User, WMSJob } from '../../../types';
import Button from '../../shared/Button';

interface IncidentReportModalProps {
    t: (key: string) => string;
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    activeJob?: WMSJob | null;
    onReport: (data: { 
        type: string; 
        description: string; 
        priority: 'High' | 'Critical';
        jobId?: string;
    }) => Promise<void>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
    t,
    isOpen,
    onClose,
    user,
    activeJob,
    onReport
}) => {
    const [issueType, setIssueType] = useState('Traffic / Delay');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const issueTypes = [
        { id: 'Traffic / Delay', label: t('warehouse.driverHub.trafficDelay'), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'Vehicle Issue', label: t('warehouse.driverHub.vehicleIssue'), icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { id: 'Customer Not Found', label: t('warehouse.driverHub.customerNotFound'), icon: Navigation, color: 'text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10' },
        { id: 'Security / Access', label: t('warehouse.driverHub.securityAccess'), icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
        { id: 'Package Damage', label: t('warehouse.driverHub.packageDamage'), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-600/10' },
        { id: 'Other', label: t('warehouse.driverHub.other'), icon: MessageSquare, color: 'text-gray-400', bg: 'bg-white/5' }
    ];

    const handleSubmit = async () => {
        if (!description) return;
        setIsSubmitting(true);
        try {
            await onReport({
                type: issueType,
                description,
                priority: issueType.includes('Security') || issueType.includes('Damage') ? 'Critical' : 'High',
                jobId: activeJob?.id
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setDescription('');
            }, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0c0c0e] w-full max-w-md rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 relative">
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30 shrink-0">
                            <AlertTriangle className="text-red-400 sm:w-[20px] sm:h-[20px]" size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">{t('warehouse.driverHub.reportIncident')}</h2>
                            <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t('warehouse.driverHub.immediateAlert')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label={t('warehouse.driverHub.close')} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors shrink-0">
                        <X size={18} className="sm:w-[20px] sm:h-[20px]" />
                    </button>
                </div>
 
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {isSuccess ? (
                        <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 mb-4">
                                <CheckCircle className="text-green-400 sm:w-[32px] sm:h-[32px]" size={28} />
                            </div>
                            <h3 className="text-white font-black uppercase tracking-widest text-xs sm:text-sm mb-1">{t('warehouse.driverHub.reportLogged')}</h3>
                            <p className="text-gray-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">{t('warehouse.driverHub.mgmtNotified')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                {issueTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setIssueType(type.id)}
                                        className={`flex items-center gap-2 p-2 sm:p-3 rounded-xl border transition-all ${
                                            issueType === type.id 
                                                ? 'bg-white/10 border-white/20 shadow-inner' 
                                                : 'bg-white/5 border-transparent opacity-60 grayscale-[0.5]'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-md shrink-0 ${type.bg}`}>
                                            <type.icon size={11} className={type.color} />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-black text-white text-left leading-tight uppercase tracking-tight truncate">{type.label}</span>
                                    </button>
                                ))}
                            </div>
 
                            {/* Details Input */}
                            <div className="space-y-1.5">
                                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('warehouse.driverHub.incidentIntel')}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('warehouse.driverHub.describeSituation')}
                                    aria-label={t('warehouse.driverHub.incidentIntel')}
                                    title={t('warehouse.driverHub.incidentIntel')}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-3 sm:p-4 text-xs text-white placeholder:text-gray-705 min-h-[80px] sm:min-h-[110px] focus:outline-none focus:border-red-500/30 transition-all font-mono uppercase tracking-widest"
                                />
                            </div>
 
                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !description}
                                className="w-full py-3 sm:py-4 bg-red-600 hover:bg-red-505 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20 shrink-0"
                            >
                                <Send size={12} className="sm:w-[14px] sm:h-[14px]" />
                                {isSubmitting ? t('warehouse.driverHub.sending') : t('warehouse.driverHub.transmitReport')}
                            </button>
                        </>
                    )}
                </div>
 
                {/* Footer Context */}
                {!isSuccess && activeJob && (
                    <div className="p-3 sm:p-4 bg-white/5 border-t border-white/5 flex items-center justify-center shrink-0">
                        <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 tracking-widest uppercase">
                            {t('warehouse.driverHub.linkedToJob')} <span className="text-gray-400">#{activeJob.id.toUpperCase().slice(0,8)}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
