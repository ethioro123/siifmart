import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Category heuristics for orphaned products based on product name keywords
function guessCategory(name) {
    if (!name) return 'General';
    const n = name.toLowerCase();
    if (/milk|cheese|butter|yogurt|cream|egg|dairy/.test(n)) return 'Dairy & Eggs';
    if (/rice|pasta|flour|oil|sugar|salt|bread|cereal|oat|lentil|bean|grain|barley/.test(n)) return 'Pantry & Dry Goods';
    if (/apple|banana|orange|tomato|onion|carrot|potato|mango|avocado|lemon|spinach|lettuce|kale|pepper|garlic|ginger/.test(n)) return 'Fresh Produce';
    if (/juice|water|soda|cola|tea|coffee|drink|beverage|energy/.test(n)) return 'Beverages';
    if (/biscuit|cookie|chip|snack|chocolate|candy|sweet|cake|pastry/.test(n)) return 'Snacks & Sweets';
    if (/soap|shampoo|toothpaste|lotion|deodorant|detergent|bleach|tissue|towel/.test(n)) return 'Household';
    if (/pepper|spice|cumin|turmeric|cardamom|cinnamon|berbere|mitmita|korerima/.test(n)) return 'Spices & Seasonings';
    if (/chicken|beef|lamb|fish|tuna|sardine|meat|sausage|egg/.test(n)) return 'Fresh Produce';
    if (/frozen|ice cream/.test(n)) return 'Frozen Foods';
    if (/bakery|bread|bun|roll|injera|flatbread/.test(n)) return 'Bakery';
    if (/import|international/.test(n)) return 'International Foods';
    return 'General';
}

async function run() {
    await supabase.auth.signInWithPassword({ email: 'siif-0001@siifmart.com', password: 'Oromo123' });

    // Fetch all sale_items
    const { data: saleItems } = await supabase.from('sale_items').select('*');

    // Fetch all products for lookup
    const { data: products } = await supabase.from('products').select('id, name, category, cost_price, price');
    const byId   = Object.fromEntries(products?.map(p => [p.id, p]) || []);
    const byName = Object.fromEntries(products?.map(p => [p.name.toLowerCase().trim(), p]) || []);

    let updatedCost = 0;
    let updatedCat  = 0;
    let errors = 0;

    for (const item of saleItems || []) {
        const updates = {};

        // --- Resolve cost_price ---
        if (!item.cost_price || item.cost_price === 0) {
            let cost = null;
            // Try product_id first
            if (item.product_id && byId[item.product_id]?.cost_price > 0) {
                cost = byId[item.product_id].cost_price;
            }
            // Try name match
            if (!cost) {
                const nameKey = (item.product_name || '').toLowerCase().trim();
                if (byName[nameKey]?.cost_price > 0) cost = byName[nameKey].cost_price;
            }
            // Fallback: 70% of sale price (standard COGS estimate)
            if (!cost) cost = parseFloat((item.price * 0.7).toFixed(2));

            updates.cost_price = cost;
        }

        // --- Resolve category ---
        if (!item.category) {
            let cat = null;
            // Try product_id
            if (item.product_id && byId[item.product_id]?.category) {
                cat = byId[item.product_id].category;
            }
            // Try name match
            if (!cat) {
                const nameKey = (item.product_name || '').toLowerCase().trim();
                if (byName[nameKey]?.category) cat = byName[nameKey].category;
            }
            // Heuristic from product name
            if (!cat) cat = guessCategory(item.product_name);

            updates.category = cat;
        }

        if (Object.keys(updates).length === 0) continue;

        const { error } = await supabase
            .from('sale_items')
            .update(updates)
            .eq('id', item.id);

        if (error) {
            console.error(`❌ Failed to update item ${item.id}:`, error.message);
            errors++;
        } else {
            if (updates.cost_price) updatedCost++;
            if (updates.category)   updatedCat++;
        }
    }

    console.log(`\n=== BACKFILL COMPLETE ===`);
    console.log(`✅ cost_price backfilled: ${updatedCost}`);
    console.log(`✅ category backfilled:   ${updatedCat}`);
    console.log(`❌ errors:                ${errors}`);

    // Verify final profit
    const { data: updatedItems } = await supabase.from('sale_items').select('quantity, price, cost_price');
    const netProfit = updatedItems?.reduce((sum, i) => sum + (i.quantity * ((i.price || 0) - (i.cost_price || 0))), 0) || 0;
    const totalRevenue = updatedItems?.reduce((sum, i) => sum + (i.quantity * (i.price || 0)), 0) || 0;
    console.log(`\n=== RECALCULATED FINANCIALS ===`);
    console.log(`Net Profit: ETB ${netProfit.toFixed(2)}`);
    console.log(`Profit Margin: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`);

    await supabase.auth.signOut();
}
run();
