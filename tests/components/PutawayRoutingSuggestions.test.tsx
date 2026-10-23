// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePutawayRouting } from '../../components/fulfillment/putaway/hooks/usePutawayRouting';
import { PutawayRoutingSuggestions } from '../../components/fulfillment/putaway/components/PutawayRoutingSuggestions';
import { putawayRoutingService } from '../../services/putaway-routing.service';
vi.mock('../../services/putaway-routing.service', () => ({ putawayRoutingService: { load: vi.fn() } }));
const input = { siteId: 'et-dc', sku: 'ET001', quantity: 10, batchNumber: 'LOT1' };
function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return renderHook(({ job }) => usePutawayRouting(input, 'ET', true, job, 'worker'), { wrapper, initialProps: { job: 'job-1' } });
}
afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(putawayRoutingService.load).mockResolvedValue({ stock: [
        { id: 'p', siteId: 'et-dc', sku: 'ET001', stock: 20, location: 'A-01-01', batchNumber: 'LOT1' }
    ], zones: [], mappings: [] });
});
describe('Putaway routing controls', () => {
    it('reroutes a full bin, refreshes live stock, and scopes exclusions to the job', async () => {
        const { result, rerender } = setup();
        await waitFor(() => expect(result.current.suggestions[0]?.location).toBe('A-01-01'));
        act(() => result.current.reportFull('A-01-01'));
        await waitFor(() => expect(result.current.suggestions[0]?.location).toBe('A-01-02'));
        expect(putawayRoutingService.load).toHaveBeenCalledTimes(2);
        rerender({ job: 'job-2' });
        await waitFor(() => expect(result.current.suggestions[0]?.location).toBe('A-01-01'));
    });
    it('shows the routing reason and full-bin action without bypassing physical scanning', () => {
        const full = vi.fn();
        render(<PutawayRoutingSuggestions routing={{ suggestions: [{ location: 'A-01-01', type: 'SUGGESTED', label: 'Same SKU and lot', reason: 'Verify physical space.', existingUnits: 20 }], loading: false, error: null, updatedAt: 0, refresh: vi.fn(), reportFull: full }} />);
        expect(screen.getByText('Verify physical space.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Bin full/ }));
        expect(full).toHaveBeenCalledWith('A-01-01');
        expect(screen.queryByRole('button', { name: 'A-01-01' })).toBeNull();
    });
});
