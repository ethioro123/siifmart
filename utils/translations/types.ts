export type Language = 'en' | 'am' | 'or';

export interface TranslationBlock {
    [key: string]: {
        [key in Language]?: string;
    } | TranslationBlock;
}
