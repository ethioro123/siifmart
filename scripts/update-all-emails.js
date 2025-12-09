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
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate email from name
function generateEmail(name) {
    // Remove special characters and convert to lowercase
    const cleanName = name
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim();

    // Split name into parts
    const parts = cleanName.split(/\s+/);

    // Create email: firstname.lastname@siifmart.com
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[parts.length - 1]}@siifmart.com`;
    } else {
        return `${parts[0]}@siifmart.com`;
    }
}

async function updateAllEmails() {
    console.log('🔍 Fetching all employees...\n');

    // Get all employees
    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .order('name');

    if (fetchError) {
        console.error('❌ Error fetching employees:', fetchError.message);
        return;
    }

    console.log(`📊 Found ${employees.length} employees\n`);
    console.log('📝 Updating emails to match names...\n');

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const employee of employees) {
        const newEmail = generateEmail(employee.name);

        // Skip if email already matches the pattern
        if (employee.email === newEmail) {
            console.log(`⏭️  ${employee.name}: ${employee.email} (already correct)`);
            skipped++;
            continue;
        }

        // Check if new email already exists
        const { data: existing } = await supabase
            .from('employees')
            .select('id')
            .eq('email', newEmail)
            .neq('id', employee.id)
            .single();

        if (existing) {
            // Email exists, add a number
            const baseEmail = newEmail.replace('@siifmart.com', '');
            let counter = 2;
            let finalEmail = newEmail;

            while (true) {
                finalEmail = `${baseEmail}${counter}@siifmart.com`;
                const { data: check } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('email', finalEmail)
                    .single();

                if (!check) break;
                counter++;
            }

            newEmail = finalEmail;
        }

        // Update the email
        const { error: updateError } = await supabase
            .from('employees')
            .update({ email: newEmail })
            .eq('id', employee.id);

        if (updateError) {
            console.error(`❌ ${employee.name}: Failed - ${updateError.message}`);
            errors++;
        } else {
            console.log(`✅ ${employee.name}: ${employee.email} → ${newEmail}`);
            updated++;
        }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already correct): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('═'.repeat(80));
}

updateAllEmails()
    .then(() => {
        console.log('\n✨ Email update complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
