// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PODeliveryRequirementsSummary } from '../../components/procurement/PODeliveryRequirementsSummary';
import { POItemOrderDetails } from '../../components/procurement/POItemOrderDetails';
afterEach(cleanup);
const chilled = { customAttributes: { storage: { type: 'Chilled', isPerishable: true, shelfLifeDays: '14' } } };
describe('PO attribute guidance', () => {
    it('offers an explicit temperature correction without applying it automatically', () => {
        const apply = vi.fn();
        render(<PODeliveryRequirementsSummary items={[chilled]} temperature="Ambient" shelfLife="7" onApplyTemperature={apply} />);
        expect(apply).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Use Chilled delivery' }));
        expect(apply).toHaveBeenCalledWith('Chilled');
    });
    it('flags mixed-temperature items without offering an unsafe single temperature', () => {
        render(<PODeliveryRequirementsSummary items={[chilled, { customAttributes: { storage: { type: 'Frozen' } } }]} temperature="Chilled" shelfLife="7" onApplyTemperature={vi.fn()} />);
        expect(screen.getByRole('status').textContent).toContain('separate purchase orders');
        expect(screen.queryByRole('button')).toBeNull();
    });
    it('shows the full buying-to-selling quantity equation and cost basis', () => {
        render(<POItemOrderDetails currentQty={10} setCurrentQty={vi.fn()} currentCost={1200} setCurrentCost={vi.fn()}
            currentRetailPrice={0} setCurrentRetailPrice={vi.fn()} unitsPerOrderUnit={24} totalUnits={240} showConversion
            unitSuffix="" orderUnitName="Case" sellUnit="UNIT" currencySymbol="ETB" showRetailInput={false} errors={{}} setErrors={vi.fn()} />);
        expect(screen.getByLabelText('Packaging calculation').textContent).toContain('10 cases × 24 UNIT = 240 UNIT');
        expect(screen.getByLabelText('Packaging calculation').textContent).toContain('50 per UNIT');
    });
});
