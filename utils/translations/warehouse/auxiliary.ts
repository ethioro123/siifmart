import { TranslationBlock } from '../types';

export const auxiliary: TranslationBlock = {
    // Replenish Section
    forwardPickReplenishment: { en: 'Forward Pick Replenishment', am: 'የመፊት ምረጫ ማሟያ', or: 'Filannoo Duraan Guutuu' },
    restockPickFaces: { en: 'Restock pick faces from bulk storage based on demand', am: 'የመምረጫ ፊቶችን ከጅምላ ማከማቻ በፍላጎት መሰረት ሙላ', or: 'Fuullee filannoo kuusaa gurguddoo irraa haalli barbaachisuuf guuti' },
    selectAllLowStock: { en: 'Select All Low Stock', am: 'ሁሉንም ዝቅተኛ አቅም ይምረጡ', or: 'Kuusaa Xiqqaa Hunda Fili' },
    noItemsSelected: { en: 'No items selected for replenishment', am: 'ምንም ዕቃዎች ለማሟያ አልተመረጡም', or: 'Mi\'ootni guutuu filataman hin jiran' },

    // Transfer Section
    interSiteTransfers: { en: 'Inter-Site Transfers', am: 'የጣቢያ-ጣቢያ ማስተላለፍ', or: 'Dabarsuu Gidduu Bakkaa' },
    requestManageTransfers: { en: 'Request and manage inventory transfers between stores and warehouses', am: 'በመደብሮች እና መጋዘኖች መካከል የእቃ ማስተላለፍ ይጠይቁ እና ያስተዳድሩ', or: 'Dabarsuu meeshaalee gidduu dukaanootaa fi magaalaalee keessatti kadhadhu fi bulchi' },
    bulkDistribution: { en: 'Bulk Distribution', am: 'ጅምላ ስርጭት', or: 'Qo\'annoo Gurguddoo' },
    requestTransfer: { en: 'Request Transfer', am: 'ማስተላለፍ ይጠይቁ', or: 'Dabarsuu Kadhadhu' },
    requested: { en: 'Requested', am: 'የተጠየቀ', or: 'Kadhatee' },
    picking: { en: 'Picking', am: 'በመምረጥ ላይ', or: 'Filannoo irra jira' },
    packed: { en: 'Packed', am: 'ተሸግቷል', or: 'Sa\'ameera' },
    inTransit: { en: 'In Transit', am: 'በመጓዝ ላይ', or: 'Deemsa irra jira' },
    delivered: { en: 'Delivered', am: 'ደርሷል', or: 'Ga\'eera' },
    received: { en: 'Received', am: 'ተቀብሏል', or: 'Fudhatameera' },
    approve: { en: 'Approve', am: 'አጸድቅ', or: 'Mirkaneeffadhu' },
    markShipped: { en: 'Mark Shipped', am: 'እንደተላከ ምልክት አድርግ', or: 'Ergee Mirkaneessi' },
    creating: { en: 'Creating...', am: 'በመፍጠር ላይ...', or: 'Uumaa jira...' },
    createTransferRequest: { en: 'Create Transfer Request', am: 'የማስተላለፍ ጥያቄ ፍጠር', or: 'Kadhannoo Dabarsuu Uumi' },
    transferRequestCreated: { en: 'Transfer request created successfully!', am: 'የማስተላለፍ ጥያቄ በተሳካ ሁኔታ ተፈጥሯል!', or: 'Kadhannoo dabarsuu milkaa\'inaan uumameera!' },
    failedToCreateTransfer: { en: 'Failed to create transfer request', am: 'የማስተላለፍ ጥያቄ መፍጠር አልተሳካም', or: 'Kadhannoo dabarsuu uumuu hin milkaa\'ine' },
    transferApproved: { en: 'Transfer approved! Pick job created.', am: 'ማስተላለፍ ተጸድቋል! የመምረጫ ስራ ተፈጥሯል።', or: 'Dabarsuu mirkaneeffameera! Hojii filannoo uumameera.' },
    transferMarkedShipped: { en: 'Transfer marked as shipped! 🚚', am: 'ማስተላለፍ እንደተላከ ምልክት ተደርጎበታል! 🚚', or: 'Dabarsuu ergee akka ta\'e mirkaneessameera! 🚚' },
    failedToUpdateTransfer: { en: 'Failed to update transfer', am: 'ማስተላለፍ ማዘመን አልተሳካም', or: 'Dabarsuu haaromsuu hin milkaa\'ine' },

    // Return Processing
    returnProcessedSuccessfully: { en: 'Return Processed Successfully', am: 'ምላሽ በተሳካ ሁኔታ ተካሂዷል', or: 'Deebiin Milkaa\'inaan Adeemameera' },
    rmaGenerated: { en: 'RMA #{rma} has been generated.', am: 'RMA #{rma} ተፈጥሯል።', or: 'RMA #{rma} uumameera.' },
    printReceiptButton: { en: 'Print Receipt', am: 'ደረሰኝ አትም', or: 'Nagahee Maxxansi' },
    printingReceipt: { en: 'Printing receipt...', am: 'ደረሰኝ በመትም ላይ...', or: 'Nagahee maxxansaa jira...' },
    newReturn: { en: 'New Return', am: 'አዲስ ምላሽ', or: 'Deebii Haaraa' },
    processRefund: { en: 'Process Refund', am: 'የመመለስ ክፍያ ሂደት', or: 'Kaffaltii Deebisuu Adeemsi' },
    backToSelection: { en: 'Back to Selection', am: 'ወደ ምርጫ ተመለስ', or: 'Gara Filannoo Deebi\'i' },

    // Waste Section
    wasteQuantity: { en: 'Waste Quantity', am: 'የብክነት ብዛት', or: 'Baay\'ina Balleessa' },
    selectReason: { en: 'Select Reason', am: 'ምክንያት ይምረጡ', or: 'Sababa Fili' },
    describeDamage: { en: 'Describe damage...', am: 'የጉዳቱን ይግለጹ...', or: 'Balleessaa ibsi...' },

    // Return Section
    orderID: { en: 'Order ID (e.g. ORD-12345)', am: 'የትዕዛዝ መለያ (ለምሳሌ ORD-12345)', or: 'Eenyummaa Ajajaa (fakkeenyaaf ORD-12345)' },
    selectItem: { en: 'Select Item', am: 'ዕቃ ይምረጡ', or: 'Mi\'a Fili' },
    returnQuantity: { en: 'Return Quantity', am: 'የምላሽ ብዛት', or: 'Baay\'ina Deebii' },
    returnReason: { en: 'Return Reason', am: 'የምላሽ ምክንያት', or: 'Sababa Deebii' },
    returnCondition: { en: 'Return Condition', am: 'የምላሽ ሁኔታ', or: 'Haala Deebii' },
    returnAction: { en: 'Return Action', am: 'የምላሽ ተግባር', or: 'Gocha Deebii' },

    // Count
    inventoryCount: { en: 'Inventory Count', am: 'የእቃ ቆጠራ', or: 'Lakkaa\'uu Meeshaalee' },
    expectedCount: { en: 'Expected Count', am: 'የሚጠበቀው ቁጠራ', or: 'Lakkaa\'uu Eegamu' },
    actualCount: { en: 'Actual Count', am: 'ትክክለኛ ቁጠራ', or: 'Lakkaa\'uu Dhugaa' },
    variance: { en: 'Variance', am: 'ልዩነት', or: 'Garaagarummaa' },
};
