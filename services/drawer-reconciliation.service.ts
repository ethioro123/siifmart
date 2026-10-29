import { counterControlService } from './counter-control.service';
import { supabase } from '../lib/supabase';
import type { DrawerReconciliationRecord, DrawerAuditFilter } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

// Default cash shortage/overage threshold triggering mandatory audit flag
const DEFAULT_VARIANCE_THRESHOLD = 500; // 500 ETB or 500 KSh

function mapShiftToDrawerRecord(row: any): DrawerReconciliationRecord {
    const openingFloat = Number(row.opening_float) || 0;
    const cashSales = Number(row.cash_sales) || 0;
    const cardSales = Number(row.card_sales) || 0;
    const mobileSales = Number(row.mobile_sales) || 0;
    const expenses = Number(row.expenses) || 0;
    const expectedCash = Number(row.expected_cash ?? (openingFloat + cashSales - (Number(row.cash_drops) || 0) - expenses)) || 0;
    const actualCash = Number(row.actual_cash) || 0;
    const variance = Number(row.variance ?? (actualCash - expectedCash)) || 0;

    return {
        id: row.id,
        shiftNumber: row.shift_number || row.id?.slice(0, 8),
        siteId: row.site_id,
        countryCode: row.country_code || 'ET',
        cashierId: row.cashier_id,
        cashierName: row.cashier_name || 'Staff Member',
        startTime: row.start_time || row.created_at,
        endTime: row.end_time,
        openingFloat,
        cashSales,
        cardSales,
        mobileSales,
        expenses,
        expectedCash,
        actualCash,
        variance,
        discrepancyReason: row.discrepancy_reason,
        status: row.status || 'Closed',
        reconciliationStatus: row.reconciliation_status || 'Pending',
        supervisorId: row.supervisor_id,
        supervisorName: row.supervisor_name,
        supervisorCoSignNotes: row.supervisor_co_sign_notes,
        supervisorSignedAt: row.supervisor_signed_at,
        financeSignOffBy: row.finance_sign_off_by,
        financeSignOffName: row.finance_sign_off_name,
        financeSignOffAt: row.finance_sign_off_at,
        varianceFlagged: Boolean(row.variance_flagged || Math.abs(variance) > DEFAULT_VARIANCE_THRESHOLD),
        hqNotes: row.hq_notes
    };
}

export const drawerReconciliationService = {
    /**
     * Get queue of drawer shifts requiring finance sign-off
     */
    async getQueue(filters?: DrawerAuditFilter, limit: number = 25): Promise<DrawerReconciliationRecord[]> {
        try {
            let query = supabase
                .from('shifts')
                .select('id,shift_number,site_id,country_code,cashier_id,cashier_name,start_time,end_time,opening_float,cash_sales,card_sales,mobile_sales,expenses,cash_drops,expected_cash,actual_cash,variance,discrepancy_reason,status,reconciliation_status,supervisor_id,supervisor_name,supervisor_co_sign_notes,supervisor_signed_at,finance_sign_off_by,finance_sign_off_name,finance_sign_off_at,variance_flagged,hq_notes')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (filters?.countryCode) {
                query = query.eq('country_code', filters.countryCode);
            }

            if (filters?.siteId && filters.siteId !== 'All') {
                query = query.eq('site_id', filters.siteId);
            }

            if (filters?.status && filters.status !== 'All') {
                query = query.eq('reconciliation_status', filters.status);
            }

            if (filters?.startDate) {
                query = query.gte('start_time', filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte('start_time', `${filters.endDate}T23:59:59.999Z`);
            }

            const { data, error } = await query;
            if (error) throw error;

            let records = (data || []).map(mapShiftToDrawerRecord);

            if (filters?.onlyFlaggedVariances) {
                records = records.filter(r => r.varianceFlagged);
            }

            return records;
        } catch (error) {
            logger.error('drawerReconciliationService', 'getQueue failed:', error as Error);
            throw error;
        }
    },

    /**
     * Country Finance Director sign-off on cash drawer shift with supervisor co-attribution
     */
    async signOff(
        shiftId: string,
        financeUser: { id: string; name: string; role?: string },
        action: 'Reconciled' | 'Flagged',
        options?: {
            hqNotes?: string;
            supervisorNotes?: string;
        }
    ): Promise<DrawerReconciliationRecord> {
        const data = await counterControlService.review(shiftId, 'finance', action, options?.hqNotes || '');
        return mapShiftToDrawerRecord(data);
    },

    /**
     * Attach on-duty supervisor co-attribution to shift (Rule 18)
     */
    async coSignSupervisor(
        shiftId: string,
        supervisor: { id: string; name: string },
        notes: string
    ): Promise<DrawerReconciliationRecord> {
        const data = await counterControlService.review(shiftId, 'supervisor', 'Flagged', notes);
        return mapShiftToDrawerRecord(data);
    }
};
