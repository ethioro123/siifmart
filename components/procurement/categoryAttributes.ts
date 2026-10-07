export interface CategoryAttributeField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    helperText?: string;
    colSpan?: 1 | 2 | 3 | 4 | 6; // out of 6-col grid
}

export interface CategorySpecGroup {
    id: string;
    domainTitle: string;
    iconType: 'cpu' | 'shirt' | 'apple' | 'shield-check' | 'milk' | 'coffee' | 'layers' | 'sparkles' | 'baby' | 'car' | 'tag';
    badgeLabel: string;
    description: string;
    fields: CategoryAttributeField[];
}

export const CATEGORY_SPEC_GROUPS: Record<string, CategorySpecGroup> = {
    electronics: {
        id: 'electronics',
        domainTitle: 'Consumer Electronics & Hardware Specs',
        iconType: 'cpu',
        badgeLabel: 'GS1 Tech Attributes',
        description: 'Technical specifications, connectivity, battery, and hardware identifiers',
        fields: [
            { key: 'modelNumber', label: 'Model / MPN', type: 'text', placeholder: 'e.g. B08KTZ8249, SM-A146P', colSpan: 2 },
            { key: 'screenSize', label: 'Display / Screen Size', type: 'text', placeholder: 'e.g. 6.8" E-Ink, 6.5" OLED', colSpan: 2 },
            { key: 'storageRam', label: 'Storage & RAM Capacity', type: 'text', placeholder: 'e.g. 16GB, 8GB RAM / 128GB ROM', colSpan: 2 },
            { key: 'batteryType', label: 'Battery Specifications', type: 'text', placeholder: 'e.g. Built-in Li-Ion (Weeks battery), 5000 mAh', colSpan: 2 },
            { key: 'connectivity', label: 'Connectivity / Interfaces', type: 'select', options: ['Wi-Fi + Bluetooth', 'USB-C', 'Wi-Fi Only', 'Bluetooth Only', '4G LTE / 5G Cellular', 'HDMI / DisplayPort', 'Wired Only'], colSpan: 2 },
            { key: 'voltage', label: 'Operating Power / Voltage', type: 'text', placeholder: 'e.g. 5V/2A, 65W USB-PD, 220V', colSpan: 1 },
            { key: 'warrantyPeriod', label: 'Warranty Coverage', type: 'select', options: ['12 Months Standard', '24 Months Extended', '6 Months Limited', 'No Warranty'], colSpan: 1 },
        ]
    },
    apparel: {
        id: 'apparel',
        domainTitle: 'Apparel, Footwear & Fashion Specs',
        iconType: 'shirt',
        badgeLabel: 'Soft Goods Master',
        description: 'Sizing, demographic cut, fiber composition, and laundering instructions',
        fields: [
            { key: 'apparelSize', label: 'Apparel Size / Fitment', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size / Free Size', '28', '30', '32', '34', '36', '38', '40', '42'], colSpan: 2 },
            { key: 'genderFit', label: 'Demographic Cut', type: 'select', options: ['Unisex', 'Men', 'Women', 'Boys / Girls', 'Toddler / Infant'], colSpan: 2 },
            { key: 'fabricMaterial', label: 'Fiber / Material', type: 'text', placeholder: 'e.g. 100% Combed Cotton, Denim, Linen', colSpan: 2 },
            { key: 'apparelColor', label: 'Colorway / Pattern', type: 'text', placeholder: 'e.g. Jet Black, Heather Grey, Navy', colSpan: 2 },
            { key: 'careInstructions', label: 'Laundering & Care', type: 'select', options: ['Machine Wash Normal', 'Machine Wash Cold (30°C)', 'Hand Wash Only', 'Dry Clean Only', 'Do Not Tumble Dry'], colSpan: 2 },
            { key: 'seasonStyle', label: 'Collection / Style', type: 'text', placeholder: 'e.g. Core Basic, Summer 2026', colSpan: 2 },
        ]
    },
    fresh_produce: {
        id: 'fresh_produce',
        domainTitle: 'Fresh Produce & Agricultural Specs',
        iconType: 'apple',
        badgeLabel: 'Agri Cold Chain',
        description: 'Cultivar variety, commercial grade, origin, and cold chain handling',
        fields: [
            { key: 'origin', label: 'Sourcing Origin / Farm', type: 'text', placeholder: 'e.g. Bishan Gari Farms, Rift Valley', colSpan: 2 },
            { key: 'grade', label: 'Quality Grade', type: 'select', options: ['Grade A / Premium Export', 'Standard Retail', 'Economy / Processing', 'Certified Organic'], colSpan: 2 },
            { key: 'ripenessVariety', label: 'Variety / Cultivar', type: 'text', placeholder: 'e.g. Hass, Red Fuji, Cavendish, Roma', colSpan: 2 },
            { key: 'perishableStorage', label: 'Cold Chain Protocol', type: 'select', options: ['Chilled (2°C to 4°C)', 'Cool Cellar (10°C to 15°C)', 'Ambient Dry'], colSpan: 2 },
            { key: 'shelfLifeDays', label: 'Shelf Life Window', type: 'text', placeholder: 'e.g. 7 Days, 14 Days', colSpan: 2 },
            { key: 'organicCert', label: 'Certification', type: 'select', options: ['Conventional Standard', 'Certified Organic', 'Global GAP Certified'], colSpan: 2 },
        ]
    },
    meat_poultry: {
        id: 'meat_poultry',
        domainTitle: 'Meat, Poultry & Seafood Specs',
        iconType: 'shield-check',
        badgeLabel: 'Halal Meat Master',
        description: 'Butchery cut, slaughter compliance, Halal certification, and thermal state',
        fields: [
            { key: 'cutType', label: 'Butchery Cut Type', type: 'text', placeholder: 'e.g. Bone-In Ribeye, Boneless Breast, Whole Bird', colSpan: 2 },
            { key: 'grade', label: 'Quality Grade', type: 'select', options: ['Prime / Superior', 'Choice', 'Standard Retail'], colSpan: 2 },
            { key: 'halalCertified', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal (Mandatory)', 'Government Veterinary Certified'], colSpan: 2 },
            { key: 'origin', label: 'Abattoir / Source Region', type: 'text', placeholder: 'e.g. Mojo Export Abattoir, Adama', colSpan: 2 },
            { key: 'chilledState', label: 'Thermal State', type: 'select', options: ['Fresh Chilled (0°C to 2°C)', 'Deep Frozen (-18°C or below)', 'Blast Frozen'], colSpan: 2 },
            { key: 'fatRatio', label: 'Lean / Fat Ratio', type: 'text', placeholder: 'e.g. 85/15 Lean, 90/10, Skinless', colSpan: 2 },
        ]
    },
    dairy_eggs: {
        id: 'dairy_eggs',
        domainTitle: 'Dairy, Eggs & Refrigerated Specs',
        iconType: 'milk',
        badgeLabel: 'Chilled Dairy',
        description: 'Milk fat levels, pasteurization, source animal, and temperature control',
        fields: [
            { key: 'fatContent', label: 'Milk Fat Level', type: 'select', options: ['Full Cream / Whole (3.5%)', 'Low Fat (1.5%)', 'Skim / Fat-Free (<0.5%)', 'Double Cream (40%)'], colSpan: 2 },
            { key: 'dairyTreatment', label: 'Pasteurization / Treatment', type: 'select', options: ['Pasteurized Fresh Chilled', 'UHT Long-Life', 'Sterilized', 'Cultured / Fermented'], colSpan: 2 },
            { key: 'sourceAnimal', label: 'Milk Source / Egg Size', type: 'select', options: ['Cow Milk', 'Goat Milk', 'Large Eggs (Grade A)', 'Jumbo Eggs', 'Plant-Based (Oat/Soy/Almond)'], colSpan: 2 },
            { key: 'origin', label: 'Dairy Plant / Producer', type: 'text', placeholder: 'e.g. Brookside Dairy, Lame Dairy', colSpan: 2 },
            { key: 'shelfLifeDays', label: 'Shelf Life (Days)', type: 'text', placeholder: 'e.g. 14 Days Chilled, 90 Days UHT', colSpan: 2 },
            { key: 'storageTemp', label: 'Storage Temperature', type: 'select', options: ['Keep Refrigerated (2°C to 4°C)', 'Store Below 6°C', 'Cool Ambient (Pre-Open)'], colSpan: 2 },
        ]
    },
    beverages: {
        id: 'beverages',
        domainTitle: 'Beverages & Liquid Refreshment',
        iconType: 'coffee',
        badgeLabel: 'Non-Alcoholic Halal',
        description: 'Container packaging, carbonation, sugar profile, and Halal non-alcoholic verification',
        fields: [
            { key: 'beverageType', label: 'Beverage Category', type: 'select', options: ['Mineral / Spring Water', '100% Pure Fruit Juice', 'Carbonated Soft Drink', 'Energy / Sports Drink', 'RTD Tea & Coffee', 'Flavored Still Drink'], colSpan: 2 },
            { key: 'containerType', label: 'Container Package', type: 'select', options: ['PET Plastic Bottle', 'Aluminium Sleek Can', 'Standard Aluminium Can', 'Glass Bottle', 'Tetra Pak Carton'], colSpan: 2 },
            { key: 'sugarContent', label: 'Sugar / Sweetener Profile', type: 'select', options: ['Zero Sugar / Diet', 'No Added Sugar (Natural)', 'Low Sugar', 'Standard Sweetened'], colSpan: 2 },
            { key: 'servingVolume', label: 'Single Serving Volume', type: 'text', placeholder: 'e.g. 330 ml, 500 ml, 1 Litre, 1.5 Litre', colSpan: 2 },
            { key: 'zeroAlcoholGuarantee', label: 'Zero Alcohol Compliance', type: 'select', options: ['100% Non-Alcoholic (SIIFMART Halal Policy)', 'Certified 0.0% Alcohol-Free'], colSpan: 2 },
            { key: 'carbonation', label: 'Carbonation Level', type: 'select', options: ['Still / Non-Carbonated', 'Carbonated / Sparkling', 'Lightly Sparkling'], colSpan: 2 },
        ]
    },
    pantry_groceries: {
        id: 'pantry_groceries',
        domainTitle: 'Pantry, Dry Foods & Commodities',
        iconType: 'layers',
        badgeLabel: 'Ambient Dry Goods',
        description: 'Dietary certifications, grain varieties, processing, and allergens',
        fields: [
            { key: 'dietaryCert', label: 'Dietary Compliance', type: 'select', options: ['100% Halal Certified', 'Gluten-Free', 'Vegetarian', 'Vegan', 'Non-GMO Verified'], colSpan: 2 },
            { key: 'grainVariety', label: 'Grain / Crop / Oil Type', type: 'text', placeholder: 'e.g. Extra Long Basmati, Sunflower Seed, Arabica Grade 1', colSpan: 2 },
            { key: 'roastOrProcessing', label: 'Processing / Roast', type: 'text', placeholder: 'e.g. Cold Pressed, Medium Dark Roast, Parboiled', colSpan: 2 },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. None, Contains Gluten, Contains Peanuts/Soy', colSpan: 2 },
            { key: 'origin', label: 'Country / Region', type: 'text', placeholder: 'e.g. Yirgacheffe Ethiopia, Kenya Rift, Thailand', colSpan: 2 },
            { key: 'cookingPrepTime', label: 'Preparation / Instructions', type: 'text', placeholder: 'e.g. Cook 12-15 min, Ready to Eat, Brew 4 min', colSpan: 2 },
        ]
    },
    household_cleaning: {
        id: 'household_cleaning',
        domainTitle: 'Household & Cleaning Safety Specs',
        iconType: 'sparkles',
        badgeLabel: 'Home & Chemical Care',
        description: 'Formulation, target surface, scent, and safety hazard classification',
        fields: [
            { key: 'cleaningForm', label: 'Physical Formulation', type: 'select', options: ['Liquid Concentrate', 'Washing Powder', 'Unit Dose Pods / Capsules', 'Trigger Spray', 'Surface Wipes', 'Solid Soap Bar'], colSpan: 2 },
            { key: 'surfaceApplication', label: 'Primary Surface Target', type: 'select', options: ['Automatic Laundry Machine', 'Hand Wash Laundry', 'Dishwashing & Cutlery', 'Multi-Surface & Floors', 'Glass & Mirrors', 'Bathroom & Toilet Descaler'], colSpan: 2 },
            { key: 'scentFragrance', label: 'Fragrance / Scent', type: 'text', placeholder: 'e.g. Fresh Lavender, Lemon Breeze, Free & Unscented', colSpan: 2 },
            { key: 'washLoadsCount', label: 'Loads / Yield Count', type: 'text', placeholder: 'e.g. 40 Washes, 80 Uses, 500 Sprays', colSpan: 2 },
            { key: 'hazardSafety', label: 'Safety Classification', type: 'select', options: ['Household Safe / Non-Corrosive', 'Eye Irritant - Keep Out of Reach of Children', 'Corrosive Acid / Bleach - Wear Gloves', 'Flammable Aerosol'], colSpan: 2 },
            { key: 'ecoFriendly', label: 'Environmental Formulation', type: 'select', options: ['Standard Formulation', 'Phosphate-Free & Biodegradable', 'Plant-Based Surfactants'], colSpan: 2 },
        ]
    },
    baby_toddler: {
        id: 'baby_toddler',
        domainTitle: 'Baby, Infant & Pediatric Care',
        iconType: 'baby',
        badgeLabel: 'Pediatric Grade',
        description: 'Stage age group, formula types, diaper sizing, and pediatric safety',
        fields: [
            { key: 'babyStage', label: 'Age Formulation Stage', type: 'select', options: ['Stage 1: Infant (0 - 6 Months)', 'Stage 2: Follow-on (6 - 12 Months)', 'Stage 3: Growing Up (1 - 3 Years)', 'All Ages / Toddler'], colSpan: 2 },
            { key: 'diaperOrFeedSize', label: 'Size / Piece Count', type: 'text', placeholder: 'e.g. Size 3 (6-10 kg) • 64 Count, 800g Tin', colSpan: 2 },
            { key: 'specialDietFormula', label: 'Formulation Type', type: 'select', options: ['Standard Enriched', 'Lactose-Free', 'Gentle / Hypoallergenic', 'Organic Milk Based', 'Soy / Plant-Based'], colSpan: 2 },
            { key: 'hypoallergenicCert', label: 'Pediatric Safety', type: 'select', options: ['Dermatologically Tested', 'Pediatrician Approved', 'Hypoallergenic Fragrance-Free'], colSpan: 2 },
            { key: 'shelfLifeDays', label: 'Sealed Shelf Life', type: 'text', placeholder: 'e.g. 720 Days (2 Years)', colSpan: 2 },
            { key: 'preparedFeeding', label: 'Preparation Directive', type: 'text', placeholder: 'e.g. Boiled Water 40°C, Use within 1 hr', colSpan: 2 },
        ]
    },
    health_beauty: {
        id: 'health_beauty',
        domainTitle: 'Health, Beauty & Personal Care',
        iconType: 'sparkles',
        badgeLabel: 'Cosmetics / Skincare',
        description: 'Skin & hair targets, active ingredients, SPF rating, and PAO',
        fields: [
            { key: 'skinHairTarget', label: 'Skin / Hair Compatibility', type: 'select', options: ['All Skin Types', 'Sensitive Skin', 'Dry & Dehydrated', 'Oily / Blemish Prone', 'Color-Treated Hair'], colSpan: 2 },
            { key: 'activeActives', label: 'Key Active Ingredients', type: 'text', placeholder: 'e.g. Niacinamide 10%, Hyaluronic Acid, Shea Butter', colSpan: 2 },
            { key: 'spfSunscreen', label: 'SPF Sun Protection', type: 'select', options: ['None / Not Applicable', 'SPF 15 Daily', 'SPF 30 Broad Spectrum', 'SPF 50+ UVA/UVB', 'SPF 50+ Water Resistant'], colSpan: 2 },
            { key: 'scentFragrance', label: 'Scent / Aroma', type: 'text', placeholder: 'e.g. Rose Water, Fresh Citrus, Fragrance-Free', colSpan: 2 },
            { key: 'dermatologyTested', label: 'Safety Testing', type: 'select', options: ['Dermatologically Tested', 'Cruelty-Free / Vegan', 'Hypoallergenic Certified'], colSpan: 2 },
            { key: 'paorPeriod', label: 'PAO (Period After Opening)', type: 'select', options: ['6 Months (6M)', '12 Months (12M)', '24 Months (24M)', 'Single Use'], colSpan: 2 },
        ]
    },
    automotive_industrial: {
        id: 'automotive_industrial',
        domainTitle: 'Automotive & Industrial Engineering Specs',
        iconType: 'car',
        badgeLabel: 'Technical / OEM Parts',
        description: 'Vehicle compatibility, OEM part numbers, fitment, and load ratings',
        fields: [
            { key: 'vehicleFitment', label: 'Vehicle Fitment / Compatibility', type: 'text', placeholder: 'e.g. Toyota Hilux / Land Cruiser 1HZ, Universal 12V', colSpan: 2 },
            { key: 'oemPartNumber', label: 'OEM / Part Number', type: 'text', placeholder: 'e.g. 90915-YZZD2, 17801-67070', colSpan: 2 },
            { key: 'partPosition', label: 'Fitment Position', type: 'select', options: ['Universal / Engine Bay', 'Front Axle', 'Rear Axle', 'Left Side', 'Right Side', 'Cabin Interior'], colSpan: 2 },
            { key: 'materialGrade', label: 'Material Grade / Composition', type: 'text', placeholder: 'e.g. Forged Steel, Synthetic Element, Ceramic', colSpan: 2 },
            { key: 'voltageLoad', label: 'Electrical / Load Capacity', type: 'text', placeholder: 'e.g. 12V 70Ah, 2000 kg WLL', colSpan: 2 },
            { key: 'certificationStandard', label: 'Compliance Standard', type: 'text', placeholder: 'e.g. ISO 9001, KEBS / ECA Standard, SAE J517', colSpan: 2 },
        ]
    },
    general_merchandise: {
        id: 'general_merchandise',
        domainTitle: 'General Merchandise Specifications',
        iconType: 'tag',
        badgeLabel: 'General Master',
        description: 'General retail master specs, materials, and warranty',
        fields: [
            { key: 'modelNumber', label: 'Model / Item Number', type: 'text', placeholder: 'e.g. Model / Item #', colSpan: 2 },
            { key: 'variantStyle', label: 'Variant / Color / Style', type: 'text', placeholder: 'e.g. Red, Large, Pack of 3', colSpan: 2 },
            { key: 'materialType', label: 'Primary Material', type: 'text', placeholder: 'e.g. Plastic, Wood, Metal, Glass', colSpan: 2 },
            { key: 'warranty', label: 'Warranty / Guarantee', type: 'text', placeholder: 'e.g. 1 Year, 6 Months, None', colSpan: 2 },
            { key: 'targetUsage', label: 'Recommended Application', type: 'text', placeholder: 'e.g. Home, Office, Commercial', colSpan: 2 },
            { key: 'keyNotes', label: 'Technical Notes', type: 'text', placeholder: 'Additional specifications', colSpan: 2 },
        ]
    }
};

/**
 * Maps any category/subcategory string to the optimal CategorySpecGroup
 */
export const getCategorySpecGroup = (category?: string, subcategory?: string): CategorySpecGroup => {
    const combined = `${category || ''} ${subcategory || ''}`.toLowerCase();

    // Beverages takes priority (e.g. Drinks & Beverages under Pantry & Groceries)
    if (/drink|beverage|juice|soda|water|soft drink/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.beverages;
    }
    if (/electronics|batter|gadget|computer|phone|kindle|e-reader|display|audio|hardware/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.electronics;
    }
    if (/cloth|apparel|\bwear\b|shirt|trouser|\bpants?\b|dress|shoe|footwear|sock|jacket|uniform|fashion/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.apparel;
    }
    if (/fruit|vegetable|produce|greens/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.fresh_produce;
    }
    if (/meat|poultry|beef|chicken|mutton|lamb|seafood|fish|abattoir/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.meat_poultry;
    }
    if (/dairy|egg|milk|cheese|butter|yogurt|cream/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.dairy_eggs;
    }
    if (/baby|toddler|napp|diaper|infant|formula/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.baby_toddler;
    }
    if (/beauty|cosmetic|skin|hair|oral|dental|vitamin|pharmacy|lotion|shampoo/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.health_beauty;
    }
    if (/cleaning|laundry|household|detergent|tissue|pest|dishwash/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.household_cleaning;
    }
    if (/pantry|grain|rice|pasta|snack|cereal|baking|sauce|oil|tea|coffee|condiment|canned|flour|sugar/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.pantry_groceries;
    }
    if (/auto|vehicle|car|motor|industrial|hardware|tool|spare/i.test(combined)) {
        return CATEGORY_SPEC_GROUPS.automotive_industrial;
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

export interface POItemCategorySpecsSummary {
    domainTitle: string;
    badgeLabel: string;
    specs: { label: string; value: string }[];
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
    const subcategory = attrs?.identity?.subcategory || '';

    const specGroup = getCategorySpecGroup(category, subcategory);
    const catSpecific = attrs?.categorySpecific || {};

    const specs: { label: string; value: string }[] = [];

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
            specs.push({ label: cleanLabel, value: String(val) });
        }
    }

    const summaryText = specs.length > 0 ? specs.map(s => `${s.label}: ${s.value}`).join(' • ') : null;

    return {
        domainTitle: specGroup.domainTitle,
        badgeLabel: specGroup.badgeLabel,
        specs,
        summaryText
    };
};

