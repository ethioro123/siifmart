import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    issueSku, findMasterByBarcode, ensureMaster,
    approveMasterProduct, rejectMasterProduct, mergeMasterProduct
} from '../../services/products/product-master.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: { from: vi.fn(), rpc: vi.fn() }
}));

vi.mock('../../utils/logger', () => ({
    logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
}));

const chain = (result: unknown) => {
    const c: Record<string, unknown> = {};
    ['select', 'eq', 'insert'].forEach(m => { c[m] = vi.fn(() => c); });
    c.maybeSingle = vi.fn(() => Promise.resolve(result));
    c.single = vi.fn(() => Promise.resolve(result));
    return c;
};

describe('product-master.service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('issueSku calls the atomic RPC with upper-cased args', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: 'KEGR004', error: null } as never);
        await expect(issueSku('ke', 'gr')).resolves.toBe('KEGR004');
        expect(supabase.rpc).toHaveBeenCalledWith('next_sku', { p_country: 'KE', p_category_prefix: 'GR' });
    });

    it('issueSku throws RPC errors instead of swallowing them', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } } as never);
        await expect(issueSku('KE', 'GR')).rejects.toBeTruthy();
    });

    it('findMasterByBarcode returns null for blank barcode without calling the DB', async () => {
        await expect(findMasterByBarcode('KE', '  ')).resolves.toBeNull();
        expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('findMasterByBarcode returns the first match', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ id: 'm1', sku: 'KEGR001' }], error: null } as never);
        const res = await findMasterByBarcode('KE', '49998715');
        expect(res?.id).toBe('m1');
    });

    it('findMasterByBarcode degrades to null only when migration is missing', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never);
        await expect(findMasterByBarcode('KE', '123')).resolves.toBeNull();
    });

    it('ensureMaster reuses an existing master', async () => {
        vi.mocked(supabase.from)
            .mockReturnValueOnce(chain({ data: { country: 'KE', region_code: 'KE-NRB' }, error: null }) as never)
            .mockReturnValueOnce(chain({ data: { id: 'existing' }, error: null }) as never);
        const id = await ensureMaster({ siteId: 's1', sku: 'KEGR001', name: 'Flour', approved: false });
        expect(id).toBe('existing');
    });

    it('ensureMaster creates a PENDING master when not approved', async () => {
        const insertChain = chain({ data: { id: 'new' }, error: null });
        vi.mocked(supabase.from)
            .mockReturnValueOnce(chain({ data: { country: 'KE', region_code: 'KE-NRB' }, error: null }) as never)
            .mockReturnValueOnce(chain({ data: null, error: null }) as never)
            .mockReturnValueOnce(insertChain as never);
        const id = await ensureMaster({ siteId: 's1', sku: 'KEGR002', name: 'Rice', approved: false });
        expect(id).toBe('new');
        expect(insertChain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'PENDING', country_code: 'KE', origin_region_code: 'KE-NRB' })
        );
    });

    it('ensureMaster returns null while migration is not applied', async () => {
        vi.mocked(supabase.from)
            .mockReturnValueOnce(chain({ data: { country: 'KE', region_code: 'KE-NRB' }, error: null }) as never)
            .mockReturnValueOnce(chain({ data: null, error: { code: '42P01' } }) as never);
        await expect(ensureMaster({ siteId: 's1', sku: 'X', name: 'X', approved: false })).resolves.toBeNull();
    });

    it('approveMasterProduct updates master status and unlocks matching site products', async () => {
        const updateChain = chain({ data: null, error: null });
        vi.mocked(supabase.from)
            .mockReturnValueOnce(updateChain as never) // update product_master
            .mockReturnValueOnce(chain({ data: { country_code: 'KE', sku: 'KEGR001' }, error: null }) as never) // fetch sku
            .mockReturnValueOnce(chain({ data: null, error: null }) as never); // update products

        const result = await approveMasterProduct('m1', 'Amina Ali');
        expect(result).toBe(true);
        expect(updateChain.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'APPROVED', approved_by: 'Amina Ali' })
        );
    });

    it('rejectMasterProduct marks master as REJECTED and updates reason', async () => {
        const updateChain = chain({ data: null, error: null });
        vi.mocked(supabase.from)
            .mockReturnValueOnce(updateChain as never) // update product_master
            .mockReturnValueOnce(chain({ data: { sku: 'KEGR001' }, error: null }) as never) // fetch sku
            .mockReturnValueOnce(chain({ data: null, error: null }) as never); // update products

        const result = await rejectMasterProduct('m1', 'Juma Mwangi', 'Defective specs');
        expect(result).toBe(true);
        expect(updateChain.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'REJECTED', approved_by: 'Juma Mwangi' })
        );
    });

    it('mergeMasterProduct invokes the database RPC with upper-cased SKUs', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
            data: { status: 'success', surviving_sku: 'GN002', deprecated_sku: 'GN007' },
            error: null
        } as never);

        const res = await mergeMasterProduct('et', 'gn002', 'gn007');
        expect(res.status).toBe('success');
        expect(supabase.rpc).toHaveBeenCalledWith('merge_duplicate_product_sku', {
            p_country: 'ET',
            p_surviving_sku: 'GN002',
            p_deprecated_sku: 'GN007'
        });
    });
});

