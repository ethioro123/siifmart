# QR Code Printing Integration - Summary

## Overview
Added QR code printing capability as a **secondary option** in the Inventory (Label Printing Hub) and Dispatch (PACK tab shipping labels) sections of Warehouse Operations.

## What Was Implemented

### 1. QR Code Generation Utility (`/utils/qrCodeGenerator.ts`)
Created comprehensive QR code generation utilities:
- **`generateQRCode()`** - Generate QR code as data URL
- **`generateQRCodeLabelHTML()`** - Generate printable single QR label
- **`generateBatchQRCodeLabelsHTML()`** - Generate batch QR labels

**Features:**
- 4" x 2" label format (standard warehouse label size)
- Includes title, subtitle, QR code, and human-readable data
- Print-optimized CSS with proper page breaks
- Print and close buttons in preview

### 2. Label Printing Hub (Inventory Tab)
**Location:** Warehouse Operations → Inventory Tab → Label Printing Hub

**Added Format Selection (Secondary Option):**
```
┌─────────────────────────────────────────┐
│ Label Format                            │
│ ┌──────────────┬──────────────┐        │
│ │ 📊 Barcode   │ 📱 QR Code   │        │
│ │  (Default)   │              │        │
│ └──────────────┴──────────────┘        │
│ 💡 Standard barcode labels for         │
│    traditional scanners                 │
└─────────────────────────────────────────┘
```

**Functionality:**
- **Product Labels**: Enter SKU → Choose format → Print
  - Barcode: Traditional sticker (existing)
  - QR Code: QR label with product name and SKU
  
- **Rack/Bin Labels**: Enter location → Choose format → Print
  - Barcode: Batch PDF (existing)
  - QR Code: QR label with location code

**Visual Hierarchy:**
- Primary: Product/Bin selection tabs (large, prominent)
- Secondary: Format selection (smaller, in subdued box)
- Barcode is default (white/gray styling)
- QR Code is alternative (blue styling when selected)

### 3. Shipping Labels (PACK Tab)
**Location:** Warehouse Operations → PACK Tab → Shipping Label Generation

**Added Format Selection (Secondary Option):**
```
┌─────────────────────────────────────────┐
│ Shipping Label Format                   │
│ ┌──────────────┬──────────────┐        │
│ │ 📊 Barcode   │ 📱 QR Code   │        │
│ └──────────────┴──────────────┘        │
│ 💡 Traditional shipping label           │
└─────────────────────────────────────────┘
```

**Functionality:**
- Appears before "Print Label & Complete" button
- **Barcode (Default)**: Traditional shipping label with alert
- **QR Code**: Generates QR label with tracking data
  - Contains: Tracking #, Carrier, Service, Box Size, Weight
  - Format: `TRACKING:TRK-XXX|CARRIER:SiifMart|SERVICE:Express|BOX:Medium|WEIGHT:2.5kg`

**Button Updates:**
- Barcode: "🖨️ Print Label & Complete"
- QR Code: "📱 Print QR Label & Complete"

## Dependencies Added
- **`qrcode`** - QR code generation library
- **`@types/qrcode`** - TypeScript types for qrcode

## Design Philosophy

### Secondary Option Positioning
QR code printing is implemented as a **secondary/alternative option**:

1. **Visual Hierarchy:**
   - Format selector in subdued box with dark background
   - Smaller text and buttons compared to primary actions
   - Positioned between main inputs and action buttons

2. **Default Behavior:**
   - Barcode is always the default selection
   - Traditional workflow unchanged
   - QR code requires explicit selection

3. **Clear Labeling:**
   - "Barcode (Default)" vs "QR Code"
   - Helpful tips explain each option
   - Different visual styling (white vs blue)

4. **Consistent Pattern:**
   - Same design across Label Printing Hub and PACK tab
   - Same toggle mechanism
   - Same tip text format

## Usage Examples

### Print Product QR Label
1. Go to Inventory tab → Label Printing Hub
2. Select "Product Labels"
3. Click "📱 QR Code" format
4. Enter product SKU
5. Click "📱 Print QR Sticker"
6. QR label opens in new window
7. Click "🖨️ Print QR Label"

### Print Shipping QR Label
1. Go to PACK tab
2. Select a packing job
3. Mark items as packed
4. Click "📱 QR Code" format
5. Click "📱 Print QR Label & Complete"
6. QR shipping label opens in new window
7. Click "🖨️ Print QR Label"

## QR Code Data Formats

### Product Labels
```
SKU-12345
```

### Location Labels
```
A-01-05
```

### Shipping Labels
```
TRACKING:TRK-ABC123XYZ|CARRIER:SiifMart Logistics|SERVICE:Express|BOX:Medium|WEIGHT:2.5kg
```

## Label Specifications

**Size:** 4" x 2" (standard warehouse label)
**QR Code Size:** 150-200px (adjustable)
**Border:** 2px solid black
**Font:** Arial, sans-serif
**Layout:**
- Title (14px, bold)
- Subtitle (10px, gray) - optional
- QR Code (centered)
- Data text (9px, monospace) - for manual entry fallback

## Benefits

### For Warehouse Operations:
1. **Mobile-Friendly**: Workers can scan with phones/tablets
2. **Higher Data Capacity**: QR codes store more information
3. **Better Error Correction**: QR codes work even if partially damaged
4. **Flexible**: Can encode complex shipping data
5. **Modern**: Aligns with modern warehouse technology

### For Inventory Management:
1. **Quick Setup**: No need for barcode scanner hardware
2. **Versatile**: Works with any camera-enabled device
3. **Cost-Effective**: Reduces equipment costs
4. **Easy Updates**: Can encode product URLs, batch numbers, etc.

## Technical Implementation

### State Management
```typescript
const [labelFormat, setLabelFormat] = useState<'BARCODE' | 'QR'>('BARCODE');
```

### QR Generation
```typescript
const labelHTML = await generateQRCodeLabelHTML(
    data,           // QR code data
    title,          // Label title
    subtitle        // Optional subtitle
);
```

### Print Flow
```typescript
const printWindow = window.open('', '_blank');
if (printWindow) {
    printWindow.document.write(labelHTML);
    printWindow.document.close();
}
```

## Files Modified

1. **`/utils/qrCodeGenerator.ts`** - NEW - QR code generation utilities
2. **`/pages/WarehouseOperations.tsx`** - Updated:
   - Added QR code import
   - Added `labelFormat` state
   - Updated Label Printing Hub UI
   - Updated PACK tab shipping label generation

## Files Created

1. **`/utils/qrCodeGenerator.ts`** - QR code generation utilities

## Build Status

✅ Build successful
✅ No TypeScript errors
✅ All dependencies installed

## Future Enhancements

Potential improvements:
1. **Batch QR Printing**: Print multiple QR labels at once
2. **Custom QR Data**: Allow custom data encoding
3. **QR Scanning**: Integrate QR scanner for verification
4. **Label Templates**: Multiple label size options
5. **Logo Integration**: Add company logo to QR labels
6. **Color Options**: Colored QR codes for categorization
