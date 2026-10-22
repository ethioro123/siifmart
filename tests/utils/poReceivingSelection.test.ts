import { describe, expect, it } from 'vitest';
import { getPOReceivingRegionLabel, resolvePOReceivingSelection } from '../../utils/poReceivingSelection';

const hubs = [{ id: 'kality' }, { id: 'adama' }];
describe('procurement receiving selection', () => {
    it('does not send HQ or regional procurement to the first warehouse', () => {
        expect(resolvePOReceivingSelection(hubs, 'regional-office')).toEqual([]);
        expect(resolvePOReceivingSelection(hubs)).toEqual([]);
        expect(resolvePOReceivingSelection([hubs[0]], 'hq')).toEqual([]);
    });
    it('defaults to the signed-in receiving facility even when it is not first', () => {
        expect(resolvePOReceivingSelection(hubs, 'adama')).toEqual(['adama']);
    });
    it('keeps a saved explicit destination instead of the user facility', () => {
        expect(resolvePOReceivingSelection(hubs, 'adama', ['kality'])).toEqual(['kality']);
    });
    it('does not reroute an unavailable saved destination to another hub', () => {
        expect(resolvePOReceivingSelection(hubs, 'adama', ['retired-hub'])).toEqual([]);
        expect(resolvePOReceivingSelection(hubs, 'adama', ['kality', 'foreign-hub'])).toEqual(['kality']);
        expect(resolvePOReceivingSelection([], 'adama', ['adama'])).toEqual([]);
    });
});

describe('receiving region heading', () => {
    it('uses the worker assignment even if a different region appears first', () => {
        const hubs = [{ regionCode: 'ET-ADA', region: 'Adama Region' }, { regionCode: 'ET-ADD', region: 'Addis Ababa Central Region' }];
        expect(getPOReceivingRegionLabel(hubs, 'ET-ADD')).toBe('Addis Ababa Central Region');
        expect(getPOReceivingRegionLabel([], 'ET-ADD')).toBe('ET-ADD');
    });
    it('shows the region name for a warehouse and DC in the same region', () => {
        expect(getPOReceivingRegionLabel([
            { regionCode: 'ET-ADD', region: 'Addis Ababa Central Region' },
            { regionCode: 'ET-ADD', region: 'Addis Ababa Central Region' }
        ])).toBe('Addis Ababa Central Region');
    });
    it('uses the region code when a region name is unavailable', () => {
        expect(getPOReceivingRegionLabel([{ region_code: 'KE-NRB' }])).toBe('KE-NRB');
    });
    it('does not label multiple regions as a single region', () => {
        expect(getPOReceivingRegionLabel([{ regionCode: 'ET-ADD' }, { regionCode: 'ET-ADA' }])).toBe('Multiple regions');
    });
    it('does not invent an HQ region when none is assigned', () => {
        expect(getPOReceivingRegionLabel([{}])).toBe('');
        expect(getPOReceivingRegionLabel([])).toBe('');
    });
});
