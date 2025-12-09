import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('🧪 Testing Login Flow...\n');

    const email = 'admin@siifmart.com';
    const password = 'Admin123!';

    try {
        // 1. Test sign in
        console.log('1️⃣ Testing sign in...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('❌ Sign in failed:', error.message);
            return;
        }

        console.log('✅ Sign in successful!');
        console.log('   User ID:', data.user?.id);
        console.log('   Email:', data.user?.email);

        // 2. Test fetching employee
        console.log('\n2️⃣ Testing employee fetch...');
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (empError) {
            console.error('❌ Employee fetch failed:', empError.message);
            return;
        }

        console.log('✅ Employee found!');
        console.log('   Name:', employee.name);
        console.log('   Role:', employee.role);
        console.log('   Status:', employee.status);

        console.log('\n✅ ALL TESTS PASSED! Login should work in the browser.\n');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testLogin();
