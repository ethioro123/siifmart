import React, { useEffect, useRef, useState, useId } from 'react';

import { createPortal } from 'react-dom';

export interface POFieldIssue { message: string; selector: string }
export function focusPOField(selector: string) {
    const field = document.querySelector<HTMLElement>(selector);
    if (!field) return;
    let ancestor = field.parentElement;
    while (ancestor) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        ancestor = ancestor.parentElement;
    }
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
}
export function POValidationFeedback({ issues }: { issues: POFieldIssue[] }) {
    const summary = useRef<HTMLDivElement>(null);
    const id = useId();
    const [targets, setTargets] = useState<(HTMLElement | null)[]>([]);
    useEffect(() => {
        if (!issues.length) return;
        const fields = issues.map(issue => document.querySelector<HTMLElement>(issue.selector));
        setTargets(fields);
        fields.forEach((field, index) => { field?.setAttribute('aria-invalid', 'true'); field?.setAttribute('aria-describedby', `${id}-${index}`); });
        if (fields[0]) focusPOField(issues[0].selector);
        else summary.current?.focus();
        return () => fields.forEach(field => { field?.removeAttribute('aria-invalid'); field?.removeAttribute('aria-describedby'); });
    }, [issues, id]);
    if (!issues.length) return null;
    return <>{issues.map((issue, index) => targets[index]?.parentElement ? createPortal(<p id={`${id}-${index}`} className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{issue.message}</p>, targets[index]!.parentElement!) : null)}<div ref={summary} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-[var(--theme-text-primary)]">
        <p className="font-semibold">Complete these fields to continue</p>
        <ul className="mt-2 space-y-2">{issues.map((issue, index) => <li key={index}>
            <button type="button" className="text-left underline underline-offset-2 min-h-8 focus-visible:outline focus-visible:outline-2" onClick={() => focusPOField(issue.selector)}>{issue.message}</button>
        </li>)}</ul>
    </div></>;
}
export const itemFieldSelectors: Record<string, string> = {
    qty: '[aria-label="Order quantity"]', cost: '[aria-label="Buying cost per order unit"]',
    name: '[aria-label="Product name"]', brand: '[aria-label="Brand"]', category: '[title="Category"]',
    size: '[data-po-field="size"]', unit: '[aria-label="Sell unit"]',
    packQty: '[data-po-field="packQty"]', caseSize: '[data-po-field="caseSize"]',
    storageConfirmation: '[data-po-field="storageConfirmation"]',
    shelfLifeDays: '[aria-label="Total product shelf life (days)"]', search: '#po-item-form-container input'
};
