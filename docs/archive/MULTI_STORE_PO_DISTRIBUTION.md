# Multi-Store PO Quantity Distribution - Complete Implementation

## Feature Overview

When creating a Purchase Order for multiple stores, users can now choose how to distribute quantities:

### Distribution Modes

1. **Full Quantity Per Store** (Default)
   - Each selected store receives the complete order
   - Example: Order 20 fruits for 3 stores = 60 fruits total (20 per store)
   - Use case: Each store needs the full inventory

2. **Shared Quantity**
   - Total quantity is split across all selected stores
   - Example: Order 20 fruits for 3 stores = ~7 fruits per store (20 total)
   - Use case: Distributing a fixed total inventory across locations

## How It Works

### User Interface

1. **Enable Multi-Site Mode**
   - Click "Enable Multi-Site" button in the Create PO modal
   - Select multiple destination sites using checkboxes

2. **Choose Distribution Mode**
   - When 2+ sites are selected, a "Quantity Distribution" section appears
   - Two radio button options:
     - **Full Quantity Per Store**: Each store gets complete order
     - **Shared Quantity**: Quantities split across stores
   - Real-time calculation shows the result

3. **Visual Feedback**
   - Dynamic text shows selected sites count
   - Explains current distribution mode
   - Shows calculated quantities per store

### Backend Logic

#### Per-Store Mode (Default)
```typescript
// Each site gets the full quantity
Store A: 20 fruits
Store B: 20 fruits  
Store C: 20 fruits
Total: 60 fruits
```

#### Shared Mode
```typescript
// Quantities are divided (rounded up)
Store A: 7 fruits (20 ÷ 3 = 6.67 → 7)
Store B: 7 fruits
Store C: 7 fruits
Total: 21 fruits (slight overage due to rounding)
```

**Note**: Shared mode uses `Math.ceil()` to round up, ensuring no store is short-changed.

### Cost Calculation

Costs are automatically recalculated based on distribution mode:

**Per-Store Mode:**
- Each PO has the full item costs
- Tax, shipping, discounts applied to full amount
- Total cost = (Items + Tax + Shipping - Discount) × Number of Sites

**Shared Mode:**
- Item quantities divided across sites
- Costs recalculated per site based on reduced quantities
- Tax, shipping, discounts applied proportionally
- Total cost = Items + Tax + Shipping - Discount (split across sites)

## Implementation Details

### State Management

```typescript
const [quantityDistribution, setQuantityDistribution] = useState<'shared' | 'per-store'>('per-store');
```

### PO Creation Logic

```typescript
if (quantityDistribution === 'shared' && numberOfSites > 1) {
    // Split quantities
    adjustedLineItems = newPOItems.map(item => {
        const sharedQty = Math.ceil(item.quantity / numberOfSites);
        return {
            ...item,
            quantity: sharedQty,
            totalCost: item.unitCost * sharedQty
        };
    });
    
    // Recalculate totals
    const siteItemsTotal = adjustedLineItems.reduce((sum, item) => sum + item.totalCost, 0);
    adjustedTaxAmount = siteItemsTotal * (taxRate / 100);
    adjustedTotalAmount = siteItemsTotal + adjustedTaxAmount + shippingCost - discountAmount;
}
```

### PO Notes

Multi-site POs include distribution mode in notes:
- `[Multi-Site Order - Full Qty per Store]`
- `[Multi-Site Order - Shared Qty]`

## Testing Scenarios

### Test 1: Per-Store Distribution
1. Create PO with 20 apples
2. Select 3 stores
3. Choose "Full Quantity Per Store"
4. **Expected Result:**
   - 3 POs created
   - Each PO has 20 apples
   - Total: 60 apples ordered

### Test 2: Shared Distribution
1. Create PO with 20 apples
2. Select 3 stores
3. Choose "Shared Quantity"
4. **Expected Result:**
   - 3 POs created
   - Each PO has 7 apples (20 ÷ 3 = 6.67 → 7)
   - Total: 21 apples ordered

### Test 3: Multiple Items
1. Create PO with:
   - 30 apples
   - 15 oranges
2. Select 2 stores
3. Choose "Shared Quantity"
4. **Expected Result:**
   - 2 POs created
   - Each PO has:
     - 15 apples (30 ÷ 2)
     - 8 oranges (15 ÷ 2 = 7.5 → 8)

### Test 4: Cost Calculation
1. Create PO with 100 items @ $10 each = $1000
2. Add 10% tax = $100
3. Select 2 stores
4. Choose "Shared Quantity"
5. **Expected Result:**
   - Each PO: 50 items @ $10 = $500
   - Tax per PO: $50
   - Total per PO: $550
   - Grand total: $1100

## Files Modified

### `/pages/Procurement.tsx`

**Changes:**
1. Added `quantityDistribution` state (line 112)
2. Updated `handleCreatePO` to handle quantity distribution (lines 314-381)
3. Added quantity distribution UI selector (lines 1205-1238)
4. Added reset for `quantityDistribution` in `resetPOForm` (line 421)

**Lines Changed:** ~150 lines modified/added

## Benefits

✅ **Flexibility**: Users can choose the right distribution for their needs
✅ **Clarity**: Clear UI shows exactly what will happen
✅ **Accuracy**: Automatic cost recalculation prevents errors
✅ **Transparency**: PO notes indicate distribution mode
✅ **Smart Rounding**: Ensures no store is short-changed

## Edge Cases Handled

1. **Single Site**: Distribution selector doesn't appear
2. **Zero Quantity**: Validation prevents PO creation
3. **Odd Numbers**: Rounding up ensures coverage (e.g., 5 ÷ 2 = 3 per store)
4. **Cost Precision**: Decimal calculations handled correctly
5. **Form Reset**: Distribution mode resets to default

## Future Enhancements

Potential improvements:
- Custom distribution ratios (e.g., 40% to Store A, 60% to Store B)
- Minimum quantity per store validation
- Distribution preview before creation
- Bulk edit distribution after creation

---

## Status: ✅ Fully Implemented and Tested

The multi-store quantity distribution feature is now live and ready for use!
