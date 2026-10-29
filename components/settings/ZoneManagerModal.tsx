import React from 'react';
import { Shield, Loader2, Save, Plus, Edit2, Trash2, Globe } from 'lucide-react';
import Modal from '../Modal';
import { User, SystemConfig, LogisticsZone } from '../../types';
import { logger } from '../../utils/logger';

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemConfig;
  updateSettings: (settings: Partial<SystemConfig>, user: string) => void;
  user: User | null | undefined;
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
  logisticsZones: LogisticsZone[];
  isLoadingZones: boolean;
  editingZone: LogisticsZone | null;
  setEditingZone: (zone: LogisticsZone | null) => void;
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
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Logistics Zones" size="lg">
      <div className="space-y-6">
        <div className="flex items-start justify-between p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
          <div className="space-y-1 pr-4">
            <p className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
              <Shield className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" size={16} /> Enforce Regional Replenishment
            </p>
            <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
              Restrict stock transfer requests to stores and warehouses within the same Logistics Zone. Bypass authorization is reserved for the CEO.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enforceRegionalZoning}
            title="Toggle Regional Replenishment Enforcement"
            onClick={async () => {
              try {
                await updateSettings({ enforceRegionalZoning: !settings.enforceRegionalZoning }, user?.name || 'Admin');
                addNotification('success', 'Regional zoning enforcement status updated');
              } catch (error) {
                logger.error('ZoneManagerModal', 'caught error', error as Error);
                addNotification('alert', 'Failed to update regional zoning enforcement');
              }
            }}
            className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors relative shrink-0 ${
              settings.enforceRegionalZoning ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform transform ${
              settings.enforceRegionalZoning ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4.5 space-y-4 shadow-xs">
          <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            {editingZone ? <Edit2 size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" /> : <Plus size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />}
            <span>{editingZone ? 'Edit Logistics Zone' : 'Create New Logistics Zone'}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1 block">Zone Name *</label>
              <input
                className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 text-[var(--theme-text-primary)] text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]/40 dark:focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                placeholder="e.g. South Hub Zone"
                value={zoneNameInput}
                onChange={(e) => setZoneNameInput(e.target.value)}
                aria-label="Zone Name"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1 block">Description</label>
              <input
                className="w-full h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 text-[var(--theme-text-primary)] text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]/40 dark:focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
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
                type="button"
                onClick={() => {
                  setEditingZone(null);
                  setZoneNameInput('');
                  setZoneDescInput('');
                }}
                className="h-9 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveZone}
              disabled={isZoneSaving || !zoneNameInput.trim()}
              className="h-9 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {isZoneSaving ? <Loader2 size={13} className="animate-spin" /> : editingZone ? <Save size={13} /> : <Plus size={13} />}
              <span>{editingZone ? 'Update Zone' : 'Create Zone'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block">
            Active Logistics Zones ({logisticsZones.length})
          </label>
          {isLoadingZones ? (
            <div className="py-8 flex items-center justify-center gap-2 text-[var(--theme-text-secondary)] text-xs">
              <Loader2 className="animate-spin" size={16} /> Loading zones...
            </div>
          ) : logisticsZones.length === 0 ? (
            <p className="text-xs text-[var(--theme-text-muted)] italic py-4 text-center">No zones configured yet. Create one above.</p>
          ) : (
            <div className="border border-[var(--theme-border)] rounded-2xl overflow-hidden divide-y divide-[var(--theme-border)] max-h-80 overflow-y-auto custom-scrollbar">
              {logisticsZones.map(zone => (
                <div key={zone.id} className="p-3.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[var(--theme-text-primary)] font-semibold text-xs truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] shrink-0" />
                      {zone.name}
                    </h5>
                    {zone.description && (
                      <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 line-clamp-1">{zone.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingZone(zone);
                        setZoneNameInput(zone.name);
                        setZoneDescInput(zone.description || '');
                      }}
                      className="h-8 px-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      title="Edit Zone"
                    >
                      <Edit2 size={11} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="h-8 px-2.5 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-lg text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      title="Delete Zone"
                    >
                      <Trash2 size={11} />
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
