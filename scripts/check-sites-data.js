
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, supabaseServiceKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSites() {
    console.log('Checking sites data...');
    const { data: sites, error } = await supabase
        .from('sites')
        .select('*');

    if (error) {
        console.error('Error fetching sites:', error);
        return;
    }

    console.log('Found sites:', sites.length);
    sites.forEach(site => {
        console.log(`ID: ${site.id}, Code: ${site.code}, Name: ${site.name}`);
    });
}

checkSites();
