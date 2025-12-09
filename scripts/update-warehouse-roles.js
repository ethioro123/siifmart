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

async function updateWarehouseRoles() {
    console.log('🔄 Starting warehouse role migration...\n');

    try {
        // 1. Check for employees with 'wms' role
        const { data: wmsEmployees, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('role', 'wms');

        if (fetchError) {
            console.error('❌ Error fetching employees:', fetchError);
            return;
        }

        if (!wmsEmployees || wmsEmployees.length === 0) {
            console.log('ℹ️  No employees with "wms" role found.');
            console.log('   This is expected if roles were already updated.\n');

            // Show current warehouse employees
            const { data: warehouseEmployees } = await supabase
                .from('employees')
                .select('*')
                .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver']);

            if (warehouseEmployees && warehouseEmployees.length > 0) {
                console.log('✅ Current warehouse employees:');
                warehouseEmployees.forEach(emp => {
                    console.log(`   - ${emp.name} (${emp.role}) - ${emp.email}`);
                });
            }
            return;
        }

        console.log(`📊 Found ${wmsEmployees.length} employee(s) with "wms" role:\n`);
        wmsEmployees.forEach((emp, index) => {
            console.log(`   ${index + 1}. ${emp.name} (${emp.email})`);
        });

        console.log('\n🔧 Updating roles...\n');

        // 2. Update first WMS employee to warehouse_manager
        const firstEmployee = wmsEmployees[0];
        const { error: updateError1 } = await supabase
            .from('employees')
            .update({ role: 'warehouse_manager' })
            .eq('id', firstEmployee.id);

        if (updateError1) {
            console.error(`❌ Error updating ${firstEmployee.name}:`, updateError1);
        } else {
            console.log(`✅ ${firstEmployee.name} → Warehouse Manager`);
        }

        // 3. Update remaining WMS employees to dispatcher
        for (let i = 1; i < wmsEmployees.length; i++) {
            const employee = wmsEmployees[i];
            const { error: updateError } = await supabase
                .from('employees')
                .update({ role: 'dispatcher' })
                .eq('id', employee.id);

            if (updateError) {
                console.error(`❌ Error updating ${employee.name}:`, updateError);
            } else {
                console.log(`✅ ${employee.name} → Warehouse Dispatcher`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Warehouse Managers: 1`);
        console.log(`   - Warehouse Dispatchers: ${wmsEmployees.length - 1}`);

        // 4. Show all warehouse employees
        const { data: allWarehouse } = await supabase
            .from('employees')
            .select('*')
            .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver']);

        if (allWarehouse && allWarehouse.length > 0) {
            console.log('\n📊 All warehouse employees:');
            const grouped = allWarehouse.reduce((acc, emp) => {
                if (!acc[emp.role]) acc[emp.role] = [];
                acc[emp.role].push(emp.name);
                return acc;
            }, {});

            Object.entries(grouped).forEach(([role, names]) => {
                console.log(`   ${role}: ${names.join(', ')}`);
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
updateWarehouseRoles()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
