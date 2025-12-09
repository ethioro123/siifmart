import { Product } from '../types';

export const generateUniqueSKU = (
    siteName: string,
    category: string,
    existingProducts: Product[]
): string => {
    // Company prefix
    const companyPrefix = 'SM';

    // Site/location prefix
    const siteParts = (siteName || 'Administration').split(/\s+/).filter(Boolean);
    const sitePrefixRaw = siteParts.length === 1
        ? siteParts[0].substring(0, 3)
        : siteParts.map(part => part[0]).join('').substring(0, 3);
    const sitePrefix = sitePrefixRaw.toUpperCase().padEnd(3, 'X');

    // Category prefix
    const catPrefix = category.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');

    // 4-digit sequence – ensure uniqueness
    let unique = false;
    let generated = '';
    let attempts = 0;

    while (!unique && attempts < 50) {
        const seq = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        generated = `${companyPrefix}-${sitePrefix}-${catPrefix}-${seq}`;

        // Check if exists
        if (!existingProducts.some(p => p.sku === generated)) {
            unique = true;
        }
        attempts++;
    }

    // Fallback to timestamp if random fails
    if (!unique) {
        const seq = Date.now().toString().slice(-4);
        generated = `${companyPrefix}-${sitePrefix}-${catPrefix}-${seq}`;
    }

    return generated;
};

export const isSKUUnique = (
    sku: string,
    existingProducts: Product[],
    excludeProductId?: string
): boolean => {
    const duplicate = existingProducts.find(p => p.sku === sku && p.id !== excludeProductId);
    return !duplicate;
};
