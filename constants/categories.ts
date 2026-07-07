// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE PRODUCT CATEGORIES (SHARED ACROSS ALL MODULES)
// Used by: Inventory, Procurement, Merchandising
// ═══════════════════════════════════════════════════════════════
export const GROCERY_CATEGORIES: Record<string, string[]> = {
  'Fresh Food & Deli': [
    'Fruit & Vegetables',
    'Dairy, Eggs & Fridge',
    'Meat & Poultry',
    'Seafood',
    'Bakery & Bread',
    'Deli & Prepared Meals'
  ],
  'Pantry & Groceries': [
    'Snacks & Confectionery',
    'Baking & Dessert Needs',
    'Grains, Pasta & Rice',
    'Sauces, Oils & Condiments',
    'Canned Food & Soups',
    'Breakfast & Cereals',
    'Tea, Coffee & Cocoa',
    'Drinks & Beverages'
  ],
  'Frozen Food': [
    'Frozen Meals & Sides',
    'Frozen Vegetables & Fruit',
    'Ice Cream & Desserts'
  ],
  'Baby & Toddler': [
    'Baby Food & Formula',
    'Nappies, Wipes & Toiletries'
  ],
  'Health & Beauty': [
    'Dental & Oral Care',
    'Hair & Body Care',
    'Cosmetics & Skin Care',
    'Vitamins & Supplements',
    'Pharmacy & First Aid'
  ],
  'Household & Cleaning': [
    'Laundry & Dishwashing',
    'Cleaning Products & Tools',
    'Tissues, Paper & Foils',
    'Pest Control & Garden Care'
  ],
  'Pet Supplies': [
    'Dog Food & Accessories',
    'Cat Food & Accessories',
    'Small Pet Supplies'
  ],
  'General Merchandise & Apparel': [
    'Stationery, Office & Books',
    'Electronics & Batteries',
    'Homewares, Kitchen & Dining',
    'Clothing & Accessories',
    'Toys & Recreation'
  ]
};

export const COMMON_UNITS = [
  'piece', 'kg', 'g', 'liter', 'ml', 'box', 'pack', 'carton',
  'bag', 'bottle', 'can', 'jar', 'dozen', 'bundle', 'tray'
];

// Get all categories as flat list for simple dropdowns
export const ALL_CATEGORY_OPTIONS = Array.from(new Set(Object.entries(GROCERY_CATEGORIES).flatMap(([main, subs]) => [main, ...subs])));

export const CURRENCY_SYMBOL = 'ETB';
