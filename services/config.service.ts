import { supabase } from '../lib/supabase';
import type { SystemConfig } from '../types';
import { getEffectiveCountry, getCountryProfile, COUNTRY_LEGAL_DEFAULTS } from '../utils/localization';

// Columns confirmed to exist on the remote Supabase system_config table via schema probe.
// Any update payload MUST be filtered through this allowlist to prevent PostgREST PGRST204 errors.
const LIVE_SYSTEM_CONFIG_COLUMNS = new Set([
    'accounting_method',
    'bin_scan',
    'brand_color',
    'country_configs',
    'created_at',
    'currency',
    'cycle_count_strategy',
    'date_format',
    'default_credit_limit',
    'default_vat_rate',
    'enable_loyalty',
    'enable_wms',
    'enforce_regional_zoning',
    'expense_approval_limit',
    'fefo_rotation',
    'fiscal_year_start',
    'id',
    'language',
    'legal_business_name',
    'logo_url',
    'low_stock_threshold',
    'max_petty_cash',
    'multi_currency',
    'number_format',
    'over_receive_tolerance_pct',
    'payment_card',
    'payment_cash',
    'payment_mobile_money',
    'payment_store_credit',
    'picking_method',
    'po_price_apply_at',
    'pos_auto_print',
    'pos_block_negative_stock',
    'pos_digital_receipts',
    'pos_guest_checkout',
    'pos_receipt_address',
    'pos_receipt_email',
    'pos_receipt_enable_qr',
    'pos_receipt_font',
    'pos_receipt_footer',
    'pos_receipt_header',
    'pos_receipt_logo',
    'pos_receipt_phone',
    'pos_receipt_policy',
    'pos_receipt_qr_link',
    'pos_receipt_show_logo',
    'pos_receipt_social_handle',
    'pos_receipt_tax_id',
    'pos_receipt_width',
    'pos_register_mode',
    'pos_terminal_id',
    'print_price_tag_at',
    'putaway_logic',
    'qc_block_on_failure',
    'qc_sampling_rate',
    'receiving_logic',
    'registered_address',
    'max_cycle_count_recounts',
    'pack_weight_tolerance_pct',
    'require_expiry',
    'require_pack_carton_weight',
    'require_pack_security_seal',
    'require_pick_quantity_entry',
    'require_putaway_quantity_entry',
    'require_second_counter_on_variance',
    'require_shift_closure',
    'reserve_stock_buffer',
    'role_permissions',
    'role_policies',
    'rotation_policy',
    'scale_ip_address',
    'scanner_com_port',
    'slogan',
    'store_name',
    'strict_scanning',
    'support_contact',
    'support_phone',
    'tax_inclusive',
    'tax_jurisdictions',
    'tax_on_purchasing',
    'tax_on_selling',
    'tax_rate',
    'tax_vat_number',
    'timezone',
    'updated_at',
    'updated_by',
    'webhook_customer_signup',
    'webhook_inventory_low',
    'webhook_order_created',
    'withholding_tax'
]);

