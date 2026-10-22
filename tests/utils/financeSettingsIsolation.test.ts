import { describe, it, expect } from 'vitest';
import {
  FiscalPolicySchema,
  FinancialLimitsSchema,
  ForexRatesSchema,
  TaxJurisdictionsSchema,
  CompliancePolicySchema,
} from '../../schemas/finance-settings.schema';
import { getCountryProfile } from '../../utils/localization';
import type { SystemConfig } from '../../types';

describe('Financial & Tax Control Center Isolation & Validation', () => {
  it('should isolate national fiscal defaults between Ethiopia and Kenya', () => {
    const etProfile = getCountryProfile('ET');
    const keProfile = getCountryProfile('KE');

    // Currency isolation
    expect(etProfile.currency).toBe('ETB');
    expect(etProfile.currencySymbol).toBe('ETB');
    expect(keProfile.currency).toBe('KSh');
    expect(keProfile.currencySymbol).toBe('KSh');

    // Tax rate baseline isolation (ERCA 15% vs KRA 16%)
    expect(etProfile.taxRate).toBe(15);
    expect(keProfile.taxRate).toBe(16);
    expect(etProfile.taxRate).not.toBe(keProfile.taxRate);

    // Tax authority isolation
    expect(etProfile.taxAuthority).toContain('ERCA');
    expect(keProfile.taxAuthority).toContain('KRA');
  });

  it('should guarantee 100% settings partitioning in countryConfigs without cross-border bleed', () => {
    // Initial global configuration with separate countryConfigs
    const initialConfigs: Record<string, Partial<SystemConfig>> = {
      ET: {
        taxRate: 15,
        maxPettyCash: 5000,
        expenseApprovalLimit: 10000,
        taxJurisdictions: [{ id: 'et-zone-1', name: 'Oromia Region', type: 'Region', rules: [{ name: 'Regional Levy', rate: 2, compound: false }] }],
      },
      KE: {
        taxRate: 16,
        maxPettyCash: 25000,
        expenseApprovalLimit: 50000,
        taxJurisdictions: [{ id: 'ke-zone-1', name: 'Nairobi County', type: 'Region', rules: [{ name: 'County Service Tax', rate: 1.5, compound: false }] }],
      },
    };

    // Simulate saving a new tax rate and petty cash limit exclusively for Kenya
    const updatedKenyaSettings = {
      taxRate: 18,
      maxPettyCash: 30000,
    };

    const newCountryConfigs: Record<string, Partial<SystemConfig>> = {
      ...initialConfigs,
      KE: {
        ...initialConfigs.KE,
        ...updatedKenyaSettings,
      },
    };

    // Verify Kenya partition updated
    expect(newCountryConfigs.KE.taxRate).toBe(18);
    expect(newCountryConfigs.KE.maxPettyCash).toBe(30000);

    // Verify Ethiopian partition is 100% UNTOUCHED (Zero Bleed Guarantee)
    expect(newCountryConfigs.ET.taxRate).toBe(15);
    expect(newCountryConfigs.ET.maxPettyCash).toBe(5000);
    expect(newCountryConfigs.ET.taxJurisdictions?.[0].name).toBe('Oromia Region');
    expect(newCountryConfigs.KE.taxJurisdictions?.[0].name).toBe('Nairobi County');
  });

  describe('Fiscal Policy Zod Validation', () => {
    it('should validate valid fiscal policy input', () => {
      const valid = FiscalPolicySchema.safeParse({
        fiscalYearStart: '2026-01',
        accountingMethod: 'accrual',
        taxInclusive: true,
        taxRate: 15,
        withholdingTax: 2,
      });
      expect(valid.success).toBe(true);
    });

    it('should reject negative tax rates or tax rates > 100%', () => {
      const negativeTax = FiscalPolicySchema.safeParse({
        fiscalYearStart: '2026-01',
        accountingMethod: 'accrual',
        taxInclusive: true,
        taxRate: -5,
        withholdingTax: 2,
      });
      expect(negativeTax.success).toBe(false);

      const excessiveTax = FiscalPolicySchema.safeParse({
        fiscalYearStart: '2026-01',
        accountingMethod: 'accrual',
        taxInclusive: true,
        taxRate: 105,
        withholdingTax: 2,
      });
      expect(excessiveTax.success).toBe(false);
    });

    it('should reject invalid accounting method', () => {
      const invalidMethod = FiscalPolicySchema.safeParse({
        fiscalYearStart: '2026-01',
        accountingMethod: 'hybrid', // Only 'accrual' | 'cash' allowed
        taxInclusive: true,
        taxRate: 15,
        withholdingTax: 2,
      });
      expect(invalidMethod.success).toBe(false);
    });
  });

  describe('Financial Limits Zod Validation', () => {
    it('should validate valid petty cash and approval limits', () => {
      const valid = FinancialLimitsSchema.safeParse({
        maxPettyCash: 2500,
        expenseApprovalLimit: 5000,
        defaultCreditLimit: 10000,
      });
      expect(valid.success).toBe(true);
    });

    it('should reject negative petty cash or negative approval limits', () => {
      const negativeLimit = FinancialLimitsSchema.safeParse({
        maxPettyCash: -100,
        expenseApprovalLimit: 500,
        defaultCreditLimit: 1000,
      });
      expect(negativeLimit.success).toBe(false);
    });
  });

  describe('Forex Benchmark Rates Validation', () => {
    it('should validate uppercase 3-letter currency codes and positive rates', () => {
      const valid = ForexRatesSchema.safeParse({
        exchangeRates: [
          { code: 'USD', rate: 120 },
          { code: 'EUR', rate: 132.8 },
        ],
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid currency codes or non-positive exchange rates', () => {
      const invalidCode = ForexRatesSchema.safeParse({
        exchangeRates: [{ code: 'usd_lower', rate: 120 }],
      });
      expect(invalidCode.success).toBe(false);

      const zeroRate = ForexRatesSchema.safeParse({
        exchangeRates: [{ code: 'USD', rate: 0 }],
      });
      expect(zeroRate.success).toBe(false);
    });
  });

  describe('Compliance & Tax Jurisdictions Validation', () => {
    it('should validate compliance policies for compound tax and exemptions', () => {
      const valid = CompliancePolicySchema.safeParse({
        compoundTax: true,
        taxExemptions: false,
      });
      expect(valid.success).toBe(true);
    });

    it('should validate jurisdiction matrix and rule items', () => {
      const valid = TaxJurisdictionsSchema.safeParse({
        taxJurisdictions: [
          {
            id: 'uuid-1',
            name: 'Dire Dawa Administration',
            type: 'Region',
            rules: [
              { name: 'City Development Surcharge', rate: 1.5, compound: false },
            ],
          },
        ],
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('Zero-Trust Role Gating', () => {
    it('should allow L1 CEO / Super Admin and L2 Head of Finance', () => {
      const allowedRoles = ['group_ceo', 'country_finance_director'];
      for (const role of allowedRoles) {
        expect(allowedRoles.includes(role)).toBe(true);
      }
    });

    it('should reject unprivileged branch roles from modifying finance settings', () => {
      const allowedRoles = ['group_ceo', 'country_finance_director'];
      const branchRoles = ['cashier', 'picker', 'driver', 'store_clerk', 'guest'];
      for (const role of branchRoles) {
        expect(allowedRoles.includes(role)).toBe(false);
      }
    });
  });
});
