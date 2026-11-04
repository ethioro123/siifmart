import React, { useId } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Props {
    maxAisles?: number;
    specialization: string;
    aisles: Record<string, string>;
    onSpecialization: (value: string) => void;
    onAisles: (value: Record<string, string>) => void;
}
export function ZoneSpecializationFields({ specialization, aisles, onSpecialization, onAisles, maxAisles = 20 }: Props) {
    const { t } = useLanguage();
    const id = useId();
    const field = 'w-full min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]';
    return (
        <fieldset className="space-y-3 border-t border-[var(--theme-border)] pt-3">
            <legend className="text-sm font-semibold text-[var(--theme-text-primary)]">{t('warehouse.zoneSpecializations')}</legend>
            <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.zoneSpecializationsHelp')}</p>
            <fieldset className="space-y-2 rounded-2xl border border-[var(--theme-border)] p-4">
                <legend className="px-1 text-sm font-semibold text-[var(--theme-text-primary)]">{t('warehouse.zoneScopeTitle')}</legend>
                <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.zoneScopeHelp')}</p>
            <label className="block text-sm text-[var(--theme-text-primary)]" htmlFor={id}>{t('warehouse.zoneSpecialization')}</label>
            <input id={id} className={field} maxLength={120} value={specialization} onChange={e => onSpecialization(e.target.value)} />
            </fieldset>
            <fieldset className="space-y-3 rounded-2xl border border-[var(--theme-border)] p-4">
                <legend className="px-1 text-sm font-semibold text-[var(--theme-text-primary)]">{t('warehouse.aisleScopeTitle')}</legend>
                <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.aisleScopeHelp')}</p>
                <div className="space-y-3">
                    {Array.from({ length: Math.min(99, Math.max(1, maxAisles)) }, (_, i) => String(i + 1).padStart(2, '0')).map(aisle => (
                        <div key={aisle} className="grid grid-cols-1 sm:grid-cols-[90px_1fr] items-center gap-2">
                            <label className="text-sm font-medium text-[var(--theme-text-primary)]" htmlFor={id + '-aisle-' + aisle}>
                                {t('warehouse.aisleTitle')} {aisle}
                            </label>
                            <input id={id + '-aisle-' + aisle} className={field} maxLength={120}
                                placeholder={t('warehouse.aisleSpecializationPlaceholder')}
                                value={aisles[aisle] || ''} onChange={e => {
                                    const next = { ...aisles };
                                    if (e.target.value.trim()) next[aisle] = e.target.value;
                                    else delete next[aisle];
                                    onAisles(next);
                                }} />
                        </div>
                    ))}
                </div>
            </fieldset>
        </fieldset>
    );
}
