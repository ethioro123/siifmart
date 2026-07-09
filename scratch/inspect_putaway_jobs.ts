import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active:", !!authRes.data.session);

    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('type', 'PUTAWAY')
        .eq('status', 'Completed')
        .limit(5);

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    console.log("Completed Putaway Jobs:");
    console.log(JSON.stringify(jobs, null, 2));
}
main();
