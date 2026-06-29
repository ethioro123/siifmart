import { Building, Wheat, User, ShoppingBag, Truck } from 'lucide-react';
import { SupplierType } from '../../types';

export const getSupplierIcon = (type: SupplierType) => {
    switch (type) {
        case 'Business': return Building;
        case 'Farmer': return Wheat;
        case 'Individual': return User;
        case 'One-Time': return ShoppingBag;
        default: return Truck;
    }
};

export const CATEGORY_ATTRIBUTES: Record<string, { key: string; label: string; type: string; placeholder?: string; options?: string[] }[]> = {
    // FRESH PRODUCE
    'Fresh Produce': [
        { key: 'origin', label: 'Origin', type: 'text', placeholder: 'e.g., California, Mexico' },
        { key: 'grade', label: 'Grade', type: 'select', options: ['Premium', 'Standard', 'Economy', 'Organic'] },
        { key: 'expiry', label: 'Shelf Life', type: 'text', placeholder: 'Days' },
    ],
    'Dairy & Eggs': [
        { key: 'fatContent', label: 'Fat Content', type: 'text', placeholder: 'Full, Low, Skim' },
        { key: 'origin', label: 'Source', type: 'text', placeholder: 'Local Farm' },
    ],

    // MEAT
    'Meat & Poultry': [
        { key: 'cut', label: 'Cut Type', type: 'text', placeholder: 'Ribeye, Breast...' },
        { key: 'grade', label: 'Grade', type: 'text', placeholder: 'Prime, Choice...' },
        { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Country/Region' },
    ],

    // BEVERAGES
    'Beverages': [
        { key: 'volume', label: 'Volume', type: 'text', placeholder: '330ml, 1L' },
        { key: 'packaging', label: 'Packaging', type: 'select', options: ['Can', 'Bottle', 'Carton', 'Keg'] },
        { key: 'packs', label: 'Packs/Case', type: 'number', placeholder: '12, 24' },
    ],

    // PANTRY
    'Pantry & Dry Goods': [
        { key: 'packSize', label: 'Pack Size', type: 'text', placeholder: '500g, 1kg' },
        { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand Name' },
    ],

    // INDUSTRIAL
    'Industrial': [
        { key: 'material', label: 'Material', type: 'text', placeholder: 'Steel, Plastic...' },
        { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'LxWxH' },
        { key: 'weight', label: 'Weight', type: 'text', placeholder: '5kg, 10kg' },
    ],
    'Automotive': [
        { key: 'fitment', label: 'Fitment', type: 'text', placeholder: 'Universal, Toyota...' },
        { key: 'partNumber', label: 'Part #', type: 'text', placeholder: 'OEM number' },
    ],

    // DEFAULT - Minimal fields
    '_default': [
        { key: 'description', label: 'Description', type: 'text', placeholder: 'Additional details' },
    ],
};

export const getCategoryAttributes = (category: string) => {
    // Map specific categories to generalized attribute groups
    if (["Fruit & Vegetables"].includes(category)) {
        return CATEGORY_ATTRIBUTES['Fresh Produce'];
    }
    if (["Dairy, Eggs & Fridge"].includes(category)) {
        return CATEGORY_ATTRIBUTES['Dairy & Eggs'];
    }
    if (["Meat & Poultry", "Seafood"].includes(category)) {
        return CATEGORY_ATTRIBUTES['Meat & Poultry'];
    }
    if (["Drinks & Beverages"].includes(category)) {
        return CATEGORY_ATTRIBUTES['Beverages'];
    }
    if (["Snacks & Confectionery", "Baking & Dessert Needs", "Grains, Pasta & Rice", "Sauces, Oils & Condiments", "Canned Food & Soups", "Breakfast & Cereals", "Tea, Coffee & Cocoa"].includes(category)) {
        return CATEGORY_ATTRIBUTES['Pantry & Dry Goods'];
    }
    return CATEGORY_ATTRIBUTES[category] || CATEGORY_ATTRIBUTES['_default'];
};

export const PRODUCT_CATEGORIES = {
    "Fresh Food & Deli": [
        "Fruit & Vegetables",
        "Dairy, Eggs & Fridge",
        "Meat & Poultry",
        "Seafood",
        "Bakery & Bread",
        "Deli & Prepared Meals"
    ],
    "Pantry & Groceries": [
        "Snacks & Confectionery",
        "Baking & Dessert Needs",
        "Grains, Pasta & Rice",
        "Sauces, Oils & Condiments",
        "Canned Food & Soups",
        "Breakfast & Cereals",
        "Tea, Coffee & Cocoa",
        "Drinks & Beverages"
    ],
    "Frozen Food": [
        "Frozen Meals & Sides",
        "Frozen Vegetables & Fruit",
        "Ice Cream & Desserts"
    ],
    "Baby & Toddler": [
        "Baby Food & Formula",
        "Nappies, Wipes & Toiletries"
    ],
    "Health & Beauty": [
        "Dental & Oral Care",
        "Hair & Body Care",
        "Cosmetics & Skin Care",
        "Vitamins & Supplements",
        "Pharmacy & First Aid"
    ],
    "Household & Cleaning": [
        "Laundry & Dishwashing",
        "Cleaning Products & Tools",
        "Tissues, Paper & Foils",
        "Pest Control & Garden Care"
    ],
    "Pet Supplies": [
        "Dog Food & Accessories",
        "Cat Food & Accessories",
        "Small Pet Supplies"
    ],
    "General Merchandise & Apparel": [
        "Stationery, Office & Books",
        "Electronics & Batteries",
        "Homewares, Kitchen & Dining",
        "Clothing & Accessories",
        "Toys & Recreation"
    ]
};

// Re-export the new structured unit system
export { SELL_UNITS, getSellUnit, isDecimalAllowed, needsQuantityPrompt, getGroupedUnits, formatQuantityWithUnit, formatPricePerUnit, validateQuantity, normalizeQuantity } from '../../utils/units';
import { SELL_UNITS } from '../../utils/units';

// Backward compatibility — old code referencing UNIT_TYPES gets the code strings
export const UNIT_TYPES = SELL_UNITS.map(u => u.code);

export const PACKAGE_TYPES = [
    'Bottle', 'Can', 'Jar', 'Box', 'Bag', 'Pouch', 'Carton', 'Tray', 'Wrap', 'Crate', 'Drum', 'Keg'
];

export const STORAGE_CONDITIONS = [
    'Ambient (Dry)', 'Chilled (Refrigerated)', 'Frozen', 'Heated', 'Hazardous'
];
export const formatPOItemDescription = (item: any) => {
    const physicalWeight = item.customAttributes?.physical?.netWeight || item.size;
    const physicalType = item.customAttributes?.physical?.sizeType || item.customAttributes?.physical?.unit || 
                         (item.unit && !['UNIT', 'PACK', 'DOZEN'].includes(item.unit.toUpperCase().trim()) ? item.unit : '');

    return [
        // Only show brand if it's not already in the product name
        (item.brand && !item.productName.toLowerCase().startsWith(item.brand.toLowerCase())) ? item.brand : null,
        item.productName,
        item.customAttributes?.identity?.variant,
        physicalWeight ? `${physicalWeight}${physicalType}` : '',
    ].filter(Boolean).join(' ') + (
            (item.packQuantity && item.packQuantity > 1)
                ? ` – Pack of ${item.packQuantity}`
                : ''
        ) + (
            (item.customAttributes?.packaging?.packageType)
                ? ` (${item.customAttributes.packaging.packageType})`
                : ''
        );
};

/**
 * Format a Product name for display (Inventory, POS, etc.)
 * Mirrors formatPOItemDescription but works with Product objects that use `name` instead of `productName`.
 */
export const formatProductDisplayName = (product: { name: string; brand?: string; size?: string; unit?: string; packQuantity?: number; customAttributes?: any }) => {
    const parts: string[] = [];

    // Only show brand if it's not already in the product name
    if (product.brand && !product.name.toLowerCase().startsWith(product.brand.toLowerCase())) {
        parts.push(product.brand);
    }

    parts.push(product.name);

    // Append size+unit if present and not already in the name
    const physicalWeight = product.customAttributes?.physical?.netWeight || product.size;
    const physicalType = product.customAttributes?.physical?.sizeType || product.customAttributes?.physical?.unit || 
                         (product.unit && !['UNIT', 'PACK', 'DOZEN'].includes(product.unit.toUpperCase().trim()) ? product.unit : '');

    if (physicalWeight) {
        const sizeUnit = `${physicalWeight}${physicalType}`;
        const normalizedName = product.name.replace(/\s+/g, '').toLowerCase();
        const normalizedSizeUnit = sizeUnit.replace(/\s+/g, '').toLowerCase();
        if (!normalizedName.includes(normalizedSizeUnit)) {
            parts.push(sizeUnit);
        }
    }

    let result = parts.filter(Boolean).join(' ');

    if (product.packQuantity && product.packQuantity > 1) {
        result += ` – Pack of ${product.packQuantity}`;
    }

    return result;
};
