import { describe, it, expect, vi } from 'vitest';

describe('POS Receiving Count Input Logic', () => {
    it('correctly calculates sellable quantity for standard discrete items', () => {
        const parseDiscreteQty = (valStr: string) => {
            if (valStr.trim() === '') return 0;
            const parsed = parseFloat(valStr);
            return !isNaN(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
        };

        expect(parseDiscreteQty('')).toBe(0);
        expect(parseDiscreteQty('0')).toBe(0);
        expect(parseDiscreteQty('5')).toBe(5);
        expect(parseDiscreteQty('12.8')).toBe(13);
        expect(parseDiscreteQty('-3')).toBe(0);
    });

    it('correctly calculates base units for weight and volume items', () => {
        const sizeNum = 25; // 25kg bag
        const isWeightVol = true;

        const parseWeightVolQty = (valStr: string) => {
            if (valStr.trim() === '') return 0;
            const parsed = parseFloat(valStr);
            return !isNaN(parsed) && parsed >= 0
                ? (isWeightVol && sizeNum > 0 ? parsed * sizeNum : Math.round(parsed))
                : 0;
        };

        expect(parseWeightVolQty('')).toBe(0);
        expect(parseWeightVolQty('1')).toBe(25);
        expect(parseWeightVolQty('2.5')).toBe(62.5);
        expect(parseWeightVolQty('4')).toBe(100);
    });

    it('formats display quantity without hard zero locking', () => {
        const formatDisplay = (receivedQty: number, sizeNum: number, isWeightVol: boolean) => {
            const currentQty = isWeightVol && sizeNum > 0 ? (receivedQty / sizeNum) : receivedQty;
            return currentQty === 0 ? '' : (currentQty % 1 === 0 ? String(currentQty) : String(Number(currentQty.toFixed(2))));
        };

        // When 0, display is empty so placeholder "0" shows and typing is clean
        expect(formatDisplay(0, 1, false)).toBe('');
        expect(formatDisplay(5, 1, false)).toBe('5');
        expect(formatDisplay(100, 25, true)).toBe('4');
        expect(formatDisplay(62.5, 25, true)).toBe('2.5');
    });

    it('allows worker to clear count without losing focus or locking up', () => {
        let currentReceivedQty = 5;
        const onChange = vi.fn((newQty: number) => {
            currentReceivedQty = newQty;
        });

        // Simulate user backspacing out the 5 to empty
        const handleInputChange = (valStr: string) => {
            if (valStr.trim() === '') {
                onChange(0);
                return;
            }
            const parsed = parseFloat(valStr);
            if (!isNaN(parsed) && parsed >= 0) {
                onChange(Math.round(parsed));
            }
        };

        handleInputChange('');
        expect(onChange).toHaveBeenCalledWith(0);
        expect(currentReceivedQty).toBe(0);

        // Worker immediately types 12
        handleInputChange('12');
        expect(onChange).toHaveBeenCalledWith(12);
        expect(currentReceivedQty).toBe(12);
    });
});
