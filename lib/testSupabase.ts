
/**
 * Supabase Connection Test
 * Run this to verify your Supabase setup is working
 */

import { supabase, isSupabaseConfigured } from './supabase';

export async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Check if configured
    if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured!');
        console.error('Please check your .env.local file');
        return false;
    }

    console.log('✅ Environment variables found');

    try {
        // Test 1: Check connection
        console.log('\n📡 Test 1: Checking connection...');
        const { data, error } = await supabase.from('sites').select('count');

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Connection successful!');

        // Test 2: Check tables
        console.log('\n📊 Test 2: Checking tables...');
        const tables = [
            'sites', 'products', 'customers', 'employees',
            'suppliers', 'purchase_orders', 'sales', 'stock_movements'
        ];

        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('count').limit(1);
            if (tableError) {
                console.error(`❌ Table '${table}' not found or not accessible`);
                console.error('   Please run the database schema from SUPABASE_SETUP.md');
                return false;
            }
            console.log(`✅ Table '${table}' exists`);
        }

        console.log('\n🎉 All tests passed!');
        console.log('✅ Supabase is ready to use');
        return true;

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return false;
    }
}

// To run this test, import and call testSupabaseConnection() manually
// Example: import { testSupabaseConnection } from './lib/testSupabase';
//          testSupabaseConnection();
