
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runMigration() {
    console.log('🚀 Starting Migration...');

    // Check for connection string
    // Supabase usually provides DATABASE_URL in the dashboard settings, but it might not be in .env.local by default
    // .env.local usually has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
    // If DATABASE_URL is missing, we can't use 'pg' directly unless we have the credentials.
    // However, the `debug_po_prices.ts` used 'supabase-js' which uses HTTP. DDL is not supported over HTTP client usually.
    // If I can't connect, I will abort and notify user.

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is not set in .env.local. Cannot run migration directly.');
        // Fallback: print the SQL and ask user to run it?
        // Or try to execute via RPC if we have a "exec_sql" function (unlikely but possible).
        return;
    }

    const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('✅ Connected to Database.');

        const sqlPath = path.join(process.cwd(), 'migrations', '20260116_add_price_updated_at.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Migration applied successfully.');

    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

runMigration();
