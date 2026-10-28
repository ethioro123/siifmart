// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const state = vi.hoisted(() => ({ role: 'warehouse_manager', mobile: true, site: undefined as undefined | { type: string; name: string } }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: state.role, name: 'Worker' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ activeSite: state.site }) }));
vi.mock('../../utils/native', () => ({ native: { isCleanMobileMode: () => state.mobile } }));
vi.mock('../../utils/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

afterEach(() => {
    cleanup();
    state.role = 'warehouse_manager';
    state.site = undefined;
    state.mobile = true;
});

function renderRoutes(path: string) {
    render(<MemoryRouter initialEntries={[path]}><Routes>
        <Route path="/pricing" element={<ProtectedRoute module="pricing">Product review queue</ProtectedRoute>} />
        <Route path="/procurement" element={<ProtectedRoute module="procurement">Purchase order queue</ProtectedRoute>} />
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

describe('approval review route entry', () => {
    it('opens finance review for an already authorized regional finance manager on mobile', async () => {
        state.role='regional_finance_manager'; state.site={type:'Warehouse',name:'Warehouse'};
        renderRoutes('/finance?tab=expenses');
        expect(await screen.findByText('Finance')).toBeTruthy();
    });
    it('does not grant warehouse managers finance access through a review query', async () => {
        state.site={type:'Warehouse',name:'Warehouse'};
        renderRoutes('/finance?tab=expenses');
        expect(await screen.findByText('Warehouse operations')).toBeTruthy();
        expect(screen.queryByText('Finance')).toBeNull();
    });
});

describe('desktop approval review links with operational sites', () => {
    it.each(['Warehouse','Store'])('opens product reviews for regional supply chain at a %s', async type => {
        state.mobile=false; state.role='regional_supply_chain_manager'; state.site={type,name:type};
        renderRoutes('/pricing?tab=reviews');
        expect(await screen.findByText('Product review queue')).toBeTruthy();
    });
    it('opens procurement review for the authorized regional procurement manager at a store', async () => {
        state.mobile=false; state.role='regional_procurement_manager'; state.site={type:'Store',name:'Store'};
        renderRoutes('/procurement?tab=orders');
        expect(await screen.findByText('Purchase order queue')).toBeTruthy();
    });
    it('still denies product rules at a warehouse to regional supply chain', async () => {
        state.mobile=false; state.role='regional_supply_chain_manager'; state.site={type:'Warehouse',name:'Warehouse'};
        renderRoutes('/pricing?tab=rules');
        expect(await screen.findByText('Warehouse operations')).toBeTruthy();
        expect(screen.queryByText('Product review queue')).toBeNull();
    });
});
