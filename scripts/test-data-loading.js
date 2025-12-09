import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, supabaseKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataLoading() {
    console.log('🧪 Testing Data Loading...\n');

    // Test 1: Get all sites
    console.log('1️⃣ Testing Sites Loading:');
    const { data: sites, error: sitesError } = await supabase.from('sites').select('*');
    if (sitesError) {
        console.error('❌ Error loading sites:', sitesError);
    } else {
        console.log(`✅ Loaded ${sites.length} sites`);
        sites.forEach(s => console.log(`   - ${s.name} (${s.type})`));
    }

    console.log('\n2️⃣ Testing Employees Loading (All):');
    const { data: allEmployees, error: allEmpError } = await supabase.from('employees').select('*');
    if (allEmpError) {
        console.error('❌ Error loading all employees:', allEmpError);
    } else {
        console.log(`✅ Loaded ${allEmployees.length} employees (no filter)`);
    }

    console.log('\n3️⃣ Testing Employees Loading (By Site):');
    if (sites && sites.length > 0) {
        const testSite = sites[0];
        const { data: siteEmployees, error: siteEmpError } = await supabase
            .from('employees')
            .select('*')
            .eq('site_id', testSite.id);

        if (siteEmpError) {
            console.error('❌ Error loading site employees:', siteEmpError);
        } else {
            console.log(`✅ Loaded ${siteEmployees.length} employees for site: ${testSite.name}`);
            siteEmployees.forEach(e => console.log(`   - ${e.name} (${e.role})`));
        }
    }

    console.log('\n4️⃣ Testing Products Loading:');
    const { data: products, error: prodError } = await supabase.from('products').select('*');
    if (prodError) {
        console.error('❌ Error loading products:', prodError);
    } else {
        console.log(`✅ Loaded ${products.length} products`);
    }

    console.log('\n5️⃣ Testing Sales Loading:');
    const { data: sales, error: salesError } = await supabase.from('sales').select('*');
    if (salesError) {
        console.error('❌ Error loading sales:', salesError);
    } else {
        console.log(`✅ Loaded ${sales.length} sales records`);
    }

    console.log('\n6️⃣ Testing Purchase Orders Loading:');
    const { data: orders, error: ordersError } = await supabase.from('purchase_orders').select('*');
    if (ordersError) {
        console.error('❌ Error loading purchase orders:', ordersError);
    } else {
        console.log(`✅ Loaded ${orders.length} purchase orders`);
    }

    console.log('\n✅ Data Loading Test Complete!');
}

testDataLoading();
