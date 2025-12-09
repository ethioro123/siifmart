# 🚀 Business Logic Quick Reference

## 📚 Utility Modules Overview

### 1. `utils/validation.ts` - Input Validation

```typescript
import { validateProduct, validateCustomer, validateSale } from './utils/validation';

// Validate before adding
const result = validateProduct(newProduct);
if (result.isValid) {
  addProduct(result.data);
} else {
  showErrors(result.errors);
}
```

**Key Functions:**
- `validateProduct()` - Validate product data
- `validateCustomer()` - Validate customer data
- `validateEmployee()` - Validate employee data
- `validateSupplier()` - Validate supplier data
- `validatePurchaseOrder()` - Validate PO data
- `validateSale()` - Validate sale transaction
- `sanitizeString()` - Remove dangerous characters
- `isDuplicateSKU()` - Check for duplicate SKUs
- `canDeleteProduct()` - Business rule check

---

### 2. `utils/inventory.ts` - Inventory Intelligence

```typescript
import { 
  calculateReorderPoint, 
  performABCAnalysis,
  getExpiryAlerts,
  identifyDeadStock 
} from './utils/inventory';

// Auto-calculate when to reorder
const reorderPoint = calculateReorderPoint(product, sales, 7, 3);
if (product.stock <= reorderPoint) {
  createPurchaseOrder();
}

// ABC Analysis
const abc = performABCAnalysis(products, sales);
const aItems = abc.filter(r => r.class === 'A'); // Focus here!

// Expiry alerts
const alerts = getExpiryAlerts(products);
console.log(`${alerts.urgent.length} products expiring soon!`);
```

**Key Functions:**
- `selectBatchesFEFO()` - Pick oldest batches first
- `getExpiryAlerts()` - Get expiry warnings
- `calculateReorderPoint()` - When to reorder
- `shouldReorder()` - Check if reorder needed
- `forecastDemand()` - Predict future demand
- `performABCAnalysis()` - Classify by value
- `identifyDeadStock()` - Find slow movers
- `calculateStockVelocity()` - How fast it sells
- `generateCycleCountSchedule()` - Plan counts
- `calculateOptimalStock()` - Ideal stock level

---

### 3. `utils/customer.ts` - Customer Intelligence

```typescript
import { 
  calculateRFM, 
  predictChurnRisk,
  calculateCLV,
  segmentCustomer 
} from './utils/customer';

// RFM Analysis
const rfm = calculateRFM(customer, sales);
// Returns: { recency: 5, frequency: 4, monetary: 5, segment: 'Champions' }

// Churn Risk
const churn = predictChurnRisk(customer, sales);
if (churn.risk === 'High') {
  sendWinBackCampaign(customer);
}

// Customer Lifetime Value
const clv = calculateCLV(customer, sales);
console.log(`This customer is worth $${clv} over 3 years`);

// Segmentation
const segment = segmentCustomer(customer, sales);
console.log(segment.recommendedAction);
```

**Key Functions:**
- `calculateRFM()` - Recency, Frequency, Monetary score
- `calculateCLV()` - Customer lifetime value
- `predictChurnRisk()` - Risk of losing customer
- `segmentCustomer()` - Classify customer type
- `analyzePurchasePattern()` - Shopping habits
- `generateRecommendations()` - Product suggestions
- `calculateLoyaltyTier()` - Bronze/Silver/Gold/Platinum
- `shouldPromoteTier()` - Check for upgrade

---

### 4. `utils/pricing.ts` - Pricing Intelligence

```typescript
import { 
  executePricingRules,
  calculateDynamicPrice,
  calculateProfitAnalysis 
} from './utils/pricing';

// Auto-apply pricing rules
const updated = executePricingRules(products, rules, sales);

// Dynamic pricing
const factors = {
  demandMultiplier: 1.2,    // High demand
  competitorMultiplier: 0.95, // Competitor cheaper
  inventoryMultiplier: 1.0,   // Normal stock
  timeMultiplier: 1.1         // Peak hours
};
const dynamicPrice = calculateDynamicPrice(product, factors);

// Profit analysis
const profit = calculateProfitAnalysis(sales, expenses, products);
console.log(`Gross Margin: ${profit.grossMargin}%`);
```

