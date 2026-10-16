import React, { useState, useEffect, useRef } from 'react';

interface ReceivingItemQtyInputProps {
    receivedQty: number;
    sizeNum: number;
    isWeightVol: boolean;
    onChange: (qty: number) => void;
    title?: string;
    isOverReceived?: boolean;
    isFullyReceived?: boolean;
    isCentralHQOnly?: boolean;
}

export const ReceivingItemQtyInput: React.FC<ReceivingItemQtyInputProps> = ({
    receivedQty,
    sizeNum,
    isWeightVol,
    onChange,
    title,
    isOverReceived = false,
    isFullyReceived = false,
    isCentralHQOnly = false
}) => {
    // Determine the user-facing quantity: cases/packs if weight/vol with size, or direct units
    const currentQty = isWeightVol && sizeNum > 0 ? (receivedQty / sizeNum) : receivedQty;

    // Internal string state so user can type freely without React wiping decimal points, zeros, or empty strings mid-stroke
    const [textValue, setTextValue] = useState<string>(
        currentQty === 0 ? '' : (currentQty % 1 === 0 ? String(currentQty) : String(Number(currentQty.toFixed(2))))
    );
    const isFocusedRef = useRef(false);

    // Sync external changes (e.g. from scanner increment or +/- buttons) when user is not actively typing
    useEffect(() => {
        if (!isFocusedRef.current) {
            setTextValue(
                currentQty === 0 ? '' : (currentQty % 1 === 0 ? String(currentQty) : String(Number(currentQty.toFixed(2))))
            );
        }
    }, [currentQty]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.target.value;
        setTextValue(str);

        if (str.trim() === '') {
            onChange(0);
            return;
        }

        const parsed = parseFloat(str);
        if (!isNaN(parsed) && parsed >= 0) {
            const rawQty = isWeightVol && sizeNum > 0 ? parsed * sizeNum : Math.round(parsed);
            onChange(rawQty);
        }
    };

    const handleBlur = () => {
        isFocusedRef.current = false;
        if (textValue.trim() === '') {
            setTextValue('');
            onChange(0);
        } else {
            const parsed = parseFloat(textValue);
            if (isNaN(parsed) || parsed <= 0) {
                setTextValue('');
                onChange(0);
            } else {
                const formatted = isWeightVol && sizeNum > 0 ? parsed : Math.round(parsed);
                setTextValue(formatted === 0 ? '' : (formatted % 1 === 0 ? String(formatted) : String(Number(formatted.toFixed(2)))));
            }
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        isFocusedRef.current = true;
        e.target.select();
    };

    return (
        <input
            title={title}
            placeholder="0"
            type="number"
            min="0"
            step={isWeightVol ? "any" : "1"}
            value={textValue}
            onFocus={handleFocus}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-16 min-h-[32px] bg-[var(--theme-input-bg)] border rounded-xl text-center font-mono py-1 px-1.5 text-xs focus:outline-none transition-all ${
                isOverReceived && isCentralHQOnly
                    ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                    : isFullyReceived && isCentralHQOnly
                        ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)]'
            }`}
        />
    );
};

export default ReceivingItemQtyInput;
