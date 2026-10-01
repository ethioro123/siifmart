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
    <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold block">Barcode Configuration</label>
        <div className="px-2 py-1 rounded bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
          PROTOCOL: 15-DIGIT
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
        <label className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold mb-2 block flex items-center gap-2">
          <MapPin size={12} /> Test Location Barcode
        </label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Zone</label>
            <select
              className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-[#2C5E3B]"
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
            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Aisle</label>
            <select
              className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-[#2C5E3B]"
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
            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Bay</label>
            <select
              className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-[#2C5E3B]"
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
        <div className="mt-3 flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
          <span className="text-[10px] text-gray-500 font-mono">
            {testLocation.zone}-{testLocation.aisle.toString().padStart(2, '0')}-{testLocation.bay.toString().padStart(2, '0')}
          </span>
          <span className="text-xs font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
            {(() => {
              const label = `${testLocation.zone}-${testLocation.aisle.toString().padStart(2, '0')}-${testLocation.bay.toString().padStart(2, '0')}`;
              return encodeLocation(label, currentPrefix);
            })()}
          </span>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-1/3">
          <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Validation Prefix (System)</label>
          <div className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[#2C5E3B] dark:text-[#A9CBA2] text-sm font-mono tracking-widest text-center">
            {currentPrefix}
          </div>
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => generateBarcodes({ ...newSite, barcodePrefix: currentPrefix })}
            className="w-full h-[38px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Download Location Labels (CSV)
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5">
        <span className="uppercase font-bold">Preview:</span>
        {newSite.code || newSite.barcodePrefix ? (
          <span className="font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
            {encodeLocation('A-01-01', currentPrefix)} (A-01-01)
          </span>
        ) : (
          <span className="italic text-gray-600">Site Code or Prefix required for preview</span>
        )}
      </div>
    </div>
  );
}
