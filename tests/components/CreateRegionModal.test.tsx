// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CreateRegionModal } from '../../components/settings/regions/CreateRegionModal';
import type { Region } from '../../types';

const mockMutateAsync = vi.fn();

vi.mock('../../hooks/useRegionMutations', () => ({
    useCreateRegionMutation: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false
    })
}));

describe('CreateRegionModal - Smart Unique Region ID Generation', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
        country: 'ET',
        currency: 'ETB',
        sites: [],
        employees: [],
        addNotification: vi.fn()
    };

    const existingRegions: Region[] = [
        {
            code: 'ET-ADD',
            name: 'Addis Ababa Central Region',
            country: 'ET',
            default_currency: 'ETB',
            status: 'active'
        },
        {
            code: 'ET-DIR',
            name: 'Dire Dawa Eastern Region',
            country: 'ET',
            default_currency: 'ETB',
            status: 'active'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('generates standard hub code ET-ADD when ET-ADD is not taken', () => {
        render(
            <CreateRegionModal
                {...defaultProps}
                existingRegions={[]}
            />
        );

        const nameInput = screen.getByPlaceholderText('e.g. Mombasa Coastal');
        fireEvent.change(nameInput, { target: { value: 'Addis Ababa' } });

        const codeInput = screen.getByPlaceholderText('e.g. ET-ADD') as HTMLInputElement;
        expect(codeInput.value).toBe('ET-ADD');
    });

    it('CRITICAL: Never gives duplicate ET-ADD when ET-ADD already exists, giving next smart unique 3 letters', () => {
        render(
            <CreateRegionModal
                {...defaultProps}
                existingRegions={existingRegions}
            />
        );

        const nameInput = screen.getByPlaceholderText('e.g. Mombasa Coastal');
        fireEvent.change(nameInput, { target: { value: 'Addis Ababa' } });

        const codeInput = screen.getByPlaceholderText('e.g. ET-ADD') as HTMLInputElement;
        // MUST NOT BE ET-ADD
        expect(codeInput.value).not.toBe('ET-ADD');
        expect(codeInput.value.startsWith('ET-')).toBe(true);
        expect(codeInput.value).toMatch(/^ET-[A-Z]{3}$/);
    });

    it('generates next unique acronym for multi-word region (Addis Ababa South -> ET-AAS)', () => {
        render(
            <CreateRegionModal
                {...defaultProps}
                existingRegions={existingRegions}
            />
        );

        const nameInput = screen.getByPlaceholderText('e.g. Mombasa Coastal');
        fireEvent.change(nameInput, { target: { value: 'Addis Ababa South' } });

        const codeInput = screen.getByPlaceholderText('e.g. ET-ADD') as HTMLInputElement;
        expect(codeInput.value).toBe('ET-AAS');
    });

    it('displays collision warning and provides one-click button if user manually types existing code', () => {
        render(
            <CreateRegionModal
                {...defaultProps}
                existingRegions={existingRegions}
            />
        );

        const codeInput = screen.getByPlaceholderText('e.g. ET-ADD');
        fireEvent.change(codeInput, { target: { value: 'ET-ADD' } });

        expect(screen.getByText(/already exists/i)).toBeDefined();
        const useSuggestionButton = screen.getByRole('button', { name: /Use ET-/i });
        expect(useSuggestionButton).toBeDefined();

        // Clicking suggestion button applies the unique code and dismisses warning
        fireEvent.click(useSuggestionButton);
        expect(screen.queryByText(/already exists/i)).toBeNull();
        expect((codeInput as HTMLInputElement).value).not.toBe('ET-ADD');
    });

    it('blocks submission and shows alert if territorial code collides with existing region', async () => {
        render(
            <CreateRegionModal
                {...defaultProps}
                existingRegions={existingRegions}
            />
        );

        const nameInput = screen.getByPlaceholderText('e.g. Mombasa Coastal');
        fireEvent.change(nameInput, { target: { value: 'Addis Duplicate' } });

        const codeInput = screen.getByPlaceholderText('e.g. ET-ADD');
        fireEvent.change(codeInput, { target: { value: 'ET-ADD' } });

        const reasonInput = screen.getByPlaceholderText('Record the business reason for this change');
        fireEvent.change(reasonInput, { target: { value: 'Testing duplicate guard' } });

        const submitButton = screen.getByRole('button', { name: /Provision Region/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(defaultProps.addNotification).toHaveBeenCalledWith(
                'alert',
                expect.stringContaining('already exists')
            );
        });

        expect(mockMutateAsync).not.toHaveBeenCalled();
    });
});
