import { useState } from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { useCashDropRequest } from '../../../hooks/useCashDropRequest';
export function CashDropModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { activeShift } = usePOS(); const { t, currencySymbol } = useLanguage();
    const [amount, setAmount] = useState(''); const [bag, setBag] = useState(''); const [saved, setSaved] = useState(false);
    const request = useCashDropRequest(activeShift?.id);
    return <Modal isOpen={isOpen} onClose={() => { if (!request.isPending) { onClose(); setSaved(false); } }} title={t('pos.counterDropRequest')} size="md">
        <form onSubmit={async event => { event.preventDefault(); setSaved(false); try { await request.mutateAsync({ amount: Number(amount), bag }); setSaved(true); setAmount(''); } catch { /* Error state is rendered below. */ } }} className="space-y-4 text-[var(--theme-text-primary)]">
            <p className="text-sm">{t('pos.counterDropNotice')}</p>
            <label className="block">{t('pos.counterAmount')} ({currencySymbol})<input type="number" required min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="block w-full min-h-11 p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" /></label>
            <label className="block">{t('pos.counterBag')}<input required maxLength={100} value={bag} onChange={event => setBag(event.target.value)} className="block w-full min-h-11 p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" /></label>
            {saved && <p role="status">{t('pos.counterDropPending')}</p>}{request.isError && <p role="alert">{t('pos.counterReviewFailed')}</p>}
            <button type="submit" disabled={request.isPending || !activeShift} className="min-h-11 px-4 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-text)] disabled:opacity-50">{t(request.isPending ? 'pos.counterSaving' : 'pos.counterDropRequest')}</button>
        </form>
    </Modal>;
}
