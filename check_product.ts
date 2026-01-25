
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
    console.log('🔍 Checking Product 70c9974c-5b29-4319-b8de-41e91e7cb7a6...');

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', '70c9974c-5b29-4319-b8de-41e91e7cb7a6')
        .single();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (!product) {
        console.log('Product not found.');
        return;
    }

    console.log(`Product: ${product.name}`);
    console.log(`Price: ${product.price}`);
    console.log(`Cost Price: ${product.cost_price}`);
}

checkProduct();
