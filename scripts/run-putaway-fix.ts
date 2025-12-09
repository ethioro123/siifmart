import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sql: string, name: string) {
    console.log(`\n🚀 Running ${name}...`);

    // Try exec_sql RPC
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log(`⚠️  exec_sql failed: ${error.message}`);
        console.log('   Trying to split statements...');

        // Remove comments
        const cleanSql = sql
            .replace(/--.*$/gm, '') // Remove -- comments
            .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments

        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`   Executing statement ${i + 1}/${statements.length}...`);
            // Try 'exec' RPC if 'exec_sql' failed
            const { error: stmtError } = await supabase.rpc('exec', { query: statement });

            if (stmtError) {
                console.error(`   ❌ Error: ${stmtError.message}`);
                // If RPCs fail, we can't do much without direct DB access
                console.log('   NOTE: If you do not have exec_sql/exec functions defined in Supabase, this script cannot run DDL.');
                return false;
            } else {
                console.log(`   ✅ Success`);
            }
        }
    } else {
        console.log(`✅ ${name} executed successfully!`);
    }
    return true;
}

async function main() {
    try {
        // 1. Add Column
        const addColumnPath = path.join(__dirname, '../add_line_items_to_wms_jobs.sql');
        const addColumnSQL = fs.readFileSync(addColumnPath, 'utf-8');
        await runSQL(addColumnSQL, 'Add Column Migration');

        // 2. Cleanup
        const cleanupPath = path.join(__dirname, '../cleanup_broken_jobs.sql');
        const cleanupSQL = fs.readFileSync(cleanupPath, 'utf-8');
        await runSQL(cleanupSQL, 'Cleanup Broken Jobs');

        console.log('\n🎉 All operations completed.');
        console.log('👉 Please restart your dev server and try Putaway again.');

    } catch (e: any) {
        console.error('❌ Script failed:', e.message);
    }
}

main();
