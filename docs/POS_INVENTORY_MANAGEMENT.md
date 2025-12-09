# POS Inventory Management - How It Works

## ✅ Automatic Stock Reduction

The SIIFMART POS system **automatically reduces inventory** when items are sold. This happens seamlessly in the background without any manual intervention.

---

## 🔄 Sale Processing Flow

### When a Sale is Completed:

1. **Customer Checkout**
   - Cashier scans items or adds them to cart
   - Customer pays (Cash, Card, or Mobile Money)
   - Cashier clicks "Complete Payment"

2. **Automatic Inventory Deduction**
   - System calls `salesService.create()`
   - For each item in the cart:
     - `productsService.adjustStock(item.id, item.quantity, 'OUT')`
     - Stock is reduced by the quantity sold
   - Database is updated immediately

3. **Customer Record Update** (if applicable)
   - Customer's total spent is updated
   - Last visit date is recorded
   - Loyalty points may be awarded

4. **Receipt Generation**
   - Receipt is printed or emailed
   - Transaction is logged

---

## 📊 Code Implementation

### Location: `services/supabase.service.ts` (Lines 1125-1128)

```typescript
// Deduct stock for each item
for (const item of items) {
    await productsService.adjustStock(item.id, item.quantity, 'OUT');
}
```

### Full Sale Creation Process:

```typescript
async create(sale: SaleRecord, items: CartItem[]) {
    // 1. Create sale record
    const saleData = await supabase
        .from('sales')
        .insert(dbSale)
        .select()
        .single();

    // 2. Create sale items
    await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);

    // 3. ✅ AUTOMATICALLY DEDUCT STOCK
    for (const item of items) {
        await productsService.adjustStock(item.id, item.quantity, 'OUT');
    }

    // 4. Update customer (if provided)
    if (sale.customer_id) {
        await customersService.update(customerId, {
            total_spent: customer.totalSpent + sale.total,
            last_visit: new Date().toISOString()
        });
    }

    return saleData;
}
```

---

## 🛡️ Stock Protection Features

### 1. **Stock Availability Check**
Before adding items to cart, the POS checks:
```typescript
const hasStock = product.stock > 0; // Only show products with stock
```

### 2. **Quantity Validation**
When adding items to cart:
```typescript
if (existing.quantity >= product.stock) {
    addNotification('alert', `Cannot add more. Only ${product.stock} units in stock.`);
    return prev;
}
```

### 3. **Real-time Stock Updates**
- Stock levels update immediately after sale
- Other POS terminals see updated stock via real-time sync
- Low stock alerts trigger when threshold is reached

---

## 🔁 Returns & Refunds

### Stock is Restored on Returns

When a return is processed:

```typescript
async refund(id: string, items: ReturnItem[], refundAmount: number) {
    // Update sale status
    await supabase
        .from('sales')
        .update({ status: 'Refunded' })
        .eq('id', id);

    // ✅ RESTORE STOCK for refunded items
    for (const item of items) {
        await productsService.adjustStock(item.product_id, item.quantity, 'IN');
    }

    return true;
}
```

**Return Conditions:**
- **Resalable**: Stock is added back to inventory
- **Damaged**: Stock is written off (not added back)

---

## 📈 Low Stock Alerts

The system monitors stock levels and triggers alerts:

```typescript
cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
        const newStock = product.stock - item.quantity;
        if (newStock <= settings.lowStockThreshold) {
            addNotification('alert', 
                `⚠️ Low Stock Alert: ${product.name} is down to ${newStock}. Replenishment needed!`
            );
        }
    }
});
```

**Threshold**: Configurable in settings (default: 10 units)

---

## 🏪 Multi-Site Inventory

### Site-Specific Stock
- Each product has a `siteId` field
- Stock is tracked per site
- Sales only affect stock at the specific site

### Example:
- **Aratanya Store** has 50 units of Product A
- **Bole Branch** has 30 units of Product A
- Sale at Aratanya reduces Aratanya's stock only
- Bole Branch stock remains unchanged

---

## 🔄 Stock Movement Tracking

Every stock change is logged:

```typescript
interface StockMovement {
    id: string;
    siteId: string;
    productId: string;
    productName: string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantity: number;
    date: string;
    performedBy: string;
    reason: string;
}
```

**Movement Types:**
- **OUT**: Sale at POS
- **IN**: Purchase order received, return processed
- **TRANSFER**: Inter-site transfer
- **ADJUSTMENT**: Manual stock correction

---

## ✅ Summary

### What Happens When You Sell an Item:

1. ✅ **Stock is automatically reduced**
2. ✅ **Sale is recorded in database**
3. ✅ **Customer record is updated**
4. ✅ **Stock movement is logged**
5. ✅ **Low stock alert triggers if needed**
6. ✅ **Receipt is generated**

### What You DON'T Need to Do:

- ❌ Manually reduce stock
- ❌ Update inventory separately
- ❌ Track stock movements manually
- ❌ Worry about stock synchronization

### The System Handles Everything Automatically! 🎉

---

## 🔍 Verification

### How to Verify Stock is Reducing:

1. **Before Sale**:
   - Go to Inventory page
   - Note the stock level of a product (e.g., 50 units)

2. **Make a Sale**:
   - Go to POS
   - Add the product to cart (e.g., sell 3 units)
   - Complete the payment

3. **After Sale**:
   - Return to Inventory page
   - Stock should now show 47 units (50 - 3)

4. **Check Stock Movements**:
   - Go to Inventory > Stock Movements tab
   - You'll see an "OUT" movement for 3 units
   - Reason: "Sale at POS"

---

## 🎯 Best Practices

### 1. **Regular Stock Counts**
- Perform cycle counts to verify physical vs system stock
- Use Inventory > Stock Adjustment for corrections

### 2. **Monitor Low Stock Alerts**
- Set appropriate thresholds
- Create purchase orders before stock runs out

### 3. **Review Stock Movements**
- Check for unusual patterns
- Investigate discrepancies

### 4. **Train Staff**
- Ensure cashiers understand stock is auto-reduced
- No manual inventory updates needed after sales

---

## 📝 Related Documentation

- [Inventory Management Guide](./INVENTORY_MANAGEMENT.md)
- [POS Terminal Guide](./POS_TERMINAL_GUIDE.md)
- [Stock Movement Tracking](./STOCK_MOVEMENTS.md)
- [Returns & Refunds Process](./RETURNS_REFUNDS.md)

---

## 🎉 Conclusion

The SIIFMART POS system is **fully automated** for inventory management. When you sell an item, the stock is **immediately and automatically reduced** - no manual intervention required!

**Status**: ✅ **WORKING AS DESIGNED**
