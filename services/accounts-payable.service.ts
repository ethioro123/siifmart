import { supabase } from '../lib/supabase';
import type { VendorInvoice, InvoiceItem, PaymentRun, InvoiceMatchStatus } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

function mapInvoiceRow(row: any, items: InvoiceItem[] = []): VendorInvoice {
    return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        poId: row.po_id,
        poNumber: row.po_number,
        receivingRecordId: row.receiving_record_id,
        receivingManifestNumber: row.receiving_manifest_number,
        siteId: row.site_id,
        countryCode: row.country_code || 'ET',
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        subtotal: Number(row.subtotal) || 0,
        taxAmount: Number(row.tax_amount) || 0,
        totalAmount: Number(row.total_amount) || 0,
        amountPaid: Number(row.amount_paid) || 0,
        currency: row.currency || 'ETB',
        matchStatus: (row.match_status as InvoiceMatchStatus) || 'Pending_Match',
        matchDiscrepancyNotes: row.match_discrepancy_notes,
        status: row.status || 'Draft',
        items,
        createdById: row.created_by_id,
        approvedById: row.approved_by_id,
        approvedAt: row.approved_at,
        overrideReason: row.override_reason,
        paymentRunId: row.payment_run_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export const accountsPayableService = {
    /**
     * Perform 3-Way Match evaluation on invoice items
     */
    evaluateThreeWayMatch(items: Array<Omit<InvoiceItem, 'id' | 'invoiceId' | 'matchVariancePct'>>): {
        status: InvoiceMatchStatus;
        notes: string;
        evaluatedItems: Array<Omit<InvoiceItem, 'id' | 'invoiceId'> & { matchVariancePct: number }>;
    } {
        let hasQuantityDiscrepancy = false;
        let hasPriceDiscrepancy = false;
        const notes: string[] = [];

        const evaluatedItems = items.map(item => {
            const qtyVariance = item.invoicedQuantity - item.receivedQuantity;
            const priceVariance = item.invoicedUnitPrice - item.poUnitPrice;
            const variancePct = item.poUnitPrice > 0
                ? Number(((priceVariance / item.poUnitPrice) * 100).toFixed(2))
                : 0;

            if (qtyVariance > 0.001) {
                hasQuantityDiscrepancy = true;
                notes.push(`[${item.itemName}] Invoiced quantity (${item.invoicedQuantity}) exceeds received dock count (${item.receivedQuantity}).`);
            }

            if (priceVariance > 0.01) {
                hasPriceDiscrepancy = true;
                notes.push(`[${item.itemName}] Invoiced unit price (${item.invoicedUnitPrice}) exceeds authorized PO unit price (${item.poUnitPrice}).`);
            }

            return {
                ...item,
                matchVariancePct: variancePct
            };
        });

        let status: InvoiceMatchStatus = 'Matched';
        if (hasQuantityDiscrepancy) {
            status = 'Discrepancy_Quantity';
        } else if (hasPriceDiscrepancy) {
            status = 'Discrepancy_Price';
        }

        return {
            status,
            notes: notes.join(' | ') || 'All line quantities and unit prices matched against PO and receiving manifest.',
            evaluatedItems
        };
    },

    /**
     * Get vendor invoices with optional filters
     */
    async getInvoices(filters?: { countryCode?: string; siteId?: string; status?: string; includeItems?: boolean }, limit: number = 25, offset: number = 0): Promise<VendorInvoice[]> {
        try {
            // RULE 10: Lazy loading and 25-item shelf limit
            const selectFields = filters?.includeItems ? '*, invoice_items(*)' : '*';
            let query = supabase
                .from('vendor_invoices')
                .select(selectFields)
                .order('due_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (filters?.countryCode) {
                query = query.eq('country_code', filters.countryCode);
            }

            if (filters?.siteId && filters.siteId !== 'All') {
                query = query.eq('site_id', filters.siteId);
            }

            if (filters?.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((row: any) => {
                const items: InvoiceItem[] = (row.invoice_items || []).map((i: any) => ({
                    id: i.id,
                    invoiceId: i.invoice_id,
                    productId: i.product_id,
                    sku: i.sku,
                    itemName: i.item_name,
                    poQuantity: Number(i.po_quantity) || 0,
                    receivedQuantity: Number(i.received_quantity) || 0,
                    invoicedQuantity: Number(i.invoiced_quantity) || 0,
                    poUnitPrice: Number(i.po_unit_price) || 0,
                    invoicedUnitPrice: Number(i.invoiced_unit_price) || 0,
                    taxRate: Number(i.tax_rate) || 0,
                    totalPrice: Number(i.total_price) || 0,
                    matchVariancePct: Number(i.match_variance_pct) || 0
                }));
                return mapInvoiceRow(row, items);
            });
        } catch (error) {
            logger.error('accountsPayableService', 'getInvoices failed:', error as Error);
            throw error;
        }
    },

    /**
     * Create vendor invoice and execute 3-Way Match
     */
    async createInvoice(
        invoice: Omit<VendorInvoice, 'id' | 'matchStatus' | 'status' | 'amountPaid' | 'createdAt' | 'updatedAt'>,
        items: Array<Omit<InvoiceItem, 'id' | 'invoiceId' | 'matchVariancePct'>>,
        creator: { id: string; name: string }
    ): Promise<VendorInvoice> {
        const matchResult = this.evaluateThreeWayMatch(items);

        const subtotal = items.reduce((sum, i) => sum + (i.invoicedQuantity * i.invoicedUnitPrice), 0);
        const taxAmount = items.reduce((sum, i) => sum + (i.invoicedQuantity * i.invoicedUnitPrice * (i.taxRate / 100)), 0);
        const totalAmount = subtotal + taxAmount;

        const dbInvoice = {
            invoice_number: invoice.invoiceNumber,
            vendor_id: invoice.vendorId,
            vendor_name: invoice.vendorName,
            po_id: invoice.poId || null,
            po_number: invoice.poNumber || null,
            receiving_record_id: invoice.receivingRecordId || null,
            receiving_manifest_number: invoice.receivingManifestNumber || null,
            site_id: invoice.siteId,
            country_code: invoice.countryCode || 'ET',
            invoice_date: invoice.invoiceDate || new Date().toISOString().split('T')[0],
            due_date: invoice.dueDate,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            amount_paid: 0,
            currency: invoice.currency || 'ETB',
            match_status: matchResult.status,
            match_discrepancy_notes: matchResult.notes,
            status: matchResult.status === 'Matched' ? 'Pending_Approval' : 'Draft',
            created_by_id: creator.id
        };

        const lineRows = items.map(item => ({
            product_id: item.productId, sku: item.sku || null, item_name: item.itemName,
            invoiced_quantity: item.invoicedQuantity, invoiced_unit_price: item.invoicedUnitPrice, tax_rate: item.taxRate
        }));

        const { data: saved, error } = await supabase.rpc('create_vendor_invoice_atomic', { p_header: dbInvoice, p_items: lineRows });
        if (error) throw error;
        if (!saved?.invoice?.id || !Array.isArray(saved.items)) throw new Error('Invoice confirmation is missing');
        const invData = saved.invoice;
        const itemData = saved.items;

        await systemLogsService.create({
            user_name: creator.name,
            action: 'INVOICE_CREATED',
            module: 'Financials',
            details: `Created Vendor Invoice ${invoice.invoiceNumber} (${invoice.vendorName}) for ${totalAmount} ${invoice.currency}. 3-Way Match: ${invData.match_status}.`
        });

        const savedItems = (itemData || []).map((i: any) => ({
            id: i.id,
            invoiceId: i.invoice_id,
            productId: i.product_id,
            sku: i.sku,
            itemName: i.item_name,
            poQuantity: Number(i.po_quantity) || 0,
            receivedQuantity: Number(i.received_quantity) || 0,
            invoicedQuantity: Number(i.invoiced_quantity) || 0,
            poUnitPrice: Number(i.po_unit_price) || 0,
            invoicedUnitPrice: Number(i.invoiced_unit_price) || 0,
            taxRate: Number(i.tax_rate) || 0,
            totalPrice: Number(i.total_price) || 0,
            matchVariancePct: Number(i.match_variance_pct) || 0
        }));

        return mapInvoiceRow(invData, savedItems);
    },

    /**
     * Override 3-Way match discrepancy with supervisory justification (Rule 18)
     */
    async overrideDiscrepancy(
        invoiceId: string,
        supervisor: { id: string; name: string; role: string },
        overrideReason: string
    ): Promise<VendorInvoice> {
        if (!overrideReason || overrideReason.trim().length < 10) {
            throw new Error('Mandatory reason required: Provide at least 10 characters explaining discrepancy override.');
        }

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('vendor_invoices')
            .update({
                match_status: 'Manual_Override',
                status: 'Approved',
                approved_by_id: supervisor.id,
                approved_at: now,
                override_reason: overrideReason.trim(),
                updated_at: now
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) {
            logger.error('accountsPayableService', 'overrideDiscrepancy failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: supervisor.name,
            action: 'INVOICE_DISCREPANCY_OVERRIDDEN',
            module: 'Financials',
            details: `Invoice #${invoiceId.slice(0, 8)} overridden by ${supervisor.name} (${supervisor.role}). Reason: "${overrideReason}".`
        });

        return mapInvoiceRow(data);
    },

    /**
     * Create formal Payment Run for approved invoices
     */
    async createPaymentRun(
        invoiceIds: string[],
        paymentChannel: 'Bank_Transfer' | 'Telebirr' | 'CBE_Birr' | 'M_Pesa' | 'Check',
        creator: { id: string; name: string },
        countryCode: string = 'ET',
        currency: string = 'ETB'
    ): Promise<PaymentRun> {
        const { data: runData, error } = await supabase.rpc('create_payment_run_atomic', {
            p_ids: invoiceIds, p_country: countryCode, p_currency: currency, p_channel: paymentChannel
        });
        if (error) throw error;
        if (!runData?.id) throw new Error('Payment run confirmation is missing');
        const runNumber: string = runData.run_number;
        const totalAmount = Number(runData.total_amount);
        const invoiceCount = Number(runData.total_invoices);

        await systemLogsService.create({
            user_name: creator.name,
            action: 'PAYMENT_RUN_CREATED',
            module: 'Financials',
            details: `Created Payment Run ${runNumber} with ${invoiceCount} invoices totaling ${totalAmount} ${currency}.`
        });

        return {
            id: runData.id,
            runNumber: runData.run_number,
            countryCode: runData.country_code,
            currency: runData.currency,
            totalInvoices: runData.total_invoices,
            totalAmount: Number(runData.total_amount),
            status: runData.status,
            createdById: runData.created_by_id,
            createdByName: runData.created_by_name,
            paymentChannel: runData.payment_channel,
            createdAt: runData.created_at
        };
    }
};
