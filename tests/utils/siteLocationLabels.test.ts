import { describe, expect, it } from 'vitest';
import { buildSiteLocationLabels, locationLabelsCSV } from '../../utils/siteLocationLabels';
import { encodeLocation } from '../../utils/locationEncoder';
describe('saved facility location labels', () => {
    it('exports only real bay identities, deduplicating human and barcode representations', () => {
        const rows = buildSiteLocationLabels(['B-01-02', encodeLocation('B-01-02', '1234')!, 'A-02-03', 'Receiving Dock', 'A-00-01'], '1234', 'Site');
        expect(rows.map(row => row[0])).toEqual(['A-02-03', 'B-01-02']);
        expect(rows[1][1]).toBe(encodeLocation('B-01-02', '1234'));
    });
    it('rejects invalid prefixes and empty exports rather than inventing bays', () => {
        expect(() => buildSiteLocationLabels(['A-01-01'], 'WH-01', 'Site')).toThrow('prefix');
        expect(() => buildSiteLocationLabels([], '1234', 'Site')).toThrow('No saved bay');
    });
    it('escapes facility names containing commas and quotes', () => {
        expect(locationLabelsCSV([['Site, "East"', 'A-01-01']])).toBe('"Site, ""East""","A-01-01"');
    });
});
