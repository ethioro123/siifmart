/**
 * Auto-run migration on app load
 * This will update all existing records with friendly IDs in Supabase
 */

import { supabase } from '../lib/supabase';

// ID Generators
function generateSequentialId(prefix: string): string {
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const paddedNum = randomNum.toString().padStart(5, '0');
    return `${prefix}${paddedNum}`;
}

function generatePOId(): string {
    return generateSequentialId('PO');
}

function generateSaleId(): string {
    return generateSequentialId('S');
}

function generateJobId(type: string = 'JOB'): string {
    const prefix = type === 'JOB' ? 'J' : type.charAt(0);
    return generateSequentialId(prefix);
}

// Check if migration has already run
const MIGRATION_KEY = 'friendly_ids_migrated_supabase_v1';

export async function runAutoMigration() {
    // Check if already migrated
    if (localStorage.getItem(MIGRATION_KEY) === 'true') {
        console.log('✅ Friendly IDs already migrated');
        return;
    }

    console.log('🚀 Running Friendly ID Auto-Migration (Supabase)...\n');

    let totalUpdated = 0;

    try {
        // 1. Migrate Purchase Orders
        const { data: orders } = await supabase
            .from('purchase_orders')
            .select('id, poNumber, po_number')
            .or('poNumber.is.null,po_number.is.null');

        if (orders && orders.length > 0) {
            console.log(`🔄 Migrating ${orders.length} Purchase Orders...`);
            for (const order of orders) {
                const friendlyId = generatePOId();
                await supabase
                    .from('purchase_orders')
                    .update({
                        poNumber: friendlyId,
                        po_number: friendlyId
                    })
                    .eq('id', order.id);
            }
            totalUpdated += orders.length;
            console.log(`✅ Updated ${orders.length} Purchase Orders`);
        }

        // 2. Migrate Sales
        try {
            const { data: sales, error: saleError } = await supabase
                .from('sales')
                .select('id, receipt_number')
                .is('receipt_number', null)
                .limit(1); // Just check existence first

            if (!saleError && sales) {
                const { data: allSales } = await supabase
                    .from('sales')
                    .select('id, receipt_number')
                    .is('receipt_number', null);

                if (allSales && allSales.length > 0) {
                    console.log(`🔄 Migrating ${allSales.length} Sales Records...`);
                    for (const sale of allSales) {
                        const friendlyId = generateSaleId();
                        await supabase
                            .from('sales')
                            .update({ receipt_number: friendlyId })
                            .eq('id', sale.id);
                    }
                    totalUpdated += allSales.length;
                    console.log(`✅ Updated ${allSales.length} Sales Records`);
                }
            } else {
                console.warn('⚠️ Skipping Sales migration: "receipt_number" column likely missing in DB.');
            }
        } catch (e) {
            console.warn('⚠️ Skipping Sales migration: Column missing.');
        }

        // 3. Migrate Warehouse Jobs
        try {
            const { data: jobs, error: jobError } = await supabase
                .from('wms_jobs')
                .select('id, job_number')
                .is('job_number', null)
                .limit(1);

            if (!jobError && jobs) {
                const { data: allJobs } = await supabase
                    .from('wms_jobs')
                    .select('id, job_number, type')
                    .is('job_number', null);

                if (allJobs && allJobs.length > 0) {
                    console.log(`🔄 Migrating ${allJobs.length} Warehouse Jobs...`);
                    for (const job of allJobs) {
                        const prefix = job.type === 'JOB' ? 'J' : (job.type ? job.type.charAt(0) : 'J');
                        const friendlyId = generateJobId(prefix);
                        await supabase
                            .from('wms_jobs')
                            .update({ job_number: friendlyId })
                            .eq('id', job.id);
                    }
                    totalUpdated += allJobs.length;
                    console.log(`✅ Updated ${allJobs.length} Warehouse Jobs`);
                }
            } else {
                console.warn('⚠️ Skipping Jobs migration: "job_number" column likely missing in DB.');
            }
        } catch (e) {
            console.warn('⚠️ Skipping Jobs migration: Column missing.');
        }


        // Mark migration as complete
        localStorage.setItem(MIGRATION_KEY, 'true');

        if (totalUpdated > 0) {
            console.log(`\n✨ Migration Complete! ${totalUpdated} records updated`);
            console.log('🔄 Please reload the page to see changes\n');
        } else {
            console.log('✅ No records needed migration');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}
