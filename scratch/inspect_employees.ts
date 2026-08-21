import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'siif-0001@siifmart.com',
        password: 'Oromo123'
    });

    const { data: employees, error: empErr } = await supabase.from('employees').select('id, name, email, code, role, site_id').order('code');
    if (empErr) {
        console.error("Emp err:", empErr);
        return;
    }
    const { data: sites } = await supabase.from('sites').select('id, name');
    const siteMap = new Map((sites || []).map(s => [s.id, s.name]));

    console.log(`Found ${employees?.length} employees:`);
    for (const emp of employees || []) {
        const pass = emp.email === 'siif-0001@siifmart.com' ? 'Oromo123' : 'siif123';
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emp.email,
            password: pass
        });
        const site = siteMap.get(emp.site_id) || '';
        console.log(`${emp.code} | ${emp.name} (${emp.role} @ ${site}) | ${emp.email} | pass: ${pass} => ${error ? 'FAILED: ' + error.message : 'SUCCESS'}`);
    }
}
main();
