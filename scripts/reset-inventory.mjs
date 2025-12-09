/**
 * Reset Inventory Script
 * Clears all products, WMS jobs, and creates fresh POs with unique products for each warehouse
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Unique products for each warehouse
const warehouseProducts = {
    'Harar Logistics Hub': [
        { name: 'Premium Organic Rice 5kg', sku: 'HLH-RICE-001', category: 'Pantry Staples', price: 24.99, cost: 18.00, qty: 100 },
        { name: 'Extra Virgin Olive Oil 1L', sku: 'HLH-OIL-002', category: 'Pantry Staples', price: 19.99, cost: 14.00, qty: 75 },
        { name: 'Whole Grain Pasta 500g', sku: 'HLH-PAS-003', category: 'Pantry Staples', price: 4.99, cost: 2.50, qty: 200 },
        { name: 'Organic Honey 500ml', sku: 'HLH-HON-004', category: 'Pantry Staples', price: 15.99, cost: 10.00, qty: 50 },
        { name: 'Canned Tomatoes 400g', sku: 'HLH-TOM-005', category: 'Pantry Staples', price: 2.99, cost: 1.50, qty: 300 },
        { name: 'Premium Ground Coffee 500g', sku: 'HLH-COF-006', category: 'Beverages', price: 18.99, cost: 12.00, qty: 80 },
        { name: 'Green Tea Bags 50pcs', sku: 'HLH-TEA-007', category: 'Beverages', price: 8.99, cost: 5.00, qty: 120 },
        { name: 'Sparkling Water 12-pack', sku: 'HLH-WAT-008', category: 'Beverages', price: 12.99, cost: 8.00, qty: 150 },
        { name: 'All-Purpose Flour 2kg', sku: 'HLH-FLR-009', category: 'Pantry Staples', price: 6.99, cost: 4.00, qty: 180 },
        { name: 'Dark Chocolate Bar 100g', sku: 'HLH-CHO-010', category: 'Snacks & Sweets', price: 5.99, cost: 3.50, qty: 250 },
    ],
    'Dire Dawa Storage Facility': [
        { name: 'Fresh Whole Milk 1L', sku: 'DDS-MLK-001', category: 'Dairy', price: 3.99, cost: 2.50, qty: 200 },
        { name: 'Greek Yogurt 500g', sku: 'DDS-YOG-002', category: 'Dairy', price: 6.99, cost: 4.00, qty: 150 },
        { name: 'Aged Cheddar Cheese 300g', sku: 'DDS-CHE-003', category: 'Dairy', price: 9.99, cost: 6.50, qty: 80 },
        { name: 'Fresh Orange Juice 1L', sku: 'DDS-OJU-004', category: 'Beverages', price: 5.99, cost: 3.50, qty: 120 },
        { name: 'Butter Unsalted 250g', sku: 'DDS-BUT-005', category: 'Dairy', price: 4.99, cost: 3.00, qty: 100 },
        { name: 'Frozen Pizza Margherita', sku: 'DDS-PIZ-006', category: 'Frozen', price: 8.99, cost: 5.50, qty: 60 },
        { name: 'Ice Cream Vanilla 1L', sku: 'DDS-ICE-007', category: 'Frozen', price: 7.99, cost: 4.50, qty: 90 },
        { name: 'Frozen Mixed Vegetables 1kg', sku: 'DDS-VEG-008', category: 'Frozen', price: 5.99, cost: 3.50, qty: 140 },
        { name: 'Fresh Cream 500ml', sku: 'DDS-CRM-009', category: 'Dairy', price: 4.49, cost: 2.75, qty: 110 },
        { name: 'Frozen Chicken Breast 1kg', sku: 'DDS-CHK-010', category: 'Frozen', price: 14.99, cost: 10.00, qty: 70 },
    ],
    'Adama Distribution Center': [
        { name: 'Organic Bananas 1kg', sku: 'ADC-BAN-001', category: 'Fresh Produce', price: 3.49, cost: 2.00, qty: 180 },
        { name: 'Fresh Apples Red 1kg', sku: 'ADC-APL-002', category: 'Fresh Produce', price: 4.99, cost: 3.00, qty: 150 },
        { name: 'Avocados 4-pack', sku: 'ADC-AVO-003', category: 'Fresh Produce', price: 6.99, cost: 4.50, qty: 100 },
        { name: 'Fresh Spinach 250g', sku: 'ADC-SPN-004', category: 'Fresh Produce', price: 2.99, cost: 1.75, qty: 200 },
        { name: 'Cherry Tomatoes 500g', sku: 'ADC-TOM-005', category: 'Fresh Produce', price: 4.49, cost: 2.75, qty: 160 },
        { name: 'Fresh Salmon Fillet 500g', sku: 'ADC-SAL-006', category: 'Meat & Seafood', price: 18.99, cost: 13.00, qty: 50 },
        { name: 'Organic Eggs 12-pack', sku: 'ADC-EGG-007', category: 'Dairy', price: 7.99, cost: 5.00, qty: 120 },
        { name: 'Fresh Broccoli 500g', sku: 'ADC-BRO-008', category: 'Fresh Produce', price: 3.99, cost: 2.25, qty: 140 },
        { name: 'Cucumber 3-pack', sku: 'ADC-CUC-009', category: 'Fresh Produce', price: 2.49, cost: 1.50, qty: 190 },
        { name: 'Fresh Strawberries 400g', sku: 'ADC-STR-010', category: 'Fresh Produce', price: 5.99, cost: 3.75, qty: 80 },
    ],
};

async function resetInventory() {
    console.log('🔄 SIIFMART INVENTORY RESET SCRIPT');
    console.log('===================================\n');

    // Step 1: Get all sites
    console.log('📍 Step 1: Fetching sites...');
    const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name');

    if (sitesError) {
        console.error('❌ Failed to fetch sites:', sitesError);
        return;
    }

    const warehouses = sites.filter(s => s.type === 'Warehouse');
    console.log(`   Found ${warehouses.length} warehouses:`);
    warehouses.forEach(w => console.log(`   - ${w.name} (${w.id})`));

    // Step 2: Clear existing data
    console.log('\n🗑️  Step 2: Clearing existing data...');

    // Clear Sales and Sale Items first (Foreign Key Constraint)
    const { error: saleItemsError } = await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (saleItemsError) console.log('   ⚠️ Sale items clear error:', saleItemsError.message);
    else console.log('   ✓ Sale items cleared');

    const { error: salesError } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (salesError) console.log('   ⚠️ Sales clear error:', salesError.message);
    else console.log('   ✓ Sales cleared');

    // Clear WMS jobs
    const { error: jobsError } = await supabase.from('wms_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (jobsError) console.log('   ⚠️ Jobs clear error:', jobsError.message);
    else console.log('   ✓ WMS jobs cleared');

    // Clear PO items
    const { error: poItemsError } = await supabase.from('po_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (poItemsError) console.log('   ⚠️ PO items clear error:', poItemsError.message);
    else console.log('   ✓ PO items cleared');

    // Clear stock movements
    const { error: stockMovError } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (stockMovError) console.log('   ⚠️ Stock movements clear error:', stockMovError.message);
    else console.log('   ✓ Stock movements cleared');

    // Clear products
    const { error: productsError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (productsError) console.log('   ⚠️ Products clear error:', productsError.message);
    else console.log('   ✓ Products cleared');

    // Clear purchase orders
    const { error: posError } = await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (posError) console.log('   ⚠️ POs clear error:', posError.message);
    else console.log('   ✓ Purchase orders cleared');

    // Step 3: Get a supplier
    console.log('\n📦 Step 3: Fetching suppliers...');
    const { data: suppliers } = await supabase.from('suppliers').select('*').limit(1);
    const supplierId = suppliers?.[0]?.id;
    const supplierName = suppliers?.[0]?.name || 'Default Supplier';

    if (!supplierId) {
        console.log('   ⚠️ No suppliers found. Creating default supplier...');
        const { data: newSupplier } = await supabase.from('suppliers').insert({
            name: 'Global Foods Distribution',
            type: 'Corporate',
            contact: 'John Smith',
            email: 'orders@globalfoods.com',
            phone: '+1-555-0100',
            category: 'Food & Beverage',
            status: 'Active',
            rating: 4.5
        }).select().single();

        if (newSupplier) {
            console.log(`   ✓ Created supplier: ${newSupplier.name}`);
        }
    } else {
        console.log(`   ✓ Using supplier: ${supplierName}`);
    }

    // Step 4: Create POs for each warehouse
    console.log('\n📝 Step 4: Creating Purchase Orders...');

    for (const warehouse of warehouses) {
        const products = warehouseProducts[warehouse.name];

        if (!products) {
            console.log(`   ⚠️ No product list defined for: ${warehouse.name}`);
            continue;
        }

        // Calculate totals
        const totalAmount = products.reduce((sum, p) => sum + (p.cost * p.qty), 0);

        // Create PO with Approved status
        const poNumber = `PO-${Date.now()}-${warehouse.name.substring(0, 3).toUpperCase()}`;
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .insert({
                site_id: warehouse.id,
                supplier_id: supplierId,
                supplier_name: supplierName,
                po_number: poNumber,
                status: 'Pending', // Will be Approved after notes are set
                items_count: products.length,
                total_amount: totalAmount,
                expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                notes: `[APPROVED_BY:System:${new Date().toISOString()}] Fresh inventory for ${warehouse.name}`
            })
            .select()
            .single();

        if (poError) {
            console.log(`   ❌ Failed to create PO for ${warehouse.name}:`, poError.message);
            continue;
        }

        console.log(`   ✓ Created PO: ${poNumber} for ${warehouse.name}`);

        // Create PO items
        const poItems = products.map(p => ({
            po_id: po.id,
            product_id: null, // Will be created during PUTAWAY
            product_name: p.name,
            quantity: p.qty,
            unit_cost: p.cost,
            total_cost: p.cost * p.qty
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(poItems);
        if (itemsError) {
            console.log(`   ⚠️ Failed to create PO items:`, itemsError.message);
        } else {
            console.log(`   ✓ Added ${products.length} items to PO`);
        }
    }

    // Step 5: Summary
    console.log('\n✅ RESET COMPLETE');
    console.log('================');
    console.log(`Created ${warehouses.length} Purchase Orders, each with 10 unique products.`);
    console.log('\nNext steps:');
    console.log('1. Go to Procurement → Purchase Orders');
    console.log('2. Find the new POs and click "Receive"');
    console.log('3. After receiving, PUTAWAY jobs will be created');
    console.log('4. Complete PUTAWAY jobs to add items to inventory');
}

resetInventory().catch(console.error);
