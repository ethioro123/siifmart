/**
 * Site Templates and Bulk Operations
 * Pre-configured site templates and bulk management utilities
 */

import { Site, SiteType } from '../types';

export interface SiteTemplate {
    id: string;
    name: string;
    description: string;
    type: SiteType;
    defaultCapacity?: number;
    defaultTerminalCount?: number;
    defaultStatus: 'Active' | 'Maintenance' | 'Closed';
    suggestedSettings: {
        enableWMS?: boolean;
        enablePOS?: boolean;
        lowStockThreshold?: number;
    };
}

/**
 * Pre-defined Site Templates
 */
export const SITE_TEMPLATES: SiteTemplate[] = [
    {
        id: 'tpl-warehouse-large',
        name: 'Large Warehouse',
        description: 'High-capacity distribution center with full WMS',
        type: 'Warehouse',
        defaultCapacity: 5000,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: true,
            enablePOS: false,
            lowStockThreshold: 100
        }
    },
    {
        id: 'tpl-warehouse-medium',
        name: 'Medium Warehouse',
        description: 'Regional warehouse for local distribution',
        type: 'Warehouse',
        defaultCapacity: 2000,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: true,
            enablePOS: false,
            lowStockThreshold: 50
        }
    },
    {
        id: 'tpl-store-flagship',
        name: 'Flagship Store',
        description: 'Large retail location with multiple POS terminals',
        type: 'Store',
        defaultTerminalCount: 8,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: false,
            enablePOS: true,
            lowStockThreshold: 20
        }
    },
    {
        id: 'tpl-store-standard',
        name: 'Standard Store',
        description: 'Regular retail location',
        type: 'Store',
        defaultTerminalCount: 4,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: false,
            enablePOS: true,
            lowStockThreshold: 10
        }
    },
    {
        id: 'tpl-store-express',
        name: 'Express Store',
        description: 'Small convenience store',
        type: 'Store',
        defaultTerminalCount: 2,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: false,
            enablePOS: true,
            lowStockThreshold: 5
        }
    },
    {
        id: 'tpl-dark-store',
        name: 'Dark Store',
        description: 'Fulfillment-only location (no walk-in customers)',
        type: 'Dark Store',
        defaultCapacity: 1000,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: true,
            enablePOS: false,
            lowStockThreshold: 30
        }
    },
    {
        id: 'tpl-hq',
        name: 'Headquarters',
        description: 'Main Headquarters',
        type: 'Administration',
        defaultCapacity: 50, // Staff count
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: false,
            enablePOS: false,
            lowStockThreshold: 0
        }
    },
    {
        id: 'tpl-distribution',
        name: 'Distribution Center',
        description: 'Cross-docking and distribution hub',
        type: 'Distribution Center',
        defaultCapacity: 3000,
        defaultStatus: 'Active',
        suggestedSettings: {
            enableWMS: true,
            enablePOS: false,
            lowStockThreshold: 75
        }
    }
];

/**
 * Create site from template
 */
export function createSiteFromTemplate(
    template: SiteTemplate,
    customData: {
        name: string;
        address: string;
        manager?: string;
        code?: string;
        latitude?: number;
        longitude?: number;
    }
): Omit<Site, 'id'> {
    return {
        code: customData.code || `SITE-${Date.now().toString().slice(-6)}`,
        name: customData.name,
        type: template.type,
        address: customData.address,
        status: template.defaultStatus,
        manager: customData.manager,
        capacity: template.defaultCapacity,
        terminalCount: template.defaultTerminalCount,
        latitude: customData.latitude,
        longitude: customData.longitude
    };
}

/**
 * Bulk Site Operations
 */
export interface BulkOperation {
    type: 'update_status' | 'assign_manager' | 'update_capacity' | 'delete';
    siteIds: string[];
    value?: any;
}

