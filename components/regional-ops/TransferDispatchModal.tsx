import React, { useState } from 'react';
import {
  Truck, X, CheckCircle2, ShieldCheck, UserCheck,
  Building2, Navigation, AlertCircle
} from 'lucide-react';
import type { TransferRecord, Employee, Site } from '../../types';

interface TransferDispatchModalProps {
  transfer: TransferRecord;
  regionalEmployees: Employee[];
  regionalSites: Site[];
  onClose: () => void;
  onDispatch: (params: {
    driverType: 'INTERNAL' | 'EXTERNAL';
    driverId?: string;
    driverName: string;
  }) => Promise<void>;
}

export const TransferDispatchModal: React.FC<TransferDispatchModalProps> = ({
  transfer,
  regionalEmployees,
  regionalSites,
  onClose,
  onDispatch
}) => {
  const [driverType, setDriverType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [externalCourierName, setExternalCourierName] = useState<string>('Fargo Courier');
  const [customCourier, setCustomCourier] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter verified drivers from regional workforce
  const verifiedDrivers = regionalEmployees.filter(e => {
    const role = (e.role || '').toLowerCase();
    return role === 'driver' || role === 'fleet_driver' || role === 'logistics_driver';
  });

  const srcSite = regionalSites.find(s => s.id === transfer.sourceSiteId);
  const dstSite = regionalSites.find(s => s.id === transfer.destSiteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalDriverName = '';
    let finalDriverId: string | undefined = undefined;

    if (driverType === 'INTERNAL') {
      if (!selectedDriverId) {
        setError('Please select a verified internal fleet driver for this transfer.');
        return;
      }
      const driver = verifiedDrivers.find(d => d.id === selectedDriverId);
      finalDriverName = driver?.name || 'Internal Fleet Driver';
      finalDriverId = selectedDriverId;
    } else {
      finalDriverName = externalCourierName === 'OTHER' ? customCourier.trim() : externalCourierName;
      if (!finalDriverName) {
        setError('Please enter or select the third-party logistics courier name.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onDispatch({
        driverType,
        driverId: finalDriverId,
        driverName: finalDriverName
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                Dispatch Transfer: {transfer.orderRef || transfer.id.slice(0, 8)}
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                {srcSite?.name || 'Origin'} &rarr; {dstSite?.name || 'Destination'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Carrier Classification */}
          <div>
            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-2">
              Driver Classification & Logistics Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDriverType('INTERNAL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  driverType === 'INTERNAL'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] shadow-sm'
                    : 'border-[var(--theme-border)] hover:border-[var(--theme-border)]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                    Internal Fleet
                  </span>
                  <UserCheck className={`w-4 h-4 ${driverType === 'INTERNAL' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`} />
                </div>
                <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
                  Verified company driver. Requires driver delivery confirmation before store sign-off.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDriverType('EXTERNAL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  driverType === 'EXTERNAL'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-subtle)] shadow-sm'
                    : 'border-[var(--theme-border)] hover:border-[var(--theme-border)]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                    External Courier
                  </span>
                  <Truck className={`w-4 h-4 ${driverType === 'EXTERNAL' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`} />
                </div>
                <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
                  3rd-party logistics. Receiving is unlocked immediately upon dispatch.
                </p>
              </button>
            </div>
          </div>

          {/* Driver Selection based on Type */}
          {driverType === 'INTERNAL' ? (
            <div>
              <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">
                Select Verified Fleet Driver ({verifiedDrivers.length} Available)
              </label>
              {verifiedDrivers.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  No registered drivers found in active region. Please onboard drivers via Regional Workforce or dispatch via External Courier.
                </div>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                >
                  <option value="">-- Choose Assigned Driver --</option>
                  {verifiedDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code || d.role}) {d.siteId ? `• Assigned Site: ${d.siteId}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1">
                Third-Party Courier Partner
              </label>
              <select
                value={externalCourierName}
                onChange={e => setExternalCourierName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              >
                <option value="Fargo Courier">Fargo Courier (Regional Direct)</option>
                <option value="DHL Express">DHL Express Supply Chain</option>
                <option value="Speedaf Logistics">Speedaf Logistics</option>
                <option value="G4S Secure Logistics">G4S Secure Logistics</option>
                <option value="Local Dedicated Boda/Van">Local Dedicated Van / Transporter</option>
                <option value="OTHER">Custom Courier Provider...</option>
              </select>

              {externalCourierName === 'OTHER' && (
                <input
                  type="text"
                  placeholder="Enter courier carrier name..."
                  value={customCourier}
                  onChange={e => setCustomCourier(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] mt-2"
                />
              )}
            </div>
          )}

          {/* Operational Policy Note */}
          <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[var(--theme-text-primary)]">
                Dual-Handshake Protocol:
              </span>{' '}
              {driverType === 'INTERNAL'
                ? 'Internal driver must click "Delivered" on their device upon arrival before destination store receiving unlocks.'
                : 'External carrier transfers unlock receiving immediately at the destination store upon dispatch.'}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--theme-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (driverType === 'INTERNAL' && verifiedDrivers.length === 0)}
              className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{submitting ? 'Dispatching...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
