/**
 * SIIFMART Procurement Category Logistics System
 * Re-exports packaging configurations and manages dynamic storage,
 * inbound QC directives, margin benchmarks, and procurement metrics.
 */

import { getCategorySpecGroup } from './categoryAttributes';

export {
    getCategoryPackageContainers,
    getCategoryPackagingDefaults,
    type CategoryPackagingConfig
} from './categoryPackaging';

export interface CategoryStorageConfig {
    defaultStorage: string;
    defaultPerishable: boolean;
    defaultShelfLife: string;
    inboundDirectives: string[];
    flags: {
        id: string;
        label: string;
        isAlert?: boolean;
    }[];
}

export interface CategoryMarginConfig {
    benchmarkPct: number;
    minPct: number;
    maxPct: number;
    benchmarkLabel: string;
    suggestedUnits: string[];
    commercialNotes?: string;
}

const resolveDomainId = (domainOrCategory?: string): string => {
    if (!domainOrCategory) return 'general_merchandise';
    if (domainOrCategory.includes('_')) return domainOrCategory;
    return getCategorySpecGroup(domainOrCategory).id || domainOrCategory;
};

// ──────────────── 1. DYNAMIC STORAGE, INBOUND QC & COMPLIANCE DIRECTIVES ────────────────

export const getCategoryStorageDefaults = (domainOrCategory: string): CategoryStorageConfig => {
    const domainId = resolveDomainId(domainOrCategory);
    switch (domainId) {
        case 'fresh_produce':
            return {
                defaultStorage: 'Chilled (0°C to 4°C)',
                defaultPerishable: true,
                defaultShelfLife: '14',
                inboundDirectives: [
                    'Receiving door thermal probe check (< 4°C)',
                    'Organoleptic visual freshness & rot inspection',
                    'Maturity / firmness index confirmation',
                    'Waxed produce crate ventilation audit'
                ],
                flags: [
                    { id: 'coldChain', label: 'Continuous Cold Chain Required', isAlert: true },
                    { id: 'isPerishable', label: 'Perishable Produce', isAlert: true },
                    { id: 'directFoodContact', label: 'Direct Food Contact Safe' },
                    { id: 'isFragile', label: 'Bruise-Sensitive Fruit' }
                ]
            };
        case 'meat_poultry':
            return {
                defaultStorage: 'Chilled (0°C to 4°C)',
                defaultPerishable: true,
                defaultShelfLife: '7',
                inboundDirectives: [
                    'Mandatory digital probe temperature (< 3°C)',
                    'Halal slaughter certification verify',
                    'Vacuum seal & leak-tight barrier inspection',
                    'Zero ambient exposure receiving dock protocol'
                ],
                flags: [
                    { id: 'coldChain', label: 'Strict Cold Chain (0°C to 3°C)', isAlert: true },
                    { id: 'isPerishable', label: 'High-Perishability Protein', isAlert: true },
                    { id: 'halalVerified', label: 'Halal Certified Consignment' }
                ]
            };
        case 'frozen_food':
            return {
                defaultStorage: 'Frozen (-18°C or below)',
                defaultPerishable: true,
                defaultShelfLife: '180',
                inboundDirectives: [
                    'Infrared surface temp audit (<= -18°C)',
                    'Frost/ice crystal defrost cycle inspection',
                    'Instant freezer transfer within 5 minutes'
                ],
                flags: [
                    { id: 'deepFreeze', label: 'Deep Freeze (-18°C Guarantee)', isAlert: true },
                    { id: 'isPerishable', label: 'Frozen Shelf-Life Monitored' }
                ]
            };
        case 'electronics':
            return {
                defaultStorage: 'Ambient (Dry)',
                defaultPerishable: false,
                defaultShelfLife: '',
                inboundDirectives: [
                    '100% Serial / IMEI barcode verification scan',
                    'Anti-static ESD sealed packaging inspection',
                    'Drop / shock impact sensor indicator check',
                    'Tamper-evident security tape verification'
                ],
                flags: [
                    { id: 'isFragile', label: 'Fragile Precision Electronics', isAlert: true },
                    { id: 'antiStatic', label: 'Anti-Static ESD Sensitive' },
                    { id: 'highTheft', label: 'High-Value / Secure Cage Stored', isAlert: true },
                    { id: 'serialTracked', label: 'Serial Tracked Inbound' }
                ]
            };
        case 'apparel':
            return {
                defaultStorage: 'Ambient (Dry)',
                defaultPerishable: false,
                defaultShelfLife: '',
                inboundDirectives: [
                    'Size-ratio & colorway pre-pack audit',
                    'Needle detection / metal scanning clearance',
                    'Cleanliness & snag/stain visual check',
                    'Barcode tag and hanger integrity check'
                ],
                flags: [
                    { id: 'keepDry', label: 'Keep Dry & Mildew Protected' },
                    { id: 'hangingGarment', label: 'Pre-Hung Garment Rack' },
                    { id: 'flatFold', label: 'Carton Flat Fold' }
                ]
            };
        case 'homewares_kitchen':
            return {
                defaultStorage: 'Ambient (Dry)',
                defaultPerishable: false,
                defaultShelfLife: '',
                inboundDirectives: [
                    'Drop & vibration impact visual audit',
                    '5-point glass/ceramic breakage inspection',
                    'Food-contact certification (FDA/LFGB) check'
                ],
                flags: [
                    { id: 'isFragile', label: 'Fragile / Breakable Tableware', isAlert: true },
                    { id: 'isBreakable', label: 'Glass / Ceramic Breakage Risk', isAlert: true },
                    { id: 'heavyLift', label: 'Heavy Lift (>15kg carton)' }
                ]
            };
        case 'household_cleaning':
        case 'automotive_industrial':
            return {
                defaultStorage: 'Ventilated / Hazardous Segregated',
                defaultPerishable: false,
                defaultShelfLife: '730',
                inboundDirectives: [
                    'UN hazardous packaging mark verification',
                    'Cap torque & chemical leak inspection',
                    'Material Safety Data Sheet (SDS) audit',
                    'Acid / alkali segregation in warehouse'
                ],
                flags: [
                    { id: 'isHazardous', label: 'Hazardous Goods (HAZMAT)', isAlert: true },
                    { id: 'spillContainment', label: 'Secondary Spill Containment' },
                    { id: 'isLightSensitive', label: 'Light / Heat Sensitive' }
                ]
            };
        default:
            return {
                defaultStorage: 'Ambient (Dry)',
                defaultPerishable: false,
                defaultShelfLife: '365',
                inboundDirectives: [
                    'Outer shipper integrity and barcode check',
                    'Gross weight tolerance verification',
                    'Expiry date check (min 70% shelf life)'
                ],
                flags: [
                    { id: 'isFragile', label: 'Fragile Merchandise' },
                    { id: 'isBreakable', label: 'Breakable Packaging' }
                ]
            };
    }
};

