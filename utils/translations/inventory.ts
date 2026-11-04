import { TranslationBlock } from './types';

export const inventory: TranslationBlock = {
    stockLocations: { en: 'Stock by location and batch', am: 'ክምችት በቦታ እና በሎት', or: 'Kuusaa bakkaafi lootiin' },
    matchingProducts: { en: '{count} matching products', am: '{count} ተዛማጅ ምርቶች', or: 'Oomishaalee walsiman {count}' },
    inventorySummaryHint: { en: 'One row per product; quantities include every location at this facility.', am: 'ለእያንዳንዱ ምርት አንድ ረድፍ፤ ብዛቱ በዚህ ተቋም ያሉትን ሁሉንም ቦታዎች ያካትታል።', or: 'Oomisha tokkoof tarree tokko; baayʼinni bakka hunda kan giddugala kanaa hammata.' },
    loadingLocations: { en: 'Loading stock locations…', am: 'የክምችት ቦታዎችን በመጫን ላይ…', or: 'Bakkeewwan kuusaa feʼaa jira…' },
    locationsUnavailable: { en: 'Stock locations could not be loaded.', am: 'የክምችት ቦታዎችን መጫን አልተቻለም።', or: 'Bakkeewwan kuusaa feʼamuu hin dandeenye.' },
    refreshLocations: { en: 'Refresh', am: 'አድስ', or: 'Haaromsi' },
    noLocations: { en: 'No location records found.', am: 'የቦታ መዝገቦች አልተገኙም።', or: 'Galmeen bakka hin argamne.' },
    locationUnassigned: { en: 'Location not assigned', am: 'ቦታ አልተመደበም', or: 'Bakki hin ramadamne' },
    batchLabel: { en: 'Lot', am: 'ሎት', or: 'Lootii' },
    expiryLabel: { en: 'Expiry', am: 'የማብቂያ ቀን', or: 'Guyyaa yeroon itti darbu' },
    previousPage: { en: 'Previous', am: 'ያለፈው', or: 'Kan darbe' },
    nextPage: { en: 'Next', am: 'ቀጣይ', or: 'Kan itti aanu' },
    adjustmentLocationScope: { en: 'Location: {location} · Lot: {batch}. This adjustment applies only to this location record, not the total across locations.', am: 'ቦታ፦ {location} · ሎት፦ {batch}። ይህ ማስተካከያ ለዚህ የቦታ መዝገብ ብቻ ነው፣ ለሁሉም ቦታዎች ጠቅላላ አይደለም።', or: 'Bakka: {location} · Lootii: {batch}. Sirreeffamni kun galmee bakka kana qofa irratti hojjeta; idaʼama bakka hundaa irratti miti.' },
    searchPlaceholder: { en: 'Search products by name or SKU...', am: 'ምርቶችን በስም ወይም በSKU ፈልግ...', or: 'Oomishaalee maqaa ykn SKU\'n barbaadi...' },
    receiveStock: { en: 'Receive Stock', am: 'ክምችት ተቀበል', or: 'Meeshaa Fudhadhu' },
    product: { en: 'Product', am: 'ምርት', or: 'Oomisha' },
    category: { en: 'Category', am: 'ምድብ', or: 'Ramaddii' },
    price: { en: 'Price', am: 'ዋጋ', or: 'Gatii' },
    stock: { en: 'Stock', am: 'ክምችት', or: 'Kuusaa' },
    unit: { en: 'Unit', am: 'አሃድ', or: 'Yuunitii' },
};
