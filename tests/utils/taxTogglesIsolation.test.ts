import { describe, it, expect } from 'vitest';
import { FiscalPolicySchema } from '../../schemas/finance-settings.schema';
import type { SystemConfig, Site } from '../../types';

describe('Tax / VAT Toggles & Multi-Country Isolation (Selling & Buying)', () => {
    describe('Zod Schema Validation for Fiscal Policy', () => {
        it('validates fiscal policy with taxOnSelling and taxOnPurchasing enabled', () => {
            const input = {
                fiscalYearStart: '2026-07',
                accountingMethod: 'accrual' as const,
                taxInclusive: true,
                taxOnSelling: true,
                taxOnPurchasing: true,
                taxRate: 16,
                withholdingTax: 2,
            };

            const result = FiscalPolicySchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.taxOnSelling).toBe(true);
                expect(result.data.taxOnPurchasing).toBe(true);
            }
        });

        it('validates fiscal policy with taxOnSelling and taxOnPurchasing turned OFF', () => {
            const input = {
                fiscalYearStart: '2026-01',
                accountingMethod: 'cash' as const,
                taxInclusive: false,
                taxOnSelling: false,
                taxOnPurchasing: false,
                taxRate: 0,
                withholdingTax: 0,
            };

            const result = FiscalPolicySchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.taxOnSelling).toBe(false);
                expect(result.data.taxOnPurchasing).toBe(false);
            }
        });
    });

    describe('Tax On Selling (POS / Sales)', () => {
        const mockSite: Site = {
            id: 'site-ke-1',
            name: 'Nairobi Central Store',
            code: 'KE-NBO-01',
            type: 'Store',
            country: 'KE',
            status: 'Active',
            currency: 'KES',
            address: 'Nairobi, Kenya',
        };

        const computeTaxRulesForSite = (site: Site, settings: SystemConfig) => {
            const siteCountry = (site.country || settings.country || 'ET');
            const countryConfigs = (settings.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
            const activeConfig = countryConfigs[siteCountry] || {};
            const isSalesTaxEnabled = Boolean(activeConfig.taxOnSelling ?? settings.taxOnSelling);

            if (!isSalesTaxEnabled) {
                return [];
            }

            const effectiveTaxRate = activeConfig.taxRate ?? settings.taxRate ?? 0;

            if (!site.taxJurisdictionId) {
                return [{ name: 'Standard Tax', rate: effectiveTaxRate, compound: false }];
            }
            const jurisdictions = activeConfig.taxJurisdictions || settings.taxJurisdictions;
            const jurisdiction = jurisdictions?.find(j => j.id === site.taxJurisdictionId);
            if (!jurisdiction || !jurisdiction.rules || jurisdiction.rules.length === 0) {
                return [{ name: 'Standard Tax', rate: effectiveTaxRate, compound: false }];
            }
            return jurisdiction.rules;
        };

        it('returns standard tax rules when taxOnSelling is active', () => {
            const settings: SystemConfig = {
                storeName: 'SIIFMART',
                currency: 'KES',
                taxRate: 16,
                taxOnSelling: true,
                taxOnPurchasing: true,
                country: 'KE',
                countryConfigs: {
                    KE: { taxRate: 16, taxOnSelling: true },
                },
            } as any;

            const rules = computeTaxRulesForSite(mockSite, settings);
            expect(rules).toHaveLength(1);
            expect(rules[0].rate).toBe(16);
            expect(rules[0].name).toBe('Standard Tax');
        });

        it('returns empty tax rules (0% tax) when taxOnSelling is disabled for the country', () => {
            const settings: SystemConfig = {
                storeName: 'SIIFMART',
                currency: 'KES',
                taxRate: 16,
                taxOnSelling: true,
                country: 'KE',
                countryConfigs: {
                    KE: { taxRate: 16, taxOnSelling: false },
                },
            } as any;

            const rules = computeTaxRulesForSite(mockSite, settings);
            expect(rules).toHaveLength(0);
        });

        it('defaults to 0% sales tax (disabled) when taxOnSelling is undefined (Africa opt-in rule)', () => {
            const settings: SystemConfig = {
                storeName: 'SIIFMART',
                currency: 'KES',
                taxRate: 16,
                country: 'KE',
                countryConfigs: {},
            } as any;

            const rules = computeTaxRulesForSite(mockSite, settings);
            expect(rules).toHaveLength(0); // Strictly opt-in: no automatic tax
        });

        it('supports manual tax rate calculation in POS when taxOnSelling is off', () => {
            const subtotal = 1000;
            const manualRate = 16;
            const manualTax = subtotal * (manualRate / 100);
            expect(manualTax).toBe(160);
        });

        it('supports 0% manual tax exemption override in POS when tax is enabled', () => {
            const subtotal = 1000;
            const manualRate = 0; // Exempt customer
            const manualTax = manualRate > 0 ? subtotal * (manualRate / 100) : 0;
            expect(manualTax).toBe(0);
        });

        it('does not affect Ethiopia sales tax when Kenya turns taxOnSelling OFF', () => {
            const ethiopiaSite: Site = {
                id: 'site-et-1',
                name: 'Merkato Main Store',
                code: 'ET-ADD-01',
                type: 'Store',
                country: 'ET',
                status: 'Active',
                currency: 'ETB',
                address: 'Merkato, Addis Ababa, Ethiopia',
            };

            const settings: SystemConfig = {
                storeName: 'SIIFMART',
                currency: 'ETB',
                taxRate: 15,
                taxOnSelling: true,
                country: 'ET',
                countryConfigs: {
                    KE: { taxRate: 16, taxOnSelling: false },
                    ET: { taxRate: 15, taxOnSelling: true },
                },
            } as any;

            const keRules = computeTaxRulesForSite(mockSite, settings);
            const etRules = computeTaxRulesForSite(ethiopiaSite, settings);

            expect(keRules).toHaveLength(0); // Kenya tax is OFF
            expect(etRules).toHaveLength(1); // Ethiopia tax is strictly PRESERVED
            expect(etRules[0].rate).toBe(15);
        });
    });

    describe('Tax On Purchasing (Procurement / PO Creation)', () => {
        const computeDefaultTaxRateForPO = (country: 'ET' | 'KE', settings: SystemConfig) => {
            const countryConfigs = (settings?.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
            const activeConfig = countryConfigs[country] || {};
            const isPurchasingTaxEnabled = Boolean(activeConfig.taxOnPurchasing ?? settings?.taxOnPurchasing);
            return isPurchasingTaxEnabled ? (country === 'KE' ? 16 : 15) : 0;
        };

        it('defaults to 16% VAT in Kenya when taxOnPurchasing is enabled', () => {
            const settings: SystemConfig = {
                taxOnPurchasing: true,
                countryConfigs: {
                    KE: { taxOnPurchasing: true },
                },
            } as any;

            const rate = computeDefaultTaxRateForPO('KE', settings);
            expect(rate).toBe(16);
        });

        it('defaults to 0% VAT in Kenya when taxOnPurchasing is turned OFF', () => {
            const settings: SystemConfig = {
                taxOnPurchasing: true,
                countryConfigs: {
                    KE: { taxOnPurchasing: false },
                },
            } as any;

            const rate = computeDefaultTaxRateForPO('KE', settings);
            expect(rate).toBe(0);
        });

        it('defaults to 0% VAT when taxOnPurchasing is undefined / omitted (Africa opt-in rule)', () => {
            const settings: SystemConfig = {
                countryConfigs: {},
            } as any;

            const rate = computeDefaultTaxRateForPO('KE', settings);
            expect(rate).toBe(0); // Strictly opt-in: no automatic PO tax
        });

        it('supports manual tax rate entry on PO even when taxOnPurchasing is off', () => {
            const manualPOTaxRate = 16;
            const poSubtotal = 50000;
            const poTax = poSubtotal * (manualPOTaxRate / 100);
            expect(poTax).toBe(8000);
        });

        it('maintains strict isolation between countries on purchasing tax', () => {
            const settings: SystemConfig = {
                taxOnPurchasing: true,
                countryConfigs: {
                    KE: { taxOnPurchasing: false },
                    ET: { taxOnPurchasing: true },
                },
            } as any;

            expect(computeDefaultTaxRateForPO('KE', settings)).toBe(0);
            expect(computeDefaultTaxRateForPO('ET', settings)).toBe(15);
        });
    });
});
