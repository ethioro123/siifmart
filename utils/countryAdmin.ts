import type { Country } from './localization';
import { getCountryProfile } from './localization';
import type { Site } from '../types';

export interface CountryAdminDefaults {
    code: string;
    name: string;
    type: 'Administration';
    address: string;
    region: string;
    country: Country;
    currency: string;
    status: 'Active';
    manager: string;
}

/**
 * Returns the standardized Administration HQ metadata for any given country.
 * Ethiopia defaults to the historic 'Central Operations' (SITE-0001),
 * while Kenya and other national hubs use country-prefixed codes (SITE-KE-0001, etc.).
 */
export function getCountryAdminDefaults(country: Country): CountryAdminDefaults {
    const profile = getCountryProfile(country);
    const countryUpper = (country || 'ET').toUpperCase();

    if (countryUpper === 'ET') {
        return {
            code: 'SITE-0001',
            name: 'Central Operations',
            type: 'Administration',
            address: 'Bole Sub-City, Addis Ababa',
            region: 'Addis Ababa',
            country: 'ET',
            currency: 'ETB',
            status: 'Active',
            manager: 'Shukri Kamal'
        };
    }

    const cleanCountryName = profile.name.replace(/\s*\(.*\)/, '').trim();
    const city = profile.regions[0] || cleanCountryName;

    return {
        code: `SITE-${countryUpper}-0001`,
        name: `${cleanCountryName} Central Operations`,
        type: 'Administration',
        address: `${city} Central Business District`,
        region: profile.regions[0] || 'Central',
        country: countryUpper as Country,
        currency: profile.currencySymbol || (countryUpper === 'KE' ? 'KSh' : 'ETB'),
        status: 'Active',
        manager: 'HQ Administration'
    };
}

/**
 * Checks if a site is an Administration / HQ site.
 */
export function isAdminSite(site?: Partial<Site> | null): boolean {
    if (!site) return false;
    const type = site.type || '';
    return ['Administration', 'Administrative', 'HQ', 'Headquarters', 'Head Office', 'Central Operations'].includes(type);
}

/**
 * Finds the primary Administration HQ site specifically for the target country.
 * Guarantees zero cross-country fallback.
 */
export function findCountryAdminSite(sites: Site[], country: Country): Site | undefined {
    const countryUpper = (country || 'ET').toUpperCase();
    const countrySites = sites.filter(s => (s.country || 'ET').toUpperCase() === countryUpper);

    return countrySites.find(s =>
        isAdminSite(s) ||
        s.code === `${countryUpper}-01` ||
        s.code === `SITE-${countryUpper}-0001` ||
        (countryUpper === 'ET' && (s.code === 'ET-01' || s.code === 'SITE-0001' || s.name === 'Central Operations'))
    ) || countrySites.find(s => isAdminSite(s));
}
