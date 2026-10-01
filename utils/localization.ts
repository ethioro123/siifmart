/**
 * Localization Engine for SIIFMART
 * Supports Multi-Country Operation: Ethiopia (HQ) and Kenya (Regional Hub).
 * Handles dynamic currency, language constraints, tax policies, timezones,
 * phone formatting, and mobile payment tender adaptability.
 */

import { Language } from './translations/types';

export type Country = 'ET' | 'KE' | 'UG' | 'RW' | 'TZ' | (string & {});

export interface MobileMoneyOption {
  id: string;
  label: string;
  shortName: string;
  placeholder: string;
  prefix: string;
  color: string;
}

export interface CountryProfile {
  code: Country;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat: '1,000.00' | '1.000,00';
  taxAuthority: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxRate: number;
  withholdingTax: number;
  phonePrefix: string;
  phonePlaceholder: string;
  complianceStandard: string;
  receiptFooterNote: string;
  primaryMobileMoney: string;
  mobileMoneyOptions: MobileMoneyOption[];
  cashDenominations: string[];
  supportedLanguages: {
    code: Language;
    label: string;
    nativeLabel: string;
    isEthiopian?: boolean;
  }[];
  regions: string[];
}

export const COUNTRY_PROFILES: Record<Country, CountryProfile> = {
  ET: {
    code: 'ET',
    name: 'Ethiopia (HQ Central)',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'ETB',
    currencyCode: 'ETB',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    taxAuthority: 'Ministry of Revenues (ERCA)',
    taxIdLabel: 'TIN',
    taxIdPlaceholder: '0012345678',
    taxRate: 15,
    withholdingTax: 2,
    phonePrefix: '+251',
    phonePlaceholder: '+251 911 234 567',
    complianceStandard: 'Authorized ERCA Fiscal Electronic Register',
    receiptFooterNote: 'Authorized ERCA Fiscal Receipt - Thank you for shopping with us!',
    primaryMobileMoney: 'Telebirr & CBE Birr',
    mobileMoneyOptions: [
      {
        id: 'TELEBIRR',
        label: 'Telebirr',
        shortName: 'Telebirr',
        placeholder: '09XX XXX XXX or 07XX XXX XXX',
        prefix: '+251',
        color: '#0070BA'
      },
      {
        id: 'CBE_BIRR',
        label: 'CBE Birr',
        shortName: 'CBE Birr',
        placeholder: 'CBE Birr Wallet / Phone Number',
        prefix: '+251',
        color: '#6A1B9A'
      }
    ],
    cashDenominations: ['200', '100', '50', '10', '5', '1'],
    supportedLanguages: [
      { code: 'en', label: 'English', nativeLabel: 'English (US)' },
      { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', isEthiopian: true },
      { code: 'or', label: 'Afaan Oromoo', nativeLabel: 'Oromoo', isEthiopian: true }
    ],
    regions: [
      'Addis Ababa',
      'Dire Dawa',
      'Oromia (Adama)',
      'Sidama (Hawassa)',
      'Amhara (Bahir Dar)',
      'Somali (Jigjiga)',
      'Harari'
    ]
  },
  KE: {
    code: 'KE',
    name: 'Kenya (East Africa Hub)',
    flag: '🇰🇪',
    currency: 'KSh',
    currencySymbol: 'KSh',
    currencyCode: 'KES',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    taxAuthority: 'Kenya Revenue Authority (KRA)',
    taxIdLabel: 'KRA PIN',
    taxIdPlaceholder: 'P051234567Z',
    taxRate: 16,
    withholdingTax: 2,
    phonePrefix: '+254',
    phonePlaceholder: '+254 712 345 678',
    complianceStandard: 'KRA Electronic Tax Invoice Management System (eTIMS)',
    receiptFooterNote: 'eTIMS Compliant - Valid KRA Tax Invoice. Asante kwa ununuzi!',
    primaryMobileMoney: 'M-Pesa (Safaricom)',
    mobileMoneyOptions: [
      {
        id: 'M_PESA',
        label: 'M-Pesa (Safaricom)',
        shortName: 'M-Pesa',
        placeholder: '07XX XXX XXX or 01XX XXX XXX',
        prefix: '+254',
        color: '#00A859'
      },
      {
        id: 'AIRTEL_MONEY',
        label: 'Airtel Money',
        shortName: 'Airtel',
        placeholder: '07XX XXX XXX',
        prefix: '+254',
        color: '#E60000'
      }
    ],
    cashDenominations: ['1000', '500', '200', '100', '50', '20', '10', '5', '1'],
    // In Kenya mode, Ethiopian languages (Amharic, Afaan Oromoo) are disabled/omitted
    supportedLanguages: [
      { code: 'en', label: 'English', nativeLabel: 'English (Kenya)' }
    ],
    regions: [
      'Nairobi County',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Kiambu',
      'Uasin Gishu (Eldoret)',
      'Machakos'
    ]
  },
  UG: {
    code: 'UG',
    name: 'Uganda (East Africa Hub)',
    flag: '🇺🇬',
    currency: 'USh',
    currencySymbol: 'USh',
    currencyCode: 'UGX',
    timezone: 'Africa/Kampala',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    taxAuthority: 'Uganda Revenue Authority (URA)',
    taxIdLabel: 'URA TIN',
    taxIdPlaceholder: '1001234567',
    taxRate: 18,
    withholdingTax: 6,
    phonePrefix: '+256',
    phonePlaceholder: '+256 700 123 456',
    complianceStandard: 'URA Electronic Fiscal Receipting & Invoicing (EFRIS)',
    receiptFooterNote: 'URA EFRIS Compliant - Thank you for shopping with us!',
    primaryMobileMoney: 'MTN Mobile Money & Airtel Money',
    mobileMoneyOptions: [
      { id: 'MTN_UG', label: 'MTN MoMo', shortName: 'MTN', placeholder: '07XX XXX XXX', prefix: '+256', color: '#FFCC00' },
      { id: 'AIRTEL_UG', label: 'Airtel Money', shortName: 'Airtel', placeholder: '07XX XXX XXX', prefix: '+256', color: '#E60000' }
    ],
    cashDenominations: ['50000', '20000', '10000', '5000', '2000', '1000', '500'],
    supportedLanguages: [{ code: 'en', label: 'English', nativeLabel: 'English (Uganda)' }],
    regions: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara']
  },
  RW: {
    code: 'RW',
    name: 'Rwanda (Regional Hub)',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'RWF',
    currencyCode: 'RWF',
    timezone: 'Africa/Kigali',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    taxAuthority: 'Rwanda Revenue Authority (RRA)',
    taxIdLabel: 'RRA TIN',
    taxIdPlaceholder: '100023456',
    taxRate: 18,
    withholdingTax: 5,
    phonePrefix: '+250',
    phonePlaceholder: '+250 780 123 456',
    complianceStandard: 'RRA Electronic Billing Machine (EBM v2)',
    receiptFooterNote: 'RRA EBM Certified - Murakoze cyane!',
    primaryMobileMoney: 'MTN MoMo & Airtel Money',
    mobileMoneyOptions: [
      { id: 'MTN_RW', label: 'MTN MoMo', shortName: 'MTN', placeholder: '078X XXX XXX', prefix: '+250', color: '#FFCC00' },
      { id: 'AIRTEL_RW', label: 'Airtel Money', shortName: 'Airtel', placeholder: '073X XXX XXX', prefix: '+250', color: '#E60000' }
    ],
    cashDenominations: ['5000', '2000', '1000', '500', '100', '50', '20'],
    supportedLanguages: [{ code: 'en', label: 'English', nativeLabel: 'English (Rwanda)' }],
    regions: ['Kigali', 'Huye', 'Rubavu', 'Musanze', 'Nyagatare']
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania (Coastal Hub)',
    flag: '🇹🇿',
    currency: 'TSh',
    currencySymbol: 'TSh',
    currencyCode: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    taxAuthority: 'Tanzania Revenue Authority (TRA)',
    taxIdLabel: 'TRA TIN',
    taxIdPlaceholder: '123-456-789',
    taxRate: 18,
    withholdingTax: 5,
    phonePrefix: '+255',
    phonePlaceholder: '+255 712 345 678',
    complianceStandard: 'TRA Electronic Fiscal Device (EFDMS)',
    receiptFooterNote: 'TRA EFD Valid Tax Receipt - Karibu tena!',
    primaryMobileMoney: 'M-Pesa (Vodacom) & Tigo Pesa',
    mobileMoneyOptions: [
      { id: 'MPESA_TZ', label: 'M-Pesa (Vodacom)', shortName: 'M-Pesa', placeholder: '07XX XXX XXX', prefix: '+255', color: '#E60000' },
      { id: 'TIGO_TZ', label: 'Tigo Pesa', shortName: 'Tigo', placeholder: '07XX XXX XXX', prefix: '+255', color: '#003399' }
    ],
    cashDenominations: ['10000', '5000', '2000', '1000', '500'],
    supportedLanguages: [{ code: 'en', label: 'English', nativeLabel: 'English (Tanzania)' }],
    regions: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar']
  }
};

type CountryRegistrationListener = (profile: CountryProfile) => void;
const countryRegistrationListeners: CountryRegistrationListener[] = [];

/**
 * Subscribe to new country profile registrations
 */
export function onCountryRegistered(listener: CountryRegistrationListener): () => void {
  countryRegistrationListeners.push(listener);
  return () => {
    const idx = countryRegistrationListeners.indexOf(listener);
    if (idx !== -1) countryRegistrationListeners.splice(idx, 1);
  };
}

/**
 * Register a new country profile dynamically at runtime
 */
export function registerCountryProfile(profile: CountryProfile): void {
  COUNTRY_PROFILES[profile.code] = profile;
  countryRegistrationListeners.forEach(listener => {
    try {
      listener(profile);
    } catch (e) {
      console.error('Error in country registration listener', e);
    }
  });
}

/**
 * Get all configured country profiles
 */
export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRY_PROFILES);
}

