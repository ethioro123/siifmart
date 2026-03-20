import { supabase } from '../lib/supabase';
import type { SystemConfig } from '../types';

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

    async initializeStorage(): Promise<void> {
        try {
            const BUCKET_NAME = 'system-assets';
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                // If we can't list buckets, it's likely an RLS/Permission issue on the Storage API
                if (listError.message.toLowerCase().includes('row-level security') || listError.message.toLowerCase().includes('permission')) {
                } else {
                    console.warn(`[Storage] Could not list buckets: ${listError.message}`);
                }
                return;
            }

            const exists = buckets?.some(b => b.name === BUCKET_NAME);

            if (!exists) {
                const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
                    public: true,
                    fileSizeLimit: 10 * 1024 * 1024 // 10MB
                });

                if (createError) {
                    if (createError.message.toLowerCase().includes('row-level security')) {
                        console.warn(`[Storage] RLS Restriction: Cannot create '${BUCKET_NAME}' bucket from client. Please run the SQL migration or create it manually.`);
                    } else {
                        console.warn(`[Storage] Could not create '${BUCKET_NAME}' bucket:`, createError.message);
                    }
                } else {
                }
            }
        } catch (err) {
            console.warn('[Storage] Error in initializeStorage:', err);
        }
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
