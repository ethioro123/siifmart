import { supabase } from '../lib/supabase';
import type { ArInvoice, CustomerCreditLimit, ArAgingReport } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const accountsReceivableService = {
    /**
     * Get B2B AR invoices with country isolation
     */
    async getInvoices(countryCode: string = 'ET', customerId?: string, status?: string, limit: number = 25, offset: number = 0): Promise<ArInvoice[]> {
        try {
            // RULE 10: 25-record shelf limit
            let query = supabase
                .from('ar_invoices')
                .select('*')
                .eq('country_code', countryCode)
                .order('due_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (customerId) query = query.eq('customer_id', customerId);
            if (status && status !== 'All') query = query.eq('status', status);

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                invoiceNumber: row.invoice_number,
                customerId: row.customer_id,
                customerName: row.customer_name,
                siteId: row.site_id,
                countryCode: row.country_code,
                invoiceDate: row.invoice_date,
                dueDate: row.due_date,
                subtotal: Number(row.subtotal) || 0,
                taxAmount: Number(row.tax_amount) || 0,
                totalAmount: Number(row.total_amount) || 0,
                amountPaid: Number(row.amount_paid) || 0,
                balanceDue: Number(row.balance_due ?? (row.total_amount - (row.amount_paid || 0))) || 0,
                currency: row.currency || (countryCode === 'KE' ? 'KSh' : 'ETB'),
                paymentTerms: row.payment_terms || 'Net_30',
                status: row.status,
                notes: row.notes,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } catch (error) {
            logger.error('accountsReceivableService', 'getInvoices failed:', error as Error);
            return [];
        }
    },

    /**
     * Compute Accounts Receivable Aging report
     */
    async getAgingReport(countryCode: string = 'ET'): Promise<ArAgingReport> {
        const { data, error } = await supabase.rpc('ar_aging_totals', { p_country: countryCode });
        if (error) throw error;
        if (!data) throw new Error('Receivables totals unavailable');
        return {
            current: Number(data.current), days31to60: Number(data.days31to60),
            days61to90: Number(data.days61to90), days90Plus: Number(data.days90Plus), totalOutstanding: Number(data.totalOutstanding)
        };
    },

    /**
     * Set Customer Credit Limit (Credit Control Officer)
     */
    async setCreditLimit(
        customerId: string,
        customerName: string,
        creditLimit: number,
        countryCode: string,
        user: { id: string; name: string }
    ): Promise<CustomerCreditLimit> {
        const { data, error } = await supabase
            .from('customer_credit_limits')
            .upsert({
                customer_id: customerId,
                customer_name: customerName,
                credit_limit: creditLimit,
                country_code: countryCode,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            logger.error('accountsReceivableService', 'setCreditLimit error:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: user.name,
            action: 'CREDIT_LIMIT_UPDATED',
            module: 'Financials',
            details: `Updated credit limit for ${customerName} to ${creditLimit} ${countryCode}.`
        });

        return {
            customerId: data.customer_id,
            customerName: data.customer_name,
            creditLimit: Number(data.credit_limit),
            currentOutstanding: Number(data.current_outstanding || 0),
            availableCredit: Number(data.credit_limit) - Number(data.current_outstanding || 0),
            isHold: Boolean(data.is_hold),
            holdReason: data.hold_reason,
            countryCode: data.country_code
        };
    },

    /**
     * Put customer on credit hold / release hold (Credit Control Officer)
     */
    async toggleCreditHold(
        customerId: string,
        isHold: boolean,
        reason: string,
        countryCode: string,
        user: { id: string; name: string }
    ): Promise<void> {
        const { error } = await supabase
            .from('customer_credit_limits')
            .update({
                is_hold: isHold,
                hold_reason: isHold ? reason : null,
                updated_at: new Date().toISOString()
            })
            .eq('customer_id', customerId)
            .eq('country_code', countryCode);

        if (error) throw error;

        await systemLogsService.create({
            user_name: user.name,
            action: isHold ? 'CREDIT_HOLD_APPLIED' : 'CREDIT_HOLD_RELEASED',
            module: 'Financials',
            details: `${isHold ? 'Applied credit hold' : 'Released credit hold'} on customer ${customerId}. Reason: "${reason}".`
        });
    }
};
