import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function runAllMigrations() {
    console.log('🔧 Running All Pending Migrations...\n');
    console.log('='.repeat(60));

    const migrations = [
        {
            name: 'Add PO Approval Columns',
            file: 'add_po_approval_columns.sql',
            description: 'Adds approved_by and approved_at columns'
        },
        {
            name: 'Fix PO Number Type',
            file: 'fix_po_number_type.sql',
            description: 'Changes po_number from VARCHAR(20) to TEXT'
        }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
        console.log(`\n📝 ${migration.name}`);
        console.log(`   ${migration.description}`);

        try {
            const migrationPath = path.resolve(__dirname, '../migrations', migration.file);
            const sql = readFileSync(migrationPath, 'utf-8');

            console.log('   Executing SQL...');

            // We can't execute DDL via Supabase client, so we'll provide instructions
            console.log('   ⚠️  Cannot execute DDL via API');
            console.log(`   📋 Please run this SQL manually:\n`);
            console.log('   ' + '-'.repeat(56));
            console.log(sql.split('\n').map(line => '   ' + line).join('\n'));
            console.log('   ' + '-'.repeat(56));

        } catch (err: any) {
            console.error(`   ❌ Error: ${err.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 MANUAL MIGRATION REQUIRED\n');
    console.log('Supabase does not allow DDL commands via the API.');
    console.log('Please run the SQL above in the Supabase Dashboard:\n');

    const projectRef = process.env.VITE_SUPABASE_URL!.replace('https://', '').replace('.supabase.co', '');
    console.log(`🔗 https://supabase.com/dashboard/project/${projectRef}/sql\n`);
    console.log('Steps:');
    console.log('  1. Click "New query"');
    console.log('  2. Copy the SQL from above');
    console.log('  3. Click "Run"\n');
    console.log('='.repeat(60) + '\n');
}

runAllMigrations();
