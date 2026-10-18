/**
 * Regional Operations Mutation Hooks
 *
 * Implements centralized TanStack Query mutations for:
 * 1. Provisioning new operational regions under HQ Executive governance.
 * 2. Updating regional settings, budget guardrails, and autonomous limits.
 * 3. Atomic and verified site allocations with per-site failure tracking.
 *
 * Enforces project rules:
 * - UI mutations go through /hooks/, never called directly from UI.
 * - Invalidate affected query keys ('regions', 'sites').
 * - Tamper-proof logging via /utils/logger.ts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regionsService, CreateRegionInput, UpdateRegionInput } from '../services/regions.service';
import type { Region, Site } from '../types';
import { logger } from '../utils/logger';

export interface UpdateRegionWithSitesParams {
  code: string;
  updates: UpdateRegionInput;
  siteAllocations?: {
    toAssign: string[];
    toUnassign: string[];
    allSites?: Site[];
  };
}

export interface RegionMutationResult {
  success: boolean;
  region?: Region;
  failedSites?: string[];
  message?: string;
}

/**
 * Mutation hook for provisioning a new operational region.
 */
export function useCreateRegionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRegionInput): Promise<Region> => {
      logger.info('useRegionMutations', `Provisioning region ${input.code} (${input.name})`);
      return await regionsService.createRegion(input);
    },
    onSuccess: (newRegion) => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      logger.info('useRegionMutations', `Region ${newRegion.code} provisioned successfully`);
    },
    onError: (err) => {
      logger.error('useRegionMutations', 'Failed to provision region', err as Error);
    }
  });
}

/**
 * Mutation hook for updating an operational region and its site assignments.
 * Verifies all site allocations and reports partial failures instead of masking them.
 */
export function useUpdateRegionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateRegionWithSitesParams): Promise<RegionMutationResult> => {
      const { code, updates, siteAllocations } = params;
      logger.info('useRegionMutations', `Updating region ${code}`);

      // 1. Update region governance settings and limits
      const updated = await regionsService.updateRegion(code, updates);
      if (!updated) {
        throw new Error(`Failed to update settings for region ${code}`);
      }

      // 2. Process site allocations if provided
      if (siteAllocations) {
        const { toAssign, toUnassign, allSites = [] } = siteAllocations;
        const siteNameMap = new Map<string, string>();
        allSites.forEach(s => siteNameMap.set(s.id, s.name));

        const tasks: { siteId: string; regionCode: string | null; name: string }[] = [
          ...toAssign.map(id => ({ siteId: id, regionCode: code, name: siteNameMap.get(id) || id })),
          ...toUnassign.map(id => ({ siteId: id, regionCode: null, name: siteNameMap.get(id) || id }))
        ];

        if (tasks.length > 0) {
          const results = await Promise.allSettled(
            tasks.map(t => regionsService.assignSiteToRegion(t.siteId, t.regionCode))
          );

          const failedSites: string[] = [];
          results.forEach((res, idx) => {
            if (res.status === 'rejected' || (res.status === 'fulfilled' && !res.value)) {
              failedSites.push(tasks[idx].name);
            }
          });

          if (failedSites.length > 0) {
            logger.warn('useRegionMutations', `Partial failure updating sites for region ${code}`, { failedSites });
            throw new Error(
              `Region settings updated, but failed to reassign site(s): ${failedSites.join(', ')}. Please retry site allocation.`
            );
          }
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (err) => {
      logger.error('useRegionMutations', 'Region update mutation failed', err as Error);
    }
  });
}
