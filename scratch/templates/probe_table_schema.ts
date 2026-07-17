/**
 * Reusable Template: Probe a Supabase Table's Live Schema
 *
 * Usage:
 *   1. Copy this file to /scratch/probe_<table_name>.ts
 *   2. Set TABLE_NAME below
 *   3. Run: npx tsx scratch/probe_<table_name>.ts
 *   4. Update /schemas/db-schema.md with the results
 *
 * This discovers which columns actually exist in the live DB,
 * regardless of what migration files say.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── CONFIGURE THESE ───────────────────────────────────
const TABLE_NAME = 'system_logs'; // <-- Change this
const TEST_EMAIL = 'shukri.kamal@siifmart.com';
const TEST_PASSWORD = 'Oromo123';
// ────────────────────────────────────────────────────────

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

// Common columns to probe if SELECT * fails (RLS may block reads)
const COMMON_COLUMNS = [
    // Identity & timestamps
    'id', 'created_at', 'updated_at', 'deleted_at',
    // User references
    'user_id', 'user_name', 'employee_id', 'auth_user_id',
    // Site scoping
    'site_id', 'from_site_id', 'to_site_id',
    // Common business fields
    'name', 'email', 'phone', 'role', 'status', 'type', 'category',
    'description', 'notes', 'details', 'address', 'location',
    // Quantities & money
    'quantity', 'price', 'cost', 'total', 'amount', 'subtotal',
    'discount', 'tax',
    // Foreign keys
    'product_id', 'order_id', 'customer_id', 'supplier_id', 'zone_id',
    // Workflow
    'action', 'module', 'priority', 'due_date',
    'assigned_to', 'completed_at', 'completed_by',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at',
    // Commerce
    'barcode', 'sku', 'payment_method', 'delivery_date',
    'ip_address', 'ip',
    // JSON/metadata
    'items', 'metadata', 'config',
];

async function main() {
    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (authError || !authData.session) {
        console.error('❌ Auth failed:', authError?.message || 'No session');
        return;
    }
    console.log(`✅ Authenticated as ${TEST_EMAIL}\n`);

    // Strategy 1: Try SELECT * to get all columns at once
    const { data, error } = await supabase.from(TABLE_NAME).select('*').limit(1);

    let columns: string[] = [];

    if (!error && data && data.length > 0) {
        columns = Object.keys(data[0]);
        console.log(`📋 ${TABLE_NAME} — discovered ${columns.length} columns via SELECT *\n`);
    } else {
        // Strategy 2: Probe columns one by one
        console.log(`⚠️  SELECT * failed (${error?.message || 'empty table'}), probing columns individually...\n`);
        for (const col of COMMON_COLUMNS) {
            const r = await supabase.from(TABLE_NAME).select(col).limit(1);
            if (!r.error) {
                columns.push(col);
            }
        }
        console.log(`📋 ${TABLE_NAME} — discovered ${columns.length} columns via probing\n`);
    }

    // Output results
    console.log('─'.repeat(50));
    console.log(`Table: ${TABLE_NAME}`);
    console.log('─'.repeat(50));
    for (const col of columns) {
        console.log(`  ✅ ${col}`);
    }
    console.log('─'.repeat(50));

    // Output as markdown for pasting into /schemas/db-schema.md
    console.log(`\n### \`${TABLE_NAME}\`\n`);
    console.log('| Column | Type | Notes |');
    console.log('|--------|------|-------|');
    for (const col of columns) {
        // Try to infer type from the first row's value
        const val = data?.[0]?.[col];
        let inferredType = 'unknown';
        if (val === null || val === undefined) inferredType = 'nullable';
        else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) inferredType = 'timestamptz';
        else if (typeof val === 'string' && /^[0-9a-f-]{36}$/.test(val)) inferredType = 'uuid';
        else if (typeof val === 'string') inferredType = 'text';
        else if (typeof val === 'number') inferredType = Number.isInteger(val) ? 'integer' : 'numeric';
        else if (typeof val === 'boolean') inferredType = 'boolean';
        else if (typeof val === 'object') inferredType = 'jsonb';

        console.log(`| \`${col}\` | ${inferredType} | |`);
    }
}

main();