// Map TypeScript camelCase property names to PostgreSQL snake_case column names
const FIELD_TO_DB_MAP: Record<string, string> = {
    storeName: 'store_name',
    slogan: 'slogan',
    logoUrl: 'logo_url',
    brandColor: 'brand_color',
    legalBusinessName: 'legal_business_name',
    taxVatNumber: 'tax_vat_number',
    registeredAddress: 'registered_address',
    supportContact: 'support_contact',
    supportPhone: 'support_phone',
    country: 'country',
    currency: 'currency',
    timezone: 'timezone',
    dateFormat: 'date_format',
    numberFormat: 'number_format',
    language: 'language',
    taxRate: 'tax_rate',
    defaultVatRate: 'default_vat_rate',
    taxAuthority: 'tax_authority',
    complianceStandard: 'compliance_standard',
    eTimsEnabled: 'e_tims_enabled',
    countryConfigs: 'country_configs',
    rolePolicies: 'role_policies',
    rolePermissions: 'role_permissions',
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
    taxOnSelling: 'tax_on_selling',
    taxOnPurchasing: 'tax_on_purchasing',
    withholdingTax: 'withholding_tax',
    maxPettyCash: 'max_petty_cash',
    expenseApprovalLimit: 'expense_approval_limit',
    defaultCreditLimit: 'default_credit_limit',
    receivingLogic: 'receiving_logic',
    qcSamplingRate: 'qc_sampling_rate',
    qcBlockOnFailure: 'qc_block_on_failure',
    putawayLogic: 'putaway_logic',
    requirePutawayQuantityEntry: 'require_putaway_quantity_entry',
    overReceiveTolerancePct: 'over_receive_tolerance_pct',
    poPriceApplyAt: 'po_price_apply_at',
    printPriceTagAt: 'print_price_tag_at',
    rotationPolicy: 'rotation_policy',
    requireExpiry: 'require_expiry',
    cycleCountStrategy: 'cycle_count_strategy',
    maxCycleCountRecounts: 'max_cycle_count_recounts',
    requireSecondCounterOnVariance: 'require_second_counter_on_variance',
    pickingMethod: 'picking_method',
    strictScanning: 'strict_scanning',
    requirePickQuantityEntry: 'require_pick_quantity_entry',
    requirePackSecuritySeal: 'require_pack_security_seal',
    requirePackCartonWeight: 'require_pack_carton_weight',
    packWeightTolerancePct: 'pack_weight_tolerance_pct',
    reserveStockBuffer: 'reserve_stock_buffer',
    webhookOrderCreated: 'webhook_order_created',
    webhookInventoryLow: 'webhook_inventory_low',
    webhookCustomerSignup: 'webhook_customer_signup',
    scaleIpAddress: 'scale_ip_address',
    scannerComPort: 'scanner_com_port',
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
    bonusEnabled: 'bonus_enabled',
    bonusTiers: 'bonus_tiers',
    bonusPayoutFrequency: 'bonus_payout_frequency',
    warehousePointsEligibleRoles: 'warehouse_points_eligible_roles',
    warehousePointRules: 'warehouse_point_rules',
    posBonusEnabled: 'pos_bonus_enabled',
    posBonusTiers: 'pos_bonus_tiers',
    posBonusPayoutFrequency: 'pos_bonus_payout_frequency',
    posRoleDistribution: 'pos_role_distribution',
    posPointRules: 'pos_point_rules',
    enforceRegionalZoning: 'enforce_regional_zoning',
    mpesaTillEnabled: 'mpesa_till_enabled',
    mpesaTillNumber: 'mpesa_till_number',
    mpesaTillName: 'mpesa_till_name',
    mpesaStkEnabled: 'mpesa_stk_enabled',
    mpesaStkShortcode: 'mpesa_stk_shortcode',
    mpesaPasskey: 'mpesa_passkey',
    mpesaConsumerKey: 'mpesa_consumer_key',
    mpesaConsumerSecret: 'mpesa_consumer_secret',
    mpesaEnvironment: 'mpesa_environment',
    mpesaPaybillEnabled: 'mpesa_paybill_enabled',
    mpesaPaybillNumber: 'mpesa_paybill_number',
    mpesaPaybillAccount: 'mpesa_paybill_account',
    airtelMoneyEnabled: 'airtel_money_enabled',
    airtelTillNumber: 'airtel_till_number',
    airtelMerchantName: 'airtel_merchant_name',
    telebirrEnabled: 'telebirr_enabled',
    telebirrMerchantId: 'telebirr_merchant_id',
    cbeBirrEnabled: 'cbe_birr_enabled',
    cbeBirrMerchantCode: 'cbe_birr_merchant_code'
};

