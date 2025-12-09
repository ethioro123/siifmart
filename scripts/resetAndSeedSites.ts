/**
 * Reset and Seed Sites
 * Clears all existing sites and creates fresh Ethiopian locations
 * 
 * ⚠️  WARNING: This will DELETE all existing sites!
 * Run with: npx tsx scripts/resetAndSeedSites.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const WAREHOUSES = [
    { name: 'Adama Distribution Center', type: 'Warehouse', address: 'Adama, Ethiopia', manager: 'Ahmed Hassan', capacity: 10000, terminalCount: 5 },
    { name: 'Harar Logistics Hub', type: 'Warehouse', address: 'Harar, Ethiopia', manager: 'Fatima Yusuf', capacity: 8000, terminalCount: 4 },
    { name: 'Dire Dawa Storage Facility', type: 'Warehouse', address: 'Dire Dawa, Ethiopia', manager: 'Solomon Tesfaye', capacity: 12000, terminalCount: 6 },
    { name: 'Bedeno Fulfillment Center', type: 'Warehouse', address: 'Bedeno, Ethiopia', manager: 'Maryam Ibrahim', capacity: 9000, terminalCount: 5 },
    { name: 'Burqa Cold Chain Warehouse', type: 'Warehouse', address: 'Burqa, Ethiopia', manager: 'Dawit Bekele', capacity: 5000, terminalCount: 3 },
];

const STORES = [
    { name: 'Bole Supermarket', type: 'Store', address: 'Bole, Addis Ababa', manager: 'Sara Mohammed', capacity: 2000, terminalCount: 3 },
    { name: 'Ambo Retail Store', type: 'Store', address: 'Ambo, Ethiopia', manager: 'Yonas Alemayehu', capacity: 1500, terminalCount: 2 },
    { name: 'Aratanya Market', type: 'Store', address: 'Aratanya, Ethiopia', manager: 'Hanna Girma', capacity: 1800, terminalCount: 2 },
    { name: 'Awaday Grocery', type: 'Store', address: 'Awaday, Ethiopia', manager: 'Abdi Rahman', capacity: 1600, terminalCount: 2 },
    { name: 'Fadis Supercenter', type: 'Store', address: 'Fadis, Ethiopia', manager: 'Tigist Haile', capacity: 3000, terminalCount: 4 },
];

async function askConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('⚠️  This will DELETE all existing sites. Continue? (yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function resetAndSeed() {
    console.log('🔄 SIIFMART Ethiopia - Site Reset & Seed\n');

    try {
        // Check existing sites
        const { data: existingSites } = await supabase
            .from('sites')
            .select('id, name');

        if (existingSites && existingSites.length > 0) {
            console.log('📋 Found existing sites:');
            existingSites.forEach(site => console.log(`   - ${site.name}`));
            console.log('');

            const confirmed = await askConfirmation();
            if (!confirmed) {
                console.log('❌ Operation cancelled.');
                return;
            }

            // Delete all sites
            console.log('\n🗑️  Deleting existing sites...');
            const { error: deleteError } = await supabase
                .from('sites')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (deleteError) throw deleteError;
            console.log('✅ All sites deleted');
        }

        // Insert Warehouses
        console.log('\n📦 Creating warehouses...');
        const warehouseData = WAREHOUSES.map(wh => ({
            name: wh.name,
            type: wh.type,
            address: wh.address,
            status: 'Active',
            manager: wh.manager,
            capacity: wh.capacity,
            terminal_count: wh.terminalCount
        }));

        const { data: warehouses, error: whError } = await supabase
            .from('sites')
            .insert(warehouseData)
            .select();

        if (whError) throw whError;
        console.log(`✅ Created ${warehouses?.length} warehouses:`);
        warehouses?.forEach(wh => console.log(`   - ${wh.name}`));

        // Insert Stores
        console.log('\n🏪 Creating stores...');
        const storeData = STORES.map(st => ({
            name: st.name,
            type: st.type,
            address: st.address,
            status: 'Active',
            manager: st.manager,
            capacity: st.capacity,
            terminal_count: st.terminalCount
        }));

        const { data: stores, error: stError } = await supabase
            .from('sites')
            .insert(storeData)
            .select();

        if (stError) throw stError;
        console.log(`✅ Created ${stores?.length} stores:`);
        stores?.forEach(st => console.log(`   - ${st.name}`));

        console.log('\n🎉 Reset and seeding completed successfully!');
        console.log(`   Total sites: ${(warehouses?.length || 0) + (stores?.length || 0)}`);

    } catch (error) {
        console.error('\n❌ Operation failed:', error);
        throw error;
    }
}

// Run
resetAndSeed()
    .then(() => {
        console.log('\n✨ All done! Refresh your application to see the new sites.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
