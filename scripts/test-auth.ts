
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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('🔍 Starting Auth Diagnosis...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    try {
        // 1. Check Connection
        console.log('\n1️⃣ Checking Database Connection...');
        const { data: sites, error: siteError } = await supabase.from('sites').select('id').limit(1);
        if (siteError) throw new Error(`Database connection failed: ${siteError.message}`);
        console.log('✅ Database connected. Found site ID:', sites[0]?.id);
        const siteId = sites[0]?.id;

        // 2. Test Sign Up
        console.log('\n2️⃣ Testing Sign Up...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });

        if (signUpError) throw new Error(`Sign Up failed: ${signUpError.message}`);
        console.log('✅ Sign Up successful. User ID:', signUpData.user?.id);

        if (!signUpData.session) {
            console.warn('⚠️ WARNING: No session returned after Sign Up. Email confirmation might be enabled.');
        }

        // 3. Test Employee Creation (Simulating what happens after signup)
        console.log('\n3️⃣ Testing Employee Creation...');
        if (signUpData.user) {
            const employeeData = {
                id: signUpData.user.id, // Important: Link to Auth ID
                name: 'Test User',
                email: testEmail,
                role: 'super_admin',
                site_id: siteId,
                status: 'Active',
                join_date: new Date().toISOString().split('T')[0],
                phone: '+1234567890',
                department: 'IT',
                avatar: '',
                performance_score: 100
            };

            const { error: empError } = await supabase.from('employees').insert(employeeData);
            if (empError) {
                console.error('❌ Employee creation failed:', empError.message);
                console.error('   Hint: This is likely an RLS (Permission) issue.');
            } else {
                console.log('✅ Employee record created successfully.');
            }
        }

        // 4. Test Sign In
        console.log('\n4️⃣ Testing Sign In...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) throw new Error(`Sign In failed: ${signInError.message}`);
        console.log('✅ Sign In successful. Session active.');

        // 5. Test Fetching Employee Data (The step where it "hangs")
        console.log('\n5️⃣ Testing Employee Data Fetch...');
        const { data: employee, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', testEmail)
            .single();

        if (fetchError) {
            console.error('❌ Failed to fetch employee data:', fetchError.message);
        } else {
            console.log('✅ Employee data fetched successfully:', employee.name);
        }

    } catch (error: any) {
        console.error('\n❌ DIAGNOSIS FAILED:', error.message);
    }
}

testAuth();
