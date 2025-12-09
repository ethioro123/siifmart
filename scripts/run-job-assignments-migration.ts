import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Running Job Assignments Table Migration...\n');

    try {
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'create_job_assignments_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('📄 SQL file loaded successfully');
        console.log(`📏 SQL length: ${sql.length} characters\n`);

        // Execute the SQL
        console.log('⚙️  Executing migration...');
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not found, trying direct execution...');

            // Split SQL into individual statements
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`📋 Found ${statements.length} SQL statements\n`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (!statement) continue;

                console.log(`   Executing statement ${i + 1}/${statements.length}...`);

                const { error: stmtError } = await supabase.rpc('exec', {
                    query: statement + ';'
                });

                if (stmtError) {
                    console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message);
                    // Continue with other statements
                } else {
                    console.log(`   ✅ Statement ${i + 1} executed`);
                }
            }
        } else {
            console.log('✅ Migration executed successfully!');
        }

        // Verify the table was created
        console.log('\n🔍 Verifying table creation...');
        const { data: tableCheck, error: checkError } = await supabase
            .from('job_assignments')
            .select('count')
            .limit(0);

        if (checkError) {
            console.error('❌ Table verification failed:', checkError.message);
            console.log('\n⚠️  You may need to run the SQL manually in Supabase SQL Editor');
            console.log('   File: create_job_assignments_table.sql');
        } else {
            console.log('✅ Table verified successfully!');
            console.log('\n🎉 Migration Complete!');
            console.log('\n📊 Next steps:');
            console.log('   1. Test job assignment: await assignJob(jobId, employeeId)');
            console.log('   2. Build assignment UI in WMS Operations');
            console.log('   3. View assignments in Supabase dashboard');
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n📝 Manual Migration Instructions:');
        console.log('   1. Open Supabase Dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Paste contents of: create_job_assignments_table.sql');
        console.log('   4. Click "Run"');
        process.exit(1);
    }
}

runMigration();
