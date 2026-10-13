import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../POSContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { native } from '../../../utils/native';
import { audioFeedback } from '../../../utils/audioFeedback';
import { Store, User, Clock, ShieldCheck, DollarSign, ArrowLeft, Monitor, CheckCircle2, Lock } from 'lucide-react';

const PRESET_FLOATS = [1000, 2000, 3000, 5000];

export const StartShiftModal: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const { activeSite, shifts } = useData();
    const { isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift, dismissStartShiftModal } = usePOS();
    const [openingFloat, setOpeningFloat] = useState<string>('2000');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Counter / Station Options based on site configuration
    const counterCount = Math.max(1, activeSite?.terminalCount || (activeSite as any)?.terminal_count || 4);
    const counterList = useMemo(() => {
        return Array.from({ length: counterCount }, (_, i) => `Counter ${i + 1}`);
    }, [counterCount]);

    // Active shifts at this site to determine counter occupancy
    const occupiedCounters = useMemo(() => {
        const siteShifts = (shifts || []).filter(
            s => s.status === 'Open' && (!activeSite?.id || s.siteId === activeSite.id || s.site_id === activeSite.id)
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

    const firstFreeCounter = counterList.find(c => !occupiedCounters.has(c)) || counterList[0];
    const [selectedCounter, setSelectedCounter] = useState<string>(firstFreeCounter);

    const floatNum = parseFloat(openingFloat) || 0;

    const handleClose = () => {
        if (dismissStartShiftModal) {
            dismissStartShiftModal();
        } else {
            setIsStartShiftModalOpen(false);
        }
        navigate('/pos-command');
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (floatNum < 0 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            audioFeedback.playSaleComplete();
            native.haptic();
            await handleStartShift(floatNum, selectedCounter);
            setIsStartShiftModalOpen(false);
        } catch (err) {
            console.error('Failed to start shift:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cashierBadge = user?.code || 'EMP-001';

    return (
        <Modal
            isOpen={isStartShiftModalOpen}
            onClose={handleClose}
            title="Start Cashier Shift"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                {/* Cashier & Station Header */}
                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <User size={16} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] leading-tight tracking-tight">{user?.name || 'Cashier'}</p>
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-black tracking-wider border border-blue-500/20">
                                        {cashierBadge}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono uppercase font-semibold mt-0.5">{user?.role || 'Staff'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)] shadow-xs">
                            <Store size={13} className="text-emerald-500" />
                            <span>{activeSite?.name || 'POS Station'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium text-[var(--theme-text-secondary)] pt-2 border-t border-[var(--theme-border-subtle)]">
                        <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-500" />
                            <span>Shift starting ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-500">1:1 Cashier Responsibility</span>
                    </div>
                </div>

                {/* Counter Selector Grid */}
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <Monitor size={14} className="text-indigo-500" />
                            Assign Physical Counter / Register
                        </label>
                        <span className="text-[11px] text-[var(--theme-text-secondary)]">Strict mutual exclusion</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {counterList.map((counter) => {
                            const occ = occupiedCounters.get(counter);
                            const isOccupied = Boolean(occ);
                            const isSelected = selectedCounter === counter && !isOccupied;

                            return (
                                <button
                                    key={counter}
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => setSelectedCounter(counter)}
                                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                                        isOccupied
                                            ? 'bg-rose-500/5 border-rose-500/20 opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-blue-500/10 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30 cursor-pointer'
                                                : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-500' : 'text-[var(--theme-text-primary)]'}`}>
                                            {counter}
                                        </span>
                                        {isOccupied ? (
                                            <Lock size={12} className="text-rose-500" />
                                        ) : isSelected ? (
                                            <CheckCircle2 size={12} className="text-blue-500" />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-mono mt-1">
                                        {isOccupied ? (
                                            <span className="text-rose-500 font-semibold truncate block">
                                                {occ?.cashierCode || 'Occupied'}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-500 font-semibold">Available</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Opening Cash Float Input */}
                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        Opening Drawer Cash Float ({CURRENCY_SYMBOL})
                    </label>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--theme-text-muted)] font-bold text-lg">
                            {CURRENCY_SYMBOL}
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            className="w-full pl-14 pr-4 py-3 bg-[var(--theme-bg-card)] border-2 border-[var(--theme-border)] rounded-2xl font-mono text-xl font-black text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-border-focus)] transition-all tabular-nums tracking-tight"
                            placeholder="2000"
                            autoFocus
                        />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                        {PRESET_FLOATS.map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => {
                                    setOpeningFloat(String(amount));
                                    native.haptic();
                                }}
                                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-center tabular-nums active:scale-95 shadow-xs ${
                                    floatNum === amount
                                        ? 'bg-[var(--theme-primary)] border-transparent text-[var(--theme-primary-text)]'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                }`}
                            >
                                {amount.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Anti-Skimming Notice */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--theme-text-primary)] leading-relaxed font-medium">
                        Opening float will be credited to {selectedCounter}. At shift close, the system will verify your drawer cash against this starting float under badge <strong>{cashierBadge}</strong>.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[var(--theme-border)] shadow-xs active:scale-95 tracking-tight"
                    >
                        <ArrowLeft size={15} />
                        <span>Cancel</span>
                    </button>

                    <button
                        type="submit"
                        disabled={floatNum < 0 || isSubmitting}
                        className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-transparent tracking-tight"
                    >
                        <DollarSign size={15} />
                        <span>{isSubmitting ? 'Starting...' : `Start ${selectedCounter} (${CURRENCY_SYMBOL} ${floatNum.toLocaleString()})`}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
export default StartShiftModal;
