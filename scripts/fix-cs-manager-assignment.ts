/**
 * Fix CS Manager Site Assignment
 * Moves Selamawit Girma (cs_manager) from warehouse to a store
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCSManagerAssignment() {
  console.log('🔧 Fixing CS Manager Site Assignment...\n');

  try {
    // 1. Get all stores
    const { data: stores, error: storesError } = await supabase
      .from('sites')
      .select('id, name, type')
      .in('type', ['Store', 'Dark Store', 'Retail Store'])
      .order('name')
      .limit(1);

    if (storesError) {
      throw storesError;
    }

    if (!stores || stores.length === 0) {
      console.log('❌ No stores found.');
      return;
    }

    const targetStore = stores[0];
    console.log(`📍 Target Store: ${targetStore.name}\n`);

    // 2. Find the CS Manager
    const { data: employees, error: empError } = await (supabase
      .from('employees')
      .select('id, name, role, site_id, email')
      .eq('email', 'selamawit.girma@siifmart.com')
      .single() as any);

    if (empError) {
      throw empError;
    }

    if (!employees) {
      console.log('❌ CS Manager not found.');
      return;
    }

    console.log(`👤 Found: ${employees.name} (${employees.role})`);
    console.log(`   Current Site ID: ${employees.site_id || 'None'}\n`);

    // 3. Update the assignment
    const { error: updateError } = await supabase
      .from('employees')
      .update({ site_id: targetStore.id })
      .eq('id', employees.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Updated ${employees.name} to ${targetStore.name}`);

    // 4. Also update auth metadata if exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users.find(u => (u as any).email === (employees as any).email);

    if (authUser) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          user_metadata: {
            ...authUser.user_metadata,
            site_id: targetStore.id
          }
        }
      );

      if (authError) {
        console.log(`⚠️  Could not update auth metadata: ${authError.message}`);
      } else {
        console.log(`✅ Updated auth metadata for ${employees.email}`);
      }
    }

    console.log('\n✅ Fix complete!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCSManagerAssignment();

