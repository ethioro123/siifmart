
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwOTk0NSwiZXhwIjoyMDc5Mzg1OTQ1fQ.toS8r1CEPIhV6gddpKNRgjTY_IDfWEJODNnCxu_78KQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRoles() {
    console.log('Updating roles using service key...');

    // Update Lensa Merga to warehouse_manager
    // Note: This might fail if the constraint is still active and doesn't include 'warehouse_manager'
    // However, we can try to update it. If it fails, we know we MUST change the constraint first.
    // BUT, we can't change the constraint via the JS client easily without raw SQL execution support which might be limited.
    // Let's try to update.

    const { data: user1, error: error1 } = await supabase
        .from('employees')
        .update({ role: 'warehouse_manager' })
        .eq('email', 'lensa.merga@siifmart.com')
        .select();

    if (error1) {
        console.error('Error updating Lensa Merga:', error1);
    } else {
        console.log('Updated Lensa Merga:', user1);
    }

    const { data: user2, error: error2 } = await supabase
        .from('employees')
        .update({ role: 'dispatcher' })
        .eq('email', 'betelhem.bekele@siifmart.com')
        .select();

    if (error2) {
        console.error('Error updating Betelhem Bekele:', error2);
    } else {
        console.log('Updated Betelhem Bekele:', user2);
    }
}

updateRoles();
