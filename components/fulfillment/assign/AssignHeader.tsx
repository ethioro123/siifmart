import React, { useState } from 'react';
import { useFulfillmentData } from '../FulfillmentDataProvider';
import { logger } from '../../../utils/logger';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AssignHeaderProps {
    assignJobFilter: string;
    setAssignJobFilter: (val: string) => void;
    dispatchPriorityFilter: string;
    setDispatchPriorityFilter: (val: string) => void;
    assignSortBy: string;
    setAssignSortBy: (val: string) => void;
    dispatchSearch: string;
    setDispatchSearch: (val: string) => void;
    isAssignFilterDropdownOpen: boolean;
    setIsAssignFilterDropdownOpen: (val: boolean) => void;
    isAssignSortDropdownOpen: boolean;
    setIsAssignSortDropdownOpen: (val: boolean) => void;
}

export const AssignHeader: React.FC<AssignHeaderProps> = ({ assignJobFilter, setAssignJobFilter, dispatchPriorityFilter, setDispatchPriorityFilter, assignSortBy, setAssignSortBy, dispatchSearch, setDispatchSearch }) => {
    const { t } = useLanguage();
    const { autoAssignJobs, autoUnassignJobs } = useFulfillmentData();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const run = async (undo: boolean) => {
        if (busy) return;
        setBusy(true); setError('');
        try { await (undo ? autoUnassignJobs() : autoAssignJobs()); }
        catch (cause) { logger.error('AssignHeader', 'Automatic assignment action failed', cause); setError(t('warehouse.assignmentActionFailed')); }
        finally { setBusy(false); }
    };
    const inputClass = 'min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
    return <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)]">{t('warehouse.taskAssignment')}</h2>
                <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{t('warehouse.taskAssignmentDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => run(true)} className={`${inputClass} disabled:opacity-50 cursor-pointer`}>
                    {t('warehouse.undoAutoAssignment')}
                </button>
                <button type="button" disabled={busy} onClick={() => run(false)} className="min-h-[44px] rounded-xl bg-[var(--theme-btn-primary-bg)] px-4 text-sm font-semibold text-[var(--theme-btn-primary-text)] disabled:opacity-50 cursor-pointer">
                    {busy ? t('warehouse.workingEllipsis') : t('warehouse.autoAssignJobs')}
                </button>
            </div>
        </div>
        {error && <p role="alert" className="text-sm text-[var(--theme-status-error-text)]">{error}</p>}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3">
            <input type="search" aria-label={t('warehouse.searchJobSkuOrderPlaceholder')} value={dispatchSearch} onChange={e => setDispatchSearch(e.target.value)} placeholder={t('warehouse.searchJobSkuOrderPlaceholder')} className={`${inputClass} min-w-0 basis-full sm:basis-auto flex-1`} />
            <select aria-label={t('warehouse.allJobTypes')} value={assignJobFilter} onChange={e => setAssignJobFilter(e.target.value)} className={`${inputClass} flex-1 sm:flex-none cursor-pointer`}>
                <option value="ALL">{t('warehouse.allJobTypes')}</option>
                {['PICK','PACK','PUTAWAY','RECEIVE','COUNT','REPLENISH','DISPATCH'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <select aria-label={t('warehouse.allPriorities')} value={dispatchPriorityFilter} onChange={e => setDispatchPriorityFilter(e.target.value)} className={`${inputClass} flex-1 sm:flex-none cursor-pointer`}>
                <option value="ALL">{t('warehouse.allPriorities')}</option>
                {['Critical','High','Normal'].map(priority => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <select aria-label={t('warehouse.sortByPriorityFirst')} value={assignSortBy} onChange={e => setAssignSortBy(e.target.value)} className={`${inputClass} flex-1 sm:flex-none cursor-pointer`}>
                <option value="priority">{t('warehouse.sortByPriorityFirst')}</option>
                <option value="date">{t('warehouse.sortByOldestFirst')}</option>
                <option value="items">{t('warehouse.sortByItemCount')}</option>
                <option value="eta">{t('warehouse.sortByEstimatedDuration')}</option>
            </select>
        </div>
    </header>;
};
