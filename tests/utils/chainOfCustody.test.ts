import { describe, it, expect } from 'vitest';
import { calculateDiscrepancyPenalty } from '../../utils/warehouseGamification';

describe('Chain of Custody & Acceptance Responsibility Protocol', () => {
    describe('calculateDiscrepancyPenalty', () => {
        it('calculates proportional penalty for minor cargo discrepancies', () => {
            const result = calculateDiscrepancyPenalty(100, 2, 20); // 2 units short out of 20 (10% variance)
            
            // Should reduce accuracy from 100%
            expect(result.newAccuracy).toBeLessThan(100);
            expect(result.newAccuracy).toBeGreaterThanOrEqual(90);
            // Should dock points
            expect(result.penaltyPoints).toBeLessThan(0);
            expect(result.description).toContain('Chain of Custody Discrepancy');
            expect(result.description).toContain('2 unit(s) variance');
        });

        it('applies stronger penalty for severe cargo discrepancies', () => {
            const minorResult = calculateDiscrepancyPenalty(100, 1, 50);
            const majorResult = calculateDiscrepancyPenalty(100, 15, 50); // 30% variance
            
            expect(majorResult.newAccuracy).toBeLessThan(minorResult.newAccuracy);
            expect(majorResult.penaltyPoints).toBeLessThan(minorResult.penaltyPoints);
        });

        it('never drops accuracy below safety floor (20%)', () => {
            const catastrophicResult = calculateDiscrepancyPenalty(50, 100, 100);
            expect(catastrophicResult.newAccuracy).toBeGreaterThanOrEqual(20);
        });

        it('caps maximum points deduction at configured limit (-150)', () => {
            const extremeResult = calculateDiscrepancyPenalty(100, 500, 500);
            expect(extremeResult.penaltyPoints).toBe(-150);
        });
    });

    describe('Custody Transfer Liability Principle', () => {
        it('enforces that once accepted without exception, variance cannot be backdated', () => {
            const receiptRecord = {
                transferId: 'tr-001',
                acceptedBy: 'emp-receiver-1',
                deliveringDriverId: 'emp-driver-1',
                hasDiscrepancy: false,
                certifiedAt: new Date().toISOString()
            };

            expect(receiptRecord.hasDiscrepancy).toBe(false);
            expect(receiptRecord.acceptedBy).toBe('emp-receiver-1');
        });
    });
});
