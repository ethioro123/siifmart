/**
 * Check managers in database
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

async function checkManagers() {
  const { data: managers, error } = await supabase
    .from('employees')
    .select('name, role, department, site_id')
    .eq('role', 'manager');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Managers found:', managers?.length || 0);
  console.log('\nRetail Managers:');
  managers?.filter(m => m.department === 'Retail Operations').forEach(m => {
    console.log(`  - ${m.name} (${m.department})`);
  });
  
  console.log('\nWarehouse Managers:');
  managers?.filter(m => m.department === 'Logistics & Warehouse').forEach(m => {
    console.log(`  - ${m.name} (${m.department})`);
  });
}

checkManagers();

