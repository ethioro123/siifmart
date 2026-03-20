import { TranslationBlock } from '../types';

export const modals: TranslationBlock = {
    // Short Pick Modal
    shortPickTitle: { en: 'Short Pick', am: 'አጭር ምረጥ', or: 'Filannoo Gababaa' },
    enterActualQuantityPicked: { en: 'Enter actual quantity picked', am: 'የተመረጠውን ትክክለኛ ብዛት ያስገቡ', or: 'Baay\'ina dhugaa filatame galchi' },
    expectedUnits: { en: 'Expected: {qty} units', am: 'የሚጠበቀው: {qty} ክፍሎች', or: 'Eegamu: {qty} yunitiin' },
    enterActualQuantityModal: { en: 'Enter the actual quantity you were able to pick', am: 'የቻሉትን ትክክለኛ ብዛት ያስገቡ', or: 'Baay\'ina dhugaa dandeessan filachuu galchi' },
    enterQuantity: { en: 'Enter quantity', am: 'ብዛት ያስገቡ', or: 'Baay\'ina Galchi' },

    // Zone Lock Modal
    lockZone: { en: 'Lock Zone {zone}', am: 'ዞን {zone} ዝጋ', or: 'Zoonii {zone} Cufi' },
    enterReasonLocking: { en: 'Enter reason for locking (optional)', am: 'ለመዝጋት ምክንያት ያስገቡ (አማራጭ)', or: 'Sababa cufuu galchi (filannoo)' },
    lockZoneButton: { en: 'Lock Zone', am: 'ዞን ዝጋ', or: 'Zoonii Cufi' },
    zoneLockedNotification: { en: 'Zone {zone} has been locked{reason}', am: 'ዞን {zone} ተፈርጋል{reason}', or: 'Zoonii {zone} cufameera{reason}' },
    forMaintenance: { en: ' for maintenance', am: ' ለጥገና', or: ' suphaa irratti' },

    // Labels Not Printed Modal
    stop: { en: '⛔ STOP', am: '⛔ ቁም', or: '⛔ DHUUBA' },
    labelsRequired: { en: 'Labels Required', am: 'መለያዎች ያስፈልጋሉ', or: 'Mallattooleen Barbaachisan' },
    mustPrintLabels: { en: 'You MUST print labels before completing reception.', am: 'መቀበልን ከመጨረስ በፊት መለያዎችን ማተም አለብዎት።', or: 'Fudhannaan xumuramuu dura mallattoolee maxxansuu qabda.' },
    mandatoryStep: { en: 'This step is mandatory to ensure inventory accuracy.', am: 'ይህ ደረጃ የእቃ ትክክለኛነትን ለማረጋገጥ የማያላምጥ ነው።', or: 'Ibsa kanaa mirkanoofachuu meeshaalee irratti waan barbaachisuudha.' },
    goBackPrintLabels: { en: '← Go Back & Print Labels', am: '← ተመለስ እና መለያዎችን አትም', or: '← Deebi\'i fi Mallattoolee Maxxansi' },
    pleasePrintLabels: { en: 'Please print labels to proceed', am: 'እባክዎ ለመቀጠል መለያዎችን ያትሙ', or: 'Maaloo itti fufuuf mallattoolee maxxansi' },

    // Incomplete Packing Modal
    incompletePacking: { en: 'Incomplete Packing', am: 'ያልተጠናቀቀ ማሸግ', or: 'Saamuu Hin Xumuramne' },
    notAllItemsPacked: { en: 'Not all items are packed', am: 'ሁሉም ዕቃዎች አልተሸጡም', or: 'Mi\'ootni hundi hin sa\'aman' },
    sureCompleteOrder: { en: 'Are you sure you want to complete this order?', am: 'ይህንን ትዕዛዝ ማጠናቀቅ መፈለግዎን እርግጠኛ ነዎት?', or: 'Ajaja kanaa xumuurachuu barbaaddanii mirkanooftee?' },
    onlyPackedOfTotal: { en: 'Only {packed} of {total} items are marked as packed.', am: 'ከ{total} ዕቃዎች ውስጥ {packed} ብቻ እንደተሸጡ ምልክት ተደርጎባቸዋል።', or: 'Mi\'oota {total} irraa {packed} qofa akka sa\'aman mallatteeffameera.' },
    unpackedMarkedMissing: { en: '⚠️ Unpacked items will be marked as "Missing" or "Backordered".', am: '⚠️ ያልተሸጡ ዕቃዎች እንደ "ጠፍቷል" ወይም "በትዕዛዝ" ምልክት ይደረጋቸዋል።', or: '⚠️ Mi\'ootni hin sa\'amne "Hinqabne" yookaan "Ajaja Keessa" jechuun mallatteeffamu.' },
    goBack: { en: 'Go Back', am: 'ተመለስ', or: 'Deebi\'i' },

    // Missing Ice Packs Modal
    missingIcePacks: { en: 'Missing Ice Packs', am: 'የበረዶ አሰር አልተገኘም', or: 'Akkorii Qorichoo Hin Argamne' },
    coldItemsDetected: { en: 'Cold items detected', am: 'የቅዝቃዜ ዕቃዎች ተገኝተዋል', or: 'Mi\'oota Qabaa Argame' },
    orderContainsColdItems: { en: 'This order contains cold items but ice packs have not been added.', am: 'ይህ ትዕዛዝ የቅዝቃዜ ዕቃዎች ይዟል ነገር ግን የበረዶ አሰር አልተጨመረም።', or: 'Ajajiin kun mi\'oota qabaa qaba garuu akkorii qorichoo hin ida\'amne.' },
    continueAnyway: { en: 'Do you want to continue anyway?', am: 'ሆኖም መቀጠል ይፈልጋሉ?', or: 'Ammas itti fufuu barbaaddanii?' },

    // Missing Protective Materials Modal
    missingProtectiveMaterials: { en: 'Missing Protective Materials', am: 'የመከላከያ ቁሳቁሶች አልተገኙም', or: 'Odeeffannoo Ittisaan Hin Argamne' },
    fragileItemsDetected: { en: 'Fragile items detected', am: 'የሚሰባበሩ ዕቃዎች ተገኝተዋል', or: 'Mi\'oota Rakkisaa Argame' },
    orderContainsFragileItems: { en: 'This order contains fragile items but no protective materials (bubble wrap or air pillows) have been selected.', am: 'ይህ ትዕዛዝ የሚሰባበሩ ዕቃዎች ይዟል ነገር ግን የመከላከያ ቁሳቁሶች (ቡብል ራፕ ወይም አየር ማረፊያዎች) አልተመረጡም።', or: 'Ajajiin kun mi\'oota rakkisaa qaba garuu odeeffannoon ittisaan (haguugoo bubbulaa yookaan rakkisaa hawaa) hin filatamne.' },

    // Bulk Distribution Modal
    bulkDistributionTitle: { en: 'Bulk Distribution', am: 'ጅምላ ስርጭት', or: 'Qo\'annoo Gurguddoo' },
    multiStoreDistribution: { en: 'Multi-Store Distribution', am: 'የብዙ መደብር ስርጭት', or: 'Qo\'annoo Dukaanoota Hedduu' },
    distributeToMultipleStores: { en: 'Distribute products to multiple stores at once. System will create separate transfers for each destination.', am: 'ምርቶችን ወደ ብዙ መደብሮች በአንድ ጊዜ ይሰራጩ። ስርዓቱ ለእያንዳንዱ መድረሻ ለየብቻ ማስተላለፎችን ይፈጥራል።', or: 'Oomishaalee gara dukaanoota hedduu yeroo tokkotti qo\'anni. Siistemiin dabarsuu adda addaa bakka hundaaf uuma.' },
    distributionMode: { en: 'Distribution Mode', am: 'የስርጭት ሁነት', or: 'Hayyama Qo\'annoo' },
    singleProduct: { en: 'Single Product', am: 'አንድ ምርት', or: 'Oomisha Tokko' },
    waveDistribution: { en: 'Wave Distribution', am: 'የሞገድ ስርጭት', or: 'Qo\'annoo Malkaa' },
    selectSourceWarehouse: { en: 'Select Source Warehouse', am: 'የመነሻ መጋዘን ይምረጡ', or: 'Magaalaa Eegduu Fili' },
    selectProduct: { en: 'Select Product', am: 'ምርት ይምረጡ', or: 'Oomisha Fili' },
    removeAllocation: { en: 'Remove Allocation', am: 'መመደብ አስወግድ', or: 'Ramaddii Haqi' },
    selectProductToAdd: { en: 'Select Product to Add', am: 'ለመጨመር ምርት ይምረጡ', or: 'Ida\'uuf Oomisha Fili' },
    removeProduct: { en: 'Remove Product', am: 'ምርት አስወግድ', or: 'Oomisha Balleessi' },
    waveAllocationQuantity: { en: 'Wave Allocation Quantity', am: 'የሞገድ መመደብ ብዛት', or: 'Baay\'ina Ramaddii Malkaa' },
};
