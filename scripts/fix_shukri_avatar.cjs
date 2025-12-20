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

async function updateShukri() {
    const shukriId = '6937384b-2ecc-442f-b5a4-1b132e0f2b0a';
    console.log(`--- Updating Avatar for ID: ${shukriId} ---`);

    const { data, error } = await supabase
        .from('employees')
        .update({ avatar: null })
        .eq('id', shukriId);

    if (error) {
        console.error('Error updating profile:', error);
        return;
    }

    console.log('✅ Successfully updated Shukri Kamal\'s profile. Avatar set to NULL.');
    console.log('--- Finished ---');
}

updateShukri();
