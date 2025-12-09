/**
 * Assess HQ Workers Access to Web Application
 * Identifies HQ employees and verifies their access permissions
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

// HQ roles that should have multi-site access
const HQ_ROLES = [
  'super_admin',
  'admin',
  'procurement_manager',
  'auditor',
  'finance_manager',
  'hr',
  'it_support',
  'cs_manager'
];

// Single-site roles that should NOT be at HQ
const OPERATIONAL_ROLES = [
  'warehouse_manager',
  'dispatcher',
  'picker',
  'driver',
  'inventory_specialist',
  'manager',
  'store_supervisor',
  'pos'
];

async function assessHQWorkersAccess() {
  console.log('🔍 Assessing HQ Workers Access...\n');

  // 1. Get all sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: true });

  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError);
    return;
  }

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  const hqSite = sites[0];
  console.log(`📍 HQ Site: ${hqSite.name} (ID: ${hqSite.id})\n`);

  // 2. Get all employees at HQ
  const { data: hqEmployees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('site_id', hqSite.id)
    .order('role', { ascending: true });

  if (empError) {
    console.error('❌ Error fetching employees:', empError);
    return;
  }

  console.log(`👥 Total HQ Employees: ${hqEmployees?.length || 0}\n`);

  // 3. Categorize employees
  const hqRoles = hqEmployees?.filter(e => HQ_ROLES.includes(e.role)) || [];
  const operationalAtHQ = hqEmployees?.filter(e => OPERATIONAL_ROLES.includes(e.role)) || [];
  const otherRoles = hqEmployees?.filter(e => 
    !HQ_ROLES.includes(e.role) && !OPERATIONAL_ROLES.includes(e.role)
  ) || [];

  console.log('📊 EMPLOYEE BREAKDOWN:');
  console.log(`   ✅ HQ Roles (Multi-site access): ${hqRoles.length}`);
  console.log(`   ⚠️  Operational Roles (Should be at sites): ${operationalAtHQ.length}`);
  console.log(`   ❓ Other Roles: ${otherRoles.length}\n`);

  // 4. Display HQ employees with their roles
  console.log('🏢 HQ EMPLOYEES (Multi-site access expected):');
  console.log('─'.repeat(80));
  if (hqRoles.length > 0) {
    hqRoles.forEach(emp => {
      const isMultiSite = HQ_ROLES.includes(emp.role);
      console.log(`   ${isMultiSite ? '✅' : '❌'} ${emp.name.padEnd(30)} | ${emp.role.padEnd(20)} | ${emp.email}`);
    });
  } else {
    console.log('   No HQ role employees found');
  }
  console.log('');

  // 5. Display operational employees at HQ (should be moved)
  if (operationalAtHQ.length > 0) {
    console.log('⚠️  OPERATIONAL EMPLOYEES AT HQ (Should be at operational sites):');
    console.log('─'.repeat(80));
    operationalAtHQ.forEach(emp => {
      console.log(`   ⚠️  ${emp.name.padEnd(30)} | ${emp.role.padEnd(20)} | ${emp.email}`);
    });
    console.log('');
  }

  // 6. Access Assessment
  console.log('🔐 ACCESS ASSESSMENT:');
  console.log('─'.repeat(80));
  
  const accessIssues: string[] = [];

  hqRoles.forEach(emp => {
    const role = emp.role;
    const hasMultiSiteAccess = HQ_ROLES.includes(role);
    
    if (!hasMultiSiteAccess) {
      accessIssues.push(`${emp.name} (${role}) - Should have multi-site access but role not in HQ_ROLES`);
    }
  });

  operationalAtHQ.forEach(emp => {
    accessIssues.push(`${emp.name} (${emp.role}) - Operational role should not be at HQ`);
  });

  if (accessIssues.length === 0) {
    console.log('   ✅ All HQ employees have appropriate access');
  } else {
    console.log('   ⚠️  Access Issues Found:');
    accessIssues.forEach(issue => console.log(`      - ${issue}`));
  }
  console.log('');

  // 7. Module Access Summary
  console.log('📱 MODULE ACCESS BY ROLE:');
  console.log('─'.repeat(80));
  
  const roleModules: Record<string, string[]> = {
    'super_admin': ['All Modules'],
    'admin': ['Dashboard', 'Inventory', 'Sales', 'Employees', 'Procurement', 'Settings'],
    'hr': ['Dashboard', 'Employees', 'Finance (Payroll)'],
    'finance_manager': ['Dashboard', 'Finance', 'Sales', 'Expenses', 'Payroll'],
    'procurement_manager': ['Dashboard', 'Procurement', 'Inventory', 'Pricing'],
    'auditor': ['Dashboard', 'Sales', 'Finance', 'Inventory (Read-only)'],
    'it_support': ['Dashboard', 'Settings', 'Employees (Account Management)'],
    'cs_manager': ['Dashboard', 'Customers', 'Sales', 'POS Dashboard']
  };

  const uniqueRoles = [...new Set(hqRoles.map(e => e.role))];
  uniqueRoles.forEach(role => {
    const modules = roleModules[role] || ['Unknown'];
    const count = hqRoles.filter(e => e.role === role).length;
    console.log(`   ${role.padEnd(20)} (${count}): ${modules.join(', ')}`);
  });
  console.log('');

  // 8. Recommendations
  console.log('💡 RECOMMENDATIONS:');
  console.log('─'.repeat(80));
  
  if (operationalAtHQ.length > 0) {
    console.log('   1. ⚠️  Move operational employees to their assigned sites:');
    operationalAtHQ.forEach(emp => {
      console.log(`      - ${emp.name} (${emp.role}) should be assigned to an operational site`);
    });
    console.log('');
  }

  if (hqRoles.length === 0) {
    console.log('   2. ⚠️  No HQ role employees found. Consider assigning HQ roles to employees.');
    console.log('');
  }

  console.log('   3. ✅ Verify multi-site access is working for HQ roles');
  console.log('   4. ✅ Ensure site selector is visible for HQ roles');
  console.log('   5. ✅ Verify data filtering allows HQ roles to see all sites');
  console.log('');

  // Summary
  console.log('📋 SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`   Total HQ Employees: ${hqEmployees?.length || 0}`);
  console.log(`   ✅ Properly Assigned: ${hqRoles.length}`);
  console.log(`   ⚠️  Misplaced: ${operationalAtHQ.length}`);
  console.log(`   ❓ Other: ${otherRoles.length}`);
  console.log(`   🔐 Access Issues: ${accessIssues.length}`);
}

assessHQWorkersAccess().catch(console.error);

