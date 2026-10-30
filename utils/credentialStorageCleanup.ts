/** Delete legacy credential copies without reading or exposing their values. */
export function purgeLegacyEmployeeCredentials(storage?: Storage): void {
    try {
        const target = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
        if (!target) return;
        const keys = Array.from({ length: target.length }, (_, index) => target.key(index));
        for (const key of keys) {
            if (key?.startsWith('siifmart_temp_pwd_') || key?.startsWith('siifmart_credentials_handed_over_')) target.removeItem(key);
        }
    } catch {
        // Storage may be disabled; this flow never falls back to reading cached credentials.
    }
}
