import { TranslationBlock } from '../types';

export const count: any = {
    // Leaf translation for the key "count" itself (e.g. t('warehouse.count'))
    en: 'Count',
    am: 'ቆጠራ',
    or: 'Lakkoofsa Meeshaa',

    inventoryAuditTitle: {
        en: 'Inventory Audit & Cycle Counting',
        am: 'የዕቃ ቆጠራ እና የዑደት ቆጠራ',
        or: 'Qorannoo Kuusaa & Lakkoofsa Marsaa'
    },
    startCountSession: {
        en: 'Start a new count session',
        am: 'አዲስ የቆጠራ ክፍለ ጊዜ ይጀምሩ',
        or: 'Yeroo lakkoofsaa haaraa jalqabi'
    },
    blindCountInProgress: {
        en: 'BLIND COUNT IN PROGRESS',
        am: 'ዕውር ቆጠራ በመካሄድ ላይ ነው',
        or: 'LAKKOOFSA IJA-CUFAA HOJII IRRA JIRA'
    },
    reviewApproveVariances: {
        en: 'Review & Approve Variances',
        am: 'ልዩነቶችን ይገምግሙ እና ያጽድቁ',
        or: 'Baqiyyaa Gamgami & Mirkaneessi'
    },
    historicalAccuracyReports: {
        en: 'Historical accuracy and variance reports',
        am: 'የታሪክ ትክክለኛነት እና የልዩነት ሪፖርቶች',
        or: 'Gabaasa sirrummaa seenaa fi baqiyyaa'
    },
    operations: {
        en: 'Operations',
        am: 'ክዋኔዎች',
        or: 'Hojiiwwan'
    },
    reports: {
        en: 'Reports',
        am: 'ሪፖርቶች',
        or: 'Gabaasota'
    },
    cancelCurrentSessionPrompt: {
        en: 'Cancel current session? Progress will be lost.',
        am: 'የአሁኑን ክፍለ ጊዜ ይሰርዙ? ሂደት ይጠፋል።',
        or: 'Yeroo lakkoofsaa ammaa haquu? Adeemsi ni bada.'
    },
    cancelSession: {
        en: 'Cancel Session',
        am: 'ክፍለ ጊዜ ሰርዝ',
        or: 'Yeroo Lakkoofsaa Haqi'
    },
    inventoryAccuracy: {
        en: 'Inventory Accuracy',
        am: 'የዕቃ ዝርዝር ትክክለኛነት',
        or: 'Sirrummaa Kuusaa'
    },
    varianceFromLastMonth: {
        en: '↑ 1.2% from last month',
        am: '↑ ካለፈው ወር 1.2% ጨምሯል',
        or: '↑ Ji\'a darbe irra 1.2% dabaleera'
    },
    netVarianceValue: {
        en: 'Net Variance Value',
        am: 'የተጣራ የልዩነት ዋጋ',
        or: 'Gatii Baqiyyaa Qulqulluu'
    },
    totalAdjustmentValue: {
        en: 'Total value of adjustments',
        am: 'አጠቃላይ የማስተካከያ ዋጋ',
        or: 'Gatii Waliigala Sirreeffama Baqiyyaa'
    },
    cycleCountsYTD: {
        en: 'Cycle Counts YTD',
        am: 'የዑደት ቆጠራዎች YTD',
        or: 'Lakkoofsa Marsaa YTD'
    },
    itemsCountedThisYear: {
        en: 'Items counted this year',
        am: 'በዚህ ዓመት የተቆጠሩ ዕቃዎች',
        or: 'Meeshalee waggaa kana lakkaa\'aman'
    },
    countHistory: {
        en: 'Count History',
        am: 'የቆጠራ ታሪክ',
        or: 'Seenaa Lakkoofsaa'
    },
    recentVarianceAdjustments: {
        en: 'Recent variance and cycle count adjustments',
        am: 'የቅርብ ጊዜ ልዩነት እና የዑደት ቆጠራ ማስተካከያዎች',
        or: 'Sirreeffama baqiyyaa fi lakkoofsa marsaa dhiyoo'
    },
    searchHistory: {
        en: 'Search history...',
        am: 'ታሪክ ፈልግ...',
        or: 'Seenaa barbaadi...'
    },
    noMatchingHistory: {
        en: 'No matching history found',
        am: 'ምንም ተዛማጅ ታሪክ አልተገኘም',
        or: 'Seenaan walsimu hin argamne'
    },
    units: {
        en: 'units',
        am: 'ክፍሎች',
        or: 'qodaa'
    },
    dailyCycleCount: {
        en: 'Daily Cycle Count',
        am: 'ዕለታዊ የዑደት ቆጠራ',
        or: 'Lakkoofsa Marsaa Guyyaa'
    },
    routineCountAisleA: {
        en: 'Routine count of Aisle A',
        am: 'የመተላለፊያ A መደበኛ ቆጠራ',
        or: 'Lakkoofsa idilee Dabarbii A'
    },
    spotCheck: {
        en: 'Spot Check',
        am: 'ፈጣን ፍተሻ',
        or: 'Sakatta\'a Bakkaa'
    },
    randomAuditFiveItems: {
        en: 'Random audit of 5 items',
        am: 'የ5 ዕቃዎች የዘፈቀደ ኦዲት',
        or: 'Odiitii tasaa meeshalee 5'
    },
    blindCountModeInfo: {
        en: 'Blind Count Mode: System quantities are hidden to ensure accuracy.',
        am: 'ዕውር ቆጠራ ሁኔታ፡ ትክክለኛነትን ለማረጋገጥ የስርዓት ብዛቶች ተደብቀዋል።',
        or: 'Haala Lakkoofsa Ija-Cufaa: Sirrummaa eeguuf baay\'inni sirnaa dhokfameera.'
    },
    pleaseCountAllItems: {
        en: 'Please count all items before finishing.',
        am: 'እባክዎን ከመጨረስዎ በፊት ሁሉንም ዕቃዎች ይቁጠሩ።',
        or: 'Maaloo xumuruun dura meeshalee hunda lakkaa\'i.'
    },
    finishReview: {
        en: 'Finish & Review',
        am: 'ጨርስ እና ገምግም',
        or: 'Xumuri & Gamgami'
    },
    totalItems: {
        en: 'Total Items',
        am: 'አጠቃላይ ዕቃዎች',
        or: 'Meeshalee Walii Galaa'
    },
    accurate: {
        en: 'Accurate',
        am: 'ትክክለኛ',
        or: 'Sirrii'
    },
    variance: {
        en: 'Variance',
        am: 'ልዩነት',
        or: 'Baqiyyaa'
    },
    recount: {
        en: 'Recount',
        am: 'ድጋሚ ቁጠር',
        or: 'Deebisi Lakkaa\'i'
    },
    recountMarkedInfo: {
        en: 'Marked {name} for recount.',
        am: 'ምርት {name} ለድጋሚ ቆጠራ ምልክት ተደርጎበታል።',
        or: 'Oomishni {name} deebisanii lakkaa\'uuf mallatteeffameera.'
    },
    approveVariance: {
        en: 'Approve Variance',
        am: 'ልዩነትን አጽድቅ',
        or: 'Baqiyyaa Mirkaneessi'
    },
    varianceRequestSubmitted: {
        en: 'Variance adjustment request submitted for approval.',
        am: 'የልዩነት ማስተካከያ ጥያቄ ለማጽደቅ ቀርቧል።',
        or: 'Gaaffiin sirreeffama baqiyyaa mirkaneessaaf dhiyaateera.'
    },
    failedVarianceSubmit: {
        en: 'Failed to submit variance approval',
        am: 'የልዩነት ማጽደቂያ ማቅረብ አልተሳካም',
        or: 'Mirkaneessa baqiyyaa dhiyeessuun hin danda\'amne'
    },
    adjusted: {
        en: 'Adjusted',
        am: 'የተስተካከለ',
        or: 'Sirreeffameera'
    },
    matched: {
        en: 'Matched',
        am: 'የተገጣጠመ',
        or: 'Walsimeera'
    },
    unapprovedVariancesPrompt: {
        en: 'There are unapproved variances. Finish anyway?',
        am: 'ያልጸደቁ ልዩነቶች አሉ። ለማንኛውም ልጨርስ?',
        or: 'Baqiyyaan hin mirkanoofne jira. Ta\'us xumuruu?'
    },
    countSessionCompleted: {
        en: 'Count session completed!',
        am: 'የቆጠራ ክፍለ ጊዜ ተጠናቅቋል!',
        or: 'Yeroon lakkoofsaa xumurameera!'
    },
    completeSession: {
        en: 'Complete Session',
        am: 'ክፍለ ጊዜ ጨርስ',
        or: 'Yeroo Lakkoofsaa Xumuri'
    },

    // Additional East Hararghe Count Keys
    auditShort: { en: 'Audit', am: 'ኦዲት', or: 'Qorannoo' },
    opsShort: { en: 'Ops', am: 'ክዋኔ', or: 'Hojii' },
    reportsShort: { en: 'Reports', am: 'ሪፖርቶች', or: 'Gabaasa' },
    cancelShort: { en: 'Cancel', am: 'ሰርዝ', or: 'Haqi' },
    dailyCycleCountDesc: {
        en: 'Start a site-scoped blind count. The expected quantities stay on the server.',
        am: 'የጣቢያ አቀፍ ዕውር ቆጠራ ይጀምሩ። የሚጠበቁ ብዛቶች በአገልጋዩ ላይ ይቆያሉ።',
        or: 'Lakkoofsa ija-cufaa buufata kanaa jalqabi. Baay\'inni eegamu sarvararra tura.'
    },
    spotCheckDesc: {
        en: 'Select a small random sample from this site.',
        am: 'ከዚህ ጣቢያ ትንሽ የዘፈቀደ ናሙና ይምረጡ።',
        or: 'Buufata kana irraa fakkeenya muraasa tasaa filadhu.'
    },
    blindCountNotice: {
        en: 'Blind count in progress. Record the quantity physically present; expected quantities are withheld.',
        am: 'ዕውር ቆጠራ በሂደት ላይ ነው። በአካል የሚገኘውን ብዛት ይመዝግቡ፤ የሚጠበቁ ብዛቶች ተደብቀዋል።',
        or: 'Lakkoofsi ija-cufaa hojii irra jira. Baay\'ina qabatamaan argame galchi; baay\'inni eegamu ni dhokfama.'
    },
    varianceDetectedRecount: {
        en: 'Variance detected · independent recount required',
        am: 'ልዩነት ተገኝቷል · ገለልተኛ ድጋሚ ቆጠራ ያስፈልጋል',
        or: 'Baqiyyaan argameera · lakkoofsi lammaffaa of-danda\'e ni barbaachisa'
    },
    countRecorded: {
        en: 'Count recorded',
        am: 'ቆጠራው ተመዝግቧል',
        or: 'Lakkoofsi galmaa\'eera'
    },
    enterPhysicalQtyCounted: {
        en: 'Enter the physical quantity counted.',
        am: 'በአካል የተቆጠረውን ብዛት ያስገቡ።',
        or: 'Baay\'ina qabatamaan lakkaa\'ame galchi.'
    },
    unableToSaveCount: {
        en: 'Unable to save this count.',
        am: 'ይህንን ቆጠራ ማስቀመጥ አልተቻለም።',
        or: 'Lakkoofsa kana kusuun hin danda\'amne.'
    },
    secondWorkerRecountNotice: {
        en: 'A second authenticated worker must recount every variance before submission.',
        am: 'ከማቅረቡ በፊት ሁለተኛ የተረጋገጠ ሰራተኛ እያንዳንዱን ልዩነት በድጋሚ መቁጠር አለበት።',
        or: 'Hojjetaan mirkanaa\'e lammaffaan erguun dura baqiyyaa hunda deebisee lakkaa\'uu qaba.'
    },
    unableToCompleteCountSession: {
        en: 'Unable to complete this count session.',
        am: 'ይህንን የቆጠራ ክፍለ ጊዜ ማጠናቀቅ አልተቻለም።',
        or: 'Yeroo lakkoofsaa kana xumuruun hin danda\'amne.'
    },
    unableToStartCountSession: {
        en: 'Unable to start a count session.',
        am: 'የቆጠራ ክፍለ ጊዜ መጀመር አልተቻለም።',
        or: 'Yeroo lakkoofsaa jalqabuun hin danda\'amne.'
    },
    waitingForAnotherWorker: {
        en: 'Waiting for another worker',
        am: 'ሌላ ሰራተኛ በመጠባበቅ ላይ',
        or: 'Hojjetaa biraa eegaa jira'
    },
    savedWord: {
        en: 'Saved',
        am: 'ተቀምጧል',
        or: 'Kusameera'
    },
    recordWord: {
        en: 'Record',
        am: 'መዝግብ',
        or: 'Galmeessi'
    },
    recountWord: {
        en: 'Recount',
        am: 'እንደገና ቁጠር',
        or: 'Irra Deebi\'ii Lakkaa\'i'
    },
    savingProgress: {
        en: 'Saving…',
        am: 'በማስቀመጥ ላይ…',
        or: 'Kusaa jira…'
    },
    submittingProgress: {
        en: 'Submitting…',
        am: 'በማስገባት ላይ…',
        or: 'Ergaa jira…'
    },
    completeAndSubmitVariances: {
        en: 'Complete and submit variances',
        am: 'ያጠናቅቁ እና ልዩነቶችን ያስገቡ',
        or: 'Xumuri fi baqiyyaa ergi'
    },
    noAssignedSite: {
        en: 'Your account has no assigned site.',
        am: 'መለያዎ የተመደበ ጣቢያ የለውም።',
        or: 'Akkaawuntiin keessan buufata ramadame hin qabu.'
    },
    noActiveCountSession: {
        en: 'No active count session.',
        am: 'ምንም ንቁ የቆጠራ ክፍለ ጊዜ የለም።',
        or: 'Yeroon lakkoofsaa hojiirra jiru hin jiru.'
    },
    varianceRequestsSentHQ: {
        en: '{count} variance request(s) sent for HQ approval.',
        am: '{count} የልዩነት ጥያቄዎች ለዋና መ/ቤት ማጽደቂያ ተልከዋል።',
        or: 'Gaaffiin baqiyyaa {count} heeyyama HQ\'f ergameera.'
    },
    blindCountCompletedNoVariance: {
        en: 'Blind count completed with no variances.',
        am: 'ዕውር ቆጠራ ያለ ምንም ልዩነት ተጠናቋል።',
        or: 'Lakkoofsi ija-cufaa baqiyyaa tokko malee xumurameera.'
    },
    sessionCancelledAuditHistory: {
        en: 'Count session cancelled and retained in the audit history.',
        am: 'የቆጠራ ክፍለ ጊዜ ተሰርዞ በኦዲት ታሪክ ውስጥ ተቀምጧል።',
        or: 'Yeroon lakkoofsaa haqamee seenaa qorannoo keessatti kuufameera.'
    },
    unableToCancelCountSession: {
        en: 'Unable to cancel this count session.',
        am: 'ይህንን የቆጠራ ክፍለ ጊዜ መሰረዝ አልተቻለም።',
        or: 'Yeroo lakkoofsaa kana haquun hin danda\'amne.'
    },
    couldNotRestoreActiveCount: {
        en: 'Could not restore the active count. Refresh and try again.',
        am: 'ንቁ ቆጠራን ወደነበረበት መመለስ አልተቻለም። ያድሱ እና እንደገና ይሞክሩ።',
        or: 'Lakkoofsa hojiirra jiru deebisuun hin danda\'amne. Haaromsiitii yaali.'
    },
    unknownItem: {
        en: 'Unknown Item',
        am: 'ያልታወቀ ዕቃ',
        or: 'Meeshaa Hin Beekamne'
    },
    historyItemName: {
        en: 'history',
        am: 'ታሪክ',
        or: 'seenaa'
    },
    physicalCountForSku: {
        en: 'Physical count for {sku}',
        am: 'ለ {sku} በአካል የተቆጠረ',
        or: 'Lakkoofsa qabatamaa {sku}\'f'
    }
};
