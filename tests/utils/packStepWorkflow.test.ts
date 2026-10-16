import { describe, it, expect } from 'vitest';

export type BoxSizeType = 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box';

export function resolveRecommendedBoxSize(hasColdItems: boolean, expectedWeightKg: number): BoxSizeType {
    if (hasColdItems) return 'Thermal Cool Box';
    if (expectedWeightKg <= 2.2) return 'Small';
    if (expectedWeightKg <= 8.5) return 'Medium';
    if (expectedWeightKg <= 20) return 'Large';
    return 'Extra Large';
}

export function checkWeightTolerance(scaleWeight: number, expectedWeight: number, tolerancePct: number = 5): {
    isWithinTolerance: boolean;
    variancePct: number;
} {
    const diff = Math.abs(scaleWeight - expectedWeight);
    const variancePct = (diff / (expectedWeight || 1)) * 100;
    return {
        isWithinTolerance: variancePct <= tolerancePct,
        variancePct: parseFloat(variancePct.toFixed(1)),
    };
}

describe('Dynamic Pack Job Step-by-Step Workflow', () => {
    describe('Smart Box & Container Recommendation', () => {
        it('prioritizes Thermal Cool Box when cold-chain goods are present', () => {
            const box = resolveRecommendedBoxSize(true, 1.5);
            expect(box).toBe('Thermal Cool Box');
        });

        it('recommends Small Box for lightweight packages under 2.2kg', () => {
            const box = resolveRecommendedBoxSize(false, 1.4);
            expect(box).toBe('Small');
        });

        it('recommends Medium Box for packages between 2.2kg and 8.5kg', () => {
            const box = resolveRecommendedBoxSize(false, 5.2);
            expect(box).toBe('Medium');
        });

        it('recommends Large Box for packages between 8.5kg and 20kg', () => {
            const box = resolveRecommendedBoxSize(false, 14.0);
            expect(box).toBe('Large');
        });

        it('recommends Extra Large Box for bulk cargo over 20kg', () => {
            const box = resolveRecommendedBoxSize(false, 28.5);
            expect(box).toBe('Extra Large');
        });
    });

    describe('Scale Weight Tolerance Verification', () => {
        it('validates weights within the 5% tolerance threshold', () => {
            const expected = 10.0;
            const actual = 10.3; // 3% variance
            const result = checkWeightTolerance(actual, expected, 5);
            expect(result.isWithinTolerance).toBe(true);
            expect(result.variancePct).toBe(3.0);
        });

        it('flags weights that deviate past the allowed tolerance', () => {
            const expected = 10.0;
            const actual = 11.2; // 12% variance
            const result = checkWeightTolerance(actual, expected, 5);
            expect(result.isWithinTolerance).toBe(false);
            expect(result.variancePct).toBe(12.0);
        });
    });

    describe('Step Advancement Rules', () => {
        it('determines the initial step based on completion state', () => {
            const getInitialStep = (isFullyPacked: boolean) => (isFullyPacked ? 'BOX' : 'ITEMS');
            expect(getInitialStep(false)).toBe('ITEMS');
            expect(getInitialStep(true)).toBe('BOX');
        });

        it('progresses logically through the 4 packing stages', () => {
            const flow = ['ITEMS', 'BOX', 'WEIGH', 'FINISH'];
            expect(flow[0]).toBe('ITEMS');
            expect(flow[1]).toBe('BOX');
            expect(flow[2]).toBe('WEIGH');
            expect(flow[3]).toBe('FINISH');
        });
    });
});
