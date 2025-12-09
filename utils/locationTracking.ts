/**
 * Enhanced Location Tracking System
 * Provides strict inventory location tracking across sites and within facilities
 */

import { Product, Site } from '../types';

/**
 * Location format: ZONE-AISLE-BIN
 * Example: A-01-05
 * - Zone: A-Z (alphabetic zones)
 * - Aisle: 01-99 (numeric aisles within zone)
 * - Bin: 01-99 (specific bin/shelf position)
 */

export interface ParsedLocation {
    zone: string;
    aisle: string;
    bin: string;
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
    fullPath: string; // e.g., "Aratanya Market (Store) > Zone A > Aisle 01 > Bin 05"
    shortPath: string; // e.g., "Aratanya > A-01-05"
}

/**
 * Parse a location string into components
 */
export const parseLocation = (location: string | undefined): ParsedLocation => {
    if (!location) {
        return {
            zone: '',
            aisle: '',
            bin: '',
            formatted: '',
            isValid: false
        };
    }

    // Match format: A-01-05
    const match = location.match(/^([A-Z])-(\\d{2})-(\\d{2})$/);

    if (!match) {
        return {
            zone: '',
            aisle: '',
            bin: '',
            formatted: location,
            isValid: false
        };
    }

    return {
        zone: match[1],
        aisle: match[2],
        bin: match[3],
        formatted: location,
        isValid: true
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
        ? `${site.name} (${site.type}) > Zone ${location.zone} > Aisle ${location.aisle} > Bin ${location.bin}`
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

    // Find the highest bin number in the last aisle
    const sortedLocations = locationsInZone.sort((a, b) => {
        if (a.aisle !== b.aisle) {
            return parseInt(a.aisle) - parseInt(b.aisle);
        }
        return parseInt(a.bin) - parseInt(b.bin);
    });

    const lastLocation = sortedLocations[sortedLocations.length - 1];
    const nextBin = parseInt(lastLocation.bin) + 1;

    if (nextBin <= 99) {
        return `${zone}-${lastLocation.aisle}-${nextBin.toString().padStart(2, '0')}`;
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
    bin?: string
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

        if (bin && location.bin !== bin) {
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
        ? `📍 Zone ${parsed.zone} • Aisle ${parsed.aisle} • Bin ${parsed.bin}`
        : `Zone ${parsed.zone} • Aisle ${parsed.aisle} • Bin ${parsed.bin}`;
};
