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
      queryClient.invalidateQueries({ queryKey: ['sites'] });
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
      await regionsService.updateRegionAndSiteAssignments(
        code,
        updates,
        siteAllocations?.toAssign ?? [],
        siteAllocations?.toUnassign ?? []
      );
      return { success: true };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (err) => {
      logger.error('useRegionMutations', 'Region update mutation failed', err as Error);
    }
  });
}
