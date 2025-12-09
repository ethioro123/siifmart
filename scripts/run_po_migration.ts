import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runMigration() {
    console.log('🚀 Running PO Approval Columns Migration via Supabase API...\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

    // SQL to execute
    const sql = `
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_po_approved_at ON purchase_orders(approved_at);
    `.trim();

    try {
        // Try using Supabase's query endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            console.log('✅ Migration completed successfully!');
            console.log('   - Added approved_by column (VARCHAR 200)');
            console.log('   - Added approved_at column (TIMESTAMPTZ)');
            console.log('   - Created index on approved_at');
            console.log('\n🎉 PO ordering should now work!\n');
        } else {
            throw new Error(`API returned ${response.status}`);
        }

    } catch (err: any) {
        console.log('⚠️  Cannot execute DDL via Supabase REST API\n');
        console.log('📋 Please copy and run this SQL in Supabase Dashboard:\n');
        console.log('─'.repeat(70));
        console.log(sql);
        console.log('─'.repeat(70));
        console.log(`\n🔗 Direct link: https://supabase.com/dashboard/project/${projectRef}/sql`);
        console.log('\nSteps:');
        console.log('  1. Click "New query"');
        console.log('  2. Paste the SQL above');
        console.log('  3. Click "Run" (or Cmd+Enter)');
        console.log('\n💡 This is a one-time migration to fix PO ordering.\n');
    }
}

runMigration();
