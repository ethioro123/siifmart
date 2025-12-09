
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

const SITE_MAPPINGS = {
    'SIIFMART HQ': 'HQ',
    'Adama Distribution Center': 'WH-01',
    'Harar Logistics Hub': 'WH-02',
    'Dire Dawa Storage Facility': 'WH-03',
    'Bole Supermarket': 'ST-01',
    'Aratanya Market': 'ST-02',
    'Awaday Grocery': 'ST-03'
};

async function updateSiteCodes() {
    console.log('Updating site codes...');

    // First, check if code column exists by trying to select it
    const { error: checkError } = await supabase.from('sites').select('code').limit(1);
    if (checkError) {
        console.log('Code column might not exist, attempting to add it...');
        // We can't add columns via JS client usually, but we can try to update and see
    }

    const { data: sites, error } = await supabase.from('sites').select('*');
    if (error) {
        console.error('Error fetching sites:', error);
        return;
    }

    for (const site of sites) {
        const newCode = SITE_MAPPINGS[site.name];
        if (newCode) {
            console.log(`Updating ${site.name} (${site.id}) -> ${newCode}`);
            const { error: updateError } = await supabase
                .from('sites')
                .update({ code: newCode })
                .eq('id', site.id);

            if (updateError) {
                console.error(`Failed to update ${site.name}:`, updateError.message);
            } else {
                console.log(`✅ Updated ${site.name}`);
            }
        } else {
            console.log(`No mapping for ${site.name}`);
        }
    }
}

updateSiteCodes();