export function validateBulkOperation(operation: BulkOperation): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!operation.siteIds || operation.siteIds.length === 0) {
        errors.push('No sites selected');
    }

    switch (operation.type) {
        case 'update_status':
            if (!['Active', 'Maintenance', 'Closed'].includes(operation.value)) {
                errors.push('Invalid status value');
            }
            break;
        case 'assign_manager':
            if (!operation.value || typeof operation.value !== 'string') {
                errors.push('Manager name is required');
            }
            break;
        case 'update_capacity':
            if (typeof operation.value !== 'number' || operation.value < 0) {
                errors.push('Capacity must be a positive number');
            }
            break;
        case 'delete':
            // No additional validation needed
            break;
        default:
            errors.push('Unknown operation type');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Generate bulk operation summary
 */
export function generateBulkOperationSummary(
    operation: BulkOperation,
    sites: Site[]
): string {
    const affectedSites = sites.filter(s => operation.siteIds.includes(s.id));
    const siteNames = affectedSites.map(s => s.name).join(', ');

    switch (operation.type) {
        case 'update_status':
            return `Change status to "${operation.value}" for ${affectedSites.length} site(s): ${siteNames}`;
        case 'assign_manager':
            return `Assign manager "${operation.value}" to ${affectedSites.length} site(s): ${siteNames}`;
        case 'update_capacity':
            return `Update capacity to ${operation.value} for ${affectedSites.length} site(s): ${siteNames}`;
        case 'delete':
            return `Delete ${affectedSites.length} site(s): ${siteNames}`;
        default:
            return `Unknown operation on ${affectedSites.length} site(s)`;
    }
}

/**
 * Export site configuration
 */
export function exportSiteConfiguration(site: Site): string {
    const config = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        site: {
            code: site.code,
            name: site.name,
            type: site.type,
            address: site.address,
            status: site.status,
            manager: site.manager,
            capacity: site.capacity,
            terminalCount: site.terminalCount,
            latitude: site.latitude,
            longitude: site.longitude
        }
    };

    return JSON.stringify(config, null, 2);
}

/**
 * Import site configuration
 */
export function importSiteConfiguration(jsonString: string): Omit<Site, 'id'> | null {
    try {
        const config = JSON.parse(jsonString);

        if (!config.site || !config.site.name || !config.site.type) {
            throw new Error('Invalid configuration format');
        }

        return {
            code: config.site.code || `SITE-${Date.now().toString().slice(-6)}`,
            name: config.site.name,
            type: config.site.type,
            address: config.site.address || '',
            status: config.site.status || 'Active',
            manager: config.site.manager,
            capacity: config.site.capacity,
            terminalCount: config.site.terminalCount,
            latitude: config.site.latitude,
            longitude: config.site.longitude
        };
    } catch (error) {
        console.error('Failed to import site configuration:', error);
        return null;
    }
}

/**
 * Export multiple site configurations
 */
export function exportMultipleSiteConfigurations(sites: Site[]): string {
    const config = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        siteCount: sites.length,
        sites: sites.map(site => ({
            code: site.code,
            name: site.name,
            type: site.type,
            address: site.address,
            status: site.status,
            manager: site.manager,
            capacity: site.capacity,
            terminalCount: site.terminalCount,
            latitude: site.latitude,
            longitude: site.longitude
        }))
    };

    return JSON.stringify(config, null, 2);
}

/**
 * Validate site data
 */
export function validateSiteData(site: Partial<Site>): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!site.name || site.name.trim() === '') {
        errors.push('Site name is required');
    }

    if (!site.type) {
        errors.push('Site type is required');
    }

    if (!site.address || site.address.trim() === '') {
        errors.push('Address is required');
    }

    if (site.capacity !== undefined && site.capacity < 0) {
        errors.push('Capacity cannot be negative');
    }

    if (site.terminalCount !== undefined && site.terminalCount < 0) {
        errors.push('Terminal count cannot be negative');
    }

    if (site.latitude !== undefined && (site.latitude < -90 || site.latitude > 90)) {
        errors.push('Latitude must be between -90 and 90');
    }

    if (site.longitude !== undefined && (site.longitude < -180 || site.longitude > 180)) {
        errors.push('Longitude must be between -180 and 180');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
