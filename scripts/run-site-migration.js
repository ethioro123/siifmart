
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Running migration to add code column to sites...');

    const migrationPath = path.resolve(__dirname, '../migrations/add_code_column_to_sites.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    try {
        // Try rpc first
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.log('⚠️  RPC exec_sql failed, trying REST API...');

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
                console.error('❌ Failed to execute migration via REST API');
                console.log(await response.text());
                return;
            }
        }

        console.log('✅ Migration executed successfully!');

        // Now run the update script to populate the codes
        console.log('📝 Populating site codes...');
        await import('./update-site-codes.js');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    }
}

runMigration();
