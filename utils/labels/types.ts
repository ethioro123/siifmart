export type LabelSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'XL';
export type LabelFormat = 'QR' | 'Barcode' | 'Both';

export interface LabelDimensions {
    width: string;
    height: string;
    page: string;
    widthMm: number;
    heightMm: number;
    widthInches: number;
    heightInches: number;
    label: string;
}

/**
 * Standardized Thermal Label Dimensions across SIIFMART
 * Matches standard roll specifications (2"x1", 3"x2", 4"x3", 4"x6")
 */
export const STANDARD_LABEL_SIZES: Record<LabelSize, LabelDimensions> = {
    'Tiny': {
        width: '31.8mm',
        height: '12.7mm',
        page: '31.8mm 12.7mm',
        widthMm: 31.8,
        heightMm: 12.7,
        widthInches: 1.25,
        heightInches: 0.5,
        label: '1.25" × 0.5" (32 × 13 mm)'
    },
    'Small': {
        width: '50.8mm',
        height: '25.4mm',
        page: '50.8mm 25.4mm',
        widthMm: 50.8,
        heightMm: 25.4,
        widthInches: 2.0,
        heightInches: 1.0,
        label: '2" × 1" (50.8 × 25.4 mm)'
    },
    'Medium': {
        width: '76.2mm',
        height: '50.8mm',
        page: '76.2mm 50.8mm',
        widthMm: 76.2,
        heightMm: 50.8,
        widthInches: 3.0,
        heightInches: 2.0,
        label: '3" × 2" (76.2 × 50.8 mm)'
    },
    'Large': {
        width: '101.6mm',
        height: '76.2mm',
        page: '101.6mm 76.2mm',
        widthMm: 101.6,
        heightMm: 76.2,
        widthInches: 4.0,
        heightInches: 3.0,
        label: '4" × 3" (101.6 × 76.2 mm)'
    },
    'XL': {
        width: '101.6mm',
        height: '152.4mm',
        page: '101.6mm 152.4mm',
        widthMm: 101.6,
        heightMm: 152.4,
        widthInches: 4.0,
        heightInches: 6.0,
        label: '4" × 6" (101.6 × 152.4 mm)'
    }
};

export const normalizeLabelSize = (size?: string): LabelSize => {
    if (!size) return 'Medium';
    const s = size.toLowerCase().trim();
    if (s === 'tiny' || s.includes('1.25')) return 'Tiny';
    if (s === 'small' || s === 'sm' || s.includes('2x1') || s.includes('2" x 1"')) return 'Small';
    if (s === 'large' || s === 'lg' || s.includes('4x3') || s.includes('4" x 3"')) return 'Large';
    if (s === 'xl' || s === 'extra large' || s.includes('4x6') || s.includes('4" x 6"')) return 'XL';
    return 'Medium';
};

export const getLabelDimensions = (size?: string): LabelDimensions => {
    return STANDARD_LABEL_SIZES[normalizeLabelSize(size)];
};

export const SIZE_CSS: Record<string, { width: string; height: string; page: string }> = {
    'Tiny': STANDARD_LABEL_SIZES.Tiny,
    'Small': STANDARD_LABEL_SIZES.Small,
    'Medium': STANDARD_LABEL_SIZES.Medium,
    'Large': STANDARD_LABEL_SIZES.Large,
    'XL': STANDARD_LABEL_SIZES.XL,
    // Case-insensitive aliases
    'tiny': STANDARD_LABEL_SIZES.Tiny,
    'small': STANDARD_LABEL_SIZES.Small,
    'medium': STANDARD_LABEL_SIZES.Medium,
    'large': STANDARD_LABEL_SIZES.Large,
    'xl': STANDARD_LABEL_SIZES.XL,
    'TINY': STANDARD_LABEL_SIZES.Tiny,
    'SMALL': STANDARD_LABEL_SIZES.Small,
    'MEDIUM': STANDARD_LABEL_SIZES.Medium,
    'LARGE': STANDARD_LABEL_SIZES.Large
};
