import { supabase } from '../lib/supabase';
import type { ShiftRecord } from '../types';
import { logger } from '../utils/logger';

// Helper to map DB snake_case row to TypeScript camelCase ShiftRecord
export function mapShiftRow(row: any): ShiftRecord {
    return {
        id: row.id,
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

export const shiftsService = {
    /**
     * Get all shifts (optionally scoped by siteId)
     */
    async getAll(siteId?: string, limit: number = 25): Promise<ShiftRecord[]> {
        try {
            let query = supabase
                .from('shifts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(mapShiftRow);
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
                .select('*')
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
                .select('*')
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
        const id = shift.id || crypto.randomUUID();
        const startTime = shift.startTime || new Date().toISOString();

        const rawSiteId = shift.siteId || shift.site_id || null;

        const dbShift = {
            id,
            site_id: rawSiteId,
            home_site_id: shift.homeSiteId || shift.home_site_id || null,
            shift_number: shift.shiftNumber ? String(shift.shiftNumber) : (shift.shift_number ? String(shift.shift_number) : undefined),
            counter_number: shift.counterNumber || shift.counter_number || 'Counter 1',
            cashier_id: shift.cashierId ? String(shift.cashierId) : null,
            cashier_name: shift.cashierName || 'Staff Member',
            cashier_code: shift.cashierCode || shift.cashier_code || null,
            start_time: startTime,
            opening_float: Number(shift.openingFloat) || 0,
            cash_sales: Number(shift.cashSales) || 0,
            card_sales: Number(shift.cardSales) || 0,
            mobile_sales: Number(shift.mobileSales) || 0,
            expenses: Number(shift.expenses) || 0,
            cash_drops: Number(shift.cashDrops ?? shift.cash_drops) || 0,
            drop_count: Number(shift.dropCount) || 0,
            country_code: shift.countryCode || shift.country_code || 'ET',
            expected_cash: Number(shift.expectedCash ?? shift.openingFloat) || 0,
            actual_cash: Number(shift.actualCash) || 0,
            variance: Number(shift.variance) || 0,
            denominations: shift.denominations || {},
            discrepancy_reason: shift.discrepancyReason || null,
            status: shift.status || 'Open',
            notes: shift.notes || null,
            reconciliation_status: 'Pending'
        };

        try {
            // RLS-Aware: insert without select('*') chaining
            let { error } = await supabase
                .from('shifts')
                .insert(dbShift);

            // Resilient fallback for databases with a legacy NOT NULL constraint on end_time
            if (error && (error.code === '23502' || error.message?.includes('end_time'))) {
                logger.warn('shiftsService', 'Legacy shifts table enforces NOT NULL on end_time. Retrying with opening timestamp fallback.');
                const retryResult = await supabase
                    .from('shifts')
                    .insert({
                        ...dbShift,
                        end_time: startTime
                    });
                error = retryResult.error;
            }

            if (error) throw error;

            return {
                id,
                siteId: dbShift.site_id || '',
                homeSiteId: dbShift.home_site_id || undefined,
                home_site_id: dbShift.home_site_id || undefined,
                cashierId: dbShift.cashier_id || '',
                cashierName: dbShift.cashier_name || 'Staff Member',
                cashierCode: dbShift.cashier_code || undefined,
                cashier_code: dbShift.cashier_code || undefined,
                counterNumber: dbShift.counter_number,
                counter_number: dbShift.counter_number,
                startTime,
                openingFloat: dbShift.opening_float,
                cashSales: dbShift.cash_sales,
                cardSales: dbShift.card_sales,
                mobileSales: dbShift.mobile_sales,
                expenses: dbShift.expenses,
                cashDrops: dbShift.cash_drops,
                cash_drops: dbShift.cash_drops,
                dropCount: dbShift.drop_count,
                countryCode: dbShift.country_code,
                country_code: dbShift.country_code,
                expectedCash: dbShift.expected_cash,
                actualCash: dbShift.actual_cash,
                variance: dbShift.variance,
                denominations: dbShift.denominations,
                status: dbShift.status as 'Open' | 'Closed',
                reconciliationStatus: 'Pending',
                createdAt: startTime
            };
        } catch (error) {
            logger.error('shiftsService', 'create failed:', error as Error);
            throw error;
        }
    },

    /**
     * Update an existing shift (End of Shift / Close Register)
     * Strictly uses allowlist mapping (never spreads object)
     */
    async update(id: string, updates: Partial<ShiftRecord>): Promise<void> {
        const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (updates.counterNumber !== undefined || updates.counter_number !== undefined) {
            dbUpdates.counter_number = updates.counterNumber || updates.counter_number;
        }
        if (updates.cashierCode !== undefined || updates.cashier_code !== undefined) {
            dbUpdates.cashier_code = updates.cashierCode || updates.cashier_code;
        }
        if (updates.homeSiteId !== undefined || updates.home_site_id !== undefined) {
            dbUpdates.home_site_id = updates.homeSiteId || updates.home_site_id;
        }
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
        if (updates.cashSales !== undefined) dbUpdates.cash_sales = updates.cashSales;
        if (updates.cardSales !== undefined) dbUpdates.card_sales = updates.cardSales;
        if (updates.mobileSales !== undefined) dbUpdates.mobile_sales = updates.mobileSales;
        if (updates.expenses !== undefined) dbUpdates.expenses = updates.expenses;
        if (updates.cashDrops !== undefined || updates.cash_drops !== undefined) {
            dbUpdates.cash_drops = Number(updates.cashDrops ?? updates.cash_drops);
        }
        if (updates.dropCount !== undefined) dbUpdates.drop_count = updates.dropCount;
        if (updates.supervisorId !== undefined) dbUpdates.supervisor_id = updates.supervisorId;
        if (updates.supervisorName !== undefined) dbUpdates.supervisor_name = updates.supervisorName;
        if (updates.supervisorRole !== undefined) dbUpdates.supervisor_role = updates.supervisorRole;
        if (updates.supervisorSignedAt !== undefined) dbUpdates.supervisor_signed_at = updates.supervisorSignedAt;
        if (updates.expectedCash !== undefined) dbUpdates.expected_cash = updates.expectedCash;
        if (updates.actualCash !== undefined) dbUpdates.actual_cash = updates.actualCash;
        if (updates.variance !== undefined) dbUpdates.variance = updates.variance;
        if (updates.denominations !== undefined) dbUpdates.denominations = updates.denominations;
        if (updates.discrepancyReason !== undefined) dbUpdates.discrepancy_reason = updates.discrepancyReason;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.closedBy !== undefined) dbUpdates.closed_by = updates.closedBy;
        if (updates.reconciledBy !== undefined) dbUpdates.reconciled_by = updates.reconciledBy;
        if (updates.reconciledAt !== undefined) dbUpdates.reconciled_at = updates.reconciledAt;
        if (updates.reconciliationStatus !== undefined) dbUpdates.reconciliation_status = updates.reconciliationStatus;
        if (updates.hqNotes !== undefined) dbUpdates.hq_notes = updates.hqNotes;

        try {
            const { error } = await supabase
                .from('shifts')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            logger.error('shiftsService', 'update failed:', error as Error);
            throw error;
        }
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
        try {
            const dbUpdates: Record<string, unknown> = {
                reconciled_by: hqUserName,
                reconciled_at: new Date().toISOString(),
                reconciliation_status: status,
                status: status === 'Reconciled' ? 'Audited' : 'Flagged',
                updated_at: new Date().toISOString()
            };

            if (hqNotes !== undefined) {
                dbUpdates.hq_notes = hqNotes;
            }

            const { error } = await supabase
                .from('shifts')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            logger.error('shiftsService', 'reconcile failed:', error as Error);
            throw error;
        }
    }
};
