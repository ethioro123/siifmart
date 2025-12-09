# Dashboard Cards Investigation Report

## 📊 Main Dashboard Analysis

### Location: `pages/Dashboard.tsx`

---

## 🎯 Dashboard Cards Overview

### **Card 1: Site Revenue**
- **Line**: 291-300
- **Title**: "Site Revenue"
- **Value**: `formatCurrency(totalRevenue)`
- **Data Source**: Calculated from `sales` filtered by `activeSite?.id`
- **Site ID Usage**: ✅ Uses `activeSite?.id` correctly
- **New Site ID**: Will work with `HQ`, `WH-001`, `ST-001`, etc.
- **Route**: `/finance`

```typescript
<ClickableKPICard
   title="Site Revenue"
   value={formatCurrency(totalRevenue)}
   sub="vs. last week"
   trend="up"
   trendValue="21.4"
   icon={DollarSign}
   color="text-cyber-primary"
   route={METRIC_ROUTES.revenue}
/>
```

---

### **Card 2A: Bin Utilization** (Warehouse Only)
- **Line**: 302-312
- **Title**: "Bin Utilization"
- **Value**: `${activeSite.capacity}%`
- **Data Source**: `activeSite.capacity` field
- **Site ID Usage**: ✅ Uses `activeSite` object
- **Condition**: Only shown when `activeSite?.type === 'Warehouse'`
- **New Site ID**: Will work with `WH-001`
- **Route**: `/wms-ops`

```typescript
{activeSite?.type === 'Warehouse' ? (
   <ClickableKPICard
      title="Bin Utilization"
      value={`${(activeSite.capacity || 75)}%`}
      sub="Storage Density"
      trend="up"
      trendValue="2.5"
      icon={Target}
      color="text-blue-400"
      route={METRIC_ROUTES.wms}
   />
) : (
```

---

### **Card 2B: Net Profit** (Store/HQ)
- **Line**: 314-324
- **Title**: "Net Profit"
- **Value**: `formatCurrency(netProfit)`
- **Data Source**: Calculated from `sales` and `products`
- **Site ID Usage**: ✅ Uses `activeSite?.id` in calculations
- **Condition**: Shown when NOT a warehouse
- **New Site ID**: Will work with `HQ`, `ST-001`, `ST-002`, etc.
- **Route**: `/finance`

```typescript
<ClickableKPICard
   title="Net Profit"
   value={formatCurrency(netProfit)}
   sub={`Margin: ${profitMargin}%`}
   trend="up"
   trendValue="8.2"
   icon={Target}
   color="text-blue-400"
   route={METRIC_ROUTES.finance}
/>
```

---

### **Card 3A: Inbound Trucks** (Warehouse Only)
- **Line**: 326-336
- **Title**: "Inbound Trucks"
- **Value**: `metrics.inboundPOs`
- **Data Source**: Count of pending purchase orders
- **Site ID Usage**: ✅ Uses `activeSite?.id` in metrics calculation
- **Condition**: Only shown when `activeSite?.type === 'Warehouse'`
- **New Site ID**: Will work with `WH-001`
- **Route**: `/procurement`

```typescript
{activeSite?.type === 'Warehouse' ? (
   <ClickableKPICard
      title="Inbound Trucks"
      value={metrics.inboundPOs}
      sub="Scheduled Today"
      trend="down"
      trendValue="1"
      icon={Truck}
      color="text-purple-400"
      route={METRIC_ROUTES.procurement}
   />
) : (
```

---

### **Card 3B: Avg Basket Value** (Store/HQ)
- **Line**: 338-347
- **Title**: "Avg Basket Value"
- **Value**: `formatCurrency(parseFloat(avgBasket))`
- **Data Source**: Average sale amount from `sales`
- **Site ID Usage**: ✅ Uses `activeSite?.id` in calculations
- **Condition**: Shown when NOT a warehouse
- **New Site ID**: Will work with `HQ`, `ST-001`, `ST-002`, etc.

```typescript
<ClickableKPICard
   title="Avg Basket Value"
   value={formatCurrency(parseFloat(avgBasket))}
   sub="Items per cart: 4.2"
   trend="down"
   trendValue="2.1"
   icon={ShoppingCart}
   color="text-purple-400"
/>
```

---

### **Card 4: Inventory Value**
- **Line**: 349-358
- **Title**: "Inventory Value"
- **Value**: `${totalStockValue / 1000000}M`
- **Data Source**: Sum of `price * stock` for all products at site
- **Site ID Usage**: ✅ Uses `activeSite?.id` to filter products
- **New Site ID**: Will work with all site IDs
- **Route**: `/inventory`

```typescript
<ClickableKPICard
   title="Inventory Value"
   value={`${CURRENCY_SYMBOL} ${(totalStockValue / 1000000).toFixed(1)}M`}
   sub={`${stockCount.toLocaleString()} units on hand`}
   trend="up"
   trendValue="12"
   icon={Package}
   color="text-yellow-400"
   route={METRIC_ROUTES.inventory}
/>
```

---

## 🌐 Network Control Tower (Admin Only)

### **Enterprise Supply Chain Cards**
- **Line**: 252-287
- **Title**: "Enterprise Supply Chain"
- **Data Source**: `networkStats` - calculated from `allProducts` and `sites`
- **Site ID Usage**: ⚠️ **CRITICAL - Uses `site.id` directly**
- **Code**:

```typescript
const networkStats = useMemo(() => {
   if (!allProducts || !sites) return [];
   return sites.map(site => {
      const siteStock = allProducts.filter(p => p.siteId === site.id).reduce((acc, p) => acc + (p.price * p.stock), 0);
      return {
         name: site.name,
         type: site.type,
         value: siteStock,
         count: allProducts.filter(p => p.siteId === site.id).reduce((acc, p) => acc + p.stock, 0)
      };
   });
}, [allProducts, sites]);
```

