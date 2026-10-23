export type DeliveryTemperature = 'Ambient' | 'Chilled' | 'Frozen';
export interface DeliveryRequirementItem {
    productName?: string;
    customAttributes?: { storage?: { type?: string; isPerishable?: boolean; shelfLifeDays?: string | number; requirementsConfirmed?: boolean } };
}
export function parseShelfLifeDays(value: string | number | null | undefined): number | null {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const match = String(value).trim().match(/^(\d+)(?:\s*days?)?$/i);
    const days = match ? Number(match[1]) : NaN;
    return Number.isSafeInteger(days) && days > 0 ? days : null;
}
export function getStorageTemperature(value?: string): DeliveryTemperature | null {
    const normalized = value?.trim().toLowerCase() || '';
    if (normalized.startsWith('chilled') || normalized.startsWith('refrigerated')) return 'Chilled';
    if (normalized.startsWith('frozen')) return 'Frozen';
    if (normalized.startsWith('ambient')) return 'Ambient';
    return null;
}
export function getPODeliveryRequirements(items: readonly DeliveryRequirementItem[]) {
    const temperatures = [...new Set(items.map(item => getStorageTemperature(item.customAttributes?.storage?.type)).filter((value): value is DeliveryTemperature => value !== null))];
    const perishables = items.filter(item => item.customAttributes?.storage?.isPerishable);
    const shelfLives = perishables.map(item => parseShelfLifeDays(item.customAttributes?.storage?.shelfLifeDays)).filter((value): value is number => value !== null);
    return { temperatures, hasPerishables: perishables.length > 0, shortestShelfLife: shelfLives.length ? Math.min(...shelfLives) : null };
}
export function getPODeliveryIssue(items: readonly DeliveryRequirementItem[], temperature?: string, shelfLife?: string | number): { message: string; selector: string } | null {
    const requirements = getPODeliveryRequirements(items);
    if (requirements.temperatures.length > 1) return { message: 'Items require different delivery temperatures. Create separate purchase orders for each temperature group.', selector: '#po-temperature' };
    if (requirements.temperatures.length === 1 && requirements.temperatures[0] !== temperature) return { message: `Set required delivery temperature to ${requirements.temperatures[0]} to match the items.`, selector: '#po-temperature' };
    const days = parseShelfLifeDays(shelfLife);
    if (String(shelfLife ?? '').trim() && days === null) return { message: 'Minimum remaining shelf life must be a positive whole number of days.', selector: '#po-shelf-life' };
    if (requirements.hasPerishables && days === null) return { message: 'Enter minimum remaining shelf life at delivery for perishable items.', selector: '#po-shelf-life' };
    if (days !== null && requirements.shortestShelfLife !== null && days > requirements.shortestShelfLife) return { message: `Minimum remaining shelf life cannot exceed the shortest total product shelf life (${requirements.shortestShelfLife} days).`, selector: '#po-shelf-life' };
    return null;
}
export function validatePODelivery(items: readonly DeliveryRequirementItem[], temperature?: string, shelfLife?: string | number): string | null {
    return getPODeliveryIssue(items, temperature, shelfLife)?.message ?? null;
}
