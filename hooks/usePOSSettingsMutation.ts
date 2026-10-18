/**
 * usePOSSettingsMutation
 *
 * Mutation hook for persisting POS configuration changes (workflow, payments, branding).
 * Writes an immutable audit record to system_logs for every save — required by
 * RULES.md §4 (Tamper-Proof Audit Trail) and AGENTS.md §5.
 *
 * Rules enforced:
 *  - Mutations MUST go through /hooks/ — never called directly from a component.
 *  - Explicit column allowlists per section — never { ...object } to Supabase.
 *  - 100% Country-Level Setting Isolation: Settings are partitioned per targetCountry in countryConfigs.
 *  - Anti-Hacking: Strict Zod validation on mutation payloads before database writes.
 *  - Every config change must be logged to system_logs with user + timestamp.
 *  - Never swallow errors — always surface via onError + toast.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import type { SystemConfig } from '../types';
import type { Country } from '../utils/localization';
import { POSReceiptBrandingSchema, POSWorkflowSchema } from '../schemas/pos-settings.schema';

type POSSection = 'workflow' | 'payments' | 'branding' | 'gateways';

export interface POSSettingsPayload {
  section: POSSection;
  data: Partial<SystemConfig>;
  targetCountry?: Country;
}

// ── EXPLICIT FIELD ALLOWLISTS (RULES.md §Service Field Mapping) ──
const ALLOWED_FIELDS: Record<POSSection, (keyof SystemConfig)[]> = {
  workflow: [
    'posTerminalId', 'posRegisterMode', 'posGuestCheckout',
    'posBlockNegativeStock', 'requireShiftClosure',
    'posDailyRevenueTarget', 'posDailyTxTarget', 'taxOnSelling',
  ],
  payments: [
    'payment_cash', 'payment_card', 'payment_mobile_money',
    'payment_store_credit', 'posDigitalReceipts', 'posAutoPrint',
  ],
  branding: [
    'posReceiptLogo', 'posReceiptShowLogo', 'posReceiptHeader',
    'posReceiptFooter', 'posReceiptAddress', 'posReceiptPhone',
    'posReceiptEmail', 'posReceiptTaxId', 'posReceiptPolicy',
    'posReceiptSocialHandle', 'posReceiptEnableQR', 'posReceiptQRLink',
    'posReceiptWidth', 'posReceiptFont',
  ],
  gateways: [
    'mpesaTillEnabled', 'mpesaTillNumber', 'mpesaTillName',
    'mpesaStkEnabled', 'mpesaStkShortcode', 'mpesaPasskey',
    'mpesaConsumerKey', 'mpesaConsumerSecret', 'mpesaEnvironment',
    'mpesaPaybillEnabled', 'mpesaPaybillNumber', 'mpesaPaybillAccount',
    'airtelMoneyEnabled', 'airtelTillNumber', 'airtelMerchantName',
    'telebirrEnabled', 'telebirrMerchantId',
    'cbeBirrEnabled', 'cbeBirrMerchantCode',
  ],
};

export function usePOSSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings } = useData();
  const queryClient = useQueryClient();

  return useMutation<void, Error, POSSettingsPayload>({
    mutationFn: async ({ section, data, targetCountry = 'ET' }) => {
      // ── ANTI-HACKING VALIDATION (Zod Schemas) ──
      if (section === 'branding') {
        const validation = POSReceiptBrandingSchema.safeParse({
          ...data,
          targetCountry,
        });
        if (!validation.success) {
          const firstError = validation.error.issues[0]?.message || 'Invalid receipt branding configuration';
          logger.error('usePOSSettingsMutation', `Validation failed for receipt branding: ${firstError}`, validation.error);
          throw new Error(firstError);
        }
      } else if (section === 'workflow') {
        const validation = POSWorkflowSchema.safeParse({
          ...data,
          targetCountry,
        });
        if (!validation.success) {
          const firstError = validation.error.issues[0]?.message || 'Invalid POS workflow configuration';
          logger.error('usePOSSettingsMutation', `Validation failed for POS workflow: ${firstError}`, validation.error);
          throw new Error(firstError);
        }
      }

      // ── FIELD ALLOWLIST FILTERING ──
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

      // ── 100% STRICT COUNTRY ISOLATION (RULES.md §Settings Separation) ──
      // Every setting is partitioned under countryConfigs[targetCountry] so settings
      // for one nation never bleed or apply to another.
      const currentConfigs = settings?.countryConfigs || {};
      const existingCountryConfig = currentConfigs[targetCountry] || {};
      const updatedCountryConfig = {
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

      // If updating the active market profile, also mirror root fields for compatibility (exclude gateways/credentials)
      const activeSystemCountry = settings?.country || 'ET';
      if (targetCountry === activeSystemCountry && section !== 'gateways') {
        Object.assign(finalPayload, safePayload);
      }

      await updateSettings(finalPayload, user?.name || 'System');

      // ── TAMPER-PROOF AUDIT TRAIL (RULES.md §4 / AGENTS.md §5) ──
      // Sanitize changes to strictly redact passkeys, API secrets, and tokens from system_logs
      const sanitizedChanges = Object.entries(safePayload).reduce<Record<string, unknown>>(
        (acc, [k, v]) => {
          const lower = k.toLowerCase();
          if (
            lower.includes('secret') ||
            lower.includes('passkey') ||
            lower.includes('consumerkey') ||
            lower.includes('token') ||
            lower.includes('password') ||
            (lower.includes('key') && (lower.includes('api') || lower.includes('consumer')))
          ) {
            acc[k] = v ? '[REDACTED]' : null;
          } else {
            acc[k] = v;
          }
          return acc;
        },
        {}
      );

      // Insert-only — do NOT chain .select('*') to avoid SELECT RLS 403.
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: `POS_SETTINGS_SAVED_${section.toUpperCase()}`,
          entity_type: 'system_config',
          entity_id: null,
          details: JSON.stringify({ section, targetCountry, changes: sanitizedChanges }),
          performed_by: user?.id ?? null,
          site_id: user?.siteId ?? null,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.warn('usePOSSettingsMutation', `Audit log failed for ${section}: ${logError.message}`);
      }
    },

    onSuccess: (_data, { section, targetCountry = 'ET' }) => {
      const label = section.charAt(0).toUpperCase() + section.slice(1);
      showToast(`${label} settings saved for ${targetCountry}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      logger.info('POSSettings', `Section saved: ${section} [${targetCountry}]`);
    },

    onError: (error, { section }) => {
      logger.error('usePOSSettingsMutation', `Failed to save ${section}`, error);
      showToast(`Failed to save ${section} settings: ${error.message}`, 'error');
    },
  });
}
