import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSamplePurchaseOrders() {
    console.log('📦 Creating Sample Purchase Orders...\n');
    console.log('='.repeat(80));

    try {
        // Get all sites and products
        const { data: sites, error: sitesError } = await supabase
            .from('sites')
            .select('*')
            .eq('type', 'Warehouse')
            .order('name');

        if (sitesError) throw sitesError;

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .order('site_id, name');

        if (productsError) throw productsError;

        console.log(`✅ Found ${sites.length} warehouses`);
        console.log(`✅ Found ${products.length} products\n`);

        // Get a supplier (or create a default one)
        let { data: suppliers } = await supabase
            .from('suppliers')
            .select('*')
            .limit(1);

        let supplierId;
        if (!suppliers || suppliers.length === 0) {
            console.log('Creating default supplier...');
            const { data: newSupplier, error: supplierError } = await supabase
                .from('suppliers')
                .insert({
                    name: 'Global Wholesale Distributors',
                    type: 'Business',
                    contact: 'Sales Manager',
                    email: 'sales@globalwholesale.com',
                    phone: '+251911234567',
                    category: 'General',
                    status: 'Active',
                    rating: 4.5,
                    lead_time: 7,
                    location: 'Addis Ababa'
                })
                .select()
                .single();

            if (supplierError) throw supplierError;
            supplierId = newSupplier.id;
            console.log(`✅ Created supplier: ${newSupplier.name}\n`);
        } else {
            supplierId = suppliers[0].id;
            console.log(`✅ Using existing supplier: ${suppliers[0].name}\n`);
        }

        // Create PO for each warehouse
        let totalPOs = 0;
        for (const site of sites) {
            const siteProducts = products.filter(p => p.site_id === site.id);

            if (siteProducts.length === 0) {
                console.log(`⚠️  No products found for ${site.name}, skipping...`);
                continue;
            }

            console.log(`\n📋 Creating PO for ${site.name}...`);
            console.log(`   Products: ${siteProducts.length}`);

            // Create line items
            const lineItems = siteProducts.map(product => ({
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: Math.floor(Math.random() * 50) + 50, // Random quantity between 50-100
                unitPrice: product.cost_price || product.price * 0.6,
                total: (product.cost_price || product.price * 0.6) * (Math.floor(Math.random() * 50) + 50)
            }));

            const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.15;
            const total = subtotal + tax;

            // Get supplier name
            const { data: supplier } = await supabase
                .from('suppliers')
                .select('name')
                .eq('id', supplierId)
                .single();

            // Create PO
            const poData = {
                supplier_id: supplierId,
                supplier_name: supplier?.name || 'Unknown Supplier',
                site_id: site.id,
                status: 'Pending',
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                total_amount: total,
                items_count: lineItems.length,
                tax_amount: tax,
                notes: `Initial stock order for ${site.name}`
            };

            const { data: po, error: poError } = await supabase
                .from('purchase_orders')
                .insert(poData)
                .select()
                .single();

            if (poError) {
                console.error(`   ❌ Failed to create PO:`, poError.message);
                continue;
            }

            // Create PO items
            const poItems = lineItems.map(item => ({
                po_id: po.id,
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                unit_cost: item.unitPrice,
                total_cost: item.total
            }));

            const { error: itemsError } = await supabase
                .from('po_items')
                .insert(poItems);

            if (itemsError) {
                console.error(`   ❌ Failed to create PO items:`, itemsError.message);
                continue;
            }

            console.log(`   ✅ Created PO: ${po.id.substring(0, 8)}...`);
            console.log(`   📦 Items: ${lineItems.length} products`);
            console.log(`   💰 Total: $${total.toFixed(2)}`);

            // Show first 3 items
            lineItems.slice(0, 3).forEach(item => {
                console.log(`      - ${item.productName} x${item.quantity} @ $${item.unitPrice.toFixed(2)}`);
            });
            if (lineItems.length > 3) {
                console.log(`      ... and ${lineItems.length - 3} more items`);
            }

            totalPOs++;
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 SUMMARY');
        console.log('='.repeat(80));
        console.log(`✅ Created ${totalPOs} Purchase Orders`);
        console.log(`✅ All warehouses now have pending POs to receive\n`);

        console.log('🎯 NEXT STEPS:');
        console.log('='.repeat(80));
        console.log('1. Login as a warehouse manager (WMS role)');
        console.log('2. Go to Warehouse Operations > DISPATCH tab');
        console.log('3. You will see the pending POs');
        console.log('4. Click "Start Receiving" to begin the receiving process');
        console.log('5. Print labels for received items');
        console.log('6. Complete putaway to assign warehouse locations');
        console.log('7. Products will then appear in inventory with stock!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

createSamplePurchaseOrders()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
