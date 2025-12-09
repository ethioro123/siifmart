
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

async function cleanup() {
    console.log('Starting backend cleanup...');

    try {
        // 1. Get all Store sites
        const { data: stores, error: storeError } = await supabase
            .from('sites')
            .select('id, name')
            .eq('type', 'Store');

        if (storeError) throw storeError;

        if (!stores || stores.length === 0) {
            console.log('No stores found to clean up.');
            return;
        }

        const storeIds = stores.map(s => s.id);
        console.log(`Found ${stores.length} stores: ${stores.map(s => s.name).join(', ')}`);

        // 2. Delete products for these stores
        // Note: This matches the logic in seed_products.sql which deleted everything for store sites.
        // To be safe, we should probably only delete the ones we added, but the user said "remove the data from the backend".
        // Given the previous script deleted everything for the site, the current state IS just the seeded data.
        // So deleting everything for these sites again is effectively cleaning up the seed.

        const { error: deleteError, count } = await supabase
            .from('products')
            .delete({ count: 'exact' })
            .in('site_id', storeIds);

        if (deleteError) throw deleteError;

        console.log(`Successfully deleted ${count} products from ${stores.length} stores.`);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
}

cleanup();
