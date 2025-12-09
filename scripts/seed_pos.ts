
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey; // Prefer service role if available for seeding

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Use service role key if possible to bypass RLS, otherwise use anon key
const supabase = createClient(supabaseUrl, serviceRoleKey!);

const REAL_PRODUCTS = [
    { name: 'Organic Bananas', category: 'Fresh Produce', price: 90, cost: 60, sku: 'PROD-BAN-001', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop' },
    { name: 'Whole Milk 1L', category: 'Dairy', price: 120, cost: 85, sku: 'DAIRY-MILK-001', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop' },
    { name: 'Sourdough Bread', category: 'Bakery', price: 150, cost: 95, sku: 'BAK-SOUR-001', image: 'https://images.unsplash.com/photo-1585478402481-987823e59079?w=400&h=400&fit=crop' },
    { name: 'Premium Coffee Beans 500g', category: 'Beverages', price: 850, cost: 550, sku: 'BEV-COFF-001', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
    { name: 'Cheddar Cheese Block', category: 'Dairy', price: 450, cost: 320, sku: 'DAIRY-CHS-001', image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=400&fit=crop' },
    { name: 'Free Range Eggs 12pk', category: 'Dairy', price: 280, cost: 210, sku: 'DAIRY-EGG-012', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop' },
    { name: 'Extra Virgin Olive Oil 750ml', category: 'Pantry', price: 1200, cost: 900, sku: 'PAN-OIL-001', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcdcc41?w=400&h=400&fit=crop' },
    { name: 'Basmati Rice 5kg', category: 'Pantry', price: 800, cost: 650, sku: 'PAN-RICE-005', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop' },
    { name: 'Tomato Pasta Sauce', category: 'Pantry', price: 180, cost: 110, sku: 'PAN-SAUCE-001', image: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=400&h=400&fit=crop' },
    { name: 'Frozen Mixed Berries', category: 'Frozen', price: 350, cost: 240, sku: 'FRZ-BERR-001', image: 'https://images.unsplash.com/photo-1563220074-a6fc122ca88e?w=400&h=400&fit=crop' },
];

const SUPPLIERS = [
    { name: 'Fresh Farms Ltd', type: 'Business', category: 'Fresh Produce' },
    { name: 'Global Foods Inc', type: 'Business', category: 'General' },
    { name: 'Dairy Best Co', type: 'Business', category: 'Dairy' },
];

async function seed() {
    console.log('🌱 Starting seeder...');

    // 1. Get Warehouses
    const { data: sites, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('type', 'Warehouse');

    if (siteError || !sites || sites.length === 0) {
        console.error('❌ Failed to fetch warehouses or no warehouses found:', siteError);
        // Try getting ALL sites just in case
        const { data: allSites } = await supabase.from('sites').select('*');
        if (!allSites || allSites.length === 0) {
            console.error('❌ No sites found at all. Create a site first.');
            return;
        }
        console.log(`⚠️ No 'Warehouse' type sites found. Found ${allSites.length} other sites. Using all sites...`);
        // Use all sites for robustness if strict 'Warehouse' check fails
        // sites = allSites; // Can't reassign const, let's just proceed with loop over valid sites
    }

    const targetSites = (sites && sites.length > 0) ? sites : [];

    if (targetSites.length === 0) {
        const { data: anySites } = await supabase.from('sites').select('*').limit(3);
        if (anySites && anySites.length > 0) {
            console.log(`⚠️ Falling back to first available sites: ${anySites.map(s => s.name).join(', ')}`);
            targetSites.push(...anySites);
        } else {
            console.error('❌ Absolutely no sites found.');
            return;
        }
    }

    console.log(`📍 Found ${targetSites.length} target sites: ${targetSites.map(s => s.name).join(', ')}`);

    // 2. Ensure Products Exist
    console.log('📦 Ensuring products exist...');
    const createdProducts: any[] = [];

    // Choose a "primary" site for creating products (usually Headquarters or the first site)
    // Products need a site_id in this schema
    const primarySiteId = targetSites[0].id;

    for (const prod of REAL_PRODUCTS) {
        // Check if exists by SKU (global check might be needed if products are site-specific, but let's assume we want to ensure at least one instance exists)
        const { data: existing } = await supabase
            .from('products')
            .select('*')
            .eq('sku', prod.sku)
            .limit(1)
            .single();

        if (existing) {
            createdProducts.push(existing);
            // console.log(`✅ Product ${prod.name} already exists.`);
        } else {
            const { data: newProd, error: createError } = await supabase
                .from('products')
                .insert({
                    name: prod.name,
                    category: prod.category,
                    price: prod.price,
                    stock: 100,
                    sku: prod.sku,
                    image: prod.image,
                    status: 'active',
                    cost_price: prod.cost,
                    site_id: primarySiteId // Assign to first site primarily
                })
                .select()
                .single();

            if (createError) {
                console.error(`❌ Failed to create product ${prod.name}:`, createError);
            } else {
                createdProducts.push(newProd);
                console.log(`✅ Created product: ${prod.name}`);
            }
        }
    }

    // 3. Ensure Suppliers Exist
    console.log('🏭 Ensuring suppliers exist...');
    const suppliers: any[] = [];

    for (const sup of SUPPLIERS) {
        const { data: existing } = await supabase
            .from('suppliers')
            .select('*')
            .eq('name', sup.name)
            .limit(1)
            .single();

        if (existing) {
            suppliers.push(existing);
        } else {
            const { data: newSup, error: supError } = await supabase
                .from('suppliers')
                .insert({
                    name: sup.name,
                    type: sup.type,
                    category: sup.category,
                    contact: 'John Doe',
                    email: 'contact@supplier.com',
                    phone: '+1234567890',
                    status: 'Active',
                    rating: 5,
                    lead_time: 3
                })
                .select()
                .single();

            if (supError) {
                console.error(`❌ Failed to create supplier ${sup.name}:`, supError);
            } else {
                suppliers.push(newSup);
            }
        }
    }

    if (suppliers.length === 0) {
        console.error('❌ No suppliers available to create POs.');
        return;
    }

    // 4. Create POs for EACH Warehouse
    console.log('📝 Creating POs...');

    for (const site of targetSites) {
        console.log(`🔹 Processing Site: ${site.name} (${site.id})...`);

        for (let i = 1; i <= 10; i++) {
            // Select Random Supplier
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

            // Select Random Products (3-6 items)
            const numItems = Math.floor(Math.random() * 4) + 3;
            const shuffledProds = [...createdProducts].sort(() => 0.5 - Math.random());
            const selectedProds = shuffledProds.slice(0, numItems);

            // Construct Line Items
            const lineItems = selectedProds.map(p => {
                const qty = Math.floor(Math.random() * 50) + 10; // 10 to 60 units
                return {
                    product_id: p.id,
                    product_name: p.name,
                    quantity: qty,
                    unit_cost: p.cost_price || 0,
                    total_cost: (p.cost_price || 0) * qty
                };
            });

            const totalAmount = lineItems.reduce((sum, item) => sum + item.total_cost, 0);
            const itemsCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);

            // Create PO
            const poNumber = `PO-${site.code || 'SITE'}-${Date.now().toString().slice(-6)}-${i}`;

            const { data: po, error: poError } = await supabase
                .from('purchase_orders')
                .insert({
                    po_number: poNumber,
                    site_id: site.id,
                    supplier_id: supplier.id,
                    supplier_name: supplier.name,
                    status: 'Pending', // Start as Pending so we can approve or leave as is. User mentioned "real products in PO". Receiving flow usually requires "Approved". Let's use 'Approved' to make them ready to receive.
                    total_amount: totalAmount,
                    items_count: itemsCount,
                    expected_delivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
                    notes: `[APPROVED_BY:System Seeder:${new Date().toISOString()}] - Auto-generated PO #${i} for testing.` // Auto-approve via notes
                })
                .select()
                .single();

            if (poError) {
                console.error(`❌ Failed to create PO ${i} for ${site.name}:`, poError);
                continue;
            }

            // Create PO Items
            const poItemsToInsert = lineItems.map(item => ({
                po_id: po.id,
                ...item
            }));

            const { error: itemsError } = await supabase
                .from('po_items')
                .insert(poItemsToInsert);

            if (itemsError) {
                console.error(`❌ Failed to insert items for PO ${po.id}:`, itemsError);
            } else {
                // console.log(`✅ Created PO ${po.po_number} with ${lineItems.length} items.`);
            }
        }
        console.log(`✅ Created 10 POs for ${site.name}`);
    }

    console.log('🎉 Seeding complete!');
}

seed().catch(console.error);
