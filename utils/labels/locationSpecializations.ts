import type { WarehouseZone } from '../../types';

export function locationSpecializations(zones: WarehouseZone[], siteId: string | undefined, letter: string, aisle: string) {
    const zone = zones.find(z => (z.siteId || z.site_id) === siteId
        && z.name.trim().toUpperCase().match(/^(?:ZONE\s+)?([A-Z])(?:$|[\s-])/)?.[1] === letter);
    return {
        zoneSpecialization: zone?.specialization?.trim() || '',
        aisleSpecialization: zone?.aisleSpecializations?.[aisle.padStart(2, '0')]?.trim() || ''
    };
}
