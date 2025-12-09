# Barcode Sizing System Documentation

## 📐 Overview

The SIIFMART application now uses a **standardized barcode sizing system** with 5 preset sizes (tiny to xlarge) to ensure consistent barcode rendering across all components and use cases.

## 🎯 Size Presets

### 1. **TINY** - Compact Display
```typescript
{
  width: 1,
  height: 25,
  fontSize: 8,
  margin: 0,
  displayValue: false
}
```
**Use Cases:**
- Inventory list item previews
- Product cards in grid view
- Quick reference in tables
- Inline displays in compact UI

**Example:** Small barcode preview in the LabelPrintModal

---

### 2. **SMALL** - Modal Previews
```typescript
{
  width: 1,
  height: 35,
  fontSize: 10,
  margin: 2,
  displayValue: true
}
```
**Use Cases:**
- Modal previews
- Compact labels (2" x 1")
- Mobile displays
- Secondary identification

**Example:** Barcode labels for small items

---

### 3. **MEDIUM** - Standard Labels
```typescript
{
  width: 1.5,
  height: 50,
  fontSize: 12,
  margin: 4,
  displayValue: true
}
```
**Use Cases:**
- Standard product labels (4" x 2")
- Receipt printing
- General purpose labels
- Default barcode size

**Example:** Product labels in LabelPrintModal print section

---

### 4. **LARGE** - Warehouse Operations
```typescript
{
  width: 2,
  height: 70,
  fontSize: 14,
  margin: 6,
  displayValue: true
}
```
**Use Cases:**
- Warehouse bin labels
- Shipping labels
- Pallet labels
- High-traffic scanning areas

**Example:** Warehouse location labels, shipping documentation

---

### 5. **XLARGE** - High Visibility
```typescript
{
  width: 3,
  height: 100,
  fontSize: 16,
  margin: 8,
  displayValue: true
}
```
**Use Cases:**
- Warehouse signage
- Large format posters
- High-visibility identification
- Distance scanning

**Example:** Warehouse zone markers, large format signage

---

## 💻 Usage

### In React Components (with react-barcode)

```tsx
import Barcode from 'react-barcode';
import { getBarcodeProps } from '../utils/barcodeConfig';

// Use a preset size
<Barcode value="SM-HQ-ELE-1234" {...getBarcodeProps('medium')} />

// Use a preset with overrides
<Barcode 
  value="SM-HQ-ELE-1234" 
  {...getBarcodeProps('large', { margin: 0 })} 
/>
```

### In Utility Functions (with JsBarcode)

```typescript
import { BARCODE_SIZES } from './barcodeConfig';
import JsBarcode from 'jsbarcode';

const config = BARCODE_SIZES.medium;
JsBarcode(canvas, value, {
  format: 'CODE128',
  width: config.width,
  height: config.height,
  displayValue: config.displayValue,
  fontSize: config.fontSize,
  margin: config.margin
});
```

### Direct Configuration Access

```typescript
import { getBarcodeConfig } from '../utils/barcodeConfig';

const mediumConfig = getBarcodeConfig('medium');
// Returns: { width: 1.5, height: 50, fontSize: 12, margin: 4, displayValue: true }
```

---

## 📁 File Locations

### Core Configuration
- **`utils/barcodeConfig.ts`** - Size presets and helper functions

### Implementation Files
- **`components/LabelPrintModal.tsx`** - Uses `tiny` and `medium` sizes
- **`utils/barcodeGenerator.ts`** - Uses `small` and `medium` as defaults
- **`pages/WarehouseOperations.tsx`** - Uses `generateBarcodeSVG` with custom sizes

### Demo & Testing
- **`public/barcode_sizes.html`** - Interactive showcase of all sizes
- **`public/barcode_test.html`** - Simple barcode rendering test

---

## 🎨 Visual Reference

Visit **`http://localhost:3000/barcode_sizes.html`** to see an interactive showcase of all barcode sizes with:
- Live barcode rendering
- Size specifications
- Use case descriptions
- SKU regeneration

---

## 🔧 Customization

### Adding a New Size Preset

Edit `utils/barcodeConfig.ts`:

```typescript
export const BARCODE_SIZES: Record<BarcodeSize, BarcodeConfig> = {
  // ... existing sizes
  custom: {
    width: 2.5,
    height: 60,
    fontSize: 13,
    margin: 5,
    displayValue: true
  }
};
```

### Overriding Individual Properties

```tsx
// Override just the margin
<Barcode value={sku} {...getBarcodeProps('medium', { margin: 0 })} />

// Override multiple properties
<Barcode 
  value={sku} 
  {...getBarcodeProps('large', { 
    displayValue: false,
    margin: 2 
  })} 
/>
```

---

## ✅ Benefits

1. **Consistency** - Same sizes used across all components
2. **Maintainability** - Change sizes in one place
3. **Readability** - Semantic size names instead of magic numbers
4. **Flexibility** - Easy to override when needed
5. **Documentation** - Clear use cases for each size

---

## 📊 Size Comparison Table

| Size    | Width | Height | Font | Margin | Display | Best For              |
|---------|-------|--------|------|--------|---------|----------------------|
| Tiny    | 1     | 25     | 8    | 0      | No      | Compact UI           |
| Small   | 1     | 35     | 10   | 2      | Yes     | Small Labels         |
| Medium  | 1.5   | 50     | 12   | 4      | Yes     | Standard Labels      |
| Large   | 2     | 70     | 14   | 6      | Yes     | Warehouse Labels     |
| XLarge  | 3     | 100    | 16   | 8      | Yes     | Signage              |

---

## 🚀 Migration Guide

### Before (Hardcoded Values)
```tsx
<Barcode value={sku} width={1.5} height={40} fontSize={12} margin={0} />
```

### After (Using Presets)
```tsx
<Barcode value={sku} {...getBarcodeProps('medium', { margin: 0 })} />
```

---

## 📝 Notes

- All sizes use **SVG rendering** for optimal print quality
- Sizes are optimized for **CODE128** barcode format
- The `displayValue` property controls whether the SKU text appears below the barcode
- Margin values affect spacing around the barcode (useful for label printing)

---

## 🔗 Related Documentation

- [SKU & Barcode Assessment](./SKU_BARCODE_ASSESSMENT.md)
- [Barcode SVG Implementation](./BARCODE_SVG_IMPLEMENTATION.md)
