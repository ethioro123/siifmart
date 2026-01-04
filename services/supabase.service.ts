/**
 * Supabase API Service Layer
 * Complete CRUD operations for all entities
 */

import { supabase } from '../lib/supabase';
import type {
    Product,
    Customer,
    Employee,
    Supplier,
    PurchaseOrder,
    SaleRecord,
    StockMovement,
    ExpenseRecord,
    WMSJob,
    Site,
    WarehouseZone,
    FulfillmentStrategy,
    FulfillmentPlan,
    CartItem,
    TransferRecord,
    WorkerPoints,
    PointsTransaction,
    StorePoints,
    PendingInventoryChange,
    SystemConfig,
    DiscrepancyResolution,
    DiscrepancyClaim
} from '../types';

// ============================================================================
// SITES
// ============================================================================

export const sitesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
            terminalCount: s.terminal_count,
            bonusEnabled: s.bonus_enabled,
            warehouseBonusEnabled: s.warehouse_bonus_enabled,
            zoneCount: s.zone_count,
            aisleCount: s.aisle_count,
            binCount: s.bin_count,
            taxJurisdictionId: s.tax_jurisdiction_id,
            fulfillmentStrategy: s.fulfillment_strategy,
            isFulfillmentNode: s.is_fulfillment_node,
            code: s.code || s.id.substring(0, 8).toUpperCase() // Use database code or fallback to short UUID
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            zoneCount: data.zone_count,
            aisleCount: data.aisle_count,
            binCount: data.bin_count,
            fulfillmentStrategy: data.fulfillment_strategy,
            isFulfillmentNode: data.is_fulfillment_node,
            code: data.code || data.id.substring(0, 8).toUpperCase() // Use database code or fallback to short UUID
        };
    },

    async create(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>) {
        // --- 1. GENERATE SEQUENTIAL SITE ID ---
        const { data: allSites } = await supabase
            .from('sites')
            .select('code');

        let nextId = 1;
        if (allSites && allSites.length > 0) {
            const maxId = allSites.reduce((max, s) => {
                // Match SITE-XXXX or just look for numbers
                const match = s.code?.match(/SITE-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    return num > max ? num : max;
                }
                return max;
            }, 0);
            nextId = maxId + 1;
        }

        const newCode = `SITE-${nextId.toString().padStart(4, '0')}`;
        // --------------------------------------

        const dbSite = {
            name: site.name,
            code: newCode, // Use auto-generated sequential code
            type: site.type,
            address: site.address,
            status: site.status,
            manager: site.manager,
            capacity: site.capacity,
            terminal_count: site.terminalCount,
            bonus_enabled: site.bonusEnabled,
            warehouse_bonus_enabled: site.warehouseBonusEnabled,
            zone_count: site.zoneCount,
            aisle_count: site.aisleCount,
            bin_count: site.binCount,
            fulfillment_strategy: site.fulfillmentStrategy || 'NEAREST',
            is_fulfillment_node: site.isFulfillmentNode !== undefined ? site.isFulfillmentNode : true
        };
        const { data, error } = await supabase
            .from('sites')
            .insert(dbSite)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            zoneCount: data.zone_count,
            aisleCount: data.aisle_count,
            binCount: data.bin_count,
            code: data.code // Return the real DB code
        };
    },

    async update(id: string, updates: Partial<Site>) {
        const dbUpdates: any = { ...updates };
        // Remove fields that don't exist in the database or shouldn't be updated visually
        const fieldsToRemove = ['id', 'created_at', 'updated_at', 'code'];
        fieldsToRemove.forEach(field => delete dbUpdates[field]);

        if (updates.terminalCount !== undefined) {
            dbUpdates.terminal_count = updates.terminalCount;
            delete dbUpdates.terminalCount;
        }
        if (updates.bonusEnabled !== undefined) {
            dbUpdates.bonus_enabled = updates.bonusEnabled;
            delete dbUpdates.bonusEnabled;
        }
        if (updates.warehouseBonusEnabled !== undefined) {
            dbUpdates.warehouse_bonus_enabled = updates.warehouseBonusEnabled;
            delete dbUpdates.warehouseBonusEnabled;
        }
        if (updates.zoneCount !== undefined) {
            dbUpdates.zone_count = updates.zoneCount;
            delete dbUpdates.zoneCount;
        }
        if (updates.aisleCount !== undefined) {
            dbUpdates.aisle_count = updates.aisleCount;
            delete dbUpdates.aisleCount;
        }
        if (updates.binCount !== undefined) {
            dbUpdates.bin_count = updates.binCount;
            delete dbUpdates.binCount;
        }
        if (updates.taxJurisdictionId !== undefined) {
            dbUpdates.tax_jurisdiction_id = updates.taxJurisdictionId;
            delete dbUpdates.taxJurisdictionId;
        }
        if (updates.fulfillmentStrategy !== undefined) {
            dbUpdates.fulfillment_strategy = updates.fulfillmentStrategy;
            delete dbUpdates.fulfillmentStrategy;
        }
        if (updates.isFulfillmentNode !== undefined) {
            dbUpdates.is_fulfillment_node = updates.isFulfillmentNode;
            delete dbUpdates.isFulfillmentNode;
        }

        const { data, error } = await supabase
            .from('sites')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            bonusEnabled: data.bonus_enabled,
            warehouseBonusEnabled: data.warehouse_bonus_enabled,
            taxJurisdictionId: data.tax_jurisdiction_id,
            fulfillmentStrategy: data.fulfillment_strategy,
            isFulfillmentNode: data.is_fulfillment_node,
            code: data.id?.substring(0, 8).toUpperCase() || 'UNK' // Generate code from ID
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getAllActiveFulfillmentNodes() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('status', 'Active')
            .or('type.eq.Warehouse,is_fulfillment_node.eq.true');

        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
            fulfillmentStrategy: s.fulfillment_strategy,
            isFulfillmentNode: s.is_fulfillment_node
        }));
    }
};

// ============================================================================
// WAREHOUSE ZONES
// ============================================================================

export const warehouseZonesService = {
    async getAll(siteId?: string) {
        try {
            let query = supabase.from('warehouse_zones').select('*');
            if (siteId) query = query.eq('site_id', siteId);

            const { data, error } = await query.order('picking_priority', { ascending: true });

            if (error) {
                // If picking_priority column is missing, Supabase might return 400
                // We check message for "column" and "does not exist" or specific PostgREST error codes
                const isColumnError = error.message.toLowerCase().includes('column') ||
                    error.message.toLowerCase().includes('does not exist') ||
                    error.code === '42703'; // PostgreSQL error code for undefined_column

                if (isColumnError) {
                    console.warn('⚠️ Schema mismatch in warehouse_zones: picking_priority column missing. Falling back to default order.');
                    let retryQuery = supabase.from('warehouse_zones').select('*');
                    if (siteId) retryQuery = retryQuery.eq('site_id', siteId);
                    const { data: retryData, error: retryError } = await retryQuery;
                    if (retryError) throw retryError;
                    return (retryData || []).map((z: any) => ({
                        ...z,
                        siteId: z.site_id,
                        pickingPriority: 10, // Default fallback
                        zoneType: z.zone_type || 'STANDARD'
                    }));
                }
                throw error;
            }

            return data.map((z: any) => ({
                ...z,
                siteId: z.site_id,
                pickingPriority: z.picking_priority,
                zoneType: z.zone_type
            }));
        } catch (err) {
            console.error('❌ Critical error in warehouseZonesService.getAll:', err);
            return []; // Fail gracefully with empty array
        }
    },

    async update(id: string, updates: Partial<WarehouseZone>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId) {
            dbUpdates.site_id = updates.siteId;
            delete dbUpdates.siteId;
        }
        if (updates.pickingPriority !== undefined) {
            dbUpdates.picking_priority = updates.pickingPriority;
            delete dbUpdates.pickingPriority;
        }
        if (updates.zoneType) {
            dbUpdates.zone_type = updates.zoneType;
            delete dbUpdates.zoneType;
        }
        delete dbUpdates.id;

        const { data, error } = await supabase
            .from('warehouse_zones')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            pickingPriority: data.picking_priority,
            zoneType: data.zone_type
        };
    }
};

// ============================================================================
// SYSTEM CONFIG
// ============================================================================

