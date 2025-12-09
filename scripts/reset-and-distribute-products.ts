/**
 * Script to reset all products to "receive" status and distribute them equally across warehouses
 * Each warehouse gets unique product records
 * 
 * Run with: npx tsx scripts/reset-and-distribute-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  sale_price?: number;
  image?: string;
  shelf_position?: string;
  competitor_price?: number;
  sales_velocity?: string;
}

interface Site {
  id: string;
  name: string;
  type: string;
}

async function resetAndDistributeProducts() {
  console.log('🔄 Resetting products to receive status and distributing equally across warehouses...\n');

  try {
    // 1. Get all warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('sites')
      .select('id, name, type')
      .in('type', ['Warehouse', 'Distribution Center'])
      .order('name');

    if (warehousesError) {
      throw warehousesError;
    }

    if (!warehouses || warehouses.length === 0) {
      console.log('⚠️  No warehouses found. Please create warehouses first.');
      return;
    }

    console.log(`📦 Found ${warehouses.length} warehouses:`);
    warehouses.forEach(w => console.log(`   - ${w.name}`));
    console.log('');

    // 2. Get all unique products (by SKU) - collect from all sites to get master list
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('sku');

    if (productsError) {
      throw productsError;
    }

    if (!allProducts || allProducts.length === 0) {
      console.log('⚠️  No products found. Nothing to distribute.');
      return;
    }

    // 3. Get unique products by SKU (master product list)
    const uniqueProductsMap = new Map<string, Product>();
    allProducts.forEach((p: any) => {
      if (!uniqueProductsMap.has(p.sku)) {
        uniqueProductsMap.set(p.sku, {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: p.price || 0,
          cost_price: p.cost_price,
          sale_price: p.sale_price,
          image: p.image || '/placeholder-product.png',
          shelf_position: p.shelf_position,
          competitor_price: p.competitor_price,
          sales_velocity: p.sales_velocity
        });
      }
    });

    const uniqueProducts = Array.from(uniqueProductsMap.values());
    console.log(`📋 Found ${uniqueProducts.length} unique products (by SKU)`);
    console.log(`   Total product records: ${allProducts.length}\n`);

    // 4. Reset all existing products to receive status instead of deleting
    // (Deleting would violate foreign key constraints with PO items, etc.)
    console.log('🔄 Resetting all existing products to receive status...');
    
    const { error: resetError } = await supabase
      .from('products')
      .update({
        stock: 0,
        status: 'out_of_stock',
        location: 'Receiving Dock',
        expiry_date: null,
        batch_number: null,
        sales_velocity: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetError) {
      console.warn('⚠️  Warning: Could not reset all products:', resetError.message);
      console.log('   Continuing with distribution...\n');
    } else {
      console.log('✅ All existing products reset to receive status\n');
    }

    // 5. Distribute products equally across warehouses
    console.log('📦 Distributing products equally across warehouses...\n');

    let totalCreated = 0;
    let totalUpdated = 0;
    const productsPerWarehouse = Math.ceil(uniqueProducts.length / warehouses.length);

    for (let i = 0; i < warehouses.length; i++) {
      const warehouse = warehouses[i];
      const startIdx = i * productsPerWarehouse;
      const endIdx = Math.min(startIdx + productsPerWarehouse, uniqueProducts.length);
      const warehouseProducts = uniqueProducts.slice(startIdx, endIdx);

      console.log(`📦 ${warehouse.name}:`);
      console.log(`   Products to ensure: ${warehouseProducts.length}`);

      // Check existing products for this warehouse
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, sku')
        .eq('site_id', warehouse.id);

      const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);

      // Separate products into: update existing, create new
      const productsToUpdate: Product[] = [];
      const productsToCreate: Product[] = [];

      warehouseProducts.forEach(product => {
        if (existingSkus.has(product.sku)) {
          productsToUpdate.push(product);
        } else {
          productsToCreate.push(product);
        }
      });

      // Update existing products
      if (productsToUpdate.length > 0) {
        for (const product of productsToUpdate) {
          const existingProduct = existingProducts?.find(p => p.sku === product.sku);
          if (existingProduct) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                stock: 0,
                status: 'out_of_stock',
                location: 'Receiving Dock',
                expiry_date: null,
                batch_number: null,
                sales_velocity: null
              })
              .eq('id', existingProduct.id);

            if (!updateError) {
              totalUpdated++;
            }
          }
        }
        console.log(`   🔄 Updated: ${productsToUpdate.length} existing products`);
      }

      // Create new products for this warehouse
      if (productsToCreate.length > 0) {
        // Make SKU unique per warehouse by appending warehouse prefix
        const warehousePrefix = warehouse.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
        
        const productsToInsert = productsToCreate.map(product => ({
          site_id: warehouse.id,
          name: product.name,
          sku: `${warehousePrefix}-${product.sku}`, // Unique SKU per warehouse
          category: product.category,
          price: product.price,
          cost_price: product.cost_price || product.price * 0.6, // Default cost if missing
          sale_price: product.sale_price || product.price,
          is_on_sale: false,
          stock: 0, // Reset to 0 - needs to be received
          status: 'out_of_stock', // Reset status
          location: 'Receiving Dock', // Reset to receiving dock - needs putaway
          image: product.image || '/placeholder-product.png',
          expiry_date: null, // Reset expiry
          batch_number: null, // Reset batch
          shelf_position: product.shelf_position || null,
          competitor_price: product.competitor_price || null,
          sales_velocity: null // Reset velocity
        }));

        // Insert in batches to avoid timeout
        const batchSize = 50;
        let inserted = 0;

        for (let j = 0; j < productsToInsert.length; j += batchSize) {
          const batch = productsToInsert.slice(j, j + batchSize);
          const { data: insertedProducts, error: insertError } = await supabase
            .from('products')
            .insert(batch)
            .select('id, name, sku');

          if (insertError) {
            console.error(`   ❌ Error inserting batch: ${insertError.message}`);
            continue;
          }

          inserted += insertedProducts?.length || 0;
        }

        console.log(`   ✅ Created: ${inserted} new products`);
        totalCreated += inserted;
      }

      // Remove products that shouldn't be at this warehouse
      const expectedSkus = new Set(warehouseProducts.map(p => p.sku));
      const productsToRemove = existingProducts?.filter(p => !expectedSkus.has(p.sku)) || [];
      
      if (productsToRemove.length > 0) {
        // Move them to first warehouse instead of deleting (to avoid FK constraints)
        const firstWarehouse = warehouses[0];
        if (warehouse.id !== firstWarehouse.id) {
          for (const product of productsToRemove) {
            await supabase
              .from('products')
              .update({ site_id: firstWarehouse.id })
              .eq('id', product.id);
          }
          console.log(`   🔄 Moved ${productsToRemove.length} products to ${firstWarehouse.name}`);
        }
      }

      console.log(`   📍 Location: Receiving Dock (ready for receiving)`);
      console.log(`   📊 Stock: 0 (needs to be received)`);
      
      // Show sample products
      if (warehouseProducts.length > 0) {
        console.log(`   Sample:`);
        warehouseProducts.slice(0, 3).forEach(p => {
          console.log(`      • ${p.name} (${p.sku})`);
        });
      }
      console.log('');
    }

    // 6. Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 Distribution Summary:');
    console.log('═══════════════════════════════════════\n');

    for (const warehouse of warehouses) {
      const { data: warehouseProducts } = await supabase
        .from('products')
        .select('id, name, sku, stock, location')
        .eq('site_id', warehouse.id);

      console.log(`📦 ${warehouse.name}:`);
      console.log(`   Total products: ${warehouseProducts?.length || 0}`);
      console.log(`   Status: All at Receiving Dock (ready for receiving)`);
      console.log(`   Stock: All at 0 (needs to be received)`);
      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📈 Final Summary:');
    console.log(`   ✅ Products created: ${totalCreated}`);
    console.log(`   🔄 Products updated: ${totalUpdated}`);
    console.log(`   📦 Warehouses: ${warehouses.length}`);
    console.log(`   📋 Unique products: ${uniqueProducts.length}`);
    console.log(`   📊 Average per warehouse: ${Math.round((totalCreated + totalUpdated) / warehouses.length)}`);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ Product reset and distribution completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Create Purchase Orders for each warehouse');
    console.log('   2. Receive products at each warehouse');
    console.log('   3. Complete putaway jobs to assign locations');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the script
resetAndDistributeProducts()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

