import {
    CategoryAttributeField,
    CategorySpecGroup,
    CategoryFieldRole,
    CATEGORY_SPEC_GROUPS
} from './categorySpecGroups';

export type {
    CategoryAttributeField,
    CategorySpecGroup,
    CategoryFieldRole
};

export { CATEGORY_SPEC_GROUPS };

/**
 * Maps subcategory directly to CategorySpecGroup
 */
const SUBCATEGORY_TO_GROUP: Record<string, string> = {
    // Snacks & Confectionery
    'snacks & confectionery': 'confectionery_snacks',
    'confectionery': 'confectionery_snacks',
    'snacks': 'confectionery_snacks',

    // Bakery & Deli
    'bakery & bread': 'bakery_deli',
    'deli & prepared meals': 'bakery_deli',
    'bakery': 'bakery_deli',
    'deli': 'bakery_deli',

    // Frozen Food
    'frozen meals & sides': 'frozen_food',
    'frozen vegetables & fruit': 'frozen_food',
    'ice cream & desserts': 'frozen_food',
    'frozen food': 'frozen_food',

    // Fresh Produce
    'fruit & vegetables': 'fresh_produce',
    'fresh produce': 'fresh_produce',

    // Dairy & Eggs
    'dairy, eggs & fridge': 'dairy_eggs',
    'dairy & eggs': 'dairy_eggs',

    // Meat, Poultry & Seafood
    'meat & poultry': 'meat_poultry',
    'seafood': 'meat_poultry',

    // Beverages
    'drinks & beverages': 'beverages',
    'beverages': 'beverages',

    // Baby & Toddler
    'baby food & formula': 'baby_toddler',
    'nappies, wipes & toiletries': 'baby_toddler',

    // Health & Beauty
    'dental & oral care': 'health_beauty',
    'hair & body care': 'health_beauty',
    'cosmetics & skin care': 'health_beauty',
    'vitamins & supplements': 'health_beauty',
    'pharmacy & first aid': 'health_beauty',

    // Household & Cleaning
    'laundry & dishwashing': 'household_cleaning',
    'cleaning products & tools': 'household_cleaning',
    'tissues, paper & foils': 'household_cleaning',
    'pest control & garden care': 'household_cleaning',

    // Consumer Electronics & Tech Hardware
    'tech': 'electronics',
    'technology': 'electronics',
    'electronics': 'electronics',
    'consumer electronics': 'electronics',
    'consumer electronics & tech': 'electronics',
    'smartphones & mobile devices': 'electronics',
    'smartphones & tablets': 'electronics',
    'smartphones': 'electronics',
    'mobile phones': 'electronics',
    'phones': 'electronics',
    'computers & laptops': 'electronics',
    'laptops & computers': 'electronics',
    'computers': 'electronics',
    'laptops': 'electronics',
    'tablets & e-readers': 'electronics',
    'tablets': 'electronics',
    'wearables & smartwatches': 'electronics',
    'wearables': 'electronics',
    'smartwatches': 'electronics',
    'audio, headphones & speakers': 'electronics',
    'audio & headphones': 'electronics',
    'audio': 'electronics',
    'headphones': 'electronics',
    'batteries, chargers & power banks': 'electronics',
    'power banks & chargers': 'electronics',
    'batteries': 'electronics',
    'chargers & cables': 'electronics',
    'power banks': 'electronics',
    'displays, tvs & monitors': 'electronics',
    'displays & tvs': 'electronics',
    'tvs & displays': 'electronics',

    // Homewares & Kitchen Dining
    'homewares, kitchen & dining': 'homewares_kitchen',
    'homewares': 'homewares_kitchen',
    'kitchen & dining': 'homewares_kitchen',
    'kitchen': 'homewares_kitchen',
    'cookware': 'homewares_kitchen',
    'tableware': 'homewares_kitchen',

    // General Merchandise & Tech
    'stationery, office & books': 'stationery_toys',
    'toys & recreation': 'stationery_toys',
    'electronics & batteries': 'electronics',
    'clothing & accessories': 'apparel',

    // Pantry Dry Goods & Spices
    'baking & dessert needs': 'pantry_groceries',
    'grains, pasta & rice': 'pantry_groceries',
    'sauces, oils & condiments': 'pantry_groceries',
    'canned food & soups': 'pantry_groceries',
    'breakfast & cereals': 'pantry_groceries',
    'tea, coffee & cocoa': 'pantry_groceries',
    'spices & seasonings': 'pantry_groceries',
    'spices': 'pantry_groceries',
    'seasonings': 'pantry_groceries',
    'pantry & dry goods': 'pantry_groceries',
    'dry goods': 'pantry_groceries',
    'food': 'pantry_groceries',
    'international foods': 'pantry_groceries',
    'snacks & sweets': 'confectionery_snacks',
    'sweets': 'confectionery_snacks',
    'frozen foods': 'frozen_food',
    'beauty & personal care': 'health_beauty',
    'personal care': 'health_beauty',
    'household': 'household_cleaning'
};

