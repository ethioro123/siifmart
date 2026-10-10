import { describe, it, expect } from 'vitest';
import { getSkuCountry, validateCrossBorderSku } from '../../utils/skuValidation';

describe('Cross-Border SKU Scanner Rejection (§4 Architecture)', () => {
  it('extracts country prefix from sovereign SKUs (both unhyphenated and hyphenated)', () => {
    // Unhyphenated (new standard)
    expect(getSkuCountry('ETBV002')).toBe('ET');
    expect(getSkuCountry('KEFR001')).toBe('KE');
    expect(getSkuCountry('UGDY003')).toBe('UG');

    // Hyphenated (backward compatibility)
    expect(getSkuCountry('ET-BV002')).toBe('ET');
    expect(getSkuCountry('KE-FR001')).toBe('KE');
    expect(getSkuCountry('UG-DY003')).toBe('UG');

    // Non-country / legacy / barcodes
    expect(getSkuCountry('BV002')).toBeNull();
    expect(getSkuCountry('9358432033648')).toBeNull();
  });

  it('permits matching country SKUs in local market', () => {
    const etCheck = validateCrossBorderSku('ETBV002', 'ET');
    expect(etCheck.isValid).toBe(true);
    expect(etCheck.isForeign).toBe(false);

    const keCheck = validateCrossBorderSku('KEFR001', 'KE');
    expect(keCheck.isValid).toBe(true);
    expect(keCheck.isForeign).toBe(false);

    // Also permits legacy hyphenated
    expect(validateCrossBorderSku('ET-BV002', 'ET').isValid).toBe(true);
    expect(validateCrossBorderSku('KE-FR001', 'KE').isValid).toBe(true);
  });

  it('rejects foreign Ethiopian SKU scanned in Kenya with exact error message', () => {
    const result = validateCrossBorderSku('ETBV002', 'KE');
    expect(result.isValid).toBe(false);
    expect(result.isForeign).toBe(true);
    expect(result.detectedCountry).toBe('ET');
    expect(result.errorMessage).toBe('Foreign SKU Detected: Item belongs to Ethiopia market.');

    // Also rejects legacy hyphenated
    const legacyResult = validateCrossBorderSku('ET-BV002', 'KE');
    expect(legacyResult.isValid).toBe(false);
    expect(legacyResult.isForeign).toBe(true);
  });

  it('rejects foreign Kenyan SKU scanned in Ethiopia with exact error message', () => {
    const result = validateCrossBorderSku('KEFR001', 'ET');
    expect(result.isValid).toBe(false);
    expect(result.isForeign).toBe(true);
    expect(result.detectedCountry).toBe('KE');
    expect(result.errorMessage).toBe('Foreign SKU Detected: Item belongs to Kenya market.');

    // Also rejects legacy hyphenated
    const legacyResult = validateCrossBorderSku('KE-FR001', 'ET');
    expect(legacyResult.isValid).toBe(false);
    expect(legacyResult.isForeign).toBe(true);
  });

  it('permits legacy unprefixed SKUs and standard barcodes', () => {
    const legacy = validateCrossBorderSku('FR001', 'KE');
    expect(legacy.isValid).toBe(true);
    expect(legacy.isForeign).toBe(false);

    const ean = validateCrossBorderSku('6001234567890', 'ET');
    expect(ean.isValid).toBe(true);
    expect(ean.isForeign).toBe(false);
  });
});
