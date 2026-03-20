import { useMemo } from 'react';
import { User, Site, WMSJob, Product } from '../types';
import { filterBySite } from '../utils/locationAccess';

interface UseFilteredFulfillmentDataProps {
    jobs: WMSJob[];
    employees: any[];
    products: Product[];
    movements: any[];
    user: User | null;
    activeSite: Site | null;
}

export const useFilteredFulfillmentData = ({
    jobs,
    employees,
    products,
    movements,
    user,
    activeSite
}: UseFilteredFulfillmentDataProps) => {

    const filteredJobs = useMemo(() => {
        console.log('--- useFilteredFulfillmentData: Jobs ---');
        console.log('user:', user?.name, 'role:', user?.role, 'siteId:', user?.siteId);
        console.log('activeSite:', activeSite?.name, 'id:', activeSite?.id, 'type:', activeSite?.type);
        console.log('total jobs before filter:', jobs.length);

        // ONLY the CEO (super_admin) can override their site view using the activeSite selector.
        // All other roles are strictly restricted to their assigned warehouse (siteId).
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        console.log('Computed siteToFilterBy:', siteToFilterBy);

        // Use filterBySite which handles role-based multi-site logic
        const baseFiltered = filterBySite(jobs, user?.role || 'pos', siteToFilterBy);
        console.log('After filterBySite (baseFiltered):', baseFiltered.length);

        // If a super_admin has selected a specific site, prune to exactly that site for operational clarity
        if (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration') {
            const pruned = baseFiltered.filter(j => {
                const siteId = j.siteId || j.site_id;
                const destSiteId = j.destSiteId || j.dest_site_id;
                return siteId === activeSite.id || destSiteId === activeSite.id;
            });
            console.log('After super_admin specific site pruning:', pruned.length);
            return pruned;
        }
        return baseFiltered;
    }, [jobs, user?.role, user?.siteId, activeSite]);

    const filteredEmployees = useMemo(() => {
        // Fallback to activeSite.id if user.siteId is undefined (edge case)
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(employees, user?.role || 'pos', siteToFilterBy);

        if (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(e => {
                const eSiteId = e.siteId || e.site_id;
                return eSiteId === activeSite.id;
            });
        }
        return baseFiltered;
    }, [employees, user?.role, user?.siteId, activeSite]);

    const filteredProducts = useMemo(() => {
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(products, user?.role || 'pos', siteToFilterBy);

        if (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(p => (p.siteId || p.site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [products, user?.role, user?.siteId, activeSite]);

    const filteredMovements = useMemo(() => {
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(movements, user?.role || 'pos', siteToFilterBy);

        if (user?.role === 'super_admin' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(m => (m.siteId || (m as any).site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [movements, user?.role, user?.siteId, activeSite]);

    const historicalJobs = useMemo(() => {
        return filteredJobs.filter((j: WMSJob) => {
            const status = (j.status || '').toLowerCase();
            return status === 'completed' || status === 'cancelled';
        });
    }, [filteredJobs]);

    return {
        filteredJobs,
        filteredEmployees,
        filteredProducts,
        filteredMovements,
        historicalJobs
    };
};
