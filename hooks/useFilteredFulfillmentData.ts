import { useMemo } from 'react';
import { User, Site, WMSJob, Product } from '../types';
import { filterBySite } from '../utils/locationAccess';
import { logger } from '../utils/logger';
import { canInspectTransferArrival } from '../utils/shipmentWorkflow';

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
        logger.debug('useFilteredFulfillmentData', '--- useFilteredFulfillmentData: Jobs ---');
        logger.debug('useFilteredFulfillmentData', 'user:');
        logger.debug('useFilteredFulfillmentData', 'activeSite:');
        logger.debug('useFilteredFulfillmentData', 'total jobs before filter:');

        // ONLY the CEO (group_ceo) can override their site view using the activeSite selector.
        // All other roles are strictly restricted to their assigned warehouse (siteId).
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        logger.debug('useFilteredFulfillmentData', 'Computed siteToFilterBy:');

        // Use filterBySite which handles role-based multi-site logic
        const currentEmployee1 = employees.find(e => 
            (user?.email && e.email === user.email) ||
            (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
            ((user as any)?.employeeId && e.id === (user as any).employeeId) ||
            e.id === user?.id
        );
        const employeeId1 = currentEmployee1?.id || user?.id;

        const siteFiltered = filterBySite(jobs, user?.role || 'cashier', siteToFilterBy);
        
        const explicitlyAssigned = jobs.filter(j => j.assignedTo === employeeId1 && !siteFiltered.some(sf => sf.id === j.id));
        const baseFiltered = [...siteFiltered, ...explicitlyAssigned];

        // 🔍 DEBUG: Track DISPATCH/DRIVER jobs through the pipeline
        const driverJobsInRaw = jobs.filter(j => j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
        const driverJobsAfterSite = siteFiltered.filter(j => j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
        const driverJobsExplicit = explicitlyAssigned.filter(j => j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
        logger.debug('useFilteredFulfillmentData', '🔍 [useFilteredFulfillmentData] Driver pipeline:');
        if (driverJobsInRaw.length > 0) {
            logger.debug('useFilteredFulfillmentData', '🔍 Raw driver jobs detail (see console for details)');
        }

        logger.debug('useFilteredFulfillmentData', 'After filterBySite + explicitlyAssigned (baseFiltered):');

        // --- ROLE-BASED VISIBILITY RESTRICTION ---
        // Dispatchers and Warehouse Managers (and elevated roles) can see ALL jobs for the site.
        // Operational roles (Picker, Packer, etc.) ONLY see jobs specifically assigned to them.
        const canSeeGlobalQueue = [
            'group_ceo', 'admin', 'manager', 'regional_operations_manager',
            'country_operations_director', 'warehouse_manager', 'dispatcher',
            // Site managers and department heads can see all jobs in their site queue
            'store_manager', 'regional_supply_chain_manager', 'inventory_manager',
            'assistant_store_manager', 'shift_supervisor', 'inventory_specialist',
            'dispatch_supervisor', 'country_supply_chain_director',
            'fleet_maintenance_supervisor', 'replenishment_planner'
        ].includes((user?.role || '').toLowerCase());

        let roleFiltered = baseFiltered;
        if (!canSeeGlobalQueue && user?.id) {
            // [FIX] Consistently find employee by email to bridge Auth/DB ID gaps
            const currentEmployee = employees.find(e => 
                (user.email && e.email === user.email) ||
                (user.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
                ((user as any).employeeId && e.id === (user as any).employeeId) ||
                e.id === user.id
            );
            const employeeId = currentEmployee?.id || user.id;

            // Dispatch allocates external transport. Drivers only see their assigned missions.
            roleFiltered = baseFiltered.filter(job => job.assignedTo === employeeId ||
                canInspectTransferArrival(job, user.role, user.siteId || activeSite?.id));
            const driverJobsAfterRole = roleFiltered.filter(j => j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
            logger.debug('useFilteredFulfillmentData', `Role [${user.role}] restricted to ${roleFiltered.length} assigned jobs (${driverJobsAfterRole.length} driver jobs) for employee ${employeeId}.`);
        }

        // If a group_ceo has selected a specific site, prune to exactly that site for operational clarity
        if (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration') {
            const pruned = roleFiltered.filter(j => {
                const siteId = j.siteId || j.site_id;
                const destSiteId = j.destSiteId || j.dest_site_id;
                return siteId === activeSite.id || destSiteId === activeSite.id;
            });
            logger.debug('useFilteredFulfillmentData', 'After group_ceo specific site pruning:');
            return pruned;
        }
        return roleFiltered;
    }, [jobs, employees, user?.role, user?.siteId, user?.id, user?.email, user?.name, activeSite]);

    const filteredEmployees = useMemo(() => {
        // Fallback to activeSite.id if user.siteId is undefined (edge case)
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(employees, user?.role || 'cashier', siteToFilterBy);

        if (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(e => {
                const eSiteId = e.siteId || e.site_id;
                return eSiteId === activeSite.id;
            });
        }
        return baseFiltered;
    }, [employees, user?.role, user?.siteId, activeSite]);

    const filteredProducts = useMemo(() => {
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(products, user?.role || 'cashier', siteToFilterBy);

        if (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(p => (p.siteId || p.site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [products, user?.role, user?.siteId, activeSite]);

    const filteredMovements = useMemo(() => {
        const fallbackSiteId = user?.siteId || (activeSite?.id || '');
        const siteToFilterBy = (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration')
            ? activeSite.id
            : fallbackSiteId;

        const baseFiltered = filterBySite(movements, user?.role || 'cashier', siteToFilterBy);

        if (user?.role === 'group_ceo' && activeSite && activeSite.type !== 'Administration') {
            return baseFiltered.filter(m => (m.siteId || (m as any).site_id) === activeSite.id);
        }
        return baseFiltered;
    }, [movements, user?.role, user?.siteId, activeSite]);

    return {
        filteredJobs,
        filteredEmployees,
        filteredProducts,
        filteredMovements
    };
};
