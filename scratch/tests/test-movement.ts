import { supabase } from './lib/supabase';

async function test() {
    const { data, error } = await supabase.from('stock_movements').select('*').limit(1);
    console.log("RAW RECORD:", data ? data[0] : null);
    if (error) console.error(error);
}

test();
