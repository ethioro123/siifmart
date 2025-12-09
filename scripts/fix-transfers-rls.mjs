/**
 * Fix Transfers RLS Policies via Supabase Management API
 * This permanently updates the RLS policies in Supabase
 */

const PROJECT_REF = 'zdgzpxvorwinugjufkvb';
const MANAGEMENT_API_KEY = 'sb_secret_zN8tAH_tgn7iqjPlqTg09g_OpzNzFzq';

const sql = `
-- Enable RLS on transfers table
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to create transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to update transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to delete transfers" ON transfers;

-- SELECT Policy: Allow authenticated users to view all transfers
CREATE POLICY "Allow authenticated users to view transfers"
ON transfers FOR SELECT TO authenticated USING (true);

-- INSERT Policy: Allow authenticated users to create transfers
CREATE POLICY "Allow authenticated users to create transfers"
ON transfers FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE Policy: Allow authenticated users to update transfers
CREATE POLICY "Allow authenticated users to update transfers"
ON transfers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE Policy: Allow authenticated users to delete transfers
CREATE POLICY "Allow authenticated users to delete transfers"
ON transfers FOR DELETE TO authenticated USING (true);
`;

async function fixRLSPolicies() {
    console.log('🔧 Fixing RLS policies for transfers table...');
    console.log('📡 Using Supabase Management API...\n');

    try {
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MANAGEMENT_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: sql })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API Error:', response.status, error);

            // Try alternative endpoint
            console.log('\n🔄 Trying alternative approach...');
            await tryAlternativeApproach();
            return;
        }

        const result = await response.json();
        console.log('✅ RLS policies updated successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

        // Verify the policies
        await verifyPolicies();

    } catch (error) {
        console.error('❌ Error:', error);
        await tryAlternativeApproach();
    }
}

async function tryAlternativeApproach() {
    console.log('🔄 Using direct database connection approach...\n');

    // Get database connection string
    try {
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}`,
            {
                headers: {
                    'Authorization': `Bearer ${MANAGEMENT_API_KEY}`,
                }
            }
        );

        if (response.ok) {
            const project = await response.json();
            console.log('📋 Project info retrieved:', project.name);
            console.log('🗄️ Database host:', project.database?.host);

            console.log('\n⚠️ Please run this SQL manually in the Supabase SQL Editor:');
            console.log('─'.repeat(60));
            console.log(sql);
            console.log('─'.repeat(60));
        } else {
            console.log('Could not retrieve project info');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function verifyPolicies() {
    console.log('\n🔍 Verifying RLS policies...');

    const verifyQuery = `
        SELECT policyname, cmd, roles 
        FROM pg_policies 
        WHERE tablename = 'transfers';
    `;

    try {
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MANAGEMENT_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: verifyQuery })
            }
        );

        if (response.ok) {
            const result = await response.json();
            console.log('📋 Current RLS Policies:');
            console.table(result);
        }
    } catch (e) {
        console.log('Could not verify policies');
    }
}

// Run the fix
fixRLSPolicies();
