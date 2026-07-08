export const getParentCategory = (category: string): string => {
    const cat = (category || '').trim().toLowerCase();
    
    // Fresh Food & Deli
    if ([
        'fruit & vegetables', 'fresh produce', 'dairy, eggs & fridge', 'dairy & eggs',
        'meat & poultry', 'seafood', 'bakery & bread', 'deli & prepared meals'
    ].includes(cat)) {
        return 'Fresh Food & Deli';
    }

    // Pantry & Groceries
    if ([
        'snacks & confectionery', 'baking & dessert needs', 'grains, pasta & rice', 
        'sauces, oils & condiments', 'spices & seasonings', 'canned food & soups', 
        'breakfast & cereals', 'tea, coffee & cocoa', 'drinks & beverages', 'beverages',
        'pantry & dry goods'
    ].includes(cat)) {
        return 'Pantry & Groceries';
    }

    // Frozen Food
    if ([
        'frozen meals & sides', 'frozen vegetables & fruit', 'ice cream & desserts', 'frozen food'
    ].includes(cat)) {
        return 'Frozen Food';
    }

    // Household & Personal
    if ([
        'baby & toddler', 'nappies, wipes & toiletries', 'health & beauty', 
        'dental & oral care', 'hair & body care', 'cosmetics & skin care', 
        'vitamins & supplements', 'pharmacy & first aid', 'household & cleaning',
        'laundry & dishwashing', 'cleaning products & tools', 'tissues, paper & foils',
        'pest control & garden care', 'pet supplies', 'dog food & accessories',
        'cat food & accessories', 'small pet supplies'
    ].includes(cat)) {
        return 'Household & Personal';
    }

    // General Merchandise
    if ([
        'general merchandise & apparel', 'general', 'stationery, office & books',
        'electronics & batteries', 'homewares, kitchen & dining', 'clothing & accessories',
        'toys & recreation', 'industrial', 'automotive'
    ].includes(cat)) {
        return 'General Merchandise';
    }

    return 'Other';
};
