# 🚀 HQ ENHANCEMENTS - QUICK REFERENCE

## 📊 Analytics Functions

```typescript
import { 
  calculateRevenueTrend,
  forecastSales,
  predictStockDepletion,
  calculateCategoryDistribution,
  detectAnomalies
} from '../utils/analytics';
```

### Revenue Trend (7 days)
```typescript
const trend = calculateRevenueTrend(sales);
// Returns: [{ date, value, label }, ...]
```

### Sales Forecast
```typescript
const forecast = forecastSales(sales, 7);
// Returns: { predicted, confidence, trend, change }
```

### Stock Depletion
```typescript
const depletion = predictStockDepletion(product, sales);
// Returns: { daysUntilEmpty, depletionDate, dailyRate } | null
```

### Category Distribution
```typescript
const categories = calculateCategoryDistribution(products);
// Returns: [{ name, value, count }, ...]
```

---

## 📤 Export Functions

```typescript
import {
  exportSalesToPDF,
  exportSalesToExcel,
  exportInventoryToExcel,
  exportSitePerformanceToPDF,
  exportToCSV
} from '../utils/exports';
```

### Export Sales
```typescript
exportSalesToPDF(sales, 'sales_report.pdf');
exportSalesToExcel(sales, 'sales_report.xlsx');
```

### Export Inventory
```typescript
exportInventoryToExcel(sites, products, 'inventory.xlsx');
```

### Export Site Performance
```typescript
exportSitePerformanceToPDF(sites, salesData, 'performance.pdf');
```

### Generic CSV
```typescript
exportToCSV(data, 'export.csv');
```

---

## 🗺️ Map Component

```typescript
import NetworkMap from '../components/NetworkMap';

<NetworkMap 
  sites={sites}
  products={products}
  onSiteClick={(site) => setActiveSite(site.id)}
/>
```

**Note:** Sites need `latitude` and `longitude` fields.

---

## 💡 Quick Integration Examples

### Add to HQ Dashboard
```tsx
// Revenue Trend Chart
const trendData = useMemo(() => calculateRevenueTrend(allSales), [allSales]);

<AreaChart data={trendData}>
  <Area dataKey="value" stroke="#00ff9d" fill="#00ff9d" />
</AreaChart>
```

### Add to Sales History
```tsx
// Export Buttons
<button onClick={() => exportSalesToPDF(filteredSales)}>
  📄 PDF
</button>
<button onClick={() => exportSalesToExcel(filteredSales)}>
  📊 Excel
</button>
```

### Add to Network Inventory
```tsx
// Map View
{viewMode === 'map' && (
  <NetworkMap sites={sites} products={allProducts} />
)}
```

---

## 🎯 Common Patterns

### Memoize Analytics
```tsx
const forecast = useMemo(() => 
  forecastSales(sales, 7), 
  [sales]
);
```

### Conditional Rendering
```tsx
{depletion && depletion.daysUntilEmpty < 7 && (
  <Alert>Stock running low!</Alert>
)}
```

### Export with Filename
```tsx
const filename = `sales_${dateRange.start}_${dateRange.end}.pdf`;
exportSalesToPDF(filteredSales, filename);
```

---

## 📦 Dependencies

Already installed:
- `react-leaflet` - Map component
- `leaflet` - Map library
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF tables
- `xlsx` - Excel generation

---

## ✅ Checklist

- [ ] Import analytics functions
- [ ] Add charts to HQ Dashboard
- [ ] Add export buttons to Sales History
- [ ] Add map view to Network Inventory
- [ ] Add predictive alerts
- [ ] Test all exports
- [ ] Add site coordinates for map

---

**Ready to use! All utilities are production-ready.** 🚀
