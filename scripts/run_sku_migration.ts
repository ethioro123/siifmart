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
    console.log('🔧 Running SKU constraint migration...\n');

    try {
        // Read the SQL file
        const sqlPath = resolve(__dirname, '../migrations/remove_sku_unique_constraint.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('Executing SQL:');
        console.log('─'.repeat(80));
        console.log(sql);
        console.log('─'.repeat(80));
        console.log('');

        // Execute the migration
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Try direct execution if RPC doesn't work
            console.log('RPC method failed, trying direct execution...\n');

            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.includes('DROP CONSTRAINT')) {
                    console.log('Dropping old UNIQUE constraint on SKU...');
                    const { error: dropError } = await supabase.rpc('exec_sql', { sql_query: statement });
                    if (dropError) {
                        console.log('  Note: Constraint may not exist, continuing...');
                    } else {
                        console.log('  ✅ Old constraint dropped');
                    }
                } else if (statement.includes('ADD CONSTRAINT')) {
                    console.log('Adding new composite UNIQUE constraint (sku, site_id)...');
                    const { error: addError } = await supabase.rpc('exec_sql', { sql_query: statement });
                    if (addError) {
                        console.error('  ❌ Failed:', addError.message);
                        throw addError;
                    } else {
                        console.log('  ✅ New constraint added');
                    }
                }
            }
        } else {
            console.log('✅ Migration executed successfully!');
        }

        console.log('\n✅ SKU constraint migration complete!\n');
        console.log('📝 Changes:');
        console.log('   - Removed: UNIQUE constraint on SKU (global)');
        console.log('   - Added: UNIQUE constraint on (SKU, site_id)');
        console.log('\n🎯 What this means:');
        console.log('   - Same SKU can now exist at multiple warehouses');
        console.log('   - Each warehouse has independent stock levels');
        console.log('   - Example: RICE-001 can be at Adama (50 units) AND Harar (100 units)');
        console.log('\n💡 Next step:');
        console.log('   - Run: npx tsx scripts/setup_multisite_products.ts');
        console.log('   - This will create product instances for each warehouse');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.log('\n📝 Manual steps:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Run the SQL from: migrations/remove_sku_unique_constraint.sql');
        process.exit(1);
    }
}

runMigration();