**Key Functions:**
- `executePricingRules()` - Apply automated rules
- `calculateDynamicPrice()` - Real-time pricing
- `calculateProfitAnalysis()` - P&L metrics
- `calculateProductProfit()` - Per-product profit
- `calculateBreakEven()` - Break-even point
- `convertCurrency()` - Multi-currency
- `calculateOptimalPrice()` - Best price point
- `suggestBundles()` - Bundle recommendations
- `calculateTax()` - Tax calculation

---

## 🎯 Common Use Cases

### Use Case 1: Adding a New Product
```typescript
import { validateProduct, isDuplicateSKU } from './utils/validation';

function addNewProduct(productData) {
  // Check for duplicate SKU
  if (isDuplicateSKU(productData.sku, allProducts)) {
    return { error: 'SKU already exists' };
  }

  // Validate
  const validation = validateProduct(productData);
  if (!validation.isValid) {
    return { error: validation.errors.join(', ') };
  }

  // Add product
  addProduct(validation.data);
  return { success: true };
}
```

### Use Case 2: Automated Reordering
```typescript
import { calculateReorderPoint, shouldReorder } from './utils/inventory';

function checkReorderNeeds() {
  const needsReorder = [];

  for (const product of products) {
    const reorderPoint = calculateReorderPoint(product, sales, 7, 3);
    
    if (shouldReorder(product, reorderPoint)) {
      needsReorder.push({
        product,
        currentStock: product.stock,
        reorderPoint,
        recommendedQty: reorderPoint * 2
      });
    }
  }

  return needsReorder;
}
```

### Use Case 3: Customer Segmentation Campaign
```typescript
import { segmentCustomer, predictChurnRisk } from './utils/customer';

function createTargetedCampaigns() {
  const campaigns = {
    vip: [],
    atRisk: [],
    new: []
  };

  for (const customer of customers) {
    const segment = segmentCustomer(customer, sales);
    const churn = predictChurnRisk(customer, sales);

    if (segment.segment === 'VIP') {
      campaigns.vip.push({ customer, action: 'Exclusive offer' });
    } else if (churn.risk === 'High') {
      campaigns.atRisk.push({ customer, action: 'Win-back discount' });
    } else if (segment.segment === 'New') {
      campaigns.new.push({ customer, action: 'Welcome bonus' });
    }
  }

  return campaigns;
}
```

### Use Case 4: Dynamic Pricing at Checkout
```typescript
import { calculateDynamicPrice, calculateDemandMultiplier } from './utils/pricing';

function getPriceAtCheckout(product) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const factors = {
    demandMultiplier: calculateDemandMultiplier(product, sales),
    competitorMultiplier: calculateCompetitorMultiplier(product),
    inventoryMultiplier: calculateInventoryMultiplier(product),
    timeMultiplier: calculateTimeMultiplier(hour, day)
  };

  return calculateDynamicPrice(product, factors);
}
```

### Use Case 5: Expiry Management
```typescript
import { getExpiryAlerts, selectBatchesFEFO } from './utils/inventory';

function manageExpiry() {
  // Get alerts
  const alerts = getExpiryAlerts(products);

  // Urgent: Discount heavily
  for (const product of alerts.urgent) {
    applyDiscount(product, 50); // 50% off
  }

  // Warning: Moderate discount
  for (const product of alerts.warning) {
    applyDiscount(product, 25); // 25% off
  }

  // When picking, use FEFO
  const batches = selectBatchesFEFO(productId, quantity, allBatches);
  return batches; // Oldest first
}
```

---

## 📊 Analytics Dashboard Integration

### Dashboard Metrics to Add

