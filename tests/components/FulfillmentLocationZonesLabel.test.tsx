// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssignLabelHub } from '../../components/fulfillment/assign/AssignLabelHub';
import { AssignBayLocationSelector } from '../../components/fulfillment/assign/AssignBayLocationSelector';
import { warehouseZonesService } from '../../services/zones.service';
import type { Site, WarehouseZone } from '../../types';

vi.mock('../../utils/labels/ProductLabelGenerator', () => ({ generateUnifiedBatchLabelsHTML: vi.fn() }));
vi.mock('../../utils/labels/LocationLabelGenerator', () => ({ generateLocationLabelHTML: vi.fn() }));
vi.mock('../../utils/printHelper', () => ({ printHtmlContent: vi.fn() }));

afterEach(cleanup);

describe('Fulfillment Zones A through J and Location Label Printing', () => {
    const mockSite: Site = {
        id: 'c1111111-1111-4000-8000-000000000110',
        name: 'Adama Industrial Warehouse',
        code: 'ADA-WH-01',
        country: 'ET',
        type: 'Warehouse',
        aisleCount: 20,
        bayCount: 20
    } as any;

    const standardZones: WarehouseZone[] = warehouseZonesService.getStandardDefaultZones(mockSite.id).map((z, idx) => ({
        ...z,
        id: `zone-${idx + 1}`
    }));

    it('provides standard default zones A through J from warehouseZonesService', () => {
        const defaults = warehouseZonesService.getStandardDefaultZones(mockSite.id);
        expect(defaults).toHaveLength(10);
        expect(defaults[0].name).toContain('Zone A');
        expect(defaults[9].name).toContain('Zone J');
    });

    it('renders Zones A through J in AssignBayLocationSelector with neutral names', () => {
        const zoneLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const setBayConfig = vi.fn();

        render(
            <AssignBayLocationSelector
                bayConfig={{ zone: 'A', aisle: '01', bay: '01' }}
                setBayConfig={setBayConfig}
                zoneLetters={zoneLetters}
                maxAisles={20}
                maxBays={20}
                zones={standardZones}
            />
        );

        const zoneSelect = screen.getByTitle(/zone/i) as HTMLSelectElement;
        expect(zoneSelect.options).toHaveLength(10);
        expect(zoneSelect.options[0].value).toBe('A');
        expect(zoneSelect.options[0].text).toContain('Zone A');
        expect(zoneSelect.options[9].value).toBe('J');
        expect(zoneSelect.options[9].text).toContain('Zone J');

        fireEvent.change(zoneSelect, { target: { value: 'B' } });
        expect(setBayConfig).toHaveBeenCalledWith(expect.objectContaining({ zone: 'B' }));
    });

    it('renders configured facility layout banner and scannable location barcode in AssignLabelHub', () => {
        render(
            <AssignLabelHub
                filteredProducts={[]}
                addNotification={vi.fn()}
                t={(key: string) => key}
                zones={standardZones}
                onZoneUpdate={vi.fn()}
                user={{ id: 'usr-1' }}
                activeSite={mockSite}
            />
        );

        // Switch to BAY mode
        const bayModeButtons = screen.getAllByRole('button', { name: /bays/i });
        fireEvent.click(bayModeButtons[0]);

        // Verify layout banner and active button
        expect(screen.getByText(/Zones A–J Active/i)).toBeTruthy();
        const generateBtn = screen.getByRole('button', { name: /generate location label/i }) as HTMLButtonElement;
        expect(generateBtn.disabled).toBe(false);
    });
});
