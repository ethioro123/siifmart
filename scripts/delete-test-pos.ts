/**
 * Script to delete test Purchase Orders
 * 
 * Run with: npx tsx scripts/delete-test-pos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// PO numbers to delete
const poNumbersToDelete = [
  'PO-1764058380008',
  'PO-1764058356905',
  'PO-1764058342917',
  'PO-1764058330382',
  'PO-1764058320069',
  'PO-1764058309138'
];

async function deleteTestPOs() {
  console.log('🗑️  Deleting test Purchase Orders...\n');

  let deletedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const poNumber of poNumbersToDelete) {
    try {
      // Find the PO by po_number
      const { data: pos, error: findError } = await supabase
        .from('purchase_orders')
        .select('id, po_number, supplier_name, total_amount')
        .eq('po_number', poNumber);

      if (findError) {
        console.error(`❌ Error finding PO ${poNumber}:`, findError.message);
        errorCount++;
        continue;
      }

      if (!pos || pos.length === 0) {
        console.log(`⚠️  PO ${poNumber} not found`);
        notFoundCount++;
        continue;
      }

      const po = pos[0];
      console.log(`📋 Found PO: ${po.po_number} (${po.supplier_name}, ${po.total_amount} ETB)`);

      // Delete the PO (cascade will delete po_items automatically)
      const { error: deleteError } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', po.id);

      if (deleteError) {
        console.error(`❌ Error deleting PO ${poNumber}:`, deleteError.message);
        errorCount++;
      } else {
        console.log(`✅ Deleted PO ${poNumber}`);
        deletedCount++;
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for PO ${poNumber}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ Deleted: ${deletedCount}`);
  console.log(`   ⚠️  Not Found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('═══════════════════════════════════════\n');

  if (deletedCount > 0) {
    console.log('✅ Test POs deleted successfully!');
  }
}

// Run the script
deleteTestPOs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

