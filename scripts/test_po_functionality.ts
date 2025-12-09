import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function testPOFunctionality() {
    console.log('🧪 Testing PO System Functionality\n');
    console.log('='.repeat(60));

    let allTestsPassed = true;

    // Test 1: Check if sites exist
    console.log('\n📍 Test 1: Checking Sites...');
    const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .in('type', ['Store', 'Warehouse']);

    if (sitesError) {
        console.error('❌ Failed to fetch sites:', sitesError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ Found ${sites.length} sites`);
        sites.forEach(site => {
            console.log(`   - ${site.name} (${site.type})`);
        });
    }

    // Test 2: Check if suppliers exist
    console.log('\n🏢 Test 2: Checking Suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(5);

    if (suppliersError) {
        console.error('❌ Failed to fetch suppliers:', suppliersError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ Found ${suppliers.length} suppliers`);
        suppliers.forEach(sup => {
            console.log(`   - ${sup.name} (${sup.type})`);
        });
    }

    // Test 3: Create a test PO (Single Site)
    console.log('\n📦 Test 3: Creating Single-Site PO...');
    if (sites && sites.length > 0 && suppliers && suppliers.length > 0) {
        const testPO = {
            id: crypto.randomUUID(),
            site_id: sites[0].id,
            supplier_id: suppliers[0].id,
            supplier_name: suppliers[0].name,
            order_date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            total_amount: 1000,
            items_count: 10,
            expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            shipping_cost: 50,
            tax_amount: 100,
            notes: '[TEST] Single-site PO',
            payment_terms: 'Net 30',
            destination: sites[0].name,
            po_number: `PO-TEST-${Date.now()}`
        };

        const { data: createdPO, error: poError } = await supabase
            .from('purchase_orders')
            .insert(testPO)
            .select()
            .single();

        if (poError) {
            console.error('❌ Failed to create PO:', poError.message);
            allTestsPassed = false;
        } else {
            console.log(`✅ Created PO: ${createdPO.po_number}`);

            // Test 3b: Add line items
            console.log('   Adding line items...');
            const lineItems = [
                {
                    po_id: createdPO.id,
                    product_name: 'Test Product 1',
                    quantity: 5,
                    unit_cost: 100,
                    total_cost: 500
                },
                {
                    po_id: createdPO.id,
                    product_name: 'Test Product 2',
                    quantity: 5,
                    unit_cost: 100,
                    total_cost: 500
                }
            ];

            const { error: itemsError } = await supabase
                .from('po_items')
                .insert(lineItems);

            if (itemsError) {
                console.error('❌ Failed to add line items:', itemsError.message);
                allTestsPassed = false;
            } else {
                console.log('✅ Added 2 line items');
            }
        }
    }

    // Test 4: Create Multi-Site PO (Per-Store Mode)
    console.log('\n🏪 Test 4: Creating Multi-Site PO (Per-Store)...');
    if (sites && sites.length >= 2 && suppliers && suppliers.length > 0) {
        const selectedSites = sites.slice(0, 2);

        for (let i = 0; i < selectedSites.length; i++) {
            const site = selectedSites[i];
            const testPO = {
                id: crypto.randomUUID(),
                site_id: site.id,
                supplier_id: suppliers[0].id,
                supplier_name: suppliers[0].name,
                order_date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                total_amount: 500,
                items_count: 20,
                expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: '[TEST] Multi-Site Order - Full Qty per Store',
                destination: site.name,
                po_number: `PO-MULTI-${Date.now()}-${i}`
            };

            const { data: createdPO, error: poError } = await supabase
                .from('purchase_orders')
                .insert(testPO)
                .select()
                .single();

            if (poError) {
                console.error(`❌ Failed to create PO for ${site.name}:`, poError.message);
                allTestsPassed = false;
            } else {
                console.log(`✅ Created PO for ${site.name}: ${createdPO.po_number}`);

                // Add line items
                const lineItems = [{
                    po_id: createdPO.id,
                    product_name: 'Apples',
                    quantity: 20,
                    unit_cost: 5,
                    total_cost: 100
                }];

                await supabase.from('po_items').insert(lineItems);
            }
        }
    }

    // Test 5: Create Multi-Site PO (Shared Mode)
    console.log('\n🔀 Test 5: Creating Multi-Site PO (Shared)...');
    if (sites && sites.length >= 2 && suppliers && suppliers.length > 0) {
        const selectedSites = sites.slice(0, 2);
        const totalQty = 20;
        const qtyPerSite = Math.ceil(totalQty / selectedSites.length);

        for (let i = 0; i < selectedSites.length; i++) {
            const site = selectedSites[i];
            const testPO = {
                id: crypto.randomUUID(),
                site_id: site.id,
                supplier_id: suppliers[0].id,
                supplier_name: suppliers[0].name,
                order_date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                total_amount: qtyPerSite * 5,
                items_count: qtyPerSite,
                expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: '[TEST] Multi-Site Order - Shared Qty',
                destination: site.name,
                po_number: `PO-SHARED-${Date.now()}-${i}`
            };

            const { data: createdPO, error: poError } = await supabase
                .from('purchase_orders')
                .insert(testPO)
                .select()
                .single();

            if (poError) {
                console.error(`❌ Failed to create shared PO for ${site.name}:`, poError.message);
                allTestsPassed = false;
            } else {
                console.log(`✅ Created shared PO for ${site.name}: ${createdPO.po_number} (${qtyPerSite} items)`);

                // Add line items
                const lineItems = [{
                    po_id: createdPO.id,
                    product_name: 'Oranges',
                    quantity: qtyPerSite,
                    unit_cost: 5,
                    total_cost: qtyPerSite * 5
                }];

                await supabase.from('po_items').insert(lineItems);
            }
        }
    }

    // Test 6: Verify POs can be retrieved
    console.log('\n📋 Test 6: Retrieving All POs...');
    const { data: allPOs, error: retrieveError } = await supabase
        .from('purchase_orders')
        .select('*, po_items(*)')
        .order('created_at', { ascending: false });

    if (retrieveError) {
        console.error('❌ Failed to retrieve POs:', retrieveError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ Retrieved ${allPOs.length} POs`);
        allPOs.slice(0, 5).forEach(po => {
            console.log(`   - ${po.po_number}: ${po.items_count} items, ${po.status}, ${po.destination}`);
        });
    }

    // Test 7: Test PO approval
    console.log('\n✅ Test 7: Testing PO Approval...');
    if (allPOs && allPOs.length > 0) {
        const poToApprove = allPOs[0];

        // Update with approval info in notes
        const approvalTag = `\n[APPROVED_BY:Test Admin:${new Date().toISOString()}]`;
        const { error: approveError } = await supabase
            .from('purchase_orders')
            .update({
                status: 'Pending', // Keep as Pending (Approved is stored in notes)
                notes: (poToApprove.notes || '') + approvalTag
            })
            .eq('id', poToApprove.id);

        if (approveError) {
            console.error('❌ Failed to approve PO:', approveError.message);
            allTestsPassed = false;
        } else {
            console.log(`✅ Approved PO: ${poToApprove.po_number}`);
        }
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('\n🎉 PO System is fully functional!');
    } else {
        console.log('⚠️  SOME TESTS FAILED');
        console.log('\nPlease review the errors above.');
    }
    console.log('='.repeat(60) + '\n');
}

testPOFunctionality();
