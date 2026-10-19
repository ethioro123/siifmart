import { describe, it, expect } from 'vitest';
import { calculateStoreBonus } from '../../components/StoreBonusDisplay';
import {
    DEFAULT_POS_BONUS_TIERS,
    DEFAULT_POS_ROLE_DISTRIBUTION
} from '../../types';

describe('storeGamification', () => {
    describe('calculateStoreBonus', () => {
        it('returns starting tier with 0 bonus when below 500 points', () => {
            const { tier, bonus } = calculateStoreBonus(200, DEFAULT_POS_BONUS_TIERS);
            expect(tier.tierName).toBe('Starting');
            expect(bonus).toBe(0);
        });

        it('returns Bronze tier with base + per point calculation', () => {
            // Bronze: 500 - 1499, base 2000, perPoint 0.5
            const { tier, bonus } = calculateStoreBonus(1000, DEFAULT_POS_BONUS_TIERS);
            expect(tier.tierName).toBe('Bronze');
            expect(bonus).toBe(2000 + (1000 * 0.5)); // 2500
        });

        it('returns Gold tier for 4000 points', () => {
            // Gold: 3000 - 5999, base 10000, perPoint 1.0
            const { tier, bonus } = calculateStoreBonus(4000, DEFAULT_POS_BONUS_TIERS);
            expect(tier.tierName).toBe('Gold');
            expect(bonus).toBe(10000 + (4000 * 1.0)); // 14000
        });

        it('returns Diamond tier for 10000+ points', () => {
            // Diamond: 10000+, base 40000, perPoint 1.5
            const { tier, bonus } = calculateStoreBonus(12000, DEFAULT_POS_BONUS_TIERS);
            expect(tier.tierName).toBe('Diamond');
            expect(bonus).toBe(40000 + (12000 * 1.5)); // 58000
        });
        it('handles 0 points correctly at performance cycle initiation', () => {
            const { tier, bonus } = calculateStoreBonus(0, DEFAULT_POS_BONUS_TIERS);
            expect(tier.tierName).toBe('Starting');
            expect(bonus).toBe(0);
        });
    });

    describe('role distribution calculation', () => {
        it('allocates correct role percentages', () => {
            const { bonus } = calculateStoreBonus(4000, DEFAULT_POS_BONUS_TIERS); // 14000
            
            const storeManagerRole = DEFAULT_POS_ROLE_DISTRIBUTION.find(r => r.role === 'Store Manager');
            const cashierRole = DEFAULT_POS_ROLE_DISTRIBUTION.find(r => r.role === 'Cashier');

            expect(storeManagerRole?.percentage).toBe(30);
            expect(cashierRole?.percentage).toBe(12);

            const managerShare = (bonus * (storeManagerRole?.percentage || 0)) / 100;
            const cashierShare = (bonus * (cashierRole?.percentage || 0)) / 100;

            expect(managerShare).toBe(4200); // 30% of 14,000
            expect(cashierShare).toBe(1680); // 12% of 14,000
        });

        it('yields 0 personal bonus when pool is 0', () => {
            const { bonus } = calculateStoreBonus(0, DEFAULT_POS_BONUS_TIERS);
            const cashierRole = DEFAULT_POS_ROLE_DISTRIBUTION.find(r => r.role === 'Cashier');
            const cashierShare = (bonus * (cashierRole?.percentage || 0)) / 100;
            expect(cashierShare).toBe(0);
        });
    });
});