export const systemConfigService = {
    async getSettings(): Promise<SystemConfig> {
        let localOverrides: Partial<SystemConfig> | undefined;
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('siifmart_system_config');
                if (saved) {
                    localOverrides = JSON.parse(saved);
                }
            }
        } catch {
            // Non-blocking localStorage read error
        }

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
                return this._mapSettings({}, localOverrides);
            }

            return this._mapSettings(data, localOverrides);
        } catch (err) {
            console.warn('⚠️ Settings load failed, using fallback logic:', err);
            return this._mapSettings({}, localOverrides);
        }
    },

    async updateSettings(updates: Partial<SystemConfig>, userName: string): Promise<SystemConfig> {
        // Enforce explicit column allowlist: only send columns confirmed to exist in system_config
        const finalUpdates: Record<string, unknown> = {
            id: '00000000-0000-0000-0000-000000000001',
            updated_at: new Date().toISOString(),
            updated_by: userName
        };

        for (const [key, value] of Object.entries(updates)) {
            if (value === undefined) continue;
            const dbKey = FIELD_TO_DB_MAP[key] || key;
            if (LIVE_SYSTEM_CONFIG_COLUMNS.has(dbKey)) {
                finalUpdates[dbKey] = value;
            }
        }

        try {
            const { data, error } = await supabase
                .from('system_config')
                .upsert(finalUpdates)
                .select()
                .single();

            if (error) {
                console.error('Failed to update system_config in Supabase:', error);
                throw error;
            }
            return this._mapSettings(data, updates);
        } catch (err) {
            console.error('Failed to update system_config:', err);
            throw err;
        }
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

    _mapSettings(data: any, overrides?: Partial<SystemConfig>): SystemConfig {
        const country = getEffectiveCountry({
            country: overrides?.country || data.country,
            currency: overrides?.currency || data.currency,
            timezone: overrides?.timezone || data.timezone
        });
        const profile = getCountryProfile(country);
        const isKe = country === 'KE';

        return {
            storeName: overrides?.storeName ?? data.store_name ?? 'SiifMart',
            slogan: overrides?.slogan ?? data.slogan ?? 'Little Grocery • Big Care',
            logoUrl: overrides?.logoUrl ?? data.logo_url,
            brandColor: overrides?.brandColor ?? data.brand_color,
            legalBusinessName: overrides?.legalBusinessName ?? data.legal_business_name ?? COUNTRY_LEGAL_DEFAULTS[country]?.legalBusinessName,
            taxVatNumber: overrides?.taxVatNumber ?? data.tax_vat_number ?? COUNTRY_LEGAL_DEFAULTS[country]?.taxVatNumber,
            registeredAddress: overrides?.registeredAddress ?? data.registered_address ?? COUNTRY_LEGAL_DEFAULTS[country]?.registeredAddress,
            supportContact: overrides?.supportContact ?? data.support_contact,
            supportPhone: overrides?.supportPhone ?? data.support_phone,
            country,
            currency: overrides?.currency ?? (data.currency === 'KES' ? 'KSh' : (data.currency || profile.currency)),
            timezone: overrides?.timezone ?? (data.timezone || profile.timezone),
            dateFormat: overrides?.dateFormat ?? data.date_format ?? profile.dateFormat ?? 'DD/MM/YYYY',
            numberFormat: overrides?.numberFormat ?? data.number_format ?? profile.numberFormat ?? '1,000.00',
            language: overrides?.language ?? (country !== 'ET' && (data.language === 'am' || data.language === 'or')
                ? 'en'
                : (data.language || 'en')),
            taxRate: overrides?.taxRate ?? data.tax_rate ?? profile.taxRate,
            taxAuthority: overrides?.taxAuthority ?? data.tax_authority ?? profile.taxAuthority,
            complianceStandard: overrides?.complianceStandard ?? data.compliance_standard ?? profile.complianceStandard,
            eTimsEnabled: overrides?.eTimsEnabled ?? data.e_tims_enabled ?? isKe,
            countryConfigs: overrides?.countryConfigs ?? data.country_configs,
            rolePolicies: overrides?.rolePolicies ?? data.role_policies,
            rolePermissions: overrides?.rolePermissions ?? data.role_permissions,
            lowStockThreshold: overrides?.lowStockThreshold ?? data.low_stock_threshold ?? 10,
            fefoRotation: overrides?.fefoRotation ?? data.fefo_rotation ?? true,
            binScan: overrides?.binScan ?? data.bin_scan ?? false,
            enableLoyalty: overrides?.enableLoyalty ?? data.enable_loyalty ?? false,
            enableWMS: overrides?.enableWMS ?? data.enable_wms ?? false,
            multiCurrency: overrides?.multiCurrency ?? data.multi_currency ?? false,
            requireShiftClosure: overrides?.requireShiftClosure ?? data.require_shift_closure ?? true,
            posTerminalId: overrides?.posTerminalId ?? data.pos_terminal_id ?? 'TERM-001',
            posRegisterMode: overrides?.posRegisterMode ?? data.pos_register_mode ?? 'cashier',
            posGuestCheckout: overrides?.posGuestCheckout ?? data.pos_guest_checkout ?? true,
            posBlockNegativeStock: overrides?.posBlockNegativeStock ?? data.pos_block_negative_stock ?? false,
            posDigitalReceipts: overrides?.posDigitalReceipts ?? data.pos_digital_receipts ?? true,
            posAutoPrint: overrides?.posAutoPrint ?? data.pos_auto_print ?? false,
            payment_cash: overrides?.payment_cash ?? data.payment_cash ?? true,
            payment_card: overrides?.payment_card ?? data.payment_card ?? true,
            payment_mobile_money: overrides?.payment_mobile_money ?? data.payment_mobile_money ?? true,
            payment_store_credit: overrides?.payment_store_credit ?? data.payment_store_credit ?? false,
            fiscalYearStart: overrides?.fiscalYearStart ?? data.fiscal_year_start ?? '01/01',
            accountingMethod: overrides?.accountingMethod ?? data.accounting_method ?? 'accrual',
            taxInclusive: overrides?.taxInclusive ?? data.tax_inclusive ?? true,
            taxOnSelling: overrides?.taxOnSelling ?? data.tax_on_selling ?? false,
            taxOnPurchasing: overrides?.taxOnPurchasing ?? data.tax_on_purchasing ?? false,
            defaultVatRate: overrides?.defaultVatRate ?? data.default_vat_rate ?? (isKe ? 16 : 15),
            withholdingTax: overrides?.withholdingTax ?? data.withholding_tax ?? 2,
            maxPettyCash: overrides?.maxPettyCash ?? data.max_petty_cash ?? 5000,
            expenseApprovalLimit: overrides?.expenseApprovalLimit ?? data.expense_approval_limit ?? 10000,
            defaultCreditLimit: overrides?.defaultCreditLimit ?? data.default_credit_limit ?? 50000,
            receivingLogic: overrides?.receivingLogic ?? data.receiving_logic ?? 'blind',
            qcSamplingRate: overrides?.qcSamplingRate ?? data.qc_sampling_rate ?? 10,
            qcBlockOnFailure: overrides?.qcBlockOnFailure ?? data.qc_block_on_failure ?? true,
            putawayLogic: overrides?.putawayLogic ?? data.putaway_logic ?? 'system',
            overReceiveTolerancePct: overrides?.overReceiveTolerancePct ?? data.over_receive_tolerance_pct ?? 0,
            poPriceApplyAt: overrides?.poPriceApplyAt ?? data.po_price_apply_at ?? 'putaway',
            printPriceTagAt: overrides?.printPriceTagAt ?? data.print_price_tag_at ?? 'store',
            rotationPolicy: overrides?.rotationPolicy ?? data.rotation_policy ?? 'fefo',
            requireExpiry: overrides?.requireExpiry ?? data.require_expiry ?? true,
            cycleCountStrategy: overrides?.cycleCountStrategy ?? data.cycle_count_strategy ?? 'abc',
            exchangeRates: overrides?.exchangeRates ?? data.exchange_rates ?? [],
            pickingMethod: overrides?.pickingMethod ?? data.picking_method ?? 'zone',
            strictScanning: overrides?.strictScanning ?? data.strict_scanning ?? true,
            reserveStockBuffer: overrides?.reserveStockBuffer ?? data.reserve_stock_buffer ?? 5,
            webhookOrderCreated: overrides?.webhookOrderCreated ?? data.webhook_order_created,
            webhookInventoryLow: overrides?.webhookInventoryLow ?? data.webhook_inventory_low,
            webhookCustomerSignup: overrides?.webhookCustomerSignup ?? data.webhook_customer_signup,
            scaleIpAddress: overrides?.scaleIpAddress ?? data.scale_ip_address,
            scannerComPort: overrides?.scannerComPort ?? data.scanner_com_port,
            posReceiptLogo: overrides?.posReceiptLogo ?? data.pos_receipt_logo,
            posReceiptShowLogo: overrides?.posReceiptShowLogo ?? data.pos_receipt_show_logo ?? true,
            posReceiptHeader: overrides?.posReceiptHeader ?? data.pos_receipt_header ?? 'SiifMart Retail',
            posReceiptFooter: overrides?.posReceiptFooter ?? data.pos_receipt_footer ?? 'Thank you for shopping with us!',
            posReceiptAddress: overrides?.posReceiptAddress ?? data.pos_receipt_address,
            posReceiptPhone: overrides?.posReceiptPhone ?? data.pos_receipt_phone,
            posReceiptEmail: overrides?.posReceiptEmail ?? data.pos_receipt_email,
            posReceiptTaxId: overrides?.posReceiptTaxId ?? data.pos_receipt_tax_id,
            posReceiptPolicy: overrides?.posReceiptPolicy ?? data.pos_receipt_policy ?? 'Items may be returned within 7 days with valid receipt.',
            posReceiptSocialHandle: overrides?.posReceiptSocialHandle ?? data.pos_receipt_social_handle,
            posReceiptEnableQR: overrides?.posReceiptEnableQR ?? data.pos_receipt_enable_qr ?? true,
            posReceiptQRLink: overrides?.posReceiptQRLink ?? data.pos_receipt_qr_link,
            posReceiptWidth: overrides?.posReceiptWidth ?? data.pos_receipt_width ?? '80mm',
            posReceiptFont: overrides?.posReceiptFont ?? data.pos_receipt_font ?? 'sans-serif',
            taxJurisdictions: overrides?.taxJurisdictions ?? data.tax_jurisdictions ?? [],
            // Gamification fields
            bonusEnabled: overrides?.bonusEnabled ?? data.bonus_enabled ?? true,
            bonusTiers: overrides?.bonusTiers ?? data.bonus_tiers ?? [],
            bonusPayoutFrequency: overrides?.bonusPayoutFrequency ?? data.bonus_payout_frequency ?? 'monthly',
            warehousePointsEligibleRoles: overrides?.warehousePointsEligibleRoles ?? data.warehouse_points_eligible_roles ?? [],
            warehousePointRules: overrides?.warehousePointRules ?? data.warehouse_point_rules ?? [],
            posBonusEnabled: overrides?.posBonusEnabled ?? data.pos_bonus_enabled ?? true,
            posBonusTiers: overrides?.posBonusTiers ?? data.pos_bonus_tiers ?? [],
            posBonusPayoutFrequency: overrides?.posBonusPayoutFrequency ?? data.pos_bonus_payout_frequency ?? 'monthly',
            posRoleDistribution: overrides?.posRoleDistribution ?? data.pos_role_distribution ?? [],
            posPointRules: overrides?.posPointRules ?? data.pos_point_rules ?? [],
            enforceRegionalZoning: overrides?.enforceRegionalZoning ?? data.enforce_regional_zoning ?? false,
            // Mobile payment gateways
            mpesaTillEnabled: overrides?.mpesaTillEnabled ?? data.mpesa_till_enabled ?? true,
            mpesaTillNumber: overrides?.mpesaTillNumber ?? data.mpesa_till_number ?? '882910',
            mpesaTillName: overrides?.mpesaTillName ?? data.mpesa_till_name ?? 'SiifMart Main Store',
            mpesaStkEnabled: overrides?.mpesaStkEnabled ?? data.mpesa_stk_enabled ?? true,
            mpesaStkShortcode: overrides?.mpesaStkShortcode ?? data.mpesa_stk_shortcode ?? '174379',
            mpesaPasskey: overrides?.mpesaPasskey ?? data.mpesa_passkey ?? '',
            mpesaConsumerKey: overrides?.mpesaConsumerKey ?? data.mpesa_consumer_key ?? '',
            mpesaConsumerSecret: overrides?.mpesaConsumerSecret ?? data.mpesa_consumer_secret ?? '',
            mpesaEnvironment: overrides?.mpesaEnvironment ?? data.mpesa_environment ?? 'sandbox',
            mpesaPaybillEnabled: overrides?.mpesaPaybillEnabled ?? data.mpesa_paybill_enabled ?? false,
            mpesaPaybillNumber: overrides?.mpesaPaybillNumber ?? data.mpesa_paybill_number ?? '400200',
            mpesaPaybillAccount: overrides?.mpesaPaybillAccount ?? data.mpesa_paybill_account ?? 'SiifMart',
            airtelMoneyEnabled: overrides?.airtelMoneyEnabled ?? data.airtel_money_enabled ?? true,
            airtelTillNumber: overrides?.airtelTillNumber ?? data.airtel_till_number ?? '554433',
            airtelMerchantName: overrides?.airtelMerchantName ?? data.airtel_merchant_name ?? 'SiifMart Airtel',
            telebirrEnabled: overrides?.telebirrEnabled ?? data.telebirr_enabled ?? true,
            telebirrMerchantId: overrides?.telebirrMerchantId ?? data.telebirr_merchant_id ?? 'TB-998811',
            cbeBirrEnabled: overrides?.cbeBirrEnabled ?? data.cbe_birr_enabled ?? true,
            cbeBirrMerchantCode: overrides?.cbeBirrMerchantCode ?? data.cbe_birr_merchant_code ?? 'CBE-445566'
        };
    }
};
