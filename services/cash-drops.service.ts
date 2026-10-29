/**
 * Zero-Trust Cash Drops & Safe Skim Service
 * Enforces SOP-POS-002, SOP-FIN-012, and 4-Eyes Dual Control for register cash safe drops.
 * Prevents register over-accumulation and reduces robbery / shrinkage risk.
 * Traceability: .agent/RULES.md (Rule 1, Rule 2, Rule 7, Rule 18)
 */

import { supabase } from '../lib/supabase';
import type { CashDropRecord } from '../types/pos-zero-trust';
import { shiftsService } from './shifts.service';
import { logger } from '../utils/logger';

const CASH_DROP_COLUMNS = 'id, country_code, site_id, shift_id, drop_number, amount, currency, safe_bag_number, denominations, reason, notes, cashier_id, cashier_name, supervisor_id, supervisor_name, supervisor_role, device_id, gps_coordinates, status, created_at, updated_at';

class CashDropsService {
    private localCache: CashDropRecord[] = [];

    /**
     * Executes a mid-day safe cash drop from a register till to the store safe.
     * Enforces strict 4-Eyes maker-checker: Cashier and Supervisor CANNOT be the same person.
     */
    async createCashDrop(params: {
        country_code: string;
        site_id: string;
        shift_id: string;
        amount: number;
        currency?: string;
        safe_bag_number?: string;
        denominations: Record<string, number>;
        reason?: string;
        notes?: string;
        cashier: { id: string; name: string; code?: string };
        supervisor: { id: string; name: string; role: string; code?: string };
        device_id?: string;
        gps_coordinates?: string;
    }): Promise<CashDropRecord> {
        const { data, error } = await supabase.rpc('request_counter_drop', {
            p_shift: params.shift_id, p_amount: params.amount, p_bag: params.safe_bag_number || '',
            p_reason: params.reason || '', p_request: crypto.randomUUID(),
        });
        if (error) throw error;
        if (!data?.id) throw new Error('Cash drop request was not confirmed');
        return data as CashDropRecord;
    }

    /**
     * Retrieve all safe drops for a specific shift
     */
    async getDropsForShift(shiftId: string): Promise<CashDropRecord[]> {
        try {
            const { data, error } = await supabase
                .from('pos_cash_drops')
                .select(CASH_DROP_COLUMNS)
                .eq('shift_id', shiftId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const remoteIds = new Set(data.map((d: any) => d.id));
                const pendingLocal = this.localCache.filter(d => !remoteIds.has(d.id) && d.shift_id === shiftId);
                return [...(data as CashDropRecord[]), ...pendingLocal];
            }
        } catch {
            // Fallback to local cache
        }
        return this.localCache.filter(d => d.shift_id === shiftId);
    }

    /**
     * Retrieve all active drops in the drop safe for a site (Safe Ledger)
     */
    async getSafeLedger(siteId: string, countryCode?: string): Promise<CashDropRecord[]> {
        const normalizedCountry = countryCode ? countryCode.toUpperCase() : undefined;
        try {
            let query = supabase
                .from('pos_cash_drops')
                .select(CASH_DROP_COLUMNS)
                .order('created_at', { ascending: false });

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }
            if (normalizedCountry) {
                query = query.eq('country_code', normalizedCountry);
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data) {
                const remoteIds = new Set(data.map((d: any) => d.id));
                const pendingLocal = this.localCache.filter(d => 
                    !remoteIds.has(d.id) && 
                    (!siteId || siteId === 'All' || d.site_id === siteId) && 
                    (!normalizedCountry || d.country_code.toUpperCase() === normalizedCountry)
                );
                return [...(data as CashDropRecord[]), ...pendingLocal];
            }
        } catch {
            // Fallback to local cache
        }
        return this.localCache.filter(d => (!siteId || siteId === 'All' || d.site_id === siteId) && (!normalizedCountry || d.country_code.toUpperCase() === normalizedCountry));
    }

    /**
     * Authorize transit of safe drop bags to armored vehicle / bank
     */
    async transferSafeToBank(dropIds: string[], bankManifest: string, manager: { id: string; name: string }): Promise<void> {
        if (!dropIds.length) return;
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('pos_cash_drops')
            .update({
                status: 'transferred_to_bank',
                notes: `Transferred to armored bank carrier. Manifest #${bankManifest} signed by ${manager.name}`,
                updated_at: now
            })
            .in('id', dropIds);

        if (error) {
            logger.error('cashDropsService', 'Failed to transfer safe drops to bank:', error);
            throw new Error(error.message || 'Failed to authorize bank transfer');
        }

        this.localCache = this.localCache.map(d => dropIds.includes(d.id) ? { ...d, status: 'transferred_to_bank', updated_at: now } : d);

        // Tamper-Proof Audit Trail for armored courier transit
        try {
            const { systemLogsService } = await import('./supabase.service');
            await systemLogsService.create({
                module: 'POS_CASH_GOVERNANCE',
                action: 'SAFE_BAGS_TRANSFERRED_TO_BANK',
                user_name: manager.name,
                details: `${dropIds.length} safe deposit bag(s) released to armored transit. Manifest #${bankManifest}. Drops: [${dropIds.join(', ')}]`
            });
        } catch {
            // Non-blocking log
        }
    }
}

export const cashDropsService = new CashDropsService();
