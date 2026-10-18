// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const state = vi.hoisted(() => ({ role: 'warehouse_manager', site: undefined as undefined | { type: string; name: string } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: state.role, name: 'Worker' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ activeSite: state.site }) }));
vi.mock('../../utils/native', () => ({ native: { isCleanMobileMode: () => true } }));
vi.mock('../../utils/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

afterEach(() => {
    cleanup();
    state.role = 'warehouse_manager';
    state.site = undefined;
});

function renderRoutes(path: string) {
    render(<MemoryRouter initialEntries={[path]}><Routes>
        <Route path="/finance" element={<ProtectedRoute module="finance">Finance</ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute module="pos">POS terminal</ProtectedRoute>} />
        <Route path="/wms-ops" element={<ProtectedRoute module="warehouse">Warehouse operations</ProtectedRoute>} />
        <Route path="/profile" element={<>Profile</>} />
    </Routes></MemoryRouter>);
}

describe('mobile protected route fallback', () => {
    it('opens fulfillment from a stale POS route while the warehouse site is loading', async () => {
        renderRoutes('/pos');
        expect(await screen.findByText('Warehouse operations')).toBeTruthy();
        expect(screen.queryByText('POS terminal')).toBeNull();
    });

    it('redirects a blocked module to the permitted warehouse route without a POS/profile loop', async () => {
        renderRoutes('/finance');
        expect(await screen.findByText('Warehouse operations')).toBeTruthy();
        expect(screen.queryByText('Profile')).toBeNull();
    });

    it('keeps a cashier in the permitted store terminal', async () => {
        state.role = 'cashier';
        state.site = { type: 'Store', name: 'Store' };
        renderRoutes('/pos');
        expect(await screen.findByText('POS terminal')).toBeTruthy();
    });
});
