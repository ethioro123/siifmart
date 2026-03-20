const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const url = envStr.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)[1].trim();
const key = envStr.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)[1].trim();

fetch(`${url}/rest/v1/suppliers?select=*&limit=3`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(e => console.error(e));
