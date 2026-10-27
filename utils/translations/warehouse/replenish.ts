import { TranslationBlock } from '../types';

export const replenish: any = {
    // Leaf translation for the key "replenish" itself (e.g. t('warehouse.replenish'))
    en: 'Replenish',
    am: 'ማሟላት',
    or: 'Deebisanii Guutuu',

    // Header & Status
    replenishmentMatrix: { en: 'Replenishment Matrix', am: 'የማሟያ ማትሪክስ', or: 'Gabatee Guutuu Meeshaa' },
    forwardPickHub: { en: 'Forward Pick Hub', am: 'የቀዳሚ መምረጫ ማዕከል', or: 'Buufata Guutuu Buqqisaa' },
    alertsCount: { en: '{count} Alerts', am: '{count} ማስጠንቀቂያዎች', or: 'Akeekkachiisota {count}' },
    alertLabel: { en: 'Alerts', am: 'ማስጠንቀቂያዎች', or: 'Akeekkachiisa' },
    scanInventoryPlaceholder: { en: 'Scan product barcode or search inventory matrix...', am: 'የምርት ባርኮድ ይቃኙ ወይም የዕቃ ዝርዝር ይፈልጉ...', or: 'Baarkoodii oomishaa iskaani ykn gabatee meeshaa barbaadi...' },
    scanOrSearchInventory: { en: 'Scan or Search Inventory', am: 'ዕቃዎችን ይቃኙ ወይም ይፈልጉ', or: 'Meeshaa Iskaani ykn Barbaadi' },
    allLevels: { en: 'ALL LEVELS', am: 'ሁሉም ደረጃዎች', or: 'SADARKAALEE HUNDAA' },
    allArchives: { en: 'ALL ARCHIVES', am: 'ሁሉም መዛግብት', or: 'KUUSAA GALMEE HUNDAA' },
    critical: { en: 'CRITICAL', am: 'አስጊ', or: 'BAAY\'EE HAMAA' },
    low: { en: 'LOW', am: 'ዝቅተኛ', or: 'GADI AANAA' },
    optimal: { en: 'OPTIMAL', am: 'ተስማሚ', or: 'GAHAA' },
    urgency: { en: 'Urgency', am: 'አጣዳፊነት', or: 'Ariifannaa' },
    stock: { en: 'Stock', am: 'ክምችት', or: 'Kuusaa' },
    name: { en: 'Name', am: 'ስም', or: 'Maqaa' },
    selectLowStock: { en: 'Select Low Stock', am: 'ዝቅተኛ ክምችቶችን ይምረጡ', or: 'Meeshaalee Hir\'atan Filadhu' },
    selectedForOptimization: { en: 'Selected {count} items for optimization', am: '{count} ዕቃዎች ለማመቻቸት ተመርጠዋል', or: 'Meeshaaleen {count} fooyyessuuf filatamaniiru' },
    executeCount: { en: 'Execute ({count})', am: 'ፈጽም ({count})', or: 'Raawwadhu ({count})' },
    initializedSequences: { en: 'Initialized {count} Optimization Sequences', am: '{count} የማመቻቸት ቅደም ተከተሎች ተጀምረዋል', or: 'Adeemsaaleen guutuu {count} jalqabamaniiru' },
    processingProgress: { en: 'Processing...', am: 'በሂደት ላይ...', or: 'Adeemsarra jira...' },

    // Process & History Modes
    processMode: { en: 'Process', am: 'ሂደት', or: 'Hojii Irra Jira' },
    historyMode: { en: 'History', am: 'ታሪክ', or: 'Seenaa' },

    // Replenishment List & Item Cards
    optimizationStrategy: { en: 'Optimization Strategy', am: 'የማመቻቸት ስልት', or: 'Tarsiimoo Guutuu Qaxalee' },
    targetRestock: { en: 'Target Restock:', am: 'የታለመው ማሟያ፡', or: 'Hanga Guutuu Kaayyeffatame:' },
    targetRestockUnits: { en: '+{units} Units', am: '+{units} አሃዶች', or: '+{units} Qodaa' },
    autoCalculatedCeiling: { en: 'Auto-calculated ({maxStock} unit ceiling)', am: 'በራስ-ሰር የተሰላ (ከፍተኛው {maxStock} አሃድ)', or: 'Ofiin kan shallagame (hanga ol\'aanaa qodaa {maxStock})' },
    sourceLocation: { en: 'Source Location', am: 'የመነሻ ቦታ', or: 'Iddoo Maddaa' },
    bulkStorage: { en: 'Bulk Storage:', am: 'የጅምላ ማከማቻ፡', or: 'Kuusaa Tuulaa:' },
    standardPallets: { en: 'Standard warehouse pallets', am: 'መደበኛ የመጋዘን ፓሌቶች', or: 'Paaleetii kuusaa idilee' },
    velocityAlerts: { en: 'Velocity Alerts', am: 'የፍጥነት ማንቂያዎች', or: 'Akeekkachiisa Saffisa Gurgurtaa' },
    backlogged: { en: 'BACKLOGGED', am: 'ወደ ኋላ የቀረ', or: 'DUUBATTI HAFE' },
    stable: { en: 'STABLE', am: 'የተረጋጋ', or: 'TASGABBAA\'AA' },
    ordersAwaitingResupply: { en: '{count} orders awaiting resupply', am: '{count} ትዕዛዞች ማሟያ በመጠባበቅ ላይ ናቸው', or: 'Ajajoonni {count} deebisanii guutuu eegaa jiran' },
    initializeOptimization: { en: 'Initialize Optimization', am: 'ማመቻቸት ጀምር', or: 'Adeemsa Guutuu Jalqabi' },
    sequenceInitializedFor: { en: 'Sequence Initialized for {sku}', am: 'ለ {sku} ቅደም ተከተል ተጀምሯል', or: 'Adeemsi guutuu {sku}\'f jalqabameera' },
    stockLevel: { en: 'Stock Level', am: 'የክምችት መጠን', or: 'Sadarkaa Kuusaa' },
    statusLabel: { en: 'Status', am: 'ሁኔታ', or: 'Haala' },
    criticalStatus: { en: 'Critical', am: 'አስጊ', or: 'Baay\'ee Hamaa' },
    highStatus: { en: 'High', am: 'ከፍተኛ', or: 'Ol\'aanaa' },
    lowStatus: { en: 'Low', am: 'ዝቅተኛ', or: 'Gadi Aanaa' },
    stableStatus: { en: 'Stable', am: 'የተረጋጋ', or: 'Tasgabbaa\'aa' },
    systemOptimized: { en: 'System Optimized', am: 'ስርዓቱ ተመቻችቷል', or: 'Sirnichi Guutuu dha' },
    noReplenishRequired: { en: 'No replenishment required for the current inventory cycle.', am: 'ለአሁኑ የክምችት ዑደት ምንም ማሟላት አያስፈልግም።', or: 'Marsaa meeshaa ammaa kanaaf deebisanii guutuun hin barbaachisu.' },

    // History Tab
    replenishHistory: { en: 'Replenishment History', am: 'የማሟላት ታሪክ', or: 'Seenaa Guutuu Meeshaa' },
    replenishHistorySubtitle: { en: 'Completed replenishment and forward-pick restock records', am: 'የተጠናቀቁ የማሟላት እና የቀዳሚ ምርጫ ክምችት መዝገቦች', or: 'Galmeewwan xumuraman kan deebisanii guutuu fi buqqisaa' },
    searchHistoryPlaceholder: { en: 'Search history, worker, SKU...', am: 'ታሪክ፣ ሰራተኛ፣ SKU ይፈልጉ...', or: 'Seenaa, hojjetaa, SKU barbaadi...' },
    searchReplenishHistory: { en: 'Search replenishment history', am: 'የማሟላት ታሪክን ይፈልጉ', or: 'Seenaa guutuu meeshaa barbaadi' },
    internal: { en: 'Internal', am: 'የውስጥ', or: 'Keessaa' },
    noMatchingHistoryFound: { en: 'No matching replenishment history records found', am: 'ምንም ተዛማጅ የማሟላት ታሪክ መዝገቦች አልተገኙም', or: 'Galmeen seenaa guutuu meeshaa walsimu hin argamne' },
    completedByColon: { en: 'Completed By:', am: 'የተጠናቀቀው በ፡', or: 'Kan Xumure:' },
    unitsWord: { en: 'units', am: 'አሃዶች', or: 'qodaa' },
    historyRecordsWord: { en: 'history records', am: 'የታሪክ መዝገቦች', or: 'galmeewwan seenaa' },
    itemsWord: { en: 'items', am: 'ዕቃዎች', or: 'meeshaalee' },
};
