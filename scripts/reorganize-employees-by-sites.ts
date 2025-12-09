/**
 * Script to reorganize employees according to their stores/warehouses
 * Assigns employees to appropriate sites based on their roles
 * 
 * Run with: npx tsx scripts/reorganize-employees-by-sites.ts
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

interface Site {
  id: string;
  name: string;
  type: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  site_id: string | null;
  email: string;
}

async function reorganizeEmployees() {
  console.log('🔄 Reorganizing employees by stores and warehouses...\n');

  try {
    // 1. Get all sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, type')
      .order('type', { ascending: false }) // Warehouses first, then Stores
      .order('name');

    if (sitesError) {
      throw sitesError;
    }

    if (!sites || sites.length === 0) {
      console.log('⚠️  No sites found. Please create sites first.');
      return;
    }

    // Separate warehouses and stores
    const warehouses = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');
    const stores = sites.filter(s => s.type === 'Store' || s.type === 'Dark Store');

    console.log(`📋 Found ${sites.length} sites:`);
    console.log(`   - ${warehouses.length} Warehouses`);
    console.log(`   - ${stores.length} Stores\n`);

    // 2. Get all employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, site_id, email')
      .order('role')
      .order('name');

    if (empError) {
      throw empError;
    }

    if (!employees || employees.length === 0) {
      console.log('⚠️  No employees found.');
      return;
    }

    console.log(`👥 Found ${employees.length} employees to reorganize\n`);

    // 3. Define role-to-site-type mapping
    const storeRoles = ['pos', 'store_supervisor', 'cs_manager'];
    const warehouseRoles = ['wms', 'picker', 'inventory_specialist'];
    const adminRoles = ['super_admin', 'admin', 'manager', 'hr', 'finance_manager', 'procurement_manager', 'it_support', 'auditor'];
    const driverRoles = ['driver'];

    // 4. Organize employees by role
    const storeEmployees = employees.filter(e => storeRoles.includes(e.role));
    const warehouseEmployees = employees.filter(e => warehouseRoles.includes(e.role));
    const adminEmployees = employees.filter(e => adminRoles.includes(e.role));
    const driverEmployees = employees.filter(e => driverRoles.includes(e.role));
    const otherEmployees = employees.filter(e => 
      !storeRoles.includes(e.role) && 
      !warehouseRoles.includes(e.role) && 
      !adminRoles.includes(e.role) && 
      !driverRoles.includes(e.role)
    );

    console.log('📊 Employee distribution by role:');
    console.log(`   Store roles (${storeRoles.length} types): ${storeEmployees.length} employees`);
    console.log(`   Warehouse roles (${warehouseRoles.length} types): ${warehouseEmployees.length} employees`);
    console.log(`   Admin roles (${adminRoles.length} types): ${adminEmployees.length} employees`);
    console.log(`   Driver roles: ${driverEmployees.length} employees`);
    console.log(`   Other roles: ${otherEmployees.length} employees\n`);

    // 5. Assign employees to sites
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Assign store employees to stores (distribute evenly)
    if (stores.length > 0 && storeEmployees.length > 0) {
      console.log('🏪 Assigning store employees to stores...');
      for (let i = 0; i < storeEmployees.length; i++) {
        const employee = storeEmployees[i];
        const targetStore = stores[i % stores.length]; // Round-robin distribution
        
        if (employee.site_id !== targetStore.id) {
          const { error } = await supabase
            .from('employees')
            .update({ site_id: targetStore.id })
            .eq('id', employee.id);

          if (error) {
            console.error(`   ❌ Failed to update ${employee.name}: ${error.message}`);
          } else {
            console.log(`   ✅ ${employee.name} (${employee.role}) → ${targetStore.name}`);
            totalUpdated++;
          }
        } else {
          console.log(`   ⏭️  ${employee.name} already at ${targetStore.name}`);
          totalSkipped++;
        }
      }
      console.log('');
    }

    // Assign warehouse employees to warehouses (distribute evenly)
    if (warehouses.length > 0 && warehouseEmployees.length > 0) {
      console.log('📦 Assigning warehouse employees to warehouses...');
      for (let i = 0; i < warehouseEmployees.length; i++) {
        const employee = warehouseEmployees[i];
        const targetWarehouse = warehouses[i % warehouses.length]; // Round-robin distribution
        
        if (employee.site_id !== targetWarehouse.id) {
          const { error } = await supabase
            .from('employees')
            .update({ site_id: targetWarehouse.id })
            .eq('id', employee.id);

          if (error) {
            console.error(`   ❌ Failed to update ${employee.name}: ${error.message}`);
          } else {
            console.log(`   ✅ ${employee.name} (${employee.role}) → ${targetWarehouse.name}`);
            totalUpdated++;
          }
        } else {
          console.log(`   ⏭️  ${employee.name} already at ${targetWarehouse.name}`);
          totalSkipped++;
        }
      }
      console.log('');
    }

    // Assign admin employees (distribute evenly across all sites)
    if (adminEmployees.length > 0) {
      console.log('👔 Assigning admin employees (distributed across all sites)...');
      const allSites = [...warehouses, ...stores];
      if (allSites.length > 0) {
        for (let i = 0; i < adminEmployees.length; i++) {
          const employee = adminEmployees[i];
          const targetSite = allSites[i % allSites.length];
          
          if (employee.site_id !== targetSite.id) {
            const { error } = await supabase
              .from('employees')
              .update({ site_id: targetSite.id })
              .eq('id', employee.id);

            if (error) {
              console.error(`   ❌ Failed to update ${employee.name}: ${error.message}`);
            } else {
              console.log(`   ✅ ${employee.name} (${employee.role}) → ${targetSite.name}`);
              totalUpdated++;
            }
          } else {
            console.log(`   ⏭️  ${employee.name} already at ${targetSite.name}`);
            totalSkipped++;
          }
        }
      }
      console.log('');
    }

    // Assign drivers (distribute evenly across all sites)
    if (driverEmployees.length > 0) {
      console.log('🚚 Assigning drivers (distributed across all sites)...');
      const allSites = [...warehouses, ...stores];
      if (allSites.length > 0) {
        for (let i = 0; i < driverEmployees.length; i++) {
          const employee = driverEmployees[i];
          const targetSite = allSites[i % allSites.length];
          
          if (employee.site_id !== targetSite.id) {
            const { error } = await supabase
              .from('employees')
              .update({ site_id: targetSite.id })
              .eq('id', employee.id);

            if (error) {
              console.error(`   ❌ Failed to update ${employee.name}: ${error.message}`);
            } else {
              console.log(`   ✅ ${employee.name} (${employee.role}) → ${targetSite.name}`);
              totalUpdated++;
            }
          } else {
            console.log(`   ⏭️  ${employee.name} already at ${targetSite.name}`);
            totalSkipped++;
          }
        }
      }
      console.log('');
    }

    // Handle other employees (assign to first available site)
    if (otherEmployees.length > 0) {
      console.log('❓ Assigning other employees...');
      const allSites = [...warehouses, ...stores];
      if (allSites.length > 0) {
        const defaultSite = allSites[0];
        for (const employee of otherEmployees) {
          if (employee.site_id !== defaultSite.id) {
            const { error } = await supabase
              .from('employees')
              .update({ site_id: defaultSite.id })
              .eq('id', employee.id);

            if (error) {
              console.error(`   ❌ Failed to update ${employee.name}: ${error.message}`);
            } else {
              console.log(`   ✅ ${employee.name} (${employee.role}) → ${defaultSite.name}`);
              totalUpdated++;
            }
          } else {
            console.log(`   ⏭️  ${employee.name} already at ${defaultSite.name}`);
            totalSkipped++;
          }
        }
      }
      console.log('');
    }

    // 6. Summary by site
    console.log('═══════════════════════════════════════');
    console.log('📊 Final Employee Distribution by Site:');
    console.log('═══════════════════════════════════════\n');

    for (const site of sites) {
      const { data: siteEmployees } = await supabase
        .from('employees')
        .select('id, name, role')
        .eq('site_id', site.id);

      const employeesByRole: Record<string, number> = {};
      siteEmployees?.forEach(emp => {
        employeesByRole[emp.role] = (employeesByRole[emp.role] || 0) + 1;
      });

      console.log(`📍 ${site.name} (${site.type})`);
      console.log(`   Total: ${siteEmployees?.length || 0} employees`);
      Object.entries(employeesByRole).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count}`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📈 Summary:');
    console.log(`   ✅ Updated: ${totalUpdated} employee(s)`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} employee(s) (already correctly assigned)`);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ Employee reorganization completed!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
reorganizeEmployees()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

