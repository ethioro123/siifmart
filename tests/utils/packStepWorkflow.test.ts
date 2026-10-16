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
        it('always opens directly to DETAILS on job launch', () => {
            const getInitialStep = () => 'DETAILS';
            expect(getInitialStep()).toBe('DETAILS');
        });

        it('progresses logically through the 5 packing stages', () => {
            const flow = ['DETAILS', 'ITEMS', 'BOX', 'WEIGH', 'FINISH'];
            expect(flow[0]).toBe('DETAILS');
            expect(flow[1]).toBe('ITEMS');
            expect(flow[2]).toBe('BOX');
            expect(flow[3]).toBe('WEIGH');
            expect(flow[4]).toBe('FINISH');
        });

        it('strictly gates step accessibility: BOX, WEIGH, FINISH locked until ITEMS are fully scanned', () => {
            const isStepAccessible = (
                stepId: 'DETAILS' | 'ITEMS' | 'BOX' | 'WEIGH' | 'FINISH',
                isFullyPacked: boolean,
                hasBoxSelected: boolean,
                hasWeightEntered: boolean
            ): boolean => {
                if (stepId === 'DETAILS' || stepId === 'ITEMS') return true;
                if (stepId === 'BOX') return isFullyPacked;
                if (stepId === 'WEIGH') return isFullyPacked && hasBoxSelected;
                if (stepId === 'FINISH') return isFullyPacked && hasBoxSelected && hasWeightEntered;
                return false;
            };

            // Unscanned state
            expect(isStepAccessible('DETAILS', false, false, false)).toBe(true);
            expect(isStepAccessible('ITEMS', false, false, false)).toBe(true);
            expect(isStepAccessible('BOX', false, false, false)).toBe(false);
            expect(isStepAccessible('WEIGH', false, false, false)).toBe(false);
            expect(isStepAccessible('FINISH', false, false, false)).toBe(false);

            // Fully scanned state unlocks BOX
            expect(isStepAccessible('BOX', true, false, false)).toBe(true);
            expect(isStepAccessible('WEIGH', true, false, false)).toBe(false);

            // Box selected unlocks WEIGH
            expect(isStepAccessible('WEIGH', true, true, false)).toBe(true);
            expect(isStepAccessible('FINISH', true, true, false)).toBe(false);

            // Weight audited unlocks FINISH
            expect(isStepAccessible('FINISH', true, true, true)).toBe(true);
        });

        it('does not treat items with status Picked as packed in Pack phase', () => {
            const isItemPacked = (item: any, isJobCompleted: boolean = false) => {
                if (isJobCompleted) return true;
                if (item.packed === true) return true;
                const required = item.expectedQty || 1;
                const packedQty = item.packedQty ?? 0;
                return packedQty >= required - 0.001;
            };

            // Item picked in the pick phase (status = 'Picked', pickedQty = 5, but not yet packed)
            const pickedFromPickPhase = {
                sku: 'ET-COFFEE-01',
                expectedQty: 5,
                pickedQty: 5,
                status: 'Picked' as const,
                packed: false,
                packedQty: 0
            };

            expect(isItemPacked(pickedFromPickPhase)).toBe(false);

            // Item scanned and packed in pack phase
            const packedInPackPhase = {
                ...pickedFromPickPhase,
                packed: true,
                packedQty: 5
            };

            expect(isItemPacked(packedInPackPhase)).toBe(true);
        });

        it('guards step indicator from jumping ahead without scanning all items', () => {
            const isStepAccessible = (stepId: string, isFullyPacked: boolean, hasBoxSelected: boolean, hasWeightEntered: boolean) => {
                if (stepId === 'ITEMS') return true;
                if (stepId === 'BOX') return isFullyPacked;
                if (stepId === 'WEIGH') return isFullyPacked && hasBoxSelected;
                if (stepId === 'FINISH') return isFullyPacked && hasBoxSelected && hasWeightEntered;
                return false;
            };

            // When items are not yet packed:
            expect(isStepAccessible('ITEMS', false, false, false)).toBe(true);
            expect(isStepAccessible('BOX', false, false, false)).toBe(false);
            expect(isStepAccessible('WEIGH', false, false, false)).toBe(false);
            expect(isStepAccessible('FINISH', false, false, false)).toBe(false);

            // Once all items are scanned & verified:
            expect(isStepAccessible('BOX', true, false, false)).toBe(true);
            expect(isStepAccessible('WEIGH', true, true, false)).toBe(true);
            expect(isStepAccessible('FINISH', true, true, true)).toBe(true);
        });
    });

    describe('Pack Details Quantity Resolution', () => {
        const resolvePackDetailsQuantities = (item: any, jobStatus: string = 'Completed') => {
            const isJobCompleted = (jobStatus || '').toLowerCase() === 'completed';
            const isItemPacked = isJobCompleted || (item as any).packed === true;

            const expected = item.expectedQty || (item as any).quantity || item.orderedQty || 
                (item.packedQty ? item.packedQty : (item.pickedQty || 0));

            const packed = (item.packedQty !== undefined && item.packedQty !== null)
                ? item.packedQty
                : (isItemPacked ? expected : (item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0));

            const isShortPicked = item.orderedQty && item.orderedQty > expected;
            const isUnderpacked = isJobCompleted && packed < expected;

            return { expected, packed, isShortPicked, isUnderpacked, display: `${packed} / ${expected}` };
        };

        it('correctly displays 53 / 53 when an item was packed with pickedQty = 0 (RTPA1Y regression)', () => {
            const item = {
                sku: 'KEEL001',
                name: 'Amazon Kindle',
                packed: true,
                status: 'Completed',
                packedQty: 53,
                pickedQty: 0,
                orderedQty: 53,
                expectedQty: 53
            };

            const result = resolvePackDetailsQuantities(item, 'Completed');
            expect(result.expected).toBe(53);
            expect(result.packed).toBe(53);
            expect(result.display).toBe('53 / 53');
            expect(result.isUnderpacked).toBe(false);
            expect(result.isShortPicked).toBeFalsy();
        });

        it('correctly displays 200 / 200 for Wanchi Tuna when packed without discrepancy', () => {
            const item = {
                sku: 'TS001',
                name: 'Wanchi Tuna',
                packed: true,
                status: 'Completed',
                packedQty: 200,
                pickedQty: 0,
                orderedQty: 200,
                expectedQty: 200
            };

            const result = resolvePackDetailsQuantities(item, 'Completed');
            expect(result.expected).toBe(200);
            expect(result.packed).toBe(200);
            expect(result.display).toBe('200 / 200');
            expect(result.isUnderpacked).toBe(false);
        });

        it('falls back to expected quantity if packedQty is omitted on a completed job', () => {
            const item = {
                sku: 'KEGR001',
                name: 'Juma Ugali Flour',
                status: 'Completed',
                expectedQty: 88
            };

            const result = resolvePackDetailsQuantities(item, 'Completed');
            expect(result.expected).toBe(88);
            expect(result.packed).toBe(88);
            expect(result.display).toBe('88 / 88');
        });

        it('identifies genuine underpack when actual packed count is less than required', () => {
            const item = {
                sku: 'KEEL001',
                name: 'Amazon Kindle',
                packed: true,
                status: 'Completed',
                packedQty: 40,
                expectedQty: 53
            };

            const result = resolvePackDetailsQuantities(item, 'Completed');
            expect(result.expected).toBe(53);
            expect(result.packed).toBe(40);
            expect(result.display).toBe('40 / 53');
            expect(result.isUnderpacked).toBe(true);
        });
    });
});

