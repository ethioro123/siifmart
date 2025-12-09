# QR Scanner Camera Button Locations

## Visual Guide

### 1. POS - Receiving Modal

```
┌─────────────────────────────────────────────────────┐
│  Receive Items                                   [X]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  📷 Scan Barcode to Receive                        │
│  Scan or enter product barcode/SKU to mark items   │
│  as received.                                       │
│                                                     │
│  ┌────────────────────────┬──────┬────────┐        │
│  │ 🔍 Scan or enter...    │ 📷   │  Add   │        │
│  └────────────────────────┴──────┴────────┘        │
│         ↑                    ↑                      │
│    Manual Input        Camera Button               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Location**: POS page → "Receive Items" button → Receiving Modal
**Purpose**: Scan products being received from warehouse transfers

---

### 2. Warehouse - Location Scanner

```
┌─────────────────────────────────────────────────────┐
│  Scanner Interface - PUTAWAY/PICK                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🗺️ Select Storage Location                        │
│                                                     │
│  Zone: [A ▼]  Aisle: [01 ▼]  Bin: [01 ▼] [Select] │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  🔍 Enter Manually or Scan Location Barcode        │
│  ┌────────────────────────┬──────┬────────┐        │
│  │ A-01-05               │ 📷   │  Use   │        │
│  └────────────────────────┴──────┴────────┘        │
│         ↑                    ↑                      │
│    Manual Input        Camera Button               │
│                                                     │
│  💡 Tip: Scan location barcode or type A-01-01     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Location**: Warehouse Operations → PUTAWAY/PICK job → Scanner Interface → NAV step
**Purpose**: Scan warehouse bin location barcodes (e.g., A-01-05)

---

### 3. Warehouse - Product Scanner

```
┌─────────────────────────────────────────────────────┐
│  Scanner Interface - SCAN                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│         [Product Image]                             │
│                                                     │
│         Coca Cola 500ml                             │
│         Qty: 10    Stock: 45                        │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  🔍 Scan Product Barcode                           │
│  ┌────────────────────────────────────┬──────┐     │
│  │ Scan barcode or enter SKU...       │ 📷   │     │
│  └────────────────────────────────────┴──────┘     │
│         ↑                                ↑          │
│    Manual Input                    Camera Button   │
│                                                     │
│  Expected: COCA-500                                 │
│                                                     │
│  ┌──────────────────────────────────────────┐      │
│  │      ✓ CONFIRM PICK/PUTAWAY              │      │
│  └──────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Location**: Warehouse Operations → PUTAWAY/PICK job → Scanner Interface → SCAN step
**Purpose**: Scan product barcodes to verify correct item during warehouse operations

---

## Camera Button Design

The camera button is consistently styled across all locations:

```css
┌──────┐
│  📷  │  Blue background with camera icon
└──────┘  Hover effect: lighter blue
          Click: Opens QR Scanner modal
```

**Visual Characteristics**:
- Blue background (`bg-blue-500/20`)
- Blue border (`border-blue-500/30`)
- Blue text/icon (`text-blue-400`)
- Camera icon from lucide-react
- Hover effect for better UX
- Tooltip on hover: "Scan with Camera" or "Scan Location/Product with Camera"

---

## QR Scanner Modal

When camera button is clicked:

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Product Barcode/QR                      [X]│
│  Position the barcode or QR code within the frame  │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌─────┐                    ┌─────┐         │
│         │     │  [Camera Feed]     │     │         │
│         │     │                    │     │         │
│         │     │    ═══════════     │     │         │
│         │     │   (scanning line)  │     │         │
│         │     │                    │     │         │
│         └─────┘                    └─────┘         │
│                                                     │
│              ┌──────────────────┐                  │
│              │ 🟢 Scanning...   │                  │
│              └──────────────────┘                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Hold your device steady and align the code        │
│  within the frame                                  │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Live camera feed
- Corner brackets for alignment guidance
- Animated scanning line
- Real-time code detection
- Auto-close on successful scan
- Manual close button (X)

---

## Usage Instructions

### For POS Staff:
1. Open "Receive Items" modal
2. Click the blue camera button (📷)
3. Point camera at product barcode/QR code
4. Wait for automatic detection
5. Product is automatically added to received items

### For Warehouse Workers:
1. **Location Scanning**:
   - Start PUTAWAY/PICK job
   - In location selection screen, click camera button
   - Scan bin location barcode (e.g., A-01-05)
   - Location is automatically selected

2. **Product Scanning**:
   - After selecting location, proceed to product scan
   - Click camera button next to barcode input
   - Scan product barcode
   - System validates if correct product
   - Automatic confirmation if match

---

## Troubleshooting

**Camera not working?**
- Check browser permissions (allow camera access)
- Ensure HTTPS connection (required for camera API)
- Try a different browser (Chrome, Firefox, Safari, Edge)

**Code not detecting?**
- Ensure good lighting
- Hold device steady
- Position code within corner brackets
- Try moving closer/farther from code
- Ensure code is not damaged or obscured

**Wrong product detected?**
- System will show error notification
- Manually verify the barcode
- Try scanning again
- Use manual entry as fallback
