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
    iconType: 'cpu' | 'shirt' | 'apple' | 'shield-check' | 'milk' | 'coffee' | 'layers' | 'sparkles' | 'baby' | 'car' | 'tag' | 'cookie' | 'sandwich' | 'snowflake' | 'dog' | 'book-open';
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
            { key: 'modelNumber', label: 'Model / MPN', type: 'text', placeholder: 'e.g. B08KTZ8249, SM-A146P', colSpan: 2, role: 'display' },
            { key: 'screenSize', label: 'Display / Screen Size', type: 'text', placeholder: 'e.g. 6.8" E-Ink, 6.5" OLED', colSpan: 2, role: 'display' },
            { key: 'storageRam', label: 'Storage & RAM Capacity', type: 'text', placeholder: 'e.g. 16GB, 8GB RAM / 128GB ROM', colSpan: 2, role: 'display' },
            { key: 'batteryType', label: 'Battery Specifications', type: 'text', placeholder: 'e.g. Built-in Li-Ion (Weeks battery), 5000 mAh', colSpan: 2, role: 'handling' },
            { key: 'connectivity', label: 'Connectivity / Interfaces', type: 'select', options: ['Wi-Fi + Bluetooth', 'USB-C', 'Wi-Fi Only', 'Bluetooth Only', '4G LTE / 5G Cellular', 'HDMI / DisplayPort', 'Wired Only'], colSpan: 2, role: 'display' },
            { key: 'voltage', label: 'Operating Power / Voltage', type: 'text', placeholder: 'e.g. 5V/2A, 65W USB-PD, 220V', colSpan: 1, role: 'handling' },
            { key: 'warrantyPeriod', label: 'Warranty Coverage', type: 'select', options: ['12 Months Standard', '24 Months Extended', '6 Months Limited', 'No Warranty'], colSpan: 1, role: 'display' },
        ]
    },
    apparel: {
        id: 'apparel',
        domainTitle: 'Apparel, Footwear & Fashion Specs',
        iconType: 'shirt',
        badgeLabel: 'Soft Goods Master',
        description: 'Sizing, demographic cut, fiber composition, and laundering instructions',
        fields: [
            { key: 'apparelSize', label: 'Apparel Size / Fitment', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size / Free Size', '28', '30', '32', '34', '36', '38', '40', '42'], colSpan: 2, role: 'display', required: true },
            { key: 'genderFit', label: 'Demographic Cut', type: 'select', options: ['Unisex', 'Men', 'Women', 'Boys / Girls', 'Toddler / Infant'], colSpan: 2, role: 'display' },
            { key: 'fabricMaterial', label: 'Fiber / Material', type: 'text', placeholder: 'e.g. 100% Combed Cotton, Denim, Linen', colSpan: 2, role: 'display' },
            { key: 'apparelColor', label: 'Colorway / Pattern', type: 'text', placeholder: 'e.g. Jet Black, Heather Grey, Navy', colSpan: 2, role: 'display' },
            { key: 'careInstructions', label: 'Laundering & Care', type: 'select', options: ['Machine Wash Normal', 'Machine Wash Cold (30°C)', 'Hand Wash Only', 'Dry Clean Only', 'Do Not Tumble Dry'], colSpan: 2, role: 'handling' },
            { key: 'seasonStyle', label: 'Collection / Style', type: 'text', placeholder: 'e.g. Core Basic, Summer 2026', colSpan: 2, role: 'display' },
        ]
    },
    confectionery_snacks: {
        id: 'confectionery_snacks',
        domainTitle: 'Confectionery, Sweets & Snack Foods',
        iconType: 'cookie',
        badgeLabel: 'Confectionery Master',
        description: 'Cocoa solids, confectionery format, allergen profiles, gelatin source, and thermal tolerance',
        fields: [
            { key: 'confectioneryType', label: 'Confectionery Type', type: 'select', options: ['Chocolate Bar / Slab', 'Pralines & Boxed Chocolates', 'Gummies & Jellies', 'Hard Boiled Candy / Toffee', 'Biscuits & Cookies', 'Crisps & Savory Snacks', 'Nuts & Dried Fruit Snack', 'Halwa & Traditional Sweets'], colSpan: 2, role: 'display' },
            { key: 'cocoaPercentage', label: 'Cocoa Solids / Content', type: 'text', placeholder: 'e.g. 70% Dark Cocoa, 32% Milk Chocolate, White Chocolate', colSpan: 2, role: 'display' },
            { key: 'gelatinSource', label: 'Gelatin Source / Setting Agent', type: 'select', options: ['100% Halal Bovine Gelatin', 'Pectin / Plant-Based (Gelatin-Free)', 'Agar-Agar', 'No Gelatin / Gelatin-Free', 'Certified Halal Source'], colSpan: 2, role: 'compliance', required: true },
            { key: 'halalCompliance', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal (Mandatory)', 'Halal Suitable (Vegetarian Origin)', 'Certified Kosher / Pareve'], colSpan: 2, role: 'compliance', required: true },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Milk, Soy Lecithin, Hazelnuts, Peanuts, Wheat Gluten', colSpan: 2, role: 'compliance', required: true },
            { key: 'storageTemp', label: 'Thermal Storage Directive', type: 'select', options: ['Cool Dry Ambient (< 20°C / Melt-Sensitive)', 'Ambient Dry (< 25°C)', 'Air Conditioned Confectionery Zone (16°C to 18°C)'], colSpan: 2, role: 'handling' },
        ]
    },
    bakery_deli: {
        id: 'bakery_deli',
        domainTitle: 'Bakery, Fresh Deli & Ready Foods',
        iconType: 'sandwich',
        badgeLabel: 'Fresh Baked & Deli',
        description: 'Bake freshness cycle, prepared foods handling, crust/dough type, and shelf life',
        fields: [
            { key: 'bakedState', label: 'Bake State & Formulation', type: 'select', options: ['Fresh Baked Daily', 'Par-Baked / Bake-off', 'Packaged Sliced Bread', 'Ready-to-Eat Chilled Deli', 'Artisan Sourdough'], colSpan: 2, role: 'display' },
            { key: 'dietaryCert', label: 'Dietary & Halal Status', type: 'select', options: ['100% Halal Certified', 'Vegetarian Friendly', 'Gluten-Free Certified', 'No Artificial Preservatives'], colSpan: 2, role: 'compliance', required: true },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Wheat Gluten, Eggs, Milk, Sesame Seeds', colSpan: 2, role: 'compliance', required: true },
            { key: 'shelfLifeDays', label: 'Shelf Life Window (Days)', type: 'text', placeholder: 'e.g. 2 Days Fresh, 5 Days, 14 Days', colSpan: 2, role: 'handling' },
            { key: 'storageTemp', label: 'Storage Protocol', type: 'select', options: ['Ambient Display (< 22°C)', 'Chilled Deli (2°C to 4°C)', 'Heated Cabinet (> 65°C)'], colSpan: 2, role: 'handling' },
            { key: 'packagingType', label: 'Fresh Pack Enclosure', type: 'select', options: ['Perforated Bread Bag', 'Sealed Modified Atmosphere (MAP)', 'Clamshell Deli Box', 'Greaseproof Kraft Wrap'], colSpan: 2, role: 'display' },
        ]
    },
    frozen_food: {
        id: 'frozen_food',
        domainTitle: 'Frozen Foods, Meals & Ice Cream',
        iconType: 'snowflake',
        badgeLabel: 'Deep Frozen Chain',
        description: 'Sub-zero cold chain (-18°C), defrost directives, dietary profile, and crystallization integrity',
        fields: [
            { key: 'frozenCategory', label: 'Frozen Product Class', type: 'select', options: ['Ice Cream & Gelato', 'Frozen Vegetables & Fruits', 'Frozen Ready Meals & Pizza', 'Frozen Pastry & Dough', 'Frozen Plant-Based Proteins'], colSpan: 2, role: 'display' },
            { key: 'storageTemp', label: 'Frozen Cold Chain Protocol', type: 'select', options: ['Deep Frozen (-18°C or below - Mandatory)', 'Blast Frozen (-25°C)', 'Ice Cream Soft-Serve (-14°C to -16°C)'], colSpan: 2, role: 'handling', required: true },
            { key: 'halalCompliance', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal', 'Vegetarian Certified', 'Natural Fruit/Veg (Halal Compliant)'], colSpan: 2, role: 'compliance', required: true },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. Milk/Dairy, Soy, Wheat, None', colSpan: 2, role: 'compliance' },
            { key: 'defrostDirective', label: 'Preparation / Thawing Directive', type: 'select', options: ['Cook Directly From Frozen (Do Not Thaw)', 'Thaw Under Refrigeration (< 4°C)', 'Ready to Eat Frozen (Ice Cream)'], colSpan: 2, role: 'handling' },
            { key: 'refreezeWarning', label: 'Food Safety Directive', type: 'select', options: ['Do Not Refreeze After Thawing (Mandatory)', 'Refreezable if Unopened'], colSpan: 2, role: 'compliance' },
        ]
    },
    fresh_produce: {
        id: 'fresh_produce',
        domainTitle: 'Fresh Produce & Agricultural Specs',
        iconType: 'apple',
        badgeLabel: 'Agri Cold Chain',
        description: 'Cultivar variety, commercial grade, origin, and cold chain handling',
        fields: [
            { key: 'origin', label: 'Sourcing Origin / Farm', type: 'text', placeholder: 'e.g. Bishan Gari Farms, Rift Valley', colSpan: 2, role: 'display' },
            { key: 'grade', label: 'Quality Grade', type: 'select', options: ['Grade A / Premium Export', 'Standard Retail', 'Economy / Processing', 'Certified Organic'], colSpan: 2, role: 'display' },
            { key: 'ripenessVariety', label: 'Variety / Cultivar', type: 'text', placeholder: 'e.g. Hass, Red Fuji, Cavendish, Roma', colSpan: 2, role: 'display' },
            { key: 'perishableStorage', label: 'Cold Chain Protocol', type: 'select', options: ['Chilled (2°C to 4°C)', 'Cool Cellar (10°C to 15°C)', 'Ambient Dry'], colSpan: 2, role: 'handling', required: true },
            { key: 'shelfLifeDays', label: 'Shelf Life Window', type: 'text', placeholder: 'e.g. 7 Days, 14 Days', colSpan: 2, role: 'handling' },
            { key: 'organicCert', label: 'Certification', type: 'select', options: ['Conventional Standard', 'Certified Organic', 'Global GAP Certified'], colSpan: 2, role: 'compliance' },
        ]
    },
    meat_poultry: {
        id: 'meat_poultry',
        domainTitle: 'Meat, Poultry & Seafood Specs',
        iconType: 'shield-check',
        badgeLabel: 'Halal Meat Master',
        description: 'Butchery cut, slaughter compliance, Halal certification, and thermal state',
        fields: [
            { key: 'cutType', label: 'Butchery Cut Type', type: 'text', placeholder: 'e.g. Bone-In Ribeye, Boneless Breast, Whole Bird', colSpan: 2, role: 'display' },
            { key: 'grade', label: 'Quality Grade', type: 'select', options: ['Prime / Superior', 'Choice', 'Standard Retail'], colSpan: 2, role: 'display' },
            { key: 'halalCertified', label: 'Halal Certification', type: 'select', options: ['100% Certified Halal (Mandatory)', 'Government Veterinary Certified'], colSpan: 2, role: 'compliance', required: true },
            { key: 'origin', label: 'Abattoir / Source Region', type: 'text', placeholder: 'e.g. Mojo Export Abattoir, Adama', colSpan: 2, role: 'display' },
            { key: 'chilledState', label: 'Thermal State', type: 'select', options: ['Fresh Chilled (0°C to 2°C)', 'Deep Frozen (-18°C or below)', 'Blast Frozen'], colSpan: 2, role: 'handling', required: true },
            { key: 'fatRatio', label: 'Lean / Fat Ratio', type: 'text', placeholder: 'e.g. 85/15 Lean, 90/10, Skinless', colSpan: 2, role: 'display' },
        ]
    },
    dairy_eggs: {
        id: 'dairy_eggs',
        domainTitle: 'Dairy, Eggs & Refrigerated Specs',
        iconType: 'milk',
        badgeLabel: 'Chilled Dairy',
        description: 'Milk fat levels, pasteurization, source animal, and temperature control',
        fields: [
            { key: 'fatContent', label: 'Milk Fat Level', type: 'select', options: ['Full Cream / Whole (3.5%)', 'Low Fat (1.5%)', 'Skim / Fat-Free (<0.5%)', 'Double Cream (40%)'], colSpan: 2, role: 'display' },
            { key: 'dairyTreatment', label: 'Pasteurization / Treatment', type: 'select', options: ['Pasteurized Fresh Chilled', 'UHT Long-Life', 'Sterilized', 'Cultured / Fermented'], colSpan: 2, role: 'display' },
            { key: 'sourceAnimal', label: 'Milk Source / Egg Size', type: 'select', options: ['Cow Milk', 'Goat Milk', 'Large Eggs (Grade A)', 'Jumbo Eggs', 'Plant-Based (Oat/Soy/Almond)'], colSpan: 2, role: 'display' },
            { key: 'origin', label: 'Dairy Plant / Producer', type: 'text', placeholder: 'e.g. Brookside Dairy, Lame Dairy', colSpan: 2, role: 'display' },
            { key: 'shelfLifeDays', label: 'Shelf Life (Days)', type: 'text', placeholder: 'e.g. 14 Days Chilled, 90 Days UHT', colSpan: 2, role: 'handling' },
            { key: 'storageTemp', label: 'Storage Temperature', type: 'select', options: ['Keep Refrigerated (2°C to 4°C)', 'Store Below 6°C', 'Cool Ambient (Pre-Open)'], colSpan: 2, role: 'handling', required: true },
        ]
    },
    beverages: {
        id: 'beverages',
        domainTitle: 'Beverages & Liquid Refreshment',
        iconType: 'coffee',
        badgeLabel: 'Non-Alcoholic Halal',
        description: 'Container packaging, carbonation, sugar profile, and Halal non-alcoholic verification',
        fields: [
            { key: 'beverageType', label: 'Beverage Category', type: 'select', options: ['Mineral / Spring Water', '100% Pure Fruit Juice', 'Carbonated Soft Drink', 'Energy / Sports Drink', 'RTD Tea & Coffee', 'Flavored Still Drink'], colSpan: 2, role: 'display' },
            { key: 'containerType', label: 'Container Package', type: 'select', options: ['PET Plastic Bottle', 'Aluminium Sleek Can', 'Standard Aluminium Can', 'Glass Bottle', 'Tetra Pak Carton'], colSpan: 2, role: 'display' },
            { key: 'sugarContent', label: 'Sugar / Sweetener Profile', type: 'select', options: ['Zero Sugar / Diet', 'No Added Sugar (Natural)', 'Low Sugar', 'Standard Sweetened'], colSpan: 2, role: 'display' },
            { key: 'servingVolume', label: 'Single Serving Volume', type: 'text', placeholder: 'e.g. 330 ml, 500 ml, 1 Litre, 1.5 Litre', colSpan: 2, role: 'display' },
            { key: 'zeroAlcoholGuarantee', label: 'Zero Alcohol Compliance', type: 'select', options: ['100% Non-Alcoholic (SIIFMART Halal Policy)', 'Certified 0.0% Alcohol-Free'], colSpan: 2, role: 'compliance', required: true },
            { key: 'carbonation', label: 'Carbonation Level', type: 'select', options: ['Still / Non-Carbonated', 'Carbonated / Sparkling', 'Lightly Sparkling'], colSpan: 2, role: 'display' },
        ]
    },
    pantry_groceries: {
        id: 'pantry_groceries',
        domainTitle: 'Pantry, Dry Foods & Commodities',
        iconType: 'layers',
        badgeLabel: 'Ambient Dry Goods',
        description: 'Dietary certifications, grain varieties, processing, and allergens',
        fields: [
            { key: 'dietaryCert', label: 'Dietary Compliance', type: 'select', options: ['100% Halal Certified', 'Gluten-Free', 'Vegetarian', 'Vegan', 'Non-GMO Verified'], colSpan: 2, role: 'compliance', required: true },
            { key: 'grainVariety', label: 'Grain / Crop / Oil Type', type: 'text', placeholder: 'e.g. Extra Long Basmati, Sunflower Seed, Arabica Grade 1', colSpan: 2, role: 'display' },
            { key: 'roastOrProcessing', label: 'Processing / Roast', type: 'text', placeholder: 'e.g. Cold Pressed, Medium Dark Roast, Parboiled', colSpan: 2, role: 'display' },
            { key: 'primaryAllergens', label: 'Allergen Declarations', type: 'text', placeholder: 'e.g. None, Contains Gluten, Contains Peanuts/Soy', colSpan: 2, role: 'compliance', required: true },
            { key: 'origin', label: 'Country / Region', type: 'text', placeholder: 'e.g. Yirgacheffe Ethiopia, Kenya Rift, Thailand', colSpan: 2, role: 'display' },
            { key: 'cookingPrepTime', label: 'Preparation / Instructions', type: 'text', placeholder: 'e.g. Cook 12-15 min, Ready to Eat, Brew 4 min', colSpan: 2, role: 'display' },
        ]
    },
    pet_supplies: {
        id: 'pet_supplies',
        domainTitle: 'Pet Nutrition & Animal Care',
        iconType: 'dog',
        badgeLabel: 'Pet Care Standard',
        description: 'Species targeting, life stage nutrition, moisture grade, and feed safety certification',
        fields: [
            { key: 'targetAnimal', label: 'Target Species', type: 'select', options: ['Canine (Dog)', 'Feline (Cat)', 'Avian (Bird)', 'Small Pet / Rodent', 'Aquarium Fish'], colSpan: 2, role: 'display' },
            { key: 'lifeStage', label: 'Nutritional Life Stage', type: 'select', options: ['Puppy / Kitten (Growth)', 'Adult Maintenance', 'Senior / Mature', 'All Life Stages'], colSpan: 2, role: 'display' },
            { key: 'feedForm', label: 'Feed Formulation', type: 'select', options: ['Dry Extruded Kibble', 'Wet Canned Food / Pate', 'Pouch Gravy / Loaf', 'Treats & Chews', 'Non-Food Accessory / Litter'], colSpan: 2, role: 'display' },
            { key: 'primaryProtein', label: 'Primary Protein / Base', type: 'text', placeholder: 'e.g. Free-Range Chicken, Ocean Salmon, Lamb & Rice', colSpan: 2, role: 'display' },
            { key: 'specialDiet', label: 'Special Dietary Formula', type: 'select', options: ['Standard Complete', 'Grain-Free Formula', 'Sensitive Stomach & Skin', 'Weight Management', 'Hairball Control'], colSpan: 2, role: 'display' },
            { key: 'shelfLifeDays', label: 'Sealed Shelf Life', type: 'text', placeholder: 'e.g. 365 Days, 540 Days', colSpan: 2, role: 'handling' },
        ]
    },
    stationery_toys: {
        id: 'stationery_toys',
        domainTitle: 'Stationery, Books, Toys & Recreation',
        iconType: 'book-open',
        badgeLabel: 'General Goods Master',
        description: 'Age grading, non-toxic child safety certifications, paper weight, and build materials',
        fields: [
            { key: 'goodsCategory', label: 'Merchandise Classification', type: 'select', options: ['Office & School Stationery', 'Books & Publications', 'Educational Toys', 'Action Figures & Games', 'Art & Craft Supplies', 'Recreation & Sports'], colSpan: 2, role: 'display' },
            { key: 'ageGrade', label: 'Target Age Grading', type: 'select', options: ['All Ages / General', 'Ages 3+ (Small Parts Warning)', 'Ages 6+', 'Ages 12+ / Teens', 'Adult / Professional'], colSpan: 2, role: 'compliance' },
            { key: 'materialType', label: 'Primary Material Composition', type: 'text', placeholder: 'e.g. FSC Recycled Paper, BPA-Free ABS Plastic, Wood', colSpan: 2, role: 'display' },
            { key: 'safetyCompliance', label: 'Safety & Non-Toxic Standard', type: 'select', options: ['EN71 / ASTM F963 Toy Safety Certified', 'Non-Toxic Washable', 'ISO 9001 Standard Goods', 'General Retail Standard'], colSpan: 2, role: 'compliance' },
            { key: 'packPieceCount', label: 'Pieces / Page Count', type: 'text', placeholder: 'e.g. 80 Pages, 120 Pieces, 12-Pack Pens', colSpan: 2, role: 'display' },
            { key: 'warrantyPeriod', label: 'Warranty / Guarantee', type: 'select', options: ['Standard Retail Return', '6 Months Limited', '12 Months Manufacturer', 'Consumable Item (No Warranty)'], colSpan: 2, role: 'display' },
        ]
    },
    household_cleaning: {
        id: 'household_cleaning',
        domainTitle: 'Household & Cleaning Safety Specs',
        iconType: 'sparkles',
        badgeLabel: 'Home & Chemical Care',
        description: 'Formulation, target surface, scent, and safety hazard classification',
        fields: [
            { key: 'cleaningForm', label: 'Physical Formulation', type: 'select', options: ['Liquid Concentrate', 'Washing Powder', 'Unit Dose Pods / Capsules', 'Trigger Spray', 'Surface Wipes', 'Solid Soap Bar'], colSpan: 2, role: 'display' },
            { key: 'surfaceApplication', label: 'Primary Surface Target', type: 'select', options: ['Automatic Laundry Machine', 'Hand Wash Laundry', 'Dishwashing & Cutlery', 'Multi-Surface & Floors', 'Glass & Mirrors', 'Bathroom & Toilet Descaler'], colSpan: 2, role: 'display' },
            { key: 'scentFragrance', label: 'Fragrance / Scent', type: 'text', placeholder: 'e.g. Fresh Lavender, Lemon Breeze, Free & Unscented', colSpan: 2, role: 'display' },
            { key: 'washLoadsCount', label: 'Loads / Yield Count', type: 'text', placeholder: 'e.g. 40 Washes, 80 Uses, 500 Sprays', colSpan: 2, role: 'display' },
            { key: 'hazardSafety', label: 'Safety Classification', type: 'select', options: ['Household Safe / Non-Corrosive', 'Eye Irritant - Keep Out of Reach of Children', 'Corrosive Acid / Bleach - Wear Gloves', 'Flammable Aerosol'], colSpan: 2, role: 'compliance', required: true },
            { key: 'ecoFriendly', label: 'Environmental Formulation', type: 'select', options: ['Standard Formulation', 'Phosphate-Free & Biodegradable', 'Plant-Based Surfactants'], colSpan: 2, role: 'compliance' },
        ]
    },
    baby_toddler: {
        id: 'baby_toddler',
        domainTitle: 'Baby, Infant & Pediatric Care',
        iconType: 'baby',
        badgeLabel: 'Pediatric Grade',
        description: 'Stage age group, formula types, diaper sizing, and pediatric safety',
        fields: [
            { key: 'babyStage', label: 'Age Formulation Stage', type: 'select', options: ['Stage 1: Infant (0 - 6 Months)', 'Stage 2: Follow-on (6 - 12 Months)', 'Stage 3: Growing Up (1 - 3 Years)', 'All Ages / Toddler'], colSpan: 2, role: 'display', required: true },
            { key: 'diaperOrFeedSize', label: 'Size / Piece Count', type: 'text', placeholder: 'e.g. Size 3 (6-10 kg) • 64 Count, 800g Tin', colSpan: 2, role: 'display' },
            { key: 'specialDietFormula', label: 'Formulation Type', type: 'select', options: ['Standard Enriched', 'Lactose-Free', 'Gentle / Hypoallergenic', 'Organic Milk Based', 'Soy / Plant-Based'], colSpan: 2, role: 'compliance' },
            { key: 'hypoallergenicCert', label: 'Pediatric Safety', type: 'select', options: ['Dermatologically Tested', 'Pediatrician Approved', 'Hypoallergenic Fragrance-Free'], colSpan: 2, role: 'compliance', required: true },
            { key: 'shelfLifeDays', label: 'Sealed Shelf Life', type: 'text', placeholder: 'e.g. 720 Days (2 Years)', colSpan: 2, role: 'handling' },
            { key: 'preparedFeeding', label: 'Preparation Directive', type: 'text', placeholder: 'e.g. Boiled Water 40°C, Use within 1 hr', colSpan: 2, role: 'handling' },
        ]
    },
    health_beauty: {
        id: 'health_beauty',
        domainTitle: 'Health, Beauty & Personal Care',
        iconType: 'sparkles',
        badgeLabel: 'Cosmetics / Skincare',
        description: 'Skin & hair targets, active ingredients, SPF rating, and PAO',
        fields: [
            { key: 'skinHairTarget', label: 'Skin / Hair Compatibility', type: 'select', options: ['All Skin Types', 'Sensitive Skin', 'Dry & Dehydrated', 'Oily / Blemish Prone', 'Color-Treated Hair'], colSpan: 2, role: 'display' },
            { key: 'activeActives', label: 'Key Active Ingredients', type: 'text', placeholder: 'e.g. Niacinamide 10%, Hyaluronic Acid, Shea Butter', colSpan: 2, role: 'display' },
            { key: 'spfSunscreen', label: 'SPF Sun Protection', type: 'select', options: ['None / Not Applicable', 'SPF 15 Daily', 'SPF 30 Broad Spectrum', 'SPF 50+ UVA/UVB', 'SPF 50+ Water Resistant'], colSpan: 2, role: 'display' },
            { key: 'scentFragrance', label: 'Scent / Aroma', type: 'text', placeholder: 'e.g. Rose Water, Fresh Citrus, Fragrance-Free', colSpan: 2, role: 'display' },
            { key: 'dermatologyTested', label: 'Safety Testing', type: 'select', options: ['Dermatologically Tested', 'Cruelty-Free / Vegan', 'Hypoallergenic Certified'], colSpan: 2, role: 'compliance' },
            { key: 'paorPeriod', label: 'PAO (Period After Opening)', type: 'select', options: ['6 Months (6M)', '12 Months (12M)', '24 Months (24M)', 'Single Use'], colSpan: 2, role: 'handling' },
        ]
    },
    automotive_industrial: {
        id: 'automotive_industrial',
        domainTitle: 'Automotive & Industrial Engineering Specs',
        iconType: 'car',
        badgeLabel: 'Technical / OEM Parts',
        description: 'Vehicle compatibility, OEM part numbers, fitment, and load ratings',
        fields: [
            { key: 'vehicleFitment', label: 'Vehicle Fitment / Compatibility', type: 'text', placeholder: 'e.g. Toyota Hilux / Land Cruiser 1HZ, Universal 12V', colSpan: 2, role: 'display' },
            { key: 'oemPartNumber', label: 'OEM / Part Number', type: 'text', placeholder: 'e.g. 90915-YZZD2, 17801-67070', colSpan: 2, role: 'display' },
            { key: 'partPosition', label: 'Fitment Position', type: 'select', options: ['Universal / Engine Bay', 'Front Axle', 'Rear Axle', 'Left Side', 'Right Side', 'Cabin Interior'], colSpan: 2, role: 'display' },
            { key: 'materialGrade', label: 'Material Grade / Composition', type: 'text', placeholder: 'e.g. Forged Steel, Synthetic Element, Ceramic', colSpan: 2, role: 'display' },
            { key: 'voltageLoad', label: 'Electrical / Load Capacity', type: 'text', placeholder: 'e.g. 12V 70Ah, 2000 kg WLL', colSpan: 2, role: 'handling' },
            { key: 'certificationStandard', label: 'Compliance Standard', type: 'select', options: ['ISO 9001', 'KEBS / ECA Standard', 'SAE J517'], colSpan: 2, role: 'compliance' },
        ]
    },
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
