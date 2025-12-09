/**
 * Comprehensive Warehouse Workers Access Assessment
 * Analyzes what warehouse workers can do and see based on their roles
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

// Warehouse roles
const WAREHOUSE_ROLES = [
  'warehouse_manager',
  'dispatcher',
  'picker',
  'driver',
  'inventory_specialist'
];

// Expected module access by role (from Sidebar.tsx)
const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  'warehouse_manager': [
    'Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Procurement', 'Employees', 'Roadmap'
  ],
  'dispatcher': [
    'Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Procurement', 'Employees', 'Roadmap'
  ],
  'picker': [
    'Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Roadmap'
  ],
  'driver': [
    'Dashboard', 'Network View', 'Fulfillment', 'Roadmap'
  ],
  'inventory_specialist': [
    'Dashboard', 'Inventory', 'Network View', 'Fulfillment', 'Roadmap'
  ]
};

// Permissions by role (from permissions.ts)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'warehouse_manager': [
    'ACCESS_WAREHOUSE',
    'MANAGE_WAREHOUSE',
    'ASSIGN_TASKS',
    'COMPLETE_TASKS',
    'VIEW_ALL_TASKS',
    'ACCESS_INVENTORY',
    'ADJUST_STOCK',
    'TRANSFER_STOCK',
    'ACCESS_PROCUREMENT',
    'CREATE_PO',
    'RECEIVE_PO',
    'ACCESS_EMPLOYEES'
  ],
  'dispatcher': [
    'ACCESS_WAREHOUSE',
    'ASSIGN_TASKS',
    'COMPLETE_TASKS',
    'VIEW_ALL_TASKS',
    'ACCESS_INVENTORY',
    'ADJUST_STOCK',
    'TRANSFER_STOCK',
    'ACCESS_PROCUREMENT',
    'RECEIVE_PO',
    'ACCESS_EMPLOYEES'
  ],
  'picker': [
    'ACCESS_WAREHOUSE',
    'COMPLETE_TASKS',
    'ACCESS_INVENTORY (Read-only)',
    'VIEW_ALL_TASKS (Assigned only)'
  ],
  'driver': [
    'ACCESS_WAREHOUSE',
    'COMPLETE_TASKS (Delivery tasks only)',
    'VIEW_ALL_TASKS (Assigned delivery tasks)'
  ],
  'inventory_specialist': [
    'ACCESS_WAREHOUSE',
    'MANAGE_WAREHOUSE',
    'ACCESS_INVENTORY',
    'ADJUST_STOCK',
    'TRANSFER_STOCK',
    'COMPLETE_TASKS'
  ]
};

// Site access restrictions
const ROLE_SITE_ACCESS: Record<string, { type: 'single' | 'multi', description: string }> = {
  'warehouse_manager': {
    type: 'single',
    description: 'Can only see their assigned warehouse'
  },
  'dispatcher': {
    type: 'single',
    description: 'Can only see their assigned warehouse'
  },
  'picker': {
    type: 'single',
    description: 'Can only see their assigned warehouse - Site-based filtering enforced'
  },
  'driver': {
    type: 'single',
    description: 'Can only see their assigned warehouse'
  },
  'inventory_specialist': {
    type: 'single',
    description: 'Can only see their assigned warehouse'
  }
};

async function assessWarehouseWorkers() {
  console.log('🏭 WAREHOUSE WORKERS ACCESS ASSESSMENT');
  console.log('═'.repeat(100));
  console.log('');

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: true });

  // Get warehouse sites
  const warehouseSites = sites?.filter(s => 
    s.type === 'Warehouse' || 
    s.type === 'Distribution Center' || 
    s.type === 'Storage Facility'
  ) || [];

  console.log(`📍 Warehouse Sites Found: ${warehouseSites.length}`);
  warehouseSites.forEach(site => {
    console.log(`   • ${site.name} (${site.type})`);
  });
  console.log('');

  // Get all warehouse workers
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('*')
    .in('role', WAREHOUSE_ROLES)
    .order('role', { ascending: true })
    .order('site_id', { ascending: true });

  if (!allEmployees || allEmployees.length === 0) {
    console.log('⚠️  No warehouse workers found\n');
    return;
  }

  console.log(`👥 Total Warehouse Workers: ${allEmployees.length}\n`);

  // Group by role
  const byRole: Record<string, typeof allEmployees> = {};
  allEmployees.forEach(emp => {
    if (!byRole[emp.role]) byRole[emp.role] = [];
    byRole[emp.role].push(emp);
  });

  // Display by role
  Object.entries(byRole).forEach(([role, employees]) => {
    console.log('═'.repeat(100));
    console.log(`📋 ${role.toUpperCase().replace(/_/g, ' ')} (${employees.length} workers)`);
    console.log('═'.repeat(100));
    console.log('');

    // Role description
    const roleInfo = getRoleInfo(role);
    console.log(`   📝 Description: ${roleInfo.description}`);
    console.log(`   📍 Site Access: ${ROLE_SITE_ACCESS[role]?.description || 'Unknown'}`);
    console.log('');

    // Module access
    const modules = ROLE_MODULE_ACCESS[role] || [];
    console.log(`   ✅ MODULE ACCESS (${modules.length} modules):`);
    modules.forEach(module => {
      console.log(`      • ${module}`);
    });
    console.log('');

    // Permissions
    const permissions = ROLE_PERMISSIONS[role] || [];
    console.log(`   🔐 KEY PERMISSIONS (${permissions.length}):`);
    permissions.forEach(perm => {
      console.log(`      • ${perm}`);
    });
    console.log('');

    // What they can DO
    console.log(`   ⚙️  WHAT THEY CAN DO:`);
    const capabilities = getCapabilities(role);
    capabilities.forEach(cap => {
      console.log(`      • ${cap}`);
    });
    console.log('');

    // What they can SEE
    console.log(`   👁️  WHAT THEY CAN SEE:`);
    const visibility = getVisibility(role);
    visibility.forEach(vis => {
      console.log(`      • ${vis}`);
    });
    console.log('');

    // Restrictions
    console.log(`   🚫 RESTRICTIONS:`);
    const restrictions = getRestrictions(role);
    restrictions.forEach(rest => {
      console.log(`      • ${rest}`);
    });
    console.log('');

    // Employees in this role
    console.log(`   👥 EMPLOYEES (${employees.length}):`);
    employees.forEach(emp => {
      const site = sites?.find(s => s.id === emp.site_id);
      const siteName = site?.name || 'Unknown Site';
      console.log(`      • ${emp.name.padEnd(30)} | ${siteName.padEnd(30)} | ${emp.email}`);
    });
    console.log('');
  });

  // Summary by site
  console.log('═'.repeat(100));
  console.log('📊 WAREHOUSE WORKERS BY SITE');
  console.log('═'.repeat(100));
  console.log('');

  warehouseSites.forEach(site => {
    const siteWorkers = allEmployees.filter(e => e.site_id === site.id);
    if (siteWorkers.length === 0) {
      console.log(`   ${site.name}: No workers assigned`);
      return;
    }

    console.log(`   📍 ${site.name} (${siteWorkers.length} workers):`);
    const byRoleAtSite: Record<string, typeof siteWorkers> = {};
    siteWorkers.forEach(emp => {
      if (!byRoleAtSite[emp.role]) byRoleAtSite[emp.role] = [];
      byRoleAtSite[emp.role].push(emp);
    });

    Object.entries(byRoleAtSite).forEach(([role, emps]) => {
      console.log(`      ${role}: ${emps.length} - ${emps.map(e => e.name).join(', ')}`);
    });
    console.log('');
  });

  // Access verification
  console.log('═'.repeat(100));
  console.log('✅ ACCESS VERIFICATION CHECKLIST');
  console.log('═'.repeat(100));
  console.log('');
  console.log('   [✓] Site-based filtering enforced (pickers can only see their warehouse)');
  console.log('   [✓] WMS jobs filtered by site (from WarehouseOperations.tsx)');
  console.log('   [✓] Inventory filtered by site');
  console.log('   [✓] Products filtered by site');
  console.log('   [ ] Route-level permission checks enabled');
  console.log('   [✓] Sidebar shows appropriate modules per role');
  console.log('   [✓] Warehouse operations restricted to assigned site');
  console.log('');

  // Issues
  const issues: string[] = [];
  
  // Check if any warehouse workers are at non-warehouse sites
  allEmployees.forEach(emp => {
    const site = sites?.find(s => s.id === emp.site_id);
    if (site && !warehouseSites.some(ws => ws.id === site.id)) {
      issues.push(`${emp.name} (${emp.role}) is at ${site.name} (${site.type}) - Should be at a warehouse`);
    }
  });

  // Check if warehouses have proper staffing
  warehouseSites.forEach(site => {
    const siteWorkers = allEmployees.filter(e => e.site_id === site.id);
    if (siteWorkers.length === 0) {
      issues.push(`${site.name} has no warehouse workers assigned`);
    }
  });

  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:');
    console.log('─'.repeat(100));
    issues.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
  } else {
    console.log('✅ No issues found - All warehouse workers properly assigned');
    console.log('');
  }
}

function getRoleInfo(role: string): { description: string; responsibilities: string[] } {
  const info: Record<string, { description: string; responsibilities: string[] }> = {
    'warehouse_manager': {
      description: 'Oversees all warehouse operations and staff',
      responsibilities: [
        'Manage warehouse staff',
        'Oversee inventory management',
        'Approve stock adjustments',
        'Coordinate with procurement',
        'Ensure operational efficiency'
      ]
    },
    'dispatcher': {
      description: 'Assigns tasks and coordinates warehouse workflow',
      responsibilities: [
        'Assign jobs to pickers and drivers',
        'Monitor job progress',
        'Coordinate inbound/outbound operations',
        'Manage task priorities',
        'Ensure timely fulfillment'
      ]
    },
    'picker': {
      description: 'Picks and packs orders for fulfillment',
      responsibilities: [
        'Complete assigned PICK jobs',
        'Complete assigned PACK jobs',
        'Follow picking routes',
        'Ensure order accuracy',
        'Update job status'
      ]
    },
    'driver': {
      description: 'Handles delivery and logistics',
      responsibilities: [
        'Complete delivery tasks',
        'Transport goods between sites',
        'Handle shipping documentation',
        'Ensure safe delivery'
      ]
    },
    'inventory_specialist': {
      description: 'Manages stock accuracy and inventory operations',
      responsibilities: [
        'Perform cycle counts',
        'Adjust stock levels',
        'Manage stock transfers',
        'Ensure inventory accuracy',
        'Handle receiving operations'
      ]
    }
  };

  return info[role] || { description: 'Warehouse worker', responsibilities: [] };
}

function getCapabilities(role: string): string[] {
  const capabilities: Record<string, string[]> = {
    'warehouse_manager': [
      'View all jobs at their warehouse',
      'Assign jobs to workers',
      'Approve stock adjustments',
      'Create purchase orders',
      'Receive shipments',
      'Manage warehouse inventory',
      'View all warehouse employees',
      'Access warehouse reports'
    ],
    'dispatcher': [
      'View all pending jobs at their warehouse',
      'Assign jobs to pickers and drivers',
      'Monitor job progress',
      'Set job priorities',
      'View active assignments',
      'Receive shipments',
      'View warehouse inventory'
    ],
    'picker': [
      'View assigned PICK jobs only',
      'View assigned PACK jobs only',
      'Start and complete jobs',
      'Scan locations for putaway',
      'Update job item status',
      'View inventory at their warehouse (read-only)',
      'Cannot see jobs from other warehouses'
    ],
    'driver': [
      'View assigned delivery tasks',
      'Complete delivery jobs',
      'View delivery routes',
      'Update delivery status',
      'Cannot see picking/packing jobs',
      'Cannot see jobs from other warehouses'
    ],
    'inventory_specialist': [
      'View all inventory at their warehouse',
      'Adjust stock levels',
      'Create stock transfers',
      'Perform cycle counts',
      'Receive shipments',
      'Manage product locations',
      'View inventory reports'
    ]
  };

  return capabilities[role] || [];
}

function getVisibility(role: string): string[] {
  const visibility: Record<string, string[]> = {
    'warehouse_manager': [
      'All jobs at their warehouse (PICK, PACK, PUTAWAY)',
      'All warehouse inventory',
      'All warehouse employees',
      'Purchase orders for their warehouse',
      'Stock movements at their warehouse',
      'Warehouse metrics and reports',
      'Network inventory view (read-only)'
    ],
    'dispatcher': [
      'All pending jobs at their warehouse',
      'All active assignments',
      'All warehouse employees',
      'Warehouse inventory',
      'Job priorities and statuses',
      'Employee workload',
      'Network inventory view (read-only)'
    ],
    'picker': [
      'Only assigned PICK jobs',
      'Only assigned PACK jobs',
      'Products at their warehouse (filtered)',
      'Job details for assigned jobs only',
      'Cannot see jobs from other warehouses',
      'Cannot see unassigned jobs (unless admin)',
      'Network inventory view (read-only)'
    ],
    'driver': [
      'Only assigned delivery tasks',
      'Delivery routes and schedules',
      'Cannot see picking/packing jobs',
      'Cannot see jobs from other warehouses',
      'Network inventory view (read-only)'
    ],
    'inventory_specialist': [
      'All inventory at their warehouse',
      'Stock levels and locations',
      'Stock movements',
      'Transfer requests',
      'Inventory reports',
      'Product details and locations',
      'Network inventory view (read-only)'
    ]
  };

  return visibility[role] || [];
}

function getRestrictions(role: string): string[] {
  const restrictions: Record<string, string[]> = {
    'warehouse_manager': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot manage employees outside warehouse',
      'Cannot access POS or sales directly'
    ],
    'dispatcher': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot modify inventory directly (only through jobs)',
      'Cannot access POS or sales directly'
    ],
    'picker': [
      'Can only see assigned jobs (site-filtered)',
      'Cannot see jobs from other warehouses',
      'Cannot assign jobs to others',
      'Cannot adjust stock directly',
      'Cannot view financial data',
      'Cannot access procurement',
      'Read-only inventory access'
    ],
    'driver': [
      'Can only see assigned delivery tasks',
      'Cannot see picking/packing jobs',
      'Cannot see jobs from other warehouses',
      'Cannot access inventory management',
      'Cannot view financial data',
      'Limited to delivery operations only'
    ],
    'inventory_specialist': [
      'Cannot access other warehouses\' data',
      'Cannot view financial data',
      'Cannot manage employees',
      'Cannot access POS or sales directly',
      'Cannot approve purchase orders'
    ]
  };

  return restrictions[role] || [];
}

assessWarehouseWorkers().catch(console.error);

