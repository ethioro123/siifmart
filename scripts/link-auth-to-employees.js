import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, anonKey, serviceRoleKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') anonKey = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function linkAuthToEmployees() {
    console.log('🔗 Linking auth accounts to employee records...\n');

    // Get all employees with their site assignments
    const { data: employees, error: empError } = await supabaseAnon
        .from('employees')
        .select('id, email, name, role, site_id');

    if (empError) {
        console.error('❌ Error fetching employees:', empError);
        return;
    }

    console.log(`Found ${employees.length} employees\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const emp of employees) {
        try {
            // Get the auth user by email
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            if (listError) throw listError;

            const authUser = users.find(u => u.email === emp.email);

            if (!authUser) {
                console.log(`⚠️  ${emp.name} - No auth account found, skipping`);
                continue;
            }

            // Update the user metadata with site_id and employee_id
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                authUser.id,
                {
                    user_metadata: {
                        name: emp.name,
                        role: emp.role,
                        site_id: emp.site_id,
                        employee_id: emp.id
                    }
                }
            );

            if (updateError) throw updateError;

            console.log(`✅ ${emp.name} → Site: ${emp.site_id.substring(0, 8)}...`);
            successCount++;

        } catch (error) {
            console.error(`❌ ${emp.name} - Error: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully linked: ${successCount} accounts`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📧 Total employees: ${employees.length}`);

    console.log('\n✅ Auth accounts now include:');
    console.log('   - name');
    console.log('   - role');
    console.log('   - site_id (for data filtering)');
    console.log('   - employee_id (for profile linking)');
}

linkAuthToEmployees();
