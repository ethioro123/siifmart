// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PausedPODraftsSection } from '../../../components/procurement/components/PausedPODraftsSection';
import { renderStatusBadge } from '../../../components/procurement/components/POBadges';
import type { StoredPODraft } from '../../../utils/procurementDraftStorage';

describe('Differentiating Completed Drafts from Paused Session Drafts', () => {
    afterEach(() => {
        cleanup();
    });
    const mockDrafts: StoredPODraft[] = [
        {
            id: 'draft-uuid-1',
            data: {
                isManualVendor: false,
                manualVendorName: '',
                newPOSupplier: 'sup-1',
                destinationSiteIds: ['site-1'],
                expectedDate: '2026-11-20',
                tempReq: 'Ambient',
                shelfLife: '6 months',
                dockSlot: 'DOCK-1',
                poPriority: 'Normal',
                quantityDistribution: 'per-store',
                newPOItems: [
                    {
                        productId: 'prod-1',
                        productName: 'SunGold Pure Sunflower Cooking Oil 3L',
                        quantity: 100,
                        unitCost: 80,
                        totalCost: 8000
                    }
                ],
                poNotes: 'Urgent warehouse replenishment',
                paymentTerms: 'Net 30',
                incoterms: 'FOB',
                shippingCost: 0,
                discountRate: 0,
                taxRate: 0
            },
            meta: {
                id: 'draft-uuid-1',
                savedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
                itemCount: 1,
                supplierDisplay: 'SunGold Refining PLC',
                totalEstimatedAmount: 8000,
                currency: 'ETB'
            },
            countryCode: 'ET',
            userId: 'buyer-01',
            updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
            id: 'draft-uuid-2',
            data: {
                isManualVendor: true,
                manualVendorName: 'Adama Agro-Industrial Enterprise',
                newPOSupplier: '',
                destinationSiteIds: ['site-2'],
                expectedDate: '2026-11-25',
                tempReq: 'Ambient',
                shelfLife: '12 months',
                dockSlot: 'DOCK-2',
                poPriority: 'High',
                quantityDistribution: 'per-store',
                newPOItems: [
                    {
                        productId: 'prod-2',
                        productName: 'Adama White Teff Flour 25kg',
                        quantity: 50,
                        unitCost: 200,
                        totalCost: 10000
                    },
                    {
                        productId: 'prod-3',
                        productName: 'Adama Wheat Grain 50kg',
                        quantity: 20,
                        unitCost: 150,
                        totalCost: 3000
                    }
                ],
                poNotes: 'Bulk seasonal grain procurement',
                paymentTerms: 'Net 60',
                incoterms: 'FOB',
                shippingCost: 500,
                discountRate: 0,
                taxRate: 0
            },
            meta: {
                id: 'draft-uuid-2',
                savedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
                itemCount: 2,
                supplierDisplay: 'Adama Agro-Industrial Enterprise',
                totalEstimatedAmount: 13500,
                currency: 'ETB'
            },
            countryCode: 'ET',
            userId: 'buyer-01',
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
    ];

    it('renders multiple paused session drafts simultaneously with clear distinction', () => {
        const onResume = vi.fn();
        const onDelete = vi.fn();

        render(
            <PausedPODraftsSection
                drafts={mockDrafts}
                onResumeDraft={onResume}
                onDeleteDraft={onDelete}
                currencySymbol="ETB"
            />
        );

        // Header shows count of session orders
        expect(screen.getByText('Paused Drafts (Work-in-Progress)')).toBeDefined();
        expect(screen.getByText('2 Session Orders')).toBeDefined();

        // Both distinct vendor drafts are visible in the list
        expect(screen.getByText('SunGold Refining PLC')).toBeDefined();
        expect(screen.getByText('Adama Agro-Industrial Enterprise')).toBeDefined();

        // Distinct paused draft badges are present
        const pausedBadges = screen.getAllByText('Paused Draft');
        expect(pausedBadges.length).toBe(2);

        // Line item counts and previews are rendered
        expect(screen.getByText('1 item')).toBeDefined();
        expect(screen.getByText('2 items')).toBeDefined();
        expect(screen.getByText('SunGold Pure Sunflower Cooking Oil 3L')).toBeDefined();
        expect(screen.getByText('Adama White Teff Flour 25kg')).toBeDefined();
    });

    it('triggers onResumeDraft when the user clicks Resume Order on a specific paused draft', () => {
        const onResume = vi.fn();
        const onDelete = vi.fn();

        render(
            <PausedPODraftsSection
                drafts={mockDrafts}
                onResumeDraft={onResume}
                onDeleteDraft={onDelete}
                currencySymbol="ETB"
            />
        );

        const resumeButtons = screen.getAllByRole('button', { name: /Resume Order/i });
        expect(resumeButtons.length).toBe(2);

        // Click resume on second draft (Adama Agro-Industrial Enterprise)
        fireEvent.click(resumeButtons[1]);
        expect(onResume).toHaveBeenCalledWith(mockDrafts[1]);
    });

    it('triggers onDeleteDraft when the user clicks Delete on a specific paused draft', () => {
        const onResume = vi.fn();
        const onDelete = vi.fn();

        render(
            <PausedPODraftsSection
                drafts={mockDrafts}
                onResumeDraft={onResume}
                onDeleteDraft={onDelete}
                currencySymbol="ETB"
            />
        );

        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        expect(deleteButtons.length).toBe(2);

        // Click delete on first draft
        fireEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledWith('draft-uuid-1');
    });

    it('badges actual database purchase orders as "Draft (Completed)" to distinguish from in-progress paused drafts', () => {
        const badge = renderStatusBadge('Draft');
        render(<div>{badge}</div>);

        expect(screen.getByText('Draft (Completed)')).toBeDefined();
    });

    it('does not render PausedPODraftsSection when there are zero paused drafts', () => {
        const { container } = render(
            <PausedPODraftsSection
                drafts={[]}
                onResumeDraft={vi.fn()}
                onDeleteDraft={vi.fn()}
                currencySymbol="ETB"
            />
        );

        expect(container.firstChild).toBeNull();
    });
});
