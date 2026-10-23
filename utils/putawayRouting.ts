import { normalizeLocation } from './locationTracking';

export interface RoutingStock {
    id: string; siteId: string; sku: string; category?: string; location?: string; stock: number;
    batchNumber?: string; expiryDate?: string; zoneId?: string; storageType?: string;
}
export interface RoutingZone {
    id: string; siteId: string; name: string; type: string; temperature?: string;
    capacity: number; occupied: number; isLocked: boolean; allowPutaway: boolean;
}
export interface RoutingMapping { siteId: string; category: string; defaultZone: string }
export interface PutawaySuggestion {
    location: string; type: 'SUGGESTED'; label: string; reason: string; existingUnits: number;
}
export interface RoutingInput {
    siteId: string; sku: string; category?: string; quantity: number; batchNumber?: string;
    expiryDate?: string; storageType?: string; suggestedLocation?: string; condition?: string;
}
const key = (v?: string) => (v || '').trim().toLowerCase();
const code = (v?: string) => normalizeLocation(v || '');
const zoneCode = (v: string) => v.trim().toUpperCase().match(/^(?:ZONE\s+)?([A-Z])(?:$|[\s-])/i)?.[1];
const storage = (v?: string) => /froz/i.test(v || '') ? 'frozen' : /chill|cold|refriger/i.test(v || '') ? 'chilled' : 'ambient';

/** Advisory routing only: no stock or capacity mutations; an encoded physical bin scan is still required. */
export function rankPutawayLocations(input: RoutingInput, stock: RoutingStock[], zones: RoutingZone[], mappings: RoutingMapping[], excluded: string[] = []): PutawaySuggestion[] {
    if (!input.siteId || !input.sku || !Number.isFinite(input.quantity) || input.quantity <= 0 || (input.condition && input.condition !== 'Good')) return [];
    const local = stock.filter(p => p.siteId === input.siteId && p.stock > 0 && code(p.location));
    const localZones = zones.filter(z => z.siteId === input.siteId);
    const grouped = new Map<string, RoutingStock[]>();
    local.forEach(p => { const loc = code(p.location)!; grouped.set(loc, [...(grouped.get(loc) || []), p]); });
    const blocked = new Set(excluded.map(v => code(v) || v));
    const required = storage(input.storageType || (/frozen|chilled|refrigerated/i.test(input.category || '') ? input.category : undefined));
    const zoneFor = (letter: string) => localZones.find(z => zoneCode(z.name) === letter || local.some(p => p.zoneId === z.id && code(p.location)?.startsWith(letter + '-')));
    const eligible = (loc: string, ignoreExcluded = false) => {
        if (!loc || /-00/.test(loc) || (!ignoreExcluded && blocked.has(loc))) return false;
        const zone = zoneFor(loc[0]);
        if (zone) {
            if (zone.isLocked || !zone.allowPutaway || ['Staging','Damaged','Secure'].includes(zone.type)) return false;
            const contents = local.filter(p => p.zoneId === zone.id || code(p.location)?.startsWith(loc[0] + '-'));
            const used = Math.max(zone.occupied, contents.reduce((sum, p) => sum + p.stock, 0));
            if (zone.capacity > 0 && used + input.quantity > zone.capacity) return false;
            const zoneStorage = storage(zone.temperature || (zone.type === 'Cold' ? 'Cold' : zone.type));
            return required === zoneStorage;
        }
        // Never infer cold-chain suitability from an unconfigured zone.
        return required === 'ambient' && localZones.length === 0;
    };
    const sameSku = (p: RoutingStock) => key(p.sku) === key(input.sku);
    const compatibleLot = (p: RoutingStock) => key(p.batchNumber) === key(input.batchNumber) && key(p.expiryDate?.slice(0, 10)) === key(input.expiryDate?.slice(0, 10));
    const categoryStock = local.filter(p => input.category && key(p.category) === key(input.category));
    const categoryAisles = new Map<string, number>();
    categoryStock.forEach(p => { const aisle = code(p.location)!.slice(0, 4); categoryAisles.set(aisle, (categoryAisles.get(aisle) || 0) + 1); });
    const mapped = mappings.find(m => m.siteId === input.siteId && key(m.category) === key(input.category));
    const preferredZone = mapped ? zoneCode(mapped.defaultZone) || zoneCode(localZones.find(z => z.id === mapped.defaultZone || key(z.name) === key(mapped.defaultZone))?.name || '') : undefined;
    const candidates = new Map<string, { score: number; suggestion: PutawaySuggestion }>();
    const add = (loc: string, proposed = false) => {
        if (!eligible(loc)) return;
        const occupants = grouped.get(loc) || [];
        if (occupants.some(p => !sameSku(p) || !compatibleLot(p))) return;
        const consolidation = occupants.length > 0;
        const aisleWeight = categoryAisles.get(loc.slice(0, 4)) || 0;
        const mappedZone = preferredZone === loc[0];
        const hinted = code(input.suggestedLocation) === loc;
        const score = (consolidation ? 10000 : 0) + (aisleWeight ? 2000 + Math.min(aisleWeight, 100) : 0) + (mappedZone ? 1000 : 0) + (hinted ? 100 : 0);
        const label = consolidation ? 'Consolidate same SKU and lot' : aisleWeight ? 'New bin near this category' : mappedZone ? 'Category storage zone' : 'Compatible storage area';
        const reason = consolidation ? 'Matching SKU, batch and expiry are already here.' : 'Keep this lot separate from other stock.';
        candidates.set(loc, { score, suggestion: { location: loc, type: 'SUGGESTED', label, existingUnits: occupants.reduce((s, p) => s + p.stock, 0), reason: `${reason} ${proposed ? 'Proposed bin: verify it exists and has room.' : 'Bin capacity is not configured: verify physical space.'}` } });
    };
    grouped.forEach((_, loc) => add(loc));
    if (code(input.suggestedLocation)) add(code(input.suggestedLocation)!, !grouped.has(code(input.suggestedLocation)!));
    const anchors = new Set<string>([...categoryAisles.keys(), ...local.filter(sameSku).map(p => code(p.location)!.slice(0, 4))]);
    if (preferredZone) anchors.add(`${preferredZone}-01`);
    localZones.forEach(z => { const letter = zoneCode(z.name); if (letter) anchors.add(`${letter}-01`); });
    if (anchors.size === 0 && localZones.length === 0 && required === 'ambient') anchors.add('A-01');
    anchors.forEach(anchor => {
        if (!eligible(`${anchor}-01`, true)) return;
        let added = 0;
        for (let aisle = Math.max(1, Number(anchor.slice(2))); aisle <= 99 && added < 3; aisle++) {
            for (let bay = 1; bay <= 99 && added < 3; bay++) {
                const loc = `${anchor[0]}-${String(aisle).padStart(2, '0')}-${String(bay).padStart(2, '0')}`;
                if (grouped.has(loc) || !eligible(loc)) continue;
                add(loc, true); added++;
            }
        }
    });
    return [...candidates.values()].sort((a, b) => b.score - a.score || a.suggestion.location.localeCompare(b.suggestion.location)).slice(0, 5).map(c => c.suggestion);
}
