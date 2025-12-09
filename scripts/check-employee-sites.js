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

async function checkEmployeeSiteAssignments() {
    console.log('🔍 Checking Employee Site Assignments...\n');

    const { data: employees, error } = await supabase
        .from('employees')
        .select('id, code, name, role, site_id, status')
        .order('code');

    if (error) {
        console.error('❌ Error fetching employees:', error);
        return;
    }

    console.log(`Total Employees: ${employees.length}\n`);

    // Check for employees without siteId
    const employeesWithoutSite = employees.filter(emp => !emp.site_id);

    if (employeesWithoutSite.length > 0) {
        console.log('⚠️  CRITICAL: Employees WITHOUT site assignment:');
        console.log('═'.repeat(80));
        employeesWithoutSite.forEach(emp => {
            console.log(`❌ ${emp.code} - ${emp.name} (${emp.role}) - NO SITE ASSIGNED`);
        });
        console.log('═'.repeat(80));
        console.log(`\n❌ ${employeesWithoutSite.length} employees are NOT tied to a location!\n`);
    } else {
        console.log('✅ All employees have site assignments!\n');
    }

    // Group by site
    const employeesBySite = employees.reduce((acc, emp) => {
        const siteId = emp.site_id || 'UNASSIGNED';
        if (!acc[siteId]) acc[siteId] = [];
        acc[siteId].push(emp);
        return acc;
    }, {});

    // Fetch sites for names
    const { data: sites } = await supabase.from('sites').select('id, code, name, type');
    const siteMap = sites?.reduce((acc, site) => {
        acc[site.id] = site;
        return acc;
    }, {}) || {};

    console.log('📊 Employee Distribution by Location:');
    console.log('═'.repeat(80));

    Object.entries(employeesBySite).forEach(([siteId, emps]) => {
        const site = siteMap[siteId];
        const siteName = site ? `${site.code} - ${site.name} (${site.type})` : siteId;
        console.log(`\n📍 ${siteName}`);
        console.log(`   Total: ${emps.length} employees`);

        // Group by role
        const roleGroups = emps.reduce((acc, emp) => {
            if (!acc[emp.role]) acc[emp.role] = [];
            acc[emp.role].push(emp.name);
            return acc;
        }, {});

        Object.entries(roleGroups).forEach(([role, names]) => {
            console.log(`   - ${role}: ${names.length} (${names.join(', ')})`);
        });
    });

    console.log('\n' + '═'.repeat(80));

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   ✅ Total Employees: ${employees.length}`);
    console.log(`   ✅ Employees with Site: ${employees.length - employeesWithoutSite.length}`);
    console.log(`   ${employeesWithoutSite.length > 0 ? '❌' : '✅'} Employees without Site: ${employeesWithoutSite.length}`);
    console.log(`   📍 Total Sites: ${Object.keys(employeesBySite).length}`);

    if (employeesWithoutSite.length === 0) {
        console.log('\n🎉 SUCCESS: All employees are properly tied to their locations!');
    } else {
        console.log('\n⚠️  ACTION REQUIRED: Some employees need site assignment!');
    }
}

checkEmployeeSiteAssignments();
