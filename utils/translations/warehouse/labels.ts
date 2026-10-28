import { TranslationBlock } from '../types';

export const labels: any = {
    // Leaf translation for the key "labels" itself (e.g. t('warehouse.labels'))
    en: 'Labels',
    am: 'መለያዎች',
    or: 'Mallattoo Meeshaa',

    // Hub Header & Modes
    labelPrintingHub: {
        en: 'Label Printing Hub',
        am: 'የመለያ ማተሚያ ማዕከል',
        or: 'Wiirtuu Maxxansa Mallattoo'
    },
    managementAndIdentitySystems: {
        en: 'Management & Identity Systems',
        am: 'የአስተዳደር እና የማንነት ስርዓቶች',
        or: 'Sirna Hoggana fi Eenyummaa Meeshaa'
    },
    productsMode: {
        en: 'Products',
        am: 'ምርቶች',
        or: 'Oomishoota'
    },
    baysMode: {
        en: 'Bays',
        am: 'ቦታዎች',
        or: 'Iddoo Kuusaa'
    },
    selectFacilityToPrepareLabels: {
        en: 'Select a facility to prepare labels.',
        am: 'መለያዎችን ለማዘጋጀት ተቋም ይምረጡ።',
        or: 'Mallattoo qopheessuuf giddugala filadhaa.'
    },

    // Format & Size Presets
    formatLabel: {
        en: 'Format',
        am: 'ቅርጸት',
        or: 'Boca'
    },
    sizeLabel: {
        en: 'Size',
        am: 'መጠን',
        or: 'Hamma'
    },
    barcodeFormat: {
        en: 'Barcode',
        am: 'ባርኮድ',
        or: 'Baarkoodii'
    },
    qrCodeFormat: {
        en: 'QR Code',
        am: 'QR ኮድ',
        or: 'QR Koodii'
    },

    // Bay Location Selector
    zoneFieldLabel: {
        en: 'Zone ({min}–{max})',
        am: 'ዞን ({min}–{max})',
        or: 'Zoonii ({min}–{max})'
    },
    aisleFieldLabel: {
        en: 'Aisle (1–{max})',
        am: 'መተላለፊያ (1–{max})',
        or: 'Daandii Kuusaa (1–{max})'
    },
    bayFieldLabel: {
        en: 'Bay (1–{max})',
        am: 'ቦታ (1–{max})',
        or: 'Iddoo / Bayii (1–{max})'
    },
    noConfiguredZonesAvailable: {
        en: 'No configured zones are available at this facility. Configure the warehouse layout before printing bay labels.',
        am: 'በዚህ ተቋም ምንም የተዋቀሩ ዞኖች አይገኙም። የቦታ መለያዎችን ከማተምዎ በፊት የመጋዘን አቀማመጥን ያዋቅሩ።',
        or: 'Giddugala kanatti zooniin qophaa\'e hin jiru. Waraqaa iddoo maxxansuun dura tartiiba manna-kuusaa qopheessaa.'
    },
    generateLocationLabelButton: {
        en: 'GENERATE LOCATION LABEL',
        am: 'የቦታ መለያ ፍጠር',
        or: 'MALLATTOO IDDOO UUMI'
    },

    // Product Search & Matching
    searchProductOrScanSku: {
        en: 'Search Product Name or Scan SKU...',
        am: 'የምርት ስም ይፈልጉ ወይም SKU ይቃኙ...',
        or: 'Maqaa Oomishaa barbaadi ykn SKU iskaani...'
    },
    matchedBadge: {
        en: 'Matched',
        am: 'ተዛምዷል',
        or: 'Walsimeera'
    },
    noUniqueProductMatch: {
        en: 'No unique product match — scan an exact SKU or barcode',
        am: 'ምንም የተዛመደ ምርት የለም - ትክክለኛውን SKU ወይም ባርኮድ ይቃኙ',
        or: 'Oomishni walsimu hin argamne — SKU ykn baarkoodii sirrii iskaani'
    },
    printQtyHeader: {
        en: 'PRINT QTY',
        am: 'የህትመት ብዛት',
        or: 'BAAY\'INA MAXXANSAA'
    },
    printProductBarcodeButton: {
        en: 'PRINT PRODUCT {format}',
        am: 'የምርት {format} አትም',
        or: '{format} OOMISHAA MAXXANSI'
    },
    labelsTipsNotice: {
        en: 'TIPS: Labels include price and category by default. For inventory tracking, use barcodes for faster scanning.',
        am: 'ጠቃሚ ምክር፡ መለያዎች በነባሪ ዋጋ እና ምድብ ያካትታሉ። ለክምችት ክትትል ፈጣን ቅኝት ለማድረግ ባርኮዶችን ይጠቀሙ።',
        or: 'GORSII: Mallattoon gatii fi ramaddii of keessaa qaba. Hordoffii kuusaatiif iskaanii saffisaa gochuuf baarkoodii fayyadamaa.'
    },

    // Preview Card & Live Output
    liveLocationPreview: {
        en: 'Live Location Preview',
        am: 'የቀጥታ የቦታ ቅድመ እይታ',
        or: 'Dura-Ilaalcha Qajeeltoo Iddoo'
    },
    liveBarcodePreview: {
        en: 'Live Barcode Preview',
        am: 'የቀጥታ የባርኮድ ቅድመ እይታ',
        or: 'Dura-Ilaalcha Qajeeltoo Baarkoodii'
    },
    expandPreviewButton: {
        en: 'Expand preview',
        am: 'ቅድመ እይታን አስፋ',
        or: 'Dura-ilaalcha bal\'isi'
    },
    quickPreviewButton: {
        en: 'QUICK PREVIEW',
        am: 'ፈጣን ቅድመ እይታ',
        or: 'DURA-ILAALCHA ARIIFATAA'
    },
    retailPriceLabel: {
        en: 'Retail Price',
        am: 'የችርቻሮ ዋጋ',
        or: 'Gatii Quncheessaa'
    },
    classificationLabel: {
        en: 'Classification',
        am: 'ምድብ / ክፍል',
        or: 'Ramaddii Meeshaa'
    },
    locationIdentifierLabel: {
        en: 'Location Identifier',
        am: 'የቦታ መለያ',
        or: 'Adda Baastuu Iddoo'
    },
    zoneTitle: { en: 'Zone', am: 'ዞን', or: 'Zoonii' },
    aisleTitle: { en: 'Aisle', am: 'መተላለፊያ', or: 'Daandii Kuusaa' },
    bayTitle: { en: 'Bay', am: 'ቦታ', or: 'Iddoo / Bayii' },
    warehouseLocationSuffix: {
        en: '{facility} Location',
        am: 'የ{facility} ቦታ',
        or: 'Iddoo {facility}'
    },
    inventoryProductFallback: {
        en: 'Inventory Product',
        am: 'የክምችት ምርት',
        or: 'Oomisha Kuusaa'
    },
    thermalDirectPaper: {
        en: 'Thermal Direct Paper',
        am: 'ቴርማል ዳይሬክት ወረቀት',
        or: 'Waraqaa Termaalii Qajeeltoo'
    },
    scannableHighContrast: {
        en: 'Scannable 100% Contrast',
        am: 'ሊቃኝ የሚችል 100% ንፅፅር',
        or: 'Iskaanamaa Qulqullina 100%'
    },

    // Modal
    barcodeAndThermalPreviewTitle: {
        en: 'Barcode & Thermal Label Preview',
        am: 'የባርኮድ እና የቴርማል መለያ ቅድመ እይታ',
        or: 'Dura-Ilaalcha Baarkoodii fi Mallattoo Termaalii'
    },
    scannabilityCheckSubtitle: {
        en: 'Live scannability check & 1:1 thermal layout before physical print',
        am: 'ከህትመት በፊት የቀጥታ የቅኝት ማረጋገጫ እና 1:1 የቴርማል አቀማመጥ',
        or: 'Maxxansuun dura sakatta\'iinsa iskaanii fi boca termaalii 1:1'
    },
    opticalVerificationLabel: {
        en: 'Optical Verification',
        am: 'የኦፕቲካል ማረጋገጫ',
        or: 'Mirkaneessa Iskaanii'
    },
    scannableBadge: {
        en: 'Scannable',
        am: 'ሊቃኝ የሚችል',
        or: 'Kan Iskaanamu'
    },
    reviewBadge: {
        en: 'Review',
        am: 'ይገምግሙ',
        or: 'Irra Deebi\'ii Ilaali'
    },
    scannerEmittedValueLabel: {
        en: 'Scanner Emitted Value:',
        am: 'የቃኚው ውጤት ዋጋ፡',
        or: 'Gatii Iskaaniin Baafame:'
    },
    symbologyLabel: {
        en: 'Symbology:',
        am: 'የኮድ አይነት፡',
        or: 'Gosa Mallattoo:'
    },
    labelPresetLabel: {
        en: 'Label Preset:',
        am: 'የመለያ ቅድመ-ቅምጥ፡',
        or: 'Qophii Durii Mallattoo:'
    },
    printCopiesTitle: {
        en: 'Print Copies',
        am: 'የህትመት ቅጂዎች',
        or: 'Koppii Maxxansaa'
    },
    batchQuantitySubtitle: {
        en: 'Batch quantity',
        am: 'የቡድን ብዛት',
        or: 'Baay\'ina walitti-qabamaa'
    },
    closePreviewButton: {
        en: 'Close Preview',
        am: 'ቅድመ እይታን ዝጋ',
        or: 'Dura-ilaalcha Cufi'
    },
    printLabelsNowButton: {
        en: 'Print {count} Labels Now',
        am: 'አሁን {count} መለያዎችን አትም',
        or: 'Amma Mallattoowwan {count} Maxxansi'
    },
    printSingleLabelNowButton: {
        en: 'Print Label Now',
        am: 'አሁን መለያ አትም',
        or: 'Amma Mallattoo Maxxansi'
    },
    thermalSimulationLabel: {
        en: '1:1 Thermal Output Simulation',
        am: '1:1 የቴርማል ውጤት ማስመሰል',
        or: 'Walsimsiisa Bu\'aa Termaalii 1:1'
    }
};
