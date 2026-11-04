// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StagingDevicePairing } from '../../components/login/StagingDevicePairing';
const state = vi.hoisted(() => ({ local: true, available: true, generate: vi.fn(), pair: vi.fn() }));
vi.mock('../../utils/stagingQuickLogin', () => ({ checkIsLocalhost: () => state.local, isStagingQuickLoginAvailable: () => state.available }));
vi.mock('../../hooks/useStagingQuickLogin', () => ({ useStagingDevicePairing: () => ({
    status: { data: { paired: false }, isError: false },
    code: { mutate: state.generate, isPending: false }, pair: { mutate: state.pair, isPending: false }
}) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); state.local = true; state.available = true; });
it('offers code generation on the Mac and code entry on the phone', () => {
    const view = render(<StagingDevicePairing />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate pairing code' }));
    expect(state.generate).toHaveBeenCalledOnce();
    state.local = false; view.rerender(<StagingDevicePairing />);
    expect(screen.queryByRole('button', { name: 'Generate pairing code' })).toBeNull();
    const button = screen.getByRole('button', { name: 'Pair this phone' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Pairing code'), { target: { value: '12345678' } });
    fireEvent.click(button);
    expect(state.pair).toHaveBeenCalledWith('12345678', expect.any(Object));
});
it('renders no pairing controls when unavailable', () => {
    state.available = false; render(<StagingDevicePairing />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByText('Mobile staging quick login')).toBeNull();
});
