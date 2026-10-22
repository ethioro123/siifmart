import React from 'react';
import { getPODeliveryRequirements, validatePODelivery, type DeliveryRequirementItem, type DeliveryTemperature } from '../../utils/poDeliveryRequirements';
interface Props {
    items: readonly DeliveryRequirementItem[];
    temperature: DeliveryTemperature;
    shelfLife: string;
    onApplyTemperature: (temperature: DeliveryTemperature) => void;
}
export function PODeliveryRequirementsSummary({ items, temperature, shelfLife, onApplyTemperature }: Props) {
    if (!items.length) return null;
    const requirements = getPODeliveryRequirements(items);
    const error = validatePODelivery(items, temperature, shelfLife);
    return <section aria-label="Delivery requirement check" className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-[var(--theme-text-primary)]">Item delivery requirements</h3>
        <p className="text-[var(--theme-text-secondary)]">{requirements.temperatures.length ? `Temperature groups: ${requirements.temperatures.join(', ')}.` : 'No standard temperature is specified in the item attributes.'} {requirements.shortestShelfLife !== null && `Shortest total product shelf life: ${requirements.shortestShelfLife} days.`}</p>
        {error && <p role="status" className="text-[var(--theme-text-primary)]">{error}</p>}
        {requirements.temperatures.length === 1 && requirements.temperatures[0] !== temperature && <button type="button" onClick={() => onApplyTemperature(requirements.temperatures[0])} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-3 font-medium text-[var(--theme-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] cursor-pointer">Use {requirements.temperatures[0]} delivery</button>}
    </section>;
}
