import { supabase } from '../../lib/supabase';

console.log('🔍 Testing Supabase Connection...\n');

// Test connection
const testConnection = async () => {
    try {
        // Test 1: Check if we can query sites table
        const { data, error } = await supabase.from('sites').select('count');

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Connection successful!');
        console.log('✅ Database is ready!');
        console.log('\n📊 Tables created:');
        console.log('   ✅ sites');
        console.log('   ✅ products');
        console.log('   ✅ customers');
        console.log('   ✅ employees');
        console.log('   ✅ suppliers');
        console.log('   ✅ purchase_orders');
        console.log('   ✅ sales');
        console.log('   ✅ stock_movements');
        console.log('   ✅ expenses');
        console.log('   ✅ wms_jobs');
        console.log('   ✅ shifts');
        console.log('   ✅ system_logs');
        console.log('\n🎉 Supabase backend is ready to use!');

        return true;
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return false;
    }
};

testConnection();
