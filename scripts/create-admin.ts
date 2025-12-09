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
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
    console.log('🔐 Creating Super Admin Account...\n');

    const email = 'admin@siifmart.com';
    const password = 'Admin123!';
    const name = 'Super Admin';

    try {
        // 1. Get site ID
        const { data: sites } = await supabase.from('sites').select('id').limit(1);
        if (!sites || sites.length === 0) {
            throw new Error('No site found. Please run migration first.');
        }
        const siteId = sites[0].id;

        // 2. Sign up the user
        console.log('📝 Creating authentication account...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: 'super_admin',
                    site_id: siteId
                }
            }
        });

        if (authError) {
            // User might already exist
            if (authError.message.includes('already registered')) {
                console.log('⚠️  User already exists. Attempting to find existing employee record...');

                const { data: existingEmp } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (existingEmp) {
                    console.log('\n✅ EXISTING SUPER ADMIN FOUND!\n');
                    console.log('═══════════════════════════════════════');
                    console.log('📧 Email:    ', email);
                    console.log('🔑 Password: ', password);
                    console.log('👤 Name:     ', existingEmp.name);
                    console.log('🎖️  Role:     ', existingEmp.role);
                    console.log('═══════════════════════════════════════\n');
                    console.log('🌐 Login at: http://localhost:3003\n');
                    return;
                }
            }
            throw authError;
        }

        if (!authData.user) {
            throw new Error('Failed to create user');
        }

        // 3. Create employee record
        console.log('👤 Creating employee profile...');
        const { error: empError } = await supabase.from('employees').insert({
            id: authData.user.id,
            name,
            email,
            role: 'super_admin',
            site_id: siteId,
            status: 'Active',
            join_date: new Date().toISOString().split('T')[0],
            phone: '+251-911-000000',
            department: 'Management',
            avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff',
            performance_score: 100
        });

        if (empError) {
            console.error('❌ Employee creation failed:', empError.message);
            throw empError;
        }

        console.log('\n✅ SUPER ADMIN CREATED SUCCESSFULLY!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:    ', email);
        console.log('🔑 Password: ', password);
        console.log('👤 Name:     ', name);
        console.log('🎖️  Role:     super_admin');
        console.log('═══════════════════════════════════════\n');
        console.log('🌐 Login at: http://localhost:3003\n');
        console.log('💡 You can use either the email or username "Super Admin" to login\n');

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

createSuperAdmin();
