import { useRef, useCallback } from 'react';
import { playBeep } from '../utils/audioUtils';

/**
 * useScanOnly — Enforces strict scan-only input on fulfillment barcode fields.
 * 
 * Barcode scanners emulate keyboard input at ~10-40ms per character.
 * Manual typing averages ~150-300ms per character.
 * 
 * This hook provides onKeyDown and onPaste handlers that:
 * 1. Track keystroke timing to detect manual typing (rejecting anything slower than 75ms)
 * 2. Instantly clear the input and play error beep if manual typing is detected
 * 3. Block all paste operations
 * 4. Play error audio beep on rejection
 */
export function useScanOnly(
    setInputVal: (val: string) => void,
    options?: {
        /** Max ms between keystrokes before treating as manual typing. Default: 75ms */
        thresholdMs?: number;
        /** Callback when manual input is rejected */
        onReject?: (reason: string) => void;
    }
) {
    const threshold = options?.thresholdMs ?? 75;
    const lastKeyTime = useRef<number>(0);
    const charCount = useRef<number>(0);
    const firstKeyTime = useRef<number>(0);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();

        // Always allow Enter (hardware scanners terminate with Enter key)
        if (e.key === 'Enter') {
            charCount.current = 0;
            firstKeyTime.current = 0;
            lastKeyTime.current = 0;
            return;
        }

        // Allow Tab / Escape / non-character modifier keys
        if (e.key.length !== 1) return;

        if (charCount.current === 0) {
            // First character — start tracking stream
            firstKeyTime.current = now;
            charCount.current = 1;
            lastKeyTime.current = now;
            return;
        }

        // If there's been a long pause (>300ms), treat as new sequence
        if (now - lastKeyTime.current > 300) {
            firstKeyTime.current = now;
            charCount.current = 1;
            lastKeyTime.current = now;
            return;
        }

        charCount.current++;
        const timeSinceLast = now - lastKeyTime.current;
        lastKeyTime.current = now;

        // Any human-paced keystroke interval (> threshold) is blocked immediately
        if (timeSinceLast > threshold) {
            e.preventDefault();
            setInputVal('');
            charCount.current = 0;
            firstKeyTime.current = 0;
            playBeep('error');
            options?.onReject?.('SCAN ONLY — MANUAL TYPING NOT ACCEPTED');
        }
    }, [setInputVal, threshold, options?.onReject]);

    const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        playBeep('error');
        options?.onReject?.('SCAN ONLY — PASTING NOT ALLOWED');
    }, [options?.onReject]);

    // Reset all internal state — call this when transitioning between scan targets
    const reset = useCallback(() => {
        charCount.current = 0;
        firstKeyTime.current = 0;
        lastKeyTime.current = 0;
    }, []);

    return { onKeyDown, onPaste, reset };
}

