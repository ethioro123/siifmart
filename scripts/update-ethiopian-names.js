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

// Real Ethiopian names for each role
const ethiopianNames = {
    'hr': 'Tigist Alemayehu',
    'auditor': 'Dawit Haile',
    'driver': 'Mulugeta Tadesse',
    'finance_manager': 'Rahel Tesfaye',
    'procurement_manager': 'Yohannes Bekele',
    'cs_manager': 'Selamawit Girma',
    'it_support': 'Elias Kebede'
};

async function updateEmployeeNames() {
    console.log('🔄 Updating employee names to real Ethiopian names...\n');

    for (const [role, name] of Object.entries(ethiopianNames)) {
        console.log(`📝 Updating ${role} to ${name}...`);

        const { data, error } = await supabase
            .from('employees')
            .update({
                name: name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            })
            .eq('role', role)
            .like('name', '%(New)')
            .select();

        if (error) {
            console.error(`❌ Error updating ${role}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ Updated ${role}: ${data[0].name}`);
        } else {
            console.log(`⚠️  No employee found for ${role} with "(New)" suffix`);
        }
    }

    console.log('\n✨ All employee names updated!');
}

updateEmployeeNames()
    .then(() => {
        console.log('\n🎉 Complete! All employees now have real Ethiopian names.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
