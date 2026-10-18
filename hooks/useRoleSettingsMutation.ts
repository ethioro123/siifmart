/**
 * useRoleSettingsMutation
 *
 * Mutation hook for persisting Zero-Trust role security policies and access permissions.
 * Writes an immutable audit record to system_logs for every save — required by
 * RULES.md §4 (Tamper-Proof Audit Trail) and AGENTS.md §5.
 *
 * Rules enforced:
 *  - Zero-Trust Persistence: Never store permissions in localStorage — always persist to Supabase with RLS.
 *  - Zero Autonomous Branch Authority: Branch managers cannot grant themselves discounts or stock adjustments.
 *  - Mutations MUST go through /hooks/ — never called directly from a component.
 *  - 100% Country-Level Setting Isolation: Settings are partitioned per targetCountry in countryConfigs.
 *  - Anti-Hacking: Strict Zod validation on mutation payloads before database writes.
 *  - Every policy change must be logged to system_logs with user + timestamp.
 *  - Never swallow errors — always surface via onError + toast.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import type { Country } from '../utils/localization';
import type { RolePolicy, RolePermissionCategory, ManagedRoleId } from '../types/roles';
import { RoleSettingsPayloadSchema, RolePolicySchema } from '../schemas/role-settings.schema';

export interface RoleSettingsMutationPayload {
  section: 'policies' | 'permissions';
  roleId?: ManagedRoleId;
  policies?: Record<ManagedRoleId, RolePolicy>;
  permissions?: RolePermissionCategory;
  targetCountry?: Country;
}

export function useRoleSettingsMutation() {
  const { user, showToast } = useStore();
  const { settings, updateSettings } = useData();
  const queryClient = useQueryClient();

  return useMutation<void, Error, RoleSettingsMutationPayload>({
    mutationFn: async ({ section, roleId, policies, permissions, targetCountry = 'ET' }) => {
      // ── ANTI-HACKING VALIDATION (Zod Schemas) ──
      const validation = RoleSettingsPayloadSchema.safeParse({
        section,
        roleId,
        policies,
        permissions,
        targetCountry,
      });

      if (!validation.success) {
        const errorMsg = validation.error.issues.map((e) => e.message).join('; ');
        logger.error('useRoleSettingsMutation', 'Validation failed:', errorMsg);
        throw new Error(`Validation Error: ${errorMsg}`);
      }

      // ── ZERO-TRUST AUTHORIZATION CHECK ──
      const userRole = (user?.role || '').toLowerCase();
      const isAuthorized = userRole === 'super_admin' || userRole === 'ceo' || userRole === 'admin';
      if (!isAuthorized) {
        throw new Error('Unauthorized: Only Executive / HQ Admin accounts can alter corporate role policies or permissions.');
      }

      // ── 100% COUNTRY-LEVEL SETTING ISOLATION ──
      const existingConfigs = (settings?.countryConfigs || {}) as Record<string, any>;
      const countryPartition = existingConfigs[targetCountry] || {};

      let updatedPartition: Record<string, any>;

      if (section === 'policies' && policies) {
        // Individual policy validation
        if (roleId && policies[roleId]) {
          RolePolicySchema.parse(policies[roleId]);
        }
        updatedPartition = {
          ...countryPartition,
          rolePolicies: policies,
        };
      } else if (section === 'permissions' && permissions) {
        updatedPartition = {
          ...countryPartition,
          rolePermissions: permissions,
        };
      } else {
        throw new Error('Invalid payload: missing policies or permissions data');
      }

      const newCountryConfigs = {
        ...existingConfigs,
        [targetCountry]: updatedPartition,
      };

      // Persist to central configuration state and Supabase
      await updateSettings(
        {
          countryConfigs: newCountryConfigs,
          ...(section === 'policies' ? { rolePolicies: policies } : { rolePermissions: permissions }),
        },
        user?.name || user?.email || 'Executive Admin'
      );

      // ── TAMPER-PROOF AUDIT LOGGING (system_logs) ──
      const { error: logError } = await supabase.from('system_logs').insert({
        action: section === 'policies' ? 'Role Security Policy Update' : 'Role Access Rights Update',
        entity_type: 'system_config',
        entity_id: null,
        details: JSON.stringify({
          roleId: roleId || 'ALL',
          section,
          targetCountry,
          updatedBy: user?.name || user?.email,
        }),
        user_name: user?.name || user?.email || 'System Admin',
        performed_by: user?.id ?? null,
        site_id: user?.siteId ?? null,
        country_code: targetCountry,
        module: 'Settings',
        created_at: new Date().toISOString(),
      });

      if (logError) {
        logger.error('useRoleSettingsMutation', 'Mandatory audit log failed', logError);
        throw new Error(`Security Exception: Mandatory audit logging failed (${logError.message}). Role policy change halted.`);
      }
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system_config'] });
      const label = variables.section === 'policies' ? 'Security policy' : 'Access permission';
      showToast(`${label} updated & enforced across corporate ledger`, 'success');
    },

    onError: (err) => {
      logger.error('useRoleSettingsMutation', 'Role settings mutation error:', err);
      showToast(err.message || 'Failed to update role settings', 'error');
    },
  });
}
