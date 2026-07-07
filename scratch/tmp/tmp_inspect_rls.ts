import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const c = createClient(supabaseUrl, supabaseAnonKey);

async function findStaff() {
    await c.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const { data: employees } = await c.from('employees').select('id, name, email, role, status');
    await c.auth.signOut();

    if (!employees) return;

    // We want roles like cashier, picker, packer, receiver, driver, stock_clerk, sales_associate
    const staffRoles = ['cashier', 'picker', 'packer', 'receiver', 'driver', 'stock_clerk', 'sales_associate', 'pos'];
    const staff = employees.filter(e => e.status === 'Active' && e.email && staffRoles.includes(e.role));

    console.log(`Found ${staff.length} active staff members in the employees table.`);

    const passwords = ['password123', 'Oromo123', '123456'];
    for (const emp of staff) {
        for (const pw of passwords) {
            const { data, error } = await c.auth.signInWithPassword({
                email: emp.email,
                password: pw
            });
            if (!error && data.user) {
                console.log(`🎉 SUCCESS: ${emp.name} (${emp.role}) | Email: ${emp.email} | Password: ${pw}`);
                await c.auth.signOut();
            }
        }
    }
}

findStaff().catch(console.error);
