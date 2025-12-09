/**
 * Script to create 2 workers for each Store and Warehouse site
 * Run with: npx tsx scripts/create-site-workers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
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

async function createSiteWorkers() {
  console.log('🔍 Finding all Store and Warehouse sites...\n');

  try {
    // Get all Store and Warehouse sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, type')
      .in('type', ['Store', 'Warehouse']);

    if (sitesError) {
      throw sitesError;
    }

    if (!sites || sites.length === 0) {
      console.log('⚠️  No Store or Warehouse sites found.');
      return;
    }

    console.log(`📋 Found ${sites.length} sites:\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const site of sites) {
      console.log(`📍 ${site.name} (${site.type})`);

      // Get existing workers for this site (pos, picker, wms roles)
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, site_id, role')
        .eq('site_id', site.id)
        .in('role', ['pos', 'picker', 'wms']);

      if (empError) {
        console.error(`   ❌ Error fetching employees: ${empError.message}`);
        continue;
      }

      const existingWorkers = employees || [];
      const workersNeeded = Math.max(0, 2 - existingWorkers.length);

      if (workersNeeded === 0) {
        console.log(`   ✅ Already has 2 workers`);
        totalSkipped++;
        continue;
      }

      console.log(`   ⚠️  Has ${existingWorkers.length} worker(s), creating ${workersNeeded} more...`);

      // Determine appropriate roles based on site type
      const workerRoles = site.type === 'Store' 
        ? ['pos', 'pos'] // 2 POS workers for stores
        : ['picker', 'wms']; // 1 picker + 1 WMS for warehouses

      // Create the needed workers
      for (let i = 0; i < workersNeeded; i++) {
        const role = workerRoles[existingWorkers.length + i] || workerRoles[0];
        const workerNumber = existingWorkers.length + i + 1;
        const workerName = `${site.name} Worker ${workerNumber}`;
        const siteNameClean = site.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${siteNameClean}.worker${workerNumber}@siifmart.com`;
        const password = 'Worker123!'; // Default password

        try {
          // 1. Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              name: workerName,
              role,
              site_id: site.id
            }
          });

          if (authError) {
            throw new Error(`Auth creation failed: ${authError.message}`);
          }

          if (!authData.user) {
            throw new Error('No user data returned');
          }

          // 2. Create employee record
          const { error: empCreateError } = await supabase
            .from('employees')
            .insert({
              id: authData.user.id,
              name: workerName,
              email,
              role,
              site_id: site.id,
              status: 'Active',
              join_date: new Date().toISOString().split('T')[0],
              phone: '',
              department: site.type === 'Store' ? 'Retail' : 'Warehouse',
              salary: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=random`,
              performance_score: 100,
              attendance_rate: 95
            });

          if (empCreateError) {
            // Try to delete auth user if employee creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(`Employee creation failed: ${empCreateError.message}`);
          }

          console.log(`   ✅ Created: ${workerName} (${role}) - ${email}`);
          totalCreated++;
        } catch (workerError: any) {
          console.error(`   ❌ Failed to create worker ${workerNumber}: ${workerError.message}`);
        }
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${totalCreated} worker(s)`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} site(s) (already have 2 workers)`);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ All sites now have 2 workers!');
    console.log('\n📝 Default passwords: Worker123!');
    console.log('   (Workers should change password on first login)');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createSiteWorkers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

