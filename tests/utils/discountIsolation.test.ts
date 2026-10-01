// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { DiscountCodeSchema } from '../../schemas/discount-code.schema';
import { renderHook } from '@testing-library/react';
import { useDiscountCodesState } from '../../contexts/hooks/useDiscountCodesState';

describe('Discount & Promotional Code Multi-Country Isolation & Validation', () => {
  describe('DiscountCodeSchema (Zod Validation & Anti-Tampering)', () => {
    it('accepts valid country-bound discount codes', () => {
      const validData = {
        code: 'JAMHURI20',
        name: 'Jamhuri Day Special',
        type: 'PERCENTAGE',
        value: 20,
        country: 'KE',
        validFrom: '2026-12-01',
        validUntil: '2026-12-31',
      };

      const result = DiscountCodeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects percentage discounts greater than 100%', () => {
      const invalidData = {
        code: 'FREE150',
        name: 'Excessive Discount',
        type: 'PERCENTAGE',
        value: 150,
        country: 'ET',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      };

      const result = DiscountCodeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Percentage discount cannot exceed 100%');
      }
    });

    it('rejects invalid date range where validUntil is before validFrom', () => {
      const invalidData = {
        code: 'TIMETRAVEL',
        name: 'Backwards Promo',
        type: 'FIXED',
        value: 50,
        country: 'KE',
        validFrom: '2026-12-31',
        validUntil: '2026-01-01',
      };

      const result = DiscountCodeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Valid Until date cannot be earlier');
      }
    });
  });

  describe('Cross-Border Voucher Isolation (AGENTS.md Rule §2)', () => {
    it('rejects Ethiopian promotional vouchers at Kenyan POS checkout', () => {
      const { result } = renderHook(() => useDiscountCodesState({ addNotification: () => {} }));
      
      // SAVE50 is an Ethiopian ET voucher
      const validation = result.current.validateDiscountCode('SAVE50', 'site-ke-1', 500, 'KE');
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid discount code for this market');
    });

    it('rejects Kenyan promotional vouchers at Ethiopian POS checkout', () => {
      const { result } = renderHook(() => useDiscountCodesState({ addNotification: () => {} }));
      
      // MASHUJAA50 is a Kenyan KE voucher
      const validation = result.current.validateDiscountCode('MASHUJAA50', 'site-et-1', 500, 'ET');
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid discount code for this market');
    });

    it('allows valid voucher when entered in its native country market', () => {
      const { result } = renderHook(() => useDiscountCodesState({ addNotification: () => {} }));
      
      // KARIBU10 in Kenya
      const keValidation = result.current.validateDiscountCode('KARIBU10', 'site-ke-1', 500, 'KE');
      expect(keValidation.valid).toBe(true);
      expect(keValidation.discountCode?.currency).toBe('KSh');
      expect(keValidation.discountCode?.value).toBe(10);

      // WELCOME10 in Ethiopia
      const etValidation = result.current.validateDiscountCode('WELCOME10', 'site-et-1', 500, 'ET');
      expect(etValidation.valid).toBe(true);
      expect(etValidation.discountCode?.currency).toBe('ETB');
      expect(etValidation.discountCode?.value).toBe(10);
    });

    it('enforces minimum purchase amounts in local currency', () => {
      const { result } = renderHook(() => useDiscountCodesState({ addNotification: () => {} }));
      
      // MASHUJAA50 requires minPurchaseAmount = 250 KSh
      const underSubtotal = result.current.validateDiscountCode('MASHUJAA50', 'site-ke-1', 150, 'KE');
      expect(underSubtotal.valid).toBe(false);
      expect(underSubtotal.error).toContain('Minimum purchase of KSh 250 required');

      const validSubtotal = result.current.validateDiscountCode('MASHUJAA50', 'site-ke-1', 300, 'KE');
      expect(validSubtotal.valid).toBe(true);
    });
  });
});
