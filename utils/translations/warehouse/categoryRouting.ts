import type { TranslationBlock } from '../types';
export const categoryRouting: TranslationBlock = {
    zoneCategoryRouting: {
        en: 'Category routing', am: 'በምድብ ማስቀመጥ', or: 'Kallattii ramaddii'
    },
    zoneAcceptedCategories: {
        en: 'Accepted zone categories', am: 'በዞኑ የሚፈቀዱ ምድቦች', or: 'Ramaddii zooniin fudhatu'
    },
    zoneCategoryRoutingHelp: {
        en: 'Smart Putaway uses these catalog categories, not the display descriptions. No selection keeps existing storage and default routing rules. Removing a zone category also removes its aisle assignments.',
        am: 'ብልጥ ማስቀመጥ እነዚህን የምርት ምድቦች ይጠቀማል፣ የማሳያ መግለጫዎችን አይደለም። ምርጫ ከሌለ ያሉት የማከማቻና ነባሪ ደንቦች ይቀጥላሉ። የዞን ምድብን ማስወገድ የመተላለፊያ ምደባዎቹንም ያስወግዳል።',
        or: 'Kaaʼinsi meeshaa ramaddii kaataloogii kana fayyadama, ibsa mulʼatu miti. Filannoon yoo hin jirre seerri kuusaa fi kallattii duraanii itti fufa. Ramaddii zoonii haqnaan ramaddiin daandii isaa illee haqama.'
    },
    aisleCategoryRoutingHelp: {
        en: 'Assign categories to each aisle below. Select zone categories first. Unassigned aisles use the zone rules; assignments take priority over inferred locations. Save the zone to apply.',
        am: 'ከታች ለእያንዳንዱ መተላለፊያ ምድቦችን ይመድቡ። መጀመሪያ የዞኑን ምድቦች ይምረጡ። ያልተመደቡ መተላለፊያዎች የዞኑን ደንቦች ይጠቀማሉ። ለመተግበር ዞኑን ያስቀምጡ።',
        or: 'Daandii hundatti ramaddii armaan gadiitti ramadi. Dura ramaddii zoonii filadhu. Daandiin hin ramadamne seera zoonii fayyadama; ramaddiin iddoo tilmaamame caalaa dursa qaba. Hojiirra oolchuuf zoonii kuusi.'
    },
    noAisleCategories: {
        en: 'No aisle categories assigned', am: 'ለመተላለፊያው ምድቦች አልተመደቡም', or: 'Ramaddiin daandii hin ramadamne'
    }
};
