#!/usr/bin/env node

/**
 * Standalone Migration Script - Run from Terminal
 * Usage: node scripts/migrate-ids.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ID Generators
function generateSequentialId(prefix) {
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const paddedNum = randomNum.toString().padStart(5, '0');
    return `${prefix}${paddedNum}`;
}

function generatePOId() {
    return generateSequentialId('PO');
}

function generateSaleId() {
    return generateSequentialId('S');
}

function generateJobId(type = 'JOB') {
    const prefix = type === 'JOB' ? 'J' : type.charAt(0);
    return generateSequentialId(prefix);
}

// Migration Functions
async function migratePurchaseOrders() {
    console.log('\n🔄 Migrating Purchase Orders...');

    const { data: orders, error } = await supabase
        .from('purchase_orders')
        .select('id, poNumber, po_number')
        .or('poNumber.is.null,po_number.is.null');

    if (error) {
        console.error('❌ Error fetching POs:', error.message);
        return { updated: 0, failed: 1 };
    }

    if (!orders || orders.length === 0) {
        console.log('✅ All Purchase Orders already have friendly IDs');
        return { updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;

    for (const order of orders) {
        const friendlyId = generatePOId();

        const { error: updateError } = await supabase
            .from('purchase_orders')
            .update({
                poNumber: friendlyId,
                po_number: friendlyId
            })
            .eq('id', order.id);

        if (updateError) {
            failed++;
            console.error(`❌ Failed to update PO ${order.id}:`, updateError.message);
        } else {
            updated++;
            console.log(`✅ Updated PO ${order.id} → ${friendlyId}`);
        }
    }

    return { updated, failed };
}

async function migrateSales() {
    console.log('\n🔄 Migrating Sales Records...');

    const { data: sales, error } = await supabase
        .from('sales')
        .select('id, receiptNumber')
        .is('receiptNumber', null);

    if (error) {
        console.error('❌ Error fetching Sales:', error.message);
        return { updated: 0, failed: 1 };
    }

    if (!sales || sales.length === 0) {
        console.log('✅ All Sales already have friendly IDs');
        return { updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;

    for (const sale of sales) {
        const friendlyId = generateSaleId();

        const { error: updateError } = await supabase
            .from('sales')
            .update({ receiptNumber: friendlyId })
            .eq('id', sale.id);

        if (updateError) {
            failed++;
            console.error(`❌ Failed to update Sale ${sale.id}:`, updateError.message);
        } else {
            updated++;
            console.log(`✅ Updated Sale ${sale.id} → ${friendlyId}`);
        }
    }

    return { updated, failed };
}

async function migrateJobs() {
    console.log('\n🔄 Migrating Warehouse Jobs...');

    const { data: jobs, error } = await supabase
        .from('warehouse_jobs')
        .select('id, jobNumber, type')
        .is('jobNumber', null);

    if (error) {
        console.error('❌ Error fetching Jobs:', error.message);
        return { updated: 0, failed: 1 };
    }

    if (!jobs || jobs.length === 0) {
        console.log('✅ All Warehouse Jobs already have friendly IDs');
        return { updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;

    for (const job of jobs) {
        const friendlyId = generateJobId(job.type || 'JOB');

        const { error: updateError } = await supabase
            .from('warehouse_jobs')
            .update({ jobNumber: friendlyId })
            .eq('id', job.id);

        if (updateError) {
            failed++;
            console.error(`❌ Failed to update Job ${job.id}:`, updateError.message);
        } else {
            updated++;
            console.log(`✅ Updated ${job.type} Job ${job.id} → ${friendlyId}`);
        }
    }

    return { updated, failed };
}

// Main Migration
async function runMigration() {
    console.log('🚀 Starting Friendly ID Migration...');
    console.log('═══════════════════════════════════════\n');

    const results = {
        po: await migratePurchaseOrders(),
        sales: await migrateSales(),
        jobs: await migrateJobs()
    };

    console.log('\n═══════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`Purchase Orders: ✅ ${results.po.updated} updated, ❌ ${results.po.failed} failed`);
    console.log(`Sales Records:   ✅ ${results.sales.updated} updated, ❌ ${results.sales.failed} failed`);
    console.log(`Warehouse Jobs:  ✅ ${results.jobs.updated} updated, ❌ ${results.jobs.failed} failed`);
    console.log('═══════════════════════════════════════');

    const totalUpdated = results.po.updated + results.sales.updated + results.jobs.updated;
    const totalFailed = results.po.failed + results.sales.failed + results.jobs.failed;

    console.log(`\n✨ Total: ${totalUpdated} updated, ${totalFailed} failed`);
    console.log('\n✅ Migration Complete!\n');
}

// Run it
runMigration().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
