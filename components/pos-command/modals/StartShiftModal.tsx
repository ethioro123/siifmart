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
                <div className="p-4 bg-[#F8F6F0] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#1E3F27] dark:text-white leading-tight">{user?.name || 'Staff Cashier'}</p>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400 font-mono uppercase tracking-wider">{user?.role || 'Cashier'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[#E2DCCE] dark:border-white/5 shadow-xs">
                            <Store size={14} />
                            <span>{activeSite?.name || 'Store Register'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-gray-400 pt-2 border-t border-[#E2DCCE]/60 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>Shift starting {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Zero-Trust Audit Logged</span>
                    </div>
                </div>

                {/* Float Input */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <label className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            Opening Cash Float
                        </label>
                        <span className="text-[11px] text-stone-500 dark:text-gray-400 font-medium">Count physical cash in drawer</span>
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 font-mono">
                            {CURRENCY_SYMBOL}
                        </span>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-16 pr-4 py-3.5 bg-white dark:bg-black/40 border-2 border-[#E2DCCE] dark:border-white/10 rounded-2xl text-xl font-mono font-black text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-hidden shadow-xs transition-colors"
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
                                        ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-xs scale-102'
                                        : 'bg-[#F8F6F0] dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/40'
                                }`}
                            >
                                {val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audit Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        Opening float syncs in real-time to Supabase for central HQ reconciliation. End-of-day drawer count will be reconciled against this amount.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsStartShiftModalOpen(false)}
                        className="flex-1 py-3 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || floatNum < 0}
                        className="flex-2 py-3 bg-[#2C5E3B] hover:bg-[#1E3F27] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                        <Play size={14} className="fill-current" />
                        <span>{isSubmitting ? 'Starting...' : 'Open Drawer & Start Shift'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
