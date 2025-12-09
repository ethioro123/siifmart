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

async function updateDatabaseAndEmployees() {
    console.log('🚀 Starting complete migration process...\n');

    try {
        // Step 1: Update database constraint using RPC or direct SQL
        console.log('📝 Step 1: Updating database schema...');

        // We'll use a workaround: update employees one by one with error handling
        // First, let's check current employees
        const { data: wmsEmployees, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('role', 'wms');

        if (fetchError) {
            console.error('❌ Error fetching employees:', fetchError);
            return;
        }

        if (!wmsEmployees || wmsEmployees.length === 0) {
            console.log('ℹ️  No employees with "wms" role found.\n');

            // Show current warehouse employees
            const { data: warehouseEmployees } = await supabase
                .from('employees')
                .select('*')
                .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver']);

            if (warehouseEmployees && warehouseEmployees.length > 0) {
                console.log('✅ Current warehouse employees:');
                warehouseEmployees.forEach(emp => {
                    console.log(`   - ${emp.name} (${emp.role})`);
                });
            }
            console.log('\n✨ Migration already complete or not needed!');
            return;
        }

        console.log(`📊 Found ${wmsEmployees.length} employee(s) with "wms" role:\n`);
        wmsEmployees.forEach((emp, index) => {
            console.log(`   ${index + 1}. ${emp.name} (${emp.email})`);
        });

        console.log('\n⚠️  Database constraint needs to be updated first!');
        console.log('📝 Please run this SQL in your Supabase SQL Editor:\n');

        const sql = `
-- Update Database Schema
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE employees ADD CONSTRAINT employees_role_check 
CHECK (role IN (
    'super_admin', 'admin', 'manager',
    'warehouse_manager', 'dispatcher',
    'pos', 'picker', 'hr', 'auditor', 'driver',
    'finance_manager', 'procurement_manager',
    'store_supervisor', 'inventory_specialist',
    'cs_manager', 'it_support'
));

-- Then update employees
UPDATE employees SET role = 'warehouse_manager' 
WHERE role = 'wms' AND id = '${wmsEmployees[0].id}';

${wmsEmployees.slice(1).map(emp =>
            `UPDATE employees SET role = 'dispatcher' WHERE role = 'wms' AND id = '${emp.id}';`
        ).join('\n')}
        `.trim();

        console.log('─'.repeat(80));
        console.log(sql);
        console.log('─'.repeat(80));

        console.log('\n📋 After running the SQL above, your employees will be:');
        console.log(`   ✅ ${wmsEmployees[0].name} → Warehouse Manager`);
        wmsEmployees.slice(1).forEach(emp => {
            console.log(`   ✅ ${emp.name} → Warehouse Dispatcher`);
        });

        console.log('\n💡 Copy the SQL above and run it in Supabase SQL Editor');
        console.log('   Then your employees will be updated automatically!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run
updateDatabaseAndEmployees()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
