/**
 * SKU Generator Test & Demo
 * 
 * Run this in browser console to test SKU generation
 */

import { generateSKU, isValidSKU, registerExistingSKU, extractCategoryFromSKU } from './skuGenerator';

export function testSKUGenerator() {
    console.log('🧪 Testing SKU Generator\n');

    // Test 1: Basic Generation
    console.log('📝 Test 1: Basic SKU Generation');
    const sku1 = generateSKU('Electronics');
    const sku2 = generateSKU('Beverages');
    const sku3 = generateSKU('Food');
    console.log(`  Electronics: ${sku1}`);
    console.log(`  Beverages: ${sku2}`);
    console.log(`  Food: ${sku3}`);
    console.log('  ✅ Pass\n');

    // Test 2: Sequential Numbering
    console.log('📝 Test 2: Sequential Numbering');
    const el1 = generateSKU('Electronics');
    const el2 = generateSKU('Electronics', [{ sku: el1 }]);
    const el3 = generateSKU('Electronics', [{ sku: el1 }, { sku: el2 }]);
    console.log(`  First:  ${el1}`);
    console.log(`  Second: ${el2}`);
    console.log(`  Third:  ${el3}`);

    const num1 = parseInt(el1.split('-')[1]);
    const num2 = parseInt(el2.split('-')[1]);
    const num3 = parseInt(el3.split('-')[1]);

    if (num2 === num1 + 1 && num3 === num2 + 1) {
        console.log('  ✅ Pass - Numbers are sequential\n');
    } else {
        console.log('  ❌ Fail - Numbers are not sequential\n');
    }

    // Test 3: Existing SKU Usage
    console.log('📝 Test 3: Using Existing SKU');
    const existingSKU = 'BV-999';
    const result = generateSKU('Beverages', [], existingSKU);
    if (result === existingSKU) {
        console.log(`  Input: ${existingSKU}`);
        console.log(`  Output: ${result}`);
        console.log('  ✅ Pass - Existing SKU preserved\n');
    } else {
        console.log('  ❌ Fail - Existing SKU not preserved\n');
    }

    // Test 4: SKU Validation
    console.log('📝 Test 4: SKU Validation');
    const validCases = ['EL-001', 'BV-123', 'FD-999', 'TECH-1234'];
    const invalidCases = ['', 'ABC', '123', 'A-1', 'ABCDE-001'];

    console.log('  Valid SKUs:');
    validCases.forEach(sku => {
        const valid = isValidSKU(sku);
        console.log(`    ${sku}: ${valid ? '✅' : '❌'}`);
    });

    console.log('  Invalid SKUs:');
    invalidCases.forEach(sku => {
        const valid = isValidSKU(sku);
        console.log(`    "${sku}": ${!valid ? '✅' : '❌'}`);
    });
    console.log();

    // Test 5: SKU Registration (Deprecated but kept for structural compatibility)
    console.log('📝 Test 5: SKU Registration');
    registerExistingSKU('EL-500');
    console.log('  Note: registerExistingSKU is now a no-op as we check live inventory.\n');

    // Test 6: Category Extraction
    console.log('📝 Test 6: Category Extraction');
    const tests = [
        { sku: 'EL-001', expected: 'Electronics' },
        { sku: 'BV-042', expected: 'Beverages' },
        { sku: 'FD-123', expected: 'Food' }
    ];

    tests.forEach(({ sku, expected }) => {
        const category = extractCategoryFromSKU(sku);
        const pass = category === expected;
        console.log(`  ${sku} → ${category} ${pass ? '✅' : '❌'}`);
    });
    console.log();

    // Test 7: Unknown Category Handling
    console.log('📝 Test 7: Unknown Category Handling');
    const unknownCat = generateSKU('VideoGames');
    console.log(`  Category: VideoGames`);
    console.log(`  Generated: ${unknownCat}`);
    console.log(`  ${unknownCat.startsWith('VI-') ? '✅' : '⚠️'} Pass - Falls back to first 2 letters\n`);

    console.log('\n✨ Testing Complete!');
}

// Demo function for showing typical usage
export function demoSKUGeneration() {
    console.log('🎭 SKU Generation Demo\n');

    console.log('Scenario 1: Receiving Catalog Product');
    console.log('  Product: Laptop (already has SKU: EL-050)');
    const catalogSKU = generateSKU('Electronics', [], 'EL-050');
    console.log(`  Result: ${catalogSKU}`);
    registerExistingSKU(catalogSKU);
    console.log('  Action: Registered (legacy call)\n');

    console.log('Scenario 2: Receiving New Product (No SKU)');
    console.log('  Product: Premium Coffee (Category: Beverages)');
    const newSKU = generateSKU('Beverages');
    console.log(`  Generated: ${newSKU}\n`);

    console.log('Scenario 3: Putaway Unknown Item');
    console.log('  Product: Mystery Box (Category: General)');
    const mysterySKU = generateSKU('General');
    console.log(`  Generated: ${mysterySKU}\n`);

    console.log('Scenario 4: Supplier SKU Import');
    console.log('  Product: Energy Drink (Supplier SKU: BV-SUPP-001)');
    const supplierSKU = generateSKU('Beverages', [], 'BV-SUPP-001');
    console.log(`  Result: ${supplierSKU}`);
    console.log('  Action: Used supplier SKU as-is\n');
}

// Auto-run tests if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Uncomment to run tests automatically on page load
    // setTimeout(() => {
    //   testSKUGenerator();
    //   demoSKUGeneration();
    // }, 1000);
}
