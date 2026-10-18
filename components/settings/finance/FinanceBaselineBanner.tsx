import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FinanceBaselineBannerProps {
    countryName: string;
    isPolicyPersisted: boolean;
    isLimitsPersisted: boolean;
    isForexPersisted: boolean;
}

export function FinanceBaselineBanner({
    countryName,
    isPolicyPersisted,
    isLimitsPersisted,
    isForexPersisted,
}: FinanceBaselineBannerProps) {
    const isAnySectionUnverified = !isPolicyPersisted || !isLimitsPersisted || !isForexPersisted;

    if (!isAnySectionUnverified) {
        return null;
    }

    const unverifiedSections: string[] = [];
    if (!isPolicyPersisted) unverifiedSections.push('Fiscal & Tax Policy');
    if (!isLimitsPersisted) unverifiedSections.push('Financial Limits');
    if (!isForexPersisted) unverifiedSections.push('Exchange Rates');

    return (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={17} />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Statutory Template Baseline (Unverified)
                    </h4>
                    <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Action Required
                    </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1 leading-relaxed">
                    No confirmed corporate configuration is persisted in the database for <strong>{countryName}</strong> for:{' '}
                    <span className="font-semibold underline decoration-amber-500/40">{unverifiedSections.join(', ')}</span>.
                    The values currently shown in these sections are statutory system defaults. Please review them carefully and click &ldquo;Save&rdquo; to persist authorized corporate financial policies.
                </p>
            </div>
        </div>
    );
}

export function BaselineBadge({ isPersisted }: { isPersisted: boolean }) {
    if (isPersisted) {
        return (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" />
                Persisted Policy
            </span>
        );
    }

    return (
        <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
            <AlertTriangle size={11} className="text-amber-500" />
            Unsaved Template Baseline
        </span>
    );
}