const PARENT_CATEGORY_TO_GROUP: Record<string, string> = {
    'consumer electronics & tech': 'electronics',
    'consumer electronics': 'electronics',
    'electronics': 'electronics',
    'electronics & batteries': 'electronics',
    'fresh food & deli': 'fresh_produce',
    'fresh produce': 'fresh_produce',
    'pantry & groceries': 'pantry_groceries',
    'pantry & dry goods': 'pantry_groceries',
    'spices & seasonings': 'pantry_groceries',
    'food': 'pantry_groceries',
    'international foods': 'pantry_groceries',
    'frozen food': 'frozen_food',
    'frozen foods': 'frozen_food',
    'baby & toddler': 'baby_toddler',
    'health & beauty': 'health_beauty',
    'beauty & personal care': 'health_beauty',
    'household & cleaning': 'household_cleaning',
    'household': 'household_cleaning',
    'general merchandise & apparel': 'general_merchandise',
    'homewares, kitchen & dining': 'homewares_kitchen',
    'homewares': 'homewares_kitchen',
    'kitchen & dining': 'homewares_kitchen',
    'kitchen': 'homewares_kitchen',
    'beverages': 'beverages',
    'dairy & eggs': 'dairy_eggs',
    'meat & poultry': 'meat_poultry',
    'bakery & deli': 'bakery_deli',
    'bakery': 'bakery_deli',
    'snacks & confectionery': 'confectionery_snacks',
    'snacks & sweets': 'confectionery_snacks',
    'apparel': 'apparel',
    'clothing': 'apparel',
    'automotive': 'automotive_industrial',
    'industrial': 'automotive_industrial'
};

/**
 * Maps any category/subcategory string to the optimal CategorySpecGroup
 * Uses hierarchical taxonomy matching first, then robust word-boundary matching.
 */
export const getCategorySpecGroup = (category?: string, subcategory?: string): CategorySpecGroup => {
    const cleanSub = (subcategory || '').trim().toLowerCase();
    const cleanCat = (category || '').trim().toLowerCase();

    // 1. Direct subcategory lookup
    if (cleanSub && SUBCATEGORY_TO_GROUP[cleanSub]) {
        const groupId = SUBCATEGORY_TO_GROUP[cleanSub];
        if (CATEGORY_SPEC_GROUPS[groupId]) {
            return CATEGORY_SPEC_GROUPS[groupId];
        }
    }

    // 2. Direct category lookup
    if (cleanCat && SUBCATEGORY_TO_GROUP[cleanCat]) {
        const groupId = SUBCATEGORY_TO_GROUP[cleanCat];
        if (CATEGORY_SPEC_GROUPS[groupId]) {
            return CATEGORY_SPEC_GROUPS[groupId];
        }
    }
    if (cleanCat && PARENT_CATEGORY_TO_GROUP[cleanCat]) {
        const groupId = PARENT_CATEGORY_TO_GROUP[cleanCat];
        if (CATEGORY_SPEC_GROUPS[groupId]) {
            return CATEGORY_SPEC_GROUPS[groupId];
        }
    }

    const combined = `${category || ''} ${subcategory || ''}`.toLowerCase();

    // 3. Robust Regex Fallbacks (word boundaries to prevent partial matches like 'oil' in 'toilet' or 'car' in 'carpet')
    if (/\b(snack|confection|chocolate|candy|sweet|biscuit|cookie|wafer|crisp|toffee|gummy|chew)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.confectionery_snacks;
    }
    if (/\b(bakery|bread|pastry|cake|croissant|dough|deli|prepared meal)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.bakery_deli;
    }
    if (/\b(frozen|ice cream|icecream|gelato|sorbet|deep freeze)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.frozen_food;
    }
    if (/\b(stationery|office|toy|game|puzzle|book|paper|pencil|pen)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.stationery_toys;
    }
    if (/\b(beverage|drink|juice|soda|water|soft drink|syrup)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.beverages;
    }
    if (/\b(electronics?|tech|technology|batter(y|ies)?|gadgets?|computers?|laptops?|phones?|smartphones?|tablets?|kindle|e-readers?|displays?|tvs?|monitors?|audios?|headphones?|speakers?|hardware|screens?)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.electronics;
    }
    if (/\b(cloth|apparel|\bwear\b|shirt|trouser|\bpants?\b|dress|shoe|footwear|sock|jacket|uniform|fashion)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.apparel;
    }
    if (/\b(produce|fruit|vegetable|greens|herb)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.fresh_produce;
    }
    if (/\b(kitchen|cookware|tableware|pan|pot|cutlery|dish|mug|cup|plate|dining|homeware|utensil)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.homewares_kitchen;
    }
    if (/\b(meat|poultry|beef|chicken|mutton|lamb|seafood|fish|abattoir|goat)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.meat_poultry;
    }
    if (/\b(dairy|egg|milk|cheese|butter|yogurt|cream)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.dairy_eggs;
    }
    if (/\b(baby|toddler|napp|diaper|infant|formula|wipe|wipes)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.baby_toddler;
    }
    if (/\b(beauty|cosmetic|skin|hair|oral|dental|vitamin|pharmacy|lotion|shampoo)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.health_beauty;
    }
    if (/\b(cleaning|laundry|household|detergent|tissue|pest|dishwash|foil|paper towel)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.household_cleaning;
    }
    if (/\b(auto|vehicle|\bcar\b|motor|industrial|hardware|tool|spare)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.automotive_industrial;
    }
    if (/\b(pantry|grain|rice|pasta|cereal|baking|sauce|\boil\b|tea|coffee|condiment|canned|flour|sugar|spice|seasoning|soup|pulses?|beans?)\b/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.pantry_groceries;
    }

    return CATEGORY_SPEC_GROUPS.general_merchandise;
};

