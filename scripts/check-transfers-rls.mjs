/**
 * Fix Transfers RLS Policies using Service Role Key
 * This uses the Supabase service role to execute RPC functions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwOTk0NSwiZXhwIjoyMDc5Mzg1OTQ1fQ.toS8r1CEPIhV6gddpKNRgjTY_IDfWEJODNnCxu_78KQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkCurrentRLS() {
    console.log('🔍 Checking current RLS status on transfers table...\n');

    // Try to list transfers to see if RLS is an issue
    const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .limit(5);

    if (error) {
        console.log('❌ Error accessing transfers:', error.message);
    } else {
        console.log('✅ Can access transfers table with service role');
        console.log(`   Found ${data?.length || 0} transfers`);
    }
}

async function testCreateTransfer() {
    console.log('\n📦 Testing transfer creation with service role...\n');

    // Get a valid site ID first
    const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .limit(2);

    if (!sites || sites.length < 2) {
        console.log('❌ Need at least 2 sites to test transfer');
        return;
    }

    console.log('   Source:', sites[0].name);
    console.log('   Destination:', sites[1].name);

    // Create a test transfer
    const { data, error } = await supabase
        .from('transfers')
        .insert({
            source_site_id: sites[0].id,
            dest_site_id: sites[1].id,
            status: 'Requested',
            transfer_date: new Date().toISOString(),
            items: [{ productId: 'test', productName: 'Test Product', quantity: 1 }]
        })
        .select()
        .single();

    if (error) {
        console.log('❌ Create failed:', error.message);
        console.log('   Code:', error.code);
        console.log('   Details:', error.details);
    } else {
        console.log('✅ Transfer created successfully!');
        console.log('   ID:', data.id);

        // Clean up test transfer
        await supabase.from('transfers').delete().eq('id', data.id);
        console.log('   (Test transfer deleted)');
    }
}

async function testWithAnonKey() {
    console.log('\n🔐 Testing with ANON key (what the app uses)...\n');

    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // First sign in as a user to be "authenticated"
    console.log('   Signing in as super_admin...');
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: 'superadmin@siifmart.com',
        password: 'super123'
    });

    if (authError) {
        console.log('❌ Auth failed:', authError.message);
        return;
    }

    console.log('   ✅ Signed in as:', authData.user?.email);

    // Now try to access transfers
    const { data: transfers, error: selectError } = await anonClient
        .from('transfers')
        .select('*')
        .limit(5);

    if (selectError) {
        console.log('❌ SELECT failed:', selectError.message);
    } else {
        console.log('   ✅ SELECT works - found', transfers?.length || 0, 'transfers');
    }

    // Get sites for test
    const { data: sites } = await anonClient.from('sites').select('id, name').limit(2);

    if (sites && sites.length >= 2) {
        // Try to create
        const { data: created, error: createError } = await anonClient
            .from('transfers')
            .insert({
                source_site_id: sites[0].id,
                dest_site_id: sites[1].id,
                status: 'Requested',
                transfer_date: new Date().toISOString(),
                items: [{ productId: 'test', productName: 'RLS Test', quantity: 1 }]
            })
            .select()
            .single();

        if (createError) {
            console.log('   ❌ INSERT failed:', createError.message);
            console.log('   Code:', createError.code);
            console.log('\n⚠️  RLS POLICY NEEDS TO BE FIXED IN SUPABASE DASHBOARD');
            console.log('   Please go to: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/database/policies');
            console.log('   Find the "transfers" table and add INSERT policy for authenticated users');
        } else {
            console.log('   ✅ INSERT works! Transfer ID:', created.id);

            // Clean up
            await anonClient.from('transfers').delete().eq('id', created.id);
            console.log('   (Test transfer cleaned up)');

            console.log('\n🎉 RLS is working correctly! Transfers should work in the app now.');
        }
    }

    // Sign out
    await anonClient.auth.signOut();
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  SUPABASE RLS DIAGNOSTIC FOR TRANSFERS TABLE');
    console.log('═'.repeat(60));

    await checkCurrentRLS();
    await testCreateTransfer();
    await testWithAnonKey();

    console.log('\n' + '═'.repeat(60));
    console.log('  DIAGNOSTIC COMPLETE');
    console.log('═'.repeat(60));
}

main().catch(console.error);
