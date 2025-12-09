/**
 * WAREHOUSE TO STORE TRANSFER FLOW TEST (Service Role Version)
 * 
 * This version uses the service role key to bypass RLS policies
 * This is for testing purposes only - in production, proper authentication should be used
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Load environment variables - using SERVICE_ROLE key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please ensure .env.local exists with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test configuration
const TEST_CONFIG = {
    warehouseId: null,
    storeId: null,
    productId: null,
    transferQty: 10,
    testUser: 'Test Admin'
};

// Utility functions
const log = {
    section: (title) => console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`),
    step: (msg) => console.log(`\n📋 ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    info: (msg) => console.log(`ℹ️  ${msg}`),
    data: (label, data) => console.log(`   ${label}:`, JSON.stringify(data, null, 2))
};

// Step 1: Fetch test sites
async function fetchTestSites() {
    log.step('Fetching warehouse and store sites...');

    const { data: sites, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) throw error;

    const warehouse = sites.find(s => s.type === 'Warehouse' || s.type === 'Distribution Center');
    const store = sites.find(s => s.type === 'Store' || s.type === 'Dark Store');

    if (!warehouse || !store) {
        throw new Error('Could not find warehouse and store in database');
    }

    TEST_CONFIG.warehouseId = warehouse.id;
    TEST_CONFIG.storeId = store.id;

    log.success(`Found warehouse: ${warehouse.name} (${warehouse.id})`);
    log.success(`Found store: ${store.name} (${store.id})`);

    return { warehouse, store };
}

// Step 2: Fetch a test product from warehouse
async function fetchTestProduct() {
    log.step('Fetching a product from warehouse with sufficient stock...');

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', TEST_CONFIG.warehouseId)
        .gte('stock', TEST_CONFIG.transferQty)
        .limit(1);

    if (error) throw error;

    if (!products || products.length === 0) {
        throw new Error('No products with sufficient stock found in warehouse');
    }

    const product = products[0];
    TEST_CONFIG.productId = product.id;

    log.success(`Found product: ${product.name} (SKU: ${product.sku})`);
    log.info(`Current stock at warehouse: ${product.stock}`);

    return product;
}

// Step 3: Get initial stock levels
async function getStockLevels() {
    log.step('Recording initial stock levels...');

    // Warehouse stock
    const { data: warehouseProduct, error: whError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', TEST_CONFIG.productId)
        .eq('site_id', TEST_CONFIG.warehouseId)
        .single();

    if (whError) throw whError;

    // Store stock (might not exist yet)
    const { data: storeProducts, error: stError } = await supabase
        .from('products')
        .select('stock, sku')
        .eq('site_id', TEST_CONFIG.storeId);

    if (stError) throw stError;

    // Find matching product by SKU
    const { data: warehouseProductFull } = await supabase
        .from('products')
        .select('sku')
        .eq('id', TEST_CONFIG.productId)
        .single();

    const storeProduct = storeProducts?.find(p => p.sku === warehouseProductFull.sku);

    const stockLevels = {
        warehouse: warehouseProduct.stock,
        store: storeProduct?.stock || 0
    };

    log.info(`Warehouse stock: ${stockLevels.warehouse}`);
    log.info(`Store stock: ${stockLevels.store}`);

    return stockLevels;
}

// Step 4: Create transfer request
async function createTransfer(product) {
    log.step('Creating transfer request...');

    const transferData = {
        source_site_id: TEST_CONFIG.warehouseId,
        dest_site_id: TEST_CONFIG.storeId,
        status: 'Pending',
        transfer_date: new Date().toISOString().split('T')[0],
        items: [{
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: TEST_CONFIG.transferQty
        }]
    };

    const { data: transfer, error } = await supabase
        .from('transfers')
        .insert(transferData)
        .select()
        .single();

    if (error) throw error;

    log.success(`Transfer created: ${transfer.id}`);
    log.data('Transfer details', transfer);

    return transfer;
}

// Step 5: Ship transfer (deduct from warehouse)
async function shipTransfer(transfer, initialStock) {
    log.step('Shipping transfer (deducting stock from warehouse)...');

    // Get current warehouse stock
    const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', TEST_CONFIG.productId)
        .eq('site_id', TEST_CONFIG.warehouseId)
        .single();

    if (fetchError) throw fetchError;

    const newStock = currentProduct.stock - TEST_CONFIG.transferQty;

    if (newStock < 0) {
        throw new Error(`Insufficient stock! Current: ${currentProduct.stock}, Requested: ${TEST_CONFIG.transferQty}`);
    }

    // Update warehouse stock
    const { error: updateError } = await supabase
        .from('products')
        .update({
            stock: newStock,
            status: newStock === 0 ? 'out_of_stock' : newStock < 10 ? 'low_stock' : 'active'
        })
        .eq('id', TEST_CONFIG.productId)
        .eq('site_id', TEST_CONFIG.warehouseId);

    if (updateError) throw updateError;

    // Update transfer status
    const { error: transferError } = await supabase
        .from('transfers')
        .update({ status: 'In-Transit' })
        .eq('id', transfer.id);

    if (transferError) throw transferError;

    log.success(`Stock deducted from warehouse: ${currentProduct.stock} → ${newStock}`);
    log.success(`Transfer status updated to: In-Transit`);

    // Create stock movement log
    const { error: logError } = await supabase
        .from('stock_movements')
        .insert({
            site_id: TEST_CONFIG.warehouseId,
            product_id: TEST_CONFIG.productId,
            type: 'OUT',
            quantity: TEST_CONFIG.transferQty,
            reason: `Transfer to store (Transfer ID: ${transfer.id})`,
            movement_date: new Date().toISOString(),
            performed_by: TEST_CONFIG.testUser
        });

    if (logError) console.warn('⚠️  Could not create stock movement log:', logError.message);

    return newStock;
}

// Step 6: Receive transfer (add to store)
async function receiveTransfer(transfer, product) {
    log.step('Receiving transfer at store (adding stock)...');

    // Check if product exists at destination
    const { data: storeProducts, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', TEST_CONFIG.storeId)
        .eq('sku', product.sku);

    if (fetchError) throw fetchError;

    let storeProduct = storeProducts?.[0];

    if (storeProduct) {
        // Update existing product
        const newStock = storeProduct.stock + TEST_CONFIG.transferQty;

        const { error: updateError } = await supabase
            .from('products')
            .update({
                stock: newStock,
                status: 'active',
                location: 'STORE-RECEIVED'
            })
            .eq('id', storeProduct.id);

        if (updateError) throw updateError;

        log.success(`Updated existing product at store: ${storeProduct.stock} → ${newStock}`);
    } else {
        // Create new product at destination
        const newProductData = {
            site_id: TEST_CONFIG.storeId,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price,
            cost_price: product.cost_price,
            sale_price: product.sale_price,
            is_on_sale: product.is_on_sale,
            stock: TEST_CONFIG.transferQty,
            status: 'active',
            location: 'STORE-RECEIVED',
            image: product.image
        };

        const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert(newProductData)
            .select()
            .single();

        if (createError) throw createError;

        storeProduct = newProduct;
        log.success(`Created new product at store with stock: ${TEST_CONFIG.transferQty}`);
    }

    // Update transfer status
    const { error: transferError } = await supabase
        .from('transfers')
        .update({ status: 'Completed' })
        .eq('id', transfer.id);

    if (transferError) throw transferError;

    log.success(`Transfer status updated to: Completed`);

    // Create stock movement log
    const { error: logError } = await supabase
        .from('stock_movements')
        .insert({
            site_id: TEST_CONFIG.storeId,
            product_id: storeProduct.id,
            type: 'IN',
            quantity: TEST_CONFIG.transferQty,
            reason: `Transfer from warehouse (Transfer ID: ${transfer.id})`,
            movement_date: new Date().toISOString(),
            performed_by: TEST_CONFIG.testUser
        });

    if (logError) console.warn('⚠️  Could not create stock movement log:', logError.message);

    return storeProduct;
}

// Step 7: Verify final stock levels
async function verifyStockLevels(initialStock) {
    log.step('Verifying final stock levels...');

    const finalStock = await getStockLevels();

    const expectedWarehouse = initialStock.warehouse - TEST_CONFIG.transferQty;
    const expectedStore = initialStock.store + TEST_CONFIG.transferQty;

    log.info('Expected vs Actual:');
    console.log(`   Warehouse: ${expectedWarehouse} (expected) vs ${finalStock.warehouse} (actual)`);
    console.log(`   Store: ${expectedStore} (expected) vs ${finalStock.store} (actual)`);

    const warehouseMatch = finalStock.warehouse === expectedWarehouse;
    const storeMatch = finalStock.store === expectedStore;

    if (warehouseMatch && storeMatch) {
        log.success('✅ Stock levels match expected values!');
        return true;
    } else {
        if (!warehouseMatch) log.error(`Warehouse stock mismatch!`);
        if (!storeMatch) log.error(`Store stock mismatch!`);
        return false;
    }
}

// Main test execution
async function runTest() {
    log.section('🧪 WAREHOUSE TO STORE TRANSFER FLOW TEST');
    log.info('Using service role key to bypass RLS (test mode)');

    try {
        // Setup
        const { warehouse, store } = await fetchTestSites();
        const product = await fetchTestProduct();
        const initialStock = await getStockLevels();

        // Execute transfer workflow
        const transfer = await createTransfer(product);
        await shipTransfer(transfer, initialStock);
        await receiveTransfer(transfer, product);

        // Verify
        const success = await verifyStockLevels(initialStock);

        // Summary
        log.section('📊 TEST SUMMARY');
        console.log(`Transfer ID: ${transfer.id}`);
        console.log(`Product: ${product.name} (${product.sku})`);
        console.log(`Quantity: ${TEST_CONFIG.transferQty}`);
        console.log(`Route: ${warehouse.name} → ${store.name}`);
        console.log(`\nStock Changes:`);
        console.log(`  Warehouse: ${initialStock.warehouse} → ${initialStock.warehouse - TEST_CONFIG.transferQty}`);
        console.log(`  Store: ${initialStock.store} → ${initialStock.store + TEST_CONFIG.transferQty}`);

        if (success) {
            log.section('✅ ALL TESTS PASSED!');
            console.log('The transfer workflow is working correctly.');
            console.log('\n🔍 Verification Details:');
            console.log('  ✓ Transfer created successfully');
            console.log('  ✓ Stock deducted from warehouse');
            console.log('  ✓ Transfer status updated to In-Transit');
            console.log('  ✓ Stock added to store');
            console.log('  ✓ Transfer status updated to Completed');
            console.log('  ✓ Final stock levels match expected values');
            process.exit(0);
        } else {
            log.section('❌ TESTS FAILED!');
            console.log('Stock levels do not match expected values.');
            process.exit(1);
        }

    } catch (error) {
        log.section('❌ TEST FAILED WITH ERROR');
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest();
