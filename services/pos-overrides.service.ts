/**
 * Supervisory Overrides & Velocity Monitoring Service
 * Implements Rule 18 ("Captain Owns the Ship" doctrine) & Zero-Trust 4-Eyes Governance.
 * Tracks and audits all cashier overrides, voids, returns, and drawer kicks.
 * Triggers automated alerts when supervisory override velocity exceeds 3.0%.
 * Traceability: .agent/RULES.md (Rule 1, Rule 3, Rule 5, Rule 18)
 */

import { supabase } from '../lib/supabase';
import type { SupervisoryOverrideRecord, OverrideType, OverrideReasonCode } from '../types/pos-zero-trust';
import { logger } from '../utils/logger';

export interface OverrideVelocityStats {
    totalOverrides: number;
    totalTransactions: number;
    overrideVelocityRate: number; // percentage (e.g. 2.4%)
    isExcessive: boolean; // true if > 3.0%
    voidCount: number;
    refundCount: number;
    drawerKickCount: number;
    priceOverrideCount: number;
}

class POSOverridesService {
    private localCache: SupervisoryOverrideRecord[] = [];

    /**
     * Records a supervisory override with authenticated manager credentials and mandatory reason code.
     * Enforces Rule 18 and maker-checker validation.
     */
    async logOverride(params: {
        country_code: string;
        site_id: string;
        shift_id?: string;
        cashier: { id: string; name: string; code?: string };
        supervisor: { id: string; name: string; role: string; code?: string };
        override_type: OverrideType;
        reason_code: OverrideReasonCode;
        reason_details?: string;
        item_sku?: string;
        item_name?: string;
        original_value?: number;
        override_value?: number;
        device_id?: string;
        gps_coordinates?: string;
    }): Promise<SupervisoryOverrideRecord> {
        // 1. Dual-Control 4-Eyes Check
        if (params.cashier.id === params.supervisor.id ||
            (params.cashier.code && params.cashier.code === params.supervisor.code)) {
            throw new Error('4-Eyes Violation: Cashier cannot supervise or approve their own override.');
        }

        const now = new Date().toISOString();
        const record: SupervisoryOverrideRecord = {
            id: crypto.randomUUID(),
            country_code: params.country_code || 'ET',
            site_id: params.site_id,
            shift_id: params.shift_id,
            cashier_id: params.cashier.id,
            cashier_name: params.cashier.name,
            supervisor_id: params.supervisor.id,
            supervisor_name: params.supervisor.name,
            supervisor_role: params.supervisor.role,
            override_type: params.override_type,
            reason_code: params.reason_code,
            reason_details: params.reason_details,
            item_sku: params.item_sku,
            item_name: params.item_name,
            original_value: params.original_value || 0,
            override_value: params.override_value || 0,
            device_id: params.device_id,
            gps_coordinates: params.gps_coordinates,
            created_at: now
        };

        // 2. Persist to Supabase
        try {
            const { error } = await supabase
                .from('pos_supervisory_overrides')
                .insert({
                    id: record.id,
                    country_code: record.country_code,
                    site_id: record.site_id,
                    shift_id: record.shift_id,
                    cashier_id: record.cashier_id,
                    cashier_name: record.cashier_name,
                    supervisor_id: record.supervisor_id,
                    supervisor_name: record.supervisor_name,
                    supervisor_role: record.supervisor_role,
                    override_type: record.override_type,
                    reason_code: record.reason_code,
                    reason_details: record.reason_details,
                    item_sku: record.item_sku,
                    item_name: record.item_name,
                    original_value: record.original_value,
                    override_value: record.override_value,
                    device_id: record.device_id,
                    gps_coordinates: record.gps_coordinates,
                    created_at: record.created_at
                });

            if (error) {
                logger.warn('posOverridesService', 'Remote insert failed, using local cache:', { error: error.message });
                this.localCache.unshift(record);
            }
        } catch (err) {
            logger.warn('posOverridesService', 'Offline fallback during override insert:', { error: String(err) });
            this.localCache.unshift(record);
        }

        // 3. Tamper-Proof Audit Logging into system_logs
        try {
            const { systemLogsService } = await import('./supabase.service');
            await systemLogsService.create({
                module: 'SUPERVISORY_OVERRIDE_AUDIT',
                action: `OVERRIDE_${record.override_type.toUpperCase()}`,
                user_name: `${record.supervisor_name} (${record.supervisor_role})`,
                details: `Supervisory override granted for Cashier ${record.cashier_name}. Type: ${record.override_type}, Reason: ${record.reason_code}. Details: ${record.reason_details || 'N/A'}. GPS: ${record.gps_coordinates || 'N/A'}`
            });
        } catch {
            // Non-blocking log
        }

        return record;
    }

    /**
     * Retrieve recent supervisory overrides for a site
     */
    async getRecentOverrides(siteId: string, limit: number = 50): Promise<SupervisoryOverrideRecord[]> {
        try {
            let query = supabase
                .from('pos_supervisory_overrides')
                .select('*');

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            if (data && data.length > 0) return data as SupervisoryOverrideRecord[];
        } catch {
            // Fallback to local cache
        }
        return this.localCache.filter(o => !siteId || siteId === 'All' || o.site_id === siteId);
    }

    /**
     * Computes the Supervisory Override Velocity Rate and evaluates against the 3.0% threshold (Rule 18).
     */
    async computeVelocityStats(siteId: string, totalTransactionsToday: number = 100): Promise<OverrideVelocityStats> {
        const overrides = await this.getRecentOverrides(siteId, 500);
        
        // Count today's overrides
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysOverrides = overrides.filter(o => o.created_at.startsWith(todayStr));
        const totalOverrides = todaysOverrides.length;

        const effectiveTransactions = Math.max(totalTransactionsToday, totalOverrides, 1);
        const velocityRate = (totalOverrides / effectiveTransactions) * 100;
        const roundedRate = Math.round(velocityRate * 10) / 10;

        return {
            totalOverrides,
            totalTransactions: effectiveTransactions,
            overrideVelocityRate: roundedRate,
            isExcessive: roundedRate > 3.0,
            voidCount: todaysOverrides.filter(o => o.override_type === 'cart_void' || o.override_type === 'line_void').length,
            refundCount: todaysOverrides.filter(o => o.override_type === 'return_refund').length,
            drawerKickCount: todaysOverrides.filter(o => o.override_type === 'no_sale_drawer_kick').length,
            priceOverrideCount: todaysOverrides.filter(o => o.override_type === 'price_override').length
        };
    }
}

export const posOverridesService = new POSOverridesService();