// ──────────────── 2. DYNAMIC SELLING & RETAIL MARGIN BENCHMARKS ────────────────

export const getCategoryMarginBenchmark = (domainOrCategory: string): CategoryMarginConfig => {
    const domainId = resolveDomainId(domainOrCategory);
    switch (domainId) {
        case 'electronics':
            return {
                benchmarkPct: 18,
                minPct: 12,
                maxPct: 25,
                benchmarkLabel: 'Tech Hardware Benchmark: 18% (12% – 25%)',
                suggestedUnits: ['UNIT'],
                commercialNotes: 'Lower margin on serialized hardware is offset by high basket value.'
            };
        case 'fresh_produce':
            return {
                benchmarkPct: 32,
                minPct: 25,
                maxPct: 42,
                benchmarkLabel: 'Fresh Produce Benchmark: 32% (25% – 42%)',
                suggestedUnits: ['KG', 'G', 'UNIT'],
                commercialNotes: 'Target margin accounts for retail shrinkage, trimming, and moisture weight loss.'
            };
        case 'meat_poultry':
            return {
                benchmarkPct: 25,
                minPct: 18,
                maxPct: 32,
                benchmarkLabel: 'Meat & Poultry Benchmark: 25% (18% – 32%)',
                suggestedUnits: ['KG', 'G', 'PACK'],
                commercialNotes: 'Butchery margin reflects chilled storage and cold chain energy overhead.'
            };
        case 'dairy_eggs':
            return {
                benchmarkPct: 22,
                minPct: 16,
                maxPct: 28,
                benchmarkLabel: 'Dairy & Chilled Benchmark: 22% (16% – 28%)',
                suggestedUnits: ['UNIT', 'L', 'PACK'],
                commercialNotes: 'Fast velocity staple with short shelf life requiring disciplined turn rate.'
            };
        case 'bakery_deli':
            return {
                benchmarkPct: 35,
                minPct: 28,
                maxPct: 45,
                benchmarkLabel: 'Bakery & Deli Benchmark: 35% (28% – 45%)',
                suggestedUnits: ['UNIT', 'PACK'],
                commercialNotes: 'Fresh daily items priced with margin buffers for same-day markdown windows.'
            };
        case 'beverages':
            return {
                benchmarkPct: 28,
                minPct: 20,
                maxPct: 35,
                benchmarkLabel: 'Beverages Benchmark: 28% (20% – 35%)',
                suggestedUnits: ['UNIT', 'PACK', 'DOZEN'],
                commercialNotes: 'High volume turn, strong margins on chilled singles vs ambient multi-packs.'
            };
        case 'apparel':
            return {
                benchmarkPct: 55,
                minPct: 45,
                maxPct: 68,
                benchmarkLabel: 'Apparel Benchmark: 55% (45% – 68%)',
                suggestedUnits: ['UNIT'],
                commercialNotes: 'High gross margin accounts for seasonal holding and promotional clearance.'
            };
        case 'homewares_kitchen':
            return {
                benchmarkPct: 45,
                minPct: 35,
                maxPct: 55,
                benchmarkLabel: 'Homewares & Dining Benchmark: 45% (35% – 55%)',
                suggestedUnits: ['UNIT', 'PACK'],
                commercialNotes: 'Durable goods with steady shelf velocity and premium brand markup.'
            };
        case 'health_beauty':
            return {
                benchmarkPct: 40,
                minPct: 30,
                maxPct: 50,
                benchmarkLabel: 'Health & Beauty Benchmark: 40% (30% – 50%)',
                suggestedUnits: ['UNIT', 'PACK', 'ML'],
                commercialNotes: 'Cosmetics and personal care carry premium margin structures.'
            };
        case 'household_cleaning':
            return {
                benchmarkPct: 25,
                minPct: 18,
                maxPct: 32,
                benchmarkLabel: 'Household & Cleaning Benchmark: 25% (18% – 32%)',
                suggestedUnits: ['UNIT', 'PACK', 'L'],
                commercialNotes: 'Everyday cleaning essentials with competitive supermarket benchmarks.'
            };
        case 'pantry_groceries':
            return {
                benchmarkPct: 20,
                minPct: 15,
                maxPct: 28,
                benchmarkLabel: 'Pantry Commodities Benchmark: 20% (15% – 28%)',
                suggestedUnits: ['KG', 'UNIT', 'PACK', 'G'],
                commercialNotes: 'Core staples (rice, flour, oil, sugar) operate on volume velocity.'
            };
        default:
            return {
                benchmarkPct: 25,
                minPct: 18,
                maxPct: 35,
                benchmarkLabel: 'General Merchandise Benchmark: 25% (18% – 35%)',
                suggestedUnits: ['UNIT'],
                commercialNotes: 'Standard retail markup balanced for stock turnover and operating margins.'
            };
    }
};

