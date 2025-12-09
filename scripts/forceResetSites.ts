/**
 * Force Reset and Seed Sites
 * Clears all data and creates fresh Ethiopian locations
 * 
 * ⚠️  WARNING: This will DELETE ALL DATA (sites, products, sales, etc.)!
 * Run with: npx tsx scripts/forceResetSites.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

async function forceReset() {
    console.log('🔄 SIIFMART Ethiopia - FORCE RESET & SEED');
    console.log('⚠️  This will delete ALL data in the database!\n');

    try {
        // Delete in correct order to respect foreign key constraints
        console.log('🗑️  Deleting all data (this may take a moment)...\n');

        // 1. Delete sale items first
        console.log('   Deleting sale items...');
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 2. Delete sales
        console.log('   Deleting sales...');
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Delete PO items
        console.log('   Deleting purchase order items...');
        await supabase.from('po_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 4. Delete purchase orders
        console.log('   Deleting purchase orders...');
        await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 5. Delete stock movements
        console.log('   Deleting stock movements...');
        await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 6. Delete WMS jobs
        console.log('   Deleting WMS jobs...');
        await supabase.from('wms_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 7. Delete expenses
        console.log('   Deleting expenses...');
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 8. Delete products
        console.log('   Deleting products...');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 9. Delete employees
        console.log('   Deleting employees...');
        await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 10. Finally delete sites
        console.log('   Deleting sites...');
        await supabase.from('sites').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log('\n✅ All data deleted successfully\n');

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

        console.log('\n🎉 Reset and seeding completed successfully!');
        console.log(`   Total sites: ${(warehouses?.length || 0) + (stores?.length || 0)}`);

    } catch (error) {
        console.error('\n❌ Operation failed:', error);
        throw error;
    }
}

// Run immediately without confirmation (use with caution!)
forceReset()
    .then(() => {
        console.log('\n✨ All done! Refresh your application to see the new sites.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
