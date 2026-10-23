// @vitest-environment jsdom
import React, { useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useSidebarDismiss } from '../../hooks/useSidebarDismiss';
afterEach(cleanup);
function Drawer() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLElement>(null);
    useSidebarDismiss(ref, open, () => setOpen(false));
    return <><button aria-controls="main-navigation-drawer" onClick={() => setOpen(value => !value)}><span>Toggle</span></button>
        <aside ref={ref} data-testid="drawer" data-open={open}><button>Inside</button></aside>
        <button>Outside</button></>;
}
describe('sidebar outside dismissal', () => {
    it('closes on outside pointer interaction and preserves interactions inside', () => {
        render(<Drawer />);
        fireEvent.click(screen.getByText('Toggle'));
        fireEvent.pointerDown(screen.getByText('Inside'));
        expect(screen.getByTestId('drawer').dataset.open).toBe('true');
        fireEvent.pointerDown(screen.getByText('Outside'), { pointerType: 'touch' });
        expect(screen.getByTestId('drawer').dataset.open).toBe('false');
    });
    it('lets the toggle close the drawer without reopening it', () => {
        render(<Drawer />);
        fireEvent.click(screen.getByText('Toggle'));
        fireEvent.pointerDown(screen.getByText('Toggle'));
        expect(screen.getByTestId('drawer').dataset.open).toBe('true');
        fireEvent.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('drawer').dataset.open).toBe('false');
        fireEvent.pointerDown(document.body);
        expect(screen.getByTestId('drawer').dataset.open).toBe('false');
    });
});
