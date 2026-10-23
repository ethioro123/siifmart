import React, { useState } from 'react';
import { useFulfillmentData } from '../FulfillmentDataProvider';
import { logger } from '../../../utils/logger';

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
    const { autoAssignJobs, autoUnassignJobs } = useFulfillmentData();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const run = async (undo: boolean) => {
        if (busy) return;
        setBusy(true); setError('');
        try { await (undo ? autoUnassignJobs() : autoAssignJobs()); }
        catch (cause) { logger.error('AssignHeader', 'Automatic assignment action failed', cause); setError('Assignment action did not finish. Review the queue before retrying.'); }
        finally { setBusy(false); }
    };
    const inputClass = 'min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
    return <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)]">Task assignment</h2><p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Select a job, then choose an eligible team member.</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => run(true)} className={`${inputClass} disabled:opacity-50`}>Undo auto-assignment</button><button type="button" disabled={busy} onClick={() => run(false)} className="min-h-[44px] rounded-xl bg-[var(--theme-btn-primary-bg)] px-4 text-sm font-semibold text-[var(--theme-btn-primary-text)] disabled:opacity-50">{busy ? 'Working…' : 'Auto-assign jobs'}</button></div>
        </div>
        {error && <p role="alert" className="text-sm text-[var(--theme-status-error-text)]">{error}</p>}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3">
            <input type="search" aria-label="Search assignment jobs" value={dispatchSearch} onChange={e => setDispatchSearch(e.target.value)} placeholder="Search job, SKU or order…" className={`${inputClass} min-w-0 basis-full sm:basis-auto flex-1`} />
            <select aria-label="Job type" value={assignJobFilter} onChange={e => setAssignJobFilter(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`}><option value="ALL">All job types</option>{['PICK','PACK','PUTAWAY','RECEIVE','COUNT','REPLENISH','DISPATCH'].map(type => <option key={type}>{type}</option>)}</select>
            <select aria-label="Job priority" value={dispatchPriorityFilter} onChange={e => setDispatchPriorityFilter(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`}><option value="ALL">All priorities</option>{['Critical','High','Normal'].map(priority => <option key={priority}>{priority}</option>)}</select>
            <select aria-label="Sort assignment jobs" value={assignSortBy} onChange={e => setAssignSortBy(e.target.value)} className={`${inputClass} flex-1 sm:flex-none`}><option value="priority">Priority first</option><option value="date">Oldest first</option><option value="items">Item count</option><option value="eta">Estimated duration</option></select>
        </div>
    </header>;
};
