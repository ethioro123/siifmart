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
    async getInvoices(filters?: { countryCode?: string; siteId?: string; status?: string }): Promise<VendorInvoice[]> {
        try {
            let query = supabase
                .from('vendor_invoices')
                .select('*, invoice_items(*)')
                .order('due_date', { ascending: true });

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

        const { data: invData, error: invError } = await supabase
            .from('vendor_invoices')
            .insert(dbInvoice)
            .select()
            .single();

        if (invError) {
            logger.error('accountsPayableService', 'createInvoice header failed:', invError);
            throw invError;
        }

        const invoiceId = invData.id;
        const lineRows = matchResult.evaluatedItems.map(item => ({
            invoice_id: invoiceId,
            product_id: item.productId,
            sku: item.sku || null,
            item_name: item.itemName,
            po_quantity: item.poQuantity,
            received_quantity: item.receivedQuantity,
            invoiced_quantity: item.invoicedQuantity,
            po_unit_price: item.poUnitPrice,
            invoiced_unit_price: item.invoicedUnitPrice,
            tax_rate: item.taxRate,
            total_price: item.totalPrice,
            match_variance_pct: item.matchVariancePct
        }));

        const { data: itemData, error: itemError } = await supabase
            .from('invoice_items')
            .insert(lineRows)
            .select();

        if (itemError) {
            logger.error('accountsPayableService', 'createInvoice lines failed:', itemError);
            throw itemError;
        }

        await systemLogsService.create({
            user_name: creator.name,
            action: 'INVOICE_CREATED',
            module: 'Financials',
            details: `Created Vendor Invoice ${invoice.invoiceNumber} (${invoice.vendorName}) for ${totalAmount} ${invoice.currency}. 3-Way Match: ${matchResult.status}.`
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
        const { data: invoices, error: invError } = await supabase
            .from('vendor_invoices')
            .select('*')
            .in('id', invoiceIds);

        if (invError) throw invError;
        if (!invoices || invoices.length === 0) {
            throw new Error('No invoices selected for payment run.');
        }

        const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) - Number(inv.amount_paid)), 0);
        const runNumber = `PR-${countryCode}-${Date.now().toString().slice(-6)}`;

        const { data: runData, error: runError } = await supabase
            .from('payment_runs')
            .insert({
                run_number: runNumber,
                country_code: countryCode,
                currency,
                total_invoices: invoices.length,
                total_amount: totalAmount,
                status: 'Pending_Approval',
                created_by_id: creator.id,
                created_by_name: creator.name,
                payment_channel: paymentChannel
            })
            .select()
            .single();

        if (runError) throw runError;

        // Associate invoices with payment run
        await supabase
            .from('vendor_invoices')
            .update({ payment_run_id: runData.id })
            .in('id', invoiceIds);

        await systemLogsService.create({
            user_name: creator.name,
            action: 'PAYMENT_RUN_CREATED',
            module: 'Financials',
            details: `Created Payment Run ${runNumber} with ${invoices.length} invoices totaling ${totalAmount} ${currency}.`
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
