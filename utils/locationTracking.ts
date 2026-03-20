/**
 * Enhanced Location Tracking System
 * Provides strict inventory location tracking across sites and within facilities
 */

import { Product, Site } from '../types';

/**
 * Location format: ZONE-AISLE-BAY
 * Example: A-01-05
 * - Zone: A-Z (alphabetic zones)
 * - Aisle: 01-99 (numeric aisles within zone)
 * - Bay: 01-99 (specific bay/shelf position)
 */

export interface ParsedLocation {
    zone: string;
    aisle: string;
    bay: string;
    formatted: string;
    isValid: boolean;
}

export interface FullLocationInfo {
    // Site Information
    siteId: string;
    siteName: string;
    siteType: string;
    siteCode: string;

    // Physical Location within Site
    location: ParsedLocation;

    // Full Address
    fullPath: string; // e.g., "Aratanya Market (Store) > Zone A > Aisle 01 > Bay 05"
    shortPath: string; // e.g., "Aratanya > A-01-05"
}

/**
 * Parse a location string into components
 */
export const parseLocation = (location: string | undefined): ParsedLocation => {
    const cleanLoc = location?.trim() || '';
    if (!cleanLoc) {
        return {
            zone: '',
            aisle: '',
            bay: '',
            formatted: '',
            isValid: false
        };
    }

    // Attempt to normalize first (handles A0101, A 01 01, etc.)
    const normalized = normalizeLocation(cleanLoc);

    // If normalization succeeded, we have a guaranteed ZONE-AISLE-BAY format
    if (normalized) {
        const parts = normalized.split('-');
        return {
            zone: parts[0],
            aisle: parts[1],
            bay: parts[2],
            formatted: `Zone ${parts[0]} - Aisle ${parts[1]} - Bay ${parts[2]}`,
            isValid: true
        };
    }

    // Fallback: Try to parse verbose descriptions if normalization failed
    // e.g. "Zone A - Aisle 01..." that somehow didn't normalize (unlikely if valid)
    const zoneMatch = cleanLoc.match(/Zone\s+([A-Z])/i);
    const aisleMatch = cleanLoc.match(/Aisle\s+(\d{1,2})/i);
    const bayMatch = cleanLoc.match(/(?:Bay|Bin|Shelf)\s+(\d{1,2})/i);

    if (zoneMatch && aisleMatch && bayMatch) {
        return {
            zone: zoneMatch[1].toUpperCase(),
            aisle: aisleMatch[1].padStart(2, '0'),
            bay: bayMatch[1].padStart(2, '0'),
            formatted: cleanLoc, // Keep original if it was verbose
            isValid: true
        };
    }

    return {
        zone: '',
        aisle: '',
        bay: '',
        formatted: cleanLoc,
        isValid: false
    };
};

/**
 * Get full location information for a product
 */
export const getFullLocationInfo = (
    product: Product,
    sites: Site[]
): FullLocationInfo | null => {
    const site = sites.find(s => s.id === product.siteId);

    if (!site) {
        return null;
    }

    const location = parseLocation(product.location);

    const fullPath = location.isValid
        ? `${site.name} (${site.type}) > Zone ${location.zone} > Aisle ${location.aisle} > Bay ${location.bay}`
        : `${site.name} (${site.type}) > ${product.location || 'No Location'}`;

    const shortPath = location.isValid
        ? `${site.name} > ${location.formatted}`
        : `${site.name} > ${product.location || 'Unassigned'}`;

    return {
        siteId: site.id,
        siteName: site.name,
        siteType: site.type,
        siteCode: site.code,
        location,
        fullPath,
        shortPath
    };
};

/**
 * Validate location format
 */
export const isValidLocationFormat = (location: string): boolean => {
    return /^[A-Z]-\\d{2}-\\d{2}$/.test(location);
};

/**
 * Generate next available location in a zone
 */
export const suggestNextLocation = (
    existingLocations: string[],
    zone: string = 'A',
    startAisle: number = 1
): string => {
    const locationsInZone = existingLocations
        .filter(loc => loc.startsWith(`${zone}-`))
        .map(loc => parseLocation(loc))
        .filter(loc => loc.isValid);

    if (locationsInZone.length === 0) {
        return `${zone}-${startAisle.toString().padStart(2, '0')}-01`;
    }

    // Find the highest bay number in the last aisle
    const sortedLocations = locationsInZone.sort((a, b) => {
        if (a.aisle !== b.aisle) {
            return parseInt(a.aisle) - parseInt(b.aisle);
        }
        return parseInt(a.bay) - parseInt(b.bay);
    });

    const lastLocation = sortedLocations[sortedLocations.length - 1];
    const nextBay = parseInt(lastLocation.bay) + 1;

    if (nextBay <= 99) {
        return `${zone}-${lastLocation.aisle}-${nextBay.toString().padStart(2, '0')}`;
    } else {
        // Move to next aisle
        const nextAisle = parseInt(lastLocation.aisle) + 1;
        if (nextAisle <= 99) {
            return `${zone}-${nextAisle.toString().padStart(2, '0')}-01`;
        } else {
            // Move to next zone
            const nextZone = String.fromCharCode(zone.charCodeAt(0) + 1);
            return `${nextZone}-01-01`;
        }
    }
};

/**
 * Get zone color for UI display
 */
