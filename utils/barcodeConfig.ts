/**
 * Barcode Size Presets
 * Standardized barcode configurations for consistent rendering across the application
 */

export type BarcodeSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

export interface BarcodeConfig {
    width: number;
    height: number;
    fontSize: number;
    margin: number;
    displayValue: boolean;
    format?: string;
}

/**
 * Barcode size presets for different use cases
 */
export const BARCODE_SIZES: Record<BarcodeSize, BarcodeConfig> = {
    // Tiny: For inline display in lists, cards, or compact UI elements
    tiny: {
        width: 1,
        height: 25,
        fontSize: 8,
        margin: 0,
        displayValue: false
    },

    // Small: For modal previews, small labels, or secondary displays
    small: {
        width: 1,
        height: 35,
        fontSize: 10,
        margin: 2,
        displayValue: true
    },

    // Medium: For standard product labels and general printing
    medium: {
        width: 1.5,
        height: 50,
        fontSize: 12,
        margin: 4,
        displayValue: true
    },

    // Large: For warehouse labels, shipping labels, and primary identification
    large: {
        width: 2,
        height: 70,
        fontSize: 14,
        margin: 6,
        displayValue: true
    },

    // XLarge: For large format printing, posters, or high-visibility applications
    xlarge: {
        width: 3,
        height: 100,
        fontSize: 16,
        margin: 8,
        displayValue: true
    }
};

/**
 * Get barcode configuration for a specific size
 */
export const getBarcodeConfig = (size: BarcodeSize = 'medium'): BarcodeConfig => {
    return BARCODE_SIZES[size];
};

/**
 * Get barcode props for react-barcode component
 */
export const getBarcodeProps = (size: BarcodeSize = 'medium', overrides?: Partial<BarcodeConfig>) => {
    const config = getBarcodeConfig(size);
    return {
        format: 'CODE128', // Default format
        ...config,
        ...overrides,
    };
};

/**
 * Use cases for each size:
 * 
 * TINY:
 * - Inventory list item previews
 * - Product cards in grid view
 * - Quick reference in tables
 * 
 * SMALL:
 * - Modal previews
 * - Compact labels (2" x 1")
 * - Mobile displays
 * 
 * MEDIUM:
 * - Standard product labels (4" x 2")
 * - Receipt printing
 * - General purpose labels
 * 
 * LARGE:
 * - Warehouse bin labels
 * - Shipping labels
 * - Pallet labels
 * 
 * XLARGE:
 * - Warehouse signage
 * - Large format posters
 * - High-visibility identification
 */
