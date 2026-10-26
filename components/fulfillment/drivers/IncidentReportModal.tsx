import React, { useState, useRef } from 'react';
import { 
    X, AlertTriangle, Clock, Truck, ShieldAlert, 
    MessageSquare, Send, CheckCircle, Navigation
} from 'lucide-react';
import { User, WMSJob } from '../../../types';
import { logger } from '../../../utils/logger';

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
    const saveLock = useRef(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const issueTypes = [
        { id: 'Traffic / Delay', label: t('warehouse.driverHub.trafficDelay'), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'Vehicle Issue', label: t('warehouse.driverHub.vehicleIssue'), icon: Truck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'Customer Not Found', label: t('warehouse.driverHub.customerNotFound'), icon: Navigation, color: 'text-[var(--theme-primary)]', bg: 'bg-[var(--theme-primary)]/10' },
        { id: 'Security / Access', label: t('warehouse.driverHub.securityAccess'), icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
        { id: 'Package Damage', label: t('warehouse.driverHub.packageDamage'), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { id: 'Other', label: t('warehouse.driverHub.other'), icon: MessageSquare, color: 'text-[var(--theme-text-muted)]', bg: 'bg-[var(--theme-bg-subtle)]' }
    ];

    const handleSubmit = async () => {
        if (!description.trim() || saveLock.current) return;
        saveLock.current = true;
        setError('');
        setIsSubmitting(true);
        try {
            await onReport({
                type: issueType,
                description: description.trim(),
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
            logger.error('IncidentReportModal', 'caught error', err as Error);
            setError(err instanceof Error ? err.message : 'Incident save was not confirmed.');
        } finally {
            saveLock.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-md rounded-3xl border border-[var(--theme-border)] shadow-xl flex flex-col isolate overflow-hidden max-h-[90vh] relative">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                {t('warehouse.driverHub.reportIncident')}
                            </h2>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                {t('warehouse.driverHub.immediateAlert')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={t('warehouse.driverHub.close')}
                        className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--theme-bg-card)] rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0 touch-manipulation"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {isSuccess ? (
                        <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-3">
                                <CheckCircle className="text-emerald-500" size={28} />
                            </div>
                            <h3 className="text-[var(--theme-text-primary)] font-semibold text-sm mb-1">
                                {t('warehouse.driverHub.reportLogged')}
                            </h3>
                            <p className="text-[var(--theme-text-secondary)] text-xs">
                                {t('warehouse.driverHub.mgmtNotified')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                {issueTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setIssueType(type.id)}
                                        className={`flex items-center gap-2.5 p-2.5 min-h-[44px] rounded-xl border transition-all active:scale-[0.98] touch-manipulation ${
                                            issueType === type.id 
                                                ? 'bg-[var(--theme-bg-card)] border-[var(--theme-primary)] text-[var(--theme-text-primary)] ring-1 ring-[var(--theme-primary)]/30' 
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${type.bg}`}>
                                            <type.icon size={14} className={type.color} />
                                        </div>
                                        <span className="text-xs font-medium text-left leading-tight truncate">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Details Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                    {t('warehouse.driverHub.incidentIntel')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('warehouse.driverHub.describeSituation')}
                                    aria-label={t('warehouse.driverHub.incidentIntel')}
                                    title={t('warehouse.driverHub.incidentIntel')}
                                    rows={3}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] min-h-[96px] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
                                />
                            </div>

                            {/* Submit */}
                            {error && <p role="alert" className="text-sm text-[var(--theme-text-primary)]">{error}</p>}
                        <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !description.trim()}
                                className="w-full min-h-[44px] py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] touch-manipulation shrink-0"
                            >
                                <Send size={14} />
                                {isSubmitting ? t('warehouse.driverHub.sending') : t('warehouse.driverHub.transmitReport')}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Context */}
                {!isSuccess && activeJob && (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)] flex items-center justify-center shrink-0">
                        <span className="text-xs text-[var(--theme-text-secondary)]">
                            {t('warehouse.driverHub.linkedToJob')}: <span className="text-[var(--theme-text-primary)] font-mono font-medium">#{activeJob.id.toUpperCase().slice(0,8)}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
