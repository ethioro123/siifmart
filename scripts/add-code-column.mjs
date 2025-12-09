import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwOTk0NSwiZXhwIjoyMDc5Mzg1OTQ1fQ.toS8r1CEPIhV6gddpKNRgjTY_IDfWEJODNnCxu_78KQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addCodeColumn() {
    console.log('🔧 Adding code column to employees table...');

    // Add code column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
            -- Add code column if it doesn't exist
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'employees' AND column_name = 'code'
                ) THEN
                    ALTER TABLE employees ADD COLUMN code text UNIQUE;
                    RAISE NOTICE 'Column code added successfully';
                ELSE
                    RAISE NOTICE 'Column code already exists';
                END IF;
            END $$;
            
            -- Generate codes for existing employees without codes
            UPDATE employees 
            SET code = 'SIIF-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
            WHERE code IS NULL;
        `
    });

    if (error) {
        console.error('❌ Error:', error);

        // Try alternative approach using direct SQL
        console.log('🔄 Trying alternative approach...');
        const { error: altError } = await supabase.from('employees').select('id').limit(1);

        if (altError) {
            console.error('❌ Alternative approach failed:', altError);
            console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
            console.log('\nALTER TABLE employees ADD COLUMN code text UNIQUE;');
            console.log('\nUPDATE employees SET code = \'SIIF-\' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, \'0\') WHERE code IS NULL;');
        }
    } else {
        console.log('✅ Code column added successfully!');
        console.log('📊 Data:', data);
    }
}

addCodeColumn().catch(console.error);
