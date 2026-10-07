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

/**
 * Returns true if the product category represents consumables (food, beverages, pantry items, produce)
 * where physical size/weight (e.g. 500g, 1L, 2kg) is essential to distinguish the SKU and pricing.
 */
export const isConsumableCategory = (category?: string): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase();
    const consumableKeywords = [
        'fresh food & deli',
        'pantry & groceries',
        'pantry & dry goods',
        'frozen food',
        'baby & toddler',
        'fruit & vegetables',
        'fresh produce',
        'dairy, eggs & fridge',
        'dairy & eggs',
        'meat & poultry',
        'drinks & beverages',
        'beverages',
        'seafood',
        'bakery & bread',
        'deli & prepared meals',
        'snacks & confectionery',
        'baking & dessert needs',
        'grains, pasta & rice',
        'sauces, oils & condiments',
        'canned food & soups',
        'breakfast & cereals',
        'tea, coffee & cocoa',
        'baby food & formula'
    ];
    return consumableKeywords.some(keyword => cat.includes(keyword));
};

/**
 * Returns true if the product category represents discrete general merchandise
 * (electronics, appliances, apparel, stationery, hardware, automotive, books)
 * where physical net weight (e.g. 217g) is a technical spec rather than part of the product name.
 */
export const isDiscreteGeneralMerch = (category?: string): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase();
    const discreteKeywords = [
        'general merchandise & apparel',
        'stationery, office & books',
        'stationery & office',
        'electronics & batteries',
        'electronics',
        'homewares, kitchen & dining',
        'clothing & accessories',
        'clothing',
        'apparel & accessories',
        'toys & recreation',
        'toys & games',
        'books & media',
        'industrial',
        'automotive',
        'hardware',
        'appliances'
    ];
    return discreteKeywords.some(keyword => cat.includes(keyword));
};

export const NET_CONTENT_UNITS = [
    { value: 'g', label: 'g (Gram)', group: 'Weight' },
    { value: 'kg', label: 'kg (Kilogram)', group: 'Weight' },
    { value: 'ml', label: 'ml (Millilitre)', group: 'Volume' },
    { value: 'L', label: 'L (Litre)', group: 'Volume' },
    { value: 'oz', label: 'oz (Ounce)', group: 'Weight' },
    { value: 'lb', label: 'lb (Pound)', group: 'Weight' },
    { value: 'fl oz', label: 'fl oz (Fluid Ounce)', group: 'Volume' },
    { value: 'pcs', label: 'pcs (Pieces / Count)', group: 'Count' },
] as const;
