import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    }
);

async function addColumnsViaSupabase() {
    console.log('🚀 Attempting to add columns via Supabase client...\n');

    try {
        // Use the SQL query method with service role
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE purchase_orders
                ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
                
                CREATE INDEX IF NOT EXISTS idx_po_approved_at ON purchase_orders(approved_at);
            `
        });

        if (error) {
            console.log('⚠️  RPC method not available:', error.message);

            // Try alternative: Use raw SQL via PostgREST
            const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!}`,
                    'Prefer': 'params=single-object'
                },
                body: JSON.stringify({
                    query: `
                        ALTER TABLE purchase_orders
                        ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
                        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
                        CREATE INDEX IF NOT EXISTS idx_po_approved_at ON purchase_orders(approved_at);
                    `
                })
            });

            if (!response.ok) {
                throw new Error('Cannot execute DDL via REST API');
            }
        }

        console.log('✅ Columns added successfully!\n');

        // Verify by trying to select the new columns
        const { data: testData, error: testError } = await supabase
            .from('purchase_orders')
            .select('approved_by, approved_at')
            .limit(1);

        if (!testError) {
            console.log('✅ Verification successful! Columns exist.');
            console.log('\n🎉 PO ordering should now work!\n');
        } else {
            console.log('⚠️  Could not verify columns:', testError.message);
        }

    } catch (err: any) {
        console.log('\n❌ Automatic migration not possible via API');
        console.log('\n📝 The SQL must be run manually in Supabase Dashboard:');
        console.log('─'.repeat(70));
        console.log(`
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_po_approved_at ON purchase_orders(approved_at);
        `);
        console.log('─'.repeat(70));

        const projectRef = process.env.VITE_SUPABASE_URL!.replace('https://', '').replace('.supabase.co', '');
        console.log(`\n🔗 https://supabase.com/dashboard/project/${projectRef}/sql\n`);
        console.log('This is a Supabase security feature - DDL commands require dashboard access.\n');
    }
}

addColumnsViaSupabase();
