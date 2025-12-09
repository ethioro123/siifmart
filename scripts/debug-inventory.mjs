/**
 * Debug script to check products and jobs in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('🔍 Checking PUTAWAY jobs...');

    // Get all PUTAWAY jobs
    const { data: jobs, error: jobsError } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('type', 'PUTAWAY')
        .order('created_at', { ascending: false })
        .limit(10);

    if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError);
    } else {
        console.log(`📦 Found ${jobs.length} PUTAWAY jobs:`);
        jobs.forEach(job => {
            console.log(`\n   ID: ${job.id}`);
            console.log(`   Status: ${job.status}`);
            console.log(`   Site: ${job.site_id}`);
            console.log(`   Line Items:`, JSON.stringify(job.line_items, null, 2));
        });
    }

    console.log('\n🔍 Checking products at warehouse site...');

    // Get products at warehouse sites
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock, site_id, location')
        .order('created_at', { ascending: false })
        .limit(20);

    if (productsError) {
        console.error('❌ Error fetching products:', productsError);
    } else {
        console.log(`📦 Found ${products.length} products:`);
        products.forEach(p => {
            console.log(`   ${p.name} (${p.sku}) - Stock: ${p.stock}, Site: ${p.site_id}, Location: ${p.location}`);
        });
    }

    console.log('\n🔍 Checking stock movements...');

    // Get recent stock movements
    const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (movementsError) {
        console.error('❌ Error fetching movements:', movementsError);
    } else {
        console.log(`📊 Found ${movements.length} recent stock movements:`);
        movements.forEach(m => {
            console.log(`   ${m.type}: ${m.quantity} - ${m.reason} (${m.created_at})`);
        });
    }
}

debug();
