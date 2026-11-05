import type { Employee } from '../types';
export type RegionalAdminEmployee = Pick<Employee, 'id' | 'name' | 'role' | 'status' | 'siteId' | 'site_id' | 'regionCode' | 'region_code' | 'country' | 'country_code'>;
