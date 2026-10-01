import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discountCodesService, mapDiscountCodeRow } from '../../services/discount-codes.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('discountCodesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapDiscountCodeRow', () => {
    it('correctly maps snake_case DB row to camelCase DiscountCode with country scoping', () => {
      const dbRow = {
        id: 'dc-1',
        code: 'KARIBU10',
        name: 'Welcome Kenya',
        type: 'PERCENTAGE',
        value: '10',
        country_code: 'KE',
        currency: 'KSh',
        min_purchase_amount: '100',
        max_discount_amount: '500',
        valid_from: '2026-01-01',
        valid_until: '2026-12-31',
        usage_limit: 50,
        usage_count: 5,
        status: 'Active',
        applicable_sites: ['site-ke-1'],
        description: 'New shopper discount',
        created_by: 'HQ Admin',
        created_at: '2026-01-01T00:00:00Z',
      };

      const mapped = mapDiscountCodeRow(dbRow);
      expect(mapped.id).toBe('dc-1');
      expect(mapped.code).toBe('KARIBU10');
      expect(mapped.value).toBe(10);
      expect(mapped.country).toBe('KE');
      expect(mapped.country_code).toBe('KE');
      expect(mapped.currency).toBe('KSh');
      expect(mapped.minPurchaseAmount).toBe(100);
      expect(mapped.maxDiscountAmount).toBe(500);
      expect(mapped.applicableSites).toEqual(['site-ke-1']);
    });
  });

  describe('getAll', () => {
    it('fetches discount codes filtered strictly by country_code', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: 'dc-ke-1', code: 'MASHUJAA', type: 'FIXED', value: 50, country_code: 'KE' }
        ],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      // Chain eq after select
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });

      const result = await discountCodesService.getAll('KE');
      expect(supabase.from).toHaveBeenCalledWith('discount_codes');
      expect(mockEq).toHaveBeenCalledWith('country_code', 'KE');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('MASHUJAA');
    });
  });

  describe('validateCode', () => {
    it('rejects cross-border codes: Ethiopian code at Kenyan terminal returns error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null, // No match in KE partition
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });

      const result = await discountCodesService.validateCode('SAVE50', 'KE');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid discount code for this market');
    });

    it('successfully validates active code in correct country partition', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'dc-ke-1',
          code: 'KARIBU10',
          name: 'Welcome Kenya',
          type: 'PERCENTAGE',
          value: 10,
          country_code: 'KE',
          currency: 'KSh',
          status: 'Active',
          valid_from: '2024-01-01',
          valid_until: '2028-12-31',
          usage_limit: 100,
          usage_count: 10,
        },
        error: null,
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });

      const result = await discountCodesService.validateCode('KARIBU10', 'KE', 'site-ke-1', 500);
      expect(result.valid).toBe(true);
      expect(result.discountCode?.code).toBe('KARIBU10');
      expect(result.discountCode?.currency).toBe('KSh');
    });
  });
});
