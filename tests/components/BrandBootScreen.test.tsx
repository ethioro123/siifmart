// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BrandBootScreen from '../../components/BrandBootScreen';

vi.mock('../../components/Logo', () => ({ default: () => <span>SIIFMART</span> }));
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({
    t: (key: string) => key === 'common.retry' ? 'Retry' : 'Loading...'
}) }));
afterEach(cleanup);
it('announces loading without presenting invented progress', () => {
    render(<BrandBootScreen />);
    expect(screen.getByRole('main').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('Loading...');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
});
it('retains the observed startup error and recovery control', () => {
    render(<BrandBootScreen error="Connection unavailable" />);
    expect(screen.getByRole('alert').textContent).toContain('Connection unavailable');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByRole('main').getAttribute('aria-busy')).toBe('false');
});
