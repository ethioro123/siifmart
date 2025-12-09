import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, serviceRoleKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const STAFF_ACCOUNTS = [
    { email: 'super.admin@siifmart.com', name: 'Super Admin', role: 'super_admin' },
    { email: 'admin@siifmart.com', name: 'Admin', role: 'admin' },
    { email: 'finance.manager@siifmart.com', name: 'Finance Manager', role: 'finance_manager' },
    { email: 'procurement.manager@siifmart.com', name: 'Procurement Manager', role: 'procurement_manager' },
    { email: 'manager@siifmart.com', name: 'General Manager', role: 'manager' },
    { email: 'retail.manager@siifmart.com', name: 'Retail Manager', role: 'manager' },
    { email: 'warehouse.manager@siifmart.com', name: 'Warehouse Manager', role: 'manager' },
    { email: 'hr@siifmart.com', name: 'HR', role: 'hr' },
    { email: 'it.support@siifmart.com', name: 'IT Support', role: 'it_support' },
    { email: 'cs.manager@siifmart.com', name: 'CS Manager', role: 'cs_manager' },
    { email: 'store.supervisor@siifmart.com', name: 'Store Supervisor', role: 'store_supervisor' },
    { email: 'pos@siifmart.com', name: 'POS', role: 'pos' },
    { email: 'inventory.specialist@siifmart.com', name: 'Inventory Specialist', role: 'inventory_specialist' },
    { email: 'wms@siifmart.com', name: 'WMS', role: 'wms' },
    { email: 'picker@siifmart.com', name: 'Picker', role: 'picker' },
    { email: 'driver@siifmart.com', name: 'Driver', role: 'driver' },
    { email: 'auditor@siifmart.com', name: 'Auditor', role: 'auditor' },
];

const PASSWORD = 'Test123!';

async function createAuthAccounts() {
    console.log('🔐 Creating authentication accounts for all staff...\n');
    console.log(`Password for all accounts: ${PASSWORD}\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const staff of STAFF_ACCOUNTS) {
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: staff.email,
                password: PASSWORD,
                email_confirm: true,
                user_metadata: {
                    name: staff.name,
                    role: staff.role
                }
            });

            if (error) {
                // Check if user already exists
                if (error.message.includes('already registered')) {
                    console.log(`⚠️  ${staff.name} - Already exists, skipping`);
                } else {
                    throw error;
                }
            } else {
                console.log(`✅ ${staff.name} (${staff.email})`);
                successCount++;
            }
        } catch (error) {
            console.error(`❌ ${staff.name} - Error: ${error.message}`);
            errors.push({ staff: staff.name, error: error.message });
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} accounts`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📧 Total staff: ${STAFF_ACCOUNTS.length}`);

    if (errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        errors.forEach(e => console.log(`   - ${e.staff}: ${e.error}`));
    }

    console.log('\n🔑 Login Credentials:');
    console.log('   Email: Any staff email from the list');
    console.log(`   Password: ${PASSWORD}`);
}

createAuthAccounts();
