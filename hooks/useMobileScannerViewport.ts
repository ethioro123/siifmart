import { useState, useEffect, useCallback, useRef } from 'react';

export interface MobileScannerViewport {
    isMobile: boolean;
    isKeyboardOpen: boolean;
    keyboardHeight: number;
    viewportHeight: number;
    ensureVisible: (element?: HTMLElement | null) => void;
    onInputFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    keyboardOffsetStyle: React.CSSProperties;
}

export function safeScrollIntoView(
    element?: HTMLElement | EventTarget | null,
    options: ScrollIntoViewOptions = { block: 'nearest', behavior: 'smooth' }
) {
    if (!element || typeof window === 'undefined') return;
    try {
        const el = element as HTMLElement;
        if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView(options);
        }
    } catch {
        // Ignored in test/unsupported environments
    }
}

/**
 * Hook to guarantee scanner input fields and target locations remain
 * completely visible in mobile mode, never obscured by fixed bars or the
 * mobile virtual software keyboard.
 */
export function useMobileScannerViewport(): MobileScannerViewport {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window !== 'undefined' ? window.innerHeight : 800
    );
    const activeElementRef = useRef<HTMLElement | null>(null);

    // Track viewport resize & media query
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const handleMediaChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };
        mediaQuery.addEventListener('change', handleMediaChange);

        const handleViewportChange = () => {
            const vv = window.visualViewport;
            if (!vv) {
                setViewportHeight(window.innerHeight);
                return;
            }

            const currentVvHeight = Math.round(vv.height);
            const windowHeight = window.innerHeight;
            const diff = windowHeight - currentVvHeight;

            setViewportHeight(currentVvHeight);

            // A difference of > 120px on mobile almost always signals an active virtual keyboard
            if (diff > 120 && window.innerWidth < 768) {
                setIsKeyboardOpen(true);
                setKeyboardHeight(diff);
                // Ensure the focused scanner input and its location badge remain visible
                if (activeElementRef.current) {
                    safeScrollIntoView(activeElementRef.current, {
                        block: 'nearest',
                        inline: 'nearest',
                        behavior: 'smooth'
                    });
                }
            } else {
                setIsKeyboardOpen(false);
                setKeyboardHeight(0);
            }
        };

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', handleViewportChange);
            vv.addEventListener('scroll', handleViewportChange);
        } else {
            window.addEventListener('resize', handleViewportChange);
        }

        return () => {
            mediaQuery.removeEventListener('change', handleMediaChange);
            if (vv) {
                vv.removeEventListener('resize', handleViewportChange);
                vv.removeEventListener('scroll', handleViewportChange);
            } else {
                window.removeEventListener('resize', handleViewportChange);
            }
        };
    }, []);

    const ensureVisible = useCallback((element?: HTMLElement | null) => {
        if (!element || typeof window === 'undefined') return;
        activeElementRef.current = element;
        // Delay slightly for software keyboard animation
        setTimeout(() => {
            safeScrollIntoView(element, {
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth'
            });
        }, 150);
    }, []);

    const onInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        ensureVisible(e.target);
    }, [ensureVisible]);

    const keyboardOffsetStyle: React.CSSProperties = {
        paddingBottom: isKeyboardOpen && keyboardHeight > 0
            ? `max(env(safe-area-inset-bottom, 0px), ${keyboardHeight}px)`
            : 'max(env(safe-area-inset-bottom, 0px), 0.75rem)'
    };

    return {
        isMobile,
        isKeyboardOpen,
        keyboardHeight,
        viewportHeight,
        ensureVisible,
        onInputFocus,
        keyboardOffsetStyle
    };
}
