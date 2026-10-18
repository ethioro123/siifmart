import { useEffect } from 'react';
import type { SystemConfig } from '../types';
import { setActiveRolePolicies, setActiveRolePermissions } from '../services/zeroTrustPolicies.service';

/**
 * Synchronizes Zero-Trust dynamic role policies & permissions
 * with the active country partition whenever settings change.
 */
export function useZeroTrustSync(settings?: SystemConfig, effectiveCountry?: string) {
    useEffect(() => {
        if (!settings) return;
        const country = effectiveCountry || settings.country || 'ET';
        const countryPartition = settings.countryConfigs?.[country] || {};
        const policies = countryPartition.rolePolicies || settings.rolePolicies;
        const perms = countryPartition.rolePermissions || settings.rolePermissions;

        setActiveRolePolicies(policies);
        setActiveRolePermissions(perms);
    }, [settings, effectiveCountry]);
}
