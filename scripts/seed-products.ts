import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vhfbqzxwwqpwqbkxjjqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZmJxenh3d3Fwd3Fia3hqanFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyNjE5NjAsImV4cCI6MjA0NzgzNzk2MH0.uHhKKQU_Oo3fxZCTlqTJKjyqvhRbLrAZmOPJUZGPZvE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample products with realistic names and details
const sampleProducts = [
    // Beverages (10 products)
    { name: 'Coca-Cola 2L', category: 'Beverages', price: 45, costPrice: 30, stock: 150, sku: 'BEV-001', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', location: 'A-01-01', shelfPosition: 'Eye Level' },
    { name: 'Pepsi 2L', category: 'Beverages', price: 45, costPrice: 30, stock: 120, sku: 'BEV-002', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', location: 'A-01-02', shelfPosition: 'Eye Level' },
    { name: 'Sprite 1.5L', category: 'Beverages', price: 35, costPrice: 23, stock: 100, sku: 'BEV-003', image: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400', location: 'A-01-03', shelfPosition: 'Eye Level' },
    { name: 'Orange Juice 1L', category: 'Beverages', price: 65, costPrice: 45, stock: 80, sku: 'BEV-004', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', location: 'A-01-04', shelfPosition: 'Top Shelf' },
    { name: 'Apple Juice 1L', category: 'Beverages', price: 60, costPrice: 42, stock: 75, sku: 'BEV-005', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', location: 'A-01-05', shelfPosition: 'Top Shelf' },
    { name: 'Mineral Water 500ml', category: 'Beverages', price: 15, costPrice: 8, stock: 300, sku: 'BEV-006', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', location: 'A-02-01', shelfPosition: 'Bottom Shelf' },
    { name: 'Energy Drink 250ml', category: 'Beverages', price: 55, costPrice: 38, stock: 90, sku: 'BEV-007', image: 'https://images.unsplash.com/photo-1622543925917-763c34f6a1a7?w=400', location: 'A-02-02', shelfPosition: 'Eye Level' },
    { name: 'Green Tea 500ml', category: 'Beverages', price: 40, costPrice: 28, stock: 85, sku: 'BEV-008', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', location: 'A-02-03', shelfPosition: 'Eye Level' },
    { name: 'Iced Coffee 250ml', category: 'Beverages', price: 50, costPrice: 35, stock: 70, sku: 'BEV-009', image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', location: 'A-02-04', shelfPosition: 'Eye Level' },
    { name: 'Mango Juice 1L', category: 'Beverages', price: 70, costPrice: 48, stock: 65, sku: 'BEV-010', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', location: 'A-02-05', shelfPosition: 'Top Shelf' },

    // Dairy (8 products)
    { name: 'Fresh Milk 1L', category: 'Dairy', price: 55, costPrice: 38, stock: 120, sku: 'DAI-001', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', location: 'C-01-01', shelfPosition: 'Eye Level' },
    { name: 'Greek Yogurt 500g', category: 'Dairy', price: 85, costPrice: 60, stock: 90, sku: 'DAI-002', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', location: 'C-01-02', shelfPosition: 'Eye Level' },
    { name: 'Cheddar Cheese 200g', category: 'Dairy', price: 95, costPrice: 65, stock: 75, sku: 'DAI-003', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400', location: 'C-01-03', shelfPosition: 'Top Shelf' },
    { name: 'Butter 250g', category: 'Dairy', price: 75, costPrice: 52, stock: 100, sku: 'DAI-004', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', location: 'C-01-04', shelfPosition: 'Eye Level' },
    { name: 'Cream Cheese 200g', category: 'Dairy', price: 80, costPrice: 55, stock: 85, sku: 'DAI-005', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400', location: 'C-01-05', shelfPosition: 'Eye Level' },
    { name: 'Sour Cream 300ml', category: 'Dairy', price: 65, costPrice: 45, stock: 70, sku: 'DAI-006', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', location: 'C-02-01', shelfPosition: 'Eye Level' },
    { name: 'Mozzarella Cheese 250g', category: 'Dairy', price: 105, costPrice: 72, stock: 60, sku: 'DAI-007', image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400', location: 'C-02-02', shelfPosition: 'Top Shelf' },
    { name: 'Chocolate Milk 500ml', category: 'Dairy', price: 45, costPrice: 32, stock: 95, sku: 'DAI-008', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', location: 'C-02-03', shelfPosition: 'Eye Level' },

    // Frozen (6 products)
    { name: 'Frozen Pizza Margherita', category: 'Frozen', price: 120, costPrice: 85, stock: 50, sku: 'FRZ-001', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', location: 'F-01-01', shelfPosition: 'Eye Level' },
    { name: 'Ice Cream Vanilla 1L', category: 'Frozen', price: 95, costPrice: 65, stock: 70, sku: 'FRZ-002', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', location: 'F-01-02', shelfPosition: 'Eye Level' },
    { name: 'Frozen Vegetables Mix 500g', category: 'Frozen', price: 55, costPrice: 38, stock: 80, sku: 'FRZ-003', image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400', location: 'F-01-03', shelfPosition: 'Bottom Shelf' },
    { name: 'Frozen Chicken Nuggets 1kg', category: 'Frozen', price: 145, costPrice: 100, stock: 65, sku: 'FRZ-004', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', location: 'F-01-04', shelfPosition: 'Eye Level' },
    { name: 'Frozen French Fries 1kg', category: 'Frozen', price: 75, costPrice: 52, stock: 90, sku: 'FRZ-005', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', location: 'F-02-01', shelfPosition: 'Eye Level' },
    { name: 'Ice Cream Chocolate 1L', category: 'Frozen', price: 95, costPrice: 65, stock: 75, sku: 'FRZ-006', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', location: 'F-02-02', shelfPosition: 'Eye Level' },

    // Fruits & Vegetables (10 products)
    { name: 'Red Apples (kg)', category: 'Fruits', price: 45, costPrice: 30, stock: 200, sku: 'FRT-001', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', location: 'B-01-01', shelfPosition: 'Eye Level' },
    { name: 'Bananas (kg)', category: 'Fruits', price: 35, costPrice: 22, stock: 180, sku: 'FRT-002', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', location: 'B-01-02', shelfPosition: 'Eye Level' },
    { name: 'Oranges (kg)', category: 'Fruits', price: 50, costPrice: 33, stock: 150, sku: 'FRT-003', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', location: 'B-01-03', shelfPosition: 'Eye Level' },
    { name: 'Strawberries 250g', category: 'Fruits', price: 85, costPrice: 58, stock: 60, sku: 'FRT-004', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400', location: 'B-01-04', shelfPosition: 'Top Shelf' },
    { name: 'Grapes (kg)', category: 'Fruits', price: 95, costPrice: 65, stock: 80, sku: 'FRT-005', image: 'https://images.unsplash.com/photo-1599819177331-c8795a0d2129?w=400', location: 'B-01-05', shelfPosition: 'Eye Level' },
    { name: 'Tomatoes (kg)', category: 'Vegetables', price: 40, costPrice: 28, stock: 120, sku: 'VEG-001', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400', location: 'B-02-01', shelfPosition: 'Eye Level' },
    { name: 'Potatoes (kg)', category: 'Vegetables', price: 30, costPrice: 18, stock: 250, sku: 'VEG-002', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', location: 'B-02-02', shelfPosition: 'Bottom Shelf' },
    { name: 'Onions (kg)', category: 'Vegetables', price: 35, costPrice: 22, stock: 200, sku: 'VEG-003', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400', location: 'B-02-03', shelfPosition: 'Bottom Shelf' },
    { name: 'Carrots (kg)', category: 'Vegetables', price: 38, costPrice: 25, stock: 150, sku: 'VEG-004', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', location: 'B-02-04', shelfPosition: 'Eye Level' },
    { name: 'Lettuce (head)', category: 'Vegetables', price: 25, costPrice: 15, stock: 100, sku: 'VEG-005', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', location: 'B-02-05', shelfPosition: 'Eye Level' },

    // Bakery (6 products)
    { name: 'White Bread Loaf', category: 'Bakery', price: 35, costPrice: 22, stock: 100, sku: 'BAK-001', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', location: 'D-01-01', shelfPosition: 'Eye Level' },
    { name: 'Whole Wheat Bread', category: 'Bakery', price: 42, costPrice: 28, stock: 85, sku: 'BAK-002', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', location: 'D-01-02', shelfPosition: 'Eye Level' },
    { name: 'Croissants 6-pack', category: 'Bakery', price: 75, costPrice: 50, stock: 60, sku: 'BAK-003', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', location: 'D-01-03', shelfPosition: 'Top Shelf' },
    { name: 'Bagels 6-pack', category: 'Bakery', price: 65, costPrice: 45, stock: 70, sku: 'BAK-004', image: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=400', location: 'D-01-04', shelfPosition: 'Eye Level' },
    { name: 'Chocolate Muffins 4-pack', category: 'Bakery', price: 85, costPrice: 58, stock: 50, sku: 'BAK-005', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', location: 'D-02-01', shelfPosition: 'Eye Level' },
    { name: 'Dinner Rolls 12-pack', category: 'Bakery', price: 55, costPrice: 38, stock: 75, sku: 'BAK-006', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', location: 'D-02-02', shelfPosition: 'Eye Level' },

    // Snacks (10 products)
    { name: 'Potato Chips 150g', category: 'Snacks', price: 45, costPrice: 30, stock: 120, sku: 'SNK-001', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', location: 'E-01-01', shelfPosition: 'Eye Level' },
    { name: 'Chocolate Bar 100g', category: 'Snacks', price: 35, costPrice: 23, stock: 200, sku: 'SNK-002', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400', location: 'E-01-02', shelfPosition: 'Checkout' },
    { name: 'Cookies Pack 200g', category: 'Snacks', price: 55, costPrice: 38, stock: 150, sku: 'SNK-003', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', location: 'E-01-03', shelfPosition: 'Eye Level' },
    { name: 'Popcorn 100g', category: 'Snacks', price: 30, costPrice: 18, stock: 100, sku: 'SNK-004', image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400', location: 'E-01-04', shelfPosition: 'Bottom Shelf' },
    { name: 'Peanuts Roasted 200g', category: 'Snacks', price: 65, costPrice: 45, stock: 90, sku: 'SNK-005', image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400', location: 'E-01-05', shelfPosition: 'Eye Level' },
    { name: 'Pretzels 150g', category: 'Snacks', price: 40, costPrice: 28, stock: 110, sku: 'SNK-006', image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400', location: 'E-02-01', shelfPosition: 'Eye Level' },
    { name: 'Granola Bars 6-pack', category: 'Snacks', price: 75, costPrice: 52, stock: 85, sku: 'SNK-007', image: 'https://images.unsplash.com/photo-1606312619070-d48b4ccd8e8f?w=400', location: 'E-02-02', shelfPosition: 'Eye Level' },
    { name: 'Trail Mix 250g', category: 'Snacks', price: 85, costPrice: 58, stock: 70, sku: 'SNK-008', image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400', location: 'E-02-03', shelfPosition: 'Eye Level' },
    { name: 'Crackers 200g', category: 'Snacks', price: 50, costPrice: 35, stock: 95, sku: 'SNK-009', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', location: 'E-02-04', shelfPosition: 'Eye Level' },
    { name: 'Gummy Bears 150g', category: 'Snacks', price: 40, costPrice: 28, stock: 130, sku: 'SNK-010', image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400', location: 'E-02-05', shelfPosition: 'Checkout' },
];

async function seedProducts() {
    console.log('🌱 Starting product seeding...');

    try {
        // Get the first site ID
        const { data: sites, error: siteError } = await supabase
            .from('sites')
            .select('id')
            .limit(1);

        if (siteError) throw siteError;
        if (!sites || sites.length === 0) {
            throw new Error('No sites found. Please create a site first.');
        }

        const siteId = sites[0].id;
        console.log(`📍 Using site ID: ${siteId}`);

        // Prepare products for insertion
        const productsToInsert = sampleProducts.map((product, index) => ({
            id: `PROD-${Date.now()}-${index}`,
            site_id: siteId,
            name: product.name,
            category: product.category,
            price: product.price,
            cost_price: product.costPrice,
            stock: product.stock,
            sku: product.sku,
            image: product.image,
            status: product.stock > 10 ? 'active' : 'low_stock',
            location: product.location,
            shelf_position: product.shelfPosition,
            sales_velocity: product.stock > 100 ? 'High' : product.stock > 50 ? 'Medium' : 'Low'
        }));

        // Insert products in batches
        const batchSize = 10;
        let inserted = 0;

        for (let i = 0; i < productsToInsert.length; i += batchSize) {
            const batch = productsToInsert.slice(i, i + batchSize);
            const { data, error } = await supabase
                .from('products')
                .insert(batch)
                .select();

            if (error) {
                console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
                continue;
            }

            inserted += batch.length;
            console.log(`✅ Inserted batch ${i / batchSize + 1}: ${batch.length} products (Total: ${inserted}/${productsToInsert.length})`);
        }

        console.log(`\n🎉 Successfully seeded ${inserted} products!`);
        console.log('\n📊 Product breakdown:');
        console.log('   - Beverages: 10');
        console.log('   - Dairy: 8');
        console.log('   - Frozen: 6');
        console.log('   - Fruits: 5');
        console.log('   - Vegetables: 5');
        console.log('   - Bakery: 6');
        console.log('   - Snacks: 10');
        console.log('\n✨ All products are ready to use in your POS and WMS!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeding
seedProducts();
