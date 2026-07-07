import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  console.log('Error:', error);
  if (data?.length) console.log('Columns:', Object.keys(data[0]));
}
run();
