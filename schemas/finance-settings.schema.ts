import { z } from 'zod';

export const FiscalPolicySchema = z.object({
  fiscalYearStart: z.string().min(1, 'Fiscal year start is required'),
  accountingMethod: z.enum(['accrual', 'cash'], {
    message: 'Accounting method must be accrual or cash',
  }),
  taxInclusive: z.boolean(),
  taxOnSelling: z.boolean().optional(),
  taxOnPurchasing: z.boolean().optional(),
  taxRate: z
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  withholdingTax: z
    .number()
    .min(0, 'Withholding tax cannot be negative')
    .max(100, 'Withholding tax cannot exceed 100%'),
});

export const FinancialLimitsSchema = z.object({
  maxPettyCash: z
    .number()
    .min(0, 'Petty cash limit cannot be negative'),
  expenseApprovalLimit: z
    .number()
    .min(0, 'Expense approval limit cannot be negative'),
  defaultCreditLimit: z
    .number()
    .min(0, 'Default credit limit cannot be negative'),
});

export const ExchangeRateItemSchema = z.object({
  code: z
    .string()
    .min(3, 'Currency code must be 3 characters')
    .max(4, 'Currency code too long')
    .regex(/^[A-Z]{3,4}$/, 'Currency code must be uppercase letters'),
  rate: z
    .number()
    .positive('Exchange rate must be greater than zero'),
});

export const ForexRatesSchema = z.object({
  exchangeRates: z.array(ExchangeRateItemSchema),
});

export const TaxRuleSchema = z.object({
  name: z.string().trim().min(1, 'Rule name is required'),
  rate: z
    .number()
    .min(0, 'Tax rule rate cannot be negative')
    .max(100, 'Tax rule rate cannot exceed 100%'),
  compound: z.boolean(),
});

export const TaxJurisdictionSchema = z.object({
  id: z.string().min(1, 'Jurisdiction ID is required'),
  name: z.string().trim().min(1, 'Jurisdiction name is required'),
  type: z.string().min(1, 'Jurisdiction type is required'),
  rules: z.array(TaxRuleSchema),
});

export const TaxJurisdictionsSchema = z.object({
  taxJurisdictions: z.array(TaxJurisdictionSchema),
});

export const CompliancePolicySchema = z.object({
  compoundTax: z.boolean(),
  taxExemptions: z.boolean(),
});

export type FiscalPolicyInput = z.infer<typeof FiscalPolicySchema>;
export type FinancialLimitsInput = z.infer<typeof FinancialLimitsSchema>;
export type ForexRatesInput = z.infer<typeof ForexRatesSchema>;
export type TaxJurisdictionInput = z.infer<typeof TaxJurisdictionSchema>;
export type TaxJurisdictionsInput = z.infer<typeof TaxJurisdictionsSchema>;
export type CompliancePolicyInput = z.infer<typeof CompliancePolicySchema>;