// Backwards-compatible legacy exports
export const CATEGORY_ATTRIBUTES: Record<string, { key: string; label: string; type: string; placeholder?: string; options?: string[] }[]> = {
    'Fresh Produce': CATEGORY_SPEC_GROUPS.fresh_produce.fields,
    'Dairy & Eggs': CATEGORY_SPEC_GROUPS.dairy_eggs.fields,
    'Meat & Poultry': CATEGORY_SPEC_GROUPS.meat_poultry.fields,
    'Beverages': CATEGORY_SPEC_GROUPS.beverages.fields,
    'Pantry & Dry Goods': CATEGORY_SPEC_GROUPS.pantry_groceries.fields,
    'Industrial': CATEGORY_SPEC_GROUPS.automotive_industrial.fields,
    'Automotive': CATEGORY_SPEC_GROUPS.automotive_industrial.fields,
    '_default': CATEGORY_SPEC_GROUPS.general_merchandise.fields,
};

export const getCategoryAttributes = (category: string) => {
    return getCategorySpecGroup(category).fields;
};

export const PRODUCT_CATEGORIES = {
    "Consumer Electronics & Tech": [
        "Electronics",
        "Smartphones & Mobile Devices",
        "Computers & Laptops",
        "Wearables & Smartwatches",
        "Audio, Headphones & Speakers",
        "Batteries, Chargers & Power Banks"
    ],
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
    "General Merchandise & Apparel": [
        "Stationery, Office & Books",
        "Electronics & Batteries",
        "Homewares, Kitchen & Dining",
        "Clothing & Accessories",
        "Toys & Recreation"
    ]
};

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
        'baby food & formula',
        'ice cream & desserts'
    ];
    return consumableKeywords.some(keyword => cat.includes(keyword));
};

export const isDiscreteGeneralMerch = (category?: string): boolean => {
    if (!category) return false;
    const cat = category.toLowerCase();
    const discreteKeywords = [
        'consumer electronics & tech',
        'consumer electronics',
        'general merchandise & apparel',
        'stationery, office & books',
        'stationery & office',
        'electronics & batteries',
        'electronics',
        'smartphones',
        'laptops',
        'wearables',
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

export interface POItemCategorySpecsSummary {
    domainTitle: string;
    badgeLabel: string;
    iconType: string;
    specs: { label: string; value: string; role?: CategoryFieldRole }[];
    summaryText: string | null;
}

/**
 * Extracts category-specific attributes from a PO item or product
 * and formats them into structured specs and a concise summary string.
 */
export const getPOItemCategorySpecsSummary = (item: any, allProducts?: any[]): POItemCategorySpecsSummary => {
    const matchedProduct = allProducts?.find(p => (item?.productId && p.id === item.productId) || (item?.sku && p.sku === item.sku) || (item?.productName && p.name === item.productName));
    const attrs = item?.customAttributes || item?.custom_attributes || matchedProduct?.customAttributes || (matchedProduct as any)?.custom_attributes;
    const category = item?.category || attrs?.identity?.category || matchedProduct?.category || '';
    const subcategory = item?.subcategory || attrs?.identity?.subcategory || (item as any)?.subCategory || '';

    const specGroup = getCategorySpecGroup(category, subcategory);
    const catSpecific = attrs?.categorySpecific || {};

    const specs: { label: string; value: string; role?: CategoryFieldRole }[] = [];

    for (const f of specGroup.fields) {
        let val = catSpecific[f.key];
        if (val === undefined || val === null || val === '') {
            if (f.key === 'modelNumber') val = attrs?.identity?.modelNumber;
            if (f.key === 'variantStyle') val = attrs?.identity?.variant;
            if (f.key === 'shelfLifeDays') val = attrs?.storage?.shelfLifeDays;
            if (f.key === 'scentFragrance') val = attrs?.descriptive?.scent;
        }
        if (val !== undefined && val !== null && val !== '' && val !== false) {
            const cleanLabel = f.label.replace(/\s*\(.*\)/, '').replace(/\s*\/.*$/, '').trim();
            specs.push({ label: cleanLabel, value: String(val), role: f.role });
        }
    }

    const summaryText = specs.length > 0 ? specs.map(s => `${s.label}: ${s.value}`).join(' • ') : null;

    return {
        domainTitle: specGroup.domainTitle,
        badgeLabel: specGroup.badgeLabel,
        iconType: specGroup.iconType,
        specs,
        summaryText
    };
};
