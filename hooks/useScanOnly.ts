import { useRef, useCallback } from 'react';
import { playBeep } from '../utils/audioUtils';
import { useStore } from '../contexts/CentralStore';

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
 * 
 * Bypass: CEO (super_admin) and WMS Manager (warehouse_manager) are allowed manual entry.
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
    const { user } = useStore();
    const threshold = options?.thresholdMs ?? 150;
    const lastKeyTime = useRef<number>(0);
    const charCount = useRef<number>(0);
    const firstKeyTime = useRef<number>(0);

    const isBypassed = [
        'super_admin',
        'ceo',
        'warehouse_manager',
        'wms_manager',
        'wms manager'
    ].includes(user?.role?.toLowerCase() || '');

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // If bypassed (CEO or WMS Manager), do not restrict keyboard entry
        if (isBypassed) return;

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

        // If there's been a long gap since the last key, treat this as a NEW scan sequence
        // (e.g., after a success overlay or item transition). Reset and allow through.
        if (now - lastKeyTime.current > threshold * 2) {
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
    }, [setInputVal, threshold, options?.onReject, isBypassed]);

    const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        // If bypassed, allow paste
        if (isBypassed) return;

        e.preventDefault();
        playBeep('error');
        options?.onReject?.('PASTING NOT ALLOWED — PLEASE SCAN');
    }, [options?.onReject, isBypassed]);

    // Reset all internal state — call this when transitioning between scan targets
    const reset = useCallback(() => {
        charCount.current = 0;
        firstKeyTime.current = 0;
        lastKeyTime.current = 0;
    }, []);

    return { onKeyDown, onPaste, reset };
}
