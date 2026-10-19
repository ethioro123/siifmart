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
        // 1. Dual-Control 4-Eyes Validation
        if (params.cashier.id === params.supervisor.id || 
            (params.cashier.code && params.cashier.code === params.supervisor.code)) {
            throw new Error('4-Eyes Violation: Cashier cannot supervise or co-sign their own cash drop.');
        }

        const dropAmount = Number(params.amount);
        if (!dropAmount || dropAmount <= 0) {
            throw new Error('Invalid cash drop amount: must be greater than zero.');
        }

        const dropNumber = `DROP-${Date.now().toString().slice(-6)}`;
        const now = new Date().toISOString();
        const countryCode = (params.country_code || 'ET').toUpperCase();

        const dropRecord: CashDropRecord = {
            id: crypto.randomUUID(),
            country_code: countryCode,
            site_id: params.site_id,
            shift_id: params.shift_id,
            drop_number: dropNumber,
            amount: dropAmount,
            currency: params.currency || (countryCode === 'KE' ? 'KSh' : 'ETB'),
            safe_bag_number: params.safe_bag_number,
            denominations: params.denominations || {},
            reason: params.reason || 'threshold_exceeded',
            notes: params.notes,
            cashier_id: params.cashier.id,
            cashier_name: params.cashier.name,
            supervisor_id: params.supervisor.id,
            supervisor_name: params.supervisor.name,
            supervisor_role: params.supervisor.role,
            device_id: params.device_id,
            gps_coordinates: params.gps_coordinates,
            status: 'deposited_in_safe',
            created_at: now,
            updated_at: now
        };

        // 2. Persist to Supabase
        try {
            const { error } = await supabase
                .from('pos_cash_drops')
                .insert({
                    id: dropRecord.id,
                    country_code: dropRecord.country_code,
                    site_id: dropRecord.site_id,
                    shift_id: dropRecord.shift_id,
                    drop_number: dropRecord.drop_number,
                    amount: dropRecord.amount,
                    currency: dropRecord.currency,
                    safe_bag_number: dropRecord.safe_bag_number,
                    denominations: dropRecord.denominations,
                    reason: dropRecord.reason,
                    notes: dropRecord.notes,
                    cashier_id: dropRecord.cashier_id,
                    cashier_name: dropRecord.cashier_name,
                    supervisor_id: dropRecord.supervisor_id,
                    supervisor_name: dropRecord.supervisor_name,
                    supervisor_role: dropRecord.supervisor_role,
                    device_id: dropRecord.device_id,
                    gps_coordinates: dropRecord.gps_coordinates,
                    status: dropRecord.status,
                    created_at: dropRecord.created_at,
                    updated_at: dropRecord.updated_at
                });

            if (error) {
                logger.warn('cashDropsService', 'Remote insert failed, using local cache:', { error: error.message });
                this.localCache.unshift(dropRecord);
            }
        } catch (err) {
            logger.warn('cashDropsService', 'Offline fallback during cash drop insert', { error: String(err) });
            this.localCache.unshift(dropRecord);
        }

        // 3. Synaptically Update Shift Totals (subtract cash drop from expected drawer cash)
        try {
            const shift = await shiftsService.getById(params.shift_id);
            if (shift) {
                const updatedDrops = (shift.cashDrops || shift.cash_drops || 0) + dropAmount;
                const updatedDropCount = (shift.dropCount || 0) + 1;
                const newExpectedCash = (shift.openingFloat + shift.cashSales) - updatedDrops;

                await shiftsService.update(params.shift_id, {
                    cashDrops: updatedDrops,
                    cash_drops: updatedDrops,
                    dropCount: updatedDropCount,
                    expectedCash: Math.max(0, newExpectedCash)
                });
            }
        } catch (shiftErr) {
            logger.warn('cashDropsService', 'Failed to update shift expected cash:', { error: String(shiftErr) });
        }

        // 4. Tamper-Proof Audit Trail (system_logs)
        try {
            const { systemLogsService } = await import('./supabase.service');
            await systemLogsService.create({
                module: 'POS_CASH_GOVERNANCE',
                action: 'SAFE_CASH_DROP_EXECUTED',
                user_name: `${params.cashier.name} & ${params.supervisor.name}`,
                details: `Mid-day cash drop of ${dropRecord.currency} ${dropRecord.amount.toLocaleString()} into Safe Bag #${dropRecord.safe_bag_number || 'N/A'}. Supervisor: ${params.supervisor.name} (${params.supervisor.role}). GPS: ${params.gps_coordinates || 'N/A'}`
            });
        } catch {
            // Non-blocking log
        }

        return dropRecord;
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
