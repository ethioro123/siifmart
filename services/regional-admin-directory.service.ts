import { supabase } from '../lib/supabase';
import type { Site } from '../types';
import type { Country } from '../utils/localization';
import type { RegionalAdminEmployee } from '../types/regionalAdministration';
export const regionalAdminDirectoryService = {
    async load(country: string): Promise<{ sites: Site[]; employees: RegionalAdminEmployee[] }> {
        const sites: Site[] = [];
        const employees: RegionalAdminEmployee[] = [];
        const pageSize = 100;
        for (let offset = 0; ; offset += pageSize) {
            if (offset >= 10_000) throw new Error('Too many facilities to load the regional directory.');
            const { data, error } = await supabase.from('sites')
                .select('id,name,code,type,address,status,country,currency,region_code')
                .eq('country', country).order('id').range(offset, offset + pageSize - 1);
            if (error) throw error;
            for (const row of data ?? []) sites.push({ ...row, country: row.country as Country, regionCode: row.region_code });
            if (!data || data.length < pageSize) break;
        }
        if (!sites.length) return { sites, employees };
        for (let offset = 0; ; offset += pageSize) {
            if (offset >= 10_000) throw new Error('Too many regional managers to load the directory.');
            const { data, error } = await supabase.from('employees').select('id,name,role,status,site_id,region_code')
                .eq('role', 'regional_operations_manager').eq('status', 'Active').in('site_id', sites.map(site => site.id))
                .order('id').range(offset, offset + pageSize - 1);
            if (error) throw error;
            for (const row of data ?? []) {
                const regionCode = row.region_code || sites.find(site => site.id === row.site_id)?.region_code;
                employees.push({ ...row, siteId: row.site_id, regionCode, region_code: regionCode, country });
            }
            if (!data || data.length < pageSize) break;
        }
        return { sites, employees };
    }
};
