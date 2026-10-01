/**
 * useWMSSettingsMutation
 *
 * Mutation hook for persisting WMS (Enterprise Engine) configuration changes.
 * Strictly enforces:
 *  1. Zero-Trust Role Gating (L1-L2 Central Ops / Warehouse Managers only; no store-level tampering).
 *  2. Zod Schema Validation before persistence.
 *  3. 100% Country-Level Isolation (partitioned per targetCountry).
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
  InboundSettingsSchema,
  HealthSettingsSchema,
  OutboundSettingsSchema,
} from '../schemas/wms-settings.schema';

export type WMSSection = 'inbound' | 'health' | 'outbound';

export interface WMSSettingsPayload {
  section: WMSSection;
  targetCountry: Country;
  data: Partial<SystemConfig>;
}

// ── EXPLICIT ALLOWLISTS PER SECTION ──
const ALLOWED_FIELDS: Record<WMSSection, (keyof SystemConfig)[]> = {
  inbound: ['receivingLogic', 'qcSamplingRate', 'qcBlockOnFailure', 'putawayLogic'],
  health: ['rotationPolicy', 'requireExpiry', 'cycleCountStrategy'],
  outbound: ['pickingMethod', 'strictScanning', 'bayScan'],
};

export function useWMSSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings } = useData();
  const queryClient = useQueryClient();

  return useMutation<void, Error, WMSSettingsPayload>({
    mutationFn: async ({ section, targetCountry, data }) => {
      // ── 1. ROLE GUARD (RULES.md §Role Hierarchy & Zero-Trust) ──
      const authorizedRoles = ['super_admin', 'CEO', 'operations_manager', 'warehouse_manager'];
      if (!authorizedRoles.includes(user?.role || '')) {
        throw new Error('Unauthorized: WMS policy configuration requires Warehouse Manager or HQ Operations credentials.');
      }

      // ── 2. ZOD VALIDATION (Anti-Hacking & Input Sanitization) ──
      if (section === 'inbound') {
        InboundSettingsSchema.parse(data);
      } else if (section === 'health') {
        HealthSettingsSchema.parse(data);
      } else if (section === 'outbound') {
        OutboundSettingsSchema.parse(data);
      }

      // ── 3. EXPLICIT COLUMN ALLOWLIST ──
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

      // ── 4. STRICT COUNTRY PARTITIONING ──
      // Guarantee settings for targetCountry do NOT bleed into other national catalogs
      const existingConfigs = (settings?.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
      const currentCountryConfig = existingConfigs[targetCountry] || {};

      const updatedCountryConfig: Partial<SystemConfig> = {
        ...currentCountryConfig,
        ...safePayload,
      };

      const newCountryConfigs = {
        ...existingConfigs,
        [targetCountry]: updatedCountryConfig,
      };

      const activeCountry = settings?.country || 'ET';
      const isTargetActive = targetCountry === activeCountry;

      const finalPayload: Partial<SystemConfig> = {
        countryConfigs: newCountryConfigs,
        ...(isTargetActive ? safePayload : {}),
      };

      await updateSettings(finalPayload, user?.name || 'System');

      // ── 5. TAMPER-PROOF AUDIT TRAIL (RULES.md §4 / AGENTS.md §5) ──
      // Insert-only — never chain .select('*') to avoid SELECT RLS 403
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: `WMS_SETTINGS_SAVED_${section.toUpperCase()}`,
          entity_type: 'system_config',
          entity_id: null,
          details: JSON.stringify({
            section,
            targetCountry,
            changes: safePayload,
          }),
          performed_by: user?.id ?? null,
          site_id: user?.siteId ?? null,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.warn('useWMSSettingsMutation', `Audit log failed for ${section}: ${logError.message}`);
      }
    },

    onSuccess: (_data, { section, targetCountry }) => {
      const label = section.charAt(0).toUpperCase() + section.slice(1);
      showToast(`${label} settings saved for ${targetCountry}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      logger.info('WMSSettings', `Section saved: ${section} for country ${targetCountry}`);
    },

    onError: (error, { section }) => {
      logger.error('useWMSSettingsMutation', `Failed to save ${section}`, error);
      showToast(error.message || `Failed to save ${section} settings`, 'error');
    },
  });
}
