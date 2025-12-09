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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllRoles() {
    console.log('🔍 Checking all employee roles in database...\n');

    const { data: employees, error } = await supabase
        .from('employees')
        .select('role, name, email')
        .order('role');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    // Group by role
    const roleGroups = employees.reduce((acc, emp) => {
        if (!acc[emp.role]) acc[emp.role] = [];
        acc[emp.role].push(`${emp.name} (${emp.email})`);
        return acc;
    }, {});

    console.log('📊 Current roles in database:\n');
    Object.entries(roleGroups).forEach(([role, names]) => {
        console.log(`${role}:`);
        names.forEach(name => console.log(`  - ${name}`));
        console.log('');
    });

    console.log('\n📋 Summary:');
    Object.entries(roleGroups).forEach(([role, names]) => {
        console.log(`  ${role}: ${names.length} employee(s)`);
    });
}

checkAllRoles()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
