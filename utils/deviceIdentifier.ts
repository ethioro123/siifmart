/**
 * Device Identifier Utility (Rule 5 Audit Trail Compliance)
 * Generates and persists a stable client terminal device identifier.
 */

const STORAGE_KEY = 'siifmart_device_id';

export function getDeviceId(): string {
    if (typeof window === 'undefined') {
        return 'DEV-SERVER-NODE';
    }

    try {
        let deviceId = localStorage.getItem(STORAGE_KEY);
        if (!deviceId) {
            const platformPrefix = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
                ? 'MAC'
                : typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent)
                ? 'WIN'
                : 'TERM';
            
            const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID().slice(0, 8).toUpperCase()
                : Math.random().toString(36).substring(2, 10).toUpperCase();

            deviceId = `DEV-${platformPrefix}-${randomSuffix}`;
            localStorage.setItem(STORAGE_KEY, deviceId);
        }
        return deviceId;
    } catch {
        return 'DEV-LOCAL-FALLBACK';
    }
}