/**
 * Detect effective country from configuration (supports ET, KE, UG, RW, TZ, and custom codes)
 */
export function getEffectiveCountry(config?: {
  country?: string;
  currency?: string;
  timezone?: string;
}): Country {
  if (config?.country && COUNTRY_PROFILES[config.country as Country]) {
    return config.country as Country;
  }
  if (config?.country) {
    return config.country as Country;
  }
  if (config?.currency === 'KES' || config?.currency === 'KSh') return 'KE';
  if (config?.currency === 'UGX' || config?.currency === 'USh') return 'UG';
  if (config?.currency === 'RWF') return 'RW';
  if (config?.currency === 'TZS' || config?.currency === 'TSh') return 'TZ';
  if (config?.currency === 'ETB') return 'ET';
  if (config?.timezone === 'Africa/Nairobi') return 'KE';
  if (config?.timezone === 'Africa/Kampala') return 'UG';
  if (config?.timezone === 'Africa/Kigali') return 'RW';
  if (config?.timezone === 'Africa/Dar_es_Salaam') return 'TZ';
  return 'ET';
}

/**
 * Get country profile by code, with safe fallback to Ethiopia
 */
export function getCountryProfile(countryOrConfig?: Country | {
  country?: string;
  currency?: string;
  timezone?: string;
}): CountryProfile {
  if (typeof countryOrConfig === 'string') {
    return COUNTRY_PROFILES[countryOrConfig as Country] || COUNTRY_PROFILES.ET;
  }
  const country = getEffectiveCountry(countryOrConfig);
  return COUNTRY_PROFILES[country];
}

