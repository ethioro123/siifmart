import type { SystemConfig } from '../types';

export type PoPriceApplyAt = 'receive' | 'putaway';
export type PriceTagAt = 'receive' | 'putaway' | 'store';

export interface ReceivingPolicy {
    blind: boolean;
    overReceiveTolerancePct: number;
    poPriceApplyAt: PoPriceApplyAt;
    printPriceTagAt: PriceTagAt;
}

export interface FulfillmentScanningPolicy {
    requirePickQuantityEntry: boolean;
    requirePutawayQuantityEntry: boolean;
}

/**
 * Resolve the receiving policy for ONE country. Reads the country partition first
 * (`countryConfigs[country]`) and only falls back to top-level settings when the
 * settings object itself belongs to that country — never across borders.
 */
export const resolveReceivingPolicy = (
    settings: Partial<SystemConfig> | null | undefined,
    country?: string
): ReceivingPolicy => {
    const code = country || settings?.country || 'ET';
    const part = (settings?.countryConfigs as Record<string, Partial<SystemConfig>> | undefined)?.[code];
    const isActive = !settings?.country || settings.country === code;
    const pick = <K extends keyof SystemConfig>(key: K): SystemConfig[K] | undefined =>
        part?.[key] ?? (isActive ? settings?.[key] : undefined);

    const logic = pick('receivingLogic');
    const tol = Number(pick('overReceiveTolerancePct'));
    return {
        // Old/global configs may still contain the removed `standard` value.
        // Treat unknown values as blind so a stale setting cannot expose PO quantities.
        blind: logic !== 'verified',
        overReceiveTolerancePct: Number.isFinite(tol) ? Math.min(100, Math.max(0, tol)) : 0,
        poPriceApplyAt: pick('poPriceApplyAt') === 'receive' ? 'receive' : 'putaway',
        printPriceTagAt: (pick('printPriceTagAt') as PriceTagAt | undefined) || 'store',
    };
};

/**
 * Resolve the fulfillment scanning policy for ONE country.
 * Controls whether workers must explicitly enter physical counts during pick & putaway,
 * or whether single-scan auto-credits full quantity.
 * Zero-Trust default: true (explicit quantity entry required).
 */
export const resolveFulfillmentScanningPolicy = (
    settings: Partial<SystemConfig> | null | undefined,
    country?: string
): FulfillmentScanningPolicy => {
    const code = country || settings?.country || 'ET';
    const part = (settings?.countryConfigs as Record<string, Partial<SystemConfig>> | undefined)?.[code];
    const isActive = !settings?.country || settings.country === code;
    const pick = <K extends keyof SystemConfig>(key: K): SystemConfig[K] | undefined =>
        part?.[key] ?? (isActive ? settings?.[key] : undefined);

    return {
        requirePickQuantityEntry: pick('requirePickQuantityEntry') ?? true,
        requirePutawayQuantityEntry: pick('requirePutawayQuantityEntry') ?? true,
    };
};

/** Max units that may be received for a line, including the country tolerance. */
export const maxReceivable = (expected: number, tolerancePct: number): number =>
    Math.floor(expected * (1 + Math.max(0, tolerancePct) / 100));

/**
 * Over-receive alert text. Blind mode NEVER discloses expected/received numbers
 * (zero-trust blind receiving); verified mode may show them.
 */
export const buildOverReceiveMessage = (
    blind: boolean,
    d: { received: number; expected: number; attempted: number; allowed: number }
): string => {
    if (blind) {
        return 'Quantity does not match this order. Recount the goods and report the variance to your supervisor.';
    }
    const remaining = Math.max(0, d.allowed - d.received);
    return remaining <= 0
        ? `Item already fully received (${d.received}/${d.expected} units). Cannot add more.`
        : `Cannot receive ${d.attempted} units. Only ${remaining} units remaining.`;
};

export interface CountAndPackPolicy {
    maxCycleCountRecounts: number;
    requireSecondCounterOnVariance: boolean;
    requirePackSecuritySeal: boolean;
    requirePackCartonWeight: boolean;
    packWeightTolerancePct: number;
}

/**
 * Resolve Zero-Trust Cycle Count Hardening & Pack Security Policy for ONE country.
 * Partitioned per country with Zero-Trust default fallbacks.
 */
export const resolveCountAndPackPolicy = (
    settings: Partial<SystemConfig> | null | undefined,
    country?: string
): CountAndPackPolicy => {
    const code = country || settings?.country || 'ET';
    const part = (settings?.countryConfigs as Record<string, Partial<SystemConfig>> | undefined)?.[code];
    const isActive = !settings?.country || settings.country === code;
    const pick = <K extends keyof SystemConfig>(key: K): SystemConfig[K] | undefined =>
        part?.[key] ?? (isActive ? settings?.[key] : undefined);

    const maxRecounts = Number(pick('maxCycleCountRecounts'));
    const weightTol = Number(pick('packWeightTolerancePct'));

    return {
        maxCycleCountRecounts: Number.isFinite(maxRecounts) ? Math.max(0, maxRecounts) : 1,
        requireSecondCounterOnVariance: pick('requireSecondCounterOnVariance') ?? true,
        requirePackSecuritySeal: pick('requirePackSecuritySeal') ?? true,
        requirePackCartonWeight: pick('requirePackCartonWeight') ?? false,
        packWeightTolerancePct: Number.isFinite(weightTol) ? Math.max(0, weightTol) : 5,
    };
};
