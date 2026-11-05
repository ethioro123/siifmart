import type { TranslationBlock } from '../types';
export const movementIntegrity: TranslationBlock = {
 releaseFailed: { en: 'Order release was not confirmed.', am: 'የትዕዛዝ መልቀቅ አልተረጋገጠም።', or: 'Gadhiifamuun ajajaa hin mirkanoofne.' },
 transferReceiptSaved: { en: 'Receipt saved. Warehouse arrivals are queued for putaway.', am: 'ደረሰኙ ተቀምጧል። የመጋዘን ገቢዎች ለማስቀመጥ ወረፋ ላይ ናቸው።', or: 'Fudhannaan kuufameera. Meeshaan mana kuusaa gaʼe bakka kaaʼuuf tarreeffameera.' },
 transferReceiptFailed: { en: 'Receipt was not confirmed. Refresh and check the saved count.', am: 'ደረሰኙ አልተረጋገጠም። ያድሱና የተቀመጠውን ቆጠራ ያረጋግጡ።', or: 'Fudhannaan hin mirkanoofne. Haaromsiitii lakkoofsa kuufame ilaali.' },
 releaseOnline: { en: 'Connect to the internet and select the warehouse before releasing the order.', am: 'ትዕዛዙን ከመልቀቅዎ በፊት ከኢንተርኔት ጋር ይገናኙና መጋዘኑን ይምረጡ።', or: 'Ajaja gadhiisuu dura interneetii qunnamiitii mana kuusaa filadhu.' },
 releaseSaved: { en: 'Order released to the pick queue.', am: 'ትዕዛዙ ወደ ምርጫ ወረፋ ተልኳል።', or: 'Ajajni gara tarree fudhannaatti gadhiifameera.' },
 varianceTitle: { en: 'Transfer variance review', am: 'የዝውውር ልዩነት ግምገማ', or: 'Sakatta’iinsa garaagarummaa dabarsaa' },
 varianceHold: { en: 'The saved count differs from the arrival record. Stock intake requires an independent supervisor decision and the assigned driver’s co-sign.', am: 'የተቀመጠው ቆጠራ ከመድረሻ መዝገቡ ይለያል። ክምችት ለማስገባት ገለልተኛ የተቆጣጣሪ ውሳኔና የተመደበው አሽከርካሪ ፊርማ ያስፈልጋል።', or: 'Lakkoofsi kuufame galmee gaʼumsaa irraa adda. Kuusaa galchuuf murtii toʼataa walabaafi mallattoo konkolaachisaa ramadamee barbaachisa.' },
 varianceLoading: { en: 'Loading variance review…', am: 'የልዩነት ግምገማ በመጫን ላይ…', or: 'Sakatta’iinsa garaagarummaa fe’aa jira…' },
 varianceLoadFailed: { en: 'Variance review could not be loaded.', am: 'የልዩነት ግምገማው አልተጫነም።', or: 'Sakatta’iinsi garaagarummaa feʼamuu hin dandeenye.' },
 varianceCount: { en: 'Saved count', am: 'የተቀመጠ ቆጠራ', or: 'Lakkoofsa kuufame' },
 varianceDriverDone: { en: 'Driver co-sign recorded.', am: 'የአሽከርካሪው ፊርማ ተመዝግቧል።', or: 'Mallattoon konkolaachisaa galmaaʼeera.' },
 varianceDriverWaiting: { en: 'Awaiting assigned driver co-sign.', am: 'የተመደበውን አሽከርካሪ ፊርማ በመጠባበቅ ላይ።', or: 'Mallattoo konkolaachisaa ramadamee eegaa jira.' },
 varianceSupervisorDone: { en: 'Independent supervisor approval recorded.', am: 'የገለልተኛ ተቆጣጣሪ ፈቃድ ተመዝግቧል።', or: 'Hayyamni toʼataa walabaa galmaaʼeera.' },
 varianceSupervisorWaiting: { en: 'Awaiting independent supervisor approval.', am: 'የገለልተኛ ተቆጣጣሪ ፈቃድ በመጠባበቅ ላይ።', or: 'Hayyama toʼataa walabaa eegaa jira.' },
 varianceReady: { en: 'Both decisions are saved. The receiving custodian can now accept the saved count.', am: 'ሁለቱም ውሳኔዎች ተቀምጠዋል። ተቀባዩ አሁን የተቀመጠውን ቆጠራ መቀበል ይችላል።', or: 'Murtiin lamaanuu kuufameera. Fudhataan amma lakkoofsa kuufame mirkaneessuu dandaʼa.' },
 varianceReason: { en: 'Reason (at least 10 characters)', am: 'ምክንያት (ቢያንስ 10 ፊደላት)', or: 'Sababa (yoo xiqqaate arfii 10)' },
 varianceDriverSign: { en: 'Co-sign saved count', am: 'የተቀመጠውን ቆጠራ ፈርም', or: 'Lakkoofsa kuufame mallatteessi' },
 varianceApprove: { en: 'Approve counted variance', am: 'የተቆጠረውን ልዩነት አጽድቅ', or: 'Garaagarummaa lakkaaʼame hayyami' },
 varianceSaveFailed: { en: 'Signature was not saved. Refresh the evidence and try again.', am: 'ፊርማው አልተቀመጠም። ማስረጃውን ያድሱና እንደገና ይሞክሩ።', or: 'Mallattoon hin kuufamne. Ragaa haaromsiitii irra deebiʼi.' }
};
