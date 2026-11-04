import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import type { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { InventoryLocationRows } from './InventoryProductLocations';

/** A body-level panel avoids clipping inside the scrollable inventory table. */
export function InventoryLocationDropdown({ product }: { product: Product }) {
    const { t, country } = useLanguage();
    const id = useId();
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<React.CSSProperties>();
    useEffect(() => { setOpen(false); }, [country, product.id]);
    const close = () => { setOpen(false); trigger.current?.focus(); };
    useLayoutEffect(() => {
        if (!open) return;
        const place = () => {
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect) return;
            const width = Math.min(384, window.innerWidth - 24);
            const below = window.innerHeight - rect.bottom - 18;
            const above = rect.top - 18;
            const down = below >= Math.min(320, above);
            setPosition({ width, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
                top: down ? rect.bottom + 6 : undefined,
                bottom: down ? undefined : window.innerHeight - rect.top + 6,
                maxHeight: Math.max(48, Math.min(420, down ? below : above)) });
        };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    }, [open]);
    useEffect(() => {
        if (!open) return;
        panel.current?.focus();
        const outside = (event: Event) => {
            if (event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
        };
        document.addEventListener('pointerdown', outside, true);
        document.addEventListener('focusin', outside);
        document.addEventListener('keydown', escape, true);
        return () => {
            document.removeEventListener('pointerdown', outside, true);
            document.removeEventListener('focusin', outside);
            document.removeEventListener('keydown', escape, true);
        };
    }, [open]);
    const label = product.inventorySummary && product.inventorySummary.locationCount > 1
        ? t('warehouse.locationsCount', { count: product.inventorySummary.locationCount })
        : product.location || t('inventory.locationUnassigned');
    return <>
        <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="dialog"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-bg-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]"
            onClick={event => { event.stopPropagation(); setOpen(value => !value); }}>
            {label}<ChevronDown size={16} aria-hidden="true" className={open ? 'rotate-180' : ''} />
        </button>
        {open && createPortal(<section ref={panel} id={id} role="dialog" aria-label={t('inventory.stockLocations')} tabIndex={-1}
            style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
            className="fixed z-[100] overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 text-[var(--theme-text-primary)] shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]"
            onClick={event => event.stopPropagation()}>
            <header className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-2">
                <h3 className="text-sm font-semibold">{t('inventory.stockLocations')}</h3>
                <button type="button" aria-label={t('common.close')} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-[var(--theme-bg-subtle)]" onClick={close}><X size={18} aria-hidden="true" /></button>
            </header>
            <InventoryLocationRows key={`${product.id}:${country}`} product={product} country={country} />
        </section>, document.body)}
    </>;
}
