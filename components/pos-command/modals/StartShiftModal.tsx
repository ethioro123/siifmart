import React, { useState, useMemo, useEffect } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { audioFeedback } from '../../../utils/audioFeedback';
import { Store, User, Clock, ShieldCheck, DollarSign, Play, Monitor, CheckCircle2, Lock } from 'lucide-react';

const PRESET_FLOATS = [500, 1000, 2000, 3000, 5000];

export const StartShiftModal: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { activeSite, shifts } = useData();
    const { isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift } = usePOSCommand();
    const [openingFloat, setOpeningFloat] = useState<string>('1000');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Dynamic Counter / Station Options based on site configuration
    const counterCount = Math.max(1, activeSite?.terminalCount || (activeSite as any)?.terminal_count || 4);
    const counterList = useMemo(() => {
        return Array.from({ length: counterCount }, (_, i) => `Counter ${i + 1}`);
    }, [counterCount]);

    // Active shifts at this site to determine counter occupancy
    const occupiedCounters = useMemo(() => {
        const siteShifts = (shifts || []).filter(
            s => Boolean(activeSite?.id) && s.status === 'Open' && (s.siteId === activeSite?.id || s.site_id === activeSite?.id)
        );
        const map = new Map<string, { cashierCode?: string; cashierName?: string }>();
        siteShifts.forEach(s => {
            const cName = s.counterNumber || s.counter_number || 'Counter 1';
            map.set(cName, {
                cashierCode: s.cashierCode || s.cashier_code,
                cashierName: s.cashierName
            });
        });
        return map;
    }, [shifts, activeSite?.id]);
    const hasOpenShiftForCashier = useMemo(() => (shifts || []).some(s =>
        Boolean(activeSite?.id) && s.status === 'Open' &&
        (s.siteId === activeSite?.id || s.site_id === activeSite?.id) &&
        (s.cashierId === user?.id || (Boolean(user?.code) && s.cashierId === user?.code))
    ), [shifts, activeSite?.id, user?.id, user?.code]);

    // Default to the first available counter
    const firstFreeCounter = counterList.find(c => !occupiedCounters.has(c)) || counterList[0];
    const [selectedCounter, setSelectedCounter] = useState<string>(firstFreeCounter);

    useEffect(() => {
        if (!counterList.includes(selectedCounter) || occupiedCounters.has(selectedCounter)) {
            setSelectedCounter(firstFreeCounter);
        }
    }, [counterList, firstFreeCounter, occupiedCounters, selectedCounter]);

    const floatNum = parseFloat(openingFloat) || 0;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (floatNum < 0 || isSubmitting) return;
        if (hasOpenShiftForCashier) {
            setSubmitError(t('posCommand.shiftCashierConflict'));
            return;
        }
        if (!activeSite?.id) {
            setSubmitError(t('posCommand.shiftSiteRequired'));
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            audioFeedback.playSaleComplete();
            await handleStartShift(floatNum, selectedCounter);
            setIsStartShiftModalOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            const key = message.includes('SHIFT_COUNTER_OCCUPIED')
                ? 'posCommand.shiftCounterConflict'
                : message.includes('SHIFT_CASHIER_ALREADY_OPEN')
                    ? 'posCommand.shiftCashierConflict'
                    : message.includes('SHIFT_SITE_REQUIRED')
                        ? 'posCommand.shiftSiteRequired'
                        : 'posCommand.shiftStartFailed';
            setSubmitError(t(key));
        } finally {
            setIsSubmitting(false);
        }
    };

    const cashierBadge = user?.code || 'EMP-001';

    return (
        <Modal
            isOpen={isStartShiftModalOpen}
            onClose={() => setIsStartShiftModalOpen(false)}
            title={t('posCommand.startShiftModalTitle')}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cashier & Sovereign Identity Card */}
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">{user?.name || 'Staff Cashier'}</p>
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] font-mono text-[10px] font-black tracking-wider border border-[var(--theme-accent)]/20">
                                        {cashierBadge}
                                    </span>
                                </div>
                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono uppercase tracking-wider mt-0.5">{user?.role || 'Cashier'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)] shadow-xs">
                            <Store size={14} className="text-[var(--theme-status-warning)]" />
                            <span>{activeSite?.name || 'Store Register'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--theme-text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-[var(--theme-accent)]" />
                            <span>{t('posCommand.shiftStartingAt')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-status-warning-text)]">{t('posCommand.oneToOneResponsibility')}</span>
                    </div>
                </div>

                {/* Counter / Station Selector Grid */}
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <Monitor size={14} className="text-[var(--theme-accent)]" />
                            {t('posCommand.assignRegisterCounter')}
                        </label>
                        <span className="text-[11px] text-[var(--theme-text-secondary)]">{t('posCommand.strictMutualExclusion')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {counterList.map((counter, index) => {
                            const occ = occupiedCounters.get(counter);
                            const isOccupied = Boolean(occ);
                            const isSelected = selectedCounter === counter && !isOccupied;
                            const terminalId = `${activeSite?.code?.toUpperCase() || 'SITE'}-POS-${String(index + 1).padStart(2, '0')}`;

                            return (
                                <button
                                    key={counter}
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => setSelectedCounter(counter)}
                                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                        isOccupied
                                            ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/50 shadow-xs ring-1 ring-[var(--theme-accent)]/30 cursor-pointer'
                                                : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-primary)]'}`}>
                                            {counter}
                                        </span>
                                        {isOccupied ? (
                                            <Lock size={12} className="text-[var(--theme-status-danger-text)]" />
                                        ) : isSelected ? (
                                            <CheckCircle2 size={12} className="text-[var(--theme-accent)]" />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success)]" />
                                        )}
                                    </div>
                                    <span className="text-[9px] font-mono text-[var(--theme-text-secondary)] mt-1">{t('posCommand.counterIdentifier')}: {terminalId}</span>
                                    <span className="text-[10px] font-mono mt-1">
                                        {isOccupied ? (
                                            <span className="text-[var(--theme-status-danger-text)] font-semibold truncate block">
                                                {occ?.cashierCode || t('posCommand.counterOccupied')}
                                            </span>
                                        ) : (
                                            <span className="text-[var(--theme-status-success-text)] font-semibold">{t('posCommand.counterAvailable')}</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {hasOpenShiftForCashier && <p role="status" className="text-xs font-medium text-[var(--theme-status-warning-text)]">{t('posCommand.shiftCashierConflict')}</p>}
                    {submitError && <p role="alert" className="text-xs font-medium text-[var(--theme-status-danger-text)]">{submitError}</p>}
                </div>

                {/* Float Input */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-[var(--theme-status-success)]" />
                            {t('posCommand.openingCashFloat')}
                        </label>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{t('posCommand.countPhysicalCashInDrawer')}</span>
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--theme-text-secondary)] font-mono">
                            {CURRENCY_SYMBOL}
                        </span>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-16 pr-4 py-3 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-2xl text-xl font-mono font-bold text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] outline-hidden shadow-xs transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                        {PRESET_FLOATS.map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setOpeningFloat(String(val))}
                                className={`py-1.5 px-1 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                    floatNum === val
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-xs'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audit Notice */}
                <div className="p-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[var(--theme-status-warning-text)] leading-relaxed font-medium">
                        {t('posCommand.openingFloatSyncNotice')} {t('posCommand.openingFloatReconcileNotice', { counter: selectedCounter, badge: cashierBadge })}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => setIsStartShiftModalOpen(false)}
                        className="flex-1 min-h-11 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-semibold uppercase tracking-wider rounded-2xl transition-colors cursor-pointer border border-[var(--theme-border)] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || floatNum < 0 || !activeSite?.id || occupiedCounters.has(selectedCounter) || hasOpenShiftForCashier}
                        className="flex-2 min-h-11 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--theme-primary-text)] text-xs font-semibold uppercase tracking-wider rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        <Play size={14} className="fill-current" />
                        <span>{isSubmitting ? t('posCommand.starting') : t('posCommand.openCounterAndStart', { counter: selectedCounter })}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
