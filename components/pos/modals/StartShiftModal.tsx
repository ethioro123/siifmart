import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../POSContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { native } from '../../../utils/native';
import { audioFeedback } from '../../../utils/audioFeedback';
import { Store, User, Clock, ShieldCheck, DollarSign, ArrowLeft } from 'lucide-react';

const PRESET_FLOATS = [1000, 2000, 3000, 5000];

export const StartShiftModal: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const { activeSite } = useData();
    const { isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift, dismissStartShiftModal } = usePOS();
    const [openingFloat, setOpeningFloat] = useState<string>('2000');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            await handleStartShift(floatNum);
            setIsStartShiftModalOpen(false);
        } catch (err) {
            console.error('Failed to start shift:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isStartShiftModalOpen}
            onClose={handleClose}
            title="Start Cashier Shift"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                {/* Cashier & Station Header */}
                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">{user?.name || 'Cashier'}</p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono uppercase">{user?.role || 'Staff'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--theme-primary)] bg-[var(--theme-bg-card)] px-2.5 py-1 rounded-xl border border-[var(--theme-border)]">
                            <Store size={13} />
                            <span>{activeSite?.name || 'POS Station'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--theme-text-secondary)] pt-1 border-t border-[var(--theme-border)]">
                        <Clock size={12} />
                        <span>Shift starting now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                </div>

                {/* Opening Cash Float Input */}
                <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-[var(--theme-text-primary)]">
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
                            className="w-full pl-14 pr-4 py-3.5 bg-[var(--theme-bg-card)] border-2 border-[var(--theme-border)] rounded-2xl font-mono text-2xl font-black text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-border-focus)] transition-colors tabular-nums"
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
                                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center tabular-nums ${
                                    floatNum === amount
                                        ? 'bg-[var(--theme-text-primary)] border-[var(--theme-text-primary)] text-[var(--theme-bg-app)] shadow-xs'
                                        : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-strong)]'
                                }`}
                            >
                                {amount.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Anti-Skimming Notice */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                        This opening float will be credited to your cash drawer. At shift close, the system will verify your drawer cash against this starting float plus cash sales.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[var(--theme-border)] shadow-xs"
                    >
                        <ArrowLeft size={15} />
                        <span>Cancel</span>
                    </button>

                    <button
                        type="submit"
                        disabled={floatNum < 0 || isSubmitting}
                        className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-transparent"
                    >
                        <DollarSign size={15} />
                        <span>{isSubmitting ? 'Starting...' : `Start Shift (${CURRENCY_SYMBOL} ${floatNum.toLocaleString()})`}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
export default StartShiftModal;
