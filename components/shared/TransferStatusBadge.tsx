import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { transferStatusKey, transferStatusTone } from '../../utils/transferPresentation';
const tones = {
    warning: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
    info: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
    success: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
    danger: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]',
    neutral: 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
};
export function TransferStatusBadge({ status }: { status: string }) {
    const { t } = useLanguage();
    const key = transferStatusKey(status);
    return <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${tones[transferStatusTone(status)]}`}>{key ? t(key) : status}</span>;
}
