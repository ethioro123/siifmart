import { describe, it, expect } from 'vitest';
import { getSkuCountry, validateCrossBorderSku } from '../../utils/skuValidation';

describe('Cross-Border SKU Scanner Rejection (§4 Architecture)', () => {
  it('extracts country prefix from sovereign SKUs', () => {
    expect(getSkuCountry('ET-BV002')).toBe('ET');
    expect(getSkuCountry('KE-FR001')).toBe('KE');
    expect(getSkuCountry('UG-DY003')).toBe('UG');
    expect(getSkuCountry('BV002')).toBeNull();
    expect(getSkuCountry('9358432033648')).toBeNull();
  });

  it('permits matching country SKUs in local market', () => {
    const etCheck = validateCrossBorderSku('ET-BV002', 'ET');
    expect(etCheck.isValid).toBe(true);
    expect(etCheck.isForeign).toBe(false);

    const keCheck = validateCrossBorderSku('KE-FR001', 'KE');
    expect(keCheck.isValid).toBe(true);
    expect(keCheck.isForeign).toBe(false);
  });

  it('rejects foreign Ethiopian SKU scanned in Kenya with exact error message', () => {
    const result = validateCrossBorderSku('ET-BV002', 'KE');
    expect(result.isValid).toBe(false);
    expect(result.isForeign).toBe(true);
    expect(result.detectedCountry).toBe('ET');
    expect(result.errorMessage).toBe('Foreign SKU Detected: Item belongs to Ethiopia market.');
  });

  it('rejects foreign Kenyan SKU scanned in Ethiopia with exact error message', () => {
    const result = validateCrossBorderSku('KE-FR001', 'ET');
    expect(result.isValid).toBe(false);
    expect(result.isForeign).toBe(true);
    expect(result.detectedCountry).toBe('KE');
    expect(result.errorMessage).toBe('Foreign SKU Detected: Item belongs to Kenya market.');
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
