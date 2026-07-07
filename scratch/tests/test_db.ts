import { config } from 'dotenv';
config({ path: '.env' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: employees } = await supabase.from('employees').select('id, name, role, status');
  console.log('Total Employees:', employees?.length);
  const activeStaff = employees?.filter(e => 
    ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) && 
    e.status === 'Active'
  );
  console.log('Active Staff matching roles:', activeStaff?.length);
  if (activeStaff?.length) {
    console.log('Sample staff:', activeStaff[0]);
  }
}
check();
