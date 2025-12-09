
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
}

// Use service role key if available for bypassing RLS, otherwise anon key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey!);

async function migrateHQ() {
    console.log('Starting HQ to Administration migration...');

    try {
        // 1. Update Site Types
        console.log('Updating site types...');
        const { data: updatedSites, error: siteError } = await supabase
            .from('sites')
            .update({
                type: 'Administration',
                name: 'Central Operations' // Optional: Update name if it was 'Headquarters' or 'HQ'
            })
            .or('type.eq.HQ,type.eq.Administrative,name.ilike.%Headquarters%,name.eq.HQ')
            .select();

        if (siteError) {
            console.error('Error updating sites:', siteError);
        } else {
            console.log(`Successfully updated ${updatedSites?.length || 0} sites to 'Administration'.`);
        }

        // 2. Update Employee locations (if they are linked by site type somehow, or just logging)
        // Usually employees link by siteId, so if we didn't change siteId, we are good.
        // But if there's any text field denormalized, we might need to fix it.
        // Assuming strict normalization, step 1 is sufficient for the relation.

        // 3. Update any products linked to HQ (if any)
        // The DataContext logic we updated handled the *filtering* of these.
        // But in the DB, we might want to ensure no products are stuck in 'HQ' if that type is deprecated.
        // We can just log them for now.
        const { count: hqProductCount, error: prodError } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', 'HQ'); // Assuming 'HQ' might be the ID

        if (!prodError && hqProductCount !== null && hqProductCount > 0) {
            console.warn(`WARNING: Found ${hqProductCount} products linked to site_id 'HQ'. You may need to move them.`);
        }

        console.log('Migration completed.');

    } catch (e) {
        console.error('Migration failed with exception:', e);
    }
}

migrateHQ();
