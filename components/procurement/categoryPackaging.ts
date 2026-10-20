/**
 * Category Packaging & Container Types (GS1 Logistics Standard)
 */

import { getCategorySpecGroup } from './categoryAttributes';

export interface CategoryPackagingConfig {
    containers: string[];
    defaultLevel: 'single' | 'case' | 'bale' | 'two_tier';
    defaultPackQty: string;
    defaultMaterial: string;
    levelLabels?: {
        single?: string;
        case?: string;
        bale?: string;
        two_tier?: string;
    };
}

export const CATEGORY_CONTAINERS_BY_DOMAIN: Record<string, string[]> = {
    fresh_produce: [
        'Ventilated Produce Crate / Tote',
        'Waxed Corrugated Produce Carton',
        'Mesh Breathable Sack / Bag',
        'Reusable Plastic Container (RPC)',
        'Wooden Slat Crate',
        'Bulk Harvest Pallet Bin'
    ],
    dairy_eggs: [
        'Insulated Cold-Chain Carton',
        'Moulded Egg Filler Flat / Master Case',
        'Chilled Dairy Master Carton',
        'Plastic Milk Crate (Interlocking)',
        'Waxed Liquid-Tight Master Shipper'
    ],
    meat_poultry: [
        'Insulated Polystyrene Master Box',
        'Waxed Meat Lug / Shipper',
        'Vacuum Pack Master Carton',
        'Deep Chill Leak-Proof Shipper',
        'Plastic Food-Grade Heavy Tote'
    ],
    bakery_deli: [
        'Bread / Bakery Delivery Tray',
        'Ventilated Pastry Master Box',
        'Grease-Resistant Corrugated Carton',
        'Clamshell Multipack Shipper'
    ],
    beverages: [
        'Corrugated Master Case (24-Pack)',
        'Corrugated Shipper (12-Pack)',
        'Shrink-Wrapped Heavy Tray',
        'Stainless / Aluminium Beverage Keg',
        'Interlocking Beverage Delivery Crate',
        'Bag-in-Box Liquid Dispenser Shipper'
    ],
    frozen_food: [
        'Deep Freeze Insulated Shipper (-18°C)',
        'Vapor Barrier Master Freeze Carton',
        'Polystyrene Thermal Insulated Box',
        'Dry Ice Heavy Corrugated Shipper'
    ],
    pantry_groceries: [
        'Master Corrugated Carton',
        'Woven Polypropylene Sack (25kg/50kg)',
        'Multi-Wall Kraft Paper Bale',
        'Heavy Shrink-Bundle Master Pack',
        'Stand-Up Pouch Outer Shipper'
    ],
    confectionery_snacks: [
        'Shelf-Ready Display Shipper (SRP)',
        'Lightweight Corrugated Master Case',
        'Foil-Lined Moisture-Barrier Box',
        'Multipack Hanging Clip Strip Box'
    ],
    apparel: [
        'Individual Polybag (1:1 Retail)',
        'Garment Pre-Pack Bundle (Banded)',
        'Flat Pack Master Corrugated Carton',
        'Wardrobe / Hanging Garment Carton',
        'High-Density Compression Bale'
    ],
    electronics: [
        'Retail Gift Box with Foam / Pulp Insert',
        'Master Shipper Box (Heavy Corrugated)',
        'Anti-Static Shielding Bag (ESD)',
        'Drop-Tested Outer Logistics Carton',
        'Bulk Blister Pack Master Shipper'
    ],
    homewares_kitchen: [
        'Foam / Honeycomb Protected Retail Box',
        'Heavy-Duty Corrugated Master Carton',
        'Reinforced Corner-Guard Logistics Box',
        'Wooden Shipping Crate',
        'Palletized Bulk Cookware Pack'
    ],
    household_cleaning: [
        'Hazardous Rated Outer Carton (UN Mark)',
        'Leak-Proof Corrugated Master Case',
        'Heavy Plastic Pail / Drum with Seal',
        'Upright Bottle Tray with Divider'
    ],
    health_beauty: [
        'Tamper-Evident Inner / Master Carton',
        'Cellophane-Wrapped Retail Box',
        'Divided Bottle Shipper Carton',
        'Display Ready Outer Box (SRP)'
    ],
    baby_toddler: [
        'Cleanroom Packaged Master Carton',
        'Sterile Barrier Inner Box',
        'Nappy / Diaper Bulk Master Bale',
        'Formula Protective Tin Outer Box'
    ],
    stationery_toys: [
        'Clear Window Display Box',
        'Corrugated Master Toy Shipper',
        'Standard Office Stationery Carton'
    ],
    automotive_industrial: [
        'Industrial Grade Corrugated Box',
        'Steel / Plastic Drum / Jerry Can',
        'Reinforced Parts Crate with Foam',
        'Weather-Resistant Heavy Shrink Shipper'
    ]
};

