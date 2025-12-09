/**
 * Database Seeding Script for Sites
 * Creates 5 Warehouses and 5 Stores in Ethiopia
 * 
 * Run with: npx tsx scripts/seedSites.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
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

async function seedSites() {
    console.log('🌱 Starting site seeding for SIIFMART Ethiopia...\n');

    try {
        // Check if sites already exist
        const { data: existingSites } = await supabase
            .from('sites')
            .select('id, name');

        if (existingSites && existingSites.length > 0) {
            console.log('⚠️  Sites already exist:');
            existingSites.forEach(site => console.log(`   - ${site.name}`));
            console.log('\n❓ Delete existing sites first if you want to re-seed.');
            return;
        }

        // Insert Warehouses
        console.log('📦 Creating warehouses...');
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

        console.log('\n🎉 Seeding completed successfully!');
        console.log(`   Total sites created: ${(warehouses?.length || 0) + (stores?.length || 0)}`);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        throw error;
    }
}

// Run the seeding
seedSites()
    .then(() => {
        console.log('\n✨ All done! You can now use the application.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
