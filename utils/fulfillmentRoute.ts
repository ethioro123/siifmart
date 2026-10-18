import { parseLocation } from './locationTracking';

// --- Warehouse Serpentine Wave Picking Route Optimizer ---

export interface WarehouseLocationCoords {
    zone: string;
    aisle: number;
    section: number;
    level: number;
    bin: number;
    raw: string;
}

/**
 * Parses a warehouse location string into 3D bay coordinates with zone awareness.
 * Supports formats like:
 * - "A-01-05" (Zone A, Aisle 1, Bay 5 - standard SIIFMART format)
 * - "Zone A - Aisle 01 - Bay 05"
 * - "A01-S02-L03-B04" (Segmented Aisle/Section/Level/Bin)
 * - "01-02-03-04"
 * - "A1.B2.C3"
 */
export function parseLocationCoordinates(locationStr?: string | null): WarehouseLocationCoords {
    if (!locationStr || typeof locationStr !== 'string') {
        return { zone: 'ZZZ', aisle: 999, section: 999, level: 999, bin: 999, raw: '' };
    }

    const raw = locationStr.trim().toUpperCase();
    if (!raw || raw === 'PENDING' || raw === 'ON ORDER' || raw === 'NO LOCATION') {
        return { zone: 'ZZZ', aisle: 999, section: 999, level: 999, bin: 999, raw };
    }

    // 1. Try canonical SIIFMART location parsing (Zone-Aisle-Bay)
    const parsed = parseLocation(raw);
    if (parsed.isValid && parsed.zone && parsed.aisle && parsed.bay) {
        const numbers = raw.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
        return {
            zone: parsed.zone,
            aisle: parseInt(parsed.aisle, 10),
            section: parseInt(parsed.bay, 10),
            level: numbers[2] !== undefined ? numbers[2] : 1,
            bin: numbers[3] !== undefined ? numbers[3] : 1,
            raw
        };
    }

    // 2. Fallback: Parse explicit Aisle / Section / Level / Bin codes (e.g. A02-S05-L03-B01)
    const aisleMatch = raw.match(/(?:^|[^A-Z])A(?:ISLE)?(\d+)/i) || raw.match(/AISLE\s*(\d+)/i);
    const sectionMatch = raw.match(/(?:^|[^A-Z])S(?:ECTION)?(\d+)/i) || raw.match(/BAY\s*(\d+)/i);
    const levelMatch = raw.match(/(?:^|[^A-Z])L(?:EVEL)?(\d+)/i) || raw.match(/LEVEL\s*(\d+)/i);
    const binMatch = raw.match(/(?:^|[^A-Z])B(?:IN)?(\d+)/i) || raw.match(/BIN\s*(\d+)/i);
    const zoneMatch = raw.match(/(?:^|[^A-Z])Z(?:ONE)?\s*([A-Z0-9]+)/i);

    if (aisleMatch || sectionMatch) {
        return {
            zone: zoneMatch ? zoneMatch[1].toUpperCase() : '',
            aisle: aisleMatch ? parseInt(aisleMatch[1], 10) : 999,
            section: sectionMatch ? parseInt(sectionMatch[1], 10) : 999,
            level: levelMatch ? parseInt(levelMatch[1], 10) : 1,
            bin: binMatch ? parseInt(binMatch[1], 10) : 1,
            raw
        };
    }

    // 3. Fallback: Parse generic numeric sequence (e.g. 01-02-03-04)
    const numbers = raw.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    return {
        zone: '',
        aisle: numbers[0] !== undefined ? numbers[0] : 999,
        section: numbers[1] !== undefined ? numbers[1] : 999,
        level: numbers[2] !== undefined ? numbers[2] : 1,
        bin: numbers[3] !== undefined ? numbers[3] : 1,
        raw
    };
}

/**
 * Sorts warehouse pick items along a continuous serpentine walking path.
 * 1. Completes each warehouse Zone sequentially (avoids cross-zone jumping).
 * 2. In each zone, visits aisles in ascending order.
 * 3. Inside each aisle, navigates in a serpentine S-curve:
 *    Even aisles ascend sections (1 -> 10), odd aisles descend sections (10 -> 1)
 *    to prevent backtracking through warehouse racks.
 * 4. At the same bay, picks bottom shelves before top shelves.
 * 5. If weight getter is provided, heavier items are picked first at the same shelf/bay.
 */
export function sortPickItemsByOptimalRoute<T>(
    items: T[],
    getLocationStr: (item: T) => string | undefined | null,
    getItemWeight?: (item: T) => number | undefined | null
): T[] {
    return [...items].sort((a, b) => {
        const locA = parseLocationCoordinates(getLocationStr(a));
        const locB = parseLocationCoordinates(getLocationStr(b));

        // 1. Primary: Sort by Zone (keep staff in the same physical / thermal room)
        const zoneA = locA.zone || 'ZZZ';
        const zoneB = locB.zone || 'ZZZ';
        if (zoneA !== zoneB) {
            return zoneA.localeCompare(zoneB);
        }

        // 2. Secondary: Sort by Aisle
        if (locA.aisle !== locB.aisle) {
            return locA.aisle - locB.aisle;
        }

        // 3. Tertiary: Serpentine Section Sort
        // For even aisles: ascend (01 -> 10). For odd aisles: descend (10 -> 01)
        const isEvenAisle = locA.aisle % 2 === 0;
        if (locA.section !== locB.section) {
            return isEvenAisle
                ? locA.section - locB.section
                : locB.section - locA.section;
        }

        // 4. Quaternary: Sort by Vertical Level (bottom shelf to top shelf)
        if (locA.level !== locB.level) {
            return locA.level - locB.level;
        }

        // 5. Quinary: Sort by Bin index
        if (locA.bin !== locB.bin) {
            return locA.bin - locB.bin;
        }

        // 6. Optional: Heavy-to-Light Sequencing for cart foundation
        if (getItemWeight) {
            const weightA = getItemWeight(a) ?? 0;
            const weightB = getItemWeight(b) ?? 0;
            if (weightA !== weightB) {
                return weightB - weightA;
            }
        }

        return 0;
    });
}
