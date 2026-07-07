import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  validateProduct,
} from '../../utils/validation';

// ============================================================================
// SANITIZATION
// ============================================================================

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world');
  });

  it('removes angle brackets (XSS prevention)', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<');
    expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('>');
  });

  it('keeps safe characters', () => {
    expect(sanitizeString('Product Name #1 - 50%')).toBe('Product Name #1 - 50%');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('parses valid numbers', () => {
    expect(sanitizeNumber('42')).toBe(42);
    expect(sanitizeNumber('3.14')).toBe(3.14);
  });

  it('returns null for invalid input', () => {
    expect(sanitizeNumber('not a number')).toBeNull();
    expect(sanitizeNumber('')).toBeNull();
    expect(sanitizeNumber(undefined)).toBeNull();
  });

  it('handles numeric input directly', () => {
    expect(sanitizeNumber(100)).toBe(100);
    expect(sanitizeNumber(0)).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(sanitizeNumber('-5')).toBe(-5);
  });
});

describe('sanitizeEmail', () => {
  it('trims and lowercases', () => {
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });

  it('handles already clean email', () => {
    expect(sanitizeEmail('test@test.com')).toBe('test@test.com');
  });
});

// ============================================================================
// PRODUCT VALIDATION
// ============================================================================

describe('validateProduct', () => {
  const validProduct = {
    id: 'prod_1',
    siteId: 'site_1',
    name: 'Energy Drink',
    category: 'Beverages',
    price: 2.50,
    stock: 100,
    sku: 'ED-001',
    barcodes: ['123456789'],
  };

  it('accepts a valid product', () => {
    const result = validateProduct(validProduct);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('requires a name', () => {
    const result = validateProduct({ ...validProduct, name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('name'))).toBe(true);
  });

  it('requires a SKU', () => {
    const result = validateProduct({ ...validProduct, sku: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('sku'))).toBe(true);
  });

  it('requires a category', () => {
    const result = validateProduct({ ...validProduct, category: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('category'))).toBe(true);
  });

  it('rejects negative price', () => {
    const result = validateProduct({ ...validProduct, price: -5 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('price'))).toBe(true);
  });

  it('rejects unreasonably high price', () => {
    const result = validateProduct({ ...validProduct, price: 9999999 });
    expect(result.isValid).toBe(false);
  });

  it('rejects missing price', () => {
    const { price, ...noPrice } = validProduct;
    const result = validateProduct(noPrice);
    expect(result.isValid).toBe(false);
  });

  it('rejects name over 200 characters', () => {
    const result = validateProduct({ ...validProduct, name: 'A'.repeat(201) });
    expect(result.isValid).toBe(false);
  });

  it('collects multiple errors', () => {
    const result = validateProduct({ id: 'x' });
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