/**
 * Get the allowed languages for a country.
 * For Kenya: ONLY English ('en') is returned; Ethiopian languages are turned off.
 * For Ethiopia: 'en', 'am', 'or' are returned.
 */
export function getAllowedLanguages(country: Country): { code: Language; label: string; nativeLabel: string }[] {
  return COUNTRY_PROFILES[country]?.supportedLanguages || COUNTRY_PROFILES.ET.supportedLanguages;
}

/**
 * Validates whether a language is permitted for a country.
 * If not permitted, falls back to 'en'.
 */
export function sanitizeLanguageForCountry(lang: string | undefined, country: Country): Language {
  const allowed = getAllowedLanguages(country).map(l => l.code);
  if (lang && (allowed as string[]).includes(lang)) {
    return lang as Language;
  }
  return 'en';
}

/**
 * Format price according to active country/currency
 */
export function formatLocalizedPrice(
  amount: number | undefined | null,
  countryOrCurrency?: Country | string
): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  let currencyCode = 'ETB';
  if (countryOrCurrency === 'KE' || countryOrCurrency === 'KES' || countryOrCurrency === 'KSh') {
    currencyCode = 'KSh';
  } else if (countryOrCurrency === 'ET' || countryOrCurrency === 'ETB') {
    currencyCode = 'ETB';
  } else if (typeof countryOrCurrency === 'string') {
    currencyCode = countryOrCurrency;
  }

  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencyCode} ${formatted}`;
}

export interface CountryLegalDefaults {
  legalBusinessName: string;
  taxVatNumber: string;
  taxId: string;
  registeredAddress: string;
  supportContact: string;
  supportPhone: string;
}

export interface CountryBrandingDefaults {
  storeName: string;
  slogan: string;
  brandColor: string;
}

export const COUNTRY_LEGAL_DEFAULTS: Record<Country, CountryLegalDefaults> = {
  ET: {
    legalBusinessName: 'SiifMart Technologies PLC',
    taxVatNumber: 'VAT-ERCA TIN',
    taxId: '0001234567',
    registeredAddress: 'Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia',
    supportContact: 'support.et@siifmart.com',
    supportPhone: '+251 911 234 567',
  },
  KE: {
    legalBusinessName: 'SiifMart Kenya Limited',
    taxVatNumber: 'VAT-KRA PIN',
    taxId: 'P051234567Z',
    registeredAddress: 'Westlands Commercial Centre, Ring Road, Nairobi, Kenya',
    supportContact: 'support.ke@siifmart.com',
    supportPhone: '+254 712 345 678',
  },
  UG: {
    legalBusinessName: 'SiifMart Uganda Limited',
    taxVatNumber: 'VAT-URA TIN',
    taxId: '1001234567',
    registeredAddress: 'Plot 14, Jinja Road, Kampala, Uganda',
    supportContact: 'support.ug@siifmart.com',
    supportPhone: '+256 700 123 456',
  },
  RW: {
    legalBusinessName: 'SiifMart Rwanda S.A.R.L.',
    taxVatNumber: 'VAT-RRA TIN',
    taxId: '100023456',
    registeredAddress: 'KG 7 Ave, Boulevard de l\'OUA, Kigali, Rwanda',
    supportContact: 'support.rw@siifmart.com',
    supportPhone: '+250 780 123 456',
  },
  TZ: {
    legalBusinessName: 'SiifMart Tanzania Limited',
    taxVatNumber: 'VAT-TRA TIN',
    taxId: '123-456-789',
    registeredAddress: 'Ali Hassan Mwinyi Road, Dar es Salaam, Tanzania',
    supportContact: 'support.tz@siifmart.com',
    supportPhone: '+255 754 123 456',
  },
};

export const COUNTRY_BRANDING_DEFAULTS: Record<Country, CountryBrandingDefaults> = {
  ET: {
    storeName: 'SIIFMART Ethiopia',
    slogan: 'Your Trusted Marketplace',
    brandColor: '#2C5E3B',
  },
  KE: {
    storeName: 'SIIFMART Kenya',
    slogan: 'Karibu Sana',
    brandColor: '#2C5E3B',
  },
  UG: {
    storeName: 'SIIFMART Uganda',
    slogan: 'Your Trusted Marketplace',
    brandColor: '#2C5E3B',
  },
  RW: {
    storeName: 'SIIFMART Rwanda',
    slogan: 'Murakaza Neza',
    brandColor: '#2C5E3B',
  },
  TZ: {
    storeName: 'SIIFMART Tanzania',
    slogan: 'Karibu Sana',
    brandColor: '#2C5E3B',
  },
};

export function getCountryLegalDefaults(country: Country): CountryLegalDefaults {
  return COUNTRY_LEGAL_DEFAULTS[country] || COUNTRY_LEGAL_DEFAULTS.ET;
}

export function getCountryBrandingDefaults(country: Country): CountryBrandingDefaults {
  return COUNTRY_BRANDING_DEFAULTS[country] || COUNTRY_BRANDING_DEFAULTS.ET;
}

