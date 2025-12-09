/**
 * Run PO Approval Columns Migration
 * Adds approved_by and approved_at columns to purchase_orders table
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.VITE_SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read migration file
const migrationPath = join(__dirname, 'add_po_approval_columns.sql');
const migration = readFileSync(migrationPath, 'utf-8');

console.log('🚀 Running PO Approval Columns Migration');
console.log('=========================================\n');

// Execute migration
try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migration });

    if (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n⚠️  Please run this migration manually in Supabase Dashboard:');
        console.log(`   1. Go to: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
        console.log('   2. Copy the SQL from: add_po_approval_columns.sql');
        console.log('   3. Paste and run in SQL Editor\n');
        process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Added approved_by column');
    console.log('   - Added approved_at column');
    console.log('   - Created index on approved_at\n');

} catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Please run this migration manually in Supabase Dashboard:');
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql`);
    console.log('   2. Copy the SQL from: add_po_approval_columns.sql');
    console.log('   3. Paste and run in SQL Editor\n');
    console.log('📄 Migration SQL:');
    console.log('---');
    console.log(migration);
    console.log('---\n');
}
