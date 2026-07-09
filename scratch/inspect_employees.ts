import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    // Sign in as admin/staff
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active:", !!authRes.data.session);

    const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, email, code, site_id');

    if (error) {
        console.error("Error fetching employees:", error);
        return;
    }

    console.log("Employees records in database:");
    console.log(JSON.stringify(employees, null, 2));
}
main();
