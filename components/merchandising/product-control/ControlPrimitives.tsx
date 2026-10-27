import type { ReactNode } from 'react';
export const controlInput = 'min-h-[44px] w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-60';
export function ControlSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return <section className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 sm:p-5"><div><h4 className="text-base font-semibold text-[var(--theme-text-primary)]">{title}</h4>{description && <p className="mt-1 text-sm leading-relaxed text-[var(--theme-text-secondary)]">{description}</p>}</div>{children}</section>;
}
export function ControlField({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
    return <label className="block space-y-1.5 text-sm"><span className="font-medium text-[var(--theme-text-primary)]">{label}</span>{children}{help && <span className="block text-xs leading-relaxed text-[var(--theme-text-secondary)]">{help}</span>}</label>;
}
export function ControlFact({ label, value }: { label: string; value: ReactNode }) {
    return <div className="min-w-0"><dt className="text-xs font-medium text-[var(--theme-text-secondary)]">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-[var(--theme-text-primary)]">{value ?? 'Not recorded'}</dd></div>;
}
export function ProposalAction({ pending, disabled, label, error, onClick }: { pending: boolean; disabled?: boolean; label: string; error?: string; onClick: () => void }) {
    return <div className="space-y-3 border-t border-[var(--theme-border)] pt-4">{error && <p role="alert" className="text-sm text-[var(--theme-text-primary)]">{error}</p>}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-lg text-xs leading-relaxed text-[var(--theme-text-secondary)]">Changes take effect after regional Operations, Supply Chain and Merchandising approve.</p><button type="button" disabled={pending || disabled} onClick={onClick} className="min-h-[44px] shrink-0 rounded-xl bg-[var(--theme-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--theme-primary-text)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50">{pending ? 'Working…' : label}</button></div></div>;
}
