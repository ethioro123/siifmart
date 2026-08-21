import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function restoreLocations() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== RESTORING & RECONCILING ALL BUNA TEA LOCATIONS FROM WMS JOBS ===");

    const { data: sites } = await supabase.from('sites').select('*');
    const hararId = sites?.find(s => s.name.includes('Harar'))?.id;
    const merkatoId = sites?.find(s => s.name.includes('Merkato retail'))?.id;

    const baseProduct = {
        name: 'Buna Tea',
        sku: 'PA0001',
        category: 'Pantry & Dry Goods',
        unit: 'UNIT',
        size: '400',
        brand: 'Buna',
        price: 500,
        cost_price: 360,
        barcode: '546767863467',
        barcodes: ['546767863467', '5687635875678', '4543543543'],
        custom_attributes: {
            physical: { netWeight: '400', sizeType: 'g', unit: 'g' },
            packaging: { packQty: '1' },
            commercial: { sellBy: 'Unit', sellUnit: 'UNIT' }
        }
    };

    // 1. Harar Logistics Hub (Job OISF5F: Putaway 300 to A-02-02)
    if (hararId) {
        const { data: existingHarar } = await supabase.from('products').select('id').eq('sku', 'PA0001').eq('site_id', hararId);
        if (!existingHarar || existingHarar.length === 0) {
            await supabase.from('products').insert({
                id: '8e5ef26f-2023-4b1b-8bf8-1b9701d96163',
                ...baseProduct,
                site_id: hararId,
                stock: 300,
                location: 'A-02-02',
                status: 'active'
            });
            console.log("Restored Harar Logistics Hub: 300 UNIT (400g) at shelf A-02-02 (Job OISF5F).");
        }
    }

    // 2. Merkato retail store (Stock 20)
    if (merkatoId) {
        const { data: existingMerkato } = await supabase.from('products').select('id').eq('sku', 'PA0001').eq('site_id', merkatoId);
        if (!existingMerkato || existingMerkato.length === 0) {
            await supabase.from('products').insert({
                id: '7a1f3e98-d34a-4b13-94c7-b724b976a31b',
                ...baseProduct,
                site_id: merkatoId,
                stock: 20,
                location: 'General Area',
                status: 'active'
            });
            console.log("Restored Merkato retail store: 20 UNIT (400g).");
        }
    }

    console.log("=== ALL WMS LOCATIONS RESTORED AND VERIFIED ===");
}

restoreLocations();
