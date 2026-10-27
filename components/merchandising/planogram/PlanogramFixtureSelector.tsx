import React from 'react';
import type { Site } from '../../../types';
import { FIXTURE_DEFINITIONS, type FixtureType } from './types';

interface Props {
  stores: Site[]; selectedStoreId: string; onSelectStore: (id: string) => void;
  fixtureType: FixtureType; onSelectFixtureType: (type: FixtureType) => void;
  viewMode: 'visual' | 'list'; onToggleViewMode: (mode: 'visual' | 'list') => void;
  showHeatmap: boolean; onToggleHeatmap: () => void;
}

export function PlanogramFixtureSelector(props: Props) {
  return <header className="space-y-4">
    <div><h3 className="text-lg font-semibold">Store shelf planning</h3>
      <p className="text-sm text-[var(--theme-text-secondary)]">Review current shelf positions and propose moves for Operations, Supply Chain and Merchandising approval.</p></div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-48 text-sm">Store
        <select aria-label="Planogram store" value={props.selectedStoreId} onChange={e => props.onSelectStore(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3">
          <option value="">Select a store</option>{props.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select></label>
      <label className="flex-1 min-w-48 text-sm">Placement group
        <select aria-label="Placement group" value={props.fixtureType} onChange={e => props.onSelectFixtureType(e.target.value as FixtureType)} className="mt-1 block min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3">
          {Object.values(FIXTURE_DEFINITIONS).map(fixture => <option key={fixture.type} value={fixture.type}>{fixture.label}</option>)}
        </select></label>
      <div className="flex gap-2" aria-label="Planogram view">
        {(['visual', 'list'] as const).map(mode => <button type="button" key={mode} aria-pressed={props.viewMode === mode} onClick={() => props.onToggleViewMode(mode)} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{mode === 'visual' ? 'Shelves' : 'Product list'}</button>)}
        <button type="button" aria-pressed={props.showHeatmap} onClick={props.onToggleHeatmap} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4">Velocity colors {props.showHeatmap ? 'on' : 'off'}</button>
      </div>
    </div>
  </header>;
}
