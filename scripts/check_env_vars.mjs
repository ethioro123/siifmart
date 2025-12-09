
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('Checking Environment Variables...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('SUPABASE_DB_URL exists:', !!process.env.SUPABASE_DB_URL);
console.log('VITE_DATABASE_URL exists:', !!process.env.VITE_DATABASE_URL);
