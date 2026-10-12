import { supabase } from '../lib/supabase';
import type { PettyCashAccount, PettyCashVoucher, PettyCashReplenishment } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const pettyCashService = {
    /**
     * Get petty cash account for site
     */
    async getAccount(siteId: string, countryCode: string = 'ET'): Promise<PettyCashAccount | null> {
        try {
            const { data, error } = await supabase
                .from('petty_cash_accounts')
                .select('*')
                .eq('site_id', siteId)
                .eq('country_code', countryCode)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                siteId: data.site_id,
                siteName: data.site_name,
                countryCode: data.country_code,
                currency: data.currency || (countryCode === 'KE' ? 'KSh' : 'ETB'),
                authorizedFloat: Number(data.authorized_float) || 10000,
                currentBalance: Number(data.current_balance) || 10000,
                custodianId: data.custodian_id,
                custodianName: data.custodian_name,
                lastReplenishedAt: data.last_replenished_at
            };
        } catch {
            return null;
        }
    },

    /**
     * Get petty cash vouchers for branch
     */
    async getVouchers(siteId: string, countryCode: string = 'ET'): Promise<PettyCashVoucher[]> {
        try {
            const { data, error } = await supabase
                .from('petty_cash_vouchers')
                .select('*')
                .eq('site_id', siteId)
                .eq('country_code', countryCode)
                .order('voucher_date', { ascending: false });

            if (error) throw error;

            return (data || []).map((v: any) => ({
                id: v.id,
                voucherNumber: v.voucher_number,
                siteId: v.site_id,
                countryCode: v.country_code,
                voucherDate: v.voucher_date,
                category: v.category,
                description: v.description,
                amount: Number(v.amount) || 0,
                receiptAttached: Boolean(v.receipt_attached),
                paidTo: v.paid_to,
                approvedById: v.approved_by_id,
                approvedByName: v.approved_by_name,
                createdById: v.created_by_id,
                createdByName: v.created_by_name,
                status: v.status
            }));
        } catch (error) {
            logger.error('pettyCashService', 'getVouchers error:', error as Error);
            return [];
        }
    },

    /**
     * Record a petty cash voucher spend
     */
    async recordVoucher(
        voucher: Omit<PettyCashVoucher, 'id' | 'voucherNumber' | 'status' | 'createdById' | 'createdByName'> & {
            createdById?: string;
            createdByName?: string;
        },
        user: { id: string; name: string }
    ): Promise<PettyCashVoucher> {
        const voucherNumber = `PCV-${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase
            .from('petty_cash_vouchers')
            .insert({
                voucher_number: voucherNumber,
                site_id: voucher.siteId,
                country_code: voucher.countryCode,
                voucher_date: voucher.voucherDate,
                category: voucher.category,
                description: voucher.description,
                amount: voucher.amount,
                receipt_attached: voucher.receiptAttached,
                paid_to: voucher.paidTo,
                created_by_id: user.id,
                created_by_name: user.name,
                status: 'Approved'
            })
            .select()
            .single();

        if (error) {
            logger.error('pettyCashService', 'recordVoucher error:', error);
            throw error;
        }

        // Deduct from current balance
        await supabase.rpc('decrement_petty_cash_balance', {
            p_site_id: voucher.siteId,
            p_amount: voucher.amount
        });

        await systemLogsService.create({
            user_name: user.name,
            action: 'PETTY_CASH_VOUCHER_ISSUED',
            module: 'Financials',
            details: `Voucher ${voucherNumber} for ${voucher.amount} (${voucher.category}) paid to ${voucher.paidTo}.`
        });

        return {
            id: data.id,
            voucherNumber: data.voucher_number,
            siteId: data.site_id,
            countryCode: data.country_code,
            voucherDate: data.voucher_date,
            category: data.category,
            description: data.description,
            amount: Number(data.amount),
            receiptAttached: Boolean(data.receipt_attached),
            paidTo: data.paid_to,
            createdById: data.created_by_id,
            createdByName: data.created_by_name,
            status: data.status
        };
    },

    /**
     * Request float replenishment (Branch Manager -> Treasury)
     */
    async requestReplenishment(
        siteId: string,
        amount: number,
        currentBalance: number,
        countryCode: string,
        user: { id: string; name: string }
    ): Promise<PettyCashReplenishment> {
        const requestNumber = `PCR-${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase
            .from('petty_cash_replenishments')
            .insert({
                request_number: requestNumber,
                site_id: siteId,
                country_code: countryCode,
                amount_requested: amount,
                current_float_balance: currentBalance,
                status: 'Requested',
                requested_by_id: user.id,
                requested_by_name: user.name
            })
            .select()
            .single();

        if (error) throw error;

        await systemLogsService.create({
            user_name: user.name,
            action: 'PETTY_CASH_REPLENISHMENT_REQUESTED',
            module: 'Financials',
            details: `Site ${siteId} requested petty cash replenishment of ${amount} ${countryCode}. Current float: ${currentBalance}.`
        });

        return {
            id: data.id,
            requestNumber: data.request_number,
            siteId: data.site_id,
            countryCode: data.country_code,
            amountRequested: Number(data.amount_requested),
            currentFloatBalance: Number(data.current_float_balance),
            status: data.status,
            requestedById: data.requested_by_id,
            requestedByName: data.requested_by_name,
            createdAt: data.created_at
        };
    }
};
