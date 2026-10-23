import { useEffect, type RefObject } from 'react';

/** Dismiss outside the drawer without consuming the user's original interaction. */
export function useSidebarDismiss(
    drawer: RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void
) {
    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node) || drawer.current?.contains(target)) return;
            // The toggle already handles its own click; avoid closing then reopening.
            if (target instanceof Element && target.closest('[aria-controls="main-navigation-drawer"]')) return;
            onClose();
        };
        document.addEventListener('pointerdown', handlePointerDown, true);
        return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    }, [drawer, isOpen, onClose]);
}
