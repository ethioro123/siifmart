import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shelfTagsService } from '../../services/shelf-tags.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
   supabase: {
      from: vi.fn()
   }
}));

const storageMock = (() => {
   let store: Record<string, string> = {};
   return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
         store[key] = value.toString();
      },
      clear: () => {
         store = {};
      }
   };
})();

(globalThis as any).localStorage = storageMock;

describe('Shelf Tags Service Governance', () => {
   beforeEach(() => {
      vi.clearAllMocks();
      storageMock.clear();
   });

   it('fetches authoritative product directly for a site and rounds whole numbers', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
         data: {
            id: 'p-1',
            site_id: 'site-bole',
            sku: 'ET-COF-01',
            name: 'Coffee Beans',
            price: 250.75,
            cost_price: 180.2,
            sale_price: 220.4,
            is_on_sale: true,
            custom_attributes: { isHalal: true }
         },
         error: null
      });

      const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = vi.fn().mockReturnValue({ limit: limitMock });
      const ilikeMock = vi.fn().mockReturnValue({ eq: eqMock });
      const selectMock = vi.fn().mockReturnValue({ ilike: ilikeMock });

      (supabase.from as any).mockReturnValue({ select: selectMock });

      const prod = await shelfTagsService.fetchAuthoritativeProduct('site-bole', 'ET-COF-01');

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(ilikeMock).toHaveBeenCalledWith('sku', 'ET-COF-01');
      expect(eqMock).toHaveBeenCalledWith('site_id', 'site-bole');
      expect(prod).not.toBeNull();
      expect(prod?.price).toBe(251); // Math.round(250.75)
      expect(prod?.salePrice).toBe(220); // Math.round(220.4)
      expect(prod?.costPrice).toBe(180); // Math.round(180.2)
   });

   it('manages discrepancy lifecycle audit entries and transitions', () => {
      const scopeKey = 'ET_site-bole';

      const saved = shelfTagsService.saveAuditRecord(scopeKey, {
         siteId: 'site-bole',
         productId: 'p-1',
         sku: 'ET-COF-01',
         productName: 'Coffee Beans',
         systemPrice: 220,
         shelfPrice: 250,
         variance: 30,
         status: 'detected'
      });

      expect(saved.id).toBeDefined();
      expect(saved.status).toBe('detected');

      let records = shelfTagsService.getStoredAuditRecords(scopeKey);
      expect(records).toHaveLength(1);
      expect(records[0].status).toBe('detected');

      // Update to tag_queued
      shelfTagsService.updateAuditStatus(scopeKey, saved.id, 'tag_queued');
      records = shelfTagsService.getStoredAuditRecords(scopeKey);
      expect(records[0].status).toBe('tag_queued');

      // Update to printed
      shelfTagsService.updateAuditStatus(scopeKey, saved.id, 'printed');
      records = shelfTagsService.getStoredAuditRecords(scopeKey);
      expect(records[0].status).toBe('printed');

      // Update to verified
      shelfTagsService.updateAuditStatus(scopeKey, saved.id, 'verified');
      records = shelfTagsService.getStoredAuditRecords(scopeKey);
      expect(records[0].status).toBe('verified');
   });
});
