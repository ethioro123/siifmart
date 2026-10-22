import { describe, expect, it } from 'vitest';
import { validatePOCreation } from '../../utils/poCreationValidation';
const input = { isEditMode: false, canCreate: true, hasUnsavedItem: false, itemCount: 1, destinations: ['warehouse'], receivingSites: [{ id: 'warehouse' }], fromRequest: false, manualVendor: false, vendorName: '', supplierId: 'supplier' };
describe('PO creation safeguards', () => {
    it('accepts a complete authorized order', () => expect(validatePOCreation(input)).toBeNull());
    it('rejects a destination outside the authorized receiving list', () => expect(validatePOCreation({ ...input, destinations: ['other-region'] })).toContain('assigned scope'));
    it('preserves role, unfinished-item and purchase-request restrictions', () => {
        expect(validatePOCreation({ ...input, canCreate: false })).toContain('not authorized');
        expect(validatePOCreation({ ...input, hasUnsavedItem: true })).toContain('unfinished item');
        expect(validatePOCreation({ ...input, fromRequest: true, destinations: ['warehouse', 'other'] })).toContain('one destination');
    });
});
