// ══════════════════════════════════════════════════════════════════
// UNIT-OF-MEASURE DEFINITIONS MATRIX
// ══════════════════════════════════════════════════════════════════

export interface SellUnit {
    code: string;
    label: string;
    shortLabel: string; // Compact label for POS/cart display
    allowDecimal: boolean;
    step: number; // Input step value (1 for integer, 0.01 for decimal)
    category: 'count' | 'weight' | 'volume';
    conversionBase?: string; // Base unit for auto-conversion (e.g., G -> KG)
    conversionFactor?: number; // e.g., 1000 (1000g = 1kg)
}

export const SELL_UNITS: SellUnit[] = [
    // ── COUNT & PACKAGING-BASED ──
    { code: 'UNIT', label: 'Unit (Each)', shortLabel: 'ea', allowDecimal: false, step: 1, category: 'count' },
    { code: 'PACK', label: 'Pack / Packet', shortLabel: 'pk', allowDecimal: false, step: 1, category: 'count' },
    { code: 'BOX', label: 'Box', shortLabel: 'box', allowDecimal: false, step: 1, category: 'count' },
    { code: 'CASE', label: 'Case / Crate', shortLabel: 'cs', allowDecimal: false, step: 1, category: 'count' },
    { code: 'CARTON', label: 'Carton', shortLabel: 'ctn', allowDecimal: false, step: 1, category: 'count' },
    { code: 'BOTTLE', label: 'Bottle', shortLabel: 'btl', allowDecimal: false, step: 1, category: 'count' },
    { code: 'CAN', label: 'Can / Tin', shortLabel: 'can', allowDecimal: false, step: 1, category: 'count' },
    { code: 'BAG', label: 'Bag / Sack', shortLabel: 'bag', allowDecimal: false, step: 1, category: 'count' },
    { code: 'BUNDLE', label: 'Bundle / Bunch', shortLabel: 'bdl', allowDecimal: false, step: 1, category: 'count' },
    { code: 'DOZEN', label: 'Dozen', shortLabel: 'dz', allowDecimal: false, step: 1, category: 'count' },
    { code: 'PAIR', label: 'Pair', shortLabel: 'pr', allowDecimal: false, step: 1, category: 'count' },
    { code: 'SET', label: 'Set', shortLabel: 'set', allowDecimal: false, step: 1, category: 'count' },
    { code: 'ROLL', label: 'Roll', shortLabel: 'roll', allowDecimal: false, step: 1, category: 'count' },
    { code: 'PALLET', label: 'Pallet (Bulk)', shortLabel: 'plt', allowDecimal: false, step: 1, category: 'count' },

    // ── WEIGHT-BASED (decimals allowed) ──
    { code: 'KG', label: 'Kilogram', shortLabel: 'kg', allowDecimal: true, step: 0.01, category: 'weight' },
    { code: 'G', label: 'Gram', shortLabel: 'g', allowDecimal: true, step: 1, category: 'weight', conversionBase: 'KG', conversionFactor: 1000 },
    { code: 'MG', label: 'Milligram', shortLabel: 'mg', allowDecimal: true, step: 1, category: 'weight', conversionBase: 'G', conversionFactor: 1000 },
    { code: 'LB', label: 'Pound', shortLabel: 'lb', allowDecimal: true, step: 0.01, category: 'weight', conversionBase: 'KG', conversionFactor: 2.20462 },
    { code: 'OZ', label: 'Ounce', shortLabel: 'oz', allowDecimal: true, step: 0.1, category: 'weight', conversionBase: 'LB', conversionFactor: 16 },
    { code: 'QTL', label: 'Quintal (100 kg)', shortLabel: 'qtl', allowDecimal: true, step: 0.01, category: 'weight', conversionBase: 'KG', conversionFactor: 0.01 },
    { code: 'TON', label: 'Metric Ton (1000 kg)', shortLabel: 't', allowDecimal: true, step: 0.001, category: 'weight', conversionBase: 'KG', conversionFactor: 0.001 },

    // ── VOLUME-BASED (decimals allowed) ──
    { code: 'L', label: 'Litre', shortLabel: 'L', allowDecimal: true, step: 0.01, category: 'volume' },
    { code: 'ML', label: 'Millilitre', shortLabel: 'ml', allowDecimal: true, step: 1, category: 'volume', conversionBase: 'L', conversionFactor: 1000 },
    { code: 'CL', label: 'Centilitre', shortLabel: 'cl', allowDecimal: true, step: 1, category: 'volume', conversionBase: 'L', conversionFactor: 100 },
    { code: 'GAL', label: 'Gallon', shortLabel: 'gal', allowDecimal: true, step: 0.01, category: 'volume', conversionBase: 'L', conversionFactor: 0.264172 },
    { code: 'FL_OZ', label: 'Fluid Ounce', shortLabel: 'fl oz', allowDecimal: true, step: 0.1, category: 'volume', conversionBase: 'L', conversionFactor: 33.814 },

    // ── LENGTH / MEASURE (for fabric, wire, foil, packaging) ──
    { code: 'M', label: 'Meter', shortLabel: 'm', allowDecimal: true, step: 0.01, category: 'weight' },
    { code: 'CM', label: 'Centimeter', shortLabel: 'cm', allowDecimal: true, step: 1, category: 'weight', conversionBase: 'M', conversionFactor: 100 },
];

