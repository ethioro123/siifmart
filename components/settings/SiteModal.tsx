import React from 'react';
import {
  Building, Box, Truck, Store, ShoppingCart, Loader2, Save, Lock, Globe, Hash, Briefcase, Package
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
          <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-3 block">Select Location Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { type: 'Administration', label: 'Administration', desc: 'Central Operations', icon: Building },
              { type: 'Warehouse', label: 'Warehouse', desc: 'Storage & Fulfillment', icon: Box },
              { type: 'Distribution Center', label: 'Distribution', desc: 'Regional Hub', icon: Truck },
              { type: 'Store', label: 'Retail Store', desc: 'Customer-facing', icon: Store },
              { type: 'Dark Store', label: 'Online Store', desc: 'Online Fulfillment', icon: ShoppingCart },
            ].map(({ type, label, desc, icon: Icon }) => {
              const isSelected = newSite.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => !newSite.id && setNewSite({ ...newSite, type: type as SiteType, manager: type === 'Administration' ? undefined : newSite.manager })}
                  disabled={!!newSite.id}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0071E3] dark:border-[#2997FF] bg-[#0071E3]/10 shadow-xs'
                      : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:border-[var(--theme-border-hover)]'
                  } ${!!newSite.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${
                    isSelected ? 'bg-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF]' : 'bg-stone-500/10 text-[var(--theme-text-secondary)]'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <p className="font-semibold text-xs text-[var(--theme-text-primary)]">{label}</p>
                  <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[var(--theme-border)] pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operating Market & Localization */}
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-2.5 flex items-center gap-1.5">
                <Globe size={14} className="text-[#0071E3] dark:text-[#2997FF]" /> Operating Market & Localization *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Facility Country Immutability Notice */}
                {!!newSite.id && (
                  <div className="md:col-span-2 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    <Lock size={14} className="shrink-0" />
                    <span>Operating market is permanently locked for existing facilities. Sovereign borders cannot be altered after creation.</span>
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
                        if (isExisting) return;
                        setNewSite({
                          ...newSite,
                          country: prof.code,
                          currency: prof.currencySymbol,
                          language: prof.supportedLanguages[0]?.code || 'en'
                        });
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isExisting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-[#0071E3] dark:border-[#2997FF] bg-[#0071E3]/10 shadow-xs'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:border-[var(--theme-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF] font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                          {prof.code}
                        </span>
                        <div>
                          <p className="font-semibold text-xs text-[var(--theme-text-primary)]">{prof.name}</p>
                          <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">
                            {prof.currencySymbol} &bull; {prof.taxRate}% VAT &bull; {prof.taxIdLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Country ID & Human-Readable Site ID Sequencing Preview */}
              <div className="mt-3.5 p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                    <Hash size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold">Country ID:</span>
                      <span className="text-xs font-mono font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                        {selectedCountry}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                      {newSite.id ? 'Official human-readable identifier (database keys remain protected)' : 'Auto-assigned next sequential site under this country'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold">Site ID:</span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 shadow-xs">
                    {displaySiteCode}
                  </span>
                  {newSite.id && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold" title="Internal DB ID and Site Code are immutable">
                      <Lock size={11} /> Locked
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">
                {newSite.type === 'Administration' ? 'Office Name' : 'Location Name'} *
              </label>
              <input
                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
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
              <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">
                {newSite.type === 'Administration' ? 'Office Address' : 'Physical Address'} *
              </label>
              <input
                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                placeholder={newSite.country === 'KE' ? "e.g. Waiyaki Way, Westlands, Nairobi" : "e.g. Bole Medhanialem, Addis Ababa"}
                value={newSite.address || ''}
                onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                aria-label="Location Address"
              />
            </div>

            <div>
              <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Status</label>
              <select
                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all"
                value={newSite.status || 'Active'}
                onChange={(e) => setNewSite({ ...newSite, status: e.target.value as Site['status'] })}
                aria-label="Location Status"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Logistics Zone</label>
              <select
                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all"
                value={newSite.logisticsZoneId || ''}
                onChange={(e) => setNewSite({ ...newSite, logisticsZoneId: e.target.value || undefined })}
                aria-label="Logistics Zone"
              >
                <option value="">Unassigned / Free Zone</option>
                {logisticsZones
                  .filter(zone => !zone.country || zone.country === (newSite.country || 'ET'))
                  .map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-[var(--theme-text-muted)] mt-1">
                Configure zones via the 'Manage Zones' button on the main Locations screen.
              </p>
            </div>

            {newSite.type === 'Administration' ? (
              <>
                <div>
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Staff Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50 employees"
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                    value={newSite.capacity || ''}
                    onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Staff Capacity"
                  />
                </div>
              </>
            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
              <>
                <div>
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Warehouse Manager</label>
                  <input
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                    placeholder="Manager name..."
                    value={newSite.manager || ''}
                    onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                    aria-label="Warehouse Manager"
                  />
                </div>
                {newSite.id && (
                  <div>
                    <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Site Code (ID)</label>
                    <div className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 flex items-center text-[var(--theme-text-secondary)] font-mono text-xs">
                      {newSite.code}
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-semibold"><Lock size={11} /> Immutable Identifier</p>
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Storage Capacity (m²)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 5000"
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                    value={newSite.capacity || ''}
                    onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Storage Capacity"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Loading Docks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 4"
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
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
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Store Manager</label>
                  <input
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                    placeholder="Manager name..."
                    value={newSite.manager || ''}
                    onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                    aria-label="Store Manager"
                  />
                </div>
                {newSite.id && (
                  <div>
                    <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">Site Code (ID)</label>
                    <div className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 flex items-center text-[var(--theme-text-secondary)] font-mono text-xs">
                      {newSite.code}
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-semibold"><Lock size={11} /> Immutable Identifier</p>
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 block">POS Terminals</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)]"
                    value={newSite.terminalCount || ''}
                    onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="POS Terminals"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
          <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed flex items-center gap-2">
            {newSite.type === 'Administration' ? (
              <>
                <Briefcase size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <span><strong className="text-[var(--theme-text-primary)]">Administrative locations</strong> are central offices for executive leadership, HR, Finance, and non-operational governance.</span>
              </>
            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
              <>
                <Package size={16} className="text-[#0071E3] dark:text-[#2997FF] shrink-0" />
                <span><strong className="text-[var(--theme-text-primary)]">{newSite.type}s</strong> are inventory storage facilities handling inbound receiving, FEFO putaway, and stock replenishment.</span>
              </>
            ) : newSite.type === 'Dark Store' ? (
              <>
                <ShoppingCart size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span><strong className="text-[var(--theme-text-primary)]">Online Stores</strong> are dark fulfillment hubs reserved exclusively for online dispatch. No walk-in till registers.</span>
              </>
            ) : (
              <>
                <Store size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong className="text-[var(--theme-text-primary)]">Retail Stores</strong> are customer-facing supermarkets and convenience stations equipped with POS cash tills.</span>
              </>
            )}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSite}
            disabled={isSavingSite || !newSite.name || !newSite.type}
            className="flex-1 h-11 bg-[#0071E3] dark:bg-[#2997FF] text-white font-semibold text-xs rounded-xl hover:opacity-95 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isSavingSite ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{newSite.id ? 'Update Location' : 'Create Location'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
