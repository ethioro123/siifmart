export type CategoryFieldRole = 'display' | 'handling' | 'compliance' | 'receiving_check' | 'search_filter';

export interface CategoryAttributeField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    helperText?: string;
    colSpan?: 1 | 2 | 3 | 4 | 6; // out of 6-col grid
    role?: CategoryFieldRole;
}

export interface CategorySpecGroup {
    id: string;
    domainTitle: string;
    iconType: 'cpu' | 'shirt' | 'apple' | 'shield-check' | 'milk' | 'coffee' | 'layers' | 'sparkles' | 'baby' | 'car' | 'tag' | 'cookie' | 'sandwich' | 'snowflake' | 'dog' | 'book-open' | 'utensils';
    badgeLabel: string;
    description: string;
    fields: CategoryAttributeField[];
}

export const CATEGORY_SPEC_GROUPS: Record<string, CategorySpecGroup> = {
    // 1. Electronics & Tech Hardware (Kept simple, only necessary fields)
    electronics: {
        id: 'electronics',
        domainTitle: 'Electronics & Hardware Specs',
        iconType: 'cpu',
        badgeLabel: 'Tech Attributes',
        description: 'Device type, model, serial/IMEI tracking, specs, and warranty',
        fields: [
            { key: 'deviceType', label: 'Device Classification', type: 'select', options: ['Smartphones & Mobile Phones', 'Computers & Laptops', 'Audio, Headphones & Speakers', 'Power, Chargers & Batteries', 'Displays, TVs & Monitors', 'Wearables & Smartwatches', 'Other Electronics'], colSpan: 2, role: 'display' },
            { key: 'modelNumber', label: 'Model / MPN', type: 'text', placeholder: 'e.g. SM-A146P, A2848, B08KTZ8249', colSpan: 2, role: 'display' },
            { key: 'serialNumberTracking', label: 'Serial / IMEI Verification', type: 'select', options: ['Mandatory Serial / IMEI Scan', 'Batch Tracking Only', 'Standard EAN/UPC Only'], colSpan: 2, role: 'compliance' },
            { key: 'specsSummary', label: 'Key Specifications', type: 'text', placeholder: 'e.g. 128GB ROM / 8GB RAM, 6.7" OLED, 5000 mAh', colSpan: 2, role: 'display' },
            { key: 'plugType', label: 'Power / Plug Standard', type: 'select', options: ['Type G (UK / Kenya 3-Pin)', 'Type C/F (Euro / Ethiopia 2-Pin)', 'Universal USB-C Powered', 'Battery Operated / No Plug'], colSpan: 2, role: 'handling' },
            { key: 'warrantyPeriod', label: 'Warranty Coverage', type: 'select', options: ['12 Months Official Manufacturer', '24 Months Extended Warranty', '6 Months Limited Warranty', 'No Warranty'], colSpan: 2, role: 'display' },
        ]
    },

    // 2. Fresh Produce & Agriculture
    fresh_produce: {
        id: 'fresh_produce',
        domainTitle: 'Fresh Produce & Agriculture Specs',
        iconType: 'apple',
        badgeLabel: 'Agri Cold Chain',
        description: 'Cultivar variety, quality grade, farm origin, and storage protocol',
        fields: [
            { key: 'produceVariety', label: 'Variety / Cultivar', type: 'text', placeholder: 'e.g. Hass Avocado, Red Onion, Roma Tomato, Cavendish', colSpan: 2, role: 'display' },
            { key: 'grade', label: 'Quality Grade', type: 'select', options: ['Grade A / Premium Export', 'Standard Retail', 'Economy / Processing', 'Certified Organic'], colSpan: 2, role: 'display' },
            { key: 'origin', label: 'Sourcing Farm / Region', type: 'text', placeholder: 'e.g. Bishan Gari Farms, Rift Valley, Local Farm', colSpan: 2, role: 'display' },
            { key: 'storageTemp', label: 'Cold Chain Protocol', type: 'select', options: ['Chilled (2°C to 4°C)', 'Cool Cellar (10°C to 15°C)', 'Ambient Dry'], colSpan: 2, role: 'handling', required: true },
            { key: 'shelfLifeDays', label: 'Fresh Shelf Life (Days)', type: 'text', placeholder: 'e.g. 5 Days, 7 Days, 14 Days', colSpan: 2, role: 'handling' },
            { key: 'organicCert', label: 'Certification', type: 'select', options: ['Conventional Standard', 'Certified Organic', 'Global GAP Certified'], colSpan: 2, role: 'compliance' },
        ]
    },

    // 3. Dairy, Eggs & Refrigerated
    dairy_eggs: {
        id: 'dairy_eggs',
        domainTitle: 'Dairy, Eggs & Refrigerated Specs',
        iconType: 'milk',
        badgeLabel: 'Chilled Dairy',
        description: 'Classification, milk fat level, animal origin, and cold storage',
        fields: [
            { key: 'dairyClass', label: 'Dairy / Egg Classification', type: 'select', options: ['Fresh Pasteurized Milk', 'UHT Long-Life Milk', 'Yogurt & Fermented Drinks', 'Cheese & Curds', 'Butter & Ghee', 'Fresh Eggs (Grade A)'], colSpan: 2, role: 'display' },
            { key: 'fatContent', label: 'Milk Fat / Egg Size', type: 'select', options: ['Full Cream / Whole (3.5%)', 'Low Fat (1.5%)', 'Skim / Fat-Free (<0.5%)', 'Large Eggs (Grade A)', 'Jumbo Eggs'], colSpan: 2, role: 'display' },
            { key: 'sourceAnimal', label: 'Source Animal / Base', type: 'select', options: ['Cow Milk', 'Goat Milk', 'Camel Milk', 'Plant-Based (Oat/Soy/Almond)'], colSpan: 2, role: 'display' },
            { key: 'origin', label: 'Dairy Plant / Producer', type: 'text', placeholder: 'e.g. Brookside Dairy, Lame Dairy, Mama Dairy', colSpan: 2, role: 'display' },
            { key: 'shelfLifeDays', label: 'Shelf Life (Days)', type: 'text', placeholder: 'e.g. 14 Days Chilled, 90 Days UHT', colSpan: 2, role: 'handling' },
            { key: 'storageTemp', label: 'Storage Temperature', type: 'select', options: ['Keep Refrigerated (2°C to 4°C)', 'Store Below 6°C', 'Cool Ambient (Pre-Open UHT)'], colSpan: 2, role: 'handling', required: true },
        ]
    },

    // 4. Meat, Poultry & Seafood
    meat_poultry: {
        id: 'meat_poultry',
        domainTitle: 'Meat, Poultry & Seafood Specs',
        iconType: 'shield-check',
        badgeLabel: 'Halal Protein',
        description: 'Species classification, butchery cut, Halal certification, and thermal chain',
        fields: [
            { key: 'proteinType', label: 'Species / Classification', type: 'select', options: ['Fresh Beef / Cattle', 'Fresh Poultry / Chicken', 'Lamb & Mutton', 'Fresh Seafood & Fish', 'Goat / Chevon'], colSpan: 2, role: 'display' },
            { key: 'cutType', label: 'Cut / Butchery Format', type: 'text', placeholder: 'e.g. Boneless Breast, Ribeye, Whole Bird, Fillet', colSpan: 2, role: 'display' },
            { key: 'halalCertified', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal (Mandatory)', 'Government Veterinary Certified'], colSpan: 2, role: 'compliance', required: true },
            { key: 'thermalState', label: 'Cold Chain Thermal State', type: 'select', options: ['Fresh Chilled (0°C to 2°C)', 'Deep Frozen (-18°C or below)', 'Blast Frozen'], colSpan: 2, role: 'handling', required: true },
            { key: 'origin', label: 'Source Abattoir / Fishery', type: 'text', placeholder: 'e.g. Mojo Export Abattoir, Lake Victoria, Adama', colSpan: 2, role: 'display' },
            { key: 'fatOrGrade', label: 'Lean / Fat Ratio or Grade', type: 'text', placeholder: 'e.g. 85/15 Lean, Grade A Prime, Skinless', colSpan: 2, role: 'display' },
        ]
    },

    // 5. Bakery, Bread & Deli
    bakery_deli: {
        id: 'bakery_deli',
        domainTitle: 'Bakery, Fresh Deli & Prepared Foods',
        iconType: 'sandwich',
        badgeLabel: 'Fresh Baked',
        description: 'Bake state, dietary profile, allergens, and freshness shelf life',
        fields: [
            { key: 'bakedState', label: 'Bake State & Formulation', type: 'select', options: ['Fresh Baked Daily', 'Packaged Sliced Bread', 'Par-Baked / Bake-off', 'Ready-to-Eat Chilled Deli', 'Artisan Sourdough'], colSpan: 2, role: 'display' },
            { key: 'dietaryCert', label: 'Dietary & Halal Status', type: 'select', options: ['100% Halal Certified', 'Vegetarian Friendly', 'Gluten-Free Certified', 'No Artificial Preservatives'], colSpan: 2, role: 'compliance', required: true },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Wheat Gluten, Eggs, Milk, Sesame Seeds', colSpan: 2, role: 'compliance', required: true },
            { key: 'shelfLifeDays', label: 'Fresh Shelf Life (Days)', type: 'text', placeholder: 'e.g. 2 Days Fresh, 5 Days, 14 Days', colSpan: 2, role: 'handling' },
            { key: 'storageTemp', label: 'Storage Protocol', type: 'select', options: ['Ambient Display (< 22°C)', 'Chilled Deli (2°C to 4°C)', 'Heated Cabinet (> 65°C)'], colSpan: 2, role: 'handling' },
            { key: 'packagingType', label: 'Fresh Pack Enclosure', type: 'select', options: ['Perforated Bread Bag', 'Sealed MAP Pack', 'Clamshell Deli Box', 'Greaseproof Kraft Wrap'], colSpan: 2, role: 'display' },
        ]
    },

    // 6. Pantry, Grains, Oils & Cooking Essentials
    pantry_groceries: {
        id: 'pantry_groceries',
        domainTitle: 'Pantry, Grains & Cooking Essentials',
        iconType: 'layers',
        badgeLabel: 'Pantry Goods',
        description: 'Commodity grade, processing, origin, and dietary certifications',
        fields: [
            { key: 'commodityType', label: 'Commodity / Food Type', type: 'select', options: ['Rice, Grains & Pulses', 'Cooking Oil & Ghee', 'Flour, Baking & Sugar', 'Pasta & Noodles', 'Canned Food & Soups', 'Sauces, Spices & Condiments', 'Tea, Coffee & Cocoa', 'Breakfast Cereals & Oats'], colSpan: 2, role: 'display' },
            { key: 'processingGrade', label: 'Variety / Processing Grade', type: 'text', placeholder: 'e.g. Extra Long Basmati, Cold Pressed Pure, Grade 1 Arabica', colSpan: 2, role: 'display' },
            { key: 'dietaryCert', label: 'Dietary & Halal Status', type: 'select', options: ['100% Certified Halal', 'Vegetarian Friendly', 'Gluten-Free Certified', 'Non-GMO Verified'], colSpan: 2, role: 'compliance', required: true },
            { key: 'origin', label: 'Country / Sourcing Origin', type: 'text', placeholder: 'e.g. Ethiopia, Kenya, Thailand, India', colSpan: 2, role: 'display' },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. None, Contains Gluten, Contains Soy / Peanuts', colSpan: 2, role: 'compliance' },
            { key: 'storageCondition', label: 'Storage Requirement', type: 'select', options: ['Cool Dry Ambient (< 25°C)', 'Protect from Moisture & Sunlight', 'Airtight Dry Storage'], colSpan: 2, role: 'handling' },
        ]
    },

    // 7. Confectionery, Sweets & Snacks
    confectionery_snacks: {
        id: 'confectionery_snacks',
        domainTitle: 'Confectionery, Sweets & Snacks',
        iconType: 'cookie',
        badgeLabel: 'Snack Master',
        description: 'Snack type, Halal gelatin source, allergens, and thermal tolerance',
        fields: [
            { key: 'confectioneryType', label: 'Snack Classification', type: 'select', options: ['Chocolate Bar / Slab', 'Biscuits & Cookies', 'Crisps & Savory Snacks', 'Gummies & Jellies', 'Hard Boiled Candy & Toffee', 'Nuts & Dried Fruit Snack', 'Traditional Halwa & Sweets'], colSpan: 2, role: 'display' },
            { key: 'gelatinSource', label: 'Gelatin / Setting Agent', type: 'select', options: ['100% Halal Bovine Gelatin', 'Pectin / Plant-Based (Gelatin-Free)', 'Agar-Agar', 'No Gelatin / Gelatin-Free'], colSpan: 2, role: 'compliance', required: true },
            { key: 'halalCompliance', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal (Mandatory)', 'Halal Suitable (Vegetarian Origin)', 'Certified Kosher / Pareve'], colSpan: 2, role: 'compliance', required: true },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Milk, Soy Lecithin, Peanuts, Wheat Gluten, None', colSpan: 2, role: 'compliance', required: true },
            { key: 'storageTemp', label: 'Thermal Storage Directive', type: 'select', options: ['Cool Dry Ambient (< 20°C / Melt-Sensitive)', 'Ambient Dry (< 25°C)', 'Air Conditioned Confectionery (16°C - 18°C)'], colSpan: 2, role: 'handling' },
            { key: 'cocoaPercentage', label: 'Cocoa / Solid Content', type: 'text', placeholder: 'e.g. 70% Dark Cocoa, 32% Milk Chocolate, Salted', colSpan: 2, role: 'display' },
        ]
    },

    // 8. Beverages & Refreshment (100% Halal / Non-Alcoholic)
    beverages: {
        id: 'beverages',
        domainTitle: 'Beverages & Liquid Refreshment',
        iconType: 'coffee',
        badgeLabel: 'Halal Drinks',
        description: 'Packaging, volume, sugar profile, and 100% non-alcoholic compliance',
        fields: [
            { key: 'beverageType', label: 'Beverage Category', type: 'select', options: ['Mineral / Spring Water', 'Juice', 'Carbonated Soft Drink', 'Energy / Sports Drink', 'RTD Tea & Coffee', 'Flavored Still Drink'], colSpan: 2, role: 'display' },
            { key: 'containerType', label: 'Container Package', type: 'select', options: ['PET Plastic Bottle', 'Aluminium Sleek Can', 'Standard Aluminium Can', 'Glass Bottle', 'Tetra Pak Carton'], colSpan: 2, role: 'display' },
            { key: 'servingVolume', label: 'Single Serving Volume', type: 'text', placeholder: 'e.g. 330 ml, 500 ml, 1 Litre, 1.5 Litre', colSpan: 2, role: 'display' },
            { key: 'sugarContent', label: 'Sugar / Sweetener Profile', type: 'select', options: ['Zero Sugar / Diet', 'No Added Sugar (Natural)', 'Low Sugar', 'Standard Sweetened'], colSpan: 2, role: 'display' },
            { key: 'zeroAlcoholGuarantee', label: 'Zero Alcohol Compliance', type: 'select', options: ['100% Non-Alcoholic (SIIFMART Halal Policy)', 'Certified 0.0% Alcohol-Free'], colSpan: 2, role: 'compliance', required: true },
            { key: 'storageTemp', label: 'Storage Directive', type: 'select', options: ['Ambient Dry (< 25°C)', 'Keep Chilled (2°C to 4°C)', 'Protect from Direct Sunlight'], colSpan: 2, role: 'handling' },
        ]
    },

    // 9. Frozen Foods & Ice Cream
    frozen_food: {
        id: 'frozen_food',
        domainTitle: 'Frozen Foods & Ice Cream Specs',
        iconType: 'snowflake',
        badgeLabel: 'Deep Frozen',
        description: 'Sub-zero cold chain (-18°C), defrost directives, and Halal integrity',
        fields: [
            { key: 'frozenCategory', label: 'Frozen Product Class', type: 'select', options: ['Ice Cream & Gelato', 'Frozen Vegetables & Fruits', 'Frozen Ready Meals & Pizza', 'Frozen Pastry & Dough', 'Frozen Poultry & Fish'], colSpan: 2, role: 'display' },
            { key: 'storageTemp', label: 'Cold Chain Protocol', type: 'select', options: ['Deep Frozen (-18°C or below - Mandatory)', 'Blast Frozen (-25°C)', 'Ice Cream Soft-Serve (-14°C to -16°C)'], colSpan: 2, role: 'handling', required: true },
            { key: 'halalCompliance', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal', 'Vegetarian Certified', 'Natural Fruit/Veg (Halal Compliant)'], colSpan: 2, role: 'compliance', required: true },
            { key: 'defrostDirective', label: 'Preparation Directive', type: 'select', options: ['Cook Directly From Frozen', 'Thaw Under Refrigeration (< 4°C)', 'Ready to Eat Frozen (Ice Cream)'], colSpan: 2, role: 'handling' },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Milk/Dairy, Soy, Wheat, None', colSpan: 2, role: 'compliance' },
            { key: 'refreezeWarning', label: 'Food Safety Directive', type: 'select', options: ['Do Not Refreeze After Thawing (Mandatory)', 'Refreezable if Unopened'], colSpan: 2, role: 'compliance' },
        ]
    },

    // 10. Baby, Infant & Pediatric Care
    baby_toddler: {
        id: 'baby_toddler',
        domainTitle: 'Baby, Infant & Pediatric Care',
        iconType: 'baby',
        badgeLabel: 'Pediatric Grade',
        description: 'Age stage, diaper sizing, formula profiles, and pediatric safety',
        fields: [
            { key: 'babyCategory', label: 'Product Classification', type: 'select', options: ['Infant Formula & Baby Food', 'Diapers, Nappies & Pants', 'Baby Wipes & Cleansing', 'Baby Toiletries & Skincare', 'Feeding Bottles & Accessories'], colSpan: 2, role: 'display' },
            { key: 'stageOrSize', label: 'Stage / Sizing / Count', type: 'text', placeholder: 'e.g. Stage 1 (0-6M), Size 4 (9-14 kg) 54ct, 800g Tin', colSpan: 2, role: 'display' },
            { key: 'hypoallergenicCert', label: 'Pediatric Safety & Testing', type: 'select', options: ['Pediatrician Approved & Hypoallergenic', 'Dermatologically Tested Fragrance-Free', '100% Certified Organic'], colSpan: 2, role: 'compliance', required: true },
            { key: 'specialDietFormula', label: 'Formulation / Dietary Standard', type: 'select', options: ['Standard Enriched', 'Lactose-Free', 'Gentle / Hypoallergenic', '100% Halal Certified Ingredients', 'General Care'], colSpan: 2, role: 'compliance' },
            { key: 'shelfLifeDays', label: 'Sealed Shelf Life (Days)', type: 'text', placeholder: 'e.g. 720 Days (2 Years), 365 Days', colSpan: 2, role: 'handling' },
            { key: 'preparedFeeding', label: 'Preparation Directive', type: 'text', placeholder: 'e.g. Boiled Water 40°C, Reseal tightly', colSpan: 2, role: 'handling' },
        ]
    },

    // 11. Health, Beauty & Personal Care
    health_beauty: {
        id: 'health_beauty',
        domainTitle: 'Health, Beauty & Personal Care',
        iconType: 'sparkles',
        badgeLabel: 'Personal Care',
        description: 'Skin/hair compatibility, active ingredients, and safety standards',
        fields: [
            { key: 'careClassification', label: 'Product Classification', type: 'select', options: ['Skincare & Lotions', 'Hair Care & Shampoos', 'Oral & Dental Care', 'Bath & Body Washes', 'Vitamins & Supplements', 'First Aid & Antiseptics'], colSpan: 2, role: 'display' },
            { key: 'skinHairTarget', label: 'Target Compatibility', type: 'select', options: ['All Skin / Hair Types', 'Sensitive Skin', 'Dry & Dehydrated', 'Oily / Blemish Prone', 'Oral Hygiene / Cavity Care'], colSpan: 2, role: 'display' },
            { key: 'activeIngredients', label: 'Key Active Ingredients', type: 'text', placeholder: 'e.g. Shea Butter, Fluoride, Vitamin C, Tea Tree Oil', colSpan: 2, role: 'display' },
            { key: 'scentFragrance', label: 'Scent / Flavor', type: 'text', placeholder: 'e.g. Fresh Mint, Coconut, Fragrance-Free', colSpan: 2, role: 'display' },
            { key: 'safetyCert', label: 'Safety Testing & Compliance', type: 'select', options: ['Dermatologically Tested', 'Hypoallergenic Certified', '100% Halal Ingredients / Alcohol-Free', 'Fluoride Enriched'], colSpan: 2, role: 'compliance' },
            { key: 'paorPeriod', label: 'PAO / Shelf Life', type: 'select', options: ['12 Months (12M)', '24 Months (24M)', '6 Months (6M)', 'Sealed Expiry Date (Vitamins)'], colSpan: 2, role: 'handling' },
        ]
    },

    // 12. Household, Cleaning & Paper Care
    household_cleaning: {
        id: 'household_cleaning',
        domainTitle: 'Household, Cleaning & Paper Specs',
        iconType: 'sparkles',
        badgeLabel: 'Home Care',
        description: 'Formulation, target application, scent, and safety directive',
        fields: [
            { key: 'cleaningCategory', label: 'Product Classification', type: 'select', options: ['Laundry Detergent & Softener', 'Dishwashing Liquids & Tablets', 'Surface Cleaners & Sprays', 'Tissues, Paper Towels & Foils', 'Pest Control & Repellents', 'Air Care & Fresheners'], colSpan: 2, role: 'display' },
            { key: 'cleaningForm', label: 'Physical Formulation / Format', type: 'select', options: ['Liquid Concentrate', 'Washing Powder', '2-Ply / 3-Ply Roll / Pack', 'Trigger Spray', 'Moist Wipes', 'Solid Block / Bar'], colSpan: 2, role: 'display' },
            { key: 'scentFragrance', label: 'Fragrance / Scent', type: 'text', placeholder: 'e.g. Fresh Lemon, Lavender, Unscented', colSpan: 2, role: 'display' },
            { key: 'yieldCount', label: 'Usage Count / Roll Sheets', type: 'text', placeholder: 'e.g. 50 Washes, 200 Sheets, 750 ml Spray', colSpan: 2, role: 'display' },
            { key: 'hazardSafety', label: 'Safety Classification', type: 'select', options: ['Household Safe / Non-Corrosive', 'Eye Irritant - Keep Away From Children', 'Corrosive / Bleach - Wear Gloves', 'Flammable Aerosol', 'Food-Contact Safe (Foil/Wrap)'], colSpan: 2, role: 'compliance', required: true },
            { key: 'ecoFriendly', label: 'Environmental Standard', type: 'select', options: ['Standard Consumer Formulation', 'Phosphate-Free & Biodegradable', 'FSC Certified Recycled Paper'], colSpan: 2, role: 'compliance' },
        ]
    },

    // 14. Apparel, Textiles & Footwear
    apparel: {
        id: 'apparel',
        domainTitle: 'Apparel, Footwear & Textiles',
        iconType: 'shirt',
        badgeLabel: 'Apparel Master',
        description: 'Sizing, demographic cut, fiber composition, and laundering instructions',
        fields: [
            { key: 'apparelSize', label: 'Apparel Size / Fitment', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size / Free Size', '28', '30', '32', '34', '36', '38', '40', '42'], colSpan: 2, role: 'display', required: true },
            { key: 'genderFit', label: 'Demographic Cut', type: 'select', options: ['Unisex', 'Men', 'Women', 'Boys / Girls', 'Toddler / Infant'], colSpan: 2, role: 'display' },
            { key: 'fabricMaterial', label: 'Fiber / Material', type: 'text', placeholder: 'e.g. 100% Combed Cotton, Denim, Linen, Polyester', colSpan: 2, role: 'display' },
            { key: 'apparelColor', label: 'Colorway / Pattern', type: 'text', placeholder: 'e.g. Jet Black, Heather Grey, Navy, White', colSpan: 2, role: 'display' },
            { key: 'careInstructions', label: 'Laundering & Care', type: 'select', options: ['Machine Wash Normal', 'Machine Wash Cold (30°C)', 'Hand Wash Only', 'Dry Clean Only'], colSpan: 2, role: 'handling' },
            { key: 'seasonStyle', label: 'Collection / Style', type: 'text', placeholder: 'e.g. Core Basic, Summer Casual, Formal Workwear', colSpan: 2, role: 'display' },
        ]
    },

    // 15. Stationery, Books & Toys
    stationery_toys: {
        id: 'stationery_toys',
        domainTitle: 'Stationery, Books & Toys',
        iconType: 'book-open',
        badgeLabel: 'Stationery & Toys',
        description: 'Classification, age grading, non-toxic child safety, and materials',
        fields: [
            { key: 'goodsCategory', label: 'Merchandise Classification', type: 'select', options: ['Office & School Stationery', 'Notebooks, Pads & Paper', 'Books & Publications', 'Educational Toys & Games', 'Art & Craft Supplies', 'Sports & Recreation'], colSpan: 2, role: 'display' },
            { key: 'ageGrade', label: 'Target Age Grading', type: 'select', options: ['All Ages / General', 'Ages 3+ (Small Parts Warning)', 'Ages 6+', 'Adult / Professional'], colSpan: 2, role: 'compliance' },
            { key: 'materialType', label: 'Primary Material Composition', type: 'text', placeholder: 'e.g. FSC Recycled Paper, BPA-Free Plastic, Wood, Metal', colSpan: 2, role: 'display' },
            { key: 'safetyCompliance', label: 'Safety & Non-Toxic Standard', type: 'select', options: ['Non-Toxic Washable', 'Toy Safety Certified (EN71 / ASTM)', 'General Retail Standard'], colSpan: 2, role: 'compliance' },
            { key: 'packPieceCount', label: 'Pieces / Pack Count', type: 'text', placeholder: 'e.g. 100 Sheets, 12-Pack, 50 Pieces Set', colSpan: 2, role: 'display' },
            { key: 'warrantyPeriod', label: 'Warranty / Guarantee', type: 'select', options: ['Standard Retail Return', '6 Months Limited', 'Consumable Item (No Warranty)'], colSpan: 2, role: 'display' },
        ]
    },

    // 16. Homewares, Kitchen & Dining
    homewares_kitchen: {
        id: 'homewares_kitchen',
        domainTitle: 'Homewares, Kitchen & Dining',
        iconType: 'sandwich',
        badgeLabel: 'Kitchen Goods',
        description: 'Material durability, kitchen application, and food safety ratings',
        fields: [
            { key: 'itemClass', label: 'Product Classification', type: 'select', options: ['Cookware, Pots & Pans', 'Tableware, Plates & Cutlery', 'Food Storage & Containers', 'Drinkware & Glassware', 'Kitchen Utensils & Gadgets', 'Cleaning & Organization Tools'], colSpan: 2, role: 'display' },
            { key: 'materialType', label: 'Primary Material', type: 'select', options: ['Food-Grade Stainless Steel', 'Ceramic / Porcelain', 'Tempered Glass', 'Cast Iron', 'BPA-Free Plastic / Silicone', 'Natural Wood / Bamboo'], colSpan: 2, role: 'display' },
            { key: 'durabilityCare', label: 'Care & Heat Resistance', type: 'select', options: ['Dishwasher & Microwave Safe', 'Dishwasher Safe Only', 'Oven Safe / High Heat', 'Hand Wash Recommended'], colSpan: 2, role: 'handling' },
            { key: 'capacitySize', label: 'Volume / Dimensions', type: 'text', placeholder: 'e.g. 5 Litre Pot, 28cm Pan, 500ml Container, 16-Piece Set', colSpan: 2, role: 'display' },
            { key: 'foodSafetyCert', label: 'Food Safety Standard', type: 'select', options: ['FDA / LFGB Food Contact Safe (BPA Free)', 'Non-Toxic Lead-Free Glaze', 'Standard Consumer Grade'], colSpan: 2, role: 'compliance' },
            { key: 'warrantyPeriod', label: 'Warranty / Guarantee', type: 'select', options: ['12 Months Manufacturer Warranty', '6 Months Limited Warranty', 'No Warranty'], colSpan: 2, role: 'display' },
        ]
    },

    // 17. Automotive & Industrial Hardware
    automotive_industrial: {
        id: 'automotive_industrial',
        domainTitle: 'Automotive & Hardware Specs',
        iconType: 'car',
        badgeLabel: 'Technical Parts',
        description: 'Vehicle compatibility, OEM part numbers, and compliance ratings',
        fields: [
            { key: 'vehicleFitment', label: 'Vehicle Fitment / Compatibility', type: 'text', placeholder: 'e.g. Toyota Hilux / Land Cruiser 1HZ, Universal 12V', colSpan: 2, role: 'display' },
            { key: 'oemPartNumber', label: 'OEM / Part Number', type: 'text', placeholder: 'e.g. 90915-YZZD2, 17801-67070', colSpan: 2, role: 'display' },
            { key: 'partPosition', label: 'Fitment Position', type: 'select', options: ['Universal / Engine Bay', 'Front Axle', 'Rear Axle', 'Left Side', 'Right Side', 'Cabin Interior'], colSpan: 2, role: 'display' },
            { key: 'materialGrade', label: 'Material Grade / Composition', type: 'text', placeholder: 'e.g. Forged Steel, Synthetic Element, Ceramic', colSpan: 2, role: 'display' },
            { key: 'certificationStandard', label: 'Compliance Standard', type: 'select', options: ['ISO 9001 Standard', 'KEBS / ECA Standard', 'SAE Standard'], colSpan: 2, role: 'compliance' },
            { key: 'warrantyPeriod', label: 'Warranty / Guarantee', type: 'select', options: ['12 Months Manufacturer Warranty', '6 Months Limited Warranty', 'No Warranty'], colSpan: 2, role: 'display' },
        ]
    },

    // 18. General Merchandise (Fallback for unclassified products)
    general_merchandise: {
        id: 'general_merchandise',
        domainTitle: 'General Merchandise Specifications',
        iconType: 'tag',
        badgeLabel: 'General Master',
        description: 'General retail master specs, materials, and warranty',
        fields: [
            { key: 'modelNumber', label: 'Model / Item Number', type: 'text', placeholder: 'e.g. Model / Item #', colSpan: 2, role: 'display' },
            { key: 'variantStyle', label: 'Variant / Color / Style', type: 'text', placeholder: 'e.g. Red, Large, Pack of 3', colSpan: 2, role: 'display' },
            { key: 'materialType', label: 'Primary Material', type: 'text', placeholder: 'e.g. Plastic, Wood, Metal, Glass', colSpan: 2, role: 'display' },
            { key: 'warranty', label: 'Warranty / Guarantee', type: 'select', options: ['1 Year', '6 Months', 'None'], colSpan: 2, role: 'display' },
            { key: 'targetUsage', label: 'Recommended Application', type: 'text', placeholder: 'e.g. Home, Office, Commercial', colSpan: 2, role: 'display' },
            { key: 'keyNotes', label: 'Technical Notes', type: 'text', placeholder: 'Additional specifications', colSpan: 2, role: 'display' },
        ]
    }
};
