/**
 * Smart Regional ID Generator & Sovereign Governance Formatter
 * 
 * Enforces:
 * 1. Mandatory Sovereign Country Prefix: ET-, KE-, UG-, RW-, TZ-
 * 2. Strict 3-Letter Unique Code: e.g. ET-ADD, ET-ADA, ET-DIR, KE-NRB, KE-MBA
 * 3. Smart Uniqueness Resolution: If a code like ET-ADD already exists, the system
 *    intelligently computes the next smart advanced unique 3 letters without collision.
 */

import { normalizeCountryCode } from './siteIdGenerator';

export interface SmartRegionCodeParams {
    name?: string;
    city?: string;
    country?: string;
    existingCodes?: string[];
}

export interface RegionCodeValidation {
    valid: boolean;
    error?: string;
    suggestedCode?: string;
}

// Canonical city/hub to 3-letter code dictionary
const KNOWN_HUB_CODES: Record<string, string> = {
    // Ethiopia
    'addis': 'ADD',
    'addis ababa': 'ADD',
    'finfinne': 'ADD',
    'dire': 'DIR',
    'dire dawa': 'DIR',
    'harar': 'DIR',
    'adama': 'ADA',
    'nazret': 'ADA',
    'hawassa': 'HAW',
    'awassa': 'HAW',
    'bahir dar': 'BDR',
    'bahirdar': 'BDR',
    'gondar': 'GND',
    'gonder': 'GND',
    'mekelle': 'MQX',
    'mekele': 'MQX',
    'jimma': 'JIM',
    'bishoftu': 'BSH',
    'debre zeit': 'BSH',

    // Kenya
    'nairobi': 'NRB',
    'mombasa': 'MBA',
    'kisumu': 'KSM',
    'nakuru': 'NKR',
    'eldoret': 'EDL',
    'thika': 'THK',
    'malindi': 'MLD',
    'garissa': 'GAS',
    'nyeri': 'NYR',

    // Uganda
    'kampala': 'KLA',
    'entebbe': 'EBB',
    'jinja': 'JIN',
    'gulu': 'GLU',
    'mbarara': 'MBR',

    // Rwanda
    'kigali': 'KGL',
    'butare': 'BTR',
    'gisenyi': 'GSY',

    // Tanzania
    'dar': 'DAR',
    'dar es salaam': 'DAR',
    'arusha': 'ARK',
    'mwanza': 'MWZ',
    'dodoma': 'DOM',
    'zanzibar': 'ZNZ'
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Normalizes any raw region code or abbreviation into strict uppercase format [COUNTRY]-[3-LETTERS].
 */
export function formatRegionCode(raw?: string | null, countryHint?: string | null): string {
    const country = normalizeCountryCode(countryHint);
    if (!raw) return `${country}-REG`;

    const trimmed = raw.trim().toUpperCase();

    // Already matches [COUNTRY]-[3-LETTERS]
    if (/^[A-Z]{2}-[A-Z]{3}$/.test(trimmed)) {
        return trimmed;
    }

    // Matches with lowercase or underscore: et_add -> ET-ADD, ke_mombasa -> KE-MBA
    const matchDashed = trimmed.match(/^([A-Z]{2})[-_]([A-Z0-9]+)$/);
    if (matchDashed) {
        const c = normalizeCountryCode(matchDashed[1]);
        const sub = matchDashed[2].toLowerCase();
        if (KNOWN_HUB_CODES[sub]) {
            return `${c}-${KNOWN_HUB_CODES[sub]}`;
        }
        const letters = matchDashed[2].replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
        return `${c}-${letters}`;
    }

    // Bare letters: ADD -> ET-ADD, or mombasa -> KE-MBA
    const subClean = trimmed.toLowerCase();
    if (KNOWN_HUB_CODES[subClean]) {
        return `${country}-${KNOWN_HUB_CODES[subClean]}`;
    }

    // Bare 3 letters: ADD -> ET-ADD
    const bareLetters = trimmed.replace(/[^A-Z]/g, '');
    if (bareLetters.length >= 3) {
        return `${country}-${bareLetters.slice(0, 3)}`;
    }

    return `${country}-${bareLetters.padEnd(3, 'X')}`;
}

/**
 * Validates whether a code strictly adheres to the [COUNTRY]-[3-LETTERS] format.
 */
export function isValidRegionCodeFormat(code?: string | null, expectedCountry?: string | null): boolean {
    if (!code) return false;
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z]{2}-[A-Z]{3}$/.test(clean)) return false;

    if (expectedCountry) {
        const expected = normalizeCountryCode(expectedCountry);
        return clean.startsWith(`${expected}-`);
    }

    return true;
}

