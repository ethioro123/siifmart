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
    console.error('❌ Missing VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   This key is needed to update the database schema.');
    process.exit(1);
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSQLMigration() {
    console.log('🚀 Starting database migration with service key...\n');

    try {
        // Execute the SQL to update constraint and employees
        const sql = `
-- Step 1: Drop old constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- Step 2: Add new constraint with new roles
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
CHECK (role IN (
    'super_admin', 'admin', 'manager',
    'warehouse_manager', 'dispatcher',
    'pos', 'picker', 'hr', 'auditor', 'driver',
    'finance_manager', 'procurement_manager',
    'store_supervisor', 'inventory_specialist',
    'cs_manager', 'it_support'
));

-- Step 3: Update employees
UPDATE employees SET role = 'warehouse_manager' 
WHERE role = 'wms' AND id = '85f5e4fa-307c-432e-9bbb-2cbf5182eacc';

UPDATE employees SET role = 'dispatcher' 
WHERE role = 'wms' AND id = 'ca2e88d8-6550-4c47-b8b8-5e9c97f03a67';
        `.trim();

        console.log('📝 Executing SQL migration...\n');

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // RPC might not exist, try direct updates after manual constraint update
            console.log('⚠️  RPC method not available, using direct updates...\n');

            // Try updating employees directly
            console.log('📝 Updating Lensa Merga to warehouse_manager...');
            const { data: data1, error: error1 } = await supabase
                .from('employees')
                .update({ role: 'warehouse_manager' })
                .eq('id', '85f5e4fa-307c-432e-9bbb-2cbf5182eacc')
                .select();

            if (error1) {
                console.log('❌ Failed:', error1.message);
                console.log('\n⚠️  Need to update database schema first.');
                console.log('📝 Running schema update via REST API...\n');

                // Try using Supabase REST API to execute SQL
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ sql_query: sql })
                });

                if (!response.ok) {
                    console.log('❌ REST API failed. Trying alternative method...\n');

                    // Use pg_query if available
                    const { data: queryData, error: queryError } = await supabase
                        .rpc('pg_query', { query: sql });

                    if (queryError) {
                        console.log('❌ All methods failed.');
                        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
                        console.log('─'.repeat(80));
                        console.log(sql);
                        console.log('─'.repeat(80));
                        return false;
                    }
                }
            } else {
                console.log('✅ Lensa Merga updated to warehouse_manager!');
            }

            console.log('\n📝 Updating Betelhem Bekele to dispatcher...');
            const { data: data2, error: error2 } = await supabase
                .from('employees')
                .update({ role: 'dispatcher' })
                .eq('id', 'ca2e88d8-6550-4c47-b8b8-5e9c97f03a67')
                .select();

            if (error2) {
                console.log('❌ Failed:', error2.message);
                return false;
            } else {
                console.log('✅ Betelhem Bekele updated to dispatcher!');
            }
        } else {
            console.log('✅ SQL executed successfully!');
        }

        // Verify the changes
        console.log('\n📊 Verifying changes...\n');
        const { data: warehouse, error: verifyError } = await supabase
            .from('employees')
            .select('*')
            .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver'])
            .order('role');

        if (verifyError) {
            console.log('⚠️  Could not verify:', verifyError.message);
        } else if (warehouse) {
            console.log('✅ Current warehouse team:');
            const grouped = warehouse.reduce((acc, emp) => {
                if (!acc[emp.role]) acc[emp.role] = [];
                acc[emp.role].push(emp.name);
                return acc;
            }, {});

            Object.entries(grouped).forEach(([role, names]) => {
                const roleDisplay = {
                    'warehouse_manager': '📦 Warehouse Manager',
                    'dispatcher': '📋 Warehouse Dispatcher',
                    'picker': '📦 Pick/Packers',
                    'driver': '🚚 Drivers'
                };
                console.log(`   ${roleDisplay[role] || role}: ${names.join(', ')}`);
            });
        }

        return true;

    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Run migration
executeSQLMigration()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n✨ Next steps:');
            console.log('   1. Open http://localhost:3002');
            console.log('   2. Login as any employee');
            console.log('   3. Look for the green floating button (bottom-right)');
            console.log('   4. Press Ctrl+Space to toggle quick access!');
            console.log('\n🚀 All employees now have easy access to their tools!\n');
            process.exit(0);
        } else {
            console.log('\n⚠️  Migration incomplete. See instructions above.\n');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
