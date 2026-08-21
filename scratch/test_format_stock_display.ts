import { formatStockDisplay } from '../utils/units';

console.log("=== TESTING formatStockDisplay ===");

// 1. Loose Cashews (sold by KG)
console.log("Loose Cashews (184.5 KG):", formatStockDisplay(184.5, { unit: 'KG', size: '1' }));
console.log("Loose Cashews (22 KG):", formatStockDisplay(22, { unit: 'KG' }));
console.log("Loose Onions (105 KG):", formatStockDisplay(105, { unit: 'KG' }));

// 2. Buna Tea 400g pack (UNIT)
console.log("Buna Tea 400g (20 UNIT):", formatStockDisplay(20, { unit: 'UNIT', size: '400' }));

// 3. Dalo Sugar 5kg pack (UNIT)
console.log("Dalo Sugar 5kg (20 UNIT):", formatStockDisplay(20, { unit: 'UNIT', size: '5' }));

// 4. Vera Oil 1L (L)
console.log("Vera Oil 1L (210 L):", formatStockDisplay(210, { unit: 'L' }));

// 5. Apple Watch (UNIT)
console.log("Apple Watch (12 UNIT):", formatStockDisplay(12, { unit: 'UNIT' }));
