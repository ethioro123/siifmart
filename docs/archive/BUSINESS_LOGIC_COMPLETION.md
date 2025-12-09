# 🎯 Business Logic Completion Plan

## Current Status: 85% → Target: 100%

---

## 📋 Missing Business Logic (15%)

### 1. **Advanced Inventory Management** (Missing 5%)
- [ ] Batch/Lot tracking with FEFO (First Expired, First Out)
- [ ] Automatic reorder point calculations
- [ ] Stock forecasting based on sales velocity
- [ ] Cycle counting schedules
- [ ] Dead stock identification
- [ ] ABC analysis automation

### 2. **Enhanced Financial Logic** (Missing 3%)
- [ ] Multi-currency conversion with live rates
- [ ] Tax calculation by jurisdiction
- [ ] Profit margin analysis per product
- [ ] Cash flow projections
- [ ] Budget vs actual tracking
- [ ] Depreciation calculations

### 3. **Smart Pricing Engine** (Missing 2%)
- [ ] Automated price adjustments based on rules
- [ ] Competitor price monitoring
- [ ] Dynamic pricing based on demand
- [ ] Bulk pricing tiers
- [ ] Time-based promotions (happy hour)
- [ ] Bundle pricing logic

### 4. **Advanced WMS Features** (Missing 2%)
- [ ] Wave picking optimization
- [ ] Route optimization for pickers
- [ ] Slotting optimization (where to store items)
- [ ] Cross-docking logic
- [ ] Kitting/assembly operations
- [ ] Quality control checkpoints

### 5. **Customer Intelligence** (Missing 1%)
- [ ] RFM (Recency, Frequency, Monetary) scoring
- [ ] Customer lifetime value calculation
- [ ] Churn prediction
- [ ] Personalized recommendations
- [ ] Loyalty tier auto-promotion
- [ ] Purchase pattern analysis

### 6. **HR & Scheduling** (Missing 1%)
- [ ] Shift scheduling optimization
- [ ] Labor cost forecasting
- [ ] Performance-based bonuses
- [ ] Attendance pattern analysis
- [ ] Training requirement tracking
- [ ] Commission calculations

### 7. **Data Validation & Business Rules** (Missing 1%)
- [ ] Input sanitization
- [ ] Business rule validation
- [ ] Constraint checking
- [ ] Data integrity checks
- [ ] Duplicate detection
- [ ] Cross-field validation

---

## 🚀 Implementation Plan

### Phase 1: Core Business Rules (Week 1)
**Priority: CRITICAL**

#### 1.1 Input Validation & Sanitization
- Add Zod schemas for all entities
- Implement validation middleware
- Add error messages
- Prevent SQL injection patterns
- Sanitize user inputs

#### 1.2 Business Rule Engine
- Implement rule validation
- Add constraint checking
- Create validation helpers
- Add duplicate detection

#### 1.3 Data Integrity
- Add referential integrity checks
- Implement cascade deletes
- Add orphan cleanup
- Validate foreign keys

### Phase 2: Advanced Inventory (Week 2)
**Priority: HIGH**

#### 2.1 FEFO Implementation
- Sort by expiry date
- Auto-select oldest batches
- Expiry alerts (30, 7, 1 day)
- Batch traceability

#### 2.2 Reorder Point Logic
- Calculate based on lead time
- Factor in safety stock
- Consider sales velocity
- Auto-generate POs

#### 2.3 Stock Forecasting
- Analyze historical sales
- Seasonal adjustments
- Trend detection
- Demand prediction

### Phase 3: Financial Intelligence (Week 3)
**Priority: HIGH**

#### 3.1 Multi-Currency
- Live exchange rates
- Currency conversion
- Multi-currency reporting
- Exchange gain/loss tracking

#### 3.2 Advanced Analytics
- Profit margin per product
- Cost of goods sold (COGS)
- Gross profit calculations
- Break-even analysis

#### 3.3 Cash Flow Management
- Cash flow projections
- Accounts payable aging
- Accounts receivable tracking
- Budget variance analysis

### Phase 4: Smart Pricing (Week 4)
**Priority: MEDIUM**

#### 4.1 Automated Price Rules
- Execute pricing rules automatically
- Time-based price changes
- Inventory-based pricing
- Competitor-based adjustments

#### 4.2 Dynamic Pricing
- Demand-based pricing
- Time-of-day pricing
- Clearance automation
- Bundle pricing

#### 4.3 Promotion Engine
- Auto-apply promotions
- Stacking rules
- Exclusion logic
- Promotion analytics