/**
 * Checks if a code is unique among existing codes (case-insensitive).
 */
export function isRegionCodeUnique(code: string, existingCodes: string[] = []): boolean {
    const normalizedTarget = code.trim().toUpperCase();
    return !existingCodes.some(c => c.trim().toUpperCase() === normalizedTarget);
}

/**
 * Extracts candidate 3-letter abbreviations from region name and optional city.
 */
export function extractRegionCandidates(name?: string, city?: string): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();

    const addCandidate = (str?: string) => {
        if (!str) return;
        const clean = str.toUpperCase().replace(/[^A-Z]/g, '');
        if (clean.length === 3 && !seen.has(clean)) {
            seen.add(clean);
            candidates.push(clean);
        }
    };

    const cleanName = (name || '').trim().toLowerCase();
    const cleanCity = (city || '').trim().toLowerCase();

    // 1. Check known hubs in city or name
    if (cleanCity && KNOWN_HUB_CODES[cleanCity]) {
        addCandidate(KNOWN_HUB_CODES[cleanCity]);
    }
    if (cleanName && KNOWN_HUB_CODES[cleanName]) {
        addCandidate(KNOWN_HUB_CODES[cleanName]);
    }

    // Check partial known hub phrases (e.g. "Addis Ababa Central" contains "addis ababa")
    for (const [phrase, code] of Object.entries(KNOWN_HUB_CODES)) {
        if (cleanName.includes(phrase) || cleanCity.includes(phrase)) {
            addCandidate(code);
        }
    }

    const words = `${name || ''} ${city || ''}`
        .toUpperCase()
        .replace(/[^A-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);

    // 2. Acronym of first 3 words (e.g. Addis Ababa Central -> AAC, Addis Ababa South -> AAS)
    if (words.length >= 3) {
        addCandidate(`${words[0][0]}${words[1][0]}${words[2][0]}`);
    }

    // 3. Two words combinations (e.g. Addis Ababa -> AAB, ADA, ADS)
    if (words.length >= 2) {
        // First char of w0 + first 2 chars of w1
        if (words[1].length >= 2) {
            addCandidate(`${words[0][0]}${words[1][0]}${words[1][1]}`);
        }
        // First 2 chars of w0 + first char of w1
        if (words[0].length >= 2) {
            addCandidate(`${words[0][0]}${words[0][1]}${words[1][0]}`);
        }
        // First char of w0 + consonants of w1
        const w1Consonants = words[1].split('').filter(c => !VOWELS.has(c));
        if (w1Consonants.length >= 2) {
            addCandidate(`${words[0][0]}${w1Consonants[0]}${w1Consonants[1]}`);
        }
        // Consonants of w0 + first char of w1
        const w0Consonants = words[0].split('').filter(c => !VOWELS.has(c));
        if (w0Consonants.length >= 2) {
            addCandidate(`${w0Consonants[0]}${w0Consonants[1]}${words[1][0]}`);
        }
    }

    // 4. Primary word consonant skeleton (e.g. ADDIS -> ADS, MOMBASA -> MBS / MBA)
    const primaryWord = words[0] || '';
    if (primaryWord.length >= 3) {
        // First 3 chars
        addCandidate(primaryWord.slice(0, 3));

        // Consonants only
        const consonants = primaryWord.split('').filter(c => !VOWELS.has(c));
        if (consonants.length >= 3) {
            addCandidate(consonants.slice(0, 3).join(''));
        }
        if (consonants.length >= 2) {
            // First char of word + first 2 consonants
            addCandidate(`${primaryWord[0]}${consonants[0]}${consonants[1]}`);
            // First 2 consonants + last char
            addCandidate(`${consonants[0]}${consonants[1]}${primaryWord[primaryWord.length - 1]}`);
        }

        // Substrings: 1st, 2nd, 4th or 1st, 3rd, 4th
        if (primaryWord.length >= 4) {
            addCandidate(`${primaryWord[0]}${primaryWord[2]}${primaryWord[3]}`);
            addCandidate(`${primaryWord[0]}${primaryWord[1]}${primaryWord[3]}`);
        }
    }

    return candidates;
}

