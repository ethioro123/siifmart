// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DeleteSiteModal } from '../../components/settings/DeleteSiteModal';
import type { Site } from '../../types';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../../services/record-lifecycle.service', () => ({ recordLifecycleService: { request } }));
vi.mock('../../components/Modal', () => ({ default: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => isOpen ? <div>{children}</div> : null }));
afterEach(cleanup);
beforeEach(() => { request.mockReset(); });
function open() {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <DeleteSiteModal isOpen onClose={vi.fn()} siteToDelete={{ id: 'site-id', name: 'Test Facility' } as Site}
            confirmDeleteSite={vi.fn()} deleteConfirmText="" setDeleteConfirmText={vi.fn()} isDeleting={false} />
    </QueryClientProvider></MemoryRouter>);
}
it('submits a reviewed facility request with a reason and never directly closes the site', async () => {
    request.mockResolvedValue('request-id'); open();
    expect((screen.getByRole('button', { name: 'Submit closure request' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Facility lease has ended' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit closure request' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('site', 'site-id', 'Facility lease has ended', {}));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('submitted for review'));
});
it('keeps the reason available and reports a rejected request', async () => {
    request.mockRejectedValue(new Error('Independent closure review unavailable')); open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Facility lease has ended' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit closure request' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Independent closure review unavailable');
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Facility lease has ended');
});
