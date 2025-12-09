
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkZela() {
    console.log('🔍 Searching for "Zela"...');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, site_id, stock, location')
        .ilike('name', '%Zela%');

    if (error) {
        console.error(error);
    } else {
        console.log(`Found ${products.length} products matching "Zela":`);
        products.forEach(p => {
            console.log(`- [${p.sku}] ${p.name}`);
            console.log(`  ID: ${p.id}`);
            console.log(`  Site: ${p.site_id}`);
            console.log(`  Stock: ${p.stock}`);
            console.log(`  Loc: ${p.location}`);
        });
    }
}

checkZela();
