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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateQuickLoginList() {
    console.log('📊 Fetching all employees from database...\n');

    const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('role', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Found ${employees.length} employees\n`);

    // Group by role
    const roleGroups = employees.reduce((acc, emp) => {
        if (!acc[emp.role]) acc[emp.role] = [];
        acc[emp.role].push(emp);
        return acc;
    }, {});

    // Role badge colors
    const roleBadges = {
        'super_admin': 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
        'admin': 'bg-purple-400/20 text-purple-400 border-purple-400/30',
        'hr': 'bg-pink-400/20 text-pink-400 border-pink-400/30',
        'finance_manager': 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
        'procurement_manager': 'bg-indigo-400/20 text-indigo-400 border-indigo-400/30',
        'cs_manager': 'bg-sky-400/20 text-sky-400 border-sky-400/30',
        'it_support': 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
        'auditor': 'bg-rose-400/20 text-rose-400 border-rose-400/30',
        'warehouse_manager': 'bg-violet-400/20 text-violet-400 border-violet-400/30',
        'dispatcher': 'bg-fuchsia-400/20 text-fuchsia-400 border-fuchsia-400/30',
        'picker': 'bg-orange-400/20 text-orange-400 border-orange-400/30',
        'driver': 'bg-amber-400/20 text-amber-400 border-amber-400/30',
        'manager': 'bg-blue-400/20 text-blue-400 border-blue-400/30',
        'store_supervisor': 'bg-blue-300/20 text-blue-300 border-blue-300/30',
        'pos': 'bg-green-400/20 text-green-400 border-green-400/30',
        'inventory_specialist': 'bg-lime-400/20 text-lime-400 border-lime-400/30'
    };

    console.log('📝 Generating Quick Login List...\n');
    console.log('const QUICK_LOGINS = [');

    Object.entries(roleGroups).forEach(([role, emps]) => {
        console.log(`  // ${role.toUpperCase().replace(/_/g, ' ')} (${emps.length})`);
        emps.forEach(emp => {
            const badge = roleBadges[role] || 'bg-gray-400/20 text-gray-400 border-gray-400/30';
            console.log(`  { name: '${emp.name}', email: '${emp.email}', role: '${emp.role}', badgeClass: '${badge}' },`);
        });
        console.log('');
    });

    console.log('];');
    console.log('\n✨ Copy the above array to LoginPage.tsx!');
}

generateQuickLoginList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
