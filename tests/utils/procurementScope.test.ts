import { describe, expect, it } from 'vitest';
import { filterProcurementSites, getProcurementScope } from '../../utils/procurementScope';

const sites = [
    { id: 'hq', code: 'ET-HQ', type: 'Administration', country: 'ET' },
    { id: 'office-one', code: 'ET-ADD', type: 'Administration', country: 'ET', regionCode: 'ET-ADD' },
    { id: 'office-two', code: 'ET-ADA', type: 'Administration', country: 'ET', regionCode: 'ET-ADA' },
    { id: 'wh-one', code: 'ET-ADD-WH-01', type: 'Warehouse', country: 'ET', regionCode: 'ET-ADD' },
    { id: 'dc-one', code: 'ET-ADD-DC-01', type: 'Distribution Center', country: 'ET', regionCode: 'ET-ADD' },
    { id: 'wh-two', code: 'ET-ADA-WH-01', type: 'Warehouse', country: 'ET', regionCode: 'ET-ADA' },
    { id: 'ke-wh', code: 'KE-NRB-WH-01', type: 'Warehouse', country: 'KE', regionCode: 'KE-NRB' }
];
const idsFor = (actor: Parameters<typeof getProcurementScope>[0], country = 'ET') =>
    filterProcurementSites(sites, country, getProcurementScope(actor, sites)).map(site => site.id);

describe('procurement assignment boundaries', () => {
    it('restricts a regional buyer to their own region', () => {
        const actor = { role: 'buyer', siteId: 'office-one', scopeLevel: 'REGIONAL', regionCode: 'ET-ADD' };
        expect(idsFor(actor)).toEqual(['office-one', 'wh-one', 'dc-one']);
        expect(idsFor(actor, 'KE')).toEqual([]);
    });
    it('honors database field aliases without a country-wide fallback', () => {
        expect(idsFor({ role: 'buyer', site_id: 'office-two', scope_level: 'REGIONAL', region_code: 'ET-ADA' }))
            .toEqual(['office-two', 'wh-two']);
    });
    it('denies missing, mismatched or unloaded regional assignments', () => {
        expect(idsFor({ role: 'regional_procurement_manager', siteId: 'office-one' })).toEqual([]);
        expect(idsFor({ role: 'buyer', siteId: 'office-one', regionCode: 'ET-ADA' })).toEqual([]);
        expect(idsFor({ role: 'buyer', regionCode: 'ET-ADD' })).toEqual([]);
        expect(idsFor({ role: 'buyer', siteId: 'hq', scopeLevel: 'REGIONAL' })).toEqual([]);
    });
    it('restricts an operating-site worker to their own facility', () => {
        expect(idsFor({ role: 'buyer', siteId: 'wh-one', regionCode: 'ET-ADD', scopeLevel: 'REGIONAL' })).toEqual(['wh-one']);
    });
    it('keeps explicit national HQ and global authority within the chosen country', () => {
        expect(idsFor({ role: 'buyer', siteId: 'hq', scopeLevel: 'HQ' })).toEqual(['hq', 'office-one', 'office-two', 'wh-one', 'dc-one', 'wh-two']);
        expect(idsFor({ role: 'group_ceo' }, 'KE')).toEqual(['ke-wh']);
    });
});
