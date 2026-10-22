/**
 * useGeneralSettingsMutation
 *
 * Mutation hook for updating corporate branding, legal entity profiles, and localization.
 * Strictly enforces:
 *  1. Zero-Trust Role Gating (L1 CEO / Super Admin only).
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
import type { SystemConfig } from '../types';
import {
  BrandingSettingsSchema,
  LegalSettingsSchema,
  LocalizationSettingsSchema,
} from '../schemas/general-settings.schema';

export type GeneralSettingsSection = 'branding' | 'legal' | 'localization';

export interface GeneralSettingsPayload {
  section: GeneralSettingsSection;
  targetCountry: Country;
  data: Partial<SystemConfig>;
}

export function useGeneralSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings } = useData();
  const queryClient = useQueryClient();

  return useMutation<void, Error, GeneralSettingsPayload>({
    mutationFn: async ({ section, targetCountry, data }) => {
      // ── 1. ROLE GUARD (RULES.md §1 Zero-Trust & AGENTS.md §1) ──
      const isAuthorized = ['group_ceo'].includes(user?.role || '');
      if (!isAuthorized) {
        throw new Error('Unauthorized: Modifying corporate settings requires CEO or Super Admin credentials.');
      }

      // ── 2. ZOD VALIDATION ──
      if (section === 'branding') {
        BrandingSettingsSchema.parse(data);
      } else if (section === 'legal') {
        LegalSettingsSchema.parse(data);
      } else if (section === 'localization') {
        LocalizationSettingsSchema.parse(data);
      }

      // ── 3. STRICT COUNTRY SETTING PARTITIONING ──
      // Guarantee settings for targetCountry do NOT bleed into any other country
      const existingConfigs = (settings?.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
      const currentCountryConfig = existingConfigs[targetCountry] || {};

      const updatedCountryConfig: Partial<SystemConfig> = {
        ...currentCountryConfig,
        ...data,
      };

      const newCountryConfigs = {
        ...existingConfigs,
        [targetCountry]: updatedCountryConfig,
      };

      // Top-level payload updates active country if matching, plus the partitioned map
      const activeCountry = settings?.country || 'ET';
      const isTargetActive = targetCountry === activeCountry;

      const finalPayload: Partial<SystemConfig> = {
        countryConfigs: newCountryConfigs,
        ...(isTargetActive ? data : {}),
      };

      await updateSettings(finalPayload, user?.name || 'Admin');

      // ── 4. TAMPER-PROOF AUDIT TRAIL (RULES.md §4 / AGENTS.md §5) ──
      // Insert-only — never chain .select('*') to avoid RLS 403
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: `GENERAL_SETTINGS_SAVED_${section.toUpperCase()}`,
          entity_type: 'system_config',
          entity_id: null,
          details: JSON.stringify({
            section,
            targetCountry,
            changes: data,
          }),
          performed_by: user?.id ?? null,
          user_name: user?.name || user?.email || 'Admin',
          site_id: user?.siteId ?? null,
          country_code: targetCountry,
          module: 'Settings',
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.error('useGeneralSettingsMutation', `Audit log failed for ${section}`, logError);
        throw new Error(`Security Exception: Mandatory audit logging failed (${logError.message}). Corporate settings save halted.`);
      }
    },

    onSuccess: (_data, { section, targetCountry }) => {
      const label = section.charAt(0).toUpperCase() + section.slice(1);
      showToast(`${label} settings saved for ${targetCountry}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },

    onError: (err, { section }) => {
      logger.error('useGeneralSettingsMutation', `Failed to save ${section} settings`, err);
      showToast(err.message || `Failed to save ${section} settings.`, 'error');
    },
  });
}
