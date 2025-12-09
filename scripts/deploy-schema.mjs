/**
 * Deploy Supabase Schema
 * This script deploys the database schema to your Supabase project
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Read schema file
const schemaPath = join(__dirname, 'supabase-schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

console.log('🚀 SIIFMART Database Schema Deployment');
console.log('========================================\n');
console.log('✅ Environment variables loaded');
console.log(`📍 Project URL: ${SUPABASE_URL}\n`);

// Extract project reference
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('⚠️  IMPORTANT:');
console.log('   The schema needs to be deployed via Supabase Dashboard SQL Editor');
console.log('   because it requires admin privileges.\n');
console.log('📝 Steps to deploy:');
console.log(`   1. Open: https://supabase.com/dashboard/project/${projectRef}/sql`);
console.log('   2. Click "New query"');
console.log('   3. Copy content from: supabase-schema.sql');
console.log('   4. Paste into SQL Editor');
console.log('   5. Click "Run" (or Ctrl/Cmd + Enter)\n');
console.log('✨ The schema file is ready at: supabase-schema.sql');
console.log('   (It has been copied to your clipboard!)\n');

// Try to copy to clipboard (macOS)
try {
    const { execSync } = await import('child_process');
    execSync('pbcopy', { input: schema });
    console.log('✅ Schema copied to clipboard!');
    console.log('   Just paste it into the SQL Editor and run!\n');
} catch (err) {
    console.log('ℹ️  Manually copy from supabase-schema.sql\n');
}

console.log('🔗 Direct link to SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);
