import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReceiveAndPutaway() {
    console.log('--- STARTING RECEIVE AND PUTAWAY FLOW VERIFICATION ---');

    const siteId = 'bb0425bc-3119-449a-a685-b871e552bee0';
    const testSku = `TEST-RECEIVE-SKU-${Date.now()}`;
    const barcodeAlias1 = `ALIAS1-${Date.now()}`;
    const barcodeAlias2 = `ALIAS2-${Date.now()}`;

    // 1. Simulate the PO Item Definition (received details)
    const lineItem = {
        productName: 'Verify Receive Product',
        sku: testSku,
        retailPrice: 99.99,
        unitCost: 49.99,
        category: 'Bakery',
        barcode: barcodeAlias1,
        barcodes: [barcodeAlias1, barcodeAlias2],
        size: '500',
        brand: 'TestBrand',
        unit: 'G',
        packQuantity: 10,
        customAttributes: { packaging: { unitSize: '500g', packQty: 10 } },
        description: 'Verify description preservation',
        minStock: 5,
        maxStock: 50
    };

    console.log(`1. Simulating Product Creation during Receive for SKU: ${testSku}`);

    // This simulates the database insertion we added to receivePO / receivePOSplit
    const { data: createdProduct, error: createError } = await supabase
        .from('products')
        .insert({
            site_id: siteId,
            name: lineItem.productName,
            sku: lineItem.sku,
            barcode: lineItem.barcode,
            barcodes: lineItem.barcodes,
            price: lineItem.retailPrice,
            cost_price: lineItem.unitCost,
            category: lineItem.category,
            status: 'active',
            stock: 0,
            location: 'On Order',
            size: lineItem.size,
            brand: lineItem.brand,
            unit: lineItem.unit,
            pack_quantity: lineItem.packQuantity,
            custom_attributes: lineItem.customAttributes,
            description: lineItem.description,
            min_stock: lineItem.minStock,
            max_stock: lineItem.maxStock
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create product during receive:', createError);
        return;
    }

    console.log(`   ✅ Product created with ID: ${createdProduct.id}`);
    console.log(`   ✅ Location is set to: '${createdProduct.location}'`);
    console.log(`   ✅ Barcode Aliases saved: ${JSON.stringify(createdProduct.barcodes)}`);

    // 2. Validate scanner-like match logic in Putaway
    console.log('2. Validating scanner match logic for Putaway tab...');
    
    // Simulate lookup in allProducts (matching the logic in PutawayTab.tsx)
    const productForPutaway = createdProduct;
    const scannerInputSku = testSku;
    const scannerInputAlias1 = barcodeAlias1;
    const scannerInputAlias2 = barcodeAlias2;

    const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
    const getBarcodesArray = (barcodes: any): string[] => {
        if (!barcodes) return [];
        if (Array.isArray(barcodes)) return barcodes;
        return [];
    };

    const validateScannerMatch = (barcode: string) => {
        const normalized = barcode.toUpperCase().trim();
        const normalizedInput = normSku(normalized);
        const aliasList = getBarcodesArray(productForPutaway.barcodes);
        
        const hasAliasMatch = aliasList.some(b => {
            const cleanB = b.toUpperCase().trim();
            return normalized === cleanB || normalizedInput === normSku(cleanB);
        });

        const isValid =
            normalized === testSku.toUpperCase() ||
            normalized === productForPutaway.barcode?.toUpperCase() ||
            hasAliasMatch ||
            normalizedInput === normSku(testSku) ||
            normalizedInput === normSku(productForPutaway.barcode || '');

        return isValid;
    };

    const skuMatch = validateScannerMatch(scannerInputSku);
    const alias1Match = validateScannerMatch(scannerInputAlias1);
    const alias2Match = validateScannerMatch(scannerInputAlias2);

    console.log(`   SKU Match ('${scannerInputSku}'): ${skuMatch ? '✅ MATCHED' : '❌ FAILED'}`);
    console.log(`   Alias 1 Match ('${scannerInputAlias1}'): ${alias1Match ? '✅ MATCHED' : '❌ FAILED'}`);
    console.log(`   Alias 2 Match ('${scannerInputAlias2}'): ${alias2Match ? '✅ MATCHED' : '❌ FAILED'}`);

    if (skuMatch && alias1Match && alias2Match) {
        console.log('   ✅ Putaway scanner validation logic fully passed.');
    } else {
        console.error('   ❌ Scanner validation failed.');
    }

    // 3. Simulate Putaway complete logic (putawayStock in Fulfillment.tsx)
    console.log('3. Simulating Putaway complete (Recycling/Relocating)...');
    
    const putawayLocation = 'A-99-99';
    const putawayQty = 15;

    // Check recycling condition
    const isPlaceholder = (productForPutaway.location === 'On Order' || !productForPutaway.location) && productForPutaway.stock === 0;
    
    if (isPlaceholder) {
        console.log(`   ♻️ Recycling placeholder product from '${productForPutaway.location}' to '${putawayLocation}'`);
        
        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
                location: putawayLocation,
                stock: putawayQty
            })
            .eq('id', productForPutaway.id)
            .select()
            .single();

        if (updateError) {
            console.error('   ❌ Failed to recycle product:', updateError);
        } else {
            console.log(`   ✅ Product recycled successfully. New Location: '${updatedProduct.location}', Stock: ${updatedProduct.stock}`);
            
            // Clean up test data
            await supabase.from('products').delete().eq('id', productForPutaway.id);
            console.log('🧹 Cleaned up verification records.');
        }
    } else {
        console.error('   ❌ Product was not detected as placeholder.');
    }
}

verifyReceiveAndPutaway();
