// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PurchaseRequests from '../../pages/PurchaseRequests';

const fixtures = vi.hoisted(() => ({
    user: { id: 'buyer', name: 'Buyer', role: 'buyer', siteId: 'home', regionCode: 'ET-ADD', scopeLevel: 'REGIONAL' },
    requests: [
        { id: 'one', request_number: 'REQ-001', title: 'Milk replenishment', requester_name: 'Worker One', requester_employee_id: 'worker-one', destination_site_id: 'home', business_reason: 'Stock needed', status: 'Submitted', items: [] },
        { id: 'two', request_number: 'REQ-002', title: 'Rice replenishment', requester_name: 'Worker Two', requester_employee_id: 'worker-two', destination_site_id: 'home', business_reason: 'Stock needed', status: 'Submitted', items: [] }
    ],
    sites: [
        { id: 'home', code: 'ET-ADD-WH-01', name: 'Local warehouse', type: 'Warehouse', status: 'Active', country: 'ET', regionCode: 'ET-ADD' },
        { id: 'other', code: 'ET-ADA-WH-01', name: 'Other region warehouse', type: 'Warehouse', status: 'Active', country: 'ET', regionCode: 'ET-ADA' }
    ]
}));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: fixtures.user, showToast: vi.fn() }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ sites: fixtures.sites, products: [], effectiveCountry: 'ET' }) }));
vi.mock('../../hooks/usePurchaseRequisitionMutations', () => ({ usePurchaseRequisitions: () => ({ requests: { data: fixtures.requests }, submit: { mutateAsync: vi.fn() }, review: { mutateAsync: vi.fn() }, refresh: vi.fn() }) }));
vi.mock('../../hooks/useProductSuggestions', () => ({ useProductSuggestions: () => ({ suggestions: { data: [] }, submit: { mutateAsync: vi.fn() }, review: { mutateAsync: vi.fn() }, refresh: vi.fn() }) }));
vi.mock('../../components/procurement/CreatePOModal', () => ({ CreatePOModal: () => null }));
afterEach(cleanup);

describe('purchase request workspace', () => {
    it('switches request types while preserving unfinished stock details', () => {
        render(<PurchaseRequests />);
        fireEvent.change(screen.getByLabelText('Request title'), { target: { value: 'Weekly stock' } });
        fireEvent.click(screen.getByRole('button', { name: 'Product suggestions' }));
        expect(screen.getByRole('heading', { name: 'Suggest a product' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Stock requests' }));
        expect((screen.getByLabelText('Request title') as HTMLInputElement).value).toBe('Weekly stock');
    });
    it('searches history and filters by status', () => {
        render(<PurchaseRequests />);
        fireEvent.change(screen.getByLabelText('Search request history'), { target: { value: 'REQ-001' } });
        expect(screen.getByText('REQ-001 · Milk replenishment')).toBeTruthy();
        expect(screen.queryByText('REQ-002 · Rice replenishment')).toBeNull();
        fireEvent.change(screen.getByLabelText('Filter request status'), { target: { value: 'Approved' } });
        expect(screen.getByText('No stock requests match this view.')).toBeTruthy();
    });
    it('keeps review notes independent for separate requests', () => {
        render(<PurchaseRequests />);
        const notes = screen.getAllByLabelText('Decision note') as HTMLInputElement[];
        fireEvent.change(notes[0], { target: { value: 'Check milk quantity' } });
        expect(notes[1].value).toBe('');
    });
    it('only offers receiving facilities in the assigned region', () => {
        render(<PurchaseRequests />);
        const select = screen.getByLabelText('Destination warehouse') as HTMLSelectElement;
        expect([...select.options].map(option => option.value)).toEqual(['', 'home']);
    });
});