export const systemConfigService = {
    async getSettings(): Promise<SystemConfig> {
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('*')
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .maybeSingle();

            if (error) {
                console.error('⚠️ Supabase error loading settings:', error);
                throw error;
            }

            // If no record found, return the default mapped object
            if (!data) {
                console.warn('⚠️ No system_config record found. Using default application settings.');
                return this._mapSettings({}); // _mapSettings handles empty object
            }

            return this._mapSettings(data);
        } catch (err) {
            console.warn('⚠️ Settings load failed, using fallback logic:', err);
            return this._mapSettings({});
        }
    },

    async updateSettings(updates: Partial<SystemConfig>, userName: string): Promise<SystemConfig> {
        const dbUpdates: any = {
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: userName
        };

        // Map camelCase to snake_case for DB columns
        const mapping: Record<string, string> = {
            storeName: 'store_name',
            logoUrl: 'logo_url',
            brandColor: 'brand_color',
            legalBusinessName: 'legal_business_name',
            taxVatNumber: 'tax_vat_number',
            registeredAddress: 'registered_address',
            supportContact: 'support_contact',
            supportPhone: 'support_phone',
            taxRate: 'tax_rate',
            lowStockThreshold: 'low_stock_threshold',
            fefoRotation: 'fefo_rotation',
            binScan: 'bin_scan',
            enableLoyalty: 'enable_loyalty',
            enableWMS: 'enable_wms',
            multiCurrency: 'multi_currency',
            requireShiftClosure: 'require_shift_closure',
            posTerminalId: 'pos_terminal_id',
            posRegisterMode: 'pos_register_mode',
            posGuestCheckout: 'pos_guest_checkout',
            posBlockNegativeStock: 'pos_block_negative_stock',
            posDigitalReceipts: 'pos_digital_receipts',
            posAutoPrint: 'pos_auto_print',
            payment_cash: 'payment_cash',
            payment_card: 'payment_card',
            payment_mobile_money: 'payment_mobile_money',
            payment_store_credit: 'payment_store_credit',
            fiscalYearStart: 'fiscal_year_start',
            accountingMethod: 'accounting_method',
            taxInclusive: 'tax_inclusive',
            defaultVatRate: 'default_vat_rate',
            withholdingTax: 'withholding_tax',
            maxPettyCash: 'max_petty_cash',
            expenseApprovalLimit: 'expense_approval_limit',
            defaultCreditLimit: 'default_credit_limit',
            receivingLogic: 'receiving_logic',
            qcSamplingRate: 'qc_sampling_rate',
            qcBlockOnFailure: 'qc_block_on_failure',
            putawayLogic: 'putaway_logic',
            rotationPolicy: 'rotation_policy',
            requireExpiry: 'require_expiry',
            cycleCountStrategy: 'cycle_count_strategy',
            pickingMethod: 'picking_method',
            strictScanning: 'strict_scanning',
            dateFormat: 'date_format',
            numberFormat: 'number_format',
            currency: 'currency',
            timezone: 'timezone',
            language: 'language',
            logo_url: 'logo_url', // fallback
            tax_vat_number: 'tax_vat_number', // fallback
            posReceiptLogo: 'pos_receipt_logo',
            posReceiptShowLogo: 'pos_receipt_show_logo',
            posReceiptHeader: 'pos_receipt_header',
            posReceiptFooter: 'pos_receipt_footer',
            posReceiptAddress: 'pos_receipt_address',
            posReceiptPhone: 'pos_receipt_phone',
            posReceiptEmail: 'pos_receipt_email',
            posReceiptTaxId: 'pos_receipt_tax_id',
            posReceiptPolicy: 'pos_receipt_policy',
            posReceiptSocialHandle: 'pos_receipt_social_handle',
            posReceiptEnableQR: 'pos_receipt_enable_qr',
            posReceiptQRLink: 'pos_receipt_qr_link',
            posReceiptWidth: 'pos_receipt_width',
            posReceiptFont: 'pos_receipt_font',
            taxJurisdictions: 'tax_jurisdictions',
            exchangeRates: 'exchange_rates',
            // Gamification fields
            bonusEnabled: 'bonus_enabled',
            bonusTiers: 'bonus_tiers',
            bonusPayoutFrequency: 'bonus_payout_frequency',
            warehousePointsEligibleRoles: 'warehouse_points_eligible_roles',
            warehousePointRules: 'warehouse_point_rules',
            posBonusEnabled: 'pos_bonus_enabled',
            posBonusTiers: 'pos_bonus_tiers',
            posBonusPayoutFrequency: 'pos_bonus_payout_frequency',
            posRoleDistribution: 'pos_role_distribution',
            posPointRules: 'pos_point_rules'
        };

        const finalUpdates: any = {};
        Object.entries(dbUpdates).forEach(([key, value]) => {
            const dbKey = mapping[key] || key;
            finalUpdates[dbKey] = value;
        });

        // Ensure we don't try to update id
        delete finalUpdates.id;

        const { data, error } = await supabase
            .from('system_config')
            .upsert({
                ...finalUpdates,
                id: '00000000-0000-0000-0000-000000000001',
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return this._mapSettings(data);
    },

    async uploadFile(file: File, path: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('system-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('system-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    _mapSettings(data: any): SystemConfig {
        return {
            storeName: data.store_name,
            slogan: data.slogan,
            logoUrl: data.logo_url,
            brandColor: data.brand_color,
            legalBusinessName: data.legal_business_name,
            taxVatNumber: data.tax_vat_number,
            registeredAddress: data.registered_address,
            supportContact: data.support_contact,
            supportPhone: data.support_phone,
            currency: data.currency,
            timezone: data.timezone,
            dateFormat: data.date_format,
            numberFormat: data.number_format,
            language: data.language,
            taxRate: data.tax_rate,
            lowStockThreshold: data.low_stock_threshold,
            fefoRotation: data.fefo_rotation,
            binScan: data.bin_scan,
            enableLoyalty: data.enable_loyalty,
            enableWMS: data.enable_wms,
            multiCurrency: data.multi_currency,
            requireShiftClosure: data.require_shift_closure,
            posTerminalId: data.pos_terminal_id,
            posRegisterMode: data.pos_register_mode,
            posGuestCheckout: data.pos_guest_checkout,
            posBlockNegativeStock: data.pos_block_negative_stock,
            posDigitalReceipts: data.pos_digital_receipts,
            posAutoPrint: data.pos_auto_print,
            payment_cash: data.payment_cash,
            payment_card: data.payment_card,
            payment_mobile_money: data.payment_mobile_money,
            payment_store_credit: data.payment_store_credit,
            fiscalYearStart: data.fiscal_year_start,
            accountingMethod: data.accounting_method,
            taxInclusive: data.tax_inclusive,
            defaultVatRate: data.default_vat_rate,
            withholdingTax: data.withholding_tax,
            maxPettyCash: data.max_petty_cash,
            expenseApprovalLimit: data.expense_approval_limit,
            defaultCreditLimit: data.default_credit_limit,
            receivingLogic: data.receiving_logic,
            qcSamplingRate: data.qc_sampling_rate,
            qcBlockOnFailure: data.qc_block_on_failure,
            putawayLogic: data.putaway_logic,
            rotationPolicy: data.rotation_policy,
            requireExpiry: data.require_expiry,
            cycleCountStrategy: data.cycle_count_strategy,
            exchangeRates: data.exchange_rates,
            pickingMethod: data.picking_method,
            strictScanning: data.strict_scanning,
            reserveStockBuffer: data.reserve_stock_buffer,
            webhookOrderCreated: data.webhook_order_created,
            webhookInventoryLow: data.webhook_inventory_low,
            webhookCustomerSignup: data.webhook_customer_signup,
            scaleIpAddress: data.scale_ip_address,
            scannerComPort: data.scanner_com_port,
            posReceiptLogo: data.pos_receipt_logo,
            posReceiptShowLogo: data.pos_receipt_show_logo,
            posReceiptHeader: data.pos_receipt_header,
            posReceiptFooter: data.pos_receipt_footer,
            posReceiptAddress: data.pos_receipt_address,
            posReceiptPhone: data.pos_receipt_phone,
            posReceiptEmail: data.pos_receipt_email,
            posReceiptTaxId: data.pos_receipt_tax_id,
            posReceiptPolicy: data.pos_receipt_policy,
            posReceiptSocialHandle: data.pos_receipt_social_handle,
            posReceiptEnableQR: data.pos_receipt_enable_qr,
            posReceiptQRLink: data.pos_receipt_qr_link,
            posReceiptWidth: data.pos_receipt_width,
            posReceiptFont: data.pos_receipt_font,
            taxJurisdictions: data.tax_jurisdictions || [],
            // Gamification fields
            bonusEnabled: data.bonus_enabled ?? true,
            bonusTiers: data.bonus_tiers || [],
            bonusPayoutFrequency: data.bonus_payout_frequency || 'monthly',
            warehousePointsEligibleRoles: data.warehouse_points_eligible_roles || [],
            warehousePointRules: data.warehouse_point_rules || [],
            posBonusEnabled: data.pos_bonus_enabled ?? true,
            posBonusTiers: data.pos_bonus_tiers || [],
            posBonusPayoutFrequency: data.pos_bonus_payout_frequency || 'monthly',
            posRoleDistribution: data.pos_role_distribution || [],
            posPointRules: data.pos_point_rules || []
        };
    }
};

// ============================================================================
// PRODUCTS
// ============================================================================

export const productsService = {
    async getAll(siteId?: string, limit?: number, offset?: number, filters?: any, sort?: { key: string, direction: 'asc' | 'desc' }) {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        // Apply Sorting
        if (sort && sort.key) {
            let column = sort.key;
            // Map camelCase to snake_case
            if (sort.key === 'createdAt') column = 'created_at';
            else if (sort.key === 'costPrice') column = 'cost_price';
            else if (sort.key === 'salePrice') column = 'sale_price';
            else if (sort.key === 'siteId') column = 'site_id';
            // Handle cases where sort key doesn't match DB column directly (e.g. calculated fields)
            // For now, fallback to created_at if unknown, or keep simple columns

            // Avoid sorting by computed fields on server for now to avoid crashes
            if (['assetValue', 'abc'].includes(sort.key)) {
                query = query.order('created_at', { ascending: false });
            } else {
                query = query.order(column, { ascending: sort.direction === 'asc' });
            }
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (filters) {
            if (filters.search) {
                const search = filters.search;
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.eq.${search}`);
            }
            if (filters.category && filters.category !== 'All') {
                query = query.eq('category', filters.category);
            }
            if (filters.status && filters.status !== 'All') {
                if (filters.status === 'Active') query = query.eq('status', 'active');
                else if (filters.status === 'Low Stock') query = query.eq('status', 'low_stock');
                else if (filters.status === 'Out of Stock') query = query.eq('status', 'out_of_stock');
            }
        }

        if (limit) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((p: any) => ({
            ...p,
            siteId: p.site_id,
            costPrice: p.cost_price,
            salePrice: p.sale_price,
            isOnSale: p.is_on_sale,
            expiryDate: p.expiry_date,
            batchNumber: p.batch_number,
            shelfPosition: p.shelf_position,
            competitorPrice: p.competitor_price,
            salesVelocity: p.sales_velocity,
            posReceivedAt: p.pos_received_at,
            pos_received_at: p.pos_received_at,
            posReceivedBy: p.pos_received_by,
            pos_received_by: p.pos_received_by,
            approvalStatus: p.approval_status,
            approval_status: p.approval_status,
            createdBy: p.created_by,
            approvedBy: p.approved_by,
            approvedAt: p.approved_at,
            rejectedBy: p.rejected_by,
            rejectedAt: p.rejected_at,
            rejectionReason: p.rejection_reason
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getMetrics(siteId?: string) {
        const { data, error } = await supabase.rpc('get_inventory_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null
        });
        if (error) throw error;
        return data;
    },

    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string) {
        const { data, error } = await supabase.rpc('get_financial_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null,
            p_start_date: startDate,
            p_end_date: endDate
        });
        if (error) throw error;
        return data;
    },

    async search(term: string, siteId?: string, limit: number = 20) {
        let query = supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
            .limit(limit);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => ({
            ...p,
            siteId: p.site_id,
            costPrice: p.cost_price,
            salePrice: p.sale_price,
            isOnSale: p.is_on_sale,
            expiryDate: p.expiry_date,
            batchNumber: p.batch_number,
            shelfPosition: p.shelf_position,
            competitorPrice: p.competitor_price,
            salesVelocity: p.sales_velocity,
            posReceivedAt: p.pos_received_at,
            pos_received_at: p.pos_received_at,
            posReceivedBy: p.pos_received_by,
            pos_received_by: p.pos_received_by,
            approvalStatus: p.approval_status,
            approval_status: p.approval_status,
            createdBy: p.created_by,
            approvedBy: p.approved_by,
            approvedAt: p.approved_at,
            rejectedBy: p.rejected_by,
            rejectedAt: p.rejected_at,
            rejectionReason: p.rejection_reason
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by,
            approvalStatus: data.approval_status,
            approval_status: data.approval_status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            rejectedBy: data.rejected_by,
            rejectedAt: data.rejected_at,
            rejectionReason: data.rejection_reason
        };
    },

    async getBySKU(sku: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by,
            approvalStatus: data.approval_status,
            approval_status: data.approval_status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            rejectedBy: data.rejected_by,
            rejectedAt: data.rejected_at,
            rejectionReason: data.rejection_reason
        };
    },

    async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
        const dbProduct = {
            site_id: product.siteId,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price,
            cost_price: product.costPrice,
            sale_price: product.salePrice,
            is_on_sale: product.isOnSale,
            stock: product.stock,
            status: product.status,
            location: product.location,
            expiry_date: product.expiryDate,
            batch_number: product.batchNumber,
            shelf_position: product.shelfPosition,
            competitor_price: product.competitorPrice,
            sales_velocity: product.salesVelocity,

            image: product.image,
            barcode: product.barcode,
            barcode_type: product.barcodeType,
            approval_status: product.approvalStatus,
            created_by: product.createdBy,
            approved_by: product.approvedBy,
            approved_at: product.approvedAt
        };
        const { data, error } = await supabase
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) {
            // Robustness: If new columns are missing, retry without them
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                console.warn('⚠️ Schema mismatch detected. Retrying product creation without approval fields...');
                const coreProduct: any = { ...dbProduct };
                delete coreProduct.approval_status;
                delete coreProduct.created_by;
                delete coreProduct.approved_by;
                delete coreProduct.approved_at;

                const { data: retryData, error: retryError } = await supabase
                    .from('products')
                    .insert(coreProduct)
                    .select()
                    .single();

                if (retryError) throw retryError;
                return this._mapProduct(retryData);
            }
            throw error;
        }
        return this._mapProduct(data);
    },

    // Helper to map DB record to Product interface
    _mapProduct(data: any): Product {
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            approvalStatus: data.approval_status,
            approval_status: data.approval_status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            rejectedBy: data.rejected_by,
            rejectedAt: data.rejected_at,
            rejectionReason: data.rejection_reason
        };
    },

    async update(id: string, updates: Partial<Product>) {
        const dbUpdates: any = { ...updates };

        // Remove fields that shouldn't be updated or don't exist in DB
        const fieldsToRemove = ['id', 'created_at', 'updated_at', 'createdAt'];
        fieldsToRemove.forEach(field => delete dbUpdates[field]);

        // Map camelCase to snake_case for database
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.costPrice !== undefined) { dbUpdates.cost_price = updates.costPrice; delete dbUpdates.costPrice; }
        if (updates.salePrice !== undefined) { dbUpdates.sale_price = updates.salePrice; delete dbUpdates.salePrice; }
        if (updates.isOnSale !== undefined) { dbUpdates.is_on_sale = updates.isOnSale; delete dbUpdates.isOnSale; }
        if (updates.expiryDate !== undefined) { dbUpdates.expiry_date = updates.expiryDate; delete dbUpdates.expiryDate; }
        if (updates.batchNumber !== undefined) { dbUpdates.batch_number = updates.batchNumber; delete dbUpdates.batchNumber; }
        if (updates.shelfPosition !== undefined) { dbUpdates.shelf_position = updates.shelfPosition; delete dbUpdates.shelfPosition; }
        if (updates.competitorPrice !== undefined) { dbUpdates.competitor_price = updates.competitorPrice; delete dbUpdates.competitorPrice; }
        if (updates.salesVelocity !== undefined) { dbUpdates.sales_velocity = updates.salesVelocity; delete dbUpdates.salesVelocity; }
        if (updates.posReceivedAt !== undefined) { dbUpdates.pos_received_at = updates.posReceivedAt; delete dbUpdates.posReceivedAt; }
        if (updates.posReceivedBy !== undefined) { dbUpdates.pos_received_by = updates.posReceivedBy; delete dbUpdates.posReceivedBy; }
        if (updates.approvalStatus !== undefined) { dbUpdates.approval_status = updates.approvalStatus; delete dbUpdates.approvalStatus; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }
        if (updates.approvedAt !== undefined) { dbUpdates.approved_at = updates.approvedAt; delete dbUpdates.approvedAt; }
        if (updates.rejectedBy !== undefined) { dbUpdates.rejected_by = updates.rejectedBy; delete dbUpdates.rejectedBy; }
        if (updates.rejectedAt !== undefined) { dbUpdates.rejected_at = updates.rejectedAt; delete dbUpdates.rejectedAt; }
        if (updates.rejectionReason !== undefined) { dbUpdates.rejection_reason = updates.rejectionReason; delete dbUpdates.rejectionReason; }

        if ((updates as any).barcodeType !== undefined) {
            dbUpdates.barcode_type = (updates as any).barcodeType;
            delete (dbUpdates as any).barcodeType;
        }

        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Robustness: If new columns are missing, retry without them
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                console.warn('⚠️ Schema mismatch detected. Retrying product update without approval fields...');
                const coreUpdates: any = { ...dbUpdates };
                const fieldsToDelete = ['approval_status', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason'];
                fieldsToDelete.forEach(f => delete coreUpdates[f]);

                const { data: retryData, error: retryError } = await supabase
                    .from('products')
                    .update(coreUpdates)
                    .eq('id', id)
                    .select()
                    .single();

                if (retryError) throw retryError;
                return this._mapProduct(retryData);
            }
            throw error;
        }
        return this._mapProduct(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Cascade delete - removes all related records first, then deletes the product
    // Only for CEO use when absolutely necessary
    async cascadeDelete(id: string) {
        console.log('🗑️ Starting cascade delete for product:', id);

        // 1. Delete related stock_movements
        const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .eq('product_id', id);

        if (movementsError) {
            console.warn('⚠️ Failed to delete stock movements:', movementsError);
            // Continue anyway - might not have any movements
        } else {
            console.log('✅ Deleted related stock_movements');
        }

        // 2. Delete related sale line items (if table exists)
        try {
            const { error: saleItemsError } = await supabase
                .from('sale_items')
                .delete()
                .eq('product_id', id);

            if (!saleItemsError) {
                console.log('✅ Deleted related sale_items');
            }
        } catch (e) {
            console.warn('⚠️ sale_items table may not exist:', e);
        }

        // 3. Delete related inventory_requests
        const { error: requestsError } = await supabase
            .from('inventory_requests')
            .delete()
            .eq('product_id', id);

        if (!requestsError) {
            console.log('✅ Deleted related inventory_requests');
        }

        // 4. Finally delete the product itself
        const { error: productError } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (productError) {
            console.error('❌ Failed to delete product:', productError);
            throw productError;
        }

        console.log('✅ Product cascade deleted successfully');
    },

    async adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string = 'Stock Adjustment', user: string = 'System') {
        const product = await this.getById(productId);

        const currentStock = Number(product.stock || 0);
        const adjustQty = Number(quantity);

        console.log(`📦 SERVICE: Adjusting Stock for ${product.id} (${product.name})`);
        console.log(`   Current: ${currentStock}, Adjust: ${adjustQty}, Type: ${type}`);

        let newStock = currentStock;
        if (type === 'OUT') {
            newStock = currentStock - adjustQty;
        } else {
            newStock = currentStock + adjustQty;
        }

        console.log(`   New Stock Bound: ${newStock}`);

        if (isNaN(newStock)) {
            console.error('❌ CRITICAL: Stock calculation resulted in NaN', { currentStock, adjustQty, type, product });
            throw new Error('Stock calculation resulted in NaN');
        }

        const updated = await this.update(productId, { stock: newStock });

        await stockMovementsService.create({
            site_id: product.siteId,
            product_id: productId,
            product_name: product.name,
            type: type === 'ADJUSTMENT' ? 'IN' : type,
            quantity: adjustQty,
            movement_date: new Date().toISOString(),
            performed_by: user,
            reason: reason || `Stock ${type.toLowerCase()}`
        } as any);

        return updated;
    },

    async getLowStock(threshold: number = 10, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .lte('stock', threshold)
            .order('stock', { ascending: true });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Finds products across all sites that are below their minStock threshold.
     * This is used by the Distribution Hub to identify store needs.
     */
    async getLowStockAcrossSites() {
        // We select all products and filter locally for stock < minStock
        // since Supabase doesn't easily support cross-column comparison in client libraries
        // without a raw RPC or complex filter string.
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .not('status', 'eq', 'archived');

        if (error) throw error;

        // Filter for items below threshold (minStock or default 10)
        return data
            .map(p => this._mapProduct(p))
            .filter(p => p.stock < (p.minStock || 10));
    },

    /**
     * Finds all site locations that have stock for a specific SKU.
     * Used to suggest warehouse sources for replenishment.
     */
    async getWarehouseStock(sku: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .gt('stock', 0);

        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    }

};

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customersService = {
    async getAll(limit?: number) {
        let query = supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((c: any) => ({
            ...c,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_spent || 0,
            lastVisit: c.last_visit
        }));
    },

    async search(term: string, limit: number = 20) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(limit);

        if (error) throw error;
        return data.map((c: any) => ({
            ...c,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_spent || 0,
            lastVisit: c.last_visit
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async getByPhone(phone: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
        const dbCustomer = {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            loyalty_points: customer.loyaltyPoints,
            total_spent: customer.totalSpent,
            last_visit: customer.lastVisit,
            tier: customer.tier,
            notes: customer.notes
        };
        const { data, error } = await supabase
            .from('customers')
            .insert(dbCustomer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async update(id: string, updates: Partial<Customer>) {
        const dbUpdates: any = { ...updates };
        if (updates.loyaltyPoints !== undefined) {
            dbUpdates.loyalty_points = updates.loyaltyPoints;
            delete dbUpdates.loyaltyPoints;
        }
        if (updates.totalSpent !== undefined) {
            dbUpdates.total_spent = updates.totalSpent;
            delete dbUpdates.totalSpent;
        }
        if (updates.lastVisit !== undefined) {
            dbUpdates.last_visit = updates.lastVisit;
            delete dbUpdates.lastVisit;
        }

        const { data, error } = await supabase
            .from('customers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateLoyaltyPoints(id: string, points: number) {
        const customer = await this.getById(id);
        return await this.update(id, {
            loyaltyPoints: customer.loyaltyPoints + points
        });
    },

    async updateTier(id: string, tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') {
        return await this.update(id, { tier });
    }
};

// ============================================================================
// EMPLOYEES
// ============================================================================

export const employeesService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            joinDate: e.join_date,
            performanceScore: e.performance_score,
            attendanceRate: e.attendance_rate
        }));
    },

    async getPaginated(siteId?: string, page: number = 1, limit: number = 20, searchTerm: string = '', filters?: any) {
        // Step 1: Fetch ALL matching lightweight data (ID, Role, Name) to sort globally
        let query = supabase
            .from('employees')
            .select('id, role, name, created_at', { count: 'exact' });

        // Filters
        if (siteId && siteId !== 'All') query = query.eq('site_id', siteId);
        if (filters?.role && filters.role !== 'All') query = query.eq('role', filters.role);
        if (filters?.status && filters.status !== 'All') query = query.eq('status', filters.status);
        if (filters?.department && filters.department !== 'All') query = query.eq('department', filters.department);

        // Search
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }

        const { data: allIds, error: idError, count } = await query;
        if (idError) throw idError;

        // Step 2: Sort globally by Hierarchy in Memory
        const ROLE_HIERARCHY: Record<string, number> = {
            // Level 1 - Executive (100)
            'super_admin': 100,
            // Level 2 - Regional/Directors (80-95)
            'regional_manager': 95,
            'operations_manager': 90,
            'finance_manager': 85,
            'hr_manager': 85,
            'procurement_manager': 82,
            'supply_chain_manager': 80,
            // Level 3 - Site Managers (50-70)
            'store_manager': 70,
            'warehouse_manager': 68,
            'dispatch_manager': 65,
            'logistics_manager': 65,
            'inventory_manager': 65,
            'assistant_manager': 60,
            'shift_lead': 55,
            'cs_manager': 60,
            // Level 4 - Staff (10-40)
            'supervisor': 50,
            'auditor': 40,
            'staff': 40,
            'associate': 40,
            'it_support': 35,
            'dispatcher': 35,
            'accountant': 35,
            'data_analyst': 35,
            'training_coordinator': 35,
            'cashier': 30,
            'loss_prevention': 30,
            'driver': 30, // Elevated slightly from 20 to grouping
            'sales_associate': 28,
            'pos': 28,
            'stock_clerk': 25,
            'inventory_specialist': 25,
            'customer_service': 25,
            'merchandiser': 25,
            'picker': 22,
            'packer': 22,
            'receiver': 22,
            'returns_clerk': 22,
            'forklift_operator': 20,
            'security': 20,
            'maintenance': 20,
            'cleaner': 10,
            'admin': 90, // Legacy
            'manager': 65, // Legacy
            'hr': 85 // Legacy
        };

        const sortedData = (allIds || []).sort((a: any, b: any) => {
            const rankA = ROLE_HIERARCHY[a.role] || 0;
            const rankB = ROLE_HIERARCHY[b.role] || 0;

            if (rankA !== rankB) return rankB - rankA; // Highest rank first
            return a.name.localeCompare(b.name); // Then alphabetical
        });

        // Step 3: Slice for current page
        const from = (page - 1) * limit;
        const to = from + limit;
        const pageIds = sortedData.slice(from, to).map((e: any) => e.id);

        if (pageIds.length === 0) {
            return { data: [], count: count || 0 };
        }

        // Step 4: Fetch full details for the sliced IDs
        // We order by field to maintain the sort order (requires manual re-sort or fetch and map)
        const { data: details, error: detailsError } = await supabase
            .from('employees')
            .select('*')
            .in('id', pageIds);

        if (detailsError) throw detailsError;

        // Step 5: Re-sort details to match the pageIds order (since .in() doesn't guarantee order)
        const sortedDetails = pageIds.map(id => details.find((d: any) => d.id === id)).filter(Boolean);

        return {
            data: sortedDetails.map((e: any) => ({
                ...e,
                siteId: e.site_id,
                joinDate: e.join_date,
                performanceScore: e.performance_score,
                attendanceRate: e.attendance_rate
            })),
            count: count || 0
        };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async create(employee: Omit<Employee, 'created_at' | 'updated_at'>) {
        const dbEmployee = {
            id: employee.id,
            code: employee.code,
            site_id: employee.siteId,
            name: employee.name,
            role: employee.role,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            join_date: employee.joinDate,
            department: employee.department,
            avatar: employee.avatar,
            performance_score: employee.performanceScore,
            specialization: employee.specialization,
            salary: employee.salary,
            badges: employee.badges,
            attendance_rate: employee.attendanceRate
        };
        const { data, error } = await supabase
            .from('employees')
            .insert(dbEmployee)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async update(id: string, updates: Partial<Employee>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.joinDate !== undefined) { dbUpdates.join_date = updates.joinDate; delete dbUpdates.joinDate; }
        if (updates.performanceScore !== undefined) { dbUpdates.performance_score = updates.performanceScore; delete dbUpdates.performanceScore; }
        if (updates.attendanceRate !== undefined) { dbUpdates.attendance_rate = updates.attendanceRate; delete dbUpdates.attendanceRate; }

        const { data, error } = await supabase
            .from('employees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliersService = {
    async getAll(limit: number = 50, offset: number = 0) {
        const { data, error, count } = await supabase
            .from('suppliers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        const mappedData = data.map((s: any) => ({
            ...s,
            leadTime: s.lead_time,
            taxId: s.tax_id,
            nationalId: s.national_id
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
        const dbSupplier = {
            name: supplier.name,
            type: supplier.type,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            category: supplier.category,
            status: supplier.status,
            rating: supplier.rating,
            lead_time: supplier.leadTime,
            tax_id: supplier.taxId,
            national_id: supplier.nationalId,
            location: supplier.location
        };
        const { data, error } = await supabase
            .from('suppliers')
            .insert(dbSupplier)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async update(id: string, updates: Partial<Supplier>) {
        const dbUpdates: any = { ...updates };
        if (updates.leadTime !== undefined) { dbUpdates.lead_time = updates.leadTime; delete dbUpdates.leadTime; }
        if (updates.taxId !== undefined) { dbUpdates.tax_id = updates.taxId; delete dbUpdates.taxId; }
        if (updates.nationalId !== undefined) { dbUpdates.national_id = updates.nationalId; delete dbUpdates.nationalId; }

        const { data, error } = await supabase
            .from('suppliers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export const purchaseOrdersService = {
    async getAll(siteId?: string, limit: number = 50, offset: number = 0, filters?: any) {
        let query = supabase
            .from('purchase_orders')
            .select('*, po_items(*)', { count: 'exact' });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        // Apply Filters
        if (filters) {
            if (filters.status && filters.status !== 'All') {
                query = query.eq('status', filters.status === 'Draft' || filters.status === 'Approved' ? 'Pending' : filters.status);
            }
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('created_at', `${filters.endDate}T23:59:59`);
            }
            if (filters.search) {
                const term = filters.search;
                query = query.or(`po_number.ilike.%${term}%,supplier_name.ilike.%${term}%`);
            }
            // Filter Purchase Requests vs actual POs
            if (filters.isRequest === true) {
                query = query.ilike('notes', '%[PR]%');
            } else if (filters.isRequest === false) {
                // Return everything that DOES NOT have [PR] in notes
                // Use * as wildcard in .or() string for PostgREST
                query = query.or('notes.is.null,notes.not.ilike.%[PR]%');
            }
        }

        query = query.order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((p: any) => {
            // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
            let approvedBy = null;
            let approvedAt = null;
            let notes = p.notes;

            const approvalMatch = p.notes ? p.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
            if (approvalMatch) {
                approvedBy = approvalMatch[1];
                approvedAt = approvalMatch[2];
            }

            // Reverse map status: Pending without approval = Draft
            let frontendStatus = p.status;
            if (p.status === 'Pending' && !approvedBy) {
                frontendStatus = 'Draft';
            } else if (p.status === 'Pending' && approvedBy) {
                frontendStatus = 'Approved';
            }

            return {
                ...p,
                status: frontendStatus,
                requestedBy: p.requested_by,
                createdBy: p.created_by,
                approvedBy,
                approvedAt,
                notes,
                siteId: p.site_id,
                supplierId: p.supplier_id,
                supplierName: p.supplier_name,
                totalAmount: p.total_amount,
                itemsCount: p.items_count,
                expectedDelivery: p.expected_delivery,
                shippingCost: p.shipping_cost,
                taxAmount: p.tax_amount,
                paymentTerms: p.payment_terms,
                tempReq: p.temp_req,
                shelfLife: p.shelf_life,
                dockSlot: p.dock_slot,
                poNumber: p.po_number,
                lineItems: (p.po_items || []).map((i: any) => ({
                    ...i,
                    productId: i.product_id,
                    productName: i.product_name,
                    unitCost: i.unit_cost,
                    totalCost: i.total_cost
                }))
            };
        });

        return { data: mappedData, count: count || 0 };
    },

    async getMetrics(siteId?: string, filters?: any) {
        const params: any = {};
        if (siteId) params.p_site_id = siteId;
        if (filters?.startDate) params.p_start_date = `${filters.startDate}T00:00:00`;
        if (filters?.endDate) params.p_end_date = `${filters.endDate}T23:59:59`;

        // DEBUG: Log exact parameters being sent 
        console.log('[DEBUG] getMetrics called with:', { siteId, filters, params });

        const { data, error } = await supabase.rpc('get_procurement_metrics', params);

        // DEBUG: Log the raw response
        console.log('[DEBUG] getMetrics RPC response:', { data, error });

        if (error) {
            console.error('Error fetching procurement metrics:', error);
            // Fallback to empty structure to prevent crash
            return {
                totalSpend: 0,
                openPO: 0,
                pendingValue: 0,
                potentialRevenue: 0,
                categoryData: [],
                trendData: []
            };
        }
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*, po_items(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
        let approvedBy = null;
        let approvedAt = null;
        let notes = data.notes;

        const approvalMatch = data.notes ? data.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
        if (approvalMatch) {
            approvedBy = approvalMatch[1];
            approvedAt = approvalMatch[2];
        }

        // Reverse map status: Pending without approval = Draft
        let frontendStatus = data.status;
        if (data.status === 'Pending' && !approvedBy) {
            frontendStatus = 'Draft';
        } else if (data.status === 'Pending' && approvedBy) {
            frontendStatus = 'Approved';
        }

        return {
            ...data,
            status: frontendStatus,
            requestedBy: data.requested_by,
            createdBy: data.created_by,
            approvedBy,
            approvedAt,
            notes,
            siteId: data.site_id,
            supplierId: data.supplier_id,
            supplierName: data.supplier_name,
            totalAmount: data.total_amount,
            itemsCount: data.items_count,
            expectedDelivery: data.expected_delivery,
            shippingCost: data.shipping_cost,
            taxAmount: data.tax_amount,
            paymentTerms: data.payment_terms,
            tempReq: data.temp_req,
            shelfLife: data.shelf_life,
            dockSlot: data.dock_slot,
            poNumber: data.po_number,
            lineItems: data.po_items.map((i: any) => ({
                ...i,
                productId: i.product_id,
                productName: i.product_name,
                unitCost: i.unit_cost,
                totalCost: i.total_cost
            }))
        };
    },

    async create(po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: any[]) {
        // Generate UUID client-side
        const poId = crypto.randomUUID();

        // Map frontend statuses to database-compatible values
        // Database only allows: 'Pending', 'Received', 'Cancelled'
        // Frontend uses: 'Draft', 'Pending', 'Approved', 'Received', 'Cancelled'
        const dbStatus = po.status === 'Draft' ? 'Pending' :
            po.status === 'Approved' ? 'Pending' :
                po.status;

        // Generate simple sequential PO number if not provided
        let poNumber = po.poNumber;
        if (!poNumber) {

            try {
                // Get the highest existing PO number
                const { data: existingPOs, error: fetchError } = await supabase
                    .from('purchase_orders')
                    .select('po_number')
                    .not('po_number', 'is', null)
                    .order('po_number', { ascending: false })
                    .limit(1);

                let nextNumber = 1;
                if (!fetchError && existingPOs && existingPOs.length > 0) {
                    // Extract number from existing PO (e.g., "PO-0001" -> 1, "PO-1234" -> 1234)
                    const lastPONumber = existingPOs[0].po_number;
                    const match = lastPONumber?.match(/(?:PO|PR)-(\d+)/i);
                    if (match) {
                        nextNumber = parseInt(match[1], 10) + 1;
                    }
                }

                // Format as PO-0001, PO-0002, etc. (4 digits, zero-padded)
                const prefix = po.notes?.includes('[PR]') ? 'PR' : 'PO';
                poNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
            } catch (error) {
                // Fallback: use timestamp if sequential generation fails
                console.warn('Failed to generate sequential PO number, using timestamp fallback:', error);
                const prefix = po.notes?.includes('[PR]') ? 'PR' : 'PO';
                poNumber = `${prefix}-${Date.now()}`;
            }
        }

        // Create PO
        const dbPO = {
            id: poId,
            site_id: po.siteId,
            supplier_id: po.supplierId === 'UNSPECIFIED' ? null : po.supplierId, // Convert UNSPECIFIED to null
            supplier_name: po.supplierName,
            order_date: po.date,
            status: dbStatus, // Use mapped status
            total_amount: po.totalAmount,
            items_count: po.itemsCount,
            expected_delivery: po.expectedDelivery,
            shipping_cost: po.shippingCost,
            tax_amount: po.taxAmount,
            notes: po.notes,
            payment_terms: po.paymentTerms,
            incoterms: po.incoterms,
            destination: po.destination,
            discount: po.discount,
            temp_req: po.tempReq,
            shelf_life: po.shelfLife,
            dock_slot: po.dockSlot,
            po_number: poNumber,
            requested_by: po.requestedBy,
            created_by: po.createdBy
            // Note: approval tracking is handled via notes field (see update function)
        };
        const { error: poError } = await supabase
            .from('purchase_orders')
            .insert(dbPO);

        if (poError) throw poError;

        // Create PO items
        const itemsWithPOId = items.map(item => {
            // Check if productId is a valid UUID (starts with hex chars and has dashes)
            // If it's a custom ID like "CUSTOM-xxx", set to null
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);

            return {
                po_id: poId,
                product_id: isValidUUID ? item.productId : null, // Set to null for custom IDs
                product_name: item.productName,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                total_cost: item.totalCost
            };
        });

        const { error: itemsError } = await supabase
            .from('po_items')
            .insert(itemsWithPOId);

        if (itemsError) {
            console.error('PO Items Insert Error:', itemsError);
            throw new Error(`PO Items Insert Failed: ${itemsError.message} (PO ID: ${poId})`);
        }

        return await this.getById(poId);
    },

    async update(id: string, updates: Partial<PurchaseOrder>) {
        // Start with an empty object and only add fields that should be updated
        const dbUpdates: any = {};

        // Handle Approval: When status is 'Approved', save as 'Pending' with approval tag in notes
        if (updates.status === 'Approved' || updates.approvedBy) {
            // 1. Fetch current PO to get existing notes
            const { data: currentPO } = await supabase
                .from('purchase_orders')
                .select('notes')
                .eq('id', id)
                .single();

            const currentNotes = currentPO?.notes || '';

            // Check if already approved (avoid duplicate tags)
            const alreadyApproved = currentNotes?.includes('[APPROVED_BY:');

            if (!alreadyApproved) {
                const approvalTag = `\n[APPROVED_BY:${updates.approvedBy || 'System'}:${updates.approvedAt || new Date().toISOString()}]`;
                // 2. Append to notes
                dbUpdates.notes = currentNotes + approvalTag;
            }

            // 3. Set status to 'Pending' (which maps to 'Approved' in frontend when approvedBy exists)
            dbUpdates.status = 'Pending';
        } else if (updates.status === 'Cancelled') {
            // Handle Rejection: When status is 'Cancelled', keep it as 'Cancelled'
            dbUpdates.status = 'Cancelled';
        } else if (updates.status) {
            // Map other statuses
            const statusStr = String(updates.status);
            const mappedStatus: string = statusStr === 'Draft' ? 'Pending' :
                statusStr === 'Approved' ? 'Pending' :
                    statusStr;
            dbUpdates.status = mappedStatus;
        }

        // Map camelCase to snake_case for other fields (only if they exist in updates)
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; }
        if (updates.supplierId !== undefined) { dbUpdates.supplier_id = updates.supplierId === 'UNSPECIFIED' ? null : updates.supplierId; }
        if (updates.supplierName !== undefined) { dbUpdates.supplier_name = updates.supplierName; }
        if (updates.totalAmount !== undefined) { dbUpdates.total_amount = updates.totalAmount; }
        if (updates.itemsCount !== undefined) { dbUpdates.items_count = updates.itemsCount; }
        if (updates.expectedDelivery !== undefined) { dbUpdates.expected_delivery = updates.expectedDelivery; }
        if (updates.shippingCost !== undefined) { dbUpdates.shipping_cost = updates.shippingCost; }
        if (updates.taxAmount !== undefined) { dbUpdates.tax_amount = updates.taxAmount; }
        if (updates.paymentTerms !== undefined) { dbUpdates.payment_terms = updates.paymentTerms; }
        if (updates.tempReq !== undefined) { dbUpdates.temp_req = updates.tempReq; }
        if (updates.shelfLife !== undefined) { dbUpdates.shelf_life = updates.shelfLife; }
        if (updates.dockSlot !== undefined) { dbUpdates.dock_slot = updates.dockSlot; }
        if (updates.createdBy !== undefined) { dbUpdates.created_by = updates.createdBy; }
        if (updates.requestedBy !== undefined) { dbUpdates.requested_by = updates.requestedBy; }
        if (updates.poNumber !== undefined) { dbUpdates.po_number = updates.poNumber; }
        if (updates.notes !== undefined && !dbUpdates.notes) { dbUpdates.notes = updates.notes; }
        if (updates.date !== undefined) { dbUpdates.order_date = updates.date; }
        if (updates.destination !== undefined) { dbUpdates.destination = updates.destination; }
        if (updates.discount !== undefined) { dbUpdates.discount = updates.discount; }
        if (updates.incoterms !== undefined) { dbUpdates.incoterms = updates.incoterms; }

        // Remove any undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });

        const { data, error } = await supabase
            .from('purchase_orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('PO Update Error:', error);
            console.error('Update payload:', dbUpdates);
            throw error;
        }

        // Return the updated PO with proper mapping
        return await this.getById(id);
    },

    async receive(id: string) {
        // Update PO status to Received
        // NOTE: Stock is NOT adjusted here. Stock is added during the PUTAWAY process
        // in WarehouseOperations.tsx when items are physically scanned and placed in storage.
        // This prevents double-counting inventory.
        await this.update(id, { status: 'Received' });

        // Return the updated PO
        const po = await this.getById(id);
        return po;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SALES
// ============================================================================

export const salesService = {
    async getAll(siteId?: string, limit: number = 50, offset: number = 0, filters?: any) {
        let query = supabase
            .from('sales')
            .select('*, sale_items(*), customers!left(*)', { count: 'exact' });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        // Apply Filters
        if (filters) {
            if (filters.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }
            if (filters.method && filters.method !== 'All') {
                query = query.eq('payment_method', filters.method);
            }
            if (filters.startDate) {
                query = query.gte('sale_date', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('sale_date', `${filters.endDate}T23:59:59`);
            }
            if (filters.search) {
                const term = filters.search;
                query = query.or(`receipt_number.ilike.%${term}%,cashier_name.ilike.%${term}%`);
            }
        }

        // Apply Sort and Pagination
        query = query
            .order('sale_date', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((s: any) => ({
            ...s,
            siteId: s.site_id,
            date: s.sale_date,
            method: s.payment_method,
            amountTendered: s.amount_tendered,
            cashierName: s.cashier_name,
            customerId: s.customer_id,
            items: s.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price
            })),
            receiptNumber: s.receipt_number,
            customerName: s.customers?.name
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*), customers(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            items: data.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price
            }))
        };
    },

    async create(sale: Omit<SaleRecord, 'id' | 'created_at' | 'updated_at'>, items: any[]) {
        // Create sale
        const dbSale = {
            site_id: sale.siteId,
            customer_id: sale.customerId,
            sale_date: sale.date || new Date().toISOString(),
            subtotal: sale.subtotal,
            tax: sale.tax,
            total: sale.total,
            payment_method: sale.method,
            status: sale.status,
            amount_tendered: sale.amountTendered,
            change: sale.change,
            cashier_name: sale.cashierName,
            receipt_number: (sale as any).receiptNumber // Will be populated below if not present
        };

        // Generate sequential Receipt Number if not provided
        if (!(dbSale as any).receipt_number) {
            try {
                const { data: existingSales, error: fetchError } = await supabase
                    .from('sales')
                    .select('receipt_number')
                    .not('receipt_number', 'is', null)
                    .order('receipt_number', { ascending: false })
                    .limit(1);

                let nextNumber = 1;
                if (!fetchError && existingSales && existingSales.length > 0) {
                    const lastNum = existingSales[0].receipt_number;
                    const match = lastNum?.match(/REC-(\d+)/i);
                    if (match) {
                        nextNumber = parseInt(match[1], 10) + 1;
                    }
                }
                (dbSale as any).receipt_number = `REC-${String(nextNumber).padStart(4, '0')}`;
            } catch (error) {
                console.warn('Failed to generate sequential Receipt Number:', error);
                (dbSale as any).receipt_number = `REC-${Date.now()}`;
            }
        }

        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(dbSale)
            .select()
            .single();

        if (saleError) throw saleError;

        // Create sale items
        const itemsWithSaleId = items.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            cost_price: item.costPrice
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(itemsWithSaleId);

        if (itemsError) throw itemsError;

        // NOTE: Stock is NOT deducted here. Stock is deducted during the PICK process
        // in WarehouseOperations.tsx when items are physically picked from shelves.
        // This is proper WMS flow: Sale → PICK Job → Physical Pick → Stock Deducted

        // Update customer if provided - wrapped in try-catch to prevent blocking
        if ((sale as any).customer_id) {
            try {
                const customerId = (sale as any).customer_id;
                const customer = await customersService.getById(customerId);
                if (customer) {
                    await customersService.update(customerId, {
                        total_spent: (customer.totalSpent || 0) + sale.total,
                        last_visit: new Date().toISOString().split('T')[0]
                    } as any);
                }
            } catch (customerError) {
                console.warn('Failed to update customer stats (non-blocking):', customerError);
                // Non-critical: sale still completes even if customer update fails
            }
        }

        return {
            ...saleData,
            id: saleData.id,
            siteId: saleData.site_id,
            customerId: saleData.customer_id,
            date: saleData.sale_date,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            method: saleData.payment_method,
            status: saleData.status,
            amountTendered: saleData.amount_tendered,
            change: saleData.change,
            cashierName: saleData.cashier_name,
            receiptNumber: saleData.receipt_number,
            items: itemsWithSaleId.map(i => ({
                id: i.product_id,
                name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                costPrice: i.cost_price
            }))
        };
    },

    async refund(id: string, items: any[], refundAmount: number) {
        // Update sale status
        await supabase
            .from('sales')
            .update({ status: 'Refunded' })
            .eq('id', id);

        // Restore stock for refunded items
        for (const item of items) {
            await productsService.adjustStock(item.product_id, item.quantity, 'IN');
        }

        return true;
    },

    async update(id: string, updates: Partial<SaleRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.fulfillmentStatus !== undefined) {
            dbUpdates.fulfillment_status = updates.fulfillmentStatus;
            delete dbUpdates.fulfillmentStatus;
        }

        const { data, error } = await supabase
            .from('sales')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            fulfillmentStatus: data.fulfillment_status
        };
    },

    async getTodaySales(siteId?: string) {
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('sales')
            .select('*')
            .gte('sale_date', today);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async calculateFulfillmentPlan(requestingSiteId: string, cart: any[]): Promise<FulfillmentPlan[]> {
        // 1. Fetch requesting site to get its strategy
        const { data: requestingSite, error: siteError } = await supabase
            .from('sites')
            .select('*')
            .eq('id', requestingSiteId)
            .single();

        if (siteError) throw siteError;

        const strategy = requestingSite.fulfillment_strategy || 'NEAREST';

        // 2. Fetch all active candidate nodes
        const { data: candidates, error: candError } = await supabase
            .from('sites')
            .select('*')
            .eq('status', 'Active')
            .or('type.eq.Warehouse,is_fulfillment_node.eq.true');

        if (candError) throw candError;

        // 3. Distance calculation helper (Haversine)
        const getDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): number => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const sortedCandidates = candidates.map((wh: any) => ({
            ...wh,
            distance: getDistance(requestingSite.latitude, requestingSite.longitude, wh.latitude, wh.longitude)
        })).sort((a, b) => a.distance - b.distance);

        // 4. Helper: Stock check across specific site
        const checkSiteStock = async (siteId: string, productId: string, requestedQty: number): Promise<boolean> => {
            const { data, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .eq('site_id', siteId)
                .single();

            if (error || !data) return false;
            return data.stock >= requestedQty;
        };

        let plan: FulfillmentPlan[] = [];

        // 5. Strategy Implementation
        if (strategy === 'LOCAL_ONLY') {
            plan.push({
                siteId: requestingSiteId,
                isSplit: false,
                strategy: 'LOCAL_ONLY',
                items: cart.map((i: any) => ({
                    productId: i.id || i.productId,
                    sku: i.sku || 'UNK',
                    name: i.name,
                    quantity: i.quantity,
                    sourceSiteId: requestingSiteId
                }))
            });
        }
        else if (strategy === 'NEAREST' || strategy === 'MANUAL') {
            let bestWhId = requestingSiteId;
            for (const cand of sortedCandidates) {
                let allItemsAvailable = true;
                for (const item of cart) {
                    const hasStock = await checkSiteStock(cand.id, item.id || item.productId, item.quantity);
                    if (!hasStock) {
                        allItemsAvailable = false;
                        break;
                    }
                }
                if (allItemsAvailable) {
                    bestWhId = cand.id;
                    break;
                }
            }

            plan.push({
                siteId: requestingSiteId,
                isSplit: false,
                strategy: strategy as any,
                items: cart.map((i: any) => ({
                    productId: i.id || i.productId,
                    sku: i.sku || 'UNK',
                    name: i.name,
                    quantity: i.quantity,
                    sourceSiteId: bestWhId
                }))
            });
        }
        else if (strategy === 'SPLIT') {
            const siteMap = new Map<string, any[]>();

            for (const item of cart) {
                let foundSource = false;
                for (const cand of sortedCandidates) {
                    if (await checkSiteStock(cand.id, item.id || item.productId, item.quantity)) {
                        const existing = siteMap.get(cand.id) || [];
                        siteMap.set(cand.id, [...existing, {
                            productId: item.id || item.productId,
                            sku: item.sku || 'UNK',
                            name: item.name,
                            quantity: item.quantity,
                            sourceSiteId: cand.id
                        }]);
                        foundSource = true;
                        break;
                    }
                }
                if (!foundSource) {
                    const existing = siteMap.get(requestingSiteId) || [];
                    siteMap.set(requestingSiteId, [...existing, {
                        productId: item.id || item.productId,
                        sku: item.sku || 'UNK',
                        name: item.name,
                        quantity: item.quantity,
                        sourceSiteId: requestingSiteId
                    }]);
                }
            }

            siteMap.forEach((items, sourceId) => {
                plan.push({
                    siteId: requestingSiteId,
                    isSplit: siteMap.size > 1,
                    strategy: 'SPLIT',
                    items
                });
            });
        }

        return plan;
    },

    async releaseOrder(saleId: string) {
        // 1. Fetch sale with items
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .eq('id', saleId)
            .single();

        if (saleError) throw saleError;

        const cartItems = sale.sale_items.map((si: any) => ({
            productId: si.product_id,
            name: si.product_name,
            sku: si.product_sku || 'UNK',
            quantity: si.quantity
        }));

        // 2. Calculate fulfillment plan
        const plans = await this.calculateFulfillmentPlan(sale.site_id, cartItems);

        // 3. Create WMS Jobs for each plan
        for (const plan of plans) {
            const warehouseId = plan.items[0]?.sourceSiteId || sale.site_id;

            // Find best zone in that warehouse
            const { data: zones } = await supabase
                .from('warehouse_zones')
                .select('*')
                .eq('site_id', warehouseId)
                .order('picking_priority', { ascending: true })
                .limit(1);

            const primaryZone = zones?.[0];

            // Create PICK Job
            const pickJob = {
                siteId: warehouseId,
                type: 'PICK' as const,
                status: 'Pending' as const,
                priority: 'High' as const,
                location: primaryZone?.name || 'Zone A',
                items: plan.items.length,
                lineItems: plan.items.map(i => ({
                    productId: i.productId,
                    name: i.name,
                    sku: i.sku,
                    expectedQty: i.quantity,
                    pickedQty: 0,
                    status: 'Pending' as const
                })),
                orderRef: sale.id,
                sourceSiteId: warehouseId,
                destSiteId: sale.site_id,
                createdAt: new Date().toISOString()
            };

            await wmsJobsService.create(pickJob as any);

            // Create PACK Job if cross-site or for delivery/pickup
            if (warehouseId !== sale.site_id || sale.type !== 'In-Store') {
                const packJob = {
                    siteId: warehouseId,
                    type: 'PACK' as const,
                    status: 'Pending' as const,
                    priority: 'Normal' as const,
                    location: 'Packing Station 1',
                    items: plan.items.length,
                    lineItems: plan.items.map(i => ({
                        productId: i.productId,
                        name: i.name,
                        sku: i.sku,
                        expectedQty: i.quantity,
                        pickedQty: 0,
                        status: 'Pending' as const
                    })),
                    orderRef: sale.id,
                    sourceSiteId: warehouseId,
                    destSiteId: sale.site_id,
                    createdAt: new Date().toISOString()
                };
                await wmsJobsService.create(packJob as any);
            }
        }

        // 4. Update sale status
        const { error: updateError } = await supabase
            .from('sales')
            .update({ release_status: 'RELEASED' })
            .eq('id', saleId);

        if (updateError) throw updateError;

        return true;
    }
};

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const stockMovementsService = {
    async getAll(siteId?: string, productId?: string, limit: number = 50, offset: number = 0) {
        let query = supabase
            .from('stock_movements')
            .select('*', { count: 'exact' })
            .order('movement_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((m: any) => ({
            ...m,
            siteId: m.site_id,
            productId: m.product_id,
            productName: m.product_name,
            movementDate: m.movement_date,
            performedBy: m.performed_by,
            batchNumber: m.batch_number
        }));

        return { data: mappedData, count: count || 0 };
    },

    async create(movement: Omit<StockMovement, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('stock_movements')
            .insert(movement)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // NEW: Server-Side Warehouse Analytics
    async getAnalytics(siteId?: string, startDate?: string, endDate?: string) {
        const params: any = {};
        if (siteId && siteId !== 'All') params.p_site_id = siteId;
        if (startDate) params.p_start_date = startDate;
        if (endDate) params.p_end_date = `${endDate}T23:59:59`;

        const { data, error } = await supabase.rpc('get_warehouse_metrics', params);
        if (error) {
            console.error('Error fetching warehouse metrics:', error);
            return null;
        }
        return data;
    }
};

// ============================================================================
// EXPENSES
// ============================================================================

export const expensesService = {
    async getAll(siteId?: string, limit: number = 50, offset: number = 0, filters?: { startDate?: string; endDate?: string; category?: string; status?: string; search?: string }) {
        let query = supabase
            .from('expenses')
            .select('*', { count: 'exact' })
            .order('expense_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        if (filters?.startDate) {
            query = query.gte('expense_date', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('expense_date', filters.endDate);
        }

        if (filters?.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        if (filters?.status && filters.status !== 'All') {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.ilike('description', `%${filters.search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            date: e.expense_date,
            approvedBy: e.approved_by
        }));

        return { data: mappedData, count: count || 0 };
    },

    async create(expense: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>) {
        const dbExpense = {
            site_id: expense.siteId,
            expense_date: expense.date,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            status: expense.status,
            approved_by: expense.approvedBy
        };
        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpense)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async update(id: string, updates: Partial<ExpenseRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.date !== undefined) { dbUpdates.expense_date = updates.date; delete dbUpdates.date; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // NEW: Server-Side Financial Analytics
    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string) {
        // Construct params, handling undefined which RPC might not like if not default, but we set defaults to NULL in SQL
        const params: any = {};
        if (siteId && siteId !== 'All') params.p_site_id = siteId;
        if (startDate) params.p_start_date = startDate;
        if (endDate) params.p_end_date = endDate;

        const { data, error } = await supabase
            .rpc('get_financial_metrics', params);

        if (error) throw error;
        return data;
    }
};

// ============================================================================
// WMS JOBS
// ============================================================================

export const wmsJobsService = {
    async getAll(siteId?: string, limit: number = 50) {
        // 1. Fetch ALL Active Jobs (Pending/In-Progress) for the site
        // We don't limit these because they represent the operational backlog that MUST be visible
        let activeQuery = supabase
            .from('wms_jobs')
            .select('*')
            .not('status', 'in', '("Completed","Cancelled")')
            .order('created_at', { ascending: true }); // Oldest first for FIFO

        if (siteId) {
            activeQuery = activeQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // 2. Fetch Recent Historical Jobs (Completed/Cancelled)
        // We limit these to prevent bloating the client state
        let historyQuery = supabase
            .from('wms_jobs')
            .select('*')
            .in('status', ['Completed', 'Cancelled'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (siteId) {
            historyQuery = historyQuery.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // Execute parallel queries
        const [activeRes, historyRes] = await Promise.all([activeQuery, historyQuery]);

        if (activeRes.error) throw activeRes.error;
        if (historyRes.error) throw historyRes.error;

        // Combine datasets
        const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];

        // Map to domain model
        return combinedData.map((j: any) => ({
            ...j,
            siteId: j.site_id,
            items: j.items_count,
            assignedTo: j.assigned_to,
            orderRef: j.order_ref,
            lineItems: j.line_items || [],
            jobNumber: j.job_number,
            sourceSiteId: j.source_site_id,
            destSiteId: j.dest_site_id,
            transferStatus: j.transfer_status,
            requestedBy: j.requested_by,
            approvedBy: j.approved_by,
            shippedAt: j.shipped_at,
            receivedAt: j.received_at,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            deliveryMethod: j.delivery_method,
            hasDiscrepancy: j.has_discrepancy,
            discrepancyDetails: j.discrepancy_details,
            notes: j.notes
        }));
    },
    async getDiscrepancies(siteId: string): Promise<WMSJob[]> {
        let query = supabase
            .from('wms_jobs')
            .select('*')
            .contains('line_items', JSON.stringify([{ status: 'Discrepancy' }]));

        if (siteId) {
            query = query.or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((j: any) => ({
            ...j,
            siteId: j.site_id,
            items: j.items_count,
            assignedTo: j.assigned_to,
            orderRef: j.order_ref,
            lineItems: j.line_items || [],
            jobNumber: j.job_number,
            sourceSiteId: j.source_site_id,
            destSiteId: j.dest_site_id,
            transferStatus: j.transfer_status,
            requestedBy: j.requested_by,
            approvedBy: j.approved_by,
            shippedAt: j.shipped_at,
            receivedAt: j.received_at,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            deliveryMethod: j.delivery_method,
            hasDiscrepancy: j.has_discrepancy,
            discrepancyDetails: j.discrepancy_details,
            notes: j.notes
        }));
    },

    async create(job: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'>) {
        const dbJob = {
            site_id: job.siteId,
            type: job.type,
            priority: job.priority,
            status: job.status,
            items_count: job.items,
            assigned_to: job.assignedTo,
            location: job.location,
            order_ref: job.orderRef,
            // DATA OPTIMIZATION: Sanitize line items (strip images)
            line_items: job.lineItems.map((item: any) => ({
                ...item,
                image: '' // Strip image to save storage
            })),
            source_site_id: job.sourceSiteId,
            dest_site_id: job.destSiteId,
            transfer_status: job.transferStatus,
            requested_by: job.requestedBy,
            approved_by: job.approvedBy,
            job_number: (job as any).jobNumber, // Will be populated below if not present
            delivery_method: job.deliveryMethod
        };

        // Generate sequential Job Number if not provided
        // SCALABILITY OPTIMIZATION: O(1) Job Number Generation
        // Removed table scan (O(N)) which times out at scale.
        // New format: PREFIX-YYMMDD-XXXX (Timestamp + Random)
        if (!(dbJob as any).job_number) {
            const typePrefix = dbJob.type === 'TRANSFER' ? 'TRF' :
                dbJob.type === 'PICK' ? 'PK' :
                    dbJob.type === 'PACK' ? 'PA' :
                        dbJob.type === 'PUTAWAY' ? 'PU' :
                            dbJob.type === 'DISPATCH' ? 'DS' : 'JB';

            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
            (dbJob as any).job_number = `${typePrefix}-${dateStr}-${randomSuffix}`;
        }

        console.log('📤 Inserting WMS Job:', dbJob);

        const { data, error } = await supabase
            .from('wms_jobs')
            .insert(dbJob)
            .select()
            .single();

        if (error) {
            console.error('❌ WMS Job Insert Error:', error);
            console.error('❌ Error Details:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ WMS Job Created:', data);
        return {
            ...data,
            siteId: data.site_id,
            items: data.items_count,
            assignedTo: data.assigned_to,
            orderRef: data.order_ref,
            lineItems: data.line_items || [],
            jobNumber: data.job_number,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            transferStatus: data.transfer_status,
            requestedBy: data.requested_by,
            approvedBy: data.approved_by,
            shippedAt: data.shipped_at,
            receivedAt: data.received_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            deliveryMethod: data.delivery_method
        };
    },

    async update(id: string, updates: Partial<WMSJob>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.items !== undefined) { dbUpdates.items_count = updates.items; delete dbUpdates.items; }
        if (updates.assignedTo !== undefined) { dbUpdates.assigned_to = updates.assignedTo; delete dbUpdates.assignedTo; }
        if (updates.orderRef !== undefined) { dbUpdates.order_ref = updates.orderRef; delete dbUpdates.orderRef; }
        if (updates.lineItems !== undefined) { dbUpdates.line_items = updates.lineItems; delete dbUpdates.lineItems; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }
        if (updates.shippedAt !== undefined) { dbUpdates.shipped_at = updates.shippedAt; delete dbUpdates.shippedAt; }
        if (updates.receivedAt !== undefined) { dbUpdates.received_at = updates.receivedAt; delete dbUpdates.receivedAt; }
        if (updates.deliveryMethod !== undefined) { dbUpdates.delivery_method = updates.deliveryMethod; delete dbUpdates.deliveryMethod; }
        if (updates.hasDiscrepancy !== undefined) { dbUpdates.has_discrepancy = updates.hasDiscrepancy; delete dbUpdates.hasDiscrepancy; }
        if (updates.discrepancyDetails !== undefined) { dbUpdates.discrepancy_details = updates.discrepancyDetails; delete dbUpdates.discrepancyDetails; }

        const { data, error } = await supabase
            .from('wms_jobs')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            items: data.items_count,
            assignedTo: data.assigned_to,
            orderRef: data.order_ref,
            lineItems: data.line_items || [],
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            transferStatus: data.transfer_status,
            requestedBy: data.requested_by,
            approvedBy: data.approved_by,
            shippedAt: data.shipped_at,
            receivedAt: data.received_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            hasDiscrepancy: data.has_discrepancy,
            discrepancyDetails: data.discrepancy_details,
            notes: data.notes
        };
    },

    async complete(id: string) {
        return await this.update(id, { status: 'Completed' });
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('wms_jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SYSTEM LOGS
// ============================================================================

// ============================================================================
// TRANSFERS
// ============================================================================

export const transfersService = {
    async getAll(siteId?: string, limit: number = 50) {
        // 1. Active Transfers (Not Received/Cancelled) - Full List
        let activeQuery = supabase
            .from('transfers')
            .select('*')
            .not('status', 'in', '("Received","Cancelled")')
            .order('created_at', { ascending: true });

        if (siteId) {
            activeQuery = activeQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        // 2. Historical Transfers (Received/Cancelled) - Limited
        let historyQuery = supabase
            .from('transfers')
            .select('*')
            .in('status', ['Received', 'Cancelled'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (siteId) {
            historyQuery = historyQuery.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        const [activeRes, historyRes] = await Promise.all([activeQuery, historyQuery]);

        if (activeRes.error) throw activeRes.error;
        if (historyRes.error) throw historyRes.error;

        const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];
        return combinedData; // Transfers might not need mapping if matching type
    },



    async create(transfer: Omit<TransferRecord, 'id' | 'sourceSiteName' | 'destSiteName'>) {
        const dbTransfer = {
            source_site_id: transfer.sourceSiteId,
            dest_site_id: transfer.destSiteId,
            status: transfer.status,
            transfer_date: transfer.date,
            items: transfer.items
        };

        const { data, error } = await supabase
            .from('transfers')
            .insert(dbTransfer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date
        };
    },

    async update(id: string, updates: Partial<TransferRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.hasDiscrepancy !== undefined) { dbUpdates.has_discrepancy = updates.hasDiscrepancy; delete dbUpdates.hasDiscrepancy; }
        if (updates.discrepancyDetails !== undefined) { dbUpdates.discrepancy_details = updates.discrepancyDetails; delete dbUpdates.discrepancyDetails; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }

        const { data, error } = await supabase
            .from('transfers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date,
            hasDiscrepancy: data.has_discrepancy,
            discrepancyDetails: data.discrepancy_details,
            notes: data.notes,
            transferStatus: data.transfer_status
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('transfers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SYSTEM LOGS
// ============================================================================

export const systemLogsService = {
    async create(log: {
        user_name: string;
        action: string;
        details?: string;
        module: string;
        ip_address?: string;
    }) {
        const { data, error } = await supabase
            .from('system_logs')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll(module?: string) {
        let query = supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((l: any) => ({
            ...l,
            userName: l.user_name,
            ip: l.ip_address
        }));
    }
};

// ============================================================================
// JOB ASSIGNMENTS
// ============================================================================

export const jobAssignmentsService = {
    async getAll(siteId?: string, employeeId?: string, limit?: number) {
        let query = supabase
            .from('job_assignments')
            .select(`
                *,
                wms_jobs!inner(site_id, type, priority, status, location, order_ref)
            `)
            .order('assigned_at', { ascending: false });

        if (siteId) {
            query = query.eq('wms_jobs.site_id', siteId);
        }

        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async getByJobId(jobId: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('job_id', jobId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;
        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getByEmployeeId(employeeId: string, status?: string) {
        let query = supabase
            .from('job_assignments')
            .select('*')
            .eq('employee_id', employeeId)
            .order('assigned_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async create(assignment: any) {
        const dbAssignment = {
            job_id: assignment.jobId,
            employee_id: assignment.employeeId,
            employee_name: assignment.employeeName,
            assigned_at: assignment.assignedAt || new Date().toISOString(),
            status: assignment.status || 'Assigned',
            notes: assignment.notes,
            estimated_duration: assignment.estimatedDuration
        };

        const { data, error } = await supabase
            .from('job_assignments')
            .insert(dbAssignment)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async update(id: string, updates: any) {
        const dbUpdates: any = {};

        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.unitsProcessed !== undefined) dbUpdates.units_processed = updates.unitsProcessed;
        if (updates.accuracyRate !== undefined) dbUpdates.accuracy_rate = updates.accuracyRate;

        const { data, error } = await supabase
            .from('job_assignments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('job_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper: Get active assignments for an employee
    async getActiveAssignments(employeeId: string) {
        return this.getByEmployeeId(employeeId, 'In-Progress');
    },

    // Helper: Get employee performance metrics
    async getEmployeeMetrics(employeeId: string) {
        const { data, error } = await supabase
            .from('employee_performance_metrics')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error) {
            // View might not exist or no data
            return null;
        }

        return {
            ...data,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            totalJobs: data.total_jobs,
            completedJobs: data.completed_jobs,
            avgDurationMinutes: data.avg_duration_minutes,
            avgAccuracyRate: data.avg_accuracy_rate,
            totalUnitsProcessed: data.total_units_processed,
            lastCompletedAt: data.last_completed_at
        };
    }
};

// ============================================================================
// GAMIFICATION
// ============================================================================

export const workerPointsService = {
    async getAll(siteId?: string) {
        let query = supabase.from('worker_points').select('*');
        if (siteId) {
            query = query.eq('site_id', siteId);
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching worker points:', error);
            return [];
        }

        return data.map((wp: any) => ({
            id: wp.id,
            siteId: wp.site_id,
            employeeId: wp.employee_id,
            employeeName: wp.employee_name,
            employeeAvatar: wp.employee_avatar,
            totalPoints: wp.total_points,
            weeklyPoints: wp.weekly_points,
            monthlyPoints: wp.monthly_points,
            todayPoints: wp.today_points,
            totalJobsCompleted: wp.total_jobs_completed,
            totalItemsPicked: wp.total_items_picked,
            averageAccuracy: wp.average_accuracy,
            averageTimePerJob: wp.average_time_per_job,
            currentStreak: wp.current_streak,
            longestStreak: wp.longest_streak,
            lastJobCompletedAt: wp.last_job_completed_at,
            lastUpdated: wp.last_updated,
            achievements: wp.achievements || [],
            rank: wp.rank || 0,
            level: wp.level || 1,
            levelTitle: wp.level_title || 'Rookie',
            currentBonusTier: wp.current_bonus_tier,
            estimatedBonus: wp.estimated_bonus,
            bonusPeriodPoints: wp.bonus_period_points
        }));
    },

    async getByEmployee(employeeId: string) {
        const { data, error } = await supabase
            .from('worker_points')
            .select('*')
            .eq('employee_id', employeeId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            siteId: data.site_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            employeeAvatar: data.employee_avatar,
            totalPoints: data.total_points,
            weeklyPoints: data.weekly_points,
            monthlyPoints: data.monthly_points,
            todayPoints: data.today_points,
            totalJobsCompleted: data.total_jobs_completed,
            totalItemsPicked: data.total_items_picked,
            averageAccuracy: data.average_accuracy,
            averageTimePerJob: data.average_time_per_job,
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            lastJobCompletedAt: data.last_job_completed_at,
            lastUpdated: data.last_updated,
            achievements: data.achievements || [],
            rank: data.rank || 0,
            level: data.level || 1,
            levelTitle: data.level_title || 'Rookie',
            currentBonusTier: data.current_bonus_tier,
            estimatedBonus: data.estimated_bonus,
            bonusPeriodPoints: data.bonus_period_points
        };
    },

    async create(points: WorkerPoints) {
        const dbPoints = {
            site_id: points.siteId,
            employee_id: points.employeeId,
            employee_name: points.employeeName,
            employee_avatar: points.employeeAvatar,
            total_points: points.totalPoints,
            weekly_points: points.weeklyPoints,
            monthly_points: points.monthlyPoints,
            today_points: points.todayPoints,
            total_jobs_completed: points.totalJobsCompleted,
            total_items_picked: points.totalItemsPicked,
            average_accuracy: points.averageAccuracy,
            average_time_per_job: points.averageTimePerJob,
            current_streak: points.currentStreak,
            longest_streak: points.longestStreak,
            last_job_completed_at: points.lastJobCompletedAt,
            last_updated: points.lastUpdated,
            achievements: points.achievements,
            rank: points.rank,
            level: points.level,
            level_title: points.levelTitle,
            current_bonus_tier: points.currentBonusTier,
            estimated_bonus: points.estimatedBonus,
            bonus_period_points: points.bonusPeriodPoints
        };

        const { data, error } = await supabase
            .from('worker_points')
            .upsert(dbPoints, { onConflict: 'employee_id' })
            .select()
            .single();
        if (error) throw error;

        // Return mapped object or just assume it worked and return input with ID if new
        return { ...points, id: data.id };
    },

    async update(id: string, updates: Partial<WorkerPoints>) {
        const dbUpdates: any = {};
        if (updates.totalPoints !== undefined) dbUpdates.total_points = updates.totalPoints;
        if (updates.weeklyPoints !== undefined) dbUpdates.weekly_points = updates.weeklyPoints;
        if (updates.monthlyPoints !== undefined) dbUpdates.monthly_points = updates.monthlyPoints;
        if (updates.todayPoints !== undefined) dbUpdates.today_points = updates.todayPoints;
        if (updates.totalJobsCompleted !== undefined) dbUpdates.total_jobs_completed = updates.totalJobsCompleted;
        if (updates.totalItemsPicked !== undefined) dbUpdates.total_items_picked = updates.totalItemsPicked;
        if (updates.averageAccuracy !== undefined) dbUpdates.average_accuracy = updates.averageAccuracy;
        if (updates.averageTimePerJob !== undefined) dbUpdates.average_time_per_job = updates.averageTimePerJob;
        if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
        if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
        if (updates.lastJobCompletedAt !== undefined) dbUpdates.last_job_completed_at = updates.lastJobCompletedAt;
        if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;
        if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
        if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
        if (updates.level !== undefined) dbUpdates.level = updates.level;
        if (updates.levelTitle !== undefined) dbUpdates.level_title = updates.levelTitle;
        if (updates.currentBonusTier !== undefined) dbUpdates.current_bonus_tier = updates.currentBonusTier;
        if (updates.estimatedBonus !== undefined) dbUpdates.estimated_bonus = updates.estimatedBonus;
        if (updates.bonusPeriodPoints !== undefined) dbUpdates.bonus_period_points = updates.bonusPeriodPoints;

        const { data, error } = await supabase.from('worker_points').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};

export const pointsTransactionsService = {
    async create(transaction: PointsTransaction) {
        const dbTxn = {
            employee_id: transaction.employeeId,
            job_id: transaction.jobId,
            points: transaction.points,
            type: transaction.type,
            description: transaction.description,
            timestamp: transaction.timestamp
        };
        const { data, error } = await supabase.from('points_transactions').insert(dbTxn).select().single();
        if (error) throw error;
        return { ...transaction, id: data.id };
    },

    async getAll(employeeId?: string, limit?: number) {
        let query = supabase.from('points_transactions').select('*').order('timestamp', { ascending: false });
        if (employeeId) query = query.eq('employee_id', employeeId);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching points transactions:', error);
            return [];
        }

        return data.map((t: any) => ({
            id: t.id,
            employeeId: t.employee_id,
            jobId: t.job_id,
            points: t.points,
            type: t.type,
            description: t.description,
            timestamp: t.timestamp
        }));
    }
};

export const storePointsService = {
    async getAll() {
        const { data, error } = await supabase.from('store_points').select('*');
        if (error) {
            console.error('Error fetching store points:', error);
            return [];
        }
        return data.map((sp: any) => ({
            id: sp.id,
            siteId: sp.site_id,
            siteName: sp.site_name,
            totalPoints: sp.total_points,
            weeklyPoints: sp.weekly_points,
            monthlyPoints: sp.monthly_points,
            todayPoints: sp.today_points,
            totalTransactions: sp.total_transactions,
            totalRevenue: sp.total_revenue,
            averageTicketSize: sp.average_ticket_size,
            customerSatisfaction: sp.customer_satisfaction,
            lastTransactionAt: sp.last_transaction_at,
            lastUpdated: sp.last_updated,
            currentTier: sp.current_tier,
            estimated_bonus: sp.estimated_bonus
        }));
    },

    async create(points: StorePoints) {
        const dbPoints = {
            site_id: points.siteId,
            site_name: points.siteName,
            total_points: points.totalPoints,
            weekly_points: points.weeklyPoints,
            monthly_points: points.monthlyPoints,
            today_points: points.todayPoints,
            total_transactions: points.totalTransactions,
            total_revenue: points.totalRevenue,
            average_ticket_size: points.averageTicketSize,
            customer_satisfaction: points.customerSatisfaction,
            last_transaction_at: points.lastTransactionAt,
            last_updated: points.lastUpdated,
            current_tier: points.currentTier,
            estimated_bonus: points.estimatedBonus
        };
        const { data, error } = await supabase.from('store_points').insert(dbPoints).select().single();
        if (error) throw error;
        return { ...points, id: data.id };
    },

    async update(id: string, updates: Partial<StorePoints>) {
        const dbUpdates: any = {};
        if (updates.totalPoints !== undefined) dbUpdates.total_points = updates.totalPoints;
        if (updates.weeklyPoints !== undefined) dbUpdates.weekly_points = updates.weeklyPoints;
        if (updates.monthlyPoints !== undefined) dbUpdates.monthly_points = updates.monthlyPoints;
        if (updates.todayPoints !== undefined) dbUpdates.today_points = updates.todayPoints;
        if (updates.totalTransactions !== undefined) dbUpdates.total_transactions = updates.totalTransactions;
        if (updates.totalRevenue !== undefined) dbUpdates.total_revenue = updates.totalRevenue;
        if (updates.averageTicketSize !== undefined) dbUpdates.average_ticket_size = updates.averageTicketSize;
        if (updates.customerSatisfaction !== undefined) dbUpdates.customer_satisfaction = updates.customerSatisfaction;
        if (updates.lastTransactionAt !== undefined) dbUpdates.last_transaction_at = updates.lastTransactionAt;
        if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;
        if (updates.currentTier !== undefined) dbUpdates.current_tier = updates.currentTier;
        if (updates.estimatedBonus !== undefined) dbUpdates.estimated_bonus = updates.estimatedBonus;

        const { data, error } = await supabase.from('store_points').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};

// ============================================================================
// INVENTORY REQUESTS (Persistent Approval Queue)
// ============================================================================

export const inventoryRequestsService = {
    async getAll(siteId?: string): Promise<PendingInventoryChange[]> {
        const query = supabase.from('inventory_requests').select('*');
        if (siteId) query.eq('site_id', siteId);

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) throw error;

        return data.map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            siteId: r.site_id,
            changeType: r.change_type,
            requestedBy: r.requested_by,
            requestedAt: r.requested_at,
            status: r.status,
            proposedChanges: r.proposed_changes,
            adjustmentType: r.adjustment_type,
            adjustmentQty: r.adjustment_qty,
            adjustmentReason: r.adjustment_reason,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            rejectionReason: r.rejection_reason,
            rejectedBy: r.rejected_by,
            rejectedAt: r.rejected_at
        }));
    },

    async create(request: Omit<PendingInventoryChange, 'id'>) {
        const { data, error } = await supabase.from('inventory_requests').insert({
            site_id: request.siteId,
            product_id: request.productId,
            product_name: request.productName,
            product_sku: request.productSku,
            change_type: request.changeType,
            requested_by: request.requestedBy,
            status: 'pending',
            proposed_changes: request.proposedChanges,
            adjustment_type: request.adjustmentType,
            adjustment_qty: request.adjustmentQty,
            adjustment_reason: request.adjustmentReason
        }).select().single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<PendingInventoryChange>) {
        console.log('📝 inventoryRequestsService.update called:', { id, updates });

        const dbUpdates: any = {
            status: updates.status,
            approved_by: updates.approvedBy,
            approved_at: updates.approvedAt,
            rejection_reason: updates.rejectionReason,
            rejected_by: updates.rejectedBy,
            rejected_at: updates.rejectedAt
        };

        // Remove undefined values to avoid overwriting with null
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) delete dbUpdates[key];
        });

        console.log('📝 DB updates to apply:', dbUpdates);

        const { data, error } = await supabase
            .from('inventory_requests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ inventoryRequestsService.update FAILED:', error);
            throw error;
        }

        console.log('✅ inventoryRequestsService.update SUCCESS:', data);
        return data;
    },

    async delete(id: string) {
        console.log('🗑️ inventoryRequestsService.delete called for ID:', id);
        const { error } = await supabase.from('inventory_requests').delete().eq('id', id);
        if (error) {
            console.error('❌ inventoryRequestsService.delete FAILED:', error);
            throw error;
        }
        console.log('✅ inventoryRequestsService.delete SUCCESS');
    }
};

// ============================================================================
// BRAINSTORM NODES (CEO Canvas)
// ============================================================================

export interface BrainstormNodeDB {
    id: string;
    title: string;
    description: string;
    department: string;
    priority: string;
    status: string;
    x: number;
    y: number;
    connections: string[];
    created_at: string;
    updated_at: string;
    created_by: string;
    // Advanced fields
    due_date?: string | null;
    progress?: number;
    tags?: string[];
    is_starred?: boolean;
    completed_at?: string | null;
    notes?: string;
    color?: string;
}

export const brainstormService = {
    async getAll(): Promise<BrainstormNodeDB[]> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Table might not exist yet - return empty array
            console.warn('brainstorm_nodes table may not exist:', error);
            return [];
        }
        return data || [];
    },

    async create(node: Omit<BrainstormNodeDB, 'id' | 'created_at' | 'updated_at'>): Promise<BrainstormNodeDB> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .insert({
                title: node.title,
                description: node.description,
                notes: node.notes,
                department: node.department,
                priority: node.priority,
                status: node.status,
                tags: node.tags,
                is_starred: node.is_starred,
                x: node.x,
                y: node.y,
                connections: node.connections,
                created_by: node.created_by,
                due_date: node.due_date,
                progress: node.progress,
                completed_at: node.completed_at,
                color: node.color
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<BrainstormNodeDB>): Promise<BrainstormNodeDB> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .update({
                title: updates.title,
                description: updates.description,
                notes: updates.notes,
                department: updates.department,
                priority: updates.priority,
                status: updates.status,
                tags: updates.tags,
                is_starred: updates.is_starred,
                x: updates.x,
                y: updates.y,
                connections: updates.connections,
                due_date: updates.due_date,
                progress: updates.progress,
                completed_at: updates.completed_at,
                color: updates.color,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        // First, remove this node from all connections
        const { data: allNodes } = await supabase
            .from('brainstorm_nodes')
            .select('id, connections');

        if (allNodes) {
            for (const node of allNodes) {
                if (node.connections?.includes(id)) {
                    await supabase
                        .from('brainstorm_nodes')
                        .update({ connections: node.connections.filter((c: string) => c !== id) })
                        .eq('id', node.id);
                }
            }
        }

        const { error } = await supabase
            .from('brainstorm_nodes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async saveViewState(state: { offset: { x: number; y: number }; scale: number }): Promise<void> {
        // Save view state to localStorage as fallback (per-user preference)
        localStorage.setItem('siifmart_brainstorm_view', JSON.stringify(state));
    },

    getViewState(): { offset: { x: number; y: number }; scale: number } | null {
        try {
            const saved = localStorage.getItem('siifmart_brainstorm_view');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }
};

// ============================================================================
// DISCREPANCY RESOLUTIONS & CLAIMS
// ============================================================================

export const discrepancyService = {
    async createResolution(
        resolution: Omit<DiscrepancyResolution, 'id' | 'createdAt' | 'resolvedAt'>
    ): Promise<DiscrepancyResolution> {
        const dbResolution = {
            transfer_id: resolution.transferId,
            line_item_index: resolution.lineItemIndex,
            product_id: resolution.productId,
            expected_qty: resolution.expectedQty,
            received_qty: resolution.receivedQty,
            discrepancy_type: resolution.discrepancyType,
            resolution_type: resolution.resolutionType,
            resolution_status: resolution.resolutionStatus,
            resolution_notes: resolution.resolutionNotes,
            reason_code: resolution.reasonCode,
            estimated_value: resolution.estimatedValue,
            claim_amount: resolution.claimAmount,
            photo_urls: resolution.photoUrls,
            reported_by: resolution.reportedBy,
            site_id: resolution.siteId,
            resolve_qty: resolution.resolveQty,
            replacement_job_id: resolution.replacementJobId
        };
        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .insert(dbResolution)
            .select()
            .single();

        if (error) throw error;
        return this._mapResolution(data);
    },

    async updateResolution(
        id: string,
        updates: Partial<DiscrepancyResolution>
    ): Promise<DiscrepancyResolution> {
        const dbUpdates: any = { ...updates };

        // Map fields
        if (updates.resolutionStatus) dbUpdates.resolution_status = updates.resolutionStatus;
        if (updates.resolutionType) dbUpdates.resolution_type = updates.resolutionType;
        if (updates.resolutionNotes) dbUpdates.resolution_notes = updates.resolutionNotes;
        if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
        if (updates.resolvedBy) dbUpdates.resolved_by = updates.resolvedBy;
        if (updates.resolvedAt) dbUpdates.resolved_at = updates.resolvedAt;

        // Cleanup
        delete dbUpdates.resolutionStatus;
        delete dbUpdates.resolutionType;
        delete dbUpdates.resolutionNotes;
        delete dbUpdates.approvedBy;
        delete dbUpdates.resolvedBy;
        delete dbUpdates.resolvedAt;
        delete dbUpdates.transferId;
        delete dbUpdates.lineItemIndex;
        delete dbUpdates.productId;

        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapResolution(data);
    },

    async getByTransferId(transferId: string): Promise<DiscrepancyResolution[]> {
        const { data, error } = await supabase
            .from('discrepancy_resolutions')
            .select('*')
            .eq('transfer_id', transferId);

        if (error) throw error;
        return (data || []).map((r: any) => this._mapResolution(r));
    },

    async createClaim(
        claim: Omit<DiscrepancyClaim, 'id' | 'submittedAt' | 'paidAt' | 'reviewedAt'>
    ): Promise<DiscrepancyClaim> {
        const dbClaim = {
            resolution_id: claim.resolutionId,
            claim_type: claim.claimType,
            claim_amount: claim.claimAmount,
            carrier_name: claim.carrierName,
            tracking_number: claim.trackingNumber,
            notes: claim.notes,
            documents: claim.documents
        };

        const { data, error } = await supabase
            .from('discrepancy_claims')
            .insert(dbClaim)
            .select()
            .single();

        if (error) throw error;
        return this._mapClaim(data);
    },

    async getClaimByResolutionId(resolutionId: string): Promise<DiscrepancyClaim | null> {
        const { data, error } = await supabase
            .from('discrepancy_claims')
            .select('*')
            .eq('resolution_id', resolutionId)
            .maybeSingle();

        if (error) throw error;
        return data ? this._mapClaim(data) : null;
    },

    _mapResolution(data: any): DiscrepancyResolution {
        return {
            id: data.id,
            transferId: data.transfer_id,
            lineItemIndex: data.line_item_index,
            productId: data.product_id,
            expectedQty: data.expected_qty,
            receivedQty: data.received_qty,
            variance: data.variance,
            discrepancyType: data.discrepancy_type,
            resolveQty: data.resolve_qty,
            resolutionType: data.resolution_type,
            resolutionStatus: data.resolution_status,
            resolutionNotes: data.resolution_notes,
            reasonCode: data.reason_code,
            estimatedValue: data.estimated_value,
            claimAmount: data.claim_amount,
            photoUrls: data.photo_urls,
            reportedBy: data.reported_by,
            resolvedBy: data.resolved_by,
            approvedBy: data.approved_by,
            createdAt: data.created_at,
            resolvedAt: data.resolved_at,
            siteId: data.site_id,
            replacementJobId: data.replacement_job_id,
            replacement_job_id: data.replacement_job_id
        };
    },

    _mapClaim(data: any): DiscrepancyClaim {
        return {
            id: data.id,
            resolutionId: data.resolution_id,
            claimType: data.claim_type,
            claimNumber: data.claim_number,
            claimStatus: data.claim_status,
            claimAmount: data.claim_amount,
            approvedAmount: data.approved_amount,
            submittedAt: data.submitted_at,
            reviewedAt: data.reviewed_at,
            paidAt: data.paid_at,
            carrierName: data.carrier_name,
            trackingNumber: data.tracking_number,
            documents: data.documents,
            notes: data.notes
        };
    }
};

// ============================================================================
// EMPLOYEE TASKS
// ============================================================================

import type { EmployeeTask } from '../types';

export const tasksService = {
    async getAll(siteId?: string, limit?: number): Promise<EmployeeTask[]> {
        try {
            let query = supabase
                .from('employee_tasks')
                .select('*')
                .order('due_date', { ascending: true });

            if (siteId) {
                query = query.eq('site_id', siteId);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            console.error('Error in tasksService.getAll:', error);
            return [];
        }
    },

    async getById(id: string): Promise<EmployeeTask | null> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.getById:', error);
            return null;
        }
    },

    async getByEmployee(employeeId: string): Promise<EmployeeTask[]> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select('*')
                .eq('assigned_to', employeeId)
                .order('due_date', { ascending: true });

            if (error) {
                console.error('Error fetching tasks for employee:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            console.error('Error in tasksService.getByEmployee:', error);
            return [];
        }
    },

    async create(task: Omit<EmployeeTask, 'id'>): Promise<EmployeeTask | null> {
        try {
            const dbTask = {
                title: task.title,
                description: task.description,
                assigned_to: task.assignedTo,
                status: task.status || 'Pending',
                priority: task.priority || 'Medium',
                due_date: task.dueDate
            };

            const { data, error } = await supabase
                .from('employee_tasks')
                .insert(dbTask)
                .select()
                .single();

            if (error) {
                console.error('Error creating task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.create:', error);
            return null;
        }
    },

    async update(id: string, updates: Partial<EmployeeTask>): Promise<EmployeeTask | null> {
        try {
            const dbUpdates: any = {};

            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
            if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

            dbUpdates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('employee_tasks')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.update:', error);
            return null;
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('employee_tasks')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting task:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in tasksService.delete:', error);
            return false;
        }
    },

    _mapTask(data: any): EmployeeTask {
        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            assignedTo: data.assigned_to,
            status: data.status as EmployeeTask['status'],
            priority: data.priority as EmployeeTask['priority'],
            dueDate: data.due_date,
            createdBy: data.created_by
        };
    }
};

// ============================================================================
// STAFF SCHEDULES (E-ROSTERING)
// ============================================================================

import type { StaffSchedule } from '../types';

export const schedulesService = {
    async getAll(siteId?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules').select('*');
        if (siteId) query = query.eq('site_id', siteId);

        const { data, error } = await query.order('date', { ascending: true });
        if (error) {
            console.warn('staff_schedules table unreachable:', error.message);
            return [];
        }
        return (data || []).map(this._mapSchedule);
    },

    async create(schedule: Omit<StaffSchedule, 'id'>): Promise<StaffSchedule | null> {
        const dbSchedule = {
            site_id: schedule.siteId,
            employee_id: schedule.employeeId,
            employee_name: schedule.employeeName,
            date: schedule.date,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            role: schedule.role,
            notes: schedule.notes,
            status: schedule.status
        };

        const { data, error } = await supabase
            .from('staff_schedules')
            .insert(dbSchedule)
            .select()
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async update(id: string, updates: Partial<StaffSchedule>): Promise<StaffSchedule | null> {
        const dbUpdates: any = {};
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.startTime) dbUpdates.start_time = updates.startTime;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('staff_schedules')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
        if (error) throw error;
    },

    _mapSchedule(data: any): StaffSchedule {
        return {
            id: data.id,
            siteId: data.site_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            date: data.date,
            startTime: data.start_time,
            endTime: data.end_time,
            role: data.role,
            notes: data.notes,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
};

