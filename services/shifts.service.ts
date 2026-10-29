import { supabase } from '../lib/supabase';
import type { ShiftRecord } from '../types';
import { logger } from '../utils/logger';

// Helper to map DB snake_case row to TypeScript camelCase ShiftRecord
export function mapShiftRow(row: any): ShiftRecord {
    return {
        id: row.id,
        countSubmittedAt: row.count_submitted_at,
        ledgerVersion: row.ledger_version,
        shiftNumber: row.shift_number,
        shift_number: row.shift_number,
        siteId: row.site_id,
        site_id: row.site_id,
        homeSiteId: row.home_site_id,
        home_site_id: row.home_site_id,
        cashierId: row.cashier_id,
        cashierName: row.cashier_name || 'Staff Member',
        counterNumber: row.counter_number || 'Counter 1',
        counter_number: row.counter_number || 'Counter 1',
        terminalId: row.terminal_id || undefined,
        terminal_id: row.terminal_id || undefined,
        cashierCode: row.cashier_code,
        cashier_code: row.cashier_code,
        startTime: row.start_time || row.created_at,
        endTime: row.status === 'Open' ? undefined : (row.end_time || undefined),
        openingFloat: Number(row.opening_float) || 0,
        cashSales: Number(row.cash_sales) || 0,
        cardSales: Number(row.card_sales) || 0,
        mobileSales: Number(row.mobile_sales) || 0,
        expenses: Number(row.expenses) || 0,
        expectedCash: Number(row.expected_cash) || 0,
        actualCash: Number(row.actual_cash) || 0,
        variance: Number(row.variance) || 0,
        denominations: row.denominations || {},
        discrepancyReason: row.discrepancy_reason || '',
        status: row.status || 'Open',
        notes: row.notes,
        closedBy: row.closed_by,
        reconciledBy: row.reconciled_by,
        reconciledAt: row.reconciled_at,
        reconciliationStatus: row.reconciliation_status || 'Pending',
        hqNotes: row.hq_notes,
        cashDrops: Number(row.cash_drops) || 0,
        cash_drops: Number(row.cash_drops) || 0,
        dropCount: Number(row.drop_count) || 0,
        countryCode: row.country_code || 'ET',
        country_code: row.country_code || 'ET',
        supervisorId: row.supervisor_id,
        supervisorName: row.supervisor_name,
        supervisorRole: row.supervisor_role,
        supervisorSignedAt: row.supervisor_signed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

const SHIFT_COLUMNS = 'id,site_id,country_code,cashier_id,cashier_name,cashier_code,counter_number,terminal_id,start_time,end_time,opening_float,cash_sales,card_sales,mobile_sales,expenses,cash_drops,drop_count,expected_cash,actual_cash,variance,denominations,discrepancy_reason,status,notes,closed_by,reconciled_by,reconciled_at,reconciliation_status,hq_notes,supervisor_id,supervisor_name,supervisor_role,supervisor_signed_at,shift_number,home_site_id,created_at,count_submitted_at,ledger_version';

export const shiftsService = {
    /**
     * Get all shifts (optionally scoped by siteId)
     */
    async getAll(siteId?: string | string[], limit: number = 25): Promise<ShiftRecord[]> {
        try {
            if (!siteId || siteId === 'All' || (Array.isArray(siteId) && !siteId.length)) return [];
            const scope = (query: ReturnType<ReturnType<typeof supabase.from>['select']>) => Array.isArray(siteId) ? query.in('site_id', siteId) : query.eq('site_id', siteId);
            const [active, history] = await Promise.all([
                scope(supabase.from('shifts').select(SHIFT_COLUMNS)).eq('status', 'Open').order('start_time').limit(100),
                scope(supabase.from('shifts').select(SHIFT_COLUMNS)).neq('status', 'Open').order('created_at', { ascending: false }).limit(limit),
            ]);
            if (active.error) throw active.error; if (history.error) throw history.error;
            return [...(active.data || []), ...(history.data || [])].map(mapShiftRow);
        } catch (error) {
            logger.error('shiftsService', 'getAll failed:', error as Error);
            throw error;
        }
    },

    /**
     * Get active/open shift for a specific cashier
     */
    async getActive(cashierId: string, siteId?: string): Promise<ShiftRecord | null> {
        try {
            let query = supabase
                .from('shifts')
                .select(SHIFT_COLUMNS)
                .eq('cashier_id', cashierId)
                .eq('status', 'Open')
                .order('created_at', { ascending: false })
                .limit(1);

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query;
            if (error) throw error;
            if (!data || data.length === 0) return null;
            return mapShiftRow(data[0]);
        } catch (error) {
            logger.error('shiftsService', 'getActive failed:', error as Error);
            throw error;
        }
    },

    /**
     * Get shift by ID
     */
    async getById(id: string): Promise<ShiftRecord | null> {
        try {
            const { data, error } = await supabase
                .from('shifts')
                .select(SHIFT_COLUMNS)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return null;
            return mapShiftRow(data);
        } catch (error) {
            logger.error('shiftsService', 'getById failed:', error as Error);
            throw error;
        }
    },

    /**
     * Create a new shift (Opening Float submission)
     */
    async create(shift: Partial<ShiftRecord>): Promise<ShiftRecord> {
        const { counterControlService } = await import('./counter-control.service');
        if (!shift.siteId || !Number.isFinite(shift.openingFloat)) throw new Error('A site and opening float are required');
        return counterControlService.open(shift.siteId, shift.counterNumber || 'Counter 1', shift.openingFloat!, shift.id || crypto.randomUUID());
    },

    /**
     * Update an existing shift (End of Shift / Close Register)
     * Strictly uses allowlist mapping (never spreads object)
     */
    async update(id: string, updates: Partial<ShiftRecord>): Promise<void> {
        if (updates.status !== 'Closed' || !updates.denominations) throw new Error('Use the authorized counter operation');
        const { counterControlService } = await import('./counter-control.service');
        await counterControlService.close({ ...updates, id } as ShiftRecord);
    },

    /**
     * HQ Reconciliation Sign-off (Zero-Trust Dual-Control)
     */
    async reconcile(
        id: string,
        hqUserName: string,
        status: 'Reconciled' | 'Discrepancy_Flagged' = 'Reconciled',
        hqNotes?: string
    ): Promise<void> {
        const { counterControlService } = await import('./counter-control.service');
        await counterControlService.review(id, 'finance', status === 'Reconciled' ? 'Reconciled' : 'Flagged', hqNotes || '');
    }
};
