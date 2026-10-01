import React from 'react';
import {
  Building, Box, Truck, Store, ShoppingCart, Loader2, Save, Lock, Globe, Hash
} from 'lucide-react';
import Modal from '../Modal';
import { Site, SiteType, LogisticsZone } from '../../types';
import { getRegisteredCountries, getCountryProfile, Country } from '../../utils/localization';
import { generateNextSiteCode, formatDisplaySiteId } from '../../utils/siteIdGenerator';
import { SiteBarcodeConfigSection } from './locations/SiteBarcodeConfigSection';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSite: Partial<Site>;
  setNewSite: React.Dispatch<React.SetStateAction<Partial<Site>>>;
  isSavingSite: boolean;
  logisticsZones: LogisticsZone[];
  testLocation: { zone: string; aisle: string; bay: string };
  setTestLocation: React.Dispatch<React.SetStateAction<{ zone: string; aisle: string; bay: string }>>;
  isGenerating: boolean;
  generateBarcodes: (site: Partial<Site> & { barcodePrefix?: string }) => void;
  handleSaveSite: () => void;
  existingSites?: Site[];
}

export function SiteModal({
  isOpen,
  onClose,
  newSite,
  setNewSite,
  isSavingSite,
  logisticsZones,
  testLocation,
  setTestLocation,
  isGenerating,
  generateBarcodes,
  handleSaveSite,
  existingSites = []
}: SiteModalProps) {
  const selectedCountry = (newSite.country || 'ET') as Country;
  const selectedCountryProfile = getCountryProfile(selectedCountry);
  const displaySiteCode = newSite.id
    ? formatDisplaySiteId(newSite)
    : generateNextSiteCode(existingSites, selectedCountry);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={newSite.id ? "Edit Location" : "Add New Location"} size="lg">
      <div className="space-y-6">
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Select Location Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { type: 'Administration', label: 'Administration', desc: 'Central Operations', icon: Building, color: 'purple' },
              { type: 'Warehouse', label: 'Warehouse', desc: 'Storage & Fulfillment', icon: Box, color: 'blue' },
              { type: 'Distribution Center', label: 'Distribution', desc: 'Regional Hub', icon: Truck, color: 'cyan' },
              { type: 'Store', label: 'Retail Store', desc: 'Customer-facing', icon: Store, color: 'green' },
              { type: 'Dark Store', label: 'Online Store', desc: 'Online Fulfillment', icon: ShoppingCart, color: 'orange' },
            ].map(({ type, label, desc, icon: Icon, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => !newSite.id && setNewSite({ ...newSite, type: type as SiteType, manager: type === 'Administration' ? undefined : newSite.manager })}
                disabled={!!newSite.id}
                className={`p-4 rounded-xl border-2 transition-all text-left ${newSite.type === type
                  ? `border-${color}-500 bg-${color}-500/10`
                  : 'border-white/10 bg-black/20 hover:border-white/30'
                  } ${!!newSite.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon size={24} className={`mb-2 ${newSite.type === type ? `text-${color}-400` : 'text-gray-500'}`} />
                <p className={`font-bold text-sm ${newSite.type === type ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                <p className="text-[10px] text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operating Market & Localization */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                <Globe size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Operating Market & Localization *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ── FACILITY COUNTRY IMMUTABILITY ── */}
              {/* Once a facility is created its operating market is permanently locked. */}
              {/* Non-CEO staff cannot alter this even via DevTools — enforced by RLS. */}
              {!!newSite.id && (
                <div className="md:col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <span>🔒</span>
                  <span>Operating market is permanently locked for existing facilities. Country cannot be changed after creation.</span>
                </div>
              )}
              {getRegisteredCountries().map((prof) => {
                  const isSelected = (newSite.country || 'ET') === prof.code;
                  const isExisting = !!newSite.id;
                  return (
                    <button
                      key={prof.code}
                      type="button"
                      disabled={isExisting}
                      onClick={() => {
                        if (isExisting) return; // hard guard — country is immutable
                        setNewSite({
                          ...newSite,
                          country: prof.code,
                          currency: prof.currencySymbol,
                          language: prof.supportedLanguages[0]?.code || 'en'
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isExisting
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-[#2C5E3B] bg-[#2C5E3B]/10 text-white shadow-sm'
                          : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{prof.flag}</span>
                        <div>
                          <p className="font-bold text-xs text-white">{prof.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {prof.currencySymbol} &bull; {prof.taxRate}% VAT &bull; {prof.taxIdLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Country ID & Human-Readable Site ID Sequencing Preview */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-stone-50/80 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                    <Hash size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Country ID:</span>
                      <span className="text-xs font-mono font-black text-stone-900 dark:text-white bg-white/60 dark:bg-white/10 px-1.5 py-0.5 rounded border border-stone-200 dark:border-white/10">
                        {selectedCountryProfile.flag} {selectedCountry}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {newSite.id ? 'Official human-readable identifier (database keys remain protected)' : 'Auto-assigned next sequential site under this country'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Site ID:</span>
                  <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 shadow-xs">
                    {displaySiteCode}
                  </span>
                  {newSite.id && (
                    <span className="text-[9px] text-yellow-500 flex items-center gap-0.5 font-semibold" title="Internal DB ID and Site Code are immutable">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                {newSite.type === 'Administration' ? 'Office Name' : 'Location Name'} *
              </label>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                placeholder={
                  newSite.type === 'Administration' ? (newSite.country === 'KE' ? 'e.g. Nairobi Regional Office' : 'e.g. Central Administration HQ') :
                    newSite.type === 'Warehouse' ? (newSite.country === 'KE' ? 'e.g. Nairobi Central Warehouse' : 'e.g. Addis Ababa Central Warehouse') :
                      newSite.type === 'Distribution Center' ? (newSite.country === 'KE' ? 'e.g. Mombasa Distribution Hub' : 'e.g. East Africa Distribution Hub') :
                        (newSite.country === 'KE' ? 'e.g. Westlands Branch' : 'e.g. Bole Road Branch')
                }
                value={newSite.name || ''}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                aria-label="Location Name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                {newSite.type === 'Administration' ? 'Office Address' : 'Physical Address'} *
              </label>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                placeholder={newSite.country === 'KE' ? "e.g. Waiyaki Way, Westlands, Nairobi" : "e.g. Bole Medhanialem, Addis Ababa"}
                value={newSite.address || ''}
                onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                aria-label="Location Address"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Status</label>
              <select
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                value={newSite.status || 'Active'}
                onChange={(e) => setNewSite({ ...newSite, status: e.target.value as Site['status'] })}
                aria-label="Location Status"
              >
                <option value="Active">🟢 Active</option>
                <option value="Maintenance">🟡 Under Maintenance</option>
                <option value="Closed">🔴 Closed</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Logistics Zone</label>
              <select
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                value={newSite.logisticsZoneId || ''}
                onChange={(e) => setNewSite({ ...newSite, logisticsZoneId: e.target.value || undefined })}
                aria-label="Logistics Zone"
              >
                <option value="">🌐 Unassigned / Free Zone</option>
                {logisticsZones
                  .filter(zone => !zone.country || zone.country === (newSite.country || 'ET'))
                  .map(zone => (
                    <option key={zone.id} value={zone.id}>
                      📍 {zone.name}
                    </option>
                  ))}
              </select>
              <p className="text-[9px] text-gray-500 mt-1">
                Configure zones via the 'Manage Zones' button on the main Locations screen.
              </p>
            </div>

            {newSite.type === 'Administration' ? (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Staff Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50 employees"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    value={newSite.capacity || ''}
                    onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Staff Capacity"
                  />
                </div>
              </>
            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Warehouse Manager</label>
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    placeholder="Manager name..."
                    value={newSite.manager || ''}
                    onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                    aria-label="Warehouse Manager"
                  />
                </div>
                {newSite.id && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                    <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm">
                      {newSite.code}
                    </div>
                    <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Storage Capacity (m²)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 5000"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    value={newSite.capacity || ''}
                    onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Storage Capacity"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Loading Docks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 4"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    value={newSite.terminalCount || ''}
                    onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Loading Docks"
                  />
                </div>

                <SiteBarcodeConfigSection
                  newSite={newSite}
                  testLocation={testLocation}
                  setTestLocation={setTestLocation}
                  isGenerating={isGenerating}
                  generateBarcodes={generateBarcodes}
                />
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Store Manager</label>
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    placeholder="Manager name..."
                    value={newSite.manager || ''}
                    onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                    aria-label="Store Manager"
                  />
                </div>
                {newSite.id && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                    <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm">
                      {newSite.code}
                    </div>
                    <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">POS Terminals</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#2C5E3B] transition-colors"
                    value={newSite.terminalCount || ''}
                    onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="POS Terminals"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${newSite.type === 'Administration' ? 'bg-purple-500/10 border-purple-500/20' :
          newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? 'bg-blue-500/10 border-blue-500/20' :
            'bg-green-500/10 border-green-500/20'
          }`}>
          <p className="text-xs text-gray-400">
            {newSite.type === 'Administration' ? (
              <>💼 <span className="text-purple-400 font-bold">Administrative locations</span> are central offices for management, HR, Finance, and other non-operational departments.</>
            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
              <>📦 <span className="text-blue-400 font-bold">{newSite.type}s</span> are inventory storage facilities that handle receiving, putaway, and fulfillment operations.</>
            ) : newSite.type === 'Dark Store' ? (
              <>🌙 <span className="text-orange-400 font-bold">Online Stores</span> are fulfillment-only locations for online orders. No walk-in customers.</>
            ) : (
              <>🏪 <span className="text-green-400 font-bold">Retail Stores</span> are customer-facing locations with point-of-sale terminals.</>
            )}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSite}
            disabled={isSavingSite || !newSite.name || !newSite.type}
            className="flex-1 py-3 bg-[#2C5E3B] text-white font-bold rounded-xl hover:bg-[#1E3F27] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSavingSite ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {newSite.id ? 'Update Location' : 'Create Location'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
