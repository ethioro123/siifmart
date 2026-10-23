// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { POValidationFeedback } from '../../components/procurement/POValidationFeedback';
import { getPOCreationIssue } from '../../utils/poCreationValidation';
import { getPODeliveryIssue } from '../../utils/poDeliveryRequirements';
afterEach(cleanup);
describe('procurement field guidance', () => {
    it('opens collapsed fields, focuses the failure and clears accessibility markers', () => {
        HTMLElement.prototype.scrollIntoView = vi.fn();
        const issues = [{ message: 'Enter the required value', selector: '#missing-field' }];
        const { rerender } = render(<><details><summary>Specifications</summary><div><input id="missing-field" /></div></details><POValidationFeedback issues={issues} /></>);
        const field = document.querySelector('#missing-field')!;
        expect(document.activeElement).toBe(field);
        expect(document.querySelector('details')?.open).toBe(true);
        expect(field.getAttribute('aria-invalid')).toBe('true');
        expect(document.getElementById(field.getAttribute('aria-describedby')!)?.textContent).toContain('required value');
        fireEvent.click(screen.getByRole('button', { name: 'Enter the required value' }));
        expect(document.activeElement).toBe(field);
        rerender(<><details><summary>Specifications</summary><div><input id="missing-field" /></div></details><POValidationFeedback issues={[]} /></>);
        expect(field.hasAttribute('aria-invalid')).toBe(false);
    });
    it('identifies receiving facility, supplier and delivery fields without parsing messages', () => {
        const input = { isEditMode: false, canCreate: true, hasUnsavedItem: false, itemCount: 1, destinations: [] as string[], receivingSites: [{ id: 'wh' }], fromRequest: false, manualVendor: false, vendorName: '', supplierId: '' };
        expect(getPOCreationIssue(input)?.selector).toBe('#po-receiving');
        expect(getPOCreationIssue({ ...input, destinations: ['wh'] })?.selector).toBe('#po-supplier');
        expect(getPOCreationIssue({ ...input, destinations: ['wh'], manualVendor: true })?.selector).toBe('#po-vendor-name');
        expect(getPODeliveryIssue([{ customAttributes: { storage: { isPerishable: true } } }], 'Ambient', '')?.selector).toBe('#po-shelf-life');
        expect(getPODeliveryIssue([{ customAttributes: { storage: { type: 'Frozen' } } }], 'Ambient', '')?.selector).toBe('#po-temperature');
    });
});