**Status**: ✅ **WILL WORK** - Filters products by `p.siteId === site.id`, which will match the new IDs

**Displays**:
- Site icon (Warehouse/Store)
- Site name
- SKU count
- Stock value
- Visual progress bar

---

## 📍 Header Information

### **Site Context Display**
- **Line**: 198-232
- **Shows**:
  - Site type badge (Warehouse/Store/HQ)
  - Site name
  - **Location ID**: `activeSite?.id` ⚠️ **DISPLAYS SITE ID**
  - Manager name

```typescript
<p className="text-gray-400 text-sm mt-2 max-w-md">
   Location ID: <span className="font-mono text-white">{activeSite?.id}</span> • Manager: <span className="text-white">{activeSite?.manager || 'Unassigned'}</span>
</p>
```

**Before**: `Location ID: SITE-001`  
**After**: `Location ID: WH-001` ✅ **CLEANER!**

---

## 🔍 Metrics Calculation Engine

### **Location**: `utils/metrics.ts`
### **Function**: `calculateMetrics()`

**Parameters**:
```typescript
calculateMetrics(
   sales,
   products,
   jobs,
   orders,
   employees,
   movements,
   activeSite?.id  // ⚠️ Site ID passed here
)
```

**Usage in metrics.ts**:
```typescript
export function calculateMetrics(
   sales: SaleRecord[],
   products: Product[],
   jobs: WMSJob[],
   orders: PurchaseOrder[],
   employees: Employee[],
   movements: StockMovement[],
   siteId?: string
) {
   // Filter by siteId if provided
   const siteSales = siteId ? sales.filter(s => s.siteId === siteId) : sales;
   const siteProducts = siteId ? products.filter(p => p.siteId === siteId) : products;
   // ... etc
}
```

**Status**: ✅ **WILL WORK** - Filters by `siteId` which will match new IDs

---

## ✅ Site ID Compatibility Assessment

### **All Dashboard Cards**:

| Card | Data Source | Site ID Filter | New ID Compatible | Notes |
|------|-------------|----------------|-------------------|-------|
| Site Revenue | `sales` | `activeSite?.id` | ✅ Yes | Filters sales by site |
| Bin Utilization | `activeSite.capacity` | Direct property | ✅ Yes | Uses site object |
| Net Profit | `sales` + `products` | `activeSite?.id` | ✅ Yes | Calculated from filtered data |
| Inbound Trucks | `orders` | `activeSite?.id` | ✅ Yes | Filters POs by site |
| Avg Basket | `sales` | `activeSite?.id` | ✅ Yes | Average of site sales |
| Inventory Value | `products` | `activeSite?.id` | ✅ Yes | Sum of site products |
| Network Cards | `allProducts` + `sites` | `site.id` | ✅ Yes | Maps all sites |

---

## 🎨 Visual Improvements with New Site IDs

### **Before**:
```
Location ID: SITE-001 • Manager: Lensa Merga
Location ID: SITE-002 • Manager: Abdi Rahman
Location ID: HQ-001 • Manager: Shukri Kamal
```

### **After**:
```
Location ID: WH-001 • Manager: Lensa Merga  ✨ Clearer!
Location ID: ST-001 • Manager: Abdi Rahman  ✨ Clearer!
Location ID: HQ • Manager: Shukri Kamal     ✨ Cleaner!
```

---

## 🔧 Required Changes

### ❌ **NO CHANGES NEEDED!**

All dashboard cards use:
- `activeSite?.id` for filtering
- `site.id` for mapping
- `p.siteId === site.id` for comparisons

These will all work correctly with the new site IDs because:
1. The `id` field in the `Site` interface hasn't changed
2. The `siteId` field in products/sales/etc. references `site.id`
3. All comparisons are string-based equality checks

---

## 📊 Dashboard Card Data Flow

```
┌─────────────────┐
│   activeSite    │
│   id: "WH-001"  │ ← New clean ID
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌────────────────┐              ┌──────────────────┐
│ Filter Sales   │              │ Filter Products  │
│ by siteId      │              │ by siteId        │
└────────┬───────┘              └────────┬─────────┘
         │                               │
         ▼                               ▼
┌────────────────┐              ┌──────────────────┐
│ Calculate      │              │ Calculate        │
│ Revenue        │              │ Stock Value      │
└────────┬───────┘              └────────┬─────────┘
         │                               │
         └───────────┬───────────────────┘
                     ▼
            ┌────────────────┐
            │ Display Cards  │
            │ with Metrics   │
            └────────────────┘
```

---

## ✅ Conclusion

### **All Dashboard Cards Are Compatible!**

✅ **Site Revenue** - Works with new IDs  
✅ **Bin Utilization** - Works with new IDs  
✅ **Net Profit** - Works with new IDs  
✅ **Inbound Trucks** - Works with new IDs  
✅ **Avg Basket Value** - Works with new IDs  
✅ **Inventory Value** - Works with new IDs  
✅ **Network Cards** - Works with new IDs  
✅ **Header Display** - Shows cleaner IDs  

### **Visual Improvements**:
- ✨ Cleaner location ID display
- ✨ Easier to identify site type at a glance
- ✨ More professional appearance
- ✨ Better debugging experience

### **No Breaking Changes**:
- ✅ All filtering logic works the same
- ✅ All calculations remain accurate
- ✅ All routes and navigation intact
- ✅ All data flows unchanged

**Status**: ✅ **FULLY COMPATIBLE - NO CHANGES NEEDED**

---

**Investigation Date**: 2025-12-03  
**Investigated By**: Antigravity AI Assistant  
**Result**: All dashboard cards will work seamlessly with new site IDs
