/**
 * Utility for generating user-friendly IDs
 * Format: PREFIX + 5-digit number (e.g., PO00123, S00090, J00001)
 */

const generateSequentialId = (prefix: string): string => {
    // Generate a random 5-digit number (00001-99999)
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const paddedNum = randomNum.toString().padStart(5, '0');
    return `${prefix}${paddedNum}`;
};

export const generatePOId = (): string => {
    return generateSequentialId('PO');
};

export const generateSaleId = (): string => {
    return generateSequentialId('S');
};

export const generateJobId = (type: string = 'JOB'): string => {
    // Use first letter of job type (PICK -> P, PACK -> P, PUTAWAY -> P)
    // Or just use 'J' for generic jobs
    const prefix = type === 'JOB' ? 'J' : type.charAt(0);
    return generateSequentialId(prefix);
};

export const generateProductId = (): string => {
    return generateSequentialId('PROD');
};

export const generateSupplierId = (): string => {
    return generateSequentialId('SUP');
};

export const generateShortId = (prefix: string = 'ID'): string => {
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const paddedNum = randomNum.toString().padStart(5, '0');
    return `${prefix}${paddedNum}`;
};
