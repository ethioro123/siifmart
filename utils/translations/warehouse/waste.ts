import { TranslationBlock } from '../types';

export const waste: any = {
    // Leaf translation for the key "waste" itself (e.g. t('warehouse.waste'))
    en: 'Waste',
    am: 'ብክነት',
    or: 'Balleessa fi Miidhama',

    // Header & Navigation
    wasteManagementTitle: {
        en: 'Waste & Spoilage Management',
        am: 'የብክነት እና የብልሽት አስተዳደር',
        or: 'Hoggana Balleessa fi Qisaasa Meeshaa'
    },
    wasteSubtitle: {
        en: 'Log and track inventory write-offs',
        am: 'የዕቃ ዝርዝር ቅነሳዎችን ይመዝግቡ እና ይከታተሉ',
        or: 'Galmee fi hordoffii haqama meeshaalee miidhamanii'
    },
    logWaste: {
        en: 'Log Waste',
        am: 'ብክነት መዝግብ',
        or: 'Balleessa Galmeessi'
    },
    logShort: {
        en: 'Log',
        am: 'መዝግብ',
        or: 'Galmee'
    },
    historyShort: {
        en: 'History',
        am: 'ታሪክ',
        or: 'Seenaa'
    },
    writeOffsBadge: {
        en: 'Write-offs',
        am: 'ቅነሳዎች',
        or: 'Haqama'
    },

    // Form inputs & labels
    addItemToLog: {
        en: 'Add Item to Log',
        am: 'ዕቃ ወደ መዝገብ ጨምር',
        or: 'Meeshaa Galmeetti Dabali'
    },
    productLabel: {
        en: 'Product',
        am: 'ምርት',
        or: 'Oomisha'
    },
    selectProductPrompt: {
        en: 'Select Product...',
        am: 'ምርት ይምረጡ...',
        or: 'Oomisha Filadhu...'
    },
    quantityLabel: {
        en: 'Quantity',
        am: 'ብዛት',
        or: 'Baay\'ina'
    },
    reasonLabel: {
        en: 'Reason',
        am: 'ምክንያት',
        or: 'Sababa'
    },
    notesEvidenceLabel: {
        en: 'Notes / Evidence',
        am: 'ማስታወሻዎች / ማስረጃ',
        or: 'Yaada / Ragaa'
    },
    describeDamagePlaceholder: {
        en: 'Describe damage...',
        am: 'ጉዳቱን ይግለጹ...',
        or: 'Miidhama ibsi...'
    },
    addToBasket: {
        en: 'Add to Basket',
        am: 'ወደ ቅርጫት ጨምር',
        or: 'Qodaa Balleessaatti Dabali'
    },

    // Waste reasons
    reasonExpired: {
        en: 'Expired',
        am: 'ጊዜው ያለፈበት',
        or: 'Yeroon kan Darbe'
    },
    reasonDamaged: {
        en: 'Damaged',
        am: 'የተጎዳ',
        or: 'Kan Miidhame'
    },
    reasonSpoiled: {
        en: 'Spoiled',
        am: 'የተበላሸ',
        or: 'Kan Balleeffame'
    },
    reasonTheft: {
        en: 'Theft',
        am: 'ስርቆት',
        or: 'Hanna'
    },
    reasonOther: {
        en: 'Other',
        am: 'ሌላ',
        or: 'Kan Biraa'
    },

    // Basket & Confirmation
    wasteBasketTitle: {
        en: 'Waste Basket ({count})',
        am: 'የብክነት ቅርጫት ({count})',
        or: 'Qodaa Balleessaa ({count})'
    },
    clearAll: {
        en: 'Clear All',
        am: 'ሁሉንም አጽዳ',
        or: 'Hunda Qulqulleessi'
    },
    basketIsEmpty: {
        en: 'Basket is empty',
        am: 'ቅርጫቱ ባዶ ነው',
        or: 'Qodaan duwwaa dha'
    },
    totalValueLoss: {
        en: 'Total Value Loss',
        am: 'አጠቃላይ የጠፋ ዋጋ',
        or: 'Gatii Waliigalaa Badde'
    },
    confirmDisposal: {
        en: 'Confirm Disposal',
        am: 'ማስወገድን አረጋግጥ',
        or: 'Balleessuu Mirkaneessi'
    },
    processingProgress: {
        en: 'Processing...',
        am: 'በሂደት ላይ...',
        or: 'Adeemsarra jira...'
    },
    removeItemAria: {
        en: 'Remove Item',
        am: 'ዕቃ አስወግድ',
        or: 'Meeshaa Haqi'
    },

    // Notifications & Prompts
    selectProductAndQuantityPrompt: {
        en: 'Please select product and quantity',
        am: 'እባክዎ ምርት እና ብዛት ይምረጡ',
        or: 'Maaloo oomisha fi baay\'ina filadhaa'
    },
    validQuantityPrompt: {
        en: 'Please enter a valid quantity greater than zero',
        am: 'እባክዎ ከዜሮ በላይ የሆነ ትክክለኛ ብዛት ያስገቡ',
        or: 'Maaloo baay\'ina sirrii zeeroo ol ta\'e galchaa'
    },
    itemAddedToBasket: {
        en: 'Item added to waste basket',
        am: 'ዕቃው ወደ ብክነት ቅርጫት ተጨምሯል',
        or: 'Meeshaan qodaa balleessaatti dabalameera'
    },
    highValueWasteConfirm: {
        en: 'High value waste ({formattedValue}). Are you sure? This will be flagged for review.',
        am: 'ከፍተኛ ዋጋ ያለው ብክነት ({formattedValue})። እርግጠኛ ነዎት? ይህ ለግምገማ ምልክት ይደረግበታል።',
        or: 'Balleessa gatii ol\'aanaa ({formattedValue}). Mirkaneeffattaniittuu? Qorannoof ni mallatteeffama.'
    },
    confirmDisposalPrompt: {
        en: 'Confirm disposal of these items?',
        am: 'የእነዚህን ዕቃዎች ማስወገድ ያረጋግጡ?',
        or: 'Balleessa meeshaalee kanaa ni mirkaneessituu?'
    },
    wasteRequestsSubmitted: {
        en: 'Waste adjustment requests submitted for approval',
        am: 'የብክነት ማስተካከያ ጥያቄዎች ለማጽደቅ ቀርበዋል',
        or: 'Gaaffiin sirreeffama balleessaa heeyyamaaf dhiyaateera'
    },
    failedWasteSubmit: {
        en: 'Failed to submit waste disposal requests',
        am: 'የብክነት ማስወገጃ ጥያቄዎችን ማቅረብ አልተሳካም',
        or: 'Gaaffii balleessaa dhiyeessuun hin milkoofne'
    },

    // Waste History
    wasteLogsTitle: {
        en: 'Waste Logs',
        am: 'የብክነት ምዝግብ ማስታወሻዎች',
        or: 'Seenaa Balleessaa'
    },
    wasteHistorySubtitle: {
        en: 'Recent spoilage and damage records',
        am: 'የቅርብ ጊዜ የብልሽት እና የጉዳት መዝገቦች',
        or: 'Galmeewwan qisaasaa fi miidhama dhiyoo'
    },
    searchHistoryPlaceholder: {
        en: 'Search history...',
        am: 'ታሪክ ፈልግ...',
        or: 'Seenaa barbaadi...'
    },
    noMatchingWasteHistory: {
        en: 'No matching waste history found',
        am: 'ምንም ተዛማጅ የብክነት ታሪክ አልተገኘም',
        or: 'Galmeen seenaa balleessaa walsimu hin argamne'
    },
    unknownItem: {
        en: 'Unknown Item',
        am: 'ያልታወቀ ዕቃ',
        or: 'Meeshaa Hin Beekamne'
    },
    byWorker: {
        en: 'By: {name}',
        am: 'በ፡ {name}',
        or: 'Kan: {name}'
    },
    unitsWord: {
        en: 'units',
        am: 'ክፍሎች',
        or: 'qodaa'
    },
    historyItemName: {
        en: 'history',
        am: 'ታሪክ',
        or: 'seenaa'
    }
};
