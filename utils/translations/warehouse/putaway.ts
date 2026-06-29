import { TranslationBlock } from '../types';

export const putaway: TranslationBlock = {
    // PUTAWAY Tab UI
    syncOperations: { en: 'Sync Operations', am: 'ተግባራትን አስተካክል', or: 'Hojiiwwan Walsimsiisi' },
    noSku: { en: 'No SKU', am: 'SKU የለም', or: 'SKU Hin Jiru' },
    percentComplete: { en: '% Complete', am: '% ተጠናቋል', or: '% Xumurame' },

    putawayOperations: { en: 'Putaway Operations', am: 'የማስቀመጫ ስራዎች', or: 'Tarkaanfii Galiinsa Kuusaa Keessatti' },
    putawayJobs: { en: 'Putaway Jobs', am: 'የማስቀመጫ ስራዎች', or: 'Hojiiwwan Kaawwachuu' },
    itemsToPutaway: { en: 'Items to Putaway', am: 'ለማስቀመጥ ዕቃዎች', or: 'Meeshalee Kaawwachuu' },
    storeReceivedGoods: { en: 'Store received goods in warehouse locations', am: 'የተቀበሉ እቃዎችን በመጋዘን ቦታዎች ውስጥ አከማች', or: 'Meeshaa fudhataman bakka kuusaa keessatti kaa\'i' },

    // Putaway Hub
    hubTitle: { en: 'Putaway Operations Hub', am: 'የማስቀመጫ ስራዎች ማዕከል', or: 'Wiirtuu Hojii Kaawwachuu' },
    storageMatrixActive: { en: 'Storage Matrix Active', am: 'የማከማቻ ማትሪክስ ንቁ', or: 'Kuusaa Maatriksii Jireenyaa' },
    capacity: { en: 'Capacity', am: 'አቅም', or: 'Dandeettii' },
    inbound: { en: 'Inbound', am: 'ገቢ', or: 'Seensaa' },
    scanJobIdOrSku: { en: 'Scan Job ID or SKU...', am: 'የስራ መታወቂያ ወይም SKU ስካን...', or: 'Eenyummaa Hojii yookaan SKU Iskaani...' },
    queueEmpty: { en: 'Storage Queue Empty', am: 'የማከማቻ ወረፋ ባዶ', or: 'Tarree Kuusaa Duwwaa' },
    progress: { en: 'Progress', am: 'ሂደት', or: 'Adeemsa' },
    assignUser: { en: 'Assign User', am: 'ተጠቃሚ መድብ', or: 'Fayyadamaa Ramadi' },
    noPendingPutawayJobs: { en: 'No pending putaway jobs matching current filters.', am: 'ምንም የማስቀመጫ ስራዎች የሉም።', or: 'Hojiiwwan kaawwachuu eegaa jiran hin jiran.' },
    startPutaway: { en: 'Start Putaway', am: 'ማስቀመጥ ጀምር', or: 'Kaawwachuu Jalqabi' },

    // New keys for complete translation
    putaway: { en: 'Putaway', am: 'ማስቀመጥ', or: 'Kaawwachuu' },
    active: { en: 'Active', am: 'ንቁ', or: 'Hojii Irra' },
    pending: { en: 'Pending', am: 'በመጠባበቅ ላይ', or: 'Eeggataa' },
    totalItems: { en: 'Total Items', am: 'ጠቅላላ ዕቃዎች', or: 'Meeshalee Waliigalaa' },
    system: { en: 'System', am: 'ስርዓት', or: 'Miseensa' },
    search: { en: 'Search...', am: 'ፈልግ...', or: 'Barbaadi...' },
    process: { en: 'Process', am: 'ማቀነባበር', or: 'Adeemsi' },
    history: { en: 'History', am: 'ታሪክ', or: 'Seenaa' },
    noJobsFound: { en: 'No Jobs Found', am: 'ምንም ስራዎች አልተገኙም', or: 'Hojiin Hin Argamne' },
    noJobsMatchingFilters: { en: 'No jobs found matching your filters.', am: 'ከእርስዎ ማጣሪያዎች ጋር የሚስማማ ምንም ስራ አልተገኘም።', or: 'Hojiin calaqqee keessan wajjin deemu hin argamne.' },
    inventoryItems: { en: 'Inventory Items', am: 'የእቃ ዝርዝር ዕቃዎች', or: 'Meeshalee Kuusaa' },
    deleteJobConfirm: { en: 'Are you sure you want to permanently delete this job?', am: 'ይህን ስራ በቋሚነት መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?', or: 'Hojii kana guutummaatti haquu kee mirkaneeffatteettaa?' },
    assignWorker: { en: 'Assign Worker', am: 'ሰራተኛ መድብ', or: 'Hojjataa Ramadi' },
    scanLocation: { en: 'Scan Location', am: 'ቦታ ስካን ያድርጉ', or: 'Iddoo Iskaani' },
    scanSkuToConfirm: { en: 'Scan SKU to Confirm', am: 'ለማረጋገጥ SKU ስካን ያድርጉ', or: 'Mirkaneessuuf SKU Iskaani' },
    confirmLocation: { en: 'Confirm Location', am: 'ቦታውን ያረጋግጡ', or: 'Iddoo Mirkaneessi' },
    putawayQuantity: { en: 'Putaway Quantity', am: 'የማስቀመጫ መጠን', or: 'Baay\'ina Kaawwamu' },
    locationOccupants: { en: 'Location Occupants', am: 'የቦታው ነዋሪዎች', or: 'Meeshalee Iddoo Sana Jiruf' },
    sourceZone: { en: 'Source Zone', am: 'የመነሻ ቀጠና', or: 'Zoonii Ka\'umsaa' },
    destZone: { en: 'Destination Zone', am: 'የመድረሻ ቀጠና', or: 'Zoonii Geessaa' },
    jobDetails: { en: 'Job Details', am: 'የስራ ዝርዝሮች', or: 'Ibsa Hojii' },
    unassigned: { en: 'Unassigned', am: 'ያልተመደበ', or: 'Kan Hin Ramadamne' },
    completedAt: { en: 'Completed At', am: 'የተጠናቀቀበት ጊዜ', or: 'Yeroo Xumurame' },
    worker: { en: 'Worker', am: 'ሰራተኛ', or: 'Hojjataa' },
};
