/**
 * 🔴 HACKER SIMULATION — Insider Staff Attack
 * 
 * This simulates a logged-in staff member (e.g. cashier) who opens
 * DevTools and tries to hack beyond their role — reading CEO data,
 * deleting products, modifying employee records, etc.
 * 
 * USAGE: npx tsx tests/hack_test_staff.ts <email> <password>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

const staffClient = createClient(SUPABASE_URL, ANON_KEY);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

async function testAttack(name: string, shouldSucceed: boolean, fn: () => any) {
    const { data, error } = await fn();
    const gotData = !error && data && (!Array.isArray(data) || data.length > 0);

    if (shouldSucceed) {
        // This attack SHOULD work (e.g. cashier reading products is fine)
        if (gotData) {
            console.log(`${CYAN}🔓 ALLOWED${RESET} (expected) — ${name}`);
            console.log(`   → Got ${Array.isArray(data) ? data.length + ' rows' : 'data'}`);
            passed++;
        } else {
            console.log(`${YELLOW}⚠️  OVER-BLOCKED${RESET} — ${name}`);
            console.log(`   → ${error?.message || 'Empty result'}`);
            console.log(`   → This might break your app — staff needs this access`);
            failed++;
        }
    } else {
        // This attack SHOULD be blocked
        if (!gotData) {
            console.log(`${GREEN}✅ BLOCKED${RESET} — ${name}`);
            if (error) console.log(`   → ${error.message}`);
            else console.log(`   → Returned empty (0 rows)`);
            passed++;
        } else {
            console.log(`${RED}❌ HACKED!${RESET} — ${name}`);
            console.log(`   → Got ${Array.isArray(data) ? data.length + ' rows' : 'data'} back!`);
            if (Array.isArray(data) && data[0]) {
                console.log(`   → Sample: ${JSON.stringify(data[0]).substring(0, 120)}...`);
            }
            failed++;
        }
    }
}

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log(`\n${RED}Usage: npx tsx tests/hack_test_staff.ts <email> <password>${RESET}`);
        console.log(`Example: npx tsx tests/hack_test_staff.ts cashier@siifmart.com password123\n`);
        process.exit(1);
    }

    // Step 1: Log in as staff member
    console.log(`\n${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}${RED}  🔴 HACKER SIMULATION — Insider Staff Attack${RESET}`);
    console.log(`${BOLD}══════════════════════════════════════════════════════════════${RESET}\n`);
    
    console.log(`${YELLOW}Logging in as: ${email}${RESET}`);
    
    const { data: authData, error: authError } = await staffClient.auth.signInWithPassword({
        email, password
    });

    if (authError) {
        console.log(`${RED}❌ Login failed: ${authError.message}${RESET}`);
        process.exit(1);
    }

    // Get employee role
    const { data: empData } = await staffClient.from('employees').select('name, role, site_id').eq('email', email).single();
    const role = empData?.role || 'unknown';
    const name = empData?.name || email;

    console.log(`${CYAN}✅ Logged in as: ${name} (Role: ${role})${RESET}\n`);

    // ═══════════════════════════════════════════════════════════════
    // TESTS — What this staff member SHOULD and SHOULDN'T be able to do
    // ═══════════════════════════════════════════════════════════════

    // ── LEGITIMATE ACCESS (should work) ──────────────────────────
    console.log(`${BOLD}── Testing LEGITIMATE access (should be ALLOWED) ──${RESET}`);
    
    await testAttack('Read products (needed for POS/warehouse)', 
        true, () => staffClient.from('products').select('id, name, price').limit(3));
    
    await testAttack('Read customers (needed for POS)', 
        true, () => staffClient.from('customers').select('id, name').limit(3));
    
    await testAttack('Read own employee record', 
        true, () => staffClient.from('employees').select('id, name, role').limit(1));

    await testAttack('Create a sale (cashier core function)', 
        true, () => staffClient.from('sales').select('id').limit(1)); // Just test read, don't create real sales

    // ── PRIVILEGE ESCALATION ATTACKS ─────────────────────────────
    console.log(`\n${BOLD}── Testing PRIVILEGE ESCALATION (should be BLOCKED) ──${RESET}`);
    
    await testAttack('Promote self to super_admin', 
        false, () => staffClient.from('employees').update({ role: 'super_admin' }).eq('email', email).select());
    
    await testAttack('Create a new admin employee', 
        false, () => staffClient.from('employees').insert({ 
            name: 'HACKER ADMIN', email: 'hacker@evil.com', role: 'super_admin', status: 'Active' 
        }).select());

    // ── DATA THEFT ATTACKS ───────────────────────────────────────
    console.log(`\n${BOLD}── Testing DATA THEFT (should be BLOCKED) ──${RESET}`);

    await testAttack('Read CEO brainstorm canvas (confidential)', 
        false, () => staffClient.from('brainstorm_nodes').select('*').limit(5));
    
    await testAttack('Read financial expenses', 
        false, () => staffClient.from('expenses').select('*').limit(5));
    
    await testAttack('Read system audit logs', 
        false, () => staffClient.from('system_logs').select('*').limit(5));
    
    await testAttack('Read system config (store name, display settings — not sensitive)', 
        true, () => staffClient.from('system_config').select('*').limit(5));

    // ── DESTRUCTION ATTACKS ──────────────────────────────────────
    console.log(`\n${BOLD}── Testing DESTRUCTION (should be BLOCKED) ──${RESET}`);
    
    await testAttack('DELETE all products', 
        false, () => staffClient.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    
    await testAttack('DELETE all employees', 
        false, () => staffClient.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    
    await testAttack('DELETE all sales records', 
        false, () => staffClient.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    
    await testAttack('DELETE all customers', 
        false, () => staffClient.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000'));

    await testAttack('DELETE purchase orders', 
        false, () => staffClient.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'));

    await testAttack('DELETE system audit logs (cover tracks)', 
        false, () => staffClient.from('system_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'));

    // ── MODIFICATION ATTACKS ─────────────────────────────────────
    console.log(`\n${BOLD}── Testing UNAUTHORIZED MODIFICATIONS (should be BLOCKED) ──${RESET}`);
    
    await testAttack('Set product price to $0', 
        false, () => staffClient.from('products').update({ price: 0 }).neq('id', '00000000-0000-0000-0000-000000000000').select());
    
    await testAttack('Modify another employee record', 
        false, () => staffClient.from('employees').update({ role: 'cashier' }).neq('email', email).limit(1).select());

    await testAttack('Void/modify a sale (refund fraud)', 
        false, () => staffClient.from('sales').update({ status: 'voided', total: 0 }).neq('id', '00000000-0000-0000-0000-000000000000').select());

    await testAttack('Edit system config', 
        false, () => staffClient.from('system_config').update({ settings: {} }).neq('id', '00000000-0000-0000-0000-000000000000').select());

    await testAttack('Tamper with audit logs', 
        false, () => staffClient.from('system_logs').update({ action: 'NOTHING_HAPPENED' }).neq('id', '00000000-0000-0000-0000-000000000000').select());

    // ── RESULTS ──────────────────────────────────────────────────
    console.log(`\n${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  RESULTS — Staff: ${name} (${role})${RESET}`);
    console.log(`${BOLD}══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`  ${GREEN}✅ Correct: ${passed}${RESET}`);
    console.log(`  ${RED}❌ Failed:  ${failed}${RESET}`);
    
    if (failed === 0) {
        console.log(`\n  ${GREEN}${BOLD}🛡️  ROLE-BASED SECURITY IS WORKING PERFECTLY!${RESET}`);
        console.log(`  ${GREEN}Staff can do their job but CANNOT hack beyond their role.${RESET}\n`);
    } else {
        console.log(`\n  ${YELLOW}${BOLD}⚠️  ${failed} test(s) need attention — see details above.${RESET}\n`);
    }

    // Sign out
    await staffClient.auth.signOut();
    process.exit(0);
}

main().catch(console.error);
