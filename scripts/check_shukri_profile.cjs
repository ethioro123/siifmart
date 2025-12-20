const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShukri() {
    console.log('--- Checking "Shukri Kamal" Record ---');

    const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, avatar')
        .ilike('name', '%Shukri%');

    if (error) {
        console.error('Error fetching employees:', error);
        return;
    }

    if (!employees || employees.length === 0) {
        console.log('No employee found for "Shukri".');
        return;
    }

    employees.forEach(emp => {
        let avatarDisplay = emp.avatar || 'NULL';
        if (avatarDisplay.length > 100) {
            avatarDisplay = avatarDisplay.substring(0, 100) + '... [TRUNCATED]';
        }

        console.log(`- NAME: ${emp.name}`);
        console.log(`  ID:   ${emp.id}`);
        console.log(`  AVTR: ${avatarDisplay}`);
    });

    console.log('--- Check Finished ---');
}

checkShukri();
