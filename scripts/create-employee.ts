#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// Load environment variables
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createEmployee() {
    console.log('\n🎯 SIIFMART Employee Creator\n');
    console.log('This tool creates an employee with a login account.\n');

    try {
        // Get site ID
        const { data: sites } = await supabase.from('sites').select('id, name').limit(5);
        if (!sites || sites.length === 0) {
            throw new Error('No sites found. Please run migration first.');
        }

        console.log('Available sites:');
        sites.forEach((site, idx) => {
            console.log(`  ${idx + 1}. ${site.name} (${site.id})`);
        });

        const siteIndex = parseInt(await question('\nSelect site (1-' + sites.length + '): ')) - 1;
        const siteId = sites[siteIndex]?.id || sites[0].id;

        // Get employee details
        const firstName = await question('\nFirst Name: ');
        const lastName = await question('Last Name: ');
        const email = await question('Email: ');
        const password = await question('Password (min 6 chars): ');

        console.log('\nAvailable roles:');
        console.log('  1. super_admin - Full access');
        console.log('  2. admin - System admin');
        console.log('  3. manager - Store manager');
        console.log('  4. hr - HR manager');
        console.log('  5. wms - Warehouse admin');
        console.log('  6. pos - Cashier');
        console.log('  7. picker - Warehouse picker');
        console.log('  8. driver - Driver');

        const roleChoice = await question('\nSelect role (1-8): ');
        const roles = ['super_admin', 'admin', 'manager', 'hr', 'wms', 'pos', 'picker', 'driver'];
        const role = roles[parseInt(roleChoice) - 1] || 'pos';

        const phone = await question('Phone (optional): ') || '';
        const department = await question('Department: ') || 'General';
        const salary = await question('Monthly Salary: ') || '0';

        console.log('\n📝 Creating employee...\n');

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: `${firstName} ${lastName}`,
                    role,
                    site_id: siteId
                }
            }
        });

        if (authError) {
            console.error('❌ Auth creation failed:', authError.message);
            rl.close();
            return;
        }

        if (!authData.user) {
            console.error('❌ No user data returned');
            rl.close();
            return;
        }

        console.log('✅ Auth account created:', authData.user.id);

        // 2. Create employee record
        const { error: empError } = await supabase.from('employees').insert({
            id: authData.user.id,
            name: `${firstName} ${lastName}`,
            email,
            role,
            site_id: siteId,
            status: 'Active',
            join_date: new Date().toISOString().split('T')[0],
            phone: phone || '',
            department,
            salary: parseFloat(salary) || 0,
            avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
            performance_score: 100
        });

        if (empError) {
            console.error('❌ Employee record creation failed:', empError.message);
            rl.close();
            return;
        }

        console.log('✅ Employee record created\n');
        console.log('═══════════════════════════════════════');
        console.log('✅ SUCCESS! Employee created and ready to login!');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:   ', email);
        console.log('🔑 Password:', password);
        console.log('👤 Name:    ', `${firstName} ${lastName}`);
        console.log('🎖️  Role:    ', role);
        console.log('═══════════════════════════════════════\n');
        console.log('🌐 They can now login at: http://localhost:3001\n');

        rl.close();
    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        rl.close();
    }
}

createEmployee();