export const legacyMap: Record<string, string> = {
    // Standard packaging & aliases
    'PCS': 'UNIT',
    'EA': 'UNIT',
    'EACH': 'UNIT',
    'PIECE': 'UNIT',
    'PIECES': 'UNIT',
    'PK': 'PACK',
    'PACKET': 'PACK',
    'PACKETS': 'PACK',
    'CTN': 'CARTON',
    'CARTONS': 'CARTON',
    'CS': 'CASE',
    'CRATE': 'CASE',
    'BOXES': 'BOX',
    'BTL': 'BOTTLE',
    'BOTTLES': 'BOTTLE',
    'TIN': 'CAN',
    'CANS': 'CAN',
    'TINS': 'CAN',
    'SACK': 'BAG',
    'SACKS': 'BAG',
    'BAGS': 'BAG',
    'BDL': 'BUNDLE',
    'BUNDLES': 'BUNDLE',
    'BUNCH': 'BUNDLE',
    'DZ': 'DOZEN',
    'DOZENS': 'DOZEN',
    'PAIRS': 'PAIR',
    'SETS': 'SET',
    'ROLLS': 'ROLL',
    'PLT': 'PALLET',
    'PALLETS': 'PALLET',

    // Weight aliases
    'KILOGRAM': 'KG',
    'KILOGRAMS': 'KG',
    'KGS': 'KG',
    'GRAM': 'G',
    'GRAMS': 'G',
    'MILLIGRAM': 'MG',
    'MILLIGRAMS': 'MG',
    'MGS': 'MG',
    'POUND': 'LB',
    'POUNDS': 'LB',
    'LBS': 'LB',
    'OUNCE': 'OZ',
    'OUNCES': 'OZ',
    'QUINTAL': 'QTL',
    'QUINTALS': 'QTL',
    'QTLS': 'QTL',
    'TONS': 'TON',

    // Volume aliases
    'LITRE': 'L',
    'LITRES': 'L',
    'LITER': 'L',
    'LITERS': 'L',
    'LS': 'L',
    'MILLILITRE': 'ML',
    'MILLILITRES': 'ML',
    'MILLILITER': 'ML',
    'MILLILITERS': 'ML',
    'MLS': 'ML',
    'CENTILITRE': 'CL',
    'CENTILITRES': 'CL',
    'GALLON': 'GAL',
    'GALLONS': 'GAL',
    'GALS': 'GAL',
    'FL.OZ': 'FL_OZ',
    'FLUID OUNCE': 'FL_OZ',
    'FLUID OUNCES': 'FL_OZ',

    // Length aliases
    'METRE': 'M',
    'METRES': 'M',
    'METER': 'M',
    'METERS': 'M',
    'CENTIMETRE': 'CM',
    'CENTIMETRES': 'CM',
    'CENTIMETER': 'CM',
    'CENTIMETERS': 'CM',
};
