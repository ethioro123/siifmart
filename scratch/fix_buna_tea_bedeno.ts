import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mryevxeyebuhszicstec.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeWV2eGV5ZWJ1aHN6aWNzdGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NTM5NTUsImV4cCI6MjA2MjUyOTk1NX0.3iK9e7B8g2N4pX6L5e7k8m9n0o1p2q3r4s5t6u7v8w9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBedenoBunaTea() {
    console.log('Updating Buna Tea stock to 20 for Bedeno site...');
    
    // Find Bedeno site product for SKU PA0001
    const { data: prods, error: findError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', 'PA0001');

    if (findError) {
        console.error('Error finding products:', findError);
        return;
    }

    console.log(`Found ${prods?.length || 0} products for PA0001.`);

    for (const p of prods || []) {
        const isBedeno = p.site_id === '97452359-705d-44dd-b2de-1002d6c19a81' || (p.location && p.location.includes('E-'));
        console.log(`Product ${p.id} - Site: ${p.site_id}, Stock: ${p.stock}, Name: ${p.name}`);
        
        if (isBedeno || p.stock === 310 || p.stock === 8000) {
            const { data: updated, error: updateError } = await supabase
                .from('products')
                .update({
                    stock: 20,
                    unit: 'UNIT',
                    size: '400',
                    brand: 'Buna',
                    custom_attributes: {
                        physical: { netWeight: '400', sizeType: 'g', unit: 'g' },
                        packaging: { packQty: '1' }
                    }
                })
                .eq('id', p.id)
                .select();

            if (updateError) {
                console.error(`Failed to update ${p.id}:`, updateError);
            } else {
                console.log(`SUCCESS: Updated Bedeno Buna Tea (${p.id}) stock to 20 UNIT (400g pack)!`);
            }
        }
    }
}

fixBedenoBunaTea();
