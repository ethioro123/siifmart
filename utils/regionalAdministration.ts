import type { Region, Site } from '../types';
import type { RegionalAdminEmployee } from '../types/regionalAdministration';
export function isEligibleRegionalManager(employee: RegionalAdminEmployee, regionCode: string): boolean {
    return employee.role === 'regional_operations_manager' && employee.status === 'Active'
        && (employee.region_code || employee.regionCode) === regionCode;
}
export function isEligibleRegionalHub(site: Site, regionCode: string, regions: Region[]): boolean {
    return ['Administration', 'Administrative'].includes(site.type) && site.status === 'Active'
        && site.code !== `${site.country}-HQ`
        && (!(site.region_code || site.regionCode) || (site.region_code || site.regionCode) === regionCode)
        && !regions.some(region => region.code !== regionCode && region.admin_hub_site_id === site.id);
}
