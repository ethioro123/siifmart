const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeWarehouseStaff() {
    const { data: employees } = await supabase
        .from('employees')
        .select('name, role, sites(name, type)')
        .in('role', ['warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'])
        .order('role')
        .order('name');

    console.log('🏭 WAREHOUSE STAFF BY LOCATION:\n');

    const byLocation = {};
    employees.forEach(emp => {
        const loc = emp.sites?.name || 'Unknown';
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(emp);
    });

    Object.keys(byLocation).sort().forEach(loc => {
        console.log('📍', loc);
        byLocation[loc].forEach(emp => {
            console.log('   ', emp.role.padEnd(25), emp.name);
        });
        console.log('');
    });

    // Analyze cross-warehouse access
    console.log('\n🔍 ACCESS ANALYSIS:\n');
    console.log('Question: Should pickers at Adama DC see operations at Harar Hub?');
    console.log('Current: YES - All pickers can access ALL warehouse operations');
    console.log('Recommendation: NO - Pickers should only see their assigned warehouse\n');
}

analyzeWarehouseStaff();
