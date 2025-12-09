/**
 * Swap employee roles: Make SIIF-0001 super_admin (Shukri Kamal)
 * and make current super_admin become admin
 * Run with: npx tsx scripts/swap-employee-roles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

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

async function swapEmployeeRoles() {
  console.log('🔄 Swapping employee roles...\n');

  try {
    // 1. Find employee with code SIIF-0001
    const { data: employee0001, error: emp1Error } = await supabase
      .from('employees')
      .select('id, name, email, role, code')
      .eq('code', 'SIIF-0001')
      .single();

    if (emp1Error || !employee0001) {
      console.error('❌ Employee with code SIIF-0001 not found');
      console.error('   Error:', emp1Error?.message);
      process.exit(1);
    }

    console.log(`✅ Found SIIF-0001: ${employee0001.name} (${employee0001.role})`);

    // 2. Find current super_admin (Shukri Kamal)
    const { data: superAdmin, error: adminError } = await supabase
      .from('employees')
      .select('id, name, email, role, code')
      .ilike('name', '%Shukri%Kamal%')
      .single();

    if (adminError || !superAdmin) {
      console.error('❌ Shukri Kamal (super_admin) not found');
      console.error('   Error:', adminError?.message);
      process.exit(1);
    }

    console.log(`✅ Found super_admin: ${superAdmin.name} (${superAdmin.code})`);

    // 3. Verify Shukri Kamal is super_admin
    if (superAdmin.role !== 'super_admin') {
      console.log(`⚠️  Warning: ${superAdmin.name} is currently ${superAdmin.role}, not super_admin`);
    }

    // 4. Swap both codes and roles
    console.log('\n🔄 Swapping codes and roles...\n');

    // Get the code from Shukri Kamal to give to Sara Tesfaye
    const shukriCode = superAdmin.code || 'SIIF-0002';
    const saraCode = employee0001.code || 'SIIF-0001';
    const tempCode = 'SIIF-TEMP-' + Date.now();

    // Step 1: Temporarily change Sara's code to avoid unique constraint violation
    console.log('   Step 1: Temporarily changing Sara Tesfaye\'s code...');
    const { error: tempError } = await supabase
      .from('employees')
      .update({ code: tempCode })
      .eq('id', employee0001.id);

    if (tempError) {
      console.error('❌ Failed to temporarily update Sara\'s code:', tempError.message);
      process.exit(1);
    }

    // Step 2: Give Shukri Kamal SIIF-0001 and super_admin role
    console.log('   Step 2: Updating Shukri Kamal to SIIF-0001, super_admin...');
    const { error: update1Error } = await supabase
      .from('employees')
      .update({ 
        role: 'super_admin',
        code: 'SIIF-0001'
      })
      .eq('id', superAdmin.id);

    if (update1Error) {
      console.error('❌ Failed to update Shukri Kamal:', update1Error.message);
      // Revert Sara's code
      await supabase
        .from('employees')
        .update({ code: saraCode })
        .eq('id', employee0001.id);
      process.exit(1);
    }

    console.log(`✅ Updated ${superAdmin.name} → SIIF-0001, super_admin`);

    // Step 3: Give Sara Tesfaye Shukri's old code and admin role
    console.log('   Step 3: Updating Sara Tesfaye to admin...');
    const { error: update2Error } = await supabase
      .from('employees')
      .update({ 
        role: 'admin',
        code: shukriCode
      })
      .eq('id', employee0001.id);

    if (update2Error) {
      console.error('❌ Failed to update Sara Tesfaye:', update2Error.message);
      // Try to revert both changes
      await supabase
        .from('employees')
        .update({ 
          role: superAdmin.role,
          code: shukriCode
        })
        .eq('id', superAdmin.id);
      await supabase
        .from('employees')
        .update({ code: saraCode })
        .eq('id', employee0001.id);
      process.exit(1);
    }

    console.log(`✅ Updated ${employee0001.name} → ${shukriCode}, admin`);

    // 5. Update auth metadata for both users
    console.log('\n🔄 Updating auth metadata...\n');

    // Update Shukri Kamal auth metadata (now SIIF-0001, super_admin)
    const { error: auth1Error } = await supabase.auth.admin.updateUserById(superAdmin.id, {
      user_metadata: {
        role: 'super_admin'
      }
    });

    if (auth1Error) {
      console.error('⚠️  Warning: Failed to update auth metadata for Shukri Kamal:', auth1Error.message);
    } else {
      console.log(`✅ Updated auth metadata for ${superAdmin.name} → super_admin`);
    }

    // Update Sara Tesfaye auth metadata (now admin)
    const { error: auth2Error } = await supabase.auth.admin.updateUserById(employee0001.id, {
      user_metadata: {
        role: 'admin'
      }
    });

    if (auth2Error) {
      console.error('⚠️  Warning: Failed to update auth metadata for Sara Tesfaye:', auth2Error.message);
    } else {
      console.log(`✅ Updated auth metadata for ${employee0001.name} → admin`);
    }

    // 6. Verify the swap
    console.log('\n📊 Verification:\n');

    const { data: verify1 } = await supabase
      .from('employees')
      .select('id, name, role, code')
      .eq('code', 'SIIF-0001')
      .single();

    const { data: verify2 } = await supabase
      .from('employees')
      .select('id, name, role, code')
      .ilike('name', '%Shukri%Kamal%')
      .single();

    const { data: verify3 } = await supabase
      .from('employees')
      .select('id, name, role, code')
      .ilike('name', '%Sara%Tesfaye%')
      .single();

    console.log(`✅ ${verify1?.name} (SIIF-0001): ${verify1?.role}`);
    if (verify2) {
      console.log(`✅ ${verify2.name} (${verify2.code}): ${verify2.role}`);
    }
    if (verify3) {
      console.log(`✅ ${verify3.name} (${verify3.code}): ${verify3.role}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS: Codes and roles swapped successfully!');
    console.log('='.repeat(80));
    console.log(`\n📋 Summary:`);
    console.log(`   • ${superAdmin.name} is now: SIIF-0001, super_admin`);
    console.log(`   • ${employee0001.name} is now: ${shukriCode}, admin`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

swapEmployeeRoles()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

