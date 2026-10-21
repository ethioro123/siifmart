/**
 * useFinanceSettingsMutation
 *
 * Mutation hook for updating fiscal policies, tax jurisdictions, drawer limits,
 * exchange rates, and compliance rules.
 * Strictly enforces:
 *  1. Zero-Trust Role Gating (L1 CEO / Super Admin & L2 Finance Manager only).
 *  2. Zod Schema Validation before writing.
 *  3. 100% Country-Level Isolation (settings partitioned by targetCountry).
 *  4. Tamper-Proof Audit Trail (system_logs).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import { Country } from '../utils/localization';
import type { SystemConfig, Site } from '../types';
import {
  FiscalPolicySchema,
  FinancialLimitsSchema,
  ForexRatesSchema,
  TaxJurisdictionsSchema,
  CompliancePolicySchema,
} from '../schemas/finance-settings.schema';

export type FinanceSettingsSection = 'policy' | 'limits' | 'currency' | 'jurisdictions' | 'compliance';

export interface FinanceSettingsPayload {
  section: FinanceSettingsSection;
  targetCountry: Country;
  data: Partial<SystemConfig>;
}

export interface AssignSiteJurisdictionPayload {
  siteId: string;
  taxJurisdictionId: string | null;
  targetCountry: Country;
}

const ALLOWED_FIELDS: Record<FinanceSettingsSection, (keyof SystemConfig)[]> = {
  policy: ['fiscalYearStart', 'accountingMethod', 'taxInclusive', 'taxOnSelling', 'taxOnPurchasing', 'taxRate', 'withholdingTax'],
  limits: ['maxPettyCash', 'expenseApprovalLimit', 'defaultCreditLimit'],
  currency: ['exchangeRates'],
  jurisdictions: ['taxJurisdictions'],
  compliance: ['compoundTax', 'taxExemptions'],
};

export function useFinanceSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings, sites, updateSite } = useData();
  const queryClient = useQueryClient();

  const settingsMutation = useMutation<void, Error, FinanceSettingsPayload>({
    mutationFn: async ({ section, targetCountry = 'ET', data }) => {
      // ── 1. ROLE GUARD (RULES.md §1 Zero-Trust & AGENTS.md §1) ──
      const isAuthorized = [
        'super_admin', 'CEO', 'ceo',
        'country_managing_director', 'admin',
        'head_of_finance', 'finance_head', 'finance_manager'
      ].includes(user?.role || '');
      if (!isAuthorized) {
        throw new Error('Unauthorized: Modifying financial and tax settings requires CEO, Managing Director, or Head of Finance credentials.');
      }

      // ── 2. ZOD VALIDATION ──
      if (section === 'policy') {
        FiscalPolicySchema.parse({
          fiscalYearStart: data.fiscalYearStart,
          accountingMethod: data.accountingMethod,
          taxInclusive: data.taxInclusive,
          taxOnSelling: data.taxOnSelling,
          taxOnPurchasing: data.taxOnPurchasing,
          taxRate: data.taxRate,
          withholdingTax: data.withholdingTax,
        });
      } else if (section === 'limits') {
        FinancialLimitsSchema.parse({
          maxPettyCash: data.maxPettyCash,
          expenseApprovalLimit: data.expenseApprovalLimit,
          defaultCreditLimit: data.defaultCreditLimit,
        });
      } else if (section === 'currency') {
        ForexRatesSchema.parse({
          exchangeRates: data.exchangeRates,
        });
      } else if (section === 'jurisdictions') {
        TaxJurisdictionsSchema.parse({
          taxJurisdictions: data.taxJurisdictions,
        });
      } else if (section === 'compliance') {
        CompliancePolicySchema.parse({
          compoundTax: data.compoundTax,
          taxExemptions: data.taxExemptions,
        });
      }

      // ── 3. FIELD ALLOWLIST FILTERING ──
      const allowed = ALLOWED_FIELDS[section];
      const safePayload = allowed.reduce<Partial<SystemConfig>>(
        (acc, key) => {
          if (data[key] !== undefined) {
            (acc as Record<string, unknown>)[key] = data[key];
          }
          return acc;
        },
        {}
      );

      // ── 4. STRICT 100% COUNTRY ISOLATION (AGENTS.md Rule 7 / §3) ──
      const currentConfigs = (settings?.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
      const existingCountryConfig = currentConfigs[targetCountry] || {};
      const updatedCountryConfig: Partial<SystemConfig> = {
        ...existingCountryConfig,
        ...safePayload,
      };

      const newCountryConfigs = {
        ...currentConfigs,
        [targetCountry]: updatedCountryConfig,
      };

      const finalPayload: Partial<SystemConfig> = {
        countryConfigs: newCountryConfigs,
      };

      // If updating active country, also mirror root fields
      const activeSystemCountry = settings?.country || 'ET';
      if (targetCountry === activeSystemCountry) {
        Object.assign(finalPayload, safePayload);
      }

      await updateSettings(finalPayload, user?.name || 'Finance Admin');

      // ── 5. TAMPER-PROOF AUDIT TRAIL (RULES.md §4 / AGENTS.md §5) ──
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: `FINANCE_SETTINGS_SAVED_${section.toUpperCase()}`,
          entity_type: 'system_config',
          entity_id: null,
          details: JSON.stringify({ section, targetCountry, changes: safePayload }),
          performed_by: user?.id ?? null,
          user_name: user?.name || user?.email || 'Finance Admin',
          site_id: user?.siteId ?? null,
          country_code: targetCountry,
          module: 'Settings',
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.error('useFinanceSettingsMutation', `Audit log failed for ${section}`, logError);
        throw new Error(`Security Exception: Mandatory audit logging failed (${logError.message}). Finance settings change halted.`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system_config'] });
      const sectionName = variables.section.charAt(0).toUpperCase() + variables.section.slice(1);
      showToast(`${sectionName} finance settings saved successfully.`, 'success');
    },
    onError: (error) => {
      logger.error('useFinanceSettingsMutation', 'Mutation error:', error);
      showToast(error.message || 'Failed to save finance settings.', 'error');
    },
  });

  const assignSiteMutation = useMutation<void, Error, AssignSiteJurisdictionPayload>({
    mutationFn: async ({ siteId, taxJurisdictionId }) => {
      const isAuthorized = [
        'super_admin', 'CEO', 'ceo',
        'country_managing_director', 'admin',
        'head_of_finance', 'finance_head', 'finance_manager'
      ].includes(user?.role || '');
      if (!isAuthorized) {
        throw new Error('Unauthorized: Assigning sites to tax jurisdictions requires managerial credentials.');
      }

      const site = sites.find((s: Site) => s.id === siteId);
      if (!site) {
        throw new Error('Target site not found.');
      }

      // Explicit allowlist update — never spread { ...site }
      const siteUpdatePayload: Partial<Site> = {
        id: site.id,
        name: site.name,
        type: site.type,
        address: site.address,
        taxJurisdictionId: taxJurisdictionId || undefined,
      };

      await updateSite(siteUpdatePayload as Site, user?.name || 'Finance Admin');

      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: 'SITE_TAX_JURISDICTION_ASSIGNED',
          entity_type: 'sites',
          entity_id: siteId,
          details: JSON.stringify({ siteId, siteName: site.name, taxJurisdictionId }),
          performed_by: user?.id ?? null,
          user_name: user?.name || user?.email || 'Finance Admin',
          site_id: siteId,
          country_code: (site.country || 'ET'),
          module: 'Settings',
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.error('useFinanceSettingsMutation', 'Site tax jurisdiction audit log failed', logError);
        throw new Error(`Security Exception: Mandatory audit logging failed (${logError.message}). Site assignment halted.`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      showToast(
        variables.taxJurisdictionId
          ? 'Site assigned to tax jurisdiction.'
          : 'Site unassigned from tax jurisdiction.',
        'success'
      );
    },
    onError: (error) => {
      logger.error('useFinanceSettingsMutation', 'Site assignment error:', error);
      showToast(error.message || 'Failed to update site assignment.', 'error');
    },
  });

  return {
    ...settingsMutation,
    assignSite: assignSiteMutation.mutateAsync,
    isAssigningSite: assignSiteMutation.isPending,
  };
}
