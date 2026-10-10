import React, { useState } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { audioFeedback } from '../../../utils/audioFeedback';
import { Store, User, Clock, ShieldCheck, DollarSign, Play } from 'lucide-react';

const PRESET_FLOATS = [500, 1000, 2000, 3000, 5000];

export const StartShiftModal: React.FC = () => {
    const { user } = useStore();
    const { activeSite } = useData();
    const { isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift } = usePOSCommand();
    const [openingFloat, setOpeningFloat] = useState<string>('1000');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const floatNum = parseFloat(openingFloat) || 0;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (floatNum < 0 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            audioFeedback.playSaleComplete();
            await handleStartShift(floatNum);
            setIsStartShiftModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isStartShiftModalOpen}
            onClose={() => setIsStartShiftModalOpen(false)}
            title="Start Daily Shift & Cash Drawer"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                {/* Cashier & Station Header */}
                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] flex items-center justify-center border border-[var(--theme-border)]">
                                <User size={18} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">{user?.name || 'Staff Cashier'}</p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono uppercase tracking-wider">{user?.role || 'Cashier'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)] shadow-xs">
                            <Store size={14} className="text-orange-500" />
                            <span>{activeSite?.name || 'Store Register'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--theme-text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-teal-500" />
                            <span>Shift starting {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-500">Zero-Trust Audit Logged</span>
                    </div>
                </div>

                {/* Float Input */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-emerald-500" />
                            Opening Cash Float
                        </label>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">Count physical cash in drawer</span>
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
                            className="w-full pl-16 pr-4 py-3.5 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-2xl text-xl font-mono font-bold text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] outline-hidden shadow-xs transition-colors"
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
                                className={`py-2 px-1 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
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
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-500 leading-relaxed font-medium">
                        Opening float syncs in real-time to Supabase for central HQ reconciliation. End-of-day drawer count will be reconciled against this amount.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsStartShiftModalOpen(false)}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-semibold uppercase tracking-wider rounded-2xl transition-colors cursor-pointer border border-[var(--theme-border)] shadow-2xs"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || floatNum < 0}
                        className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--theme-primary-text)] text-xs font-semibold uppercase tracking-wider rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <Play size={14} className="fill-current" />
                        <span>{isSubmitting ? 'Starting...' : 'Open Drawer & Start Shift'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
