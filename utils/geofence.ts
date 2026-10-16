/**
 * Geofence & Location Anomaly Detection Utility
 * Zero-Trust & National Sovereignty Model for SIIFMART ERP
 * 
 * Verifies employee login GPS coordinates and IP geolocation against
 * sovereign national and regional operational boundaries (Ethiopia & Kenya).
 */

import { Country } from './localization';

export interface GeofenceEvaluation {
    isOffPremise: boolean;
    isForeignAnomaly: boolean;
    displayLocation: string;
    anomalyReason?: string;
    severity?: 'info' | 'warning' | 'critical';
    countryDetected?: Country | 'UNKNOWN_FOREIGN';
}

// Bounding boxes for sovereign operating territories
// Format: [minLat, maxLat, minLng, maxLng]
const SOVEREIGN_BOUNDS = {
    // Federal Democratic Republic of Ethiopia
    ET: { minLat: 3.4, maxLat: 14.9, minLng: 32.9, maxLng: 48.0 },
    // Republic of Kenya
    KE: { minLat: -4.7, maxLat: 5.5, minLng: 33.9, maxLng: 42.0 },
    // Regional East Africa Operating Zone (allowed for cross-border logistics/HQ)
    EAST_AFRICA: { minLat: -5.0, maxLat: 15.5, minLng: 28.0, maxLng: 52.0 }
};

// Known foreign keywords that immediately flag foreign IP anomalies
const FOREIGN_KEYWORDS = [
    'australia', 'melbourne', 'sydney', 'brisbane', 'perth',
    'united states', 'usa', 'new york', 'california', 'texas',
    'united kingdom', 'london', 'germany', 'frankfurt', 'berlin',
    'canada', 'toronto', 'vancouver', 'singapore', 'amsterdam', 'dubai'
];

/**
 * Parses coordinates from various string formats:
 * - "-37.7802, 144.9167"
 * - "GPS: -37.7802, 144.9167"
 * - "9.0300, 38.7400"
 */
export function parseCoordinates(locationStr: string): { lat: number; lng: number } | null {
    if (!locationStr) return null;

    // Remove prefixes like "GPS: "
    const cleaned = locationStr.replace(/^GPS:\s*/i, '').trim();

    // Match coordinate pattern: e.g. -37.7802, 144.9167
    const match = cleaned.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
    if (!match) return null;

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);

    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
}

/**
 * Evaluates whether a location string (GPS or IP) is within the expected
 * country or East Africa sovereign geofence.
 */
