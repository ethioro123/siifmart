// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ZoneCategoryAssignments } from '../../components/inventory/components/ZoneCategoryAssignments';
import { ALL_CATEGORY_OPTIONS } from '../../constants/categories';
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
function Editor() {
    const [accepted, setAccepted] = useState([ALL_CATEGORY_OPTIONS[0], ALL_CATEGORY_OPTIONS[1]]);
    const [aisles, setAisles] = useState<Record<string, string[]>>({ '01': [ALL_CATEGORY_OPTIONS[0]] });
    return <ZoneCategoryAssignments maxAisles={2} accepted={accepted} aisles={aisles}
        onChange={(next, mapping) => { setAccepted(next); setAisles(mapping); }} />;
}
it('allows only parent zone categories in each aisle and preserves separate aisle choices', () => {
    const { container } = render(<Editor />);
    const sections = container.querySelectorAll('details');
    expect(sections).toHaveLength(3);
    const aisle2 = within(sections[2] as HTMLElement);
    expect(aisle2.getAllByRole('checkbox', { hidden: true })).toHaveLength(2);
    fireEvent.click(aisle2.getByLabelText(ALL_CATEGORY_OPTIONS[1]));
    expect(sections[2].querySelector('summary')?.textContent).toContain(ALL_CATEGORY_OPTIONS[1]);
    expect(sections[1].querySelector('summary')?.textContent).toContain(ALL_CATEGORY_OPTIONS[0]);
    fireEvent.click(within(sections[0] as HTMLElement).getByLabelText(ALL_CATEGORY_OPTIONS[0]));
    expect(sections[1].querySelector('summary')?.textContent).toContain('warehouse.noAisleCategories');
});