```typescript
import { 
  performABCAnalysis,
  calculateProfitAnalysis,
  identifyDeadStock 
} from './utils';

function getDashboardMetrics() {
  // ABC Analysis
  const abc = performABCAnalysis(products, sales);
  const aItems = abc.filter(r => r.class === 'A');

  // Profit Analysis
  const profit = calculateProfitAnalysis(sales, expenses, products);

  // Dead Stock
  const deadStock = identifyDeadStock(products, sales, 90);
  const deadStockValue = deadStock.reduce((sum, d) => sum + d.stockValue, 0);

  // Expiry Alerts
  const expiry = getExpiryAlerts(products);

  // Customer Segments
  const segments = customers.map(c => segmentCustomer(c, sales));
  const vipCount = segments.filter(s => s.segment === 'VIP').length;
  const atRiskCount = segments.filter(s => s.segment === 'At Risk').length;

  return {
    aItemsCount: aItems.length,
    grossMargin: profit.grossMargin,
    netProfit: profit.netProfit,
    deadStockValue,
    urgentExpiry: expiry.urgent.length,
    vipCustomers: vipCount,
    atRiskCustomers: atRiskCount
  };
}
```

---

## 🔄 Automation Opportunities

### 1. Daily Pricing Updates
```typescript
// Run every day at 6 AM
function dailyPricingUpdate() {
  const updated = executePricingRules(products, pricingRules, sales);
  updateProducts(updated);
  logEvent('Pricing rules executed');
}
```

### 2. Weekly Reorder Check
```typescript
// Run every Monday
function weeklyReorderCheck() {
  const needsReorder = checkReorderNeeds();
  
  for (const item of needsReorder) {
    createAutoPurchaseOrder(item);
  }
  
  sendNotification(`${needsReorder.length} products reordered`);
}
```

### 3. Monthly Customer Analysis
```typescript
// Run on 1st of month
function monthlyCustomerAnalysis() {
  const churnRisks = customers
    .map(c => ({ customer: c, risk: predictChurnRisk(c, sales) }))
    .filter(r => r.risk.risk === 'High');

  sendMarketingReport(churnRisks);
}
```

---

## 🎓 Best Practices

### 1. Always Validate Input
```typescript
// ❌ Bad
function addProduct(product) {
  products.push(product);
}

// ✅ Good
function addProduct(product) {
  const validation = validateProduct(product);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  products.push(validation.data);
}
```

### 2. Use FEFO for Perishables
```typescript
// ✅ Always use FEFO for items with expiry dates
const batches = selectBatchesFEFO(productId, quantity, allBatches);
```

### 3. Monitor ABC Items
```typescript
// ✅ Focus on A items (80% of revenue)
const abc = performABCAnalysis(products, sales);
const aItems = abc.filter(r => r.class === 'A');
// Give A items priority in everything
```

### 4. Act on Churn Predictions
```typescript
// ✅ Proactive retention
const atRisk = customers.filter(c => 
  predictChurnRisk(c, sales).risk === 'High'
);
sendWinBackCampaigns(atRisk);
```

---

## 📱 Mobile/API Integration Ready

All utilities are pure functions - perfect for:
- REST API endpoints
- GraphQL resolvers
- Mobile app logic
- Background jobs
- Webhooks

Example API endpoint:
```typescript
app.post('/api/products/validate', (req, res) => {
  const validation = validateProduct(req.body);
  res.json(validation);
});

app.get('/api/inventory/reorder-needed', (req, res) => {
  const needed = checkReorderNeeds();
  res.json(needed);
});

app.get('/api/customers/:id/analytics', (req, res) => {
  const customer = getCustomer(req.params.id);
  const rfm = calculateRFM(customer, sales);
  const clv = calculateCLV(customer, sales);
  const churn = predictChurnRisk(customer, sales);
  
  res.json({ rfm, clv, churn });
});
```

---

## 🎯 Performance Tips

1. **Cache ABC Analysis** - Run once daily, not on every request
2. **Batch Validations** - Validate multiple items at once
3. **Lazy Load Analytics** - Calculate only when needed
4. **Index by Product ID** - Use Maps for O(1) lookups
5. **Memoize Calculations** - Cache expensive computations

---

## 📚 Further Reading

- **RFM Analysis**: Customer segmentation technique
- **ABC Analysis**: Inventory prioritization method
- **FEFO**: First Expired, First Out rotation
- **EOQ**: Economic Order Quantity formula
- **CLV**: Customer Lifetime Value calculation
- **Price Elasticity**: How demand changes with price

---

*Quick Reference Guide - SIIFMART Business Logic v1.0*
