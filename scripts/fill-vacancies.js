import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, supabaseServiceKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALL_ROLES = [
    'super_admin', 'admin', 'manager', 'warehouse_manager', 'dispatcher',
    'pos', 'picker', 'hr', 'auditor', 'driver', 'finance_manager',
    'procurement_manager', 'store_supervisor', 'inventory_specialist',
    'cs_manager', 'it_support'
];

async function fillVacancies() {
    console.log('🚀 Starting Organization Chart Update...\n');

    // 1. Update CEO Name
    console.log('👑 Updating CEO Name to Shukri Kamal...');
    const { error: ceoError } = await supabase
        .from('employees')
        .update({ name: 'Shukri Kamal' })
        .eq('role', 'super_admin');

    if (ceoError) {
        console.error('❌ Error updating CEO:', ceoError.message);
    } else {
        console.log('✅ CEO updated successfully!');
    }

    // 2. Check for vacancies
    console.log('\n🔍 Checking for vacant positions...');

    // Get all current roles
    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('role');

    if (fetchError) {
        console.error('❌ Error fetching employees:', fetchError.message);
        return;
    }

    const existingRoles = new Set(employees.map(e => e.role));
    const missingRoles = ALL_ROLES.filter(role => !existingRoles.has(role));

    if (missingRoles.length === 0) {
        console.log('✅ No vacancies found! All positions are filled.');
        return;
    }

    console.log(`⚠️  Found ${missingRoles.length} vacant positions:`);
    missingRoles.forEach(role => console.log(`   - ${role}`));

    // 3. Fill vacancies
    console.log('\n👷 Filling vacancies...');

    // Get a site ID to assign these new employees to (just pick the first one)
    const { data: sites } = await supabase.from('sites').select('id').limit(1);
    const defaultSiteId = sites && sites.length > 0 ? sites[0].id : null;

    if (!defaultSiteId) {
        console.error('❌ No sites found to assign employees to!');
        return;
    }

    const newEmployees = missingRoles.map(role => {
        const name = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return {
            name: `${name} (New)`,
            role: role,
            email: `${role.replace('_', '.')}@siifmart.com`,
            site_id: defaultSiteId,
            status: 'Active',
            join_date: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        };
    });

    const { data: created, error: insertError } = await supabase
        .from('employees')
        .insert(newEmployees)
        .select();

    if (insertError) {
        console.error('❌ Error creating employees:', insertError.message);
    } else {
        console.log(`✅ Successfully hired ${created.length} new employees!`);
        created.forEach(emp => {
            console.log(`   + ${emp.name} as ${emp.role}`);
        });
    }
}

fillVacancies()
    .then(() => {
        console.log('\n✨ Organization chart update complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
