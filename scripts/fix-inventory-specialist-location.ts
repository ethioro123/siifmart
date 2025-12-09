/**
 * Fix Inventory Specialist Location
 * Move Hanna Mulugeta from Store to a warehouse site
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixInventorySpecialistLocation() {
  console.log('🔧 Fixing Inventory Specialist Location...\n');

  // 1. Find Hanna Mulugeta
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('email', 'hanna.mulugeta@siifmart.com')
    .eq('role', 'inventory_specialist')
    .single();

  if (empError || !employee) {
    console.error('❌ Error finding employee:', empError);
    return;
  }

  console.log(`✅ Found: ${employee.name} (${employee.role})`);
  console.log(`   Current Site ID: ${employee.site_id}`);

  // 2. Get current site
  const { data: currentSite } = await supabase
    .from('sites')
    .select('*')
    .eq('id', employee.site_id)
    .single();

  if (currentSite) {
    console.log(`   Current Site: ${currentSite.name} (${currentSite.type})`);
  }

  // 3. Find warehouse sites
  const { data: warehouseSites } = await supabase
    .from('sites')
    .select('*')
    .in('type', ['Warehouse', 'Distribution Center', 'Storage Facility'])
    .order('name', { ascending: true });

  if (!warehouseSites || warehouseSites.length === 0) {
    console.error('❌ No warehouse sites found');
    return;
  }

  console.log(`\n📍 Available Warehouse Sites:`);
  warehouseSites.forEach((site, idx) => {
    console.log(`   ${idx + 1}. ${site.name} (${site.type})`);
  });

  // 4. Find warehouse with fewest inventory specialists
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('site_id, role')
    .eq('role', 'inventory_specialist');

  const specialistsBySite: Record<string, number> = {};
  warehouseSites.forEach(site => {
    specialistsBySite[site.id] = 0;
  });

  allEmployees?.forEach(emp => {
    if (specialistsBySite[emp.site_id] !== undefined) {
      specialistsBySite[emp.site_id] = (specialistsBySite[emp.site_id] || 0) + 1;
    }
  });

  // Find warehouse with fewest specialists
  let targetSite = warehouseSites[0];
  let minSpecialists = specialistsBySite[targetSite.id] || 0;

  warehouseSites.forEach(site => {
    const count = specialistsBySite[site.id] || 0;
    if (count < minSpecialists) {
      minSpecialists = count;
      targetSite = site;
    }
  });

  console.log(`\n✅ Selected Target Site: ${targetSite.name} (${targetSite.type})`);
  console.log(`   Current specialists at this site: ${minSpecialists}`);

  // 5. Update employee site
  console.log(`\n🔄 Updating employee site assignment...`);
  const { error: updateError } = await supabase
    .from('employees')
    .update({ site_id: targetSite.id })
    .eq('id', employee.id);

  if (updateError) {
    console.error('❌ Error updating employee:', updateError);
    return;
  }

  console.log('✅ Successfully updated employee site assignment!');
  console.log(`\n📋 Summary:`);
  console.log(`   Employee: ${employee.name}`);
  console.log(`   Role: ${employee.role}`);
  console.log(`   Old Site: ${currentSite?.name || 'Unknown'} (${currentSite?.type || 'Unknown'})`);
  console.log(`   New Site: ${targetSite.name} (${targetSite.type})`);
  console.log(`   Email: ${employee.email}`);

  // 6. Verify the update
  console.log(`\n🔍 Verifying update...`);
  const { data: updatedEmployee } = await supabase
    .from('employees')
    .select('*, sites(name, type)')
    .eq('id', employee.id)
    .single();

  if (updatedEmployee) {
    const site = (updatedEmployee as any).sites;
    console.log(`✅ Verification successful!`);
    console.log(`   Current site: ${site?.name || 'Unknown'} (${site?.type || 'Unknown'})`);
  }
}

fixInventorySpecialistLocation().catch(console.error);

