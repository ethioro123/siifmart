import { useEffect, useRef } from 'react';
export function useProductControlDialog(open: boolean, nestedOpen: boolean, saving: boolean, close: () => void) {
    const dialogRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open || nestedOpen) return;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const controls = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]') || []).filter(element => element.offsetParent !== null);
        controls()[0]?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) { event.preventDefault(); close(); }
            if (event.key !== 'Tab') return;
            const elements = controls(); const first = elements[0]; const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
    }, [open, nestedOpen, saving, close]);
    return dialogRef;
}
