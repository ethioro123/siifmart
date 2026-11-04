import React, { useId, useState } from 'react';
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
    const [aisle, setAisle] = useState('01');
    const field = 'w-full min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]';
    return (
        <fieldset className="space-y-3 border-t border-[var(--theme-border)] pt-3">
            <legend className="text-sm font-semibold text-[var(--theme-text-primary)]">{t('warehouse.zoneSpecializations')}</legend>
            <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.zoneSpecializationsHelp')}</p>
            <label className="block text-sm text-[var(--theme-text-primary)]" htmlFor={id}>{t('warehouse.zoneSpecialization')}</label>
            <input id={id} className={field} maxLength={120} value={specialization} onChange={e => onSpecialization(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
                <div>
                    <label className="block text-sm text-[var(--theme-text-primary)]" htmlFor={id + '-aisle'}>{t('warehouse.aisleTitle')}</label>
                    <select id={id + '-aisle'} className={field} value={aisle} onChange={e => setAisle(e.target.value)}>
                        {Array.from({ length: Math.min(99, Math.max(1, maxAisles)) }, (_, i) => String(i + 1).padStart(2, '0')).map(n => <option key={n}>{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-[var(--theme-text-primary)]" htmlFor={id + '-description'}>{t('warehouse.aisleSpecialization')}</label>
                    <input id={id + '-description'} className={field} maxLength={120} value={aisles[aisle] || ''} onChange={e => {
                        const next = { ...aisles };
                        if (e.target.value) next[aisle] = e.target.value;
                        else delete next[aisle];
                        onAisles(next);
                    }} />
                </div>
            </div>
            {Object.entries(aisles).filter(([, value]) => value.trim()).map(([number, value]) =>
                <p key={number} className="text-xs text-[var(--theme-text-secondary)] break-words">{number} · {value}</p>
            )}
        </fieldset>
    );
}