### Phase 5: WMS Optimization (Week 5)
**Priority: MEDIUM**

#### 5.1 Wave Picking
- Batch multiple orders
- Optimize pick routes
- Zone-based picking
- Pick density optimization

#### 5.2 Slotting Logic
- Fast movers near shipping
- Slow movers in back
- Heavy items low
- Fragile items protected

#### 5.3 Quality Control
- Inspection checkpoints
- Defect tracking
- Quarantine logic
- Approval workflows

### Phase 6: Customer Intelligence (Week 6)
**Priority: LOW**

#### 6.1 RFM Scoring
- Calculate recency score
- Calculate frequency score
- Calculate monetary score
- Segment customers

#### 6.2 Predictive Analytics
- Churn prediction
- Next purchase prediction
- Lifetime value calculation
- Recommendation engine

---

## 📝 Implementation Details

### 1. Input Validation System

**File:** `utils/validation.ts` (NEW)

```typescript
import { z } from 'zod';

// Product validation schema
export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  price: z.number().positive(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  category: z.string().min(1),
  // ... more fields
});

// Sale validation
export const SaleSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1),
  method: z.enum(['Cash', 'Card', 'Mobile Money']),
  // ... more fields
});

// Validation helper
export function validateEntity<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}
```

### 2. FEFO (First Expired, First Out) Logic

**File:** `utils/inventory.ts` (NEW)

```typescript
export function selectBatchesFEFO(
  product: Product,
  quantityNeeded: number,
  allBatches: { batchNumber: string; expiryDate: string; quantity: number }[]
): { batchNumber: string; quantity: number }[] {
  // Sort by expiry date (earliest first)
  const sortedBatches = [...allBatches].sort((a, b) => 
    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  const selected: { batchNumber: string; quantity: number }[] = [];
  let remaining = quantityNeeded;

  for (const batch of sortedBatches) {
    if (remaining <= 0) break;
    
    const takeQty = Math.min(batch.quantity, remaining);
    selected.push({
      batchNumber: batch.batchNumber,
      quantity: takeQty
    });
    remaining -= takeQty;
  }

  return selected;
}

export function getExpiryAlerts(
  products: Product[]
): { urgent: Product[]; warning: Product[]; info: Product[] } {
  const now = new Date();
  const urgent: Product[] = [];
  const warning: Product[] = [];
  const info: Product[] = [];

  for (const product of products) {
    if (!product.expiryDate) continue;
    
    const expiryDate = new Date(product.expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 1) {
      urgent.push(product);
    } else if (daysUntilExpiry <= 7) {
      warning.push(product);
    } else if (daysUntilExpiry <= 30) {
      info.push(product);
    }
  }

  return { urgent, warning, info };
}
```

### 3. Reorder Point Calculation

```typescript
export function calculateReorderPoint(
  product: Product,
  salesHistory: SaleRecord[],
  leadTimeDays: number = 7,
  safetyStockDays: number = 3
): number {
  // Calculate average daily sales
  const dailySales = calculateAverageDailySales(product.id, salesHistory);
  
  // Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
  const reorderPoint = (dailySales * leadTimeDays) + (dailySales * safetyStockDays);
  
  return Math.ceil(reorderPoint);
}

export function calculateAverageDailySales(
  productId: string,
  salesHistory: SaleRecord[],
  days: number = 30
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const relevantSales = salesHistory.filter(sale => 
    new Date(sale.date) >= cutoffDate
  );

  let totalQuantity = 0;
  for (const sale of relevantSales) {
    const item = sale.items.find(i => i.id === productId);
    if (item) totalQuantity += item.quantity;
  }

  return totalQuantity / days;
}

export function shouldReorder(product: Product, reorderPoint: number): boolean {
  return product.stock <= reorderPoint;
}
```

### 4. RFM Customer Scoring

