import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from root
const envPath = path.resolve(__dirname, '../.env.local');
console.log(`Loading env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('❌ .env.local file not found');
    process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

console.log('✅ Found Supabase credentials');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey?.substring(0, 10)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('\n📡 Testing connection to "sites" table...');
    const startTime = Date.now();
    const { data, error } = await supabase.from('sites').select('count', { count: 'exact', head: true });
    const duration = Date.now() - startTime;

    if (error) {
        console.error('❌ Connection FAILED');
        console.error(error);
    } else {
        console.log(`✅ Connection SUCCESSFUL in ${duration}ms`);
        // We used head: true, so data might be empty but count should be in 'count' property if we asked for it, 
        // strictly speaking select('count') needs count option.
        // Let's just do a normal select for simplicity in verbose log
    }

    console.log('\n📡 Fetching top 1 site...');
    const { data: rows, error: rowError } = await supabase.from('sites').select('*').limit(1);
    if (rowError) {
        console.error('❌ Fetch failed:', rowError);
    } else {
        console.log('✅ Fetch successful:', rows);
    }

    console.log('\n📡 Fetching top 1 PO...');
    const { data: pos, error: poError } = await supabase.from('purchase_orders').select('*').limit(1);
    if (poError) {
        console.error('❌ PO Fetch failed:', poError);
    } else {
        console.log('✅ PO Fetch successful. Count:', pos.length);
    }
}

testConnection();