// ──────────────── 3. DYNAMIC PROCUREMENT & ORDER QUANTITY METRICS ────────────────

export interface CategoryProcurementMetric {
    label: string;
    value: string;
    badgeColor?: string;
}

export const getCategoryProcurementMetrics = (
    domainOrCategory: string,
    orderQty: number,
    unitsPerOrderUnit: number,
    customAttributes: any
): CategoryProcurementMetric[] => {
    const domainId = resolveDomainId(domainOrCategory);
    const totalUnits = orderQty * unitsPerOrderUnit;
    const metrics: CategoryProcurementMetric[] = [];
    if (orderQty <= 0) return metrics;

    if (domainId === 'beverages') {
        const netVol = parseFloat(customAttributes?.physical?.netWeight) || 0;
        const volUnit = customAttributes?.physical?.sizeType || 'ml';
        if (netVol > 0) {
            const totalLitres = volUnit.toLowerCase() === 'l'
                ? (totalUnits * netVol)
                : (totalUnits * netVol) / 1000;
            metrics.push({
                label: 'Total Liquid Volume',
                value: `${totalLitres.toLocaleString(undefined, { maximumFractionDigits: 1 })} Litres`,
                badgeColor: 'text-cyan-500'
            });
        }
    } else if (domainId === 'fresh_produce') {
        const netKg = parseFloat(customAttributes?.physical?.netWeight) || 0;
        if (netKg > 0) {
            metrics.push({
                label: 'Total Intake Weight',
                value: `${(totalUnits * netKg).toLocaleString()} kg`,
                badgeColor: 'text-emerald-500'
            });
        }
        metrics.push({
            label: 'Freshness Intake',
            value: 'Cold Chain Gate Probe Active',
            badgeColor: 'text-emerald-500'
        });
    } else if (domainId === 'electronics') {
        metrics.push({
            label: 'Serialized Units',
            value: `${totalUnits.toLocaleString()} units tracking required`,
            badgeColor: 'text-sky-500'
        });
    } else if (domainId === 'apparel') {
        const size = customAttributes?.categorySpecific?.apparelSize || customAttributes?.identity?.variant || 'Each';
        metrics.push({
            label: 'Garment Units',
            value: `${totalUnits.toLocaleString()} units (${size})`,
            badgeColor: 'text-indigo-500'
        });
    }

    return metrics;
};
