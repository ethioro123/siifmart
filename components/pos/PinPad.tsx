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
        <div className="w-full max-w-[320px] mx-auto bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs transition-colors">
            {/* PIN Display */}
            <div className="flex gap-3 justify-center mb-6">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-11 h-13 rounded-xl flex items-center justify-center text-2xl font-mono transition-colors ${pin.length > index
                            ? 'bg-[var(--theme-pill-bg)] border-[var(--theme-border-focus)] text-[var(--theme-text-primary)] font-bold border-2'
                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] border text-[var(--theme-text-muted)]'
                            }`}
                    >
                        {pin.length > index ? '•' : ''}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleKeyPress(num.toString())}
                        className="h-14 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xl font-mono font-bold transition-colors border border-[var(--theme-border)] active:scale-95 shadow-xs cursor-pointer"
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={() => handleKeyPress('clear')}
                    className="h-14 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-500 text-xs font-bold uppercase transition-colors border border-rose-500/20 active:scale-95 flex items-center justify-center tracking-wider cursor-pointer"
                >
                    {t('common.clear')}
                </button>

                <button
                    key={0}
                    onClick={() => handleKeyPress('0')}
                    className="h-14 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xl font-mono font-bold transition-colors border border-[var(--theme-border)] active:scale-95 shadow-xs cursor-pointer"
                >
                    0
                </button>

                <button
                    title={t('common.delete') || "Delete"}
                    aria-label={t('common.delete') || "Delete"}
                    onClick={() => handleKeyPress('delete')}
                    className="h-14 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] active:scale-95 flex items-center justify-center shadow-xs cursor-pointer"
                >
                    <Delete size={20} />
                </button>
            </div>

            <div className="flex gap-3 mt-6">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold uppercase tracking-wider text-xs rounded-xl transition-colors border border-[var(--theme-border)] flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                    >
                        <ArrowLeft size={16} />
                        {t('common.cancel')}
                    </button>
                )}
                <button
                    onClick={() => handleKeyPress('enter')}
                    disabled={pin.length < 4}
                    className="flex-1 py-3 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 disabled:opacity-30 border border-transparent disabled:cursor-not-allowed font-bold uppercase tracking-wider text-xs rounded-xl transition-colors shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    {t('common.enter')}
                    <KeyRound size={16} />
                </button>
            </div>
        </div>
    );
};

export default PinPad; //
export {};
