// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ZoneSpecializationFields } from '../../components/inventory/components/ZoneSpecializationFields';
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
function Editor({ maxAisles = 20 }: { maxAisles?: number }) {
    const [specialization, setSpecialization] = useState('Fresh Produce');
    const [aisles, setAisles] = useState<Record<string, string>>({ '01': 'Leafy Greens', '02': 'Fruit' });
    return <ZoneSpecializationFields maxAisles={maxAisles} specialization={specialization} aisles={aisles} onSpecialization={setSpecialization} onAisles={setAisles} />;
}
const aisleInput = (number: string) => screen.getByLabelText('warehouse.aisleTitle ' + number) as HTMLInputElement;
it('shows all 20 aisle assignments together, including unassigned aisles', () => {
    render(<Editor />);
    expect(screen.getAllByRole('textbox')).toHaveLength(21);
    expect(aisleInput('01').value).toBe('Leafy Greens');
    expect(aisleInput('02').value).toBe('Fruit');
    expect(aisleInput('20').value).toBe('');
    expect(screen.queryByRole('combobox')).toBeNull();
});
it('edits and clears individual aisle assignments without changing the zone or other aisles', () => {
    render(<Editor />);
    fireEvent.change(aisleInput('02'), { target: { value: 'Citrus' } });
    fireEvent.change(aisleInput('20'), { target: { value: 'Bulk Goods' } });
    fireEvent.change(aisleInput('01'), { target: { value: '' } });
    expect(aisleInput('01').value).toBe('');
    expect(aisleInput('02').value).toBe('Citrus');
    expect(aisleInput('20').value).toBe('Bulk Goods');
    expect((screen.getByLabelText('warehouse.zoneSpecialization') as HTMLInputElement).value).toBe('Fresh Produce');
});
it('uses the configured facility aisle count', () => {
    render(<Editor maxAisles={3} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    expect(screen.queryByLabelText('warehouse.aisleTitle 04')).toBeNull();
});