export function evaluateGeofence(
    locationStr?: string,
    expectedCountry?: Country
): GeofenceEvaluation {
    if (!locationStr || locationStr === 'Protected' || locationStr === 'N/A') {
        return {
            isOffPremise: false,
            isForeignAnomaly: false,
            displayLocation: locationStr || 'Unrecorded'
        };
    }

    const lower = locationStr.toLowerCase();

    // Check for explicit foreign keywords in IP-location string
    for (const kw of FOREIGN_KEYWORDS) {
        if (lower.includes(kw)) {
            return {
                isOffPremise: true,
                isForeignAnomaly: true,
                displayLocation: locationStr.replace(/^GPS:\s*/i, ''),
                anomalyReason: `Foreign Territory Detected: Session originating from ${kw.toUpperCase()}`,
                severity: 'critical',
                countryDetected: 'UNKNOWN_FOREIGN'
            };
        }
    }

    // Try parsing GPS coordinates
    const coords = parseCoordinates(locationStr);
    if (!coords) {
        // Text-based location without coordinates or foreign keyword
        return {
            isOffPremise: false,
            isForeignAnomaly: false,
            displayLocation: locationStr.replace(/^GPS:\s*/i, '')
        };
    }

    const { lat, lng } = coords;

    // Check national bounds if country is specified
    if (expectedCountry === 'ET') {
        const bounds = SOVEREIGN_BOUNDS.ET;
        const inEthiopia = lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
        if (!inEthiopia) {
            // Check if at least in East Africa
            const inEastAfrica = lat >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLat && lat <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLat &&
                                 lng >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLng && lng <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLng;
            return {
                isOffPremise: true,
                isForeignAnomaly: !inEastAfrica,
                displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                anomalyReason: inEastAfrica 
                    ? `Cross-Border Anomaly: Coordinates outside Ethiopia (${lat.toFixed(2)}, ${lng.toFixed(2)})`
                    : `Foreign Coordinates: Outside East African territory (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                severity: inEastAfrica ? 'warning' : 'critical',
                countryDetected: inEastAfrica ? 'KE' : 'UNKNOWN_FOREIGN'
            };
        }
        return {
            isOffPremise: false,
            isForeignAnomaly: false,
            displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            countryDetected: 'ET'
        };
    }

    if (expectedCountry === 'KE') {
        const bounds = SOVEREIGN_BOUNDS.KE;
        const inKenya = lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
        if (!inKenya) {
            const inEastAfrica = lat >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLat && lat <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLat &&
                                 lng >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLng && lng <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLng;
            return {
                isOffPremise: true,
                isForeignAnomaly: !inEastAfrica,
                displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                anomalyReason: inEastAfrica 
                    ? `Cross-Border Anomaly: Coordinates outside Kenya (${lat.toFixed(2)}, ${lng.toFixed(2)})`
                    : `Foreign Coordinates: Outside East African territory (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                severity: inEastAfrica ? 'warning' : 'critical',
                countryDetected: inEastAfrica ? 'ET' : 'UNKNOWN_FOREIGN'
            };
        }
        return {
            isOffPremise: false,
            isForeignAnomaly: false,
            displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            countryDetected: 'KE'
        };
    }

    // Default East Africa Region Check
    const inEastAfrica = lat >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLat && lat <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLat &&
                         lng >= SOVEREIGN_BOUNDS.EAST_AFRICA.minLng && lng <= SOVEREIGN_BOUNDS.EAST_AFRICA.maxLng;

    if (!inEastAfrica) {
        return {
            isOffPremise: true,
            isForeignAnomaly: true,
            displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            anomalyReason: `Foreign Coordinates: Outside East African territory (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
            severity: 'critical',
            countryDetected: 'UNKNOWN_FOREIGN'
        };
    }

    return {
        isOffPremise: false,
        isForeignAnomaly: false,
        displayLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
}

/**
 * Formats site assignment according to Zero-Trust and HQ oversight model:
 * - Assigned site: returns the facility name
 * - Unassigned + Executive / Corporate role: returns "Ethiopia HQ (Central)"
 * - Unassigned + Branch / Site-bound role: returns warning object
 */
export function formatSiteAssignment(
    siteId?: string,
    role?: string,
    sites: Array<{ id: string; name: string; code?: string; type?: string }> = []
): {
    label: string;
    isWarning: boolean;
    isHQ: boolean;
    facilityId?: string;
    isCEO: boolean;
} {
    const isCEO = role === 'ceo' || role === 'super_admin' || role === 'CEO';

    if (isCEO) {
        const site = siteId ? sites.find(s => s.id === siteId) : null;
        return {
            label: site ? site.name : 'Central Operations',
            facilityId: 'GLOBAL',
            isWarning: false,
            isHQ: true,
            isCEO: true
        };
    }

    if (siteId) {
        const site = sites.find(s => s.id === siteId);
        if (site) {
            const isHQFacility = site.code === 'ET-HQ' || site.code === 'KE-HQ' || site.type === 'Administration';
            return {
                label: site.name,
                facilityId: site.code,
                isWarning: false,
                isHQ: isHQFacility,
                isCEO: false
            };
        }
    }

    // Corporate roles without a specific branch assignment fallback
    const HQ_ROLES = [
        'operations_manager', 'finance_manager',
        'hr_manager', 'procurement_manager', 'supply_chain_manager',
        'admin', 'hr', 'data_analyst', 'auditor'
    ];

    if (role && HQ_ROLES.includes(role)) {
        return { label: 'Central Operations', facilityId: 'ET-HQ', isWarning: false, isHQ: true, isCEO: false };
    }

    // Site-bound roles without an assigned branch/facility are a security risk
    return { label: 'Unassigned Facility', isWarning: true, isHQ: false, facilityId: undefined, isCEO: false };
}
