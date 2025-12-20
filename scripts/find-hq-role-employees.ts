/**
 * Find all employees with HQ roles and their locations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

async function findHQRoleEmployees() {
  console.log('🔍 Finding HQ Role Employees...\n');

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: true });

  // Get all employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('role', { ascending: true }) as { data: any[] | null, error: any };

  if (!employees) {
    console.error('❌ No employees found');
    return;
  }

  // Find HQ role employees
  const hqRoleEmployees = (employees || []).filter((e: any) => HQ_ROLES.includes(e.role));

  console.log(`👥 Total Employees: ${employees.length}`);
  console.log(`🏢 HQ Role Employees: ${hqRoleEmployees.length}\n`);

  if (hqRoleEmployees.length === 0) {
    console.log('⚠️  No HQ role employees found in database!\n');
    console.log('📋 Expected HQ Roles:');
    HQ_ROLES.forEach(role => {
      const count = (employees || []).filter((e: any) => e.role === role).length;
      console.log(`   - ${role}: ${count} employees`);
    });
    return;
  }

  console.log('🏢 HQ ROLE EMPLOYEES:');
  console.log('─'.repeat(100));

  hqRoleEmployees.forEach((emp: any) => {
    const site = sites?.find(s => s.id === emp.site_id);
    const siteName = site?.name || 'Unknown Site';
    const isAtFirstSite = sites && sites[0] && emp.site_id === sites[0].id;

    console.log(
      `${isAtFirstSite ? '✅' : '⚠️ '} ${emp.name.padEnd(30)} | ` +
      `${emp.role.padEnd(20)} | ` +
      `${siteName.padEnd(30)} | ` +
      `${emp.email}`
    );
  });

  console.log('\n📊 BY SITE:');
  const bySite = hqRoleEmployees.reduce((acc: any, emp: any) => {
    const site = sites?.find(s => s.id === emp.site_id);
    const siteName = (site as any)?.name || 'Unknown';
    if (!acc[siteName]) acc[siteName] = [];
    acc[siteName].push(emp);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(bySite).forEach(([siteName, emps]: [string, any]) => {
    console.log(`\n   ${siteName}: ${(emps as any[]).length} employees`);
    (emps as any[]).forEach((emp: any) => {
      console.log(`      - ${emp.name} (${emp.role})`);
    });
  });

  // Check access
  console.log('\n🔐 ACCESS VERIFICATION:');
  console.log('─'.repeat(100));

  const hqSite = sites?.[0];
  if (hqSite) {
    const atHQ = hqRoleEmployees.filter(e => e.site_id === hqSite.id);
    const notAtHQ = hqRoleEmployees.filter(e => e.site_id !== hqSite.id);

    console.log(`   ✅ At HQ (${hqSite.name}): ${atHQ.length}`);
    console.log(`   ⚠️  Not at HQ: ${notAtHQ.length}`);

    if (notAtHQ.length > 0) {
      console.log('\n   Employees that should be moved to HQ:');
      notAtHQ.forEach(emp => {
        const currentSite = sites?.find(s => s.id === emp.site_id);
        console.log(`      - ${emp.name} (${emp.role}) - Currently at: ${currentSite?.name || 'Unknown'}`);
      });
    }
  }
}

findHQRoleEmployees().catch(console.error);

