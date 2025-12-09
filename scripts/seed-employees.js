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

const roles = [
    'finance_manager', 'procurement_manager', 'store_supervisor',
    'inventory_specialist', 'cs_manager', 'it_support'
];

const skippedRoles = [];

async function seed() {
    console.log('Fetching sites...');
    const { data: sites, error: sitesError } = await supabase.from('sites').select('id');
    if (sitesError) {
        console.error('Error fetching sites:', sitesError);
        return;
    }

    if (!sites || sites.length === 0) {
        console.error('No sites found. Please create sites first.');
        return;
    }

    console.log(`Found ${sites.length} sites.`);

    const employees = [];
    let siteIndex = 0;

    for (const role of roles) {
        const email = `${role.replace('_', '.')}@siifmart.com`;

        // Check if employee exists
        const { data: existing } = await supabase.from('employees').select('id').eq('email', email).single();

        if (existing) {
            console.log(`Skipping ${role} (already exists)`);
            continue;
        }

        const site = sites[siteIndex % sites.length];
        siteIndex++;

        const name = `${role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;

        employees.push({
            site_id: site.id,
            name: name,
            role: role,
            email: email,
            phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
            status: 'Active',
            join_date: new Date().toISOString(),
            department: getDepartment(role),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            performance_score: 85 + Math.floor(Math.random() * 15),
            attendance_rate: 90 + Math.floor(Math.random() * 10)
        });
    }

    console.log(`Preparing to insert ${employees.length} employees...`);

    const { data, error } = await supabase.from('employees').insert(employees).select();

    if (error) {
        console.error('Error inserting employees:', error);
    } else {
        console.log(`Successfully inserted ${data.length} employees.`);
        if (skippedRoles.length > 0) {
            console.warn('\n⚠️  SKIPPED ROLES (Database Constraint Violation):');
            console.warn('The following roles were not created because they are not allowed by the current database schema:');
            console.warn(skippedRoles.join(', '));
            console.warn('\nPlease run the SQL in `update_roles_constraint.sql` in your Supabase Dashboard to enable these roles, then run this script again.');
        }
    }
}

function getDepartment(role) {
    if (role.includes('admin') || role.includes('manager')) return 'Management';
    if (role.includes('wms') || role.includes('picker') || role.includes('driver') || role.includes('inventory')) return 'Operations';
    if (role.includes('pos') || role.includes('store')) return 'Retail';
    if (role.includes('hr')) return 'Human Resources';
    if (role.includes('finance') || role.includes('auditor')) return 'Finance';
    if (role.includes('it')) return 'IT';
    if (role.includes('cs')) return 'Customer Service';
    return 'General';
}

seed();
