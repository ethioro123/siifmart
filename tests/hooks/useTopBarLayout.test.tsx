// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTopBarLayout } from '../../hooks/useTopBarLayout';

let width = 390;
let resize: () => void;
const disconnect = vi.fn();
function Header() {
    const { headerRef, density, isContextOpen, setIsContextOpen } = useTopBarLayout();
    return <header ref={headerRef} data-testid="header" data-density={density}>
        <button onClick={() => setIsContextOpen(value => !value)} aria-expanded={isContextOpen}>Workplace</button>
    </header>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('available top bar space', () => {
    it('responds to actual header resizing, including a sidebar opening', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width } as DOMRect));
        vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect = disconnect; });
        const { unmount } = render(<Header />);
        expect(screen.getByTestId('header').dataset.density).toBe('compact');
        for (const [nextWidth, density] of [[800, 'medium'], [1200, 'wide'], [1600, 'full'], [320, 'compact']] as const) {
            act(() => { width = nextWidth; resize(); });
            expect(screen.getByTestId('header').dataset.density).toBe(density);
        }
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });
    it('dismisses workplace controls on Escape or an outside click', () => {
        render(<Header />);
        const trigger = screen.getByRole('button', { name: 'Workplace' });
        fireEvent.click(trigger);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(trigger);
        fireEvent.mouseDown(document.body);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
});
