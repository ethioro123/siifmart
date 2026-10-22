import { describe, expect, it } from 'vitest';
import { resolvePOReceivingSelection } from '../../utils/poReceivingSelection';

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
