const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/purchase_orders?select=supplier_id,supplier_name&limit=5`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(e => console.error(e));
