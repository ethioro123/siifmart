/**
 * Deep Warehouse Workers Access Assessment
 * Comprehensive analysis of access controls, permissions, and restrictions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const WAREHOUSE_ROLES = [
  'warehouse_manager',
  'dispatcher',
  'picker',
  'driver',
  'inventory_specialist'
];

interface AssessmentResult {
  employee: any;
  site: any;
  role: string;
  issues: string[];
  warnings: string[];
  accessDetails: {
    modules: string[];
    permissions: string[];
    siteAccess: string;
    dataAccess: string[];
    restrictions: string[];
  };
}

async function deepAssessment() {
  console.log('🔍 DEEP WAREHOUSE WORKERS ACCESS ASSESSMENT');
  console.log('═'.repeat(120));
  console.log('');

  // 1. DATABASE STATE ANALYSIS
  console.log('📊 STEP 1: DATABASE STATE ANALYSIS');
  console.log('─'.repeat(120));
  
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .in('role', WAREHOUSE_ROLES)
    .order('role', { ascending: true });

  const warehouseSites = sites?.filter(s => 
    s.type === 'Warehouse' || 
    s.type === 'Distribution Center' || 
    s.type === 'Storage Facility'
  ) || [];

  console.log(`   ✅ Total Sites: ${sites?.length || 0}`);
  console.log(`   ✅ Warehouse Sites: ${warehouseSites.length}`);
  console.log(`   ✅ Total Warehouse Workers: ${employees?.length || 0}`);
  console.log('');

  // 2. CODE-LEVEL ACCESS CONTROL VERIFICATION
  console.log('🔐 STEP 2: CODE-LEVEL ACCESS CONTROL VERIFICATION');
  console.log('─'.repeat(120));

  const codeChecks = await verifyCodeLevelAccess();
  codeChecks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`   ${status} ${check.name}`);
    if (!check.passed && check.details) {
      console.log(`      ${check.details}`);
    }
  });
  console.log('');

  // 3. PER-EMPLOYEE DEEP ANALYSIS
  console.log('👤 STEP 3: PER-EMPLOYEE DEEP ANALYSIS');
  console.log('─'.repeat(120));
  console.log('');

  const assessments: AssessmentResult[] = [];

  if (employees) {
    for (const emp of employees) {
      const assessment = await assessEmployee(emp, sites, warehouseSites);
      assessments.push(assessment);

      console.log(`   ${'─'.repeat(100)}`);
      console.log(`   👤 ${emp.name.toUpperCase()} (${emp.role})`);
      console.log(`   ${'─'.repeat(100)}`);
      console.log(`      📧 Email: ${emp.email}`);
      console.log(`      📍 Site: ${assessment.site?.name || 'Unknown'} (${assessment.site?.type || 'Unknown'})`);
      console.log(`      🏢 Department: ${emp.department || 'N/A'}`);
      console.log(`      📊 Status: ${emp.status || 'Active'}`);
      console.log('');

      // Access Details
      console.log(`      ✅ MODULE ACCESS (${assessment.accessDetails.modules.length}):`);
      assessment.accessDetails.modules.forEach(m => console.log(`         • ${m}`));
      console.log('');

      console.log(`      🔐 PERMISSIONS (${assessment.accessDetails.permissions.length}):`);
      assessment.accessDetails.permissions.forEach(p => console.log(`         • ${p}`));
      console.log('');

      console.log(`      📍 SITE ACCESS:`);
      console.log(`         • ${assessment.accessDetails.siteAccess}`);
      console.log('');

      console.log(`      👁️  DATA ACCESS:`);
      assessment.accessDetails.dataAccess.forEach(d => console.log(`         • ${d}`));
      console.log('');

      console.log(`      🚫 RESTRICTIONS:`);
      assessment.accessDetails.restrictions.forEach(r => console.log(`         • ${r}`));
      console.log('');

      // Issues
      if (assessment.issues.length > 0) {
        console.log(`      ❌ ISSUES (${assessment.issues.length}):`);
        assessment.issues.forEach(issue => console.log(`         • ${issue}`));
        console.log('');
      }

      // Warnings
      if (assessment.warnings.length > 0) {
        console.log(`      ⚠️  WARNINGS (${assessment.warnings.length}):`);
        assessment.warnings.forEach(warning => console.log(`         • ${warning}`));
        console.log('');
      }

      if (assessment.issues.length === 0 && assessment.warnings.length === 0) {
        console.log(`      ✅ No issues found`);
        console.log('');
      }
    }
  }

  // 4. SITE-BASED FILTERING VERIFICATION
  console.log('🔒 STEP 4: SITE-BASED FILTERING VERIFICATION');
  console.log('─'.repeat(120));
  
  const filteringChecks = verifySiteFiltering(employees || [], warehouseSites);
  filteringChecks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`   ${status} ${check.name}`);
    if (!check.passed && check.details) {
      console.log(`      ${check.details}`);
    }
  });
  console.log('');

  // 5. PERMISSION ENFORCEMENT VERIFICATION
  console.log('🛡️  STEP 5: PERMISSION ENFORCEMENT VERIFICATION');
  console.log('─'.repeat(120));
  
  const permissionChecks = verifyPermissionEnforcement();
  permissionChecks.forEach(check => {
    const status = check.passed ? '✅' : '⚠️ ';
    console.log(`   ${status} ${check.name}`);
    if (check.details) {
      console.log(`      ${check.details}`);
    }
  });
  console.log('');

  // 6. SUMMARY
  console.log('═'.repeat(120));
  console.log('📋 ASSESSMENT SUMMARY');
  console.log('═'.repeat(120));
  console.log('');

  const totalIssues = assessments.reduce((sum, a) => sum + a.issues.length, 0);
  const totalWarnings = assessments.reduce((sum, a) => sum + a.warnings.length, 0);
  const codeIssues = codeChecks.filter(c => !c.passed).length;
  const filteringIssues = filteringChecks.filter(c => !c.passed).length;

  console.log(`   Total Employees Assessed: ${assessments.length}`);
  console.log(`   Total Issues Found: ${totalIssues}`);
  console.log(`   Total Warnings: ${totalWarnings}`);
  console.log(`   Code-Level Issues: ${codeIssues}`);
  console.log(`   Filtering Issues: ${filteringIssues}`);
  console.log('');

  // Critical Issues
  const criticalIssues = assessments.filter(a => a.issues.length > 0);
  if (criticalIssues.length > 0) {
    console.log('   ❌ CRITICAL ISSUES:');
    criticalIssues.forEach(a => {
      console.log(`      • ${a.employee.name} (${a.role}):`);
      a.issues.forEach(issue => console.log(`        - ${issue}`));
    });
    console.log('');
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  console.log('─'.repeat(120));
  
  if (totalIssues > 0) {
    console.log('   1. Fix critical issues identified above');
  }
  
  if (codeIssues > 0) {
    console.log('   2. Review and fix code-level access control issues');
  }
  
  if (filteringIssues > 0) {
    console.log('   3. Verify site-based filtering is working correctly');
  }

  const hasRouteProtection = permissionChecks.find(c => c.name.includes('Route-level'))?.passed;
  if (!hasRouteProtection) {
    console.log('   4. ⚠️  Enable route-level permission checks in ProtectedRoute component');
  }

  console.log('   5. Test access controls with actual user logins');
  console.log('   6. Verify data filtering in WarehouseOperations.tsx');
  console.log('   7. Ensure filterBySite is used consistently');
  console.log('');
}

async function assessEmployee(emp: any, sites: any[], warehouseSites: any[]): Promise<AssessmentResult> {
  const site = sites?.find(s => s.id === emp.site_id);
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check if at warehouse site
  const isAtWarehouse = warehouseSites.some(ws => ws.id === emp.site_id);
  if (!isAtWarehouse && site) {
    issues.push(`Assigned to ${site.name} (${site.type}) - Should be at a warehouse`);
  }

  // Check if site_id is valid
  if (!site) {
    issues.push(`Invalid site_id: ${emp.site_id}`);
  }

  // Check role validity
  if (!WAREHOUSE_ROLES.includes(emp.role)) {
    issues.push(`Invalid warehouse role: ${emp.role}`);
  }

  // Get access details
  const accessDetails = getAccessDetails(emp.role, isAtWarehouse);

  // Verify site access
  if (emp.role === 'picker' && !isAtWarehouse) {
    issues.push('Picker must be at a warehouse site for proper access control');
  }

  return {
    employee: emp,
    site,
    role: emp.role,
    issues,
    warnings,
    accessDetails
  };
}

function getAccessDetails(role: string, isAtWarehouse: boolean) {
  const baseModules: Record<string, string[]> = {
    'warehouse_manager': ['Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Procurement', 'Employees', 'Roadmap'],
    'dispatcher': ['Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Procurement', 'Employees', 'Roadmap'],
    'picker': ['Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Roadmap'],
    'driver': ['Dashboard', 'Network View', 'Fulfillment', 'Roadmap'],
    'inventory_specialist': ['Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Roadmap']
  };

  const basePermissions: Record<string, string[]> = {
    'warehouse_manager': [
      'ACCESS_WAREHOUSE', 'MANAGE_WAREHOUSE', 'ASSIGN_TASKS', 'COMPLETE_TASKS',
      'VIEW_ALL_TASKS', 'ACCESS_INVENTORY', 'ADJUST_STOCK', 'TRANSFER_STOCK',
      'ACCESS_PROCUREMENT', 'CREATE_PO', 'RECEIVE_PO', 'ACCESS_EMPLOYEES'
    ],
    'dispatcher': [
      'ACCESS_WAREHOUSE', 'ASSIGN_TASKS', 'COMPLETE_TASKS', 'VIEW_ALL_TASKS',
      'ACCESS_INVENTORY', 'ADJUST_STOCK', 'TRANSFER_STOCK', 'ACCESS_PROCUREMENT',
      'RECEIVE_PO', 'ACCESS_EMPLOYEES'
    ],
    'picker': [
      'ACCESS_WAREHOUSE', 'COMPLETE_TASKS', 'ACCESS_INVENTORY (Read-only)',
      'VIEW_ALL_TASKS (Assigned only)'
    ],
    'driver': [
      'ACCESS_WAREHOUSE', 'COMPLETE_TASKS (Delivery only)',
      'VIEW_ALL_TASKS (Assigned delivery tasks)'
    ],
    'inventory_specialist': [
      'ACCESS_WAREHOUSE', 'MANAGE_WAREHOUSE', 'ACCESS_INVENTORY',
      'ADJUST_STOCK', 'TRANSFER_STOCK', 'COMPLETE_TASKS'
    ]
  };

  const siteAccess: Record<string, string> = {
    'warehouse_manager': 'Single site - Can only see their assigned warehouse',
    'dispatcher': 'Single site - Can only see their assigned warehouse',
    'picker': 'Single site - STRICTLY filtered to assigned warehouse only',
    'driver': 'Single site - Can only see their assigned warehouse',
    'inventory_specialist': 'Single site - Can only see their assigned warehouse'
  };

  const dataAccess: Record<string, string[]> = {
    'warehouse_manager': [
      'All jobs at their warehouse (PICK, PACK, PUTAWAY)',
      'All warehouse inventory',
      'All warehouse employees',
      'Purchase orders for their warehouse',
      'Stock movements at their warehouse'
    ],
    'dispatcher': [
      'All pending jobs at their warehouse',
      'All active assignments',
      'All warehouse employees',
      'Warehouse inventory',
      'Job priorities and statuses'
    ],
    'picker': [
      'ONLY assigned PICK jobs (site-filtered)',
      'ONLY assigned PACK jobs (site-filtered)',
      'Products at their warehouse (filtered)',
      'Job details for assigned jobs only',
      'CANNOT see jobs from other warehouses'
    ],
    'driver': [
      'ONLY assigned delivery tasks',
      'Delivery routes and schedules',
      'CANNOT see picking/packing jobs',
      'CANNOT see jobs from other warehouses'
    ],
    'inventory_specialist': [
      'All inventory at their warehouse',
      'Stock levels and locations',
      'Stock movements',
      'Transfer requests',
      'Inventory reports'
    ]
  };

  const restrictions: Record<string, string[]> = {
    'warehouse_manager': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot manage employees outside warehouse'
    ],
    'dispatcher': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot modify inventory directly'
    ],
    'picker': [
      'Can ONLY see assigned jobs (site-filtered)',
      'CANNOT see jobs from other warehouses',
      'CANNOT assign jobs to others',
      'CANNOT adjust stock directly',
      'Read-only inventory access'
    ],
    'driver': [
      'Can ONLY see assigned delivery tasks',
      'CANNOT see picking/packing jobs',
      'CANNOT see jobs from other warehouses',
      'Limited to delivery operations only'
    ],
    'inventory_specialist': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot manage employees'
    ]
  };

  return {
    modules: baseModules[role] || [],
    permissions: basePermissions[role] || [],
    siteAccess: siteAccess[role] || 'Unknown',
    dataAccess: dataAccess[role] || [],
    restrictions: restrictions[role] || []
  };
}

async function verifyCodeLevelAccess(): Promise<Array<{ name: string; passed: boolean; details?: string }>> {
  const checks: Array<{ name: string; passed: boolean; details?: string }> = [];

  // Check if WarehouseOperations.tsx uses filteredJobs
  const warehouseOpsPath = join(process.cwd(), 'pages/WarehouseOperations.tsx');
  if (existsSync(warehouseOpsPath)) {
    const content = readFileSync(warehouseOpsPath, 'utf-8');
    const usesFilteredJobs = content.includes('filteredJobs');
    const usesFilterBySite = content.includes('filterBySite');
    const hasDirectJobsAccess = content.match(/jobs\.filter|jobs\.map|jobs\.find/g)?.length || 0;
    
    checks.push({
      name: 'WarehouseOperations uses filteredJobs',
      passed: usesFilteredJobs,
      details: usesFilteredJobs ? 'filteredJobs is used' : 'Direct jobs access detected - may bypass site filtering'
    });

    checks.push({
      name: 'WarehouseOperations uses filterBySite',
      passed: usesFilterBySite,
      details: usesFilterBySite ? 'filterBySite imported and used' : 'filterBySite not found'
    });

    if (hasDirectJobsAccess > 0 && !usesFilteredJobs) {
      checks.push({
        name: 'Direct jobs access detected',
        passed: false,
        details: `Found ${hasDirectJobsAccess} instances of direct jobs access - should use filteredJobs`
      });
    }
  } else {
    checks.push({
      name: 'WarehouseOperations.tsx exists',
      passed: false,
      details: 'File not found'
    });
  }

  // Check locationAccess.ts
  const locationAccessPath = join(process.cwd(), 'utils/locationAccess.ts');
  if (existsSync(locationAccessPath)) {
    const content = readFileSync(locationAccessPath, 'utf-8');
    const hasFilterBySite = content.includes('filterBySite');
    const hasSingleSiteRoles = content.includes('SINGLE_SITE_ROLES');
    
    checks.push({
      name: 'locationAccess.ts has filterBySite function',
      passed: hasFilterBySite,
      details: hasFilterBySite ? 'filterBySite function exists' : 'filterBySite function not found'
    });

    checks.push({
      name: 'locationAccess.ts defines SINGLE_SITE_ROLES',
      passed: hasSingleSiteRoles,
      details: hasSingleSiteRoles ? 'SINGLE_SITE_ROLES defined' : 'SINGLE_SITE_ROLES not found'
    });
  }

  // Check permissions.ts
  const permissionsPath = join(process.cwd(), 'utils/permissions.ts');
  if (existsSync(permissionsPath)) {
    const content = readFileSync(permissionsPath, 'utf-8');
    const hasWarehousePermissions = content.includes('ACCESS_WAREHOUSE');
    const hasPickerPermissions = content.includes('picker');
    
    checks.push({
      name: 'permissions.ts defines warehouse permissions',
      passed: hasWarehousePermissions,
      details: hasWarehousePermissions ? 'Warehouse permissions defined' : 'Warehouse permissions not found'
    });
  }

  return checks;
}

function verifySiteFiltering(employees: any[], warehouseSites: any[]): Array<{ name: string; passed: boolean; details?: string }> {
  const checks: Array<{ name: string; passed: boolean; details?: string }> = [];

  // Check if all pickers are at warehouse sites
  const pickers = employees.filter(e => e.role === 'picker');
  const pickersAtWarehouses = pickers.filter(p => 
    warehouseSites.some(ws => ws.id === p.site_id)
  );

  checks.push({
    name: 'All pickers assigned to warehouse sites',
    passed: pickers.length === pickersAtWarehouses.length,
    details: pickers.length === pickersAtWarehouses.length 
      ? `All ${pickers.length} pickers at warehouse sites`
      : `${pickers.length - pickersAtWarehouses.length} picker(s) not at warehouse sites`
  });

  // Check site distribution
  const bySite: Record<string, number> = {};
  employees.forEach(emp => {
    const siteId = emp.site_id;
    bySite[siteId] = (bySite[siteId] || 0) + 1;
  });

  const sitesWithWorkers = Object.keys(bySite).length;
  checks.push({
    name: 'Workers distributed across sites',
    passed: sitesWithWorkers > 0,
    details: `Workers at ${sitesWithWorkers} site(s)`
  });

  // Check for orphaned employees (no valid site)
  const orphaned = employees.filter(e => !warehouseSites.some(ws => ws.id === e.site_id) && 
    !['Store', 'Dark Store'].includes(warehouseSites.find(s => s.id === e.site_id)?.type || ''));
  
  checks.push({
    name: 'No orphaned warehouse workers',
    passed: orphaned.length === 0,
    details: orphaned.length === 0 
      ? 'All workers have valid site assignments'
      : `${orphaned.length} worker(s) at invalid sites`
  });

  return checks;
}

function verifyPermissionEnforcement(): Array<{ name: string; passed: boolean; details?: string }> {
  const checks: Array<{ name: string; passed: boolean; details?: string }> = [];

  // Check ProtectedRoute
  const protectedRoutePath = join(process.cwd(), 'components/ProtectedRoute.tsx');
  if (existsSync(protectedRoutePath)) {
    const content = readFileSync(protectedRoutePath, 'utf-8');
    const bypassesChecks = content.includes('temporarily bypassing') || 
                          content.includes('skip all role-based');
    
    checks.push({
      name: 'Route-level permission checks enabled',
      passed: !bypassesChecks,
      details: bypassesChecks 
        ? '⚠️  ProtectedRoute is bypassing permission checks - only checking authentication'
        : 'Route-level permission checks are active'
    });
  }

  // Check Sidebar filtering
  const sidebarPath = join(process.cwd(), 'components/Sidebar.tsx');
  if (existsSync(sidebarPath)) {
    const content = readFileSync(sidebarPath, 'utf-8');
    const hasRoleFiltering = content.includes('getNavItems') && content.includes('roles.includes');
    
    checks.push({
      name: 'Sidebar filters modules by role',
      passed: hasRoleFiltering,
      details: hasRoleFiltering 
        ? 'Sidebar filters modules based on user role'
        : 'Sidebar may not filter modules by role'
    });
  }

  return checks;
}

deepAssessment().catch(console.error);

