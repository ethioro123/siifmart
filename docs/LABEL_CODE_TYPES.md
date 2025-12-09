# Label Code Type Configuration

## Overview
Labels now support flexible code generation based on label size:

- **TINY & SMALL:** User chooses between Barcode OR QR Code
- **MEDIUM, LARGE, XL:** Both Barcode AND QR Code (maximum flexibility)

## UI Controls

### Label Size Selector
Five options: TINY | SMALL | MEDIUM | LARGE | XL

### Code Type Toggle (TINY & SMALL only)
- **📊 Barcode** - CODE128 barcode for traditional scanners
- **📱 QR Code** - QR code with metadata for mobile scanning

## Logic

```typescript
const isSmallLabel = labelSize === 'TINY' || labelSize === 'SMALL';
const showBarcode = isSmallLabel ? labelFormat === 'BARCODE' : true;
const showQR = isSmallLabel ? labelFormat === 'QR' : true;
```

## Label Layouts

### TINY/SMALL +  Barcode Only
```
┌─────────────────┐
│  🏢 SIIFMART    │
│  12/06/2025     │
├─────────────────┤
│ PROD: Pasta...  │
│ SKU: FD-001     │
│ ▮▮ ▮ ▮▮▮ ▮     │ ← Barcode (full width)
│    FD-001       │
├─────────────────┤
│    Unit 1/24    │
└─────────────────┘
```

### TINY/SMALL + QR Only
```
┌─────────────────┐
│  🏢 SIIFMART    │
│  12/06/2025     │
├─────────────────┤
│ PROD: Pasta...  │
│ SKU: FD-001     │
│     ▀▀▀▀▀▀▀     │
│     ▀ ▀▀▀ ▀     │ ← QR Code (centered)
│     ▀▀▀▀▀▀▀     │
├─────────────────┤
│    Unit 1/24    │
└─────────────────┘
```

### MEDIUM/LARGE/XL (Both)
```
┌──────────────────────────────┐
│     🏢 SIIFMART              │
│     12/06/2025               │
├──────────────────────────────┤
│ PROD: Zela Pasta 24pack      │
│ SKU: FD-001                  │
│ ▮▮ ▮ ▮▮▮ ▮    ▀▀▀▀▀▀▀       │
│   FD-001       ▀ ▀▀▀ ▀       │ ← Barcode + QR
│                ▀▀▀▀▀▀▀       │
├──────────────────────────────┤
│         Unit 1/24             │
└──────────────────────────────┘
```

## Benefits

### TINY/SMALL (Choice)
✅ Less visual clutter
✅ Better use of limited space
✅ Faster printing (1 code instead of 2)
✅ Clearer for workers

### MEDIUM+ (Both)
✅ Maximum scanning flexibility
✅ Redundancy if one code is damaged
✅ Different workflows can use different codes
✅ Full metadata in QR + fast scanning with barcode

## Use Cases

### Choose Barcode (TINY/SMALL)
- Traditional POS systems
- Laser handheld scanners
- Quick SKU lookup

### Choose QR Code (TINY/SMALL)
- Mobile device scanning
- Need metadata (PO ref, unit number)
- Error correction important

## Implementation

Updated all 3 label printing locations:
1. First "Print Receiving Labels" button
2. Re-print received labels  
3. Second print after receiving

Each location now:
1. Checks `labelSize` (TINY/SMALL vs MEDIUM+)
2. Checks `labelFormat` state ('BARCODE' or 'QR')
3. Conditionally generates only needed codes
4. Renders appropriate label layout
