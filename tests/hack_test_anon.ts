/**
 * 🔴 HACKER SIMULATION — Anonymous User Attack
 * 
 * This script simulates what a hacker would do:
 * 1. Extract the Supabase URL + anon key from the browser (publicly visible)
 * 2. Create their own Supabase client (bypassing your app entirely)
 * 3. Try to read, write, and delete data WITHOUT being logged in
 * 
 * If RLS is working, ALL of these should FAIL.
 */

import { createClient } from '@supabase/supabase-js';

// These are publicly visible in your app's JS bundle — a hacker can find them
const SUPABASE_URL = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

// Hacker creates their own client — NOT using your app at all
const hackerClient = createClient(SUPABASE_URL, ANON_KEY);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

async function testAttack(name: string, fn: () => any) {
    const { data, error } = await fn();
    
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
        console.log(`${GREEN}✅ BLOCKED${RESET} — ${name}`);
        if (error) console.log(`   → ${error.message}`);
        else console.log(`   → Returned empty (0 rows)`);
        passed++;
    } else {
        console.log(`${RED}❌ HACKED!${RESET} — ${name}`);
        console.log(`   → Got ${Array.isArray(data) ? data.length + ' rows' : 'data'} back!`);
        if (Array.isArray(data) && data[0]) {
            console.log(`   → Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
        failed++;
    }
}

async function main() {
    console.log(`\n${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}${RED}  🔴 HACKER SIMULATION — Anonymous (No Account) Attack${RESET}`);
    console.log(`${BOLD}══════════════════════════════════════════════════════════════${RESET}\n`);
    console.log(`${YELLOW}Using publicly visible anon key to attempt data access...${RESET}\n`);

    // ── READ ATTACKS ──────────────────────────────────────────────
    console.log(`${BOLD}── ATTEMPT: Read sensitive data ──${RESET}`);
    
    await testAttack('Read ALL employees (names, emails, roles)', 
        () => hackerClient.from('employees').select('*').limit(5));
    
    await testAttack('Read ALL products (prices, cost prices, stock)', 
        () => hackerClient.from('products').select('*').limit(5));
    
    await testAttack('Read ALL customers (personal data)', 
        () => hackerClient.from('customers').select('*').limit(5));
    
    await testAttack('Read ALL sales (financial transactions)', 
        () => hackerClient.from('sales').select('*').limit(5));
    
    await testAttack('Read ALL expenses (financial data)', 
        () => hackerClient.from('expenses').select('*').limit(5));
    
    await testAttack('Read ALL suppliers (vendor data)', 
        () => hackerClient.from('suppliers').select('*').limit(5));
    
    await testAttack('Read ALL purchase orders', 
        () => hackerClient.from('purchase_orders').select('*').limit(5));
    
    await testAttack('Read CEO brainstorm canvas', 
        () => hackerClient.from('brainstorm_nodes').select('*').limit(5));
    
    await testAttack('Read system logs (audit trail)', 
        () => hackerClient.from('system_logs').select('*').limit(5));
    
    await testAttack('Read system config (settings)', 
        () => hackerClient.from('system_config').select('*').limit(5));

    await testAttack('Read warehouse jobs', 
        () => hackerClient.from('wms_jobs').select('*').limit(5));

    await testAttack('Read sites (store locations)', 
        () => hackerClient.from('sites').select('*').limit(5));

    // ── WRITE ATTACKS ─────────────────────────────────────────────
    console.log(`\n${BOLD}── ATTEMPT: Write/modify data ──${RESET}`);
    
    await testAttack('INSERT fake employee', 
        () => hackerClient.from('employees').insert({ 
            name: 'HACKER', email: 'hacker@evil.com', role: 'super_admin', status: 'Active' 
        }).select());
    
    await testAttack('INSERT fake product', 
        () => hackerClient.from('products').insert({ 
            name: 'HACKED PRODUCT', price: 0, stock: 999999 
        }).select());
    
    await testAttack('INSERT fake sale (steal money)', 
        () => hackerClient.from('sales').insert({ 
            total: -99999, status: 'completed' 
        }).select());

    // ── DELETE ATTACKS ─────────────────────────────────────────────
    console.log(`\n${BOLD}── ATTEMPT: Delete/destroy data ──${RESET}`);
    
    await testAttack('DELETE all products', 
        () => hackerClient.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    
    await testAttack('DELETE all employees', 
        () => hackerClient.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    
    await testAttack('DELETE all sales records', 
        () => hackerClient.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'));

    // ── RESULTS ───────────────────────────────────────────────────
    console.log(`\n${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  RESULTS${RESET}`);
    console.log(`${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`  ${GREEN}✅ Blocked: ${passed}${RESET}`);
    console.log(`  ${RED}❌ Hacked:  ${failed}${RESET}`);
    
    if (failed === 0) {
        console.log(`\n  ${GREEN}${BOLD}🛡️  YOUR DATABASE IS SECURE — No anonymous access possible!${RESET}\n`);
    } else {
        console.log(`\n  ${RED}${BOLD}🚨 SECURITY BREACH — ${failed} attacks succeeded!${RESET}`);
        console.log(`  ${RED}Run the RLS migration immediately!${RESET}\n`);
    }
    
    process.exit(0);
}

main().catch(console.error);
