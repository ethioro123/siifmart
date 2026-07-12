export type LabelSize = 'Small' | 'Medium' | 'Large' | 'XL' | 'Bay';
export type LabelFormat = 'QR' | 'Barcode' | 'Both';

// Standard Retail/Warehouse Sizes (Metric / Custom)
export const SIZE_CSS: Record<string, { width: string; height: string; page: string }> = {
    'Small': { width: '74.1mm', height: '41.6mm', page: '74.1mm 41.6mm' },
    'Medium': { width: '98.8mm', height: '66.3mm', page: '98.8mm 66.3mm' },
    'Large': { width: '130mm', height: '97.5mm', page: '130mm 97.5mm' },
    'XL': { width: '130mm', height: '195mm', page: '130mm 195mm' },
    'Bay': { width: '4in', height: '2in', page: '4in 2in' }
};
