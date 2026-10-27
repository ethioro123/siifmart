import { TranslationBlock } from '../types';

export const returns: any = {
    // Leaf translation for the key "returns" itself (e.g. t('warehouse.returns'))
    en: 'Returns',
    am: 'ምላሾች',
    or: 'Deebisa Meeshaa',

    // Header & Navigation
    returnsManagementRMA: {
        en: 'Returns Management (RMA)',
        am: 'የዕቃ ምላሽ አስተዳደር (RMA)',
        or: 'Hoggana Deebisa Meeshaa (RMA)'
    },
    processReturn: {
        en: 'Process Return',
        am: 'ምላሽን ያካሂዱ',
        or: 'Deebisa Adeemsisi'
    },
    returnsHistory: {
        en: 'Returns History',
        am: 'የምላሽ ታሪክ',
        or: 'Seenaa Deebisaa'
    },
    returnsHistorySubtitle: {
        en: 'Recent processed returns and refunds',
        am: 'የቅርብ ጊዜ የተካሄዱ ምላሾች እና ተመላሽ ገንዘቦች',
        or: 'Galmeewwan deebisaa fi kaffaltii deebii dhiyoo'
    },
    processShort: {
        en: 'Process',
        am: 'ሂደት',
        or: 'Adeemsa'
    },
    historyShort: {
        en: 'History',
        am: 'ታሪክ',
        or: 'Seenaa'
    },

    // Step 1: Search Order
    scanOrderReceipt: {
        en: 'Scan Order Receipt',
        am: 'የትዕዛዝ ደረሰኝ ይቃኙ',
        or: 'Nagahee Ajajaa Iskaani'
    },
    scanOrderReceiptDesc: {
        en: 'Enter the Order ID or invoice number on the receipt',
        am: 'በደረሰኙ ላይ ያለውን የትዕዛዝ መታወቂያ ወይም የክፍያ መጠየቂያ ቁጥር ያስገቡ',
        or: 'ID ajajaa ykn lakk inwooyisii nagahee irraa galchaa'
    },
    orderIdPlaceholder: {
        en: 'Order ID (e.g. ORD-12345)',
        am: 'የትዕዛዝ መታወቂያ (ለምሳሌ ORD-12345)',
        or: 'ID Ajajaa (fkn ORD-12345)'
    },
    findButton: {
        en: 'Find',
        am: 'ፈልግ',
        or: 'Barbaadi'
    },
    orderFoundNotice: {
        en: 'Order Found',
        am: 'ትዕዛዝ ተገኝቷል',
        or: 'Ajajni Argameera'
    },
    orderNotFoundNotice: {
        en: 'Order Not Found',
        am: 'ትዕዛዝ አልተገኘም',
        or: 'Ajajni Hin Argamne'
    },

    // Step 2: Select Items
    orderNumberPrefix: {
        en: 'Order #{id}',
        am: 'ትዕዛዝ #{id}',
        or: 'Ajaja #{id}'
    },
    walkInCustomer: {
        en: 'Walk-in Customer',
        am: 'ቀጥታ ደንበኛ',
        or: 'Maamila Kallattii'
    },
    totalPaid: {
        en: 'Total Paid',
        am: 'ጠቅላላ የተከፈለ',
        or: 'Waliigala Kaffalame'
    },
    selectItemsToReturn: {
        en: 'Select Items to Return',
        am: 'የሚመለሱ ዕቃዎችን ይምረጡ',
        or: 'Meeshaalee Deebifaman Filadhu'
    },
    purchasedQtyPrefix: {
        en: 'Purchased: {qty}',
        am: 'የተገዛ: {qty}',
        or: 'Kan Bitame: {qty}'
    },
    returnQtyLabel: {
        en: 'Return Qty',
        am: 'የምላሽ ብዛት',
        or: 'Baay\'ina Deebii'
    },
    reasonLabel: {
        en: 'Reason',
        am: 'ምክንያት',
        or: 'Sababa'
    },
    conditionLabel: {
        en: 'Condition',
        am: 'ሁኔታ',
        or: 'Haala'
    },
    actionLabel: {
        en: 'Action',
        am: 'ተግባር',
        or: 'Tarkaanfii'
    },
    reviewReturnButton: {
        en: 'Review Return',
        am: 'ምላሽን ገምግም',
        or: 'Deebisa Irra Deebi\'ii Ilaali'
    },

    // Reasons & Conditions & Actions
    reasonDefective: { en: 'Defective', am: 'እንከን ያለበት', or: 'Mijaja / Hojii Hin Hojjenne' },
    reasonWrongItem: { en: 'Wrong Item', am: 'የተሳሳተ ዕቃ', or: 'Meeshaa Dogoggoraa' },
    reasonChangedMind: { en: 'Changed Mind', am: 'ሀሳብ ቀይሯል', or: 'Yaada Jijjiirrate' },
    reasonExpired: { en: 'Expired', am: 'ጊዜው ያለፈበት', or: 'Yeroon kan Darbe' },
    conditionNewSealed: { en: 'New / Sealed', am: 'አዲስ / የታሸገ', or: 'Haaraa / kan Saamsame' },
    conditionOpenBox: { en: 'Open Box', am: 'የተከፈተ ሳጥን', or: 'Saanduqa Baname' },
    conditionDamaged: { en: 'Damaged', am: 'የተጎዳ', or: 'Kan Miidhame' },
    conditionGood: { en: 'Good', am: 'ጥሩ', or: 'Gaarii' },
    actionRestock: { en: 'Restock', am: 'ወደ ክምችት መልስ', or: 'Deebisii Kuusi' },
    actionDiscard: { en: 'Discard', am: 'አስወግድ', or: 'Gati / Balleessi' },
    actionQuarantine: { en: 'Quarantine', am: 'ለይተህ አስቀምጥ', or: 'Adda Baasii Tursiisi' },

    // Step 3: Review & Summary
    returnSummaryTitle: {
        en: 'Return Summary',
        am: 'የምላሽ ማጠቃለያ',
        or: 'Cuunfaa Deebisaa'
    },
    financialBreakdownTitle: {
        en: 'Financial Breakdown',
        am: 'የፋይናንስ ዝርዝር',
        or: 'Ibsa Maallaqaa'
    },
    productHeader: { en: 'Product', am: 'ምርት', or: 'Oomisha' },
    reasonHeader: { en: 'Reason', am: 'ምክንያት', or: 'Sababa' },
    actionHeader: { en: 'Action', am: 'ተግባር', or: 'Tarkaanfii' },
    refundHeader: { en: 'Refund', am: 'ተመላሽ ገንዘብ', or: 'Kaffaltii Deebii' },
    qtyPrefix: { en: 'Qty: {qty}', am: 'ብዛት: {qty}', or: 'Baay\'ina: {qty}' },
    subtotalLabel: { en: 'Subtotal', am: 'ንዑስ ድምር', or: 'Gatii Cufaa' },
    taxLabel: { en: 'Tax ({rate}%)', am: 'ግብር ({rate}%)', or: 'Gibira ({rate}%)' },
    totalRefundLabel: { en: 'Total Refund', am: 'ጠቅላላ ተመላሽ ገንዘብ', or: 'Kaffaltii Deebii Waliigalaa' },
    processRefundButton: { en: 'Process Refund', am: 'ተመላሽ ገንዘብ ያካሂዱ', or: 'Kaffaltii Deebii Raawwadhu' },
    backToSelectionButton: { en: 'Back to Selection', am: 'ወደ ምርጫ ተመለስ', or: 'Gara Filannootti Deebi\'i' },
    confirmProcessReturnPrompt: {
        en: 'Process this return? This action cannot be undone.',
        am: 'ይህንን ምላሽ ማካሄድ ይፈልጋሉ? ይህ እርምጃ ሊቀለበስ አይችልም።',
        or: 'Deebisa kana raawwachuu barbaadduu? Gochi kun duubatti hin deebi\'u.'
    },

    // Step 4: Complete
    returnProcessedSuccessTitle: {
        en: 'Return Processed Successfully',
        am: 'ምላሽ በተሳካ ሁኔታ ተካሂዷል',
        or: 'Deebisaan Milkaa\'inaan Adeemsifameera'
    },
    rmaGeneratedSublabel: {
        en: 'RMA-{id} Generated',
        am: 'RMA-{id} ተፈጥሯል',
        or: 'RMA-{id} Uumameera'
    },
    printReceiptButton: { en: 'Print Receipt', am: 'ደረሰኝ አትም', or: 'Nagahee Maxxansi' },
    printingReceiptNotice: { en: 'Printing Receipt...', am: 'ደረሰኝ በማተም ላይ...', or: 'Nagahee maxxansaa jira...' },
    newReturnButton: { en: 'New Return', am: 'አዲስ ምላሽ', or: 'Deebisa Haaraa' },

    // Return to Warehouse Modal
    returnToWarehouseTitle: {
        en: 'Return to Warehouse',
        am: 'ወደ መጋዘን መልስ',
        or: 'Gara Manna-Kuusaatti Deebisi'
    },
    returnToSupplierWarehouseTitle: {
        en: 'Return to Supplier / Warehouse',
        am: 'ወደ አቅራቢ / መጋዘን መልስ',
        or: 'Gara Dhiyeessaatti / Manna-Kuusaatti Deebisi'
    },
    returnModalInstructions: {
        en: 'Select items to return to warehouse inventory. A stock adjustment will be created pending manager approval.',
        am: 'ወደ መጋዘን ክምችት የሚመለሱ እቃዎችን ይምረጡ። በአስተዳዳሪ ማጽደቅ የሚጠብቅ የክምችት ማስተካከያ ይፈጠራል።',
        or: 'Meeshaalee gara kuusaatti deebifaman filadhaa. Sirreeffamni kuusaa heeyyama to\'ataatiin eegamu ni uumama.'
    },
    confirmReturnStockAdjustmentWarning: {
        en: 'This will create {count} pending stock adjustment(s) requiring {role} approval.',
        am: 'ይህ {role} ማጽደቅ የሚያስፈልገው {count} በመጠባበቅ ላይ ያለ የክምችት ማስተካከያ(ዎችን) ይፈጥራል።',
        or: 'Kun heeyyama {role} kan barbaadu sirreeffama kuusaa eeggatu {count} ni uuma.'
    },
    returnSubmittedTitle: {
        en: 'Return Submitted',
        am: 'ምላሽ ቀርቧል',
        or: 'Deebisaan Dhiyaateera'
    },
    itemsPendingApprovalNotice: {
        en: '{count} item(s) are now pending {role} approval.',
        am: '{count} ዕቃ(ዎች) አሁን {role} ማጽደቅን በመጠባበቅ ላይ ናቸው።',
        or: 'Meeshaaleen {count} heeyyama {role} eeggachaa jiru.'
    },
    onceApprovedStockAddedNotice: {
        en: 'Once approved, stock will be added back to the warehouse inventory.',
        am: 'አንዴ ከጸደቀ፣ ክምችት ወደ መጋዘን ዕቃ ዝርዝር ይመለሳል።',
        or: 'Yeroo heeyyamame meeshaan gara kuusaa manna-kuusaatti ni deebifama.'
    },
    warehouseManagerRole: { en: 'warehouse manager', am: 'የመጋዘን ስራ አስኪያጅ', or: 'to\'ataa manna-kuusaa' },
    procurementManagerRole: { en: 'procurement manager', am: 'የግዥ ስራ አስኪያጅ', or: 'to\'ataa bittaa' },
    procurementOrSuperAdminRole: { en: 'procurement manager / super admin', am: 'የግዥ ስራ አስኪያጅ / ከፍተኛ አስተዳዳሪ', or: 'to\'ataa bittaa / bulchaa ol\'aanaa' },
    reviewCountButton: { en: 'Review ({count})', am: 'ገምግም ({count})', or: 'Irra Deebi\'ii Ilaali ({count})' },
    submitForApprovalButton: { en: 'Submit for Approval', am: 'ለማጽደቅ አስገባ', or: 'Heeyyamaaf Ergi' },
    itemsSubmittedForReturnApproval: {
        en: '{count} item(s) submitted for return approval',
        am: '{count} ዕቃ(ዎች) ለምላሽ ማጽደቂያ ቀርበዋል',
        or: 'Meeshaaleen {count} heeyyama deebisaatiif dhiyaataniiru'
    },
    failedToSubmitReturn: {
        en: 'Failed to submit return: ',
        am: 'ምላሹን ማስገባት አልተሳካም፡ ',
        or: 'Deebisa dhiyeessuun hin milkoofne: '
    },
    activeJobsCancelledNotice: {
        en: '{count} active job(s) cancelled due to return',
        am: '{count} ንቁ ስራ(ዎች) በምላሽ ምክንያት ተሰርዘዋል',
        or: 'Hojiin socho\'aa {count} sababa deebisaatiin haqameera'
    },
    searchHistoryPlaceholder: {
        en: 'Search history...',
        am: 'ታሪክ ፈልግ...',
        or: 'Seenaa barbaadi...'
    },
    noReturnHistoryFound: {
        en: 'No return history found matching your search.',
        am: 'ከፍለጋዎ ጋር የሚዛመድ ምንም የምላሽ ታሪክ አልተገኘም።',
        or: 'Galmeen seenaa deebisaa barbaacha kessaniin walsimu hin argamne.'
    },
    productsCount: {
        en: '{count} Products',
        am: '{count} ምርቶች',
        or: 'Oomishoota {count}'
    },
    processedByColon: {
        en: 'Processed By',
        am: 'ያካሄደው',
        or: 'Kan Adeemsise'
    },
    dateHeader: { en: 'Date', am: 'ቀን', or: 'Guyyaa' },
    saleIdHeader: { en: 'Sale ID', am: 'የሽያጭ መታወቂያ', or: 'ID Gurgurtaa' },
    customerHeader: { en: 'Customer', am: 'ደንበኛ', or: 'Maamila' },
    itemsHeader: { en: 'Items', am: 'ዕቃዎች', or: 'Meeshaalee' },
    statusHeader: { en: 'Status', am: 'ሁኔታ', or: 'Haala' },
    cancelWord: { en: 'Cancel', am: 'ሰርዝ', or: 'Haqi' },
    backWord: { en: 'Back', am: 'ተመለስ', or: 'Duubatti' },
    doneWord: { en: 'Done', am: 'ተጠናቋል', or: 'Xumurame' },
    submittingWord: { en: 'Submitting...', am: 'በማስገባት ላይ...', or: 'Ergaa jira...' },
    jobPrefix: { en: 'Job {id}', am: 'ስራ {id}', or: 'Hojii {id}' },
    qtyHeader: { en: 'Qty', am: 'ብዛት', or: 'Baay\'ina' },
    conditionHeader: { en: 'Condition', am: 'ሁኔታ', or: 'Haala' },
    receivedQtyPrefix: { en: 'Received: {qty}', am: 'የተቀበለው: {qty}', or: 'Kan Fudhatame: {qty}' },
    pickedQtyPrefix: { en: 'Picked: {qty}', am: 'የተመረጠ: {qty}', or: 'Kan Guurame: {qty}' },
    reasonWrongItemPicked: { en: 'Wrong Item Picked', am: 'የተሳሳተ ዕቃ ተመርጧል', or: 'Meeshaa Dogoggoraatu Fudhatame' },
    reasonOverstock: { en: 'Overstock', am: 'ትርፍ ክምችት', or: 'Kuusaadhaa Ol / Heddummina' },
    reasonCustomerRefused: { en: 'Customer Refused', am: 'ደንበኛ አልተቀበለም', or: 'Maamilli Dide' },
    reasonQualityIssue: { en: 'Quality Issue', am: 'የጥራት ችግር', or: 'Rakkoo Qulqullinaa' },
    conditionExpired: { en: 'Expired', am: 'ጊዜው ያለፈበት', or: 'Yeroon kan Darbe' }
};
