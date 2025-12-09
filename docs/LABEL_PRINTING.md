# Label Printing System

## Overview
The label printing system generates individual labels for each product unit, ensuring proper tracking and identification throughout the warehouse.

## Features
- ✅ **Individual Labels** - One label per product unit (not per line item)
- ✅ **SKU Prominent** - SKU displayed prominently on each label
- ✅ **Batch Tracking** - Includes batch number and expiry date
- ✅ **Location Info** - Shows warehouse location after putaway
- ✅ **Standard Size** - 4" x 2" labels (compatible with most thermal printers)
- ✅ **Print Preview** - Review labels before printing

## Label Information

Each label includes:
1. **Product Name** - Full product name
2. **SKU** - Large, prominent barcode-ready SKU
3. **Price** - Retail price
4. **Batch Number** - For traceability
5. **Expiry Date** - For perishable items
6. **Location** - Warehouse location (Zone-Aisle-Bin)
7. **Received Date** - When item was received
8. **Unit Number** - Which unit out of total (e.g., "Unit 5/50")

## Usage Example

### In Warehouse Operations (PUTAWAY)

```typescript
import LabelPrintModal from '../components/LabelPrintModal';

// In your component
const [showLabelModal, setShowLabelModal] = useState(false);
const [labelsToprint, setLabelsToPrint] = useState<LabelData[]>([]);

// When completing putaway
const handleCompletePutaway = (job: WMSJob) => {
  // Prepare labels for all items in the job
  const labels = job.lineItems.map(item => ({
    product: products.find(p => p.id === item.productId)!,
    quantity: item.pickedQty || item.expectedQty, // Number of labels to print
    batchNumber: item.batchNumber,
    expiryDate: item.expiryDate,
    receivedDate: new Date().toISOString().split('T')[0],
    location: scannedBin // The location where item was placed
  }));

  setLabelsToPrint(labels);
  setShowLabelModal(true);
};

// In your JSX
<LabelPrintModal
  isOpen={showLabelModal}
  onClose={() => setShowLabelModal(false)}
  labels={labelsToPrint}
  onPrint={() => {
    addNotification('success', `${labelsToPrint.reduce((sum, l) => sum + l.quantity, 0)} labels sent to printer`);
    setShowLabelModal(false);
  }}
/>
```

### In Procurement (RECEIVING)

```typescript
// After receiving goods
const handleReceivePO = (po: PurchaseOrder, receivedItems: ReceivingItem[]) => {
  // Generate labels for received items
  const labels = receivedItems.map(item => ({
    product: products.find(p => p.id === item.productId)!,
    quantity: item.quantity, // Print one label per unit
    batchNumber: item.batchNumber,
    expiryDate: item.expiryDate,
    receivedDate: new Date().toISOString().split('T')[0],
    location: 'Receiving Dock' // Will be updated during putaway
  }));

  setLabelsToPrint(labels);
  setShowLabelModal(true);
};
```

## Label Printing Workflow

### Scenario: Receiving 50 units of Rice

1. **Receive PO**
   - Receive 50 units of "Premium Rice 25kg"
   - SKU: RICE-001
   - Batch: BATCH-2024-001
   - Expiry: 2025-12-31

2. **Generate Labels**
   - System creates 50 individual labels
   - Each labeled "Unit 1/50", "Unit 2/50", etc.

3. **Print Labels**
   - User clicks "Print Labels"
   - Browser print dialog opens
   - 50 labels print (one per unit)

4. **Apply Labels**
   - Worker applies one label to each bag of rice
   - Each unit is now individually tracked

5. **Putaway**
   - During putaway, location is scanned
   - Labels can be reprinted with location info if needed

## Label Dimensions

```
┌─────────────────────────────────────┐
│ Premium Rice 25kg          Unit 1/50│
│ Category: Food                       │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │ SKU                          │   │
│  │ RICE-001                     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Price       │  │ Batch        │  │
│  │ $45.00      │  │ BATCH-001    │  │
│  └─────────────┘  └──────────────┘  │
│                                      │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Expiry      │  │ Location     │  │
│  │ 2025-12-31  │  │ A-05-12      │  │
│  └─────────────┘  └──────────────┘  │
│                                      │
├─────────────────────────────────────┤
│ SIIFMART          Printed: 11/25/24 │
│ Received: 11/25/24                  │
└─────────────────────────────────────┘
    4 inches wide x 2 inches tall
```

## Printer Compatibility

### Thermal Printers (Recommended)
- Zebra ZD410/ZD420
- Brother QL-820NWB
- DYMO LabelWriter 450
- Rollo Label Printer

### Standard Printers
- Any printer can print on 4x2 label sheets
- Avery 5163 compatible (2" x 4" labels)

## Print Settings

### For Thermal Printers
- Paper Size: 4" x 2"
- Orientation: Landscape
- Margins: 0
- Scale: 100%

### For Standard Printers
- Paper Size: Letter (8.5" x 11")
- Use pre-cut label sheets
- Print multiple labels per page

## Benefits

### Inventory Tracking
- ✅ Each unit has unique identifier
- ✅ Batch traceability
- ✅ Expiry date tracking
- ✅ Location tracking

### Compliance
- ✅ FDA/HACCP compliance for food items
- ✅ Lot tracking for recalls
- ✅ First-in-first-out (FIFO) enforcement

### Efficiency
- ✅ Quick product identification
- ✅ Faster picking (scan SKU)
- ✅ Reduced errors
- ✅ Better stock rotation

## Future Enhancements

- [ ] Barcode generation (Code 128, QR codes)
- [ ] Custom label templates
- [ ] Multi-language support
- [ ] Integration with label printers via USB/Network
- [ ] Batch label printing queue
- [ ] Label reprinting from history
