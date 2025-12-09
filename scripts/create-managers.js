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

async function createManagers() {
    console.log('👔 Creating Retail and Warehouse Managers...\n');

    // Get sites
    const { data: sites, error: sitesError } = await supabase.from('sites').select('*');

    if (sitesError || !sites || sites.length === 0) {
        console.error('❌ Error fetching sites:', sitesError);
        return;
    }

    // Find a retail store and a warehouse
    const retailSite = sites.find(s => s.type === 'Store') || sites[0];
    const warehouseSite = sites.find(s => s.type === 'Warehouse') || sites[1];

    const managers = [
        {
            site_id: retailSite.id,
            name: 'Retail Manager',
            role: 'manager',
            email: 'retail.manager@siifmart.com',
            phone: '555-1001',
            status: 'Active',
            join_date: new Date().toISOString(),
            department: 'Retail Operations',
            specialization: 'Retail Management',
            avatar: 'https://ui-avatars.com/api/?name=Retail+Manager&background=3b82f6&color=fff',
            performance_score: 92,
            attendance_rate: 96
        },
        {
            site_id: warehouseSite.id,
            name: 'Warehouse Manager',
            role: 'manager',
            email: 'warehouse.manager@siifmart.com',
            phone: '555-1002',
            status: 'Active',
            join_date: new Date().toISOString(),
            department: 'Logistics & Warehouse',
            specialization: 'Warehouse Operations',
            avatar: 'https://ui-avatars.com/api/?name=Warehouse+Manager&background=8b5cf6&color=fff',
            performance_score: 94,
            attendance_rate: 98
        }
    ];

    const { data, error } = await supabase
        .from('employees')
        .insert(managers)
        .select();

    if (error) {
        console.error('❌ Error creating managers:', error);
        return;
    }

    console.log('✅ Managers created successfully!\n');
    console.log('📋 RETAIL MANAGER');
    console.log('   📧 Email: retail.manager@siifmart.com');
    console.log(`   🏢 Site: ${retailSite.name}`);
    console.log('   📦 Department: Retail Operations');
    console.log('   ⭐ Specialization: Retail Management\n');

    console.log('📋 WAREHOUSE MANAGER');
    console.log('   📧 Email: warehouse.manager@siifmart.com');
    console.log(`   🏢 Site: ${warehouseSite.name}`);
    console.log('   📦 Department: Logistics & Warehouse');
    console.log('   ⭐ Specialization: Warehouse Operations\n');

    console.log(`✅ Total Employees: ${(await supabase.from('employees').select('id', { count: 'exact' })).count}`);
}

createManagers();
