import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Note: This script creates user records in the employees table
// Supabase Auth accounts need to be created via the Supabase Dashboard or Admin API
// For development, we'll use the existing demo mode

async function setupAuthAccounts() {
    console.log('🔐 Setting up Auth Accounts for All Staff...\n');
    console.log('='.repeat(60));

    try {
        // Get all employees
        const { data: employees, error } = await supabase
            .from('employees')
            .select('id, name, email, role, site_id')
            .order('role, name');

        if (error) throw error;

        console.log(`\n✅ Found ${employees.length} employees in database\n`);

        console.log('📋 AUTHENTICATION SETUP INSTRUCTIONS:');
        console.log('='.repeat(60));
        console.log('\nSince we cannot create Supabase Auth users via the client SDK,');
        console.log('you have TWO options:\n');

        console.log('OPTION 1: Use Demo Mode (Recommended for Development)');
        console.log('-'.repeat(60));
        console.log('The app already has demo mode that allows login with any email');
        console.log('from the quick login list using password: Test123!\n');
        console.log('This works because the auth service falls back to demo mode');
        console.log('when Supabase auth fails.\n');

        console.log('OPTION 2: Create Auth Users via Supabase Dashboard');
        console.log('-'.repeat(60));
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to Authentication > Users');
        console.log('4. Click "Add User" for each employee');
        console.log('5. Use these credentials:\n');

        console.log('EMAIL                              | PASSWORD  | ROLE');
        console.log('-'.repeat(60));
        employees.forEach(emp => {
            console.log(`${emp.email.padEnd(35)} | Test123!  | ${emp.role}`);
        });

        console.log('\n\n💡 QUICK START:');
        console.log('='.repeat(60));
        console.log('Just use the Quick Login buttons on the login page!');
        console.log('They will work in demo mode automatically.\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

setupAuthAccounts()
    .then(() => {
        console.log('\n✅ Setup information displayed!');
        console.log('\n🎯 Next Step: Use Quick Login buttons on the login page');
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
