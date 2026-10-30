import { describe, expect, it } from 'vitest';
import { effectiveTransferStatus, transferEvidenceEvents, transferStatusTone } from '../../utils/transferPresentation';
describe('shared transfer presentation', () => {
    it('uses dispatch progress without overwriting terminal or exception states', () => {
        expect(effectiveTransferStatus('Approved', 'In-Transit')).toBe('In-Transit');
        expect(effectiveTransferStatus('Received', 'Shipped')).toBe('Received');
        expect(effectiveTransferStatus('Cancelled', 'Delivered')).toBe('Cancelled');
        expect(effectiveTransferStatus('Partially Delivered', 'Received')).toBe('Partially Delivered');
        expect(transferStatusTone('Delivered')).toBe('info');
    });
    it('only shows observed, valid timestamps in chronological order', () => {
        expect(transferEvidenceEvents({ createdAt: '2026-10-30T08:00:00Z', shippedAt: 'bad', receivedAt: '2026-10-30T10:00:00Z', approvedAt: '2026-10-30T09:00:00Z' }).map(event => event.key)).toEqual(['requested', 'approved', 'received']);
        expect(transferEvidenceEvents({})).toEqual([]);
    });
});
