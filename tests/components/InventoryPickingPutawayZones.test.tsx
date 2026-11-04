// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZoneCard from '../../components/inventory/components/ZoneCard';
import { warehouseZonesService } from '../../services/zones.service';
type ZoneWithProducts = React.ComponentProps<typeof ZoneCard>['zone'];

afterEach(cleanup);

describe('Inventory Picking & Putaway Zones with Assigned Products', () => {
    it('verifies standard facility default zones contain at least six zones with both picking and putaway', () => {
        const defaults = warehouseZonesService.getStandardDefaultZones('site-123');
        const pickingAndPutawayZones = defaults.filter(z => z.allowPicking !== false && z.allowPutaway !== false);
        
        // Strictly at least 6 zones (actually 7: B, C, D, E, F, G, I)
        expect(pickingAndPutawayZones.length).toBeGreaterThanOrEqual(6);
        expect(pickingAndPutawayZones.map(z => z.name)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Zone B'),
                expect.stringContaining('Zone C'),
                expect.stringContaining('Zone D'),
                expect.stringContaining('Zone E'),
                expect.stringContaining('Zone F'),
                expect.stringContaining('Zone G'),
                expect.stringContaining('Zone I')
            ])
        );
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

    it('renders No Picking badge for inbound dock and No Putaway for outbound shipping', () => {
        const inboundZone: ZoneWithProducts = {
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
                zone={inboundZone}
                userRole="warehouse_manager"
                onConfigure={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('No Picking')).toBeTruthy();
        expect(screen.queryByText('Picking & Putaway')).toBeNull();

        const outboundZone: ZoneWithProducts = {
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
                zone={outboundZone}
                userRole="warehouse_manager"
                onConfigure={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('No Putaway')).toBeTruthy();
        expect(screen.queryByText('Picking & Putaway')).toBeNull();
    });
});
