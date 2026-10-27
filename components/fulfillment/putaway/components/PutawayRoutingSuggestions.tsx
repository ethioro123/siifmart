import React from 'react';
import type { usePutawayRouting } from '../hooks/usePutawayRouting';
export type PutawayRoutingState = ReturnType<typeof usePutawayRouting>;

export function PutawayRoutingSuggestions({ routing, t }: { routing: PutawayRoutingState; t?: (key: string, params?: Record<string, string | number>) => string }) {
    const tr = (k: string, fb: string, params?: Record<string, string | number>) => (t ? t(k, params) : fb) || fb;
    const primary = routing.suggestions[0];
    return <section aria-label={tr('warehouse.putaway.livePutawayRouting', 'Live putaway routing')} className="mt-3 space-y-2 text-left text-xs min-w-0 break-words text-[var(--theme-text-secondary)]">
        {routing.error ? <p role="alert">{tr('warehouse.putaway.routingError', 'Could not refresh routing. Scan and verify a suitable bin, or retry.')}</p> : routing.loading ? <p role="status">{tr('warehouse.putaway.routingLoading', 'Checking current site stock and storage zones…')}</p> : primary ? <>
            <p className="font-semibold text-[var(--theme-text-primary)]">{primary.label}</p>
            <p>{primary.reason}</p>
            {primary.existingUnits > 0 && <p>{tr('warehouse.putaway.unitsRecordedInSnapshot', `${primary.existingUnits} units recorded in this stock snapshot.`, { count: primary.existingUnits })}</p>}
            {routing.suggestions.length > 1 && <p>{tr('warehouse.putaway.alternatives', 'Alternatives:')} {routing.suggestions.slice(1, 4).map(s => s.location).join(' · ')}</p>}
        </> : <p>{tr('warehouse.putaway.noSuitableSuggestion', 'No suitable suggestion. Check storage requirements and ask your warehouse lead for an authorized bin.')}</p>}
        <div className="flex flex-wrap gap-2">
            {primary && <button type="button" disabled={routing.loading} onClick={() => routing.reportFull(primary.location)} className="min-h-[44px] px-3 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">{tr('warehouse.putaway.binFullFindNext', 'Bin full — find next')}</button>}
            <button type="button" disabled={routing.loading} onClick={routing.refresh} className="min-h-[44px] px-3 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">{tr('warehouse.putaway.refreshSuggestions', 'Refresh suggestions')}</button>
        </div>
        <p>{routing.updatedAt > 0 && tr('warehouse.putaway.checkedAt', `Checked ${new Date(routing.updatedAt).toLocaleTimeString()}. `, { time: new Date(routing.updatedAt).toLocaleTimeString() }) + ' '}{tr('warehouse.putaway.fullBinsNotice', 'Full bins are skipped for this job. Scan the physical bin label to confirm placement.')}</p>
    </section>;
}