export const getZoneColor = (zone: string): string => {
    const zoneColors: Record<string, string> = {
        'A': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        'B': 'bg-green-500/20 text-green-400 border-green-500/50',
        'C': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        'D': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
        'E': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
        'F': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
        'G': 'bg-red-500/20 text-red-400 border-red-500/50',
        'H': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
    };

    return zoneColors[zone] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
};

/**
 * Find products by location
 */
export const findProductsByLocation = (
    products: Product[],
    siteId?: string,
    zone?: string,
    aisle?: string,
    bay?: string
): Product[] => {
    return products.filter(product => {
        // Filter by site
        if (siteId && product.siteId !== siteId) {
            return false;
        }

        // Filter by location components
        if (!product.location) {
            return false;
        }

        const location = parseLocation(product.location);
        if (!location.isValid) {
            return false;
        }

        if (zone && location.zone !== zone) {
            return false;
        }

        if (aisle && location.aisle !== aisle) {
            return false;
        }

        if (bay && location.bay !== bay) {
            return false;
        }

        return true;
    });
};

/**
 * Get location statistics for a site
 */
export interface LocationStats {
    totalProducts: number;
    productsWithLocation: number;
    productsWithoutLocation: number;
    zoneDistribution: Record<string, number>;
    utilizationRate: number;
}

export const getLocationStats = (products: Product[], siteId: string): LocationStats => {
    const siteProducts = products.filter(p => p.siteId === siteId);
    const productsWithLocation = siteProducts.filter(p => p.location && isValidLocationFormat(p.location));
    const productsWithoutLocation = siteProducts.filter(p => !p.location || !isValidLocationFormat(p.location));

    const zoneDistribution: Record<string, number> = {};
    productsWithLocation.forEach(product => {
        const location = parseLocation(product.location);
        if (location.isValid) {
            zoneDistribution[location.zone] = (zoneDistribution[location.zone] || 0) + 1;
        }
    });

    return {
        totalProducts: siteProducts.length,
        productsWithLocation: productsWithLocation.length,
        productsWithoutLocation: productsWithoutLocation.length,
        zoneDistribution,
        utilizationRate: siteProducts.length > 0
            ? (productsWithLocation.length / siteProducts.length) * 100
            : 0
    };
};

/**
 * Format location for display
 */
export const formatLocationDisplay = (
    location: string | undefined,
    includeEmoji: boolean = true
): string => {
    if (!location) {
        return includeEmoji ? '❓ Unassigned' : 'Unassigned';
    }

    const parsed = parseLocation(location);
    if (!parsed.isValid) {
        return includeEmoji ? `📍 ${location}` : location;
    }

    return includeEmoji
        ? `📍 Zone ${parsed.zone} • Aisle ${parsed.aisle} • Bay ${parsed.bay}`
        : `Zone ${parsed.zone} • Aisle ${parsed.aisle} • Bay ${parsed.bay}`;
};

/**
 * Normalize a location string into standard format: ZONE-AISLE-BAY
 * STRICT FORMAT: A-02-03
 */
export const normalizeLocation = (input: string): string | null => {
    if (!input) return null;

    // Remove "Zone", "Aisle", "Bay", "Bin", "Shelf" case-insensitively, then clean up
    let cleaned = input.replace(/zone|aisle|bay|bin|shelf/gi, '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Expecting roughly: Zone (1 char) + Aisle (1-2 chars) + Bay (1-2 chars)
    // Minimum length 3 (A11), Max length 5 (A9999)
    if (cleaned.length < 3 || cleaned.length > 5) return null;

    // Extract the alphabetic zone (expecting exactly one letter A-Z)
    const zoneLetterMatch = cleaned.match(/[A-Z]/);
    if (!zoneLetterMatch) return null;
    const zone = zoneLetterMatch[0];
    const digits = cleaned.replace(zone, '');

    let aisle = 0;
    let bay = 0;

    if (digits.length === 4) {
        // e.g. 0101 (from A0101 or 01A01)
        aisle = parseInt(digits.substring(0, 2), 10);
        bay = parseInt(digits.substring(2, 4), 10);
    } else if (digits.length === 2) {
        // e.g. 11 (from A11 or 1A1)
        aisle = parseInt(digits.substring(0, 1), 10);
        bay = parseInt(digits.substring(1, 2), 10);
    } else if (digits.length === 3) {
        // e.g. 101 or 011
        // Ambiguous. Let's look at relative position if possible, but simpler is to try to parse parts.
        const parts = input.trim().toUpperCase().split(/[^A-Z0-9]+/);
        if (parts.length === 3) {
            aisle = parseInt(parts[1], 10);
            bay = parseInt(parts[2], 10);
        } else {
            return null;
        }
    } else {
        return null;
    }

    // Direct regex fallback for messy inputs that preserved structure
    if (aisle === 0 && bay === 0) {
        // Try lenient regex: Letter, separator?, digits, separator?, digits
        const lenientMatch = input.trim().toUpperCase().match(/^([A-Z])\s*[-.]?\s*(\d{1,2})\s*[-.]?\s*(\d{1,2})$/);
        if (lenientMatch) {
            const z = lenientMatch[1];
            aisle = parseInt(lenientMatch[2], 10);
            bay = parseInt(lenientMatch[3], 10);
            // Verify zone matches
            if (z !== zone) return null;
        } else {
            return null;
        }
    }

    // Range validation
    if (aisle < 1 || aisle > 99 || bay < 1 || bay > 99) return null;

    return `${zone}-${aisle.toString().padStart(2, '0')}-${bay.toString().padStart(2, '0')}`;
};
