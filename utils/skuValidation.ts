/**
 * Cross-Border SKU & Barcode Validation Utility
 * 
 * Enforces Section §4 of SIIFMART Multi-Country Sovereignty Architecture:
 * - Scanning an Ethiopian item (e.g., 'ET-BV002') in Kenya instantly halts with:
 *   "Foreign SKU Detected: Item belongs to Ethiopia market."
 * - Scanning a Kenyan item (e.g., 'KE-FR001') in Ethiopia instantly halts with:
 *   "Foreign SKU Detected: Item belongs to Kenya market."
 */

import { Country, getCountryProfile } from './localization';

const KNOWN_COUNTRY_PREFIXES = ['ET', 'KE', 'UG', 'RW', 'TZ'] as const;

export interface CrossBorderSkuValidationResult {
  isValid: boolean;
  isForeign: boolean;
  detectedCountry?: Country;
  detectedCountryName?: string;
  errorMessage?: string;
}

/**
 * Extracts sovereign country prefix from a SKU if present
 * E.g., 'ET-BV002' -> 'ET', 'KE-FR001' -> 'KE'
 */
export function getSkuCountry(sku: string): Country | null {
  if (!sku || typeof sku !== 'string') return null;
  const trimmed = sku.trim().toUpperCase();

  // 1. Hyphenated: e.g. KE-CN001, ET-BV002
  const hyphenMatch = trimmed.match(/^([A-Z]{2,3})-/);
  if (hyphenMatch && hyphenMatch[1]) {
    const prefix = hyphenMatch[1];
    if (KNOWN_COUNTRY_PREFIXES.includes(prefix as any)) {
      return prefix as Country;
    }
  }

  // 2. Unhyphenated: e.g. KECN001, ETBV002 (Country 2-3 letters, Category 2-4 letters, sequence digits)
  const unhyphenMatch = trimmed.match(/^([A-Z]{2,3})([A-Z]{2,4}\d{3,5})$/);
  if (unhyphenMatch && unhyphenMatch[1]) {
    const prefix = unhyphenMatch[1];
    if (KNOWN_COUNTRY_PREFIXES.includes(prefix as any)) {
      return prefix as Country;
    }
  }

  return null;
}

/**
 * Validates whether a scanned SKU or barcode belongs to the active country market.
 * Halts foreign SKUs with descriptive sovereignty violation errors.
 */
export function validateCrossBorderSku(
  scannedCode: string,
  activeCountry: Country = 'ET'
): CrossBorderSkuValidationResult {
  if (!scannedCode || typeof scannedCode !== 'string') {
    return { isValid: true, isForeign: false };
  }

  const detectedCountry = getSkuCountry(scannedCode);
  if (!detectedCountry) {
    // Universal EAN / GS1 / Legacy SKU without country prefix is allowed
    return { isValid: true, isForeign: false };
  }

  const normalizedActive = activeCountry.toUpperCase() as Country;
  if (detectedCountry === normalizedActive) {
    return { isValid: true, isForeign: false, detectedCountry };
  }

  // Cross-Border Conflict Detected
  const countrySimpleNames: Record<string, string> = {
    ET: 'Ethiopia',
    KE: 'Kenya',
    UG: 'Uganda',
    RW: 'Rwanda',
    TZ: 'Tanzania'
  };
  const foreignProfile = getCountryProfile(detectedCountry);
  const foreignCountryName = countrySimpleNames[detectedCountry] || foreignProfile?.name || detectedCountry;

  return {
    isValid: false,
    isForeign: true,
    detectedCountry,
    detectedCountryName: foreignCountryName,
    errorMessage: `Foreign SKU Detected: Item belongs to ${foreignCountryName} market.`
  };
}
