// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackHistory } from '../../components/fulfillment/pack/PackHistory';
import { WMSJob, Site } from '../../types';

vi.mock('../../contexts/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

afterEach(cleanup);

const mockSites: Site[] = [
    {
        id: 'site-1',
        name: 'Nairobi Central DC',
        code: 'NBO-DC',
        type: 'warehouse',
        country_code: 'KE',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

const mockJobs: WMSJob[] = [
    {
        id: 'job-pack-1',
        type: 'PACK',
        status: 'Completed',
        siteId: 'site-1',
        jobNumber: 'PK-001',
        orderRef: 'ORD-1001',
        trackingNumber: 'TRK-987654',
        completedBy: 'user-emp-1',
        lineItems: [
            { id: 'li-1', name: 'Sunflower Cooking Oil 1L', sku: 'KE-OIL-1L', quantity: 2, packedQty: 2, packed: true }
        ],
        createdAt: '2026-10-27T01:00:00Z',
        updatedAt: '2026-10-27T01:30:00Z',
        completedAt: '2026-10-27T01:30:00Z'
    },
    {
        id: 'job-pack-2',
        type: 'PACK',
        status: 'Completed',
        siteId: 'site-1',
        jobNumber: 'PK-002',
        orderRef: 'ORD-1002',
        trackingNumber: 'TRK-112233',
        completedBy: 'user-emp-2',
        lineItems: [
            { id: 'li-2', name: 'Baby Formula Milk 400g', sku: 'KE-MILK-400G', quantity: 1, packedQty: 1, returnedQty: 1, packed: true }
        ],
        createdAt: '2026-10-27T02:00:00Z',
        updatedAt: '2026-10-27T02:30:00Z',
        completedAt: '2026-10-27T02:30:00Z'
    }
];

const mockEmployees = [
    { id: 'user-emp-1', name: 'Alice Mwangi', employee_id: 'EMP-001' },
    { id: 'user-emp-2', name: 'Bob Ochieng', employee_id: 'EMP-002' }
];

describe('PackHistory mobile UX and interaction', () => {
    it('renders historical jobs with tracking numbers and resolved worker information', () => {
        render(
            <PackHistory
                historicalJobs={mockJobs}
                sites={mockSites}
                employees={mockEmployees}
                t={(key: string) => key}
            />
        );

        expect(screen.getByText('TRK-987654')).toBeTruthy();
        expect(screen.getByText('TRK-112233')).toBeTruthy();
        expect(screen.getByText(/Alice Mwangi/)).toBeTruthy();
        expect(screen.getByText(/Bob Ochieng/)).toBeTruthy();
        expect(screen.getByText('Sunflower Cooking Oil 1L')).toBeTruthy();
        expect(screen.getByText('Baby Formula Milk 400g')).toBeTruthy();
    });

    it('filters pack jobs dynamically using search query', () => {
        render(
            <PackHistory
                historicalJobs={mockJobs}
                sites={mockSites}
                employees={mockEmployees}
                t={(key: string) => key}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search ID, order, worker, SKU/i);
        fireEvent.change(searchInput, { target: { value: 'Formula' } });

        expect(screen.queryByText('Sunflower Cooking Oil 1L')).toBeNull();
        expect(screen.getByText('Baby Formula Milk 400g')).toBeTruthy();

        // Clear search using the clear button
        const clearButton = screen.getByRole('button', { name: /clear search/i });
        fireEvent.click(clearButton);

        expect(screen.getByText('Sunflower Cooking Oil 1L')).toBeTruthy();
        expect(screen.getByText('Baby Formula Milk 400g')).toBeTruthy();
    });

    it('filters by "With Returns" status pill', () => {
        render(
            <PackHistory
                historicalJobs={mockJobs}
                sites={mockSites}
                employees={mockEmployees}
                t={(key: string) => key}
            />
        );

        // Find "With Returns" button
        const returnsPill = screen.getByRole('button', { name: /With Returns/i });
        fireEvent.click(returnsPill);

        expect(screen.queryByText('Sunflower Cooking Oil 1L')).toBeNull();
        expect(screen.getByText('Baby Formula Milk 400g')).toBeTruthy();
    });

    it('handles card selection and triggers onJobSelect', () => {
        const handleJobSelect = vi.fn();
        render(
            <PackHistory
                historicalJobs={mockJobs}
                sites={mockSites}
                employees={mockEmployees}
                onJobSelect={handleJobSelect}
                t={(key: string) => key}
            />
        );

        const card = screen.getByText('TRK-987654').closest('div[class*="rounded-2xl"]');
        expect(card).toBeTruthy();
        if (card) {
            fireEvent.click(card);
            expect(handleJobSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'job-pack-1' }));
        }
    });

    it('opens mobile label reprint sheet and triggers onReprintLabel with chosen size', () => {
        const handleReprint = vi.fn();
        render(
            <PackHistory
                historicalJobs={mockJobs}
                sites={mockSites}
                employees={mockEmployees}
                onReprintLabel={handleReprint}
                t={(key: string) => key}
            />
        );

        // Find print buttons
        const printButtons = screen.getAllByTitle(/Reprint Shipping Label/i);
        expect(printButtons.length).toBeGreaterThan(0);

        fireEvent.click(printButtons[0]);

        // Mobile sheet should appear with label sizes
        const standardButton = screen.getByRole('button', { name: /XL \(4 × 6 Standard\)/i });
        expect(standardButton).toBeTruthy();

        fireEvent.click(standardButton);
        expect(handleReprint).toHaveBeenCalledWith(expect.objectContaining({ id: 'job-pack-1' }), 'XL');

        // Modal should close
        expect(screen.queryByRole('button', { name: /XL \(4 × 6 Standard\)/i })).toBeNull();
    });
});
