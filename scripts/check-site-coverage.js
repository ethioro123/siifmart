import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, anonKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') anonKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function checkSiteCoverage() {
    console.log('🏢 Checking site coverage...\n');

    // Get all sites
    const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name');

    if (sitesError) {
        console.error('❌ Error fetching sites:', sitesError);
        return;
    }

    // Get all employees
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, role, site_id');

    if (empError) {
        console.error('❌ Error fetching employees:', empError);
        return;
    }

    console.log(`📊 Total Sites: ${sites.length}`);
    console.log(`👥 Total Employees: ${employees.length}\n`);
    console.log('='.repeat(80));

    const sitesWithoutStaff = [];
    const sitesWithStaff = [];

    for (const site of sites) {
        const siteEmployees = employees.filter(e => e.site_id === site.id);

        if (siteEmployees.length === 0) {
            sitesWithoutStaff.push(site);
            console.log(`❌ ${site.name} (${site.type}) - NO STAFF`);
        } else {
            sitesWithStaff.push({ site, count: siteEmployees.length });
            console.log(`✅ ${site.name} (${site.type}) - ${siteEmployees.length} staff`);
            siteEmployees.forEach(emp => {
                console.log(`   - ${emp.name} (${emp.role})`);
            });
        }
        console.log('');
    }

    console.log('='.repeat(80));
    console.log(`\n📈 Summary:`);
    console.log(`   Sites with staff: ${sitesWithStaff.length}`);
    console.log(`   Sites without staff: ${sitesWithoutStaff.length}`);

    if (sitesWithoutStaff.length > 0) {
        console.log(`\n⚠️  Sites needing staff:`);
        sitesWithoutStaff.forEach(site => {
            console.log(`   - ${site.name} (${site.type})`);
        });
        return sitesWithoutStaff;
    } else {
        console.log(`\n✅ All sites have at least one staff member!`);
        return [];
    }
}

checkSiteCoverage().then(vacantSites => {
    if (vacantSites && vacantSites.length > 0) {
        console.log(`\n💡 Next step: Run 'node scripts/assign-staff-to-sites.js' to fill vacant sites`);
    }
});
