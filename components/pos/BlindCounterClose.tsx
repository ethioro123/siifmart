import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
export function BlindCounterClose({ isOpen, pending, onClose, onSubmit, denominations, setDenominations, notes, setNotes }: {
    isOpen: boolean; pending: boolean; onClose: () => void; onSubmit: () => void;
    denominations: Record<string, number>; setDenominations: (value: Record<string, number>) => void;
    notes: string; setNotes: (value: string) => void;
}) {
    const { t, currencySymbol } = useLanguage();
    const { effectiveCountry } = useData();
    const [confirmed, setConfirmed] = useState(false);
    useEffect(() => setConfirmed(false), [isOpen]);
    const values = effectiveCountry === 'KE' ? [1000,500,200,100,50,20,10,5,1] : [200,100,50,20,10,5,1];
    const actual = values.reduce((sum, denomination) => sum + denomination * (denominations[denomination] || 0), 0);
    return <Modal isOpen={isOpen} onClose={() => { if (!pending) onClose(); }} title={t('pos.counterCloseTitle')} size="lg">
        <form onSubmit={event => { event.preventDefault(); if (confirmed && !pending) onSubmit(); }} className="space-y-4">
            <p className="text-sm text-[var(--theme-text-secondary)]">{t('pos.counterBlindNotice')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{values.map(value => <label key={value} className="text-sm text-[var(--theme-text-primary)]">{currencySymbol} {value}<input type="number" min="0" max="100000" step="1" value={denominations[value] || ''} disabled={pending} onChange={event => { const count = Number(event.target.value); if (Number.isSafeInteger(count) && count>=0) setDenominations({ ...denominations, [value]: count }); }} className="block w-full min-h-11 p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" /></label>)}</div>
            <p className="font-semibold text-[var(--theme-text-primary)]">{t('pos.counterCounted')}: {currencySymbol} {actual.toLocaleString()}</p>
            <label className="block text-sm text-[var(--theme-text-primary)]">{t('pos.counterReason')}<textarea maxLength={2000} value={notes} disabled={pending} onChange={event => setNotes(event.target.value)} className="block w-full min-h-20 p-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-bg-subtle)]" /></label>
            <label className="flex items-start gap-2 text-sm text-[var(--theme-text-primary)]"><input type="checkbox" required checked={confirmed} disabled={pending} onChange={event => setConfirmed(event.target.checked)} />{t('pos.counterSubmit')}</label>
            <div className="flex gap-3"><button type="button" disabled={pending} onClick={onClose} className="min-h-11 px-4">{t('pos.counterCancel')}</button><button type="submit" disabled={!confirmed || pending} className="min-h-11 px-4 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-lg disabled:opacity-50">{t(pending ? 'pos.counterSaving' : 'pos.counterSubmit')}</button></div>
        </form>
    </Modal>;
}
