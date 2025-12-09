/**
 * Verify Employee Site Assignments
 * Checks that all employees are assigned to the correct site type (Store vs Warehouse)
 * based on their roles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Employee {
  id: string;
  name: string;
  role: string;
  site_id: string | null;
  email: string;
}

interface Site {
  id: string;
  name: string;
  type: string;
}

// Role to site type mapping
const ROLE_SITE_MAPPING: Record<string, string[]> = {
  // Store roles - should be at stores
  store: ['pos', 'store_supervisor', 'store_manager', 'cs_manager', 'cashier'],
  
  // Warehouse roles - should be at warehouses
  warehouse: [
    'wms', 
    'picker', 
    'packer',
    'inventory_specialist', 
    'warehouse_manager',
    'dispatcher',
    'warehouse_worker'
  ],
  
  // Admin/HQ roles - can be at any site or no site
  admin: [
    'super_admin', 
    'admin', 
    'manager', 
    'hr', 
    'finance_manager', 
    'procurement_manager', 
    'it_support', 
    'auditor',
    'general_manager'
  ],
  
  // Driver roles - typically no fixed site
  driver: ['driver'],
  
  // Other roles - flexible
  other: []
};

async function verifyEmployeeAssignments() {
  console.log('🔍 Verifying Employee Site Assignments...\n');

  try {
    // 1. Get all sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, type')
      .order('type', { ascending: false })
      .order('name');

    if (sitesError) {
      throw sitesError;
    }

    if (!sites || sites.length === 0) {
      console.log('⚠️  No sites found.');
      return;
    }

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

    console.log(`📊 Found ${sites.length} sites and ${employees.length} employees\n`);
    console.log('='.repeat(100));

    // Create site lookup map
    const siteMap = new Map<string, Site>();
    sites.forEach(site => {
      siteMap.set(site.id, site);
    });

    // Separate sites by type
    const warehouses = sites.filter(s => 
      s.type === 'Warehouse' || 
      s.type === 'Distribution Center' ||
      s.type === 'Fulfillment Center'
    );
    const stores = sites.filter(s => 
      s.type === 'Store' || 
      s.type === 'Dark Store' ||
      s.type === 'Retail Store'
    );

    console.log(`\n📦 Warehouses: ${warehouses.length}`);
    warehouses.forEach(w => console.log(`   - ${w.name}`));
    
    console.log(`\n🏪 Stores: ${stores.length}`);
    stores.forEach(s => console.log(`   - ${s.name}`));

    // 3. Check each employee
    const issues: Array<{
      employee: Employee;
      issue: string;
      expected: string;
      actual: string;
    }> = [];

    const correct: Array<{
      employee: Employee;
      site: Site;
    }> = [];

    const unassigned: Employee[] = [];

    employees.forEach(emp => {
      const site = emp.site_id ? siteMap.get(emp.site_id) : null;
      
      // Determine expected site type based on role
      let expectedSiteType: string | null = null;
      
      if (ROLE_SITE_MAPPING.store.includes(emp.role.toLowerCase())) {
        expectedSiteType = 'Store';
      } else if (ROLE_SITE_MAPPING.warehouse.includes(emp.role.toLowerCase())) {
        expectedSiteType = 'Warehouse';
      } else if (ROLE_SITE_MAPPING.admin.includes(emp.role.toLowerCase()) || 
                 ROLE_SITE_MAPPING.driver.includes(emp.role.toLowerCase())) {
        expectedSiteType = 'Any'; // Flexible
      }

      // Check for issues
      if (!emp.site_id) {
        if (expectedSiteType && expectedSiteType !== 'Any') {
          issues.push({
            employee: emp,
            issue: 'Not assigned to any site',
            expected: expectedSiteType,
            actual: 'None'
          });
        } else {
          unassigned.push(emp);
        }
      } else if (!site) {
        issues.push({
          employee: emp,
          issue: 'Assigned to non-existent site',
          expected: expectedSiteType || 'Valid site',
          actual: `Site ID: ${emp.site_id}`
        });
      } else if (expectedSiteType && expectedSiteType !== 'Any') {
        const isStore = site.type === 'Store' || site.type === 'Dark Store' || site.type === 'Retail Store';
        const isWarehouse = site.type === 'Warehouse' || site.type === 'Distribution Center' || site.type === 'Fulfillment Center';
        
        if (expectedSiteType === 'Store' && !isStore) {
          issues.push({
            employee: emp,
            issue: 'Store role assigned to warehouse',
            expected: 'Store',
            actual: site.type
          });
        } else if (expectedSiteType === 'Warehouse' && !isWarehouse) {
          issues.push({
            employee: emp,
            issue: 'Warehouse role assigned to store',
            expected: 'Warehouse',
            actual: site.type
          });
        } else {
          correct.push({ employee: emp, site });
        }
      } else {
        correct.push({ employee: emp, site });
      }
    });

    // 4. Print results
    console.log('\n' + '='.repeat(100));
    console.log('\n✅ CORRECT ASSIGNMENTS:');
    console.log('='.repeat(100));
    
    if (correct.length === 0) {
      console.log('   None found.');
    } else {
      // Group by site
      const bySite = new Map<string, Array<{ employee: Employee; site: Site }>>();
      correct.forEach(item => {
        const siteName = item.site.name;
        if (!bySite.has(siteName)) {
          bySite.set(siteName, []);
        }
        bySite.get(siteName)!.push(item);
      });

      bySite.forEach((employees, siteName) => {
        const site = employees[0].site;
        console.log(`\n📍 ${siteName} (${site.type})`);
        employees.forEach(({ employee }) => {
          console.log(`   ✅ ${employee.name} - ${employee.role}`);
        });
      });
    }

    if (unassigned.length > 0) {
      console.log('\n' + '='.repeat(100));
      console.log('\n⚠️  UNASSIGNED (Admin/Driver roles - OK):');
      console.log('='.repeat(100));
      unassigned.forEach(emp => {
        console.log(`   ⚠️  ${emp.name} - ${emp.role} (${emp.email})`);
      });
    }

    if (issues.length > 0) {
      console.log('\n' + '='.repeat(100));
      console.log('\n❌ ISSUES FOUND:');
      console.log('='.repeat(100));
      issues.forEach(({ employee, issue, expected, actual }) => {
        const site = employee.site_id ? siteMap.get(employee.site_id) : null;
        console.log(`\n❌ ${employee.name} (${employee.role})`);
        console.log(`   Issue: ${issue}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual: ${actual}`);
        if (site) {
          console.log(`   Current Site: ${site.name} (${site.type})`);
        }
        console.log(`   Email: ${employee.email}`);
      });
    }

    // 5. Summary
    console.log('\n' + '='.repeat(100));
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(100));
    console.log(`   Total Employees: ${employees.length}`);
    console.log(`   ✅ Correct Assignments: ${correct.length}`);
    console.log(`   ⚠️  Unassigned (OK): ${unassigned.length}`);
    console.log(`   ❌ Issues Found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Fix the issues listed above.');
      process.exit(1);
    } else {
      console.log('\n✅ All employees are correctly assigned!');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyEmployeeAssignments();

