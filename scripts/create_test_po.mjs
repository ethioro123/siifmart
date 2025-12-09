
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestPO() {
    console.log('Creating Test Product & PO for Adama...');

    // 1. Create/Get Product
    const prodData = {
        name: 'Test Valid Z',
        sku: 'TEST-VALID-Z',
        price: 100,
        cost_price: 50, // db column usually snake_case
        site_id: '97452359-705d-44dd-b2de-1002d6c19a81',
        stock: 0,
        status: 'active',
        category: 'General'
    };

    // Note: costPrice in TS might map to cost_price or unit_cost in DB?
    // Let's check schema via error if needed, or assume cost_price

    const { data: prod, error: prodErr } = await supabase
        .from('products')
        .insert(prodData)
        .select()
        .single();

    if (prodErr && prodErr.code !== '23505') { // Ignore unique violation if fallback
        // If constraint missing, try select.
        // Or just Insert.
        console.error('Prod error:', prodErr);
        // We might proceed if it failed due to duplicate and we didn't catch it right
    }

    let productionId = prod?.id;

    if (!productionId) {
        // Try finding it
        const { data: exist } = await supabase.from('products').select('id').eq('sku', 'TEST-VALID-Z').eq('site_id', '97452359-705d-44dd-b2de-1002d6c19a81').single();
        productionId = exist?.id;
    }

    if (!productionId) {
        console.error('Failed to get product ID');
        return;
    }

    // 2. Create PO
    const poData = {
        po_number: 'PO-TEST-005',
        site_id: '97452359-705d-44dd-b2de-1002d6c19a81',
        supplier_id: 'SUP-001',
        status: 'Approved',
        total_amount: 100,
        created_at: new Date().toISOString(),
        expected_delivery: new Date().toISOString(),
        items_count: 1
    };

    const { data: sups } = await supabase.from('suppliers').select('id, name').limit(1);
    if (sups && sups.length > 0) {
        poData.supplier_id = sups[0].id;
        poData.supplier_name = sups[0].name;
    } else {
        poData.supplier_name = 'Test Supplier';
    }

    const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert(poData)
        .select()
        .single();

    if (poErr) {
        console.error('Error creating PO:', poErr);
        return;
    }

    console.log('✅ Created PO:', po.po_number, po.id);

    // 3. Create PO Item linked to Product
    const itemData = {
        po_id: po.id,
        product_name: 'Test Valid Z',
        quantity: 10,
        unit_cost: 10,
        total_cost: 100,
        product_id: productionId
    };

    const { error: itemErr } = await supabase
        .from('po_items')
        .insert(itemData);

    if (itemErr) console.error('Error creating item:', itemErr);
    else console.log('✅ Created PO Item linked to Product', productionId);
}

createTestPO();
