// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZoneCard from '../../components/inventory/components/ZoneCard';
import { ZoneEditModal } from '../../components/inventory/components/ZoneEditModal';
import { warehouseZonesService } from '../../services/zones.service';
type ZoneWithProducts = React.ComponentProps<typeof ZoneCard>['zone'];

afterEach(cleanup);

describe('Inventory Picking & Putaway Zones with Assigned Products', () => {
    it('verifies standard facility default zones all enable both picking and putaway by default (Zones A to J)', () => {
        const defaults = warehouseZonesService.getStandardDefaultZones('site-123');
        expect(defaults.length).toBe(10);

        // Every zone defaults to allowPicking = true and allowPutaway = true
        defaults.forEach((zone) => {
            expect(zone.allowPicking).toBe(true);
            expect(zone.allowPutaway).toBe(true);
        });

        // Zones A through J are all present
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        letters.forEach((letter) => {
            const found = defaults.find(z => z.name.startsWith(`Zone ${letter}`));
            expect(found).toBeDefined();
        });
    });

    it('renders Picking & Putaway badge and assigned inventory products in ZoneCard', () => {
        const mockZone: ZoneWithProducts = {
            id: 'zone-b-id',
            name: 'Zone B (Bulk Storage)',
            type: 'Dry',
            zoneType: 'BULK',
            pickingPriority: 10,
            capacity: 25000,
            occupied: 120,
            allowPicking: true,
            allowPutaway: true,
            status: 'Active',
            siteId: 'site-123',
            assignedProducts: [
                {
                    id: 'prod-1',
                    name: 'Pure Sunflower Cooking Oil 3L',
                    sku: 'OIL-3L',
                    stock: 80,
                    location: 'B-01-02',
                    category: 'Sauces, Oils & Condiments'
                } as any,
                {
                    id: 'prod-2',
                    name: 'Fortified Vegetable Oil 5L',
                    sku: 'OIL-5L',
                    stock: 40,
                    location: 'B-01-03',
                    category: 'Sauces, Oils & Condiments'
                } as any
            ]
        };

        render(
            <ZoneCard
                zone={mockZone}
                userRole="warehouse_manager"
                onConfigure={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        // Verify Picking & Putaway badge
        expect(screen.getByText('Picking & Putaway')).toBeTruthy();

        // Verify assigned products count and titles
        expect(screen.getByText('2 Products')).toBeTruthy();
        expect(screen.getByText('Pure Sunflower Cooking Oil 3L')).toBeTruthy();
        expect(screen.getByText('Fortified Vegetable Oil 5L')).toBeTruthy();
        expect(screen.getByText(/80 units/i)).toBeTruthy();
        expect(screen.getByText(/40 units/i)).toBeTruthy();
    });

    it('allows warehouse supervisor or inventory specialist to configure picking and putaway in ZoneEditModal', async () => {
        const mockZone: ZoneWithProducts = {
            id: 'zone-c-id',
            name: 'Zone C (Fast Pick)',
            type: 'Dry',
            zoneType: 'STANDARD',
            pickingPriority: 3,
            capacity: 10000,
            occupied: 50,
            allowPicking: true,
            allowPutaway: true,
            status: 'Active',
            siteId: 'site-123',
            assignedProducts: []
        };

        const handleSubmit = vi.fn().mockResolvedValue(undefined);

        const { rerender } = render(
            <ZoneEditModal
                isOpen={true}
                zone={mockZone}
                isLoading={false}
                onClose={vi.fn()}
                onSubmit={handleSubmit}
            />
        );

        // Verify picking and putaway toggles exist and start as checked
        const pickingCheckbox = screen.getByRole('checkbox', { name: /allow picking/i }) as HTMLInputElement;
        const putawayCheckbox = screen.getByRole('checkbox', { name: /allow putaway/i }) as HTMLInputElement;

        expect(pickingCheckbox.checked).toBe(true);
        expect(putawayCheckbox.checked).toBe(true);

        // Toggle picking to false (configure not to pick from this zone)
        fireEvent.click(pickingCheckbox);
        expect(pickingCheckbox.checked).toBe(false);

        // Submit form
        const submitBtn = screen.getByRole('button', { name: /save changes/i });
        fireEvent.click(submitBtn);

        expect(handleSubmit).toHaveBeenCalledWith('zone-c-id', expect.objectContaining({
            allowPicking: false,
            allowPutaway: true
        }));
    });

    it('renders No Picking badge when zone is configured to disallow picking and No Putaway when disallowing putaway', () => {
        const restrictedPickZone: ZoneWithProducts = {
            id: 'zone-a-id',
            name: 'Zone A (Receiving Dock)',
            type: 'Dry',
            zoneType: 'RECEIVING',
            pickingPriority: 10,
            capacity: 5000,
            occupied: 0,
            allowPicking: false,
            allowPutaway: true,
            status: 'Active',
            siteId: 'site-123',
            assignedProducts: []
        };

        const { rerender } = render(
            <ZoneCard
                zone={restrictedPickZone}
                userRole="inventory_specialist"
                onConfigure={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('No Picking')).toBeTruthy();
        expect(screen.queryByText('Picking & Putaway')).toBeNull();

        const restrictedPutawayZone: ZoneWithProducts = {
            id: 'zone-j-id',
            name: 'Zone J (Outbound Dock)',
            type: 'Dry',
            zoneType: 'SHIPPING',
            pickingPriority: 10,
            capacity: 4000,
            occupied: 0,
            allowPicking: true,
            allowPutaway: false,
            status: 'Active',
            siteId: 'site-123',
            assignedProducts: []
        };

        rerender(
            <ZoneCard
                zone={restrictedPutawayZone}
                userRole="shift_supervisor"
                onConfigure={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('No Putaway')).toBeTruthy();
        expect(screen.queryByText('Picking & Putaway')).toBeNull();
    });
});
