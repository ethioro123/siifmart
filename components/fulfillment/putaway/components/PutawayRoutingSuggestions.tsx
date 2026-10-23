import React from 'react';
import type { usePutawayRouting } from '../hooks/usePutawayRouting';
export type PutawayRoutingState = ReturnType<typeof usePutawayRouting>;

export function PutawayRoutingSuggestions({ routing }: { routing: PutawayRoutingState }) {
    const primary = routing.suggestions[0];
    return <section aria-label="Live putaway routing" className="mt-3 space-y-2 text-left text-xs min-w-0 break-words text-[var(--theme-text-secondary)]">
        {routing.error ? <p role="alert">Could not refresh routing. Scan and verify a suitable bin, or retry.</p> : routing.loading ? <p role="status">Checking current site stock and storage zones…</p> : primary ? <>
            <p className="font-semibold text-[var(--theme-text-primary)]">{primary.label}</p>
            <p>{primary.reason}</p>
            {primary.existingUnits > 0 && <p>{primary.existingUnits} units recorded in this stock snapshot.</p>}
            {routing.suggestions.length > 1 && <p>Alternatives: {routing.suggestions.slice(1, 4).map(s => s.location).join(' · ')}</p>}
        </> : <p>No suitable suggestion. Check storage requirements and ask your warehouse lead for an authorized bin.</p>}
        <div className="flex flex-wrap gap-2">
            {primary && <button type="button" disabled={routing.loading} onClick={() => routing.reportFull(primary.location)} className="min-h-[44px] px-3 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">Bin full — find next</button>}
            <button type="button" disabled={routing.loading} onClick={routing.refresh} className="min-h-[44px] px-3 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-50">Refresh suggestions</button>
        </div>
        <p>{routing.updatedAt > 0 && `Checked ${new Date(routing.updatedAt).toLocaleTimeString()}. `}Full bins are skipped for this job. Scan the physical bin label to confirm placement.</p>
    </section>;
}
