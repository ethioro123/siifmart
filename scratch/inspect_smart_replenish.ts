import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("--- SITES INFO ---");
    const { data: sites, error: sitesError } = await supabase.from('sites').select('*');
    if (sitesError) {
        console.error(sitesError);
        return;
    }

    const bedeno = sites.find(s => s.name.toUpperCase().includes('BEDENO'));
    const harar = sites.find(s => s.name.toUpperCase().includes('HARAR'));

    console.log("Bedeno Site:", bedeno);
    console.log("Harar Site:", harar);

    console.log("\n--- REPLENISHMENT SOURCES MAPPING ---");
    const { data: mappings, error: mappingsError } = await supabase.from('site_replenishment_sources').select('*');
    if (mappingsError) {
        console.error(mappingsError);
    } else {
        console.log("Mappings count:", mappings?.length);
        mappings?.forEach(m => {
            const store = sites.find(s => s.id === m.site_id)?.name;
            const source = sites.find(s => s.id === m.source_site_id)?.name;
            console.log(`- Store: ${store} (ID: ${m.site_id}) -> Feeder: ${source} (ID: ${m.source_site_id})`);
        });
    }

    console.log("\n--- PRODUCT GN019 STOCKS ---");
    const { data: products, error: productsError } = await supabase.from('products').select('*').eq('sku', 'GN019');
    if (productsError) {
        console.error(productsError);
    } else {
        products?.forEach(p => {
            const siteName = sites.find(s => s.id === p.site_id)?.name || 'Unknown';
            console.log(`- Product in ${siteName} (ID: ${p.site_id}): Stock: ${p.stock}, minStock: ${p.min_stock}`);
        });
    }
}
main();
