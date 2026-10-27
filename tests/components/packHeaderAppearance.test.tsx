// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PackHeader } from '../../components/fulfillment/pack/PackHeader';

describe('PackHeader search bar appearance', () => {
    afterEach(cleanup);

    it('renders search bar with seamless input background matching Putaway', () => {
        const setPackSearch = vi.fn();
        const setViewMode = vi.fn();
        const setPackJobFilter = vi.fn();
        const setIsPackFilterDropdownOpen = vi.fn();
        const setPackSortBy = vi.fn();
        const setIsPackSortDropdownOpen = vi.fn();
        const t = (k: string) => k;

        render(
            <PackHeader
                viewMode="Process"
                setViewMode={setViewMode}
                packJobFilter="all"
                setPackJobFilter={setPackJobFilter}
                isPackFilterDropdownOpen={false}
                setIsPackFilterDropdownOpen={setIsPackFilterDropdownOpen}
                packSortBy="priority"
                setPackSortBy={setPackSortBy}
                isPackSortDropdownOpen={false}
                setIsPackSortDropdownOpen={setIsPackSortDropdownOpen}
                packSearch="TEST-SKU"
                setPackSearch={setPackSearch}
                t={t}
            />
        );

        const input = screen.getByRole('textbox', { name: /scan/i });
        expect(input).toBeDefined();

        // Must have seamless background class and rounded border matching Putaway
        expect(input.className).toContain('!bg-[var(--theme-bg-subtle)]');
        expect(input.className).toContain('border-[var(--theme-border)]');
        expect(input.className).toContain('rounded-xl');
    });
});
