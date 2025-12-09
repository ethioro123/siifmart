import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, anonKey, serviceRoleKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') anonKey = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const PASSWORD = 'Test123!';

// Roles to add to ensure coverage
const ADDITIONAL_ROLES = [
    { role: 'pos', name: 'POS Cashier', dept: 'Retail Operations' },
    { role: 'picker', name: 'Warehouse Picker', dept: 'Logistics & Warehouse' },
    { role: 'wms', name: 'WMS Operator', dept: 'Logistics & Warehouse' },
    { role: 'store_supervisor', name: 'Store Supervisor', dept: 'Retail Operations' },
    { role: 'inventory_specialist', name: 'Inventory Specialist', dept: 'Operations' },
    { role: 'cs_manager', name: 'CS Manager', dept: 'Customer Service' },
    { role: 'it_support', name: 'IT Support', dept: 'IT' },
    { role: 'auditor', name: 'Auditor', dept: 'Finance' },
    { role: 'procurement_manager', name: 'Procurement Manager', dept: 'Operations' },
];

async function fillSites() {
    console.log('🏢 Filling sites with staff...\n');

    // Get all sites
    const { data: sites } = await supabaseAnon.from('sites').select('*').order('name');

    // Get existing employees
    const { data: existingEmployees } = await supabaseAnon.from('employees').select('*');

    const existingRoles = new Set(existingEmployees.map(e => e.role));
    const newEmployees = [];
    const newAuthAccounts = [];

    let siteIndex = 0;

    for (const roleInfo of ADDITIONAL_ROLES) {
        if (!existingRoles.has(roleInfo.role)) {
            const site = sites[siteIndex % sites.length];
            siteIndex++;

            const email = `${roleInfo.role.replace('_', '.')}@siifmart.com`;

            const employee = {
                site_id: site.id,
                name: roleInfo.name,
                role: roleInfo.role,
                email: email,
                phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
                status: 'Active',
                join_date: new Date().toISOString(),
                department: roleInfo.dept,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(roleInfo.name)}&background=random`,
                performance_score: 85 + Math.floor(Math.random() * 15),
                attendance_rate: 90 + Math.floor(Math.random() * 10)
            };

            newEmployees.push(employee);
            newAuthAccounts.push({
                email: email,
                name: roleInfo.name,
                role: roleInfo.role,
                site_id: site.id
            });

            console.log(`➕ Adding ${roleInfo.name} to ${site.name}`);
        }
    }

    if (newEmployees.length === 0) {
        console.log('✅ All roles already filled!');
        return;
    }

    // Insert employees
    const { data: insertedEmployees, error: insertError } = await supabaseAnon
        .from('employees')
        .insert(newEmployees)
        .select();

    if (insertError) {
        console.error('❌ Error inserting employees:', insertError);
        return;
    }

    console.log(`\n✅ Created ${insertedEmployees.length} new employees\n`);

    // Create auth accounts
    console.log('🔐 Creating auth accounts...\n');

    for (let i = 0; i < newAuthAccounts.length; i++) {
        const account = newAuthAccounts[i];
        const employee = insertedEmployees[i];

        try {
            const { error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: account.email,
                password: PASSWORD,
                email_confirm: true,
                user_metadata: {
                    name: account.name,
                    role: account.role,
                    site_id: account.site_id,
                    employee_id: employee.id
                }
            });

            if (authError && !authError.message.includes('already registered')) {
                throw authError;
            }

            console.log(`✅ ${account.name} - Auth account created`);
        } catch (error) {
            console.error(`❌ ${account.name} - Auth error: ${error.message}`);
        }
    }

    console.log(`\n✅ Complete! Added ${newEmployees.length} staff members`);
    console.log(`📧 All use password: ${PASSWORD}`);
}

fillSites();
