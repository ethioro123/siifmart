import { useLanguage } from '../contexts/LanguageContext';
import {
    isOromoLanguage,
    getOromoAdaptiveTextClass,
    getOromoButtonClass,
    getOromoBadgeClass,
    getOromoNavTabClass
} from '../utils/oromoTypography';

export function useDynamicText() {
    const { language, isOromo } = useLanguage();

    return {
        isOromo: isOromo ?? isOromoLanguage(language),
        language,
        adaptiveClass: (baseClass = '', oromoClass = '') =>
            getOromoAdaptiveTextClass(language, baseClass, oromoClass),
        buttonClass: (baseClass = '') => getOromoButtonClass(language, baseClass),
        badgeClass: (baseClass = '') => getOromoBadgeClass(language, baseClass),
        navTabClass: (baseClass = '') => getOromoNavTabClass(language, baseClass),
    };
}
