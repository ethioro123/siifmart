import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const jobId = 'dd9ad434-643d-4b79-b2d5-78d448218fc9';

async function resetJob() {
    console.log("Resetting job to In-Progress with 0 picked...");
    const { data: job } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (!job) {
        console.error("Job not found!");
        return;
    }

    const resetLineItems = job.line_items.map((item: any) => ({
        ...item,
        status: 'Pending',
        pickedQty: 0
    }));

    const { data, error } = await supabase
        .from('wms_jobs')
        .update({
            status: 'In-Progress',
            line_items: resetLineItems,
            completed_at: null,
            completed_by: null
        })
        .eq('id', jobId)
        .select();

    if (error) {
        console.error("Error resetting job:", error);
    } else {
        console.log("Job reset successfully!", data);
    }
}

async function forceCompleteJob() {
    console.log("Force completing job with correct quantities...");
    const { data: job } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (!job) {
        console.error("Job not found!");
        return;
    }

    const correctedLineItems = job.line_items.map((item: any) => {
        const expected = item.expectedQty || 0;
        return {
            ...item,
            status: 'Completed',
            pickedQty: expected
        };
    });

    const { data, error } = await supabase
        .from('wms_jobs')
        .update({
            status: 'Completed',
            line_items: correctedLineItems,
            completed_at: new Date().toISOString(),
            completed_by: 'System Fix'
        })
        .eq('id', jobId)
        .select()
        .single();

    if (error) {
        console.error("Error completing job:", error);
        return;
    }

    console.log("Job completed successfully in DB!");

    // Also chain to PACK job creation
    const packItems = correctedLineItems.map((item: any) => ({
        ...item,
        orderedQty: item.orderedQty || item.expectedQty,
        expectedQty: item.pickedQty,
        pickedQty: 0,
        status: 'Pending'
    }));

    const packJob = {
        site_id: data.site_id,
        type: 'PACK',
        priority: data.priority,
        status: 'Pending',
        items_count: packItems.length,
        line_items: packItems,
        location: 'Packing Station 1',
        order_ref: data.order_ref,
        source_site_id: data.source_site_id,
        dest_site_id: data.dest_site_id,
        job_number: data.job_number
    };

    const { data: createdPack, error: packError } = await supabase
        .from('wms_jobs')
        .insert(packJob)
        .select();

    if (packError) {
        console.error("Error creating PACK job:", packError);
    } else {
        console.log("PACK job created successfully!", createdPack);
    }
}

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active:", !!authRes.data.session);

    const action = process.argv[2];
    if (action === 'reset') {
        await resetJob();
    } else if (action === 'complete') {
        await forceCompleteJob();
    } else {
        console.log("Please specify action: 'reset' or 'complete'");
    }
}

main();
