/**
 * Local Storage Migration Script
 * Updates all existing records in localStorage with friendly IDs
 * 
 * Run this in your browser console while the app is open
 */

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

// Migration function
export function migrateLocalStorageIDs() {
    console.log('🚀 Starting Local Storage ID Migration...\n');

    let totalUpdated = 0;

    // 1. Migrate Purchase Orders
    console.log('🔄 Migrating Purchase Orders...');
    const orders = JSON.parse(localStorage.getItem('purchase_orders') || '[]');
    let poUpdated = 0;

    orders.forEach(order => {
        if (!order.poNumber && !order.po_number) {
            const friendlyId = generatePOId();
            order.poNumber = friendlyId;
            order.po_number = friendlyId;
            poUpdated++;
            console.log(`✅ Updated PO ${order.id.substring(0, 8)}... → ${friendlyId}`);
        }
    });

    if (poUpdated > 0) {
        localStorage.setItem('purchase_orders', JSON.stringify(orders));
    }
    console.log(`✅ Purchase Orders: ${poUpdated} updated\n`);
    totalUpdated += poUpdated;

    // 2. Migrate Sales
    console.log('🔄 Migrating Sales Records...');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    let salesUpdated = 0;

    sales.forEach(sale => {
        if (!sale.receiptNumber) {
            const friendlyId = generateSaleId();
            sale.receiptNumber = friendlyId;
            salesUpdated++;
            console.log(`✅ Updated Sale ${sale.id.substring(0, 8)}... → ${friendlyId}`);
        }
    });

    if (salesUpdated > 0) {
        localStorage.setItem('sales', JSON.stringify(sales));
    }
    console.log(`✅ Sales Records: ${salesUpdated} updated\n`);
    totalUpdated += salesUpdated;

    // 3. Migrate Warehouse Jobs
    console.log('🔄 Migrating Warehouse Jobs...');
    const jobs = JSON.parse(localStorage.getItem('warehouse_jobs') || '[]');
    let jobsUpdated = 0;

    jobs.forEach(job => {
        if (!job.jobNumber) {
            const friendlyId = generateJobId(job.type || 'JOB');
            job.jobNumber = friendlyId;
            jobsUpdated++;
            console.log(`✅ Updated ${job.type} Job ${job.id.substring(0, 8)}... → ${friendlyId}`);
        }
    });

    if (jobsUpdated > 0) {
        localStorage.setItem('warehouse_jobs', JSON.stringify(jobs));
    }
    console.log(`✅ Warehouse Jobs: ${jobsUpdated} updated\n`);
    totalUpdated += jobsUpdated;

    // Summary
    console.log('═══════════════════════════════════════');
    console.log(`✨ Migration Complete! ${totalUpdated} records updated`);
    console.log('═══════════════════════════════════════');
    console.log('\n🔄 Reload the page to see the changes!\n');

    return {
        purchaseOrders: poUpdated,
        sales: salesUpdated,
        jobs: jobsUpdated,
        total: totalUpdated
    };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.migrateLocalStorageIDs = migrateLocalStorageIDs;
    console.log('✅ Migration function loaded!');
    console.log('📝 Run: migrateLocalStorageIDs()');
}
