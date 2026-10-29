import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import type { Country } from '../../../utils/localization';
import type { useFinanceSettingsMutation } from '../../../hooks/useFinanceSettingsMutation';

interface FinanceBaselineBannerProps {
    countryName: string;
    targetCountry?: Country;
    isPolicyPersisted: boolean;
    isLimitsPersisted: boolean;
    isForexPersisted: boolean;
    isAuthorized?: boolean;
    policy?: any;
    limits?: any;
    exchangeRates?: any;
    mutation?: ReturnType<typeof useFinanceSettingsMutation>;
    showToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function FinanceBaselineBanner({
    countryName,
    targetCountry = 'ET',
    isPolicyPersisted,
    isLimitsPersisted,
    isForexPersisted,
    isAuthorized = false,
    policy,
    limits,
    exchangeRates,
    mutation,
    showToast,
}: FinanceBaselineBannerProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const isAnySectionUnverified = !isPolicyPersisted || !isLimitsPersisted || !isForexPersisted;

    if (!isAnySectionUnverified) {
        return null;
    }

    const unverifiedSections: string[] = [];
    if (!isPolicyPersisted) unverifiedSections.push('Fiscal & Tax Policy');
    if (!isLimitsPersisted) unverifiedSections.push('Financial Limits');
    if (!isForexPersisted) unverifiedSections.push('Exchange Rates');

    const handleConfirmBaseline = async () => {
        if (!isAuthorized || !mutation) {
            showToast?.('Unauthorized: Approving financial baseline requires CEO or Country Finance Director credentials.', 'error');
            return;
        }

        setIsConfirming(true);
        try {
            if (!isPolicyPersisted && policy) {
                await mutation.mutateAsync({
                    section: 'policy',
                    targetCountry,
                    data: policy,
                });
            }
            if (!isLimitsPersisted && limits) {
                await mutation.mutateAsync({
                    section: 'limits',
                    targetCountry,
                    data: limits,
                });
            }
            if (!isForexPersisted && exchangeRates) {
                await mutation.mutateAsync({
                    section: 'currency',
                    targetCountry,
                    data: { exchangeRates },
                });
            }
            showToast?.(`Approved & confirmed baseline financial policies for ${countryName}.`, 'success');
        } catch (err: any) {
            showToast?.(err.message || 'Failed to approve country financial baseline.', 'error');
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={17} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] uppercase tracking-wide">
                            Statutory Template Baseline (Pending Confirmation)
                        </h4>
                        <span className="text-[10px] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] px-2 py-0.5 rounded-full font-medium">
                            Action Required
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-1 leading-relaxed">
                        No confirmed corporate configuration is persisted in the database for <strong>{countryName}</strong> for:{' '}
                        <span className="font-semibold underline decoration-[color-mix(in_srgb,var(--theme-status-warning-text)_40%,transparent)]">{unverifiedSections.join(', ')}</span>.
                        The values shown below are statutory defaults. Click &ldquo;Confirm &amp; Approve Country Baseline&rdquo; or save individual sections to establish this country&apos;s authoritative ledger baseline.
                    </p>
                </div>
            </div>
            {isAuthorized && mutation && (
                <div className="shrink-0 self-end md:self-center">
                    <button
                        type="button"
                        onClick={handleConfirmBaseline}
                        disabled={isConfirming}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Persisting Baseline...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={14} />
                                <span>Confirm &amp; Approve Country Baseline</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export function BaselineBadge({ isPersisted }: { isPersisted: boolean }) {
    if (isPersisted) {
        return (
            <span className="text-[10px] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <CheckCircle2 size={11} className="text-[var(--theme-status-success-text)]" />
                Persisted Policy
            </span>
        );
    }

    return (
        <span className="text-[10px] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
            <AlertTriangle size={11} className="text-[var(--theme-status-warning-text)]" />
            Unsaved Template Baseline
        </span>
    );
}
