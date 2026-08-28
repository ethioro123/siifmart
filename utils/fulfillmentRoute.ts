// --- Warehouse Serpentine Wave Picking Route Optimizer ---

export interface WarehouseLocationCoords {
    aisle: number;
    section: number;
    level: number;
    bin: number;
    raw: string;
}

/**
 * Parses a warehouse location string into 3D bay coordinates.
 * Supports formats like:
 * - "A01-S02-L03-B04"
 * - "A-01-02-03"
 * - "01-02-03-04"
 * - "A1.B2.C3"
 */
export function parseLocationCoordinates(locationStr?: string | null): WarehouseLocationCoords {
    if (!locationStr || typeof locationStr !== 'string') {
        return { aisle: 999, section: 999, level: 999, bin: 999, raw: '' };
    }

    const raw = locationStr.trim().toUpperCase();
    const numbers = raw.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];

    return {
        aisle: numbers[0] !== undefined ? numbers[0] : 999,
        section: numbers[1] !== undefined ? numbers[1] : 999,
        level: numbers[2] !== undefined ? numbers[2] : 1,
        bin: numbers[3] !== undefined ? numbers[3] : 1,
        raw
    };
}

/**
 * Sorts warehouse pick items along a continuous serpentine walking path.
 * Even aisles ascend sections (1 -> 10), odd aisles descend sections (10 -> 1)
 * to prevent backtracking through warehouse racks.
 */
export function sortPickItemsByOptimalRoute<T>(
    items: T[],
    getLocationStr: (item: T) => string | undefined | null
): T[] {
    return [...items].sort((a, b) => {
        const locA = parseLocationCoordinates(getLocationStr(a));
        const locB = parseLocationCoordinates(getLocationStr(b));

        // 1. Primary: Sort by Aisle
        if (locA.aisle !== locB.aisle) {
            return locA.aisle - locB.aisle;
        }

        // 2. Secondary: Serpentine Section Sort
        // For even aisles: ascend (01 -> 09). For odd aisles: descend (09 -> 01)
        const isEvenAisle = locA.aisle % 2 === 0;
        if (locA.section !== locB.section) {
            return isEvenAisle
                ? locA.section - locB.section
                : locB.section - locA.section;
        }

        // 3. Tertiary: Sort by Vertical Level (bottom shelf to top shelf)
        if (locA.level !== locB.level) {
            return locA.level - locB.level;
        }

        // 4. Quaternary: Sort by Bin index
        return locA.bin - locB.bin;
    });
}
