/**
 * Data Migration Script (Node.js compatible)
 * Migrates sample data to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- DATA GENERATION ---

const SAMPLE_SITE = {
    name: 'Main Store - Addis Ababa',
    type: 'Store',
    address: 'Bole Road, Addis Ababa, Ethiopia',
    status: 'Active',
    manager: 'Abebe Bikila',
    capacity: 10000,
    terminal_count: 8
};

const CATEGORIES = ['Beverages', 'Fresh Produce', 'Snacks', 'Pantry', 'Dairy', 'Frozen', 'Personal Care', 'Household', 'Electronics', 'Bakery'];

const SAMPLE_PRODUCTS = [
    // Beverages
    { name: 'Neon Energy Drink', sku: 'BEV-001', category: 'Beverages', price: 120.00, cost_price: 80.00, stock: 500, status: 'active', sales_velocity: 'High' },
    { name: 'Smart Water 1L', sku: 'BEV-002', category: 'Beverages', price: 50.00, cost_price: 30.00, stock: 800, status: 'active', sales_velocity: 'High' },
    { name: 'Organic Orange Juice', sku: 'BEV-003', category: 'Beverages', price: 180.00, cost_price: 120.00, stock: 150, status: 'active', sales_velocity: 'Medium' },
    { name: 'Cola Classic', sku: 'BEV-004', category: 'Beverages', price: 45.00, cost_price: 35.00, stock: 1000, status: 'active', sales_velocity: 'High' },
    { name: 'Green Tea Pack', sku: 'BEV-005', category: 'Beverages', price: 95.00, cost_price: 60.00, stock: 200, status: 'active', sales_velocity: 'Low' },

    // Fresh Produce
    { name: 'Red Apples (kg)', sku: 'FRSH-001', category: 'Fresh Produce', price: 150.00, cost_price: 100.00, stock: 300, status: 'active', sales_velocity: 'High' },
    { name: 'Bananas (kg)', sku: 'FRSH-002', category: 'Fresh Produce', price: 60.00, cost_price: 40.00, stock: 400, status: 'active', sales_velocity: 'High' },
    { name: 'Potatoes (kg)', sku: 'FRSH-003', category: 'Fresh Produce', price: 40.00, cost_price: 25.00, stock: 1000, status: 'active', sales_velocity: 'Medium' },
    { name: 'Tomatoes (kg)', sku: 'FRSH-004', category: 'Fresh Produce', price: 55.00, cost_price: 35.00, stock: 200, status: 'active', sales_velocity: 'High' },
    { name: 'Onions (kg)', sku: 'FRSH-005', category: 'Fresh Produce', price: 45.00, cost_price: 28.00, stock: 600, status: 'active', sales_velocity: 'Medium' },

    // Snacks
    { name: 'Potato Chips Salted', sku: 'SNK-001', category: 'Snacks', price: 85.00, cost_price: 50.00, stock: 300, status: 'active', sales_velocity: 'High' },
    { name: 'Chocolate Bar', sku: 'SNK-002', category: 'Snacks', price: 65.00, cost_price: 40.00, stock: 500, status: 'active', sales_velocity: 'High' },
    { name: 'Mixed Nuts', sku: 'SNK-003', category: 'Snacks', price: 250.00, cost_price: 180.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Popcorn Butter', sku: 'SNK-004', category: 'Snacks', price: 70.00, cost_price: 45.00, stock: 200, status: 'active', sales_velocity: 'Medium' },
    { name: 'Pretzels', sku: 'SNK-005', category: 'Snacks', price: 80.00, cost_price: 55.00, stock: 150, status: 'active', sales_velocity: 'Low' },

    // Pantry
    { name: 'Rice 5kg', sku: 'PNT-001', category: 'Pantry', price: 800.00, cost_price: 650.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Pasta 500g', sku: 'PNT-002', category: 'Pantry', price: 60.00, cost_price: 40.00, stock: 400, status: 'active', sales_velocity: 'High' },
    { name: 'Cooking Oil 1L', sku: 'PNT-003', category: 'Pantry', price: 220.00, cost_price: 180.00, stock: 200, status: 'active', sales_velocity: 'High' },
    { name: 'Sugar 1kg', sku: 'PNT-004', category: 'Pantry', price: 90.00, cost_price: 75.00, stock: 300, status: 'active', sales_velocity: 'High' },
    { name: 'Flour 1kg', sku: 'PNT-005', category: 'Pantry', price: 85.00, cost_price: 65.00, stock: 250, status: 'active', sales_velocity: 'Medium' },

    // Dairy
    { name: 'Fresh Milk 1L', sku: 'DRY-001', category: 'Dairy', price: 75.00, cost_price: 60.00, stock: 100, status: 'active', sales_velocity: 'High' },
    { name: 'Yoghurt Cup', sku: 'DRY-002', category: 'Dairy', price: 35.00, cost_price: 25.00, stock: 150, status: 'active', sales_velocity: 'High' },
    { name: 'Butter 250g', sku: 'DRY-003', category: 'Dairy', price: 280.00, cost_price: 220.00, stock: 80, status: 'active', sales_velocity: 'Medium' },
    { name: 'Cheese Block', sku: 'DRY-004', category: 'Dairy', price: 350.00, cost_price: 280.00, stock: 60, status: 'active', sales_velocity: 'Medium' },
    { name: 'Cream 200ml', sku: 'DRY-005', category: 'Dairy', price: 120.00, cost_price: 90.00, stock: 40, status: 'active', sales_velocity: 'Low' },

    // Frozen
    { name: 'Frozen Peas', sku: 'FRZ-001', category: 'Frozen', price: 110.00, cost_price: 80.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Ice Cream Tub', sku: 'FRZ-002', category: 'Frozen', price: 250.00, cost_price: 180.00, stock: 50, status: 'active', sales_velocity: 'High' },
    { name: 'Frozen Pizza', sku: 'FRZ-003', category: 'Frozen', price: 300.00, cost_price: 220.00, stock: 80, status: 'active', sales_velocity: 'Medium' },
    { name: 'Chicken Nuggets', sku: 'FRZ-004', category: 'Frozen', price: 280.00, cost_price: 200.00, stock: 120, status: 'active', sales_velocity: 'High' },
    { name: 'Fish Fingers', sku: 'FRZ-005', category: 'Frozen', price: 260.00, cost_price: 190.00, stock: 90, status: 'active', sales_velocity: 'Medium' },

    // Personal Care
    { name: 'Shampoo 400ml', sku: 'PC-001', category: 'Personal Care', price: 180.00, cost_price: 120.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Soap Bar', sku: 'PC-002', category: 'Personal Care', price: 40.00, cost_price: 25.00, stock: 300, status: 'active', sales_velocity: 'High' },
    { name: 'Toothpaste', sku: 'PC-003', category: 'Personal Care', price: 90.00, cost_price: 60.00, stock: 200, status: 'active', sales_velocity: 'High' },
    { name: 'Deodorant', sku: 'PC-004', category: 'Personal Care', price: 150.00, cost_price: 100.00, stock: 120, status: 'active', sales_velocity: 'Medium' },
    { name: 'Body Lotion', sku: 'PC-005', category: 'Personal Care', price: 220.00, cost_price: 160.00, stock: 80, status: 'active', sales_velocity: 'Medium' },

    // Household
    { name: 'Dish Soap', sku: 'HH-001', category: 'Household', price: 85.00, cost_price: 60.00, stock: 150, status: 'active', sales_velocity: 'High' },
    { name: 'Laundry Powder', sku: 'HH-002', category: 'Household', price: 250.00, cost_price: 190.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Paper Towels', sku: 'HH-003', category: 'Household', price: 120.00, cost_price: 80.00, stock: 200, status: 'active', sales_velocity: 'High' },
    { name: 'Toilet Paper 4pk', sku: 'HH-004', category: 'Household', price: 160.00, cost_price: 110.00, stock: 250, status: 'active', sales_velocity: 'High' },
    { name: 'Glass Cleaner', sku: 'HH-005', category: 'Household', price: 95.00, cost_price: 65.00, stock: 80, status: 'active', sales_velocity: 'Low' },

    // Electronics
    { name: 'AA Batteries 4pk', sku: 'ELEC-001', category: 'Electronics', price: 150.00, cost_price: 90.00, stock: 200, status: 'active', sales_velocity: 'Medium' },
    { name: 'USB Cable', sku: 'ELEC-002', category: 'Electronics', price: 200.00, cost_price: 120.00, stock: 100, status: 'active', sales_velocity: 'Medium' },
    { name: 'Headphones', sku: 'ELEC-003', category: 'Electronics', price: 800.00, cost_price: 500.00, stock: 30, status: 'active', sales_velocity: 'Low' },
    { name: 'Phone Charger', sku: 'ELEC-004', category: 'Electronics', price: 350.00, cost_price: 200.00, stock: 50, status: 'active', sales_velocity: 'Medium' },
    { name: 'Power Strip', sku: 'ELEC-005', category: 'Electronics', price: 450.00, cost_price: 300.00, stock: 40, status: 'active', sales_velocity: 'Low' },

    // Bakery
    { name: 'Sliced Bread', sku: 'BAK-001', category: 'Bakery', price: 60.00, cost_price: 40.00, stock: 50, status: 'active', sales_velocity: 'High' },
    { name: 'Croissant', sku: 'BAK-002', category: 'Bakery', price: 45.00, cost_price: 25.00, stock: 40, status: 'active', sales_velocity: 'Medium' },
    { name: 'Bagel', sku: 'BAK-003', category: 'Bakery', price: 40.00, cost_price: 20.00, stock: 60, status: 'active', sales_velocity: 'Medium' },
    { name: 'Muffin', sku: 'BAK-004', category: 'Bakery', price: 50.00, cost_price: 30.00, stock: 45, status: 'active', sales_velocity: 'Medium' },
    { name: 'Donut', sku: 'BAK-005', category: 'Bakery', price: 35.00, cost_price: 15.00, stock: 80, status: 'active', sales_velocity: 'High' }
];

const SAMPLE_EMPLOYEES = [
    // Management
    { name: 'Abebe Bikila', role: 'super_admin', email: 'abebe@siifmart.com', department: 'Executive' },
    { name: 'Sara Tesfaye', role: 'admin', email: 'sara@siifmart.com', department: 'IT' },
    { name: 'Dawit Kebede', role: 'manager', email: 'dawit@siifmart.com', department: 'Store Ops' },
    { name: 'Hanna Girma', role: 'manager', email: 'hanna@siifmart.com', department: 'Store Ops' },

    // HR & Finance
    { name: 'Marta Yilma', role: 'hr', email: 'marta@siifmart.com', department: 'Human Resources' },
    { name: 'Robel Haile', role: 'auditor', email: 'robel@siifmart.com', department: 'Finance' },
    { name: 'Tigist Alemu', role: 'auditor', email: 'tigist@siifmart.com', department: 'Finance' },

    // Warehouse (WMS)
    { name: 'Yonas Tadesse', role: 'wms', email: 'yonas@siifmart.com', department: 'Warehouse' },
    { name: 'Kebede Balcha', role: 'wms', email: 'kebede@siifmart.com', department: 'Warehouse' },
    { name: 'Chala Dinka', role: 'picker', email: 'chala@siifmart.com', department: 'Warehouse' },
    { name: 'Gemechu Merga', role: 'picker', email: 'gemechu@siifmart.com', department: 'Warehouse' },
    { name: 'Lensa Bekele', role: 'picker', email: 'lensa@siifmart.com', department: 'Warehouse' },

    // Logistics
    { name: 'Samuel Fikru', role: 'driver', email: 'samuel@siifmart.com', department: 'Logistics' },
    { name: 'Tomas Assefa', role: 'driver', email: 'tomas@siifmart.com', department: 'Logistics' },

    // POS / Sales
    { name: 'Helen Mulugeta', role: 'pos', email: 'helen@siifmart.com', department: 'Sales' },
    { name: 'Betelhem Tefera', role: 'pos', email: 'betty@siifmart.com', department: 'Sales' },
    { name: 'Natnael Getachew', role: 'pos', email: 'nati@siifmart.com', department: 'Sales' },
    { name: 'Rahel Solomon', role: 'pos', email: 'rahel@siifmart.com', department: 'Sales' },
    { name: 'Elias Worku', role: 'pos', email: 'elias@siifmart.com', department: 'Sales' },
    { name: 'Meron Tadesse', role: 'pos', email: 'meron@siifmart.com', department: 'Sales' }
];

const SAMPLE_CUSTOMERS = [
    { name: 'John Doe', phone: '+251911234567', email: 'john@example.com', loyalty_points: 500, total_spent: 5000.00, tier: 'Gold' },
    { name: 'Jane Smith', phone: '+251922345678', email: 'jane@example.com', loyalty_points: 1200, total_spent: 12000.00, tier: 'Platinum' },
    { name: 'Michael Brown', phone: '+251933456789', email: 'michael@example.com', loyalty_points: 100, total_spent: 1500.00, tier: 'Bronze' },
    { name: 'Emily Davis', phone: '+251944567890', email: 'emily@example.com', loyalty_points: 300, total_spent: 3000.00, tier: 'Silver' },
    { name: 'David Wilson', phone: '+251955678901', email: 'david@example.com', loyalty_points: 50, total_spent: 500.00, tier: 'Bronze' }
];

const SAMPLE_SUPPLIERS = [
    { name: 'Beverage Distributors Ltd', type: 'Business', contact: 'Sales Manager', email: 'sales@bevdist.com', phone: '+251955678901', category: 'Beverages', status: 'Active', rating: 4.5, lead_time: 7, location: 'Addis Ababa' },
    { name: 'Fresh Foods Co', type: 'Business', contact: 'Procurement Head', email: 'orders@freshfoods.com', phone: '+251966789012', category: 'Fresh Produce', status: 'Active', rating: 4.8, lead_time: 3, location: 'Addis Ababa' },
    { name: 'Global Electronics', type: 'Business', contact: 'Account Manager', email: 'sales@globalelec.com', phone: '+251977890123', category: 'Electronics', status: 'Active', rating: 4.2, lead_time: 14, location: 'Dubai' },
    { name: 'Home Essentials', type: 'Business', contact: 'Distributor', email: 'info@homeessentials.com', phone: '+251988901234', category: 'Household', status: 'Active', rating: 4.0, lead_time: 5, location: 'Addis Ababa' }
];

async function migrateData() {
    console.log('🚀 Starting SIIFMART Data Migration (Expanded Dataset)\n');
    console.log('='.repeat(50));

    try {
        // Step 0: Clean up existing data
        console.log('\n🧹 Step 0: Cleaning up existing data...');
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Cleanup complete');

        // Step 1: Create Site
        console.log('\n📍 Step 1: Creating site...');
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .insert(SAMPLE_SITE)
            .select()
            .single();

        if (siteError) {
            console.error('❌ Failed to create site:', siteError.message);
            return;
        }
        console.log(`✅ Site created: ${site.name} (ID: ${site.id})`);

        // Step 2: Create Products
        console.log('\n📦 Step 2: Creating 50 products...');
        const productsWithSite = SAMPLE_PRODUCTS.map(p => ({
            ...p,
            site_id: site.id,
            location: `A-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 20)}`
        }));

        const { data: products, error: productsError } = await supabase
            .from('products')
            .insert(productsWithSite)
            .select();

        if (productsError) {
            console.error('❌ Failed to create products:', productsError.message);
            return;
        }
        console.log(`✅ Created ${products.length} products`);

        // Step 3: Create Customers
        console.log('\n👥 Step 3: Creating customers...');
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .insert(SAMPLE_CUSTOMERS)
            .select();

        if (customersError) {
            console.error('❌ Failed to create customers:', customersError.message);
            return;
        }
        console.log(`✅ Created ${customers.length} customers`);

        // Step 4: Create Employees
        console.log('\n👔 Step 4: Creating 20 employees...');
        const employeesWithSite = SAMPLE_EMPLOYEES.map(e => ({
            ...e,
            site_id: site.id,
            phone: `+2519${Math.floor(Math.random() * 90000000 + 10000000)}`,
            status: 'Active',
            join_date: new Date().toISOString().split('T')[0],
            salary: Math.floor(Math.random() * 10000) + 5000,
            performance_score: Math.floor(Math.random() * 20) + 80,
            attendance_rate: (Math.random() * 5 + 95).toFixed(1)
        }));

        const { data: employees, error: employeesError } = await supabase
            .from('employees')
            .insert(employeesWithSite)
            .select();

        if (employeesError) {
            console.error('❌ Failed to create employees:', employeesError.message);
            return;
        }
        console.log(`✅ Created ${employees.length} employees`);

        // Step 5: Create Suppliers
        console.log('\n🏭 Step 5: Creating suppliers...');
        const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .insert(SAMPLE_SUPPLIERS)
            .select();

        if (suppliersError) {
            console.error('❌ Failed to create suppliers:', suppliersError.message);
            return;
        }
        console.log(`✅ Created ${suppliers.length} suppliers`);

        // Step 6: Create Sample Sales
        console.log('\n💰 Step 6: Creating sample sales...');
        // Create 5 random sales
        for (let i = 0; i < 5; i++) {
            const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
            const randomCashier = employees.filter(e => e.role === 'pos')[Math.floor(Math.random() * 5)];

            const saleItems = [];
            let subtotal = 0;

            // Random items per sale
            const itemCount = Math.floor(Math.random() * 5) + 1;
            for (let j = 0; j < itemCount; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 3) + 1;
                saleItems.push({
                    product_id: product.id,
                    product_name: product.name,
                    quantity: qty,
                    price: product.price,
                    cost_price: product.cost_price
                });
                subtotal += product.price * qty;
            }

            const tax = subtotal * 0.15;
            const total = subtotal + tax;

            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    site_id: site.id,
                    customer_id: randomCustomer.id,
                    subtotal,
                    tax,
                    total,
                    payment_method: Math.random() > 0.5 ? 'Cash' : 'Card',
                    status: 'Completed',
                    cashier_name: randomCashier.name,
                    amount_tendered: total,
                    change: 0
                })
                .select()
                .single();

            if (!saleError) {
                await supabase.from('sale_items').insert(
                    saleItems.map(item => ({ ...item, sale_id: sale.id }))
                );
            }
        }
        console.log(`✅ Created 5 sample sales`);

        // Step 7: Create System Log
        console.log('\n📝 Step 7: Creating system log...');
        await supabase.from('system_logs').insert({
            user_name: 'Migration Script',
            action: 'Data Migration Completed',
            module: 'Settings',
            details: 'Successfully migrated expanded dataset to Supabase'
        });
        console.log('✅ System log created');

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('🎉 MIGRATION COMPLETE!\n');
        console.log('Summary:');
        console.log(`  ✅ 1 site created`);
        console.log(`  ✅ ${products.length} products created (50 items)`);
        console.log(`  ✅ ${customers.length} customers created`);
        console.log(`  ✅ ${employees.length} employees created (20 staff)`);
        console.log(`  ✅ ${suppliers.length} suppliers created`);
        console.log(`  ✅ 5 sample sales created`);
        console.log('\n🚀 Your Supabase database is now populated with rich data!');
        console.log('🔗 App URL: http://localhost:3003\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
    }
}

migrateData();
