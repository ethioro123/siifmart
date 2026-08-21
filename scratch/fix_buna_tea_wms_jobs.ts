import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== FIXING BUNA TEA IN WMS JOBS ===");

    const { data: jobs, error } = await supabase.from('wms_jobs').select('*');
    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    let updatedCount = 0;

    for (const job of jobs || []) {
        const rawLineItems = job.line_items || job.lineItems || [];
        if (!Array.isArray(rawLineItems)) continue;

        let modified = false;
        const updatedLineItems = rawLineItems.map((item: any) => {
            if (item.sku === 'PA-0001' || item.sku === 'PA0001' || item.name === 'Buna Tea') {
                modified = true;
                return {
                    ...item,
                    sku: 'PA0001',
                    name: 'Buna Tea',
                    size: '400',
                    unit: item.unit === 'g' || item.unit === 'pcs' ? 'UNIT' : item.unit || 'UNIT'
                };
            }
            return item;
        });

        if (modified) {
            const { error: updateErr } = await supabase
                .from('wms_jobs')
                .update({ line_items: updatedLineItems })
                .eq('id', job.id);

            if (updateErr) {
                console.error(`Failed to update job ${job.id}:`, updateErr.message);
            } else {
                updatedCount++;
                console.log(`Updated job ${job.job_number || job.id} (${job.type}) line items for Buna Tea.`);
            }
        }
    }

    console.log(`=== FINISHED: Updated ${updatedCount} WMS jobs containing Buna Tea. ===`);
}

main();
