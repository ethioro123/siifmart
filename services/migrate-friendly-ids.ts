/**
 * Migration Script: Update Existing Records with Friendly IDs
 * 
 * This script updates all existing database records that have UUIDs
 * and assigns them friendly IDs (PO00123, S00090, etc.)
 */

import { supabase } from '../lib/supabase';
import { generatePOId, generateSaleId, generateJobId } from '../utils/idGenerator';

interface MigrationResult {
    table: string;
    updated: number;
    failed: number;
    errors: string[];
}

export async function migrateAllRecords(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    // 1. Migrate Purchase Orders
    console.log('🔄 Migrating Purchase Orders...');
    results.push(await migratePurchaseOrders());

    // 2. Migrate Sales Records
    console.log('🔄 Migrating Sales Records...');
    results.push(await migrateSales());

    // 3. Migrate Warehouse Jobs
    console.log('🔄 Migrating Warehouse Jobs...');
    results.push(await migrateJobs());

    return results;
}

async function migratePurchaseOrders(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'purchase_orders',
        updated: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get all POs without a friendly poNumber
        const { data: orders, error } = await supabase
            .from('purchase_orders')
            .select('id, poNumber, po_number')
            .or('poNumber.is.null,po_number.is.null');

        if (error) {
            result.errors.push(error.message);
            return result;
        }

        if (!orders || orders.length === 0) {
            console.log('✅ All Purchase Orders already have friendly IDs');
            return result;
        }

        // Update each order with a friendly ID
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
                result.failed++;
                result.errors.push(`Failed to update PO ${order.id}: ${updateError.message}`);
            } else {
                result.updated++;
                console.log(`✅ Updated PO ${order.id} → ${friendlyId}`);
            }
        }
    } catch (error: any) {
        result.errors.push(error.message);
    }

    return result;
}

async function migrateSales(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'sales',
        updated: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get all sales without a friendly receiptNumber
        const { data: sales, error } = await supabase
            .from('sales')
            .select('id, receiptNumber')
            .is('receiptNumber', null);

        if (error) {
            result.errors.push(error.message);
            return result;
        }

        if (!sales || sales.length === 0) {
            console.log('✅ All Sales already have friendly IDs');
            return result;
        }

        // Update each sale with a friendly ID
        for (const sale of sales) {
            const friendlyId = generateSaleId();

            const { error: updateError } = await supabase
                .from('sales')
                .update({ receiptNumber: friendlyId })
                .eq('id', sale.id);

            if (updateError) {
                result.failed++;
                result.errors.push(`Failed to update Sale ${sale.id}: ${updateError.message}`);
            } else {
                result.updated++;
                console.log(`✅ Updated Sale ${sale.id} → ${friendlyId}`);
            }
        }
    } catch (error: any) {
        result.errors.push(error.message);
    }

    return result;
}

async function migrateJobs(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'warehouse_jobs',
        updated: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get all jobs without a friendly jobNumber
        const { data: jobs, error } = await supabase
            .from('warehouse_jobs')
            .select('id, jobNumber, type')
            .is('jobNumber', null);

        if (error) {
            result.errors.push(error.message);
            return result;
        }

        if (!jobs || jobs.length === 0) {
            console.log('✅ All Warehouse Jobs already have friendly IDs');
            return result;
        }

        // Update each job with a friendly ID
        for (const job of jobs) {
            const friendlyId = generateJobId(job.type || 'JOB');

            const { error: updateError } = await supabase
                .from('warehouse_jobs')
                .update({ jobNumber: friendlyId })
                .eq('id', job.id);

            if (updateError) {
                result.failed++;
                result.errors.push(`Failed to update Job ${job.id}: ${updateError.message}`);
            } else {
                result.updated++;
                console.log(`✅ Updated Job ${job.id} → ${friendlyId}`);
            }
        }
    } catch (error: any) {
        result.errors.push(error.message);
    }

    return result;
}

// Function to run migration from browser console or admin panel
export async function runMigration() {
    console.log('🚀 Starting Friendly ID Migration...\n');

    const results = await migrateAllRecords();

    console.log('\n📊 Migration Summary:');
    console.log('═══════════════════════════════════════');

    let totalUpdated = 0;
    let totalFailed = 0;

    results.forEach(result => {
        console.log(`\n${result.table}:`);
        console.log(`  ✅ Updated: ${result.updated}`);
        console.log(`  ❌ Failed: ${result.failed}`);

        if (result.errors.length > 0) {
            console.log(`  Errors:`);
            result.errors.forEach(err => console.log(`    - ${err}`));
        }

        totalUpdated += result.updated;
        totalFailed += result.failed;
    });

    console.log('\n═══════════════════════════════════════');
    console.log(`Total Updated: ${totalUpdated}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log('\n✨ Migration Complete!');

    return results;
}
