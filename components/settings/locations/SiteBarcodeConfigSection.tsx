import React from 'react';
import { MapPin, FileDown, Loader2 } from 'lucide-react';
import { Site } from '../../../types';
import { encodeLocation, extractSitePrefix } from '../../../utils/locationEncoder';

interface SiteBarcodeConfigSectionProps {
  newSite: Partial<Site>;
  testLocation: { zone: string; aisle: string; bay: string };
  setTestLocation: React.Dispatch<React.SetStateAction<{ zone: string; aisle: string; bay: string }>>;
  isGenerating: boolean;
  generateBarcodes: (site: Partial<Site> & { barcodePrefix?: string }) => void;
}

export function SiteBarcodeConfigSection({
  newSite,
  testLocation,
  setTestLocation,
  isGenerating,
  generateBarcodes
}: SiteBarcodeConfigSectionProps) {
  const currentPrefix = newSite.barcodePrefix || extractSitePrefix(newSite.code);

  return (
    <div className="md:col-span-2 pt-4 border-t border-[var(--theme-border)] mt-2">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block">Barcode Configuration</label>
        <div className="px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] font-mono font-semibold">
          PROTOCOL: 15-DIGIT
        </div>
      </div>

      <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 mb-4">
        <label className="text-[11px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider mb-2.5 block flex items-center gap-1.5">
          <MapPin size={13} className="text-[var(--theme-text-muted)]" /> Test Location Barcode
        </label>
        <div className="flex gap-2.5 items-end">
          <div className="flex-1">
            <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Zone</label>
            <select
              className="w-full h-9 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg px-2.5 text-[var(--theme-text-primary)] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40"
              value={testLocation.zone}
              onChange={(e) => setTestLocation({ ...testLocation, zone: e.target.value })}
              aria-label="Test Zone"
            >
              {Array.from({ length: newSite.zoneCount || 10 }, (_, i) => String.fromCharCode(65 + i)).map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Aisle</label>
            <select
              className="w-full h-9 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg px-2.5 text-[var(--theme-text-primary)] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40"
              value={parseInt(testLocation.aisle, 10)}
              onChange={(e) => setTestLocation({ ...testLocation, aisle: e.target.value.padStart(2, '0') })}
              aria-label="Test Aisle"
            >
              {Array.from({ length: newSite.aisleCount || 20 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Bay</label>
            <select
              className="w-full h-9 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg px-2.5 text-[var(--theme-text-primary)] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40"
              value={parseInt(testLocation.bay, 10)}
              onChange={(e) => setTestLocation({ ...testLocation, bay: e.target.value.padStart(2, '0') })}
              aria-label="Test Bay"
            >
              {Array.from({ length: newSite.bayCount || 20 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between bg-[var(--theme-bg-card)] p-2.5 rounded-lg border border-[var(--theme-border)]">
          <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
            {testLocation.zone}-{testLocation.aisle.toString().padStart(2, '0')}-{testLocation.bay.toString().padStart(2, '0')}
          </span>
          <span className="text-xs font-mono font-semibold text-[#0071E3] dark:text-[#2997FF]">
            {(() => {
              const label = `${testLocation.zone}-${testLocation.aisle.toString().padStart(2, '0')}-${testLocation.bay.toString().padStart(2, '0')}`;
              return encodeLocation(label, currentPrefix);
            })()}
          </span>
        </div>
      </div>

      <div className="flex gap-3 items-end">
        <div className="w-1/3">
          <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Prefix (System)</label>
          <div className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-[var(--theme-text-primary)] text-sm font-mono font-semibold tracking-widest text-center flex items-center justify-center">
            {currentPrefix}
          </div>
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => generateBarcodes({ ...newSite, barcodePrefix: currentPrefix })}
            className="w-full h-10 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Download Location Labels (CSV)
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] p-2.5 rounded-xl border border-[var(--theme-border)]">
        <span className="uppercase font-semibold">Preview:</span>
        {newSite.code || newSite.barcodePrefix ? (
          <span className="font-mono text-[var(--theme-text-primary)] font-medium">
            {encodeLocation('A-01-01', currentPrefix)} (A-01-01)
          </span>
        ) : (
          <span className="italic text-[var(--theme-text-muted)]">Site Code or Prefix required for preview</span>
        )}
      </div>
    </div>
  );
}
