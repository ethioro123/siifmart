import { beforeEach, describe, expect, it, vi } from 'vitest';
import { terminationsService } from '../../services/terminations.service';

let insertError: { message: string } | null = null;
let insertedTermination: any = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      insert: vi.fn((records: any[] | any) => {
        if (table !== 'termination_requests') return Promise.resolve({ data: records, error: null });
        const record = Array.isArray(records) ? records[0] : records;
        if (insertError) return { select: () => ({ single: async () => ({ data: null, error: insertError }) }) };
        insertedTermination = { ...record, created_at: record.created_at || new Date().toISOString(), updated_at: record.updated_at || new Date().toISOString() };
        return { select: () => ({ single: async () => ({ data: insertedTermination, error: null }) }) };
      })
    }))
  }
}));

const terminationInput = {
  country_code: 'ET',
  site_id: 'site-01',
  employee_id: 'employee-01',
  employee_name: 'Sensitive Employee',
  employee_role: 'cashier',
  reason_code: 'voluntary_resignation' as const,
  reason_details: 'Private offboarding details',
  effective_date: '2026-10-18',
  assets_returned: false,
  pos_access_revoked: false,
  wms_badge_deactivated: false,
  keys_surrendered: false,
  cash_drawer_reconciled: false,
  proposed_by: 'manager-01',
  proposed_by_name: 'Store Manager',
  proposed_by_role: 'store_manager'
};

describe('terminationsService sensitive persistence', () => {
  beforeEach(() => {
    insertError = null;
    insertedTermination = null;
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear()
    });
    terminationsService._clearCache();
    localStorage.clear();
  });

  it('fails closed when Supabase rejects a termination request', async () => {
    insertError = { message: 'offline' };

    await expect(terminationsService.proposeTermination(terminationInput))
      .rejects.toThrow(/Failed to submit termination request: offline/);
    expect(localStorage.getItem('siifmart_terminations_backup')).toBeNull();
  });

  it('keeps submitted termination details out of persistent browser storage', async () => {
    const setItem = vi.spyOn(localStorage, 'setItem');

    const record = await terminationsService.proposeTermination(terminationInput);

    expect(record.employee_name).toBe('Sensitive Employee');
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem('siifmart_terminations_backup')).toBeNull();
    setItem.mockRestore();
  });
});
