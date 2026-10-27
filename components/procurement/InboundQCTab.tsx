import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Thermometer, Plus, Box, Clock, Check } from 'lucide-react';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import type { InboundQCInspection } from '../../types/procurement-zero-trust';
import { useStore } from '../../contexts/CentralStore';
import { formatDateTime } from '../../utils/formatting';

interface InboundQCTabProps {
  countryCode: string;
}

export const InboundQCTab: React.FC<InboundQCTabProps> = ({ countryCode }) => {
  const { user, showToast } = useStore();
  const isManager = Boolean(user?.role && ['country_commercial_director', 'country_supply_chain_director', 'regional_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'country_operations_director', 'country_managing_director', 'group_ceo'].includes(user.role));

  const [inspections, setInspections] = useState<InboundQCInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availablePOs, setAvailablePOs] = useState<{ id: string; poNumber: string; supplierName: string; siteId?: string }[]>([]);

  const [poNumber, setPoNumber] = useState('');
  const [sampleSize, setSampleSize] = useState(10);
  const [tempCelsius, setTempCelsius] = useState<number | undefined>(3.5);
  const [packaging, setPackaging] = useState<'Passed' | 'Damaged' | 'Compromised'>('Passed');
  const [expiry, setExpiry] = useState<'Passed' | 'Near Expiry' | 'Expired'>('Passed');
  const [discrepancy, setDiscrepancy] = useState(false);
  const [discrepancyDetails, setDiscrepancyDetails] = useState('');
  const [disposition, setDisposition] = useState<'Accepted' | 'Conditionally Accepted' | 'Rejected' | 'Quarantined'>('Accepted');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await procurementGovernanceService.getInboundQCInspections(countryCode);
      setInspections(data);
    } catch {
      // Graceful load
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    loadData();
    purchaseOrdersService.getAll(undefined, 30, 0, { countryCode })
      .then(res => {
        setAvailablePOs((res.data || []).map(p => ({
          id: p.id,
          poNumber: p.poNumber || p.id,
          supplierName: p.supplierName || 'Vendor',
          siteId: p.siteId
        })));
      })
      .catch(() => {});
  }, [loadData, countryCode]);

  const handleCreate = async () => {
    if (!poNumber || !poNumber.trim()) {
      showToast('PO number is required', 'error');
      return;
    }

    const isTempBreach = tempCelsius !== undefined && tempCelsius > 4.0;
    const finalDisposition = isTempBreach || packaging === 'Compromised' || expiry === 'Expired' ? 'Rejected' : disposition;
    const selectedPO = availablePOs.find(p => p.poNumber === poNumber.trim() || p.id === poNumber.trim());

    try {
      await procurementGovernanceService.createInboundQCInspection({
        poId: selectedPO?.id,
        poNumber: poNumber.trim(),
        siteId: selectedPO?.siteId,
        countryCode,
        inspectorId: user?.id || 'QC-01',
        inspectorName: user?.name || 'Inbound QC Inspector',
        inspectorRole: user?.role || 'inbound_qc_inspector',
        inspectionDate: new Date().toISOString(),
        sampleSize: Number(sampleSize) || 10,
        coldChainTempCelsius: tempCelsius,
        tempComplianceStatus: tempCelsius === undefined ? 'Exempt' : isTempBreach ? 'Breach' : 'Compliant',
        packagingIntegrity: packaging,
        expiryCheck: expiry,
        foodSafetyPassed: !isTempBreach && packaging !== 'Compromised',
        discrepancyFound: discrepancy || isTempBreach,
        discrepancyDetails: discrepancyDetails || (isTempBreach ? `Cold chain breach: ${tempCelsius}°C exceeds 4.0°C limit` : undefined),
        disposition: finalDisposition,
        supervisorNotes: `Dock Inspection complete by ${user?.name || 'Inbound QC Inspector'}`
      });
      showToast('Inbound QC inspection logged successfully', 'success');
      setShowAddModal(false);
      setPoNumber('');
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to record QC inspection', 'error');
    }
  };

  const handleSignOffWaiver = async (qc: InboundQCInspection) => {
    const reason = window.prompt("Enter supervisory waiver rationale for this dock variance:", "Authorized conditional acceptance per QA check");
    if (!reason) return;

    try {
      await procurementGovernanceService.signOffQCWaiver({
        inspectionId: qc.id,
        supervisorName: user?.name || user?.email || 'Authorized Manager',
        supervisorRole: user?.role || 'country_commercial_director',
        waiverReason: reason.trim(),
        newDisposition: 'Conditionally Accepted'
      });
      showToast(`Supervisory disposition sign-off recorded for PO ${qc.poNumber}.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to sign off waiver', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                Inbound Dock QC & Food Safety ({countryCode})
              </h2>
              {isManager ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                  <ShieldCheck size={12} />
                  <span>Checker • Disposition Sign-Off</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[11px] font-semibold">
                  <Clock size={12} />
                  <span>Maker • Dock QC Inspector</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
              Dockside receiving inspections enforcing cold-chain temperature limits, packaging integrity, and food safety standards.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={16} strokeWidth={2} /> New Dock Inspection
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-medium text-[var(--theme-text-secondary)] rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)]">
          Loading dock inspections...
        </div>
      ) : inspections.length === 0 ? (
        <div className="p-12 text-center text-[var(--theme-text-secondary)] text-sm font-medium rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
          No inbound QC inspections on file for {countryCode}. Perform dock checklists when receiving trucks arrive.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inspections.map(qc => {
            const isWaived = Boolean(qc.supervisorWaivedBy || qc.disposition === 'Conditionally Accepted');
            const effectiveDisposition = isWaived ? 'Conditionally Accepted' : qc.disposition;
            const hasIssue = qc.discrepancyFound || qc.disposition !== 'Accepted';
            return (
              <div key={qc.id} className="p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm space-y-4 hover:border-[var(--theme-accent)]/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-[var(--theme-text-primary)]">PO {qc.poNumber || 'Inbound Dock'}</h3>
                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5">{formatDateTime(qc.inspectionDate)}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    effectiveDisposition === 'Accepted' || isWaived
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : effectiveDisposition === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {isWaived ? 'Supervisory Waiver Signed' : effectiveDisposition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] flex items-center gap-2.5">
                    <Thermometer size={16} className={qc.tempComplianceStatus === 'Breach' ? 'text-rose-500 shrink-0' : 'text-emerald-500 shrink-0'} />
                    <div>
                      <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Temp</p>
                      <p className="font-bold font-mono text-[var(--theme-text-primary)]">{qc.coldChainTempCelsius !== undefined ? `${qc.coldChainTempCelsius}°C` : 'Dry'}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] flex items-center gap-2.5">
                    <Box size={16} className="text-[var(--theme-text-secondary)] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Packaging</p>
                      <p className="font-bold text-[var(--theme-text-primary)]">{qc.packagingIntegrity}</p>
                    </div>
                  </div>
                </div>

                {qc.discrepancyDetails && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-medium">
                    {qc.discrepancyDetails}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium">
                      Inspector: {qc.inspectorName}
                    </p>
                    {qc.supervisorWaivedAt && qc.supervisorWaivedBy && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                        Waiver signed by {qc.supervisorWaivedBy} on {formatDateTime(qc.supervisorWaivedAt)}
                      </p>
                    )}
                  </div>
                  {isManager && hasIssue && !qc.supervisorWaivedBy && (
                    <button
                      type="button"
                      onClick={() => handleSignOffWaiver(qc)}
                      className="h-8 px-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer shadow-sm shrink-0"
                    >
                      <Check size={13} /> Sign Off Waiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">Record Inbound Dock Inspection</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Purchase Order *</label>
                {availablePOs.length > 0 && (
                  <select
                    value={availablePOs.some(p => p.poNumber === poNumber) ? poNumber : ''}
                    onChange={e => {
                      if (e.target.value) setPoNumber(e.target.value);
                    }}
                    className="w-full h-11 px-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold mb-2 focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                  >
                    <option value="">-- Select Arriving PO --</option>
                    {availablePOs.map(p => (
                      <option key={p.id} value={p.poNumber} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                        {p.poNumber} — {p.supplierName}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Or enter custom PO number (e.g. PO-2026-0042)"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Sample Size</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={e => setSampleSize(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Cold-Chain Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={tempCelsius ?? ''}
                    onChange={e => setTempCelsius(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Packaging Seals</label>
                  <select
                    value={packaging}
                    onChange={e => setPackaging(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                  >
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Passed">Passed (Intact)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Damaged">Damaged (Minor)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Compromised">Compromised (Breach)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Expiry / Batch</label>
                  <select
                    value={expiry}
                    onChange={e => setExpiry(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                  >
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Passed">Passed (Valid)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Near Expiry">Near Expiry (&lt;30d)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Disposition Decision</label>
                <select
                  value={disposition}
                  onChange={e => setDisposition(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                >
                  <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Accepted">Accepted (Dock Clearance)</option>
                  <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Conditionally Accepted">Conditionally Accepted</option>
                  <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Quarantined">Quarantined for Audit</option>
                  <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Rejected">Rejected at Dock</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-11 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/40 text-xs font-semibold text-[var(--theme-text-secondary)] active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 h-11 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs font-semibold active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                Save QC Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
