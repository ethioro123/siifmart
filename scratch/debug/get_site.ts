
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function getIds() {
    const { data: site } = await supabase.from('sites').select('id').limit(1).single();
    const { data: supplier } = await supabase.from('suppliers').select('id').limit(1).single();

    console.log('Site ID:', site?.id);
    console.log('Supplier ID:', supplier?.id);
}
getIds();
