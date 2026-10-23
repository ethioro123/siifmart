import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), site: vi.fn(), master: vi.fn(), insert: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mocks.from } }));
import { ensureMaster } from '../../services/products/product-master.service';
const input = { siteId: 'dc', sku: 'ETBB002', name: 'Diaper', approved: false };
beforeEach(() => {
 vi.clearAllMocks();
 mocks.site.mockResolvedValue({ data: { country: 'ET', region_code: 'ET-ADD' }, error: null });
 mocks.master.mockResolvedValue({ data: null, error: null });
 mocks.from.mockImplementation(table => table === 'sites' ? { select: () => ({ eq: () => ({ maybeSingle: mocks.site }) }) } :
  { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.master }) }) }), insert: mocks.insert });
});
describe('receiving master linking', () => {
 it('allows a missing master without attempting forbidden national registration', async () => {
  expect(await ensureMaster(input, 'lookup-only')).toBeNull();
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it('links an existing authorized master', async () => {
  mocks.master.mockResolvedValue({ data: { id: 'master' }, error: null });
  expect(await ensureMaster(input, 'lookup-only')).toBe('master');
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it('propagates lookup errors instead of hiding access failures', async () => {
  mocks.master.mockResolvedValue({ data: null, error: new Error('Access denied') });
  await expect(ensureMaster(input, 'lookup-only')).rejects.toThrow('Access denied');
 });
 it('keeps normal catalog registration on its existing path', async () => {
  mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 'new-master' }, error: null }) }) });
  expect(await ensureMaster(input)).toBe('new-master');
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING', country_code: 'ET' }));
 });
});
