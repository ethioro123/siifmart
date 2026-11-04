// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ZoneSpecializationFields } from '../../components/inventory/components/ZoneSpecializationFields';
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
function Editor() {
    const [specialization, setSpecialization] = useState('Fresh Produce');
    const [aisles, setAisles] = useState<Record<string, string>>({ '01': 'Leafy Greens', '02': 'Fruit' });
    return <ZoneSpecializationFields specialization={specialization} aisles={aisles} onSpecialization={setSpecialization} onAisles={setAisles} />;
}
it('keeps descriptions separate per numbered aisle and supports clearing them', () => {
    render(<Editor />);
    const input = screen.getByLabelText('warehouse.aisleSpecialization') as HTMLInputElement;
    expect(input.value).toBe('Leafy Greens');
    fireEvent.change(screen.getByLabelText('warehouse.aisleTitle'), { target: { value: '02' } });
    expect(input.value).toBe('Fruit');
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('02 · Fruit')).toBeNull();
    fireEvent.change(screen.getByLabelText('warehouse.aisleTitle'), { target: { value: '01' } });
    expect(input.value).toBe('Leafy Greens');
    expect((screen.getByLabelText('warehouse.zoneSpecialization') as HTMLInputElement).value).toBe('Fresh Produce');
});
