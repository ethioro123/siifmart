import React from 'react';
import {
  Building, Box, Truck, Store, ShoppingCart, Loader2, Save, Lock, MapPin, FileDown
} from 'lucide-react';
import Modal from '../Modal';
import { Site, SiteType } from '../../types';
import { encodeLocation, extractSitePrefix } from '../../utils/locationEncoder';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSite: Partial<Site>;
  setNewSite: React.Dispatch<React.SetStateAction<Partial<Site>>>;
  isSavingSite: boolean;
  logisticsZones: any[];
  testLocation: { zone: string; aisle: string; bay: string };
  setTestLocation: React.Dispatch<React.SetStateAction<{ zone: string; aisle: string; bay: string }>>;
  isGenerating: boolean;
  generateBarcodes: (site: Partial<Site> & { barcodePrefix?: string }) => void;
  handleSaveSite: () => void;
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
  handleSaveSite
}: SiteModalProps) {
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
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                {newSite.type === 'Administration' ? 'Office Name' : 'Location Name'} *
              </label>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                placeholder={
                  newSite.type === 'Administration' ? 'e.g. Central Administration' :
                    newSite.type === 'Warehouse' ? 'e.g. Addis Ababa Central Warehouse' :
                      newSite.type === 'Distribution Center' ? 'e.g. East Africa Distribution Hub' :
                        'e.g. Bole Road Branch'
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
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                placeholder="Full street address..."
                value={newSite.address || ''}
                onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                aria-label="Location Address"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Status</label>
              <select
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                value={newSite.status || 'Active'}
                onChange={(e) => setNewSite({ ...newSite, status: e.target.value as any })}
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
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                value={newSite.logisticsZoneId || ''}
                onChange={(e) => setNewSite({ ...newSite, logisticsZoneId: e.target.value || undefined })}
                aria-label="Logistics Zone"
              >
                <option value="">🌐 Unassigned / Free Zone</option>
                {logisticsZones.map(zone => (
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                    value={newSite.terminalCount || ''}
                    onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                    aria-label="Loading Docks"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs text-cyber-primary uppercase font-bold block">Barcode Configuration</label>
                    <div className="px-2 py-1 rounded bg-cyber-primary/10 border border-cyber-primary/20 text-[10px] text-cyber-primary font-mono">
                      PROTOCOL: 15-DIGIT
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                    <label className="text-[10px] text-cyber-primary uppercase font-bold mb-2 block flex items-center gap-2">
                      <MapPin size={12} /> Test Location Barcode
                    </label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Zone</label>
                        <select
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
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
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                          value={parseInt(testLocation.aisle)}
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
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                          value={parseInt(testLocation.bay)}
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
                      <span className="text-xs font-mono font-bold text-cyber-primary">
                        {(() => {
                          const label = `${testLocation.zone}-${testLocation.aisle.toString().padStart(2, '0')}-${testLocation.bay.toString().padStart(2, '0')}`;
                          const prefix = newSite.barcodePrefix || extractSitePrefix(newSite.code);
                          return encodeLocation(label, prefix);
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-end">
                    <div className="w-1/3">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Validation Prefix (System)</label>
                      <div className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-cyber-primary text-sm font-mono tracking-widest text-center backdrop-blur-sm">
                        {newSite.barcodePrefix || extractSitePrefix(newSite.code)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = newSite.barcodePrefix || extractSitePrefix(newSite.code);
                          generateBarcodes({ ...newSite, barcodePrefix: prefix });
                        }}
                        className="w-full h-[38px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                        Download Location Labels (CSV)
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="uppercase font-bold">Preview:</span>
                    {newSite.code || newSite.barcodePrefix ? (
                      <span className="font-mono text-cyber-primary">
                        {encodeLocation('A-01-01', newSite.barcodePrefix || extractSitePrefix(newSite.code))} (A-01-01)
                      </span>
                    ) : (
                      <span className="italic text-gray-600">Site Code or Prefix required for preview</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Store Manager</label>
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
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
            className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
