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
        <div className="w-full max-w-[320px] mx-auto bg-black/40 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
            {/* PIN Display */}
            <div className="flex gap-4 justify-center mb-8">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-12 h-14 rounded-2xl flex items-center justify-center text-3xl font-mono transition-all duration-300 ${pin.length > index
                            ? 'bg-cyber-primary/20 border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.3)] text-white font-bold border-2'
                            : 'bg-black/50 border-white/5 border text-gray-700'
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
                        className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-cyber-primary/20 text-white text-2xl font-mono transition-all border border-white/5 hover:border-white/20 active:border-cyber-primary active:scale-95"
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={() => handleKeyPress('clear')}
                    className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 text-sm font-bold uppercase transition-all border border-transparent hover:border-red-500/20 active:scale-95 flex items-center justify-center tracking-widest"
                >
                    {t('common.clear')}
                </button>

                <button
                    key={0}
                    onClick={() => handleKeyPress('0')}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-cyber-primary/20 text-white text-2xl font-mono transition-all border border-white/5 hover:border-white/20 active:border-cyber-primary active:scale-95"
                >
                    0
                </button>

                <button
                    title={t('common.delete') || "Delete"}
                    aria-label={t('common.delete') || "Delete"}
                    onClick={() => handleKeyPress('delete')}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10 active:scale-95 flex items-center justify-center"
                >
                    <Delete size={24} />
                </button>
            </div>

            <div className="flex gap-4 mt-6">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all border border-transparent hover:border-white/10 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        {t('common.cancel')}
                    </button>
                )}
                <button
                    onClick={() => handleKeyPress('enter')}
                    disabled={pin.length < 4}
                    className="flex-1 py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
