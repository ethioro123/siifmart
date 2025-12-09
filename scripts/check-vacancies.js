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

// All roles defined in the system
const ALL_ROLES = [
    'super_admin',
    'admin',
    'manager',
    'wms',
    'pos',
    'picker',
    'hr',
    'auditor',
    'driver',
    'finance_manager',
    'procurement_manager',
    'store_supervisor',
    'inventory_specialist',
    'cs_manager',
    'it_support'
];

async function checkVacancies() {
    console.log('🔍 Checking for vacant roles...\n');

    const { data: employees, error } = await supabase
        .from('employees')
        .select('role');

    if (error) {
        console.error('❌ Error fetching employees:', error);
        return;
    }

    const existingRoles = new Set(employees.map(e => e.role));
    const vacantRoles = ALL_ROLES.filter(role => !existingRoles.has(role));

    console.log('📊 Role Analysis:');
    console.log('='.repeat(60));
    console.log(`Total Roles Defined: ${ALL_ROLES.length}`);
    console.log(`Roles Filled: ${existingRoles.size}`);
    console.log(`Vacant Roles: ${vacantRoles.length}\n`);

    if (vacantRoles.length > 0) {
        console.log('⚠️  VACANT ROLES:');
        vacantRoles.forEach(role => {
            console.log(`  ❌ ${role.toUpperCase().replace('_', ' ')}`);
        });
    } else {
        console.log('✅ All roles are filled!');
    }

    console.log('\n📋 Filled Roles:');
    ALL_ROLES.forEach(role => {
        if (existingRoles.has(role)) {
            console.log(`  ✅ ${role.toUpperCase().replace('_', ' ')}`);
        }
    });

    return vacantRoles;
}

checkVacancies();