/**
 * Systematically steps through alphabetical 3-letter combinations based on a root prefix.
 */
function getAlphabeticalFallback(root: string, takenSet: Set<string>): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const c0 = root[0] || 'A';
    const c1 = root[1] || 'A';

    // 1. Step 3rd letter: root[0] + root[1] + (A..Z)
    for (let i = 0; i < 26; i++) {
        const candidate = `${c0}${c1}${letters[i]}`;
        if (!takenSet.has(candidate)) return candidate;
    }

    // 2. Step 2nd and 3rd letter: root[0] + (A..Z) + (A..Z)
    for (let j = 0; j < 26; j++) {
        for (let i = 0; i < 26; i++) {
            const candidate = `${c0}${letters[j]}${letters[i]}`;
            if (!takenSet.has(candidate)) return candidate;
        }
    }

    // 3. Full 3-letter alphabetical scan: (A..Z) + (A..Z) + (A..Z)
    for (let k = 0; k < 26; k++) {
        for (let j = 0; j < 26; j++) {
            for (let i = 0; i < 26; i++) {
                const candidate = `${letters[k]}${letters[j]}${letters[i]}`;
                if (!takenSet.has(candidate)) return candidate;
            }
        }
    }

    return 'XXX';
}

/**
 * Generates the next smart advanced unique 3-letter region code.
 * Guarantees:
 * - Mandatory Sovereign country prefix: ET-, KE-, etc.
 * - Exactly 3 uppercase letters: e.g. ET-ADD
 * - If ET-ADD exists, never duplicates, but returns the next smart unique code (e.g. ET-AAB, ET-ADS, ET-AAC)
 */
export function generateNextSmartRegionCode(params: SmartRegionCodeParams): string {
    const country = normalizeCountryCode(params.country);
    const existing = (params.existingCodes || []).map(c => c.trim().toUpperCase());

    // Filter taken 3-letter codes for the active country
    const countryPrefix = `${country}-`;
    const takenLetters = new Set<string>();

    for (const code of existing) {
        if (code.startsWith(countryPrefix)) {
            const suffix = code.slice(countryPrefix.length).replace(/[^A-Z]/g, '');
            if (suffix.length === 3) {
                takenLetters.add(suffix);
            }
        }
    }

    // 1. Extract smart semantic & phonetic candidates
    const candidates = extractRegionCandidates(params.name, params.city);

    for (const cand of candidates) {
        if (!takenLetters.has(cand)) {
            return `${country}-${cand}`;
        }
    }

    // 2. If all semantic candidates are taken, derive next smart progression from primary root
    const primaryRoot = (candidates[0] || 'REG').slice(0, 2).padEnd(2, 'A');
    const fallback = getAlphabeticalFallback(primaryRoot, takenLetters);

    return `${country}-${fallback}`;
}

/**
 * Validates a user-entered region code and provides smart correction/suggestion.
 */
export function validateRegionCodeInput(params: {
    code: string;
    country: string;
    existingCodes?: string[];
    name?: string;
    city?: string;
}): RegionCodeValidation {
    const country = normalizeCountryCode(params.country);
    const trimmed = (params.code || '').trim().toUpperCase();

    if (!trimmed) {
        const suggested = generateNextSmartRegionCode({
            name: params.name,
            city: params.city,
            country,
            existingCodes: params.existingCodes
        });
        return {
            valid: false,
            error: 'Territorial code is required',
            suggestedCode: suggested
        };
    }

    if (!isValidRegionCodeFormat(trimmed, country)) {
        const suggested = generateNextSmartRegionCode({
            name: params.name || trimmed,
            city: params.city,
            country,
            existingCodes: params.existingCodes
        });
        return {
            valid: false,
            error: `Territorial code must follow format ${country}-XXX (3 uppercase letters)`,
            suggestedCode: suggested
        };
    }

    const isUnique = isRegionCodeUnique(trimmed, params.existingCodes);
    if (!isUnique) {
        const suggested = generateNextSmartRegionCode({
            name: params.name || trimmed,
            city: params.city,
            country,
            existingCodes: params.existingCodes
        });
        return {
            valid: false,
            error: `Territorial code ${trimmed} already exists. Each region code must be unique.`,
            suggestedCode: suggested
        };
    }

    return { valid: true };
}
