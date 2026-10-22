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
    const expectedCash = Number(row.expected_cash ?? (openingFloat + cashSales - expenses)) || 0;
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
    async getQueue(filters?: DrawerAuditFilter, limit: number = 100): Promise<DrawerReconciliationRecord[]> {
        try {
            let query = supabase
                .from('shifts')
                .select('*')
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
                query = query.lte('start_time', filters.endDate);
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
     * Head of Finance sign-off on cash drawer shift with supervisor co-attribution
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
        const now = new Date().toISOString();
        const updates: Record<string, any> = {
            reconciliation_status: action,
            finance_sign_off_by: financeUser.id,
            finance_sign_off_name: financeUser.name,
            finance_sign_off_at: now
        };

        if (options?.hqNotes) {
            updates.hq_notes = options.hqNotes;
        }

        if (options?.supervisorNotes) {
            updates.supervisor_co_sign_notes = options.supervisorNotes;
        }

        if (action === 'Flagged') {
            updates.variance_flagged = true;
            updates.status = 'Flagged';
        } else {
            updates.reconciled_by = financeUser.name;
            updates.reconciled_at = now;
            updates.status = 'Audited';
        }

        const { data, error } = await supabase
            .from('shifts')
            .update(updates)
            .eq('id', shiftId)
            .select()
            .single();

        if (error) {
            logger.error('drawerReconciliationService', 'signOff failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: financeUser.name,
            action: action === 'Reconciled' ? 'DRAWER_RECONCILED' : 'DRAWER_VARIANCE_FLAGGED',
            module: 'Financials',
            details: `Drawer shift #${shiftId.slice(0, 8)} signed off as ${action} by ${financeUser.name}. ${
                options?.hqNotes ? `Notes: "${options.hqNotes}"` : ''
            }`
        });

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
        const now = new Date().toISOString();
        const updates = {
            supervisor_id: supervisor.id,
            supervisor_name: supervisor.name,
            supervisor_co_sign_notes: notes,
            supervisor_signed_at: now,
            updated_at: now
        };

        const { data, error } = await supabase
            .from('shifts')
            .update(updates)
            .eq('id', shiftId)
            .select()
            .single();

        if (error) {
            logger.error('drawerReconciliationService', 'coSignSupervisor failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: supervisor.name,
            action: 'SHIFT_SUPERVISOR_COSIGNED',
            module: 'Financials',
            details: `Shift #${shiftId.slice(0, 8)} co-signed by supervisor ${supervisor.name}: "${notes}".`
        });

        return mapShiftToDrawerRecord(data);
    }
};
