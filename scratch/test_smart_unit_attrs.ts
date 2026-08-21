import { getSmartUnitAttributes } from '../utils/units';

console.log("=== TESTING getSmartUnitAttributes ===");

// 1. Buna Tea 400g
console.log("Buna Tea 400g:", getSmartUnitAttributes({ size: '400', unit: 'g' }));

// 2. Dalo Sugar 5kg
console.log("Dalo Sugar 5kg:", getSmartUnitAttributes({ size: '5', unit: 'kg' }));

// 3. Freshi Apple Juice 500ml
console.log("Freshi Apple Juice 500ml:", getSmartUnitAttributes({ size: '500', unit: 'ml' }));

// 4. Vera Oil 1L
console.log("Vera Oil 1L:", getSmartUnitAttributes({ size: '1', unit: 'L' }));

// 5. Loose Cashews (1 KG)
console.log("Loose Cashews 1 KG:", getSmartUnitAttributes({ size: '1', unit: 'KG' }));
