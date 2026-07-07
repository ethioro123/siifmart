import { supabase } from './lib/supabase';

async function testQuery() {
    const term = "C046B714";

    console.log("Testing id.ilike (no cast):");
    let res1 = await supabase.from('stock_movements').select('id, product_name').ilike('id', `%${term}%`).limit(1);
    console.log("RES1:", res1.error ? res1.error.message : res1.data);

    console.log("Testing filter id::text:");
    let res2 = await supabase.from('stock_movements').select('id, product_name').filter('id::text', 'ilike', `%${term}%`).limit(1);
    console.log("RES2:", res2.error ? res2.error.message : res2.data);

    console.log("Testing filter id cast as text directly:");
    let res3 = await supabase.from('stock_movements').select('id, product_name').ilike('id::text', `%${term}%`).limit(1);
    console.log("RES3:", res3.error ? res3.error.message : res3.data);

    console.log("Testing .or syntax with custom postgres function (if we had one):");
    // we don't have one, but let's test a simple .or with just product_name to show it works
    let res4 = await supabase.from('stock_movements').select('id, product_name').or(`product_name.ilike.%${term}%`).limit(1);
    console.log("RES4:", res4.error ? res4.error.message : res4.data);
}
testQuery();
