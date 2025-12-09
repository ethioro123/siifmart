import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(70));
console.log('🔧 PO SYSTEM - DATABASE MIGRATION REQUIRED');
console.log('='.repeat(70) + '\n');

console.log('📋 COPY THIS SQL AND RUN IT IN SUPABASE DASHBOARD:\n');
console.log('🔗 https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql\n');
console.log('='.repeat(70) + '\n');

const migrationPath = path.resolve(__dirname, '../migrations/fix_po_system_complete.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log(sql);

console.log('\n' + '='.repeat(70));
console.log('\n✅ AFTER RUNNING THE SQL ABOVE:\n');
console.log('   1. Test the PO system:');
console.log('      npx tsx scripts/test_po_functionality.ts\n');
console.log('   2. Open the app and create a multi-site PO:');
console.log('      http://localhost:3000/#/procurement\n');
console.log('='.repeat(70) + '\n');
