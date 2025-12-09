
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCTS_TO_SEED = [
    { name: 'Organic Bananas', category: 'Fresh Produce', price: 25, stock: 150, sku: 'FRT-BAN-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 18, sale_price: 25, is_on_sale: false },
    { name: 'Whole Milk 1L', category: 'Dairy', price: 60, stock: 80, sku: 'DAI-MIL-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 42, sale_price: 60, is_on_sale: false },
    { name: 'Sourdough Bread', category: 'Bakery', price: 45, stock: 40, sku: 'BAK-BRE-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 30, sale_price: 45, is_on_sale: false },
    { name: 'Free Range Eggs (12)', category: 'Dairy', price: 120, stock: 60, sku: 'DAI-EGG-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 85, sale_price: 120, is_on_sale: false },
    { name: 'Ground Coffee 500g', category: 'Beverages', price: 350, stock: 45, sku: 'BEV-COF-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 245, sale_price: 350, is_on_sale: false },
    { name: 'Basmati Rice 2kg', category: 'Pantry', price: 450, stock: 100, sku: 'PAN-RIC-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 315, sale_price: 450, is_on_sale: false },
    { name: 'Local Honey 500g', category: 'Pantry', price: 200, stock: 30, sku: 'PAN-HON-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 140, sale_price: 200, is_on_sale: false },
    { name: 'Avocado (Hass)', category: 'Fresh Produce', price: 35, stock: 75, sku: 'FRT-AVO-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 25, sale_price: 35, is_on_sale: false },
    { name: 'Chicken Breast 1kg', category: 'Meat', price: 380, stock: 25, sku: 'MEA-CHI-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 260, sale_price: 380, is_on_sale: false },
    { name: 'Cheddar Cheese 250g', category: 'Dairy', price: 180, stock: 50, sku: 'DAI-CHE-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 125, sale_price: 180, is_on_sale: false },
    { name: 'Olive Oil 1L', category: 'Pantry', price: 550, stock: 40, sku: 'PAN-OIL-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 385, sale_price: 550, is_on_sale: false },
    { name: 'Sparkling Water 500ml', category: 'Beverages', price: 20, stock: 200, sku: 'BEV-WAT-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 12, sale_price: 20, is_on_sale: false },
    { name: 'Dark Chocolate 100g', category: 'Snacks', price: 85, stock: 120, sku: 'SNK-CHO-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 60, sale_price: 85, is_on_sale: false },
    { name: 'Tomatoes 1kg', category: 'Fresh Produce', price: 40, stock: 90, sku: 'VEG-TOM-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 28, sale_price: 40, is_on_sale: false },
    { name: 'Orange Juice 1L', category: 'Beverages', price: 110, stock: 65, sku: 'BEV-JUI-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 75, sale_price: 110, is_on_sale: false },
    { name: 'Pasta 500g', category: 'Pantry', price: 35, stock: 150, sku: 'PAN-PAS-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 20, sale_price: 35, is_on_sale: false },
    { name: 'Greek Yogurt 250g', category: 'Dairy', price: 45, stock: 40, sku: 'DAI-YOG-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 30, sale_price: 45, is_on_sale: false },
    { name: 'Green Tea Pack', category: 'Beverages', price: 95, stock: 80, sku: 'BEV-TEA-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 65, sale_price: 95, is_on_sale: false },
    { name: 'Almonds 200g', category: 'Snacks', price: 220, stock: 60, sku: 'SNK-ALM-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 150, sale_price: 220, is_on_sale: false },
    { name: 'Red Wine 750ml', category: 'Alcohol', price: 450, stock: 30, sku: 'ALC-WIN-001', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200', cost_price: 300, sale_price: 450, is_on_sale: false }
];

async function seedSpecificStores() {
    console.log('Seeding products for Bole and Awaday...');

    // 1. Find the sites
    const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name')
        .or('name.ilike.%Bole%,name.ilike.%Awaday%');

    if (error) {
        console.error('Error finding sites:', error);
        return;
    }

    if (!sites || sites.length === 0) {
        console.log('No matching sites found for "Bole" or "Awaday".');
        return;
    }

    console.log(`Found ${sites.length} target sites:`, sites.map(s => s.name).join(', '));

    for (const site of sites) {
        const uniqueSuffix = `-${site.id.substring(0, 4)}`; // Short suffix

        // 2. Clear existing stock for this site (Safe idempotency)
        // Using site_id based on previous correction
        const { error: delError } = await supabase
            .from('products')
            .delete()
            .eq('site_id', site.id);

        if (delError) {
            console.log('Error clearing stock (trying camelCase...):', delError.message);
            // Fallback to siteId just in case
            await supabase.from('products').delete().eq('siteId', site.id);
        }

        console.log(`Cleared stock for ${site.name}. Seeding new products...`);

        // 3. Prepare payload with unique SKUs
        const payload = PRODUCTS_TO_SEED.map(p => ({
            ...p,
            site_id: site.id,
            sku: `${p.sku}${uniqueSuffix}`, // E.g., FRT-BAN-001-a1b2
            status: 'active'
        }));

        const { error: insertError } = await supabase
            .from('products')
            .insert(payload);

        if (insertError) {
            console.error(`Failed to seed ${site.name}:`, insertError.message);
        } else {
            console.log(`Successfully seeded ${payload.length} products to ${site.name}.`);
        }
    }
}

seedSpecificStores();
