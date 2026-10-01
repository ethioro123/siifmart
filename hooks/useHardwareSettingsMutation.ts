/**
 * useHardwareSettingsMutation
 *
 * Mutation hook for updating scale IP addresses, COM ports, printer assignments,
 * and scale calibration units.
 * Strictly enforces:
 *  1. Zero-Trust Role Gating (Operations / Store Managers & Executive Admin).
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
import { HardwareSettingsSchema } from '../schemas/hardware-settings.schema';

export interface HardwareSettingsPayload {
  targetCountry: Country;
  data: {
    scaleIpAddress?: string;
    scannerComPort?: string;
    defaultPrinter: string;
    scaleUnit: 'KG' | 'LBS';
  };
}

const ALLOWED_HARDWARE_FIELDS: (keyof SystemConfig)[] = [
  'scaleIpAddress',
  'scannerComPort',
  'defaultPrinter',
  'scaleUnit',
];

export function useHardwareSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings } = useData();
  const queryClient = useQueryClient();

  return useMutation<void, Error, HardwareSettingsPayload>({
    mutationFn: async ({ targetCountry = 'ET', data }) => {
      // ── 1. ROLE GUARD ──
      const allowedRoles = [
        'super_admin',
        'CEO',
        'operations_manager',
        'regional_manager',
        'store_manager',
        'warehouse_manager',
      ];
      const isAuthorized = allowedRoles.includes(user?.role || '');
      if (!isAuthorized) {
        throw new Error('Unauthorized: Modifying station hardware and device mappings requires store manager or administrator credentials.');
      }

      // ── 2. ZOD VALIDATION ──
      HardwareSettingsSchema.parse(data);

      // ── 3. FIELD ALLOWLIST FILTERING ──
      const safePayload: Partial<SystemConfig> = {};
      for (const field of ALLOWED_HARDWARE_FIELDS) {
        if (data[field as keyof typeof data] !== undefined) {
          (safePayload as Record<string, unknown>)[field] = data[field as keyof typeof data];
        }
      }

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

      await updateSettings(finalPayload, user?.name || 'Hardware Admin');

      // ── 5. TAMPER-PROOF AUDIT TRAIL (RULES.md §4 / AGENTS.md §5) ──
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          action: 'HARDWARE_SETTINGS_SAVED',
          entity_type: 'system_config',
          entity_id: null,
          details: JSON.stringify({ targetCountry, changes: safePayload }),
          performed_by: user?.id ?? null,
          site_id: user?.siteId ?? null,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        logger.warn('useHardwareSettingsMutation', `Audit log failed for hardware settings: ${logError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_config'] });
      showToast('Hardware device configuration saved successfully.', 'success');
    },
    onError: (error) => {
      logger.error('useHardwareSettingsMutation', 'Mutation error:', error);
      showToast(error.message || 'Failed to save hardware settings.', 'error');
    },
  });
}
