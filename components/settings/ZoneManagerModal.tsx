import React from 'react';
import { Shield, Loader2, Save, Plus, Code, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { User, SystemConfig } from '../../types';

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemConfig;
  updateSettings: (settings: Partial<SystemConfig>, user: string) => void;
  user: User | null | undefined;
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
  logisticsZones: any[];
  isLoadingZones: boolean;
  editingZone: any | null;
  setEditingZone: (zone: any | null) => void;
  zoneNameInput: string;
  setZoneNameInput: (val: string) => void;
  zoneDescInput: string;
  setZoneDescInput: (val: string) => void;
  isZoneSaving: boolean;
  handleSaveZone: () => void;
  handleDeleteZone: (id: string) => void;
}

export function ZoneManagerModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  user,
  addNotification,
  logisticsZones,
  isLoadingZones,
  editingZone,
  setEditingZone,
  zoneNameInput,
  setZoneNameInput,
  zoneDescInput,
  setZoneDescInput,
  isZoneSaving,
  handleSaveZone,
  handleDeleteZone
}: ZoneManagerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🌐 Manage Logistics Zones" size="lg">
      <div className="space-y-6">
        <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
          <div className="space-y-1 pr-4">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="text-cyber-primary" size={16} /> Enforce Regional Replenishment
            </p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Restrict stock transfer requests to stores and warehouses within the same Logistics Zone. Bypass authorization is reserved for the CEO.
            </p>
          </div>
          <div
            onClick={async () => {
              try {
                await updateSettings({ enforceRegionalZoning: !settings.enforceRegionalZoning }, user?.name || 'Admin');
                addNotification('success', 'Regional zoning enforcement status updated');
              } catch (error) {
                console.error(error);
                addNotification('alert', 'Failed to update regional zoning enforcement');
              }
            }}
            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors relative shrink-0 ${
              settings.enforceRegionalZoning ? 'bg-cyber-primary' : 'bg-white/10'
            }`}
          >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${
              settings.enforceRegionalZoning ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </div>

        <div className="bg-cyber-gray border border-white/10 rounded-xl p-4 space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-cyber-primary uppercase tracking-wider">
            {editingZone ? '✏️ Edit Logistics Zone' : '➕ Create New Logistics Zone'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Zone Name *</label>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyber-primary transition-colors text-sm"
                placeholder="e.g. South Hub Zone"
                value={zoneNameInput}
                onChange={(e) => setZoneNameInput(e.target.value)}
                aria-label="Zone Name"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Description</label>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyber-primary transition-colors text-sm"
                placeholder="e.g. Southern region stores and Warehouses"
                value={zoneDescInput}
                onChange={(e) => setZoneDescInput(e.target.value)}
                aria-label="Zone Description"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            {editingZone && (
              <button
                onClick={() => {
                  setEditingZone(null);
                  setZoneNameInput('');
                  setZoneDescInput('');
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Cancel Edit
              </button>
            )}
            <button
              onClick={handleSaveZone}
              disabled={isZoneSaving || !zoneNameInput.trim()}
              className="px-5 py-2 bg-cyber-primary text-black rounded-lg text-xs font-bold hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isZoneSaving ? <Loader2 size={12} className="animate-spin" /> : editingZone ? <Save size={12} /> : <Plus size={12} />}
              {editingZone ? 'Update Zone' : 'Create Zone'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-gray-400 uppercase font-bold block">Active Logistics Zones ({logisticsZones.length})</label>
          {isLoadingZones ? (
            <div className="py-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="animate-spin" size={16} /> Loading zones...
            </div>
          ) : logisticsZones.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">No zones configured yet. Create one above.</p>
          ) : (
            <div className="border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
              {logisticsZones.map(zone => (
                <div key={zone.id} className="p-4 bg-black/10 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] shrink-0" />
                      {zone.name}
                    </h5>
                    {zone.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{zone.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setZoneNameInput(zone.name);
                        setZoneDescInput(zone.description || '');
                      }}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] font-bold transition-colors flex items-center gap-1"
                      title="Edit Zone"
                    >
                      <Code size={10} className="text-cyber-primary" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold transition-colors flex items-center gap-1"
                      title="Delete Zone"
                    >
                      <Trash2 size={10} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
