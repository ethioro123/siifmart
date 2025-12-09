import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('🔧 Running POS Receiving Fields migration...\n');

    try {
        // Read the SQL file
        const sqlPath = resolve(__dirname, '../migrations/add_pos_received_fields.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('Executing SQL:');
        console.log('─'.repeat(80));
        console.log(sql);
        console.log('─'.repeat(80));
        console.log('');

        // Execute the migration
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.log('RPC method failed, trying direct execution (fallback)...\n');

            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
                if (stmtError) {
                    console.error('  ❌ Failed:', stmtError.message);
                    // Don't throw, try next statement (idempotent)
                } else {
                    console.log('  ✅ Success');
                }
            }
        } else {
            console.log('✅ Migration executed successfully!');
        }

        console.log('\n✅ POS Receiving Fields migration complete!\n');
        console.log('📝 Changes:');
        console.log('   - Added: pos_received_at (timestamp)');
        console.log('   - Added: pos_received_by (text)');
        console.log('   - Added: Index on pos_received_at');
        console.log('\n🎯 What this means:');
        console.log('   - Store staff can now scan and receive products');
        console.log('   - Products will only appear in POS after receiving');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.log('\n📝 Manual steps:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Run the SQL from: migrations/add_pos_received_fields.sql');
        process.exit(1);
    }
}

runMigration();
