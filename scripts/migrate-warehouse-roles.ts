/**
 * Migration Script: Update WMS roles to new warehouse hierarchy
 * 
 * This script updates existing employees with 'wms' role to the new roles:
 * - warehouse_manager
 * - dispatcher
 */

import { supabase } from '../lib/supabase';

async function migrateWarehouseRoles() {
    console.log('🔄 Starting warehouse role migration...\n');

    try {
        // 1. Get all employees with 'wms' role
        const { data: wmsEmployees, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('role', 'wms');

        if (fetchError) {
            console.error('❌ Error fetching WMS employees:', fetchError);
            return;
        }

        if (!wmsEmployees || wmsEmployees.length === 0) {
            console.log('✅ No employees with "wms" role found. Migration not needed.');
            return;
        }

        console.log(`📊 Found ${wmsEmployees.length} employee(s) with "wms" role:\n`);
        wmsEmployees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name} (${emp.email}) - Site: ${emp.site_id}`);
        });

        console.log('\n🔧 Updating roles...\n');

        // 2. Update employees
        // Strategy: First employee becomes warehouse_manager, rest become dispatchers
        for (let i = 0; i < wmsEmployees.length; i++) {
            const employee = wmsEmployees[i];
            const newRole = i === 0 ? 'warehouse_manager' : 'dispatcher';

            const { error: updateError } = await supabase
                .from('employees')
                .update({ role: newRole })
                .eq('id', employee.id);

            if (updateError) {
                console.error(`❌ Error updating ${employee.name}:`, updateError);
            } else {
                console.log(`✅ ${employee.name} → ${newRole === 'warehouse_manager' ? 'Warehouse Manager' : 'Warehouse Dispatcher'}`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Warehouse Managers: 1`);
        console.log(`   - Warehouse Dispatchers: ${wmsEmployees.length - 1}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
migrateWarehouseRoles()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