const DEFAULT_CONTAINERS = [
    'Master Corrugated Carton',
    'Wholesale Case (12 / 24 Pack)',
    'Bulk Bale / Bundle',
    'Reinforced Shipping Box',
    'Heavy-Duty Sack / Bag',
    'Palletized Crate'
];

const resolveDomainId = (domainOrCategory?: string): string => {
    if (!domainOrCategory) return 'general_merchandise';
    if (CATEGORY_CONTAINERS_BY_DOMAIN[domainOrCategory]) return domainOrCategory;
    return getCategorySpecGroup(domainOrCategory).id || domainOrCategory;
};

export const getCategoryPackageContainers = (domainOrCategory: string): string[] => {
    const domainId = resolveDomainId(domainOrCategory);
    return CATEGORY_CONTAINERS_BY_DOMAIN[domainId] || DEFAULT_CONTAINERS;
};

export const getCategoryPackagingDefaults = (domainOrCategory: string): CategoryPackagingConfig => {
    const domainId = resolveDomainId(domainOrCategory);
    const containers = getCategoryPackageContainers(domainId);
    switch (domainId) {
        case 'beverages':
            return {
                containers,
                defaultLevel: 'case',
                defaultPackQty: '24',
                defaultMaterial: 'Paper / Cardboard',
                levelLabels: {
                    single: 'Single Can / Bottle',
                    case: 'Master Case (24-Pack)',
                    bale: 'Shrink Tray (12-Pack)',
                    two_tier: 'Master Pallet Pack'
                }
            };
        case 'apparel':
            return {
                containers,
                defaultLevel: 'single',
                defaultPackQty: '1',
                defaultMaterial: 'Plastic',
                levelLabels: {
                    single: 'Single Garment (Polybag)',
                    case: 'Master Wardrobe Carton',
                    bale: 'Assorted Pre-Pack Bundle (12 pcs)',
                    two_tier: '2-Tier (Inners in Master)'
                }
            };
        case 'electronics':
            return {
                containers,
                defaultLevel: 'single',
                defaultPackQty: '1',
                defaultMaterial: 'Paper / Cardboard',
                levelLabels: {
                    single: 'Single Retail Box (1:1)',
                    case: 'Master Shipper (5-10 units)',
                    bale: 'Bulk Blister Pack',
                    two_tier: '2-Tier Master Carton'
                }
            };
        case 'fresh_produce':
            return {
                containers,
                defaultLevel: 'case',
                defaultPackQty: '1',
                defaultMaterial: 'Paper / Cardboard',
                levelLabels: {
                    single: 'Single Each / Head',
                    case: 'Produce Crate / Box',
                    bale: 'Bulk Harvest Sack (25kg)',
                    two_tier: 'Master Pallet Bin'
                }
            };
        case 'pantry_groceries':
            return {
                containers,
                defaultLevel: 'case',
                defaultPackQty: '12',
                defaultMaterial: 'Paper / Cardboard',
                levelLabels: {
                    single: 'Single Retail Pouch / Can',
                    case: 'Wholesale Case (12 / 24)',
                    bale: 'Commodity Bale / Sack',
                    two_tier: 'Master Case (Inner Packs)'
                }
            };
        default:
            return {
                containers,
                defaultLevel: 'single',
                defaultPackQty: '1',
                defaultMaterial: 'Paper / Cardboard'
            };
    }
};
