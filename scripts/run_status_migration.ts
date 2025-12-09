import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('🔄 Running PO status constraint update...');

    const sql = `
-- Update purchase_orders status constraint to include Draft and Approved
ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('Draft', 'Pending', 'Approved', 'Received', 'Cancelled'));
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration failed:', error.message);
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('✅ Migration completed successfully!');
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
        console.log('\n📝 RPC function not available. Running via direct query...');

        // Try alternative method
        try {
            // Split into individual statements
            const statements = [
                "ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check",
                "ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status IN ('Draft', 'Pending', 'Approved', 'Received', 'Cancelled'))"
            ];

            for (const stmt of statements) {
                const { error } = await supabase.from('_sql').insert({ query: stmt });
                if (error) throw error;
            }

            console.log('✅ Migration completed via alternative method!');
        } catch (altError: any) {
            console.error('❌ Alternative method also failed:', altError.message);
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
            console.log(sql);
        }
    }
}

runMigration();
