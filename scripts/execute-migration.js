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
            if (!supabaseServiceKey && key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseServiceKey = value.trim();
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

async function executeDirectUpdate() {
    console.log('🚀 Attempting direct database update...\n');

    try {
        // Update employees directly (the constraint will be handled by Supabase)
        console.log('📝 Updating Lensa Merga to warehouse_manager...');
        const { data: data1, error: error1 } = await supabase
            .from('employees')
            .update({ role: 'warehouse_manager' })
            .eq('id', '85f5e4fa-307c-432e-9bbb-2cbf5182eacc')
            .select();

        if (error1) {
            console.log('❌ Failed:', error1.message);
            console.log('\n⚠️  The database constraint blocks this update.');
            console.log('📝 You need to run the SQL manually in Supabase SQL Editor.\n');
            console.log('File created: RUN_THIS_SQL.sql');
            console.log('\nSteps:');
            console.log('1. Open your Supabase Dashboard');
            console.log('2. Go to SQL Editor');
            console.log('3. Copy the contents of RUN_THIS_SQL.sql');
            console.log('4. Paste and click "Run"\n');
            return false;
        } else {
            console.log('✅ Success!', data1);
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
            console.log('✅ Success!', data2);
        }

        console.log('\n🎉 Migration completed successfully!');

        // Verify
        const { data: warehouse } = await supabase
            .from('employees')
            .select('*')
            .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver']);

        if (warehouse) {
            console.log('\n📊 Current warehouse team:');
            const grouped = warehouse.reduce((acc, emp) => {
                if (!acc[emp.role]) acc[emp.role] = [];
                acc[emp.role].push(emp.name);
                return acc;
            }, {});

            Object.entries(grouped).forEach(([role, names]) => {
                console.log(`   ${role}: ${names.join(', ')}`);
            });
        }

        return true;

    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Run
executeDirectUpdate()
    .then((success) => {
        if (success) {
            console.log('\n✨ All done! Employees updated successfully!');
            console.log('\n🎯 Next: Open http://localhost:3002 and login as any employee');
            console.log('   Look for the green floating button (bottom-right)');
            console.log('   Press Ctrl+Space to toggle quick access!\n');
        } else {
            console.log('\n📝 Manual SQL execution required.');
            console.log('   See RUN_THIS_SQL.sql for the complete script.\n');
        }
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
