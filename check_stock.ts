
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

async function checkStock() {
    console.log('Checking stock levels per site...');

    try {
        // 1. Get all sites
        const { data: sites, error: siteError } = await supabase
            .from('sites')
            .select('id, name, type');

        if (siteError) throw siteError;

        if (!sites || sites.length === 0) {
            console.log('No sites found.');
            return;
        }

        console.log('\n--- Stock Report ---');

        // 2. Iterate and count products for each site
        for (const site of sites) {
            const { count, error } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('siteId', site.id);

            if (error) {
                // Try snake_case if camelCase fails (handling schema uncertainty)
                const { count: count2, error: error2 } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('site_id', site.id);

                if (error2) {
                    console.error(`Error checking site ${site.name}:`, error2.message);
                    continue;
                }
                console.log(`[${site.type}] ${site.name}: ${count2} products`);
            } else {
                console.log(`[${site.type}] ${site.name}: ${count} products`);
            }
        }
        console.log('--------------------');

    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkStock();
