import React, { useState } from 'react';
import { usePOS } from '../POSContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { native } from '../../../utils/native';
import { audioFeedback } from '../../../utils/audioFeedback';
import { Store, User, Clock, ShieldCheck, DollarSign } from 'lucide-react';

const PRESET_FLOATS = [1000, 2000, 3000, 5000];

export const StartShiftModal: React.FC = () => {
    const { user } = useStore();
    const { activeSite } = useData();
    const { isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift } = usePOS();
    const [openingFloat, setOpeningFloat] = useState<string>('2000');

    const floatNum = parseFloat(openingFloat) || 0;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (floatNum < 0) return;
        audioFeedback.playSaleComplete();
        native.haptic();
        handleStartShift(floatNum);
    };

    return (
        <Modal
            isOpen={isStartShiftModalOpen}
            onClose={() => {}}
            title="Start Cashier Shift"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                {/* Cashier & Station Header */}
                <div className="p-4 bg-[#F8F6F0] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2]">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#1E3F27] dark:text-white leading-tight">{user?.name || 'Cashier'}</p>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400 font-mono uppercase">{user?.role || 'Staff'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-white dark:bg-white/5 px-2.5 py-1 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                            <Store size={13} />
                            <span>{activeSite?.name || 'POS Station'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-gray-400 pt-1 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <Clock size={12} />
                        <span>Shift starting now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                </div>

                {/* Opening Cash Float Input */}
                <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#1E3F27] dark:text-[#EAE5D9]">
                        Opening Drawer Cash Float ({CURRENCY_SYMBOL})
                    </label>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 dark:text-stone-500 font-bold text-lg">
                            {CURRENCY_SYMBOL}
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            className="w-full pl-14 pr-4 py-3.5 bg-white dark:bg-black/40 border-2 border-[#E2DCCE] dark:border-white/10 rounded-2xl font-mono text-2xl font-black text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
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
                                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                                    floatNum === amount
                                        ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 border-[#E2DCCE] dark:border-white/10 text-stone-700 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-white/10'
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

                {/* Submit Action */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={floatNum < 0}
                        className="w-full py-4 bg-gradient-to-r from-[#1E3F27] via-[#2C5E3B] to-[#224429] hover:opacity-95 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer border border-emerald-400/20"
                    >
                        <DollarSign size={18} />
                        <span>Start Shift ({CURRENCY_SYMBOL} {floatNum.toLocaleString()})</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
export default StartShiftModal;
