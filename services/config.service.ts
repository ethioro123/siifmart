import { supabase } from '../lib/supabase';
import type { SystemConfig } from '../types';
import { getEffectiveCountry, getCountryProfile, COUNTRY_LEGAL_DEFAULTS } from '../utils/localization';
import { LIVE_SYSTEM_CONFIG_COLUMNS, FIELD_TO_DB_MAP } from './config-schema';

export const systemConfigService = {
    async getSettings(): Promise<SystemConfig> {
        // Zero-Trust Security: Purge any legacy unencrypted configuration/secrets from browser storage
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem('siifmart_system_config');
            } catch {
                // Safe ignore
            }
        }

        const { data, error } = await supabase.rpc('get_sanitized_system_config');
        if (error) throw error;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('The secure settings endpoint returned an invalid response.');
        }
        return this._mapSettings(data);
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
                .update(finalUpdates)
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .select('id')
                .maybeSingle();

            if (error) {
                console.error('Failed to update system_config in Supabase:', error);
                throw error;
            }
            if (!data) throw new Error('System settings could not be updated for this account.');
            return this._mapSettings(finalUpdates, updates);
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
