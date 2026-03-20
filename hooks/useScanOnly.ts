import { useRef, useCallback } from 'react';
import { playBeep } from '../utils/audioUtils';

/**
 * useScanOnly — Enforces scan-only input on fulfillment barcode fields.
 * 
 * Barcode scanners emulate keyboard input at ~20-50ms per character.
 * Manual typing averages ~150-300ms per character.
 * 
 * This hook provides onKeyDown and onPaste handlers that:
 * 1. Track keystroke timing to detect manual typing
 * 2. Clear the input if typing speed is too slow (manual)
 * 3. Block paste operations
 * 4. Play error beep on rejection
 */
export function useScanOnly(
    setInputVal: (val: string) => void,
    options?: {
        /** Max ms between keystrokes before treating as manual typing. Default: 80 */
        thresholdMs?: number;
        /** Callback when manual input is rejected */
        onReject?: (reason: string) => void;
    }
) {
    const threshold = options?.thresholdMs ?? 80;
    const lastKeyTime = useRef<number>(0);
    const charCount = useRef<number>(0);
    const firstKeyTime = useRef<number>(0);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();

        // Always allow Enter (scanner sends Enter to submit)
        if (e.key === 'Enter') {
            // Reset tracking
            charCount.current = 0;
            firstKeyTime.current = 0;
            lastKeyTime.current = 0;
            return;
        }

        // Ignore modifier keys, arrows, etc.
        if (e.key.length !== 1) return;

        if (charCount.current === 0) {
            // First character — start tracking
            firstKeyTime.current = now;
            charCount.current = 1;
            lastKeyTime.current = now;
            return;
        }

        charCount.current++;
        const timeSinceLast = now - lastKeyTime.current;
        lastKeyTime.current = now;

        // After 3+ characters, if gap between keystrokes is too large → manual typing
        if (charCount.current >= 3 && timeSinceLast > threshold) {
            e.preventDefault();
            setInputVal('');
            charCount.current = 0;
            firstKeyTime.current = 0;
            playBeep('error');
            options?.onReject?.('SCAN ONLY — NO MANUAL TYPING');
        }
    }, [setInputVal, threshold, options?.onReject]);

    const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        playBeep('error');
        options?.onReject?.('PASTING NOT ALLOWED — PLEASE SCAN');
    }, [options?.onReject]);

    return { onKeyDown, onPaste };
}
