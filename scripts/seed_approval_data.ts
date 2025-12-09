import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function seedApprovalData() {
    console.log('🧹 Clearing Database...');

    // Delete in order of dependencies
    await supabase.from('wms_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('po_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Database Cleared');

    // Get Site ID
    const { data: sites } = await supabase.from('sites').select('id').limit(1);
    const siteId = sites?.[0]?.id;

    if (!siteId) {
        console.error('❌ No site found. Please run initial setup.');
        return;
    }

    console.log('🌱 Seeding 5 Draft POs...');

    const suppliers = ['TechGiant Corp', 'FreshFoods Ltd', 'Global Imports', 'Local Farms', 'Office Supplies Co'];
    const categories = ['Electronics', 'Groceries', 'Furniture', 'Produce', 'Stationery'];

    for (let i = 0; i < 5; i++) {
        const productId = crypto.randomUUID();
        const poId = crypto.randomUUID();
        const timestamp = Date.now() + i;

        // 1. Create Product (0 Stock) - UPSERT to handle existing SKUs
        const { error: prodError } = await supabase.from('products').upsert({
            id: productId,
            name: `Seed Product ${i + 1}`,
            sku: `SEED-${100 + i}`,
            price: (i + 1) * 10,
            stock: 0,
            category: categories[i],
            status: 'active',
            site_id: siteId,
            image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&q=80&w=200'
        }, { onConflict: 'sku' });
        if (prodError) console.error('❌ Product Insert Error:', prodError);

        // 2. Create PO (Draft = Pending status, no approved_by)
        // Fix: Shorten PO Number to fit VARCHAR(20)
        const shortTimestamp = timestamp.toString().slice(-8);
        const { error: poError } = await supabase.from('purchase_orders').insert({
            id: poId,
            po_number: `PO-${shortTimestamp}`,
            site_id: siteId,
            supplier_name: suppliers[i],
            status: 'Pending', // Frontend interprets this as Draft if approved_by is null
            total_amount: (i + 1) * 500,
            items_count: 1,
            notes: 'Auto-generated seed data'
        });
        if (poError) console.error('❌ PO Insert Error:', poError);

        // 3. Create PO Item
        const { error: itemError } = await supabase.from('po_items').insert({
            po_id: poId,
            product_id: productId,
            product_name: `Seed Product ${i + 1}`,
            quantity: 50,
            unit_cost: (i + 1) * 5,
            total_cost: (i + 1) * 250
        });
        if (itemError) console.error('❌ PO Item Insert Error:', itemError);
    }

    console.log('✅ Seeding Complete!');
    console.log('👉 Refresh your browser. You should see 5 Draft POs in Procurement.');
}

seedApprovalData();
