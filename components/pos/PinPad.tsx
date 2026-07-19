import React, { useState } from 'react';
import { ArrowLeft, Delete, KeyRound } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PinPadProps {
    pin: string;
    setPin: (pin: string) => void;
    onEnter: () => void;
    onCancel?: () => void;
}

const PinPad: React.FC<PinPadProps> = ({ pin, setPin, onEnter, onCancel }) => {
    const { t } = useLanguage();

    const handleKeyPress = (key: string) => {
        if (key === 'clear') {
            setPin('');
        } else if (key === 'delete') {
            setPin(pin.slice(0, -1));
        } else if (key === 'enter') {
            onEnter();
        } else {
            if (pin.length < 4) {
                setPin(pin + key);
            }
        }
    };

    return (
        <div className="w-full max-w-[320px] mx-auto bg-white/85 dark:bg-[#18201B]/60 p-6 rounded-[32px] border border-[#E2DCCE] dark:border-emerald-950/20 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] lg:backdrop-blur-2xl transition-all duration-300">
            {/* PIN Display */}
            <div className="flex gap-4 justify-center mb-8">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-12 h-14 rounded-2xl flex items-center justify-center text-3xl font-mono transition-all duration-300 ${pin.length > index
                            ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-white font-bold border-2 shadow-[0_2px_12px_rgba(44,94,59,0.1)]'
                            : 'bg-[#FAF8F5] dark:bg-black/35 border-[#E2DCCE] dark:border-white/5 border text-stone-400'
                            }`}
                    >
                        {pin.length > index ? '•' : ''}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleKeyPress(num.toString())}
                        className="h-16 rounded-2xl bg-white/80 dark:bg-[#18201B]/40 hover:bg-white dark:hover:bg-[#18201B]/80 active:bg-[#2C5E3B]/10 text-[#1E3F27] dark:text-[#EAE5D9] text-2xl font-mono transition-all border border-[#E2DCCE] dark:border-white/10 active:border-[#2C5E3B] dark:active:border-[#A9CBA2] active:scale-95 shadow-sm"
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={() => handleKeyPress('clear')}
                    className="h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold uppercase transition-all border border-red-500/20 active:scale-95 flex items-center justify-center tracking-widest"
                >
                    {t('common.clear')}
                </button>

                <button
                    key={0}
                    onClick={() => handleKeyPress('0')}
                    className="h-16 rounded-2xl bg-white/80 dark:bg-[#18201B]/40 hover:bg-white dark:hover:bg-[#18201B]/80 active:bg-[#2C5E3B]/10 text-[#1E3F27] dark:text-[#EAE5D9] text-2xl font-mono transition-all border border-[#E2DCCE] dark:border-white/10 active:border-[#2C5E3B] dark:active:border-[#A9CBA2] active:scale-95 shadow-sm"
                >
                    0
                </button>

                <button
                    title={t('common.delete') || "Delete"}
                    aria-label={t('common.delete') || "Delete"}
                    onClick={() => handleKeyPress('delete')}
                    className="h-16 rounded-2xl bg-white/80 dark:bg-[#18201B]/40 hover:bg-white dark:hover:bg-[#18201B]/80 text-stone-700 dark:text-stone-300 hover:text-[#1E3F27] dark:hover:text-white transition-all border border-[#E2DCCE] dark:border-white/10 active:scale-95 flex items-center justify-center shadow-sm"
                >
                    <Delete size={24} />
                </button>
            </div>

            <div className="flex gap-4 mt-6">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-white/90 dark:bg-black/35 text-stone-700 dark:text-stone-300 hover:text-[#1E3F27] dark:hover:text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        {t('common.cancel')}
                    </button>
                )}
                <button
                    onClick={() => handleKeyPress('enter')}
                    disabled={pin.length < 4}
                    className="flex-1 py-4 bg-gradient-to-r from-[#224429] to-[#2C5E3B] hover:opacity-90 disabled:bg-stone-200 dark:disabled:bg-white/5 text-white disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:hover:scale-100 font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-md disabled:shadow-none hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                    {t('common.enter')}
                    <KeyRound size={18} />
                </button>
            </div>
        </div>
    );
};

export default PinPad; //
export {};
