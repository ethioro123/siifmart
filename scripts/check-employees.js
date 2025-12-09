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

async function checkEmployees() {
    console.log('🔍 Checking employees in database...\n');

    const { data, error, count } = await supabase
        .from('employees')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('❌ Error fetching employees:', error);
        return;
    }

    console.log(`📊 Total Employees: ${count}\n`);

    if (data && data.length > 0) {
        // Group by role
        const byRole = {};
        data.forEach(emp => {
            if (!byRole[emp.role]) byRole[emp.role] = [];
            byRole[emp.role].push(emp);
        });

        console.log('📋 Employees by Role:');
        console.log('='.repeat(60));
        Object.keys(byRole).sort().forEach(role => {
            console.log(`\n${role.toUpperCase()} (${byRole[role].length}):`);
            byRole[role].forEach(emp => {
                console.log(`  - ${emp.name} (${emp.email}) - Site: ${emp.site_id?.substring(0, 8)}...`);
            });
        });
    } else {
        console.log('⚠️  No employees found in database!');
    }
}

checkEmployees();
