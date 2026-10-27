import React from 'react';
import { Store, MapPin, Grid, Layers, Flame, List, LayoutGrid } from 'lucide-react';
import type { FixtureType } from './types';
import { FIXTURE_DEFINITIONS } from './types';
import type { Site } from '../../../types';

interface PlanogramFixtureSelectorProps {
  stores: Site[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  zone: string;
  onSelectZone: (zone: string) => void;
  aisle: string;
  onSelectAisle: (aisle: string) => void;
  bay: string;
  onSelectBay: (bay: string) => void;
  fixtureType: FixtureType;
  onSelectFixtureType: (type: FixtureType) => void;
  viewMode: 'visual' | 'list';
  onToggleViewMode: (mode: 'visual' | 'list') => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const AISLES = ['Aisle 01', 'Aisle 02', 'Aisle 03', 'Aisle 04'];
const BAYS = ['Bay 01', 'Bay 02', 'Bay 03', 'Bay 04'];

export const PlanogramFixtureSelector: React.FC<PlanogramFixtureSelectorProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  zone,
  onSelectZone,
  aisle,
  onSelectAisle,
  bay,
  onSelectBay,
  fixtureType,
  onSelectFixtureType,
  viewMode,
  onToggleViewMode,
  showHeatmap,
  onToggleHeatmap
}) => {
  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const currentFixture = FIXTURE_DEFINITIONS[fixtureType];

  return (
    <div className="space-y-4">
      {/* Top Bar: Store & Physical Fixture Context */}
      <div className="p-4 sm:p-5 bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
            <Store size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--theme-accent)] uppercase tracking-wider">
                Store Fixture Context
              </span>
              <span className="text-[10px] bg-[var(--theme-border)]/50 text-[var(--theme-text-secondary)] px-2 py-0.5 rounded-md font-mono">
                {currentStore?.code || 'STR'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
              {currentStore?.name || 'Select Store'} • {zone} • {aisle} • {bay}
            </h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">
              {currentFixture.label} — {currentFixture.description}
            </p>
          </div>
        </div>

        {/* View Switcher & Heatmap Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-1">
            <button
              type="button"
              onClick={() => onToggleViewMode('visual')}
              aria-label="Visual shelf rack view"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'visual'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Rack</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              aria-label="Accessible list and table view"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              <List size={13} />
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleHeatmap}
            aria-pressed={showHeatmap}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              showHeatmap
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm'
                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-[var(--theme-border)]'
            }`}
          >
            <Flame size={14} className={showHeatmap ? 'text-amber-500' : 'text-[var(--theme-text-secondary)]'} />
            <span>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Selectors Grid: Store, Zone, Aisle, Bay, Fixture Type */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Store Selector */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="planogram-store-select" className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Store
          </label>
          <select
            id="planogram-store-select"
            value={selectedStoreId}
            onChange={(e) => onSelectStore(e.target.value)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.code})
              </option>
            ))}
          </select>
        </div>

        {/* Zone Selector */}
        <div>
          <label htmlFor="planogram-zone-select" className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Zone
          </label>
          <select
            id="planogram-zone-select"
            value={zone}
            onChange={(e) => onSelectZone(e.target.value)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          >
            {ZONES.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Aisle Selector */}
        <div>
          <label htmlFor="planogram-aisle-select" className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Aisle
          </label>
          <select
            id="planogram-aisle-select"
            value={aisle}
            onChange={(e) => onSelectAisle(e.target.value)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          >
            {AISLES.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Bay Selector */}
        <div>
          <label htmlFor="planogram-bay-select" className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Bay
          </label>
          <select
            id="planogram-bay-select"
            value={bay}
            onChange={(e) => onSelectBay(e.target.value)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          >
            {BAYS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Fixture Type Selector */}
        <div>
          <label htmlFor="planogram-fixture-select" className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Fixture Type
          </label>
          <select
            id="planogram-fixture-select"
            value={fixtureType}
            onChange={(e) => onSelectFixtureType(e.target.value as FixtureType)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          >
            {Object.values(FIXTURE_DEFINITIONS).map(fix => (
              <option key={fix.type} value={fix.type}>
                {fix.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
