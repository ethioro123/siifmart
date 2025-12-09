import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, supabaseKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
    console.log('👑 Creating Super Admin...\n');

    // Get the first site (HQ)
    const { data: sites, error: sitesError } = await supabase.from('sites').select('id').limit(1);

    if (sitesError || !sites || sites.length === 0) {
        console.error('❌ Error fetching sites:', sitesError);
        return;
    }

    const superAdmin = {
        site_id: sites[0].id,
        name: 'Super Admin',
        role: 'super_admin',
        email: 'super.admin@siifmart.com',
        phone: '555-0000',
        status: 'Active',
        join_date: new Date().toISOString(),
        department: 'Management',
        avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=ffd700&color=000',
        performance_score: 100,
        attendance_rate: 100
    };

    const { data, error } = await supabase
        .from('employees')
        .insert([superAdmin])
        .select();

    if (error) {
        console.error('❌ Error creating Super Admin:', error);
        return;
    }

    console.log('✅ Super Admin created successfully!');
    console.log('\n📧 Email: super.admin@siifmart.com');
    console.log('👤 Name: Super Admin');
    console.log('🏢 Department: Management');
    console.log('⭐ Role: super_admin (Full System Access)');
}

createSuperAdmin();
