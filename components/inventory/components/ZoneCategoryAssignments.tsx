import React from 'react';
import { ALL_CATEGORY_OPTIONS } from '../../../constants/categories';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Props {
    accepted: string[];
    aisles: Record<string, string[]>;
    maxAisles: number;
    onChange: (accepted: string[], aisles: Record<string, string[]>) => void;
}
export function ZoneCategoryAssignments({ accepted, aisles, maxAisles, onChange }: Props) {
    const { t } = useLanguage();
    const choose = (selected: string[], options: string[], update: (values: string[]) => void) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-60 overflow-y-auto mt-2">
            {options.map(category => <label key={category} className="flex gap-2 items-center min-h-[44px] text-xs text-[var(--theme-text-primary)]">
                <input type="checkbox" checked={selected.includes(category)} onChange={e => update(e.target.checked ? [...selected, category] : selected.filter(c => c !== category))} />
                {category}
            </label>)}
        </div>
    );
    return <fieldset className="space-y-3 rounded-2xl border border-[var(--theme-border)] p-4">
        <legend className="text-sm font-semibold text-[var(--theme-text-primary)]">{t('warehouse.zoneCategoryRouting')}</legend>
        <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.zoneCategoryRoutingHelp')}</p>
        <details>
            <summary className="min-h-[44px] cursor-pointer text-sm text-[var(--theme-text-primary)]">{t('warehouse.zoneAcceptedCategories')} ({accepted.length})</summary>
            {choose(accepted, [...new Set([...ALL_CATEGORY_OPTIONS, ...accepted])], values => {
                const next = Object.fromEntries(Object.entries(aisles).map(([aisle, categories]) => [aisle, categories.filter(c => values.includes(c))]).filter(([, categories]) => categories.length));
                onChange(values, next);
            })}
        </details>
        <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.aisleCategoryRoutingHelp')}</p>
        {Array.from({ length: Math.min(99, Math.max(1, maxAisles)) }, (_, i) => String(i + 1).padStart(2, '0')).map(aisle =>
            <details key={aisle} className="border-t border-[var(--theme-border)]">
                <summary className="min-h-[44px] cursor-pointer text-sm text-[var(--theme-text-primary)] py-2 break-words">
                    {t('warehouse.aisleTitle')} {aisle} · {(aisles[aisle] || []).join(', ') || t('warehouse.noAisleCategories')}
                </summary>
                {choose(aisles[aisle] || [], accepted, values => {
                    const next = { ...aisles };
                    if (values.length) next[aisle] = values; else delete next[aisle];
                    onChange(accepted, next);
                })}
            </details>)}
    </fieldset>;
}
