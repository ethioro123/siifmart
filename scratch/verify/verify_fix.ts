
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRecyclingLogic() {
    console.log('--- STARTING VERIFICATION ---');

    // 1. Setup: Create a Placeholder Product (Location: '', Stock: 0)
    const siteId = 'bb0425bc-3119-449a-a685-b871e552bee0';
    const sku = `VERIFY-SKU-${Date.now()}`;

    console.log(`1. Creating placeholder product: ${sku}`);

    const { data: placeholder, error: createError } = await supabase
        .from('products')
        .insert({
            name: 'Verification Product',
            sku: sku,
            category: 'Test',
            price: 10,
            cost_price: 5,
            stock: 0,
            site_id: siteId,
            location: '', // Empty location as per new Procurement.tsx
            status: 'active'
        })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create placeholder:', createError);
        return;
    }
    console.log(`   ✅ Created placeholder ID: ${placeholder.id}`);

    // 2. Simulate putawayStock logic
    const params = {
        sku: sku,
        location: 'A-99-99',
        quantity: 5,
        siteId: siteId,
        sourceProductId: placeholder.id
    };

    console.log(`2. Simulating Putaway to ${params.location}...`);

    // Logic from Fulfillment.tsx
    let destProductId;

    // A. Check destination
    const { data: destProduct } = await supabase
        .from('products')
        .select('*')
        .eq('sku', params.sku)
        .eq('location', params.location)
        .eq('site_id', params.siteId)
        .single();

    if (destProduct) {
        console.log('   ❌ Destination already exists (unexpected for test)');
        return;
    } else {
        // B. Fetch Source
        const { data: sourceProduct } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.sourceProductId)
            .single();

        if (!sourceProduct) { console.error('Source not found'); return; }

        // C. Check Recycling Condition
        const isPlaceholder = (sourceProduct.location === 'On Order' || !sourceProduct.location) && sourceProduct.stock === 0;

        if (isPlaceholder && params.sourceProductId === sourceProduct.id) {
            console.log(`   ✅ Condition Met: Is Placeholder (Location: '${sourceProduct.location}', Stock: ${sourceProduct.stock})`);
            console.log(`   ♻️ Recycling product ${sourceProduct.id}...`);

            const { data: updated, error: updateError } = await supabase
                .from('products')
                .update({
                    location: params.location,
                    stock: params.quantity
                })
                .eq('id', sourceProduct.id)
                .select()
                .single();

            if (updateError) {
                console.error('Failed to update:', updateError);
            } else {
                destProductId = updated.id;
                console.log(`   ✅ Updated Product Location: '${updated.location}'`);
            }

        } else {
            console.log('   ❌ Condition NOT Met. Would create new product.');
            console.log(`      Source Location: '${sourceProduct.location}', Stock: ${sourceProduct.stock}`);
        }
    }

    // 3. Verify Final State
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('sku', sku);

    console.log(`3. Total products with SKU ${sku}: ${count}`);

    if (count === 1 && destProductId === placeholder.id) {
        console.log('✅ SUCCESS: Placeholder recycled, no duplicate created.');
    } else {
        console.log('❌ FAILURE: Duplicate created or update failed.');
    }

}

verifyRecyclingLogic();
