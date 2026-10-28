import { describe, it, expect } from 'vitest';
import { driverHub } from '../../../utils/translations/warehouse/driverHub';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = driverHub as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Driver Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(40);

        const missingOr: string[] = [];
        const missingAm: string[] = [];
        const missingEn: string[] = [];

        keys.forEach((key) => {
            const entry = dict[key];
            if (!entry?.or || entry.or.trim() === '') missingOr.push(key);
            if (!entry?.am || entry.am.trim() === '') missingAm.push(key);
            if (!entry?.en || entry.en.trim() === '') missingEn.push(key);
        });

        expect(missingOr, `Missing or translation for keys: ${missingOr.join(', ')}`).toHaveLength(0);
        expect(missingAm, `Missing am translation for keys: ${missingAm.join(', ')}`).toHaveLength(0);
        expect(missingEn, `Missing en translation for keys: ${missingEn.join(', ')}`).toHaveLength(0);
    });

    it('faithfully applies East Hararghe (Harargee Bahaa) commercial dialect terminology', () => {
        // Driver operations & dashboard
        expect(getOr('dashboard')).toBe('Daashboordii Konkolaachisaa');
        expect(getOr('driver')).toBe('Konkolaachisaa');
        expect(getOr('activeDeliveries')).toBe('Hojii Amma Jiru');
        expect(getOr('assignedJobs')).toBe('Hojiiwwan Ramadaman');

        // Actions & Missions
        expect(getOr('outboundDispatch')).toBe('Ergaa Geejjibaa');
        expect(getOr('startDelivery')).toBe('Ergaa Jalqabi');
        expect(getOr('completeDelivery')).toBe('Ergaa Xumuri');
        expect(getOr('recordArrival')).toBe('Ga\'uu Galmeessi');
        expect(getOr('assignedDriverOnly')).toBe('Konkolaachisaa Ramadame Qofa');
        expect(getOr('loadedMissions')).toBe('Ergawwan Fe\'aman');
        expect(getOr('deliveryProgress')).toBe('Adeemsa Ergaa Fe\'amee');
        expect(getOr('deliveredBy')).toBe('Kan Geesse');
        expect(getOr('confirmDelivery')).toBe('Ergaa Mirkaneessi');

        // Rejection & Exceptions
        expect(getOr('rejectReasonCustomerRefused')).toBe('Maamilli dide');
        expect(getOr('rejectReasonDamaged')).toBe('Karaa irratti kan miidhame');
        expect(getOr('rejectReasonPartial')).toBe('Fudhannaa Hir\'uu');

        // Handheld / Scanner
        expect(getOr('findShipment')).toBe('Fe\'iinsa Barbaadi');
        expect(getOr('openManifest')).toBe('Manifeestoo Bani');
        expect(getOr('scannerInstructions')).toContain('iskaanera harkaatiin');

        // Statuses
        expect(getOr('inTransit')).toBe('Karaa irra');
        expect(getOr('delivered')).toBe('Ga\'eera');
    });

    it('validates Amharic parity for driver operations', () => {
        expect(getAm('dashboard')).toBe('የአሽከርካሪ ዳሽቦርድ');
        expect(getAm('driver')).toBe('አሽከርካሪ');
        expect(getAm('outboundDispatch')).toBe('ወደ ውጭ የሚላክ');
        expect(getAm('recordArrival')).toBe('መምጣቱን መዝግብ');
        expect(getAm('deliveredBy')).toBe('ያደረሰው');
        expect(getAm('confirmDelivery')).toBe('ማድረስ አረጋግጥ');
    });
});