```typescript
export interface RFMScore {
  recency: number; // 1-5 (5 = most recent)
  frequency: number; // 1-5 (5 = most frequent)
  monetary: number; // 1-5 (5 = highest spend)
  total: number; // Sum of above
  segment: 'Champions' | 'Loyal' | 'At Risk' | 'Lost' | 'New';
}

export function calculateRFM(
  customer: Customer,
  sales: SaleRecord[]
): RFMScore {
  const now = new Date();
  const customerSales = sales.filter(s => s.customerId === customer.id);

  // Recency: Days since last purchase
  const lastPurchase = new Date(customer.lastVisit);
  const daysSinceLastPurchase = Math.floor(
    (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
  );
  const recency = scoreRecency(daysSinceLastPurchase);

  // Frequency: Number of purchases
  const frequency = scoreFrequency(customerSales.length);

  // Monetary: Total spend
  const monetary = scoreMonetary(customer.totalSpent);

  const total = recency + frequency + monetary;
  const segment = determineSegment(recency, frequency, monetary);

  return { recency, frequency, monetary, total, segment };
}

function scoreRecency(days: number): number {
  if (days <= 7) return 5;
  if (days <= 30) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function scoreFrequency(purchases: number): number {
  if (purchases >= 20) return 5;
  if (purchases >= 10) return 4;
  if (purchases >= 5) return 3;
  if (purchases >= 2) return 2;
  return 1;
}

function scoreMonetary(totalSpent: number): number {
  if (totalSpent >= 10000) return 5;
  if (totalSpent >= 5000) return 4;
  if (totalSpent >= 1000) return 3;
  if (totalSpent >= 500) return 2;
  return 1;
}

function determineSegment(r: number, f: number, m: number): RFMScore['segment'] {
  const total = r + f + m;
  if (total >= 13 && r >= 4) return 'Champions';
  if (total >= 10 && f >= 3) return 'Loyal';
  if (total >= 7 && r <= 2) return 'At Risk';
  if (r === 1) return 'Lost';
  return 'New';
}
```

### 5. Automated Pricing Rules Engine

```typescript
export function executePricingRules(
  products: Product[],
  rules: PricingRule[],
  sales: SaleRecord[]
): Product[] {
  const updatedProducts = [...products];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    for (let i = 0; i < updatedProducts.length; i++) {
      const product = updatedProducts[i];
      
      if (product.category !== rule.targetCategory) continue;

      const shouldApply = evaluateCondition(product, rule, sales);
      
      if (shouldApply) {
        updatedProducts[i] = applyPricingAction(product, rule);
      }
    }
  }

  return updatedProducts;
}

function evaluateCondition(
  product: Product,
  rule: PricingRule,
  sales: SaleRecord[]
): boolean {
  switch (rule.condition) {
    case 'Stock > X':
      return product.stock > rule.threshold;
    
    case 'Expiry < X Days':
      if (!product.expiryDate) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry < rule.threshold;
    
    case 'Sales < X':
      const productSales = sales.filter(s => 
        s.items.some(i => i.id === product.id)
      ).length;
      return productSales < rule.threshold;
    
    default:
      return false;
  }
}

function applyPricingAction(product: Product, rule: PricingRule): Product {
  let newPrice = product.price;

  switch (rule.action) {
    case 'Decrease Price %':
      newPrice = product.price * (1 - rule.value / 100);
      break;
    
    case 'Increase Price %':
      newPrice = product.price * (1 + rule.value / 100);
      break;
    
    case 'Set to Cost + Margin':
      if (product.costPrice) {
        newPrice = product.costPrice * (1 + rule.value / 100);
      }
      break;
  }

  return {
    ...product,
    salePrice: Math.round(newPrice * 100) / 100,
    isOnSale: newPrice < product.price
  };
}
```

---

## 🎯 Files to Create

1. **`utils/validation.ts`** - Input validation with Zod
2. **`utils/inventory.ts`** - FEFO, reorder points, forecasting
3. **`utils/financial.ts`** - Multi-currency, profit calculations
4. **`utils/pricing.ts`** - Automated pricing engine
5. **`utils/customer.ts`** - RFM scoring, analytics
6. **`utils/wms.ts`** - Wave picking, slotting
7. **`utils/hr.ts`** - Scheduling, performance
8. **`utils/analytics.ts`** - Business intelligence

---

## 📊 Success Metrics

### Before (85%)
- Basic CRUD operations
- Simple calculations
- Manual processes
- No validation
- No automation

### After (100%)
- ✅ Full validation on all inputs
- ✅ Automated reordering
- ✅ Smart pricing adjustments
- ✅ FEFO batch selection
- ✅ Customer segmentation
- ✅ Predictive analytics
- ✅ WMS optimization
- ✅ Financial intelligence

---

## 🚀 Next Steps

1. Review this plan
2. Approve implementation approach
3. Start with Phase 1 (Validation)
4. Implement utils files
5. Integrate into DataContext
6. Test thoroughly
7. Update UI to use new features

---

**Estimated Time:** 6 weeks (1 week per phase)  
**Complexity:** High  
**Impact:** Transforms app from good to enterprise-grade
