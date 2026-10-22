import { useLayoutEffect, useRef, useState } from 'react';

export function useTopBarLayout() {
    const headerRef = useRef<HTMLElement>(null);
    const [width, setWidth] = useState(0);
    const [isContextOpen, setIsContextOpen] = useState(false);
    useLayoutEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const measure = () => setWidth(header.getBoundingClientRect().width);
        measure();
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        observer?.observe(header);
        window.addEventListener('resize', measure);
        const closeOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!header.querySelector('.topbar-context')?.contains(target) &&
                !header.querySelector('.topbar-context-toggle')?.contains(target)) setIsContextOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsContextOpen(false);
        };
        document.addEventListener('mousedown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', measure);
            document.removeEventListener('mousedown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);
    const density = width < 640 ? 'compact' : width < 1100 ? 'medium' : width < 1520 ? 'wide' : 'full';
    return { headerRef, density, isContextOpen, setIsContextOpen };
}
