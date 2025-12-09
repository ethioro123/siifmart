import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInventory() {
    console.log('📦 Checking current inventory status...\n');

    const { data, error } = await supabase
        .from('products')
        .select('sku, name, stock, location, status')
        .order('sku')
        .limit(15);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('Current Product Status:');
    console.log('─'.repeat(80));
    data?.forEach(p => {
        const stockStr = `Stock: ${p.stock}`.padEnd(12);
        const locStr = `Location: ${p.location || 'NULL'}`.padEnd(30);
        const statusStr = `Status: ${p.status}`;
        console.log(`${p.sku.padEnd(15)} ${stockStr} ${locStr} ${statusStr}`);
    });
    console.log('─'.repeat(80));
    console.log(`Total products checked: ${data?.length || 0}`);

    const allZeroStock = data?.every(p => p.stock === 0);
    const allReceivingDock = data?.every(p => p.location === 'Receiving Dock');

    if (allZeroStock && allReceivingDock) {
        console.log('\n✅ All products successfully reset!');
    } else {
        console.log('\n⚠️  Some products may not be reset correctly');
        console.log(`   - Zero stock: ${allZeroStock ? 'Yes' : 'No'}`);
        console.log(`   - At Receiving Dock: ${allReceivingDock ? 'Yes' : 'No'}`);
    }
}

checkInventory();
