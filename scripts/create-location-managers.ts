/**
 * Script to create Retail Managers and Warehouse Managers for each location
 * 
 * Run with: npx tsx scripts/create-location-managers.ts
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

async function createLocationManagers() {
  console.log('👥 Creating Location Managers...\n');

  // Fetch all sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError.message);
    return;
  }

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  console.log(`📋 Found ${sites.length} sites\n`);

  const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');
  const stores = sites.filter(s => s.type === 'Store' || s.type === 'Dark Store');

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Create Warehouse Managers
  console.log('🏭 Creating Warehouse Managers...\n');
  for (const warehouse of warehouses) {
    const managerName = warehouse.manager || `Warehouse Manager - ${warehouse.name}`;
    const email = `${warehouse.name.toLowerCase().replace(/\s+/g, '.')}.warehouse@siifmart.com`;
    const firstName = managerName.split(' ')[0] || 'Warehouse';
    const lastName = managerName.split(' ').slice(1).join(' ') || 'Manager';

    // Check if manager already exists for this site
    const { data: existingManager } = await supabase
      .from('employees')
      .select('*')
      .eq('site_id', warehouse.id)
      .eq('role', 'manager')
      .eq('department', 'Logistics & Warehouse')
      .single();

    if (existingManager) {
      console.log(`   ⏭️  Skipping ${warehouse.name} - Manager already exists: ${existingManager.name}`);
      skippedCount++;
      continue;
    }

    // Create employee record
    const { data: newEmployee, error: empError } = await supabase
      .from('employees')
      .insert({
        name: managerName,
        email: email,
        phone: 'N/A',
        role: 'manager',
        department: 'Logistics & Warehouse',
        site_id: warehouse.id,
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0],
        performance_score: 95,
        specialization: 'Warehouse Operations',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=3b82f6&color=fff&size=128`
      })
      .select('id, name')
      .single();

    if (empError) {
      console.error(`   ❌ Failed to create manager for ${warehouse.name}:`, empError.message);
      continue;
    }

    console.log(`   ✅ Created Warehouse Manager: ${managerName} for ${warehouse.name}`);
    createdCount++;
  }

  // Create Retail Managers
  console.log('\n🏪 Creating Retail Managers...\n');
  for (const store of stores) {
    const managerName = store.manager || `Retail Manager - ${store.name}`;
    const email = `${store.name.toLowerCase().replace(/\s+/g, '.')}.retail@siifmart.com`;
    const firstName = managerName.split(' ')[0] || 'Retail';
    const lastName = managerName.split(' ').slice(1).join(' ') || 'Manager';

    // Check if manager already exists for this site
    const { data: existingManager } = await supabase
      .from('employees')
      .select('*')
      .eq('site_id', store.id)
      .eq('role', 'manager')
      .eq('department', 'Retail Operations')
      .single();

    if (existingManager) {
      console.log(`   ⏭️  Skipping ${store.name} - Manager already exists: ${existingManager.name}`);
      skippedCount++;
      continue;
    }

    // Create employee record
    const { data: newEmployee, error: empError } = await supabase
      .from('employees')
      .insert({
        name: managerName,
        email: email,
        phone: 'N/A',
        role: 'manager',
        department: 'Retail Operations',
        site_id: store.id,
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0],
        performance_score: 95,
        specialization: 'Retail Operations',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=10b981&color=fff&size=128`
      })
      .select('id, name')
      .single();

    if (empError) {
      console.error(`   ❌ Failed to create manager for ${store.name}:`, empError.message);
      continue;
    }

    console.log(`   ✅ Created Retail Manager: ${managerName} for ${store.name}`);
    createdCount++;
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log('═══════════════════════════════════════\n');

  if (createdCount > 0) {
    console.log('✅ Location managers created successfully!');
    console.log('👉 Refresh your browser to see the new managers.');
  }
}

// Run the script
createLocationManagers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

