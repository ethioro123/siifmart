import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== SYNCHRONIZING BUNA TEA STOCK ACROSS WAREHOUSES & STORES ===");

    // Fetch site IDs
    const { data: sites } = await supabase.from('sites').select('*');
    const adamaId = sites?.find(s => s.name.includes('Adama'))?.id;
    const hararId = sites?.find(s => s.name.includes('Harar'))?.id;
    const direDawaId = sites?.find(s => s.name.includes('Dire Dawa'))?.id;
    const amboId = sites?.find(s => s.name.includes('AMBO'))?.id;
    const bedenoId = sites?.find(s => s.name.includes('BEDENO'))?.id;
    const merkatoStoreId = sites?.find(s => s.name.includes('Merkato retail'))?.id;

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

    const siteStockMap = [
        { siteId: bedenoId, name: 'BEDENO (Store)', stock: 20, loc: 'B-01-01' },
        { siteId: adamaId, name: 'Adama Distribution Center (Warehouse)', stock: 282, loc: 'E-02-01' },
        { siteId: hararId, name: 'Harar Logistics Hub (Warehouse)', stock: 300, loc: 'A-02-02' },
        { siteId: direDawaId, name: 'Dire Dawa Storage Facility (Warehouse)', stock: 30, loc: 'A-05-04' },
        { siteId: amboId, name: 'AMBO (Distribution Center)', stock: 2, loc: 'A-09-10' },
    ];

    for (const item of siteStockMap) {
        if (!item.siteId) continue;

        // Check if product exists for this site
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', 'PA0001')
            .eq('site_id', item.siteId);

        if (existing && existing.length > 0) {
            await supabase
                .from('products')
                .update({
                    ...baseProduct,
                    stock: item.stock,
                    location: item.loc
                })
                .eq('id', existing[0].id);
            console.log(`Updated ${item.name}: Stock = ${item.stock} UNIT (400g)`);
        } else {
            await supabase
                .from('products')
                .insert({
                    ...baseProduct,
                    site_id: item.siteId,
                    stock: item.stock,
                    location: item.loc,
                    status: 'active'
                });
            console.log(`Created ${item.name}: Stock = ${item.stock} UNIT (400g)`);
        }
    }

    console.log("=== BUNA TEA ALL-WAREHOUSE SYNC COMPLETE ===");
}

main();
