import React, { useState, useEffect, useCallback } from 'react';
import { Anchor, CheckCircle2, Clock, Plus, Ship, ShieldCheck, Check } from 'lucide-react';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import type { CustomsDeclaration } from '../../types/procurement-zero-trust';
import { useStore } from '../../contexts/CentralStore';
import { formatDateTime } from '../../utils/formatting';

interface CustomsImportTabProps {
  countryCode: string;
}

export const CustomsImportTab: React.FC<CustomsImportTabProps> = ({ countryCode }) => {
  const { user, showToast } = useStore();
  const isManager = Boolean(user?.role && ['country_commercial_director', 'country_supply_chain_director', 'regional_operations_manager', 'country_operations_director', 'country_managing_director', 'group_ceo'].includes(user.role));

  const [declarations, setDeclarations] = useState<CustomsDeclaration[]>([]);
  const [clearedDeclarationIds, setClearedDeclarationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [declNum, setDeclNum] = useState('');
  const [port, setPort] = useState(countryCode === 'ET' ? 'Port of Djibouti' : 'Port of Mombasa');
  const [carrier, setCarrier] = useState('');
  const [bl, setBl] = useState('');
  const [lc, setLc] = useState('');
  const [agent, setAgent] = useState('');
  const [duty, setDuty] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await procurementGovernanceService.getCustomsDeclarations(countryCode);
      setDeclarations(data);
    } catch {
      // Graceful load
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!declNum || !declNum.trim()) {
      showToast('Declaration number is required', 'error');
      return;
    }
    try {
      await procurementGovernanceService.createCustomsDeclaration({
        declarationNumber: declNum.trim(),
        countryCode,
        portOfEntry: port,
        transportMode: 'Sea / Maritime',
        carrierName: carrier,
        billOfLading: bl,
        letterOfCreditRef: lc,
        clearingAgent: agent,
        customsStatus: 'Submitted',
        dutyAmount: Number(duty) || 0,
        currency: countryCode === 'ET' ? 'ETB' : 'KSh',
        specialistId: user?.id || 'CIS-01',
        specialistName: user?.name || 'Customs Import Specialist'
      });
      showToast('Customs declaration registered successfully', 'success');
      setShowAddModal(false);
      setDeclNum('');
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to register declaration', 'error');
    }
  };

  const handleAuthorizeRelease = async (declaration: CustomsDeclaration) => {
    try {
      await procurementGovernanceService.authorizeCustomsRelease({
        declarationId: declaration.id,
        clearedBy: user?.name || user?.email || 'Authorized Manager',
        clearedByRole: user?.role || 'country_commercial_director'
      });
      showToast(`Customs clearance for declaration ${declaration.declarationNumber} authorized and released.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to authorize release', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
            <Anchor size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                Cross-Border Freight & Customs Clearance ({countryCode})
              </h2>
              {isManager ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)] text-[11px] font-semibold">
                  <ShieldCheck size={12} />
                  <span>Checker • Release Sign-Off</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 text-[11px] font-semibold">
                  <Clock size={12} />
                  <span>Maker • Customs Specialist</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
              Port of Djibouti / Mombasa clearances, Letters of Credit (LC), and customs duty assessment.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={16} strokeWidth={2} /> New Customs Entry
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-medium text-[var(--theme-text-secondary)] rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)]">
          Loading customs entries...
        </div>
      ) : declarations.length === 0 ? (
        <div className="p-12 text-center text-[var(--theme-text-secondary)] text-sm font-medium rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
          No import clearance declarations on file for {countryCode}. Register freight shipments to track customs releases.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {declarations.map(d => {
            const isCleared = d.customsStatus === 'Cleared';
            return (
              <div key={d.id} className="p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm space-y-4 hover:border-[var(--theme-accent)]/50 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)]">{d.declarationNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isCleared
                          ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                          : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                      }`}>
                        {isCleared ? 'Cleared & Released' : d.customsStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-1 flex items-center gap-1.5">
                      <Ship size={14} className="text-[var(--theme-accent)] shrink-0" /> {d.portOfEntry} • {d.transportMode}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Assessed Duty</p>
                    <p className="text-sm font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{d.currency} {d.dutyAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] p-3.5 rounded-2xl font-mono">
                  <div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase block">Bill of Lading:</span>
                    <span className="font-semibold text-[var(--theme-text-primary)] truncate block">{d.billOfLading || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase block">Letter of Credit (LC):</span>
                    <span className="font-semibold text-[var(--theme-text-primary)] truncate block">{d.letterOfCreditRef || 'Direct Transfer'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase block">Clearing Agent:</span>
                    <span className="font-semibold text-[var(--theme-text-primary)] truncate block">{d.clearingAgent || 'In-House'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase block">Carrier / Line:</span>
                    <span className="font-semibold text-[var(--theme-text-primary)] truncate block">{d.carrierName || 'Maersk'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium">
                      Filed by {d.specialistName || 'Customs Specialist'} on {formatDateTime(d.createdAt)}
                    </p>
                    {d.clearedAt && d.clearedBy && (
                      <p className="text-[10px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono font-semibold">
                        Released by {d.clearedBy} on {formatDateTime(d.clearedAt)}
                      </p>
                    )}
                  </div>
                  {isManager && !isCleared && (
                    <button
                      type="button"
                      onClick={() => handleAuthorizeRelease(d)}
                      className="h-8 px-3 rounded-full bg-[var(--theme-accent)] hover:bg-[#0077ED] text-[var(--theme-text-primary)] font-semibold text-xs transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer shadow-sm shrink-0"
                    >
                      <Check size={13} /> Authorize Release
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">Register Customs Declaration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Declaration / Customs Ref *</label>
                <input
                  type="text"
                  placeholder="e.g. CD-2026-DJ0941"
                  value={declNum}
                  onChange={e => setDeclNum(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Port of Entry</label>
                  <select
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    className="w-full h-11 px-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                  >
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Port of Djibouti">Port of Djibouti</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Port of Mombasa">Port of Mombasa</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Bole Cargo Terminal">Bole Cargo Terminal (Air)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="JKIA Cargo Hub">JKIA Cargo Hub (Air)</option>
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Moyale Border Crossing">Moyale Border Crossing (Road)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Duty Amount</label>
                  <input
                    type="number"
                    value={duty}
                    onChange={e => setDuty(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Bill of Lading #</label>
                  <input
                    type="text"
                    placeholder="BL-99482"
                    value={bl}
                    onChange={e => setBl(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-mono font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Letter of Credit (LC)</label>
                  <input
                    type="text"
                    placeholder="LC-CBE-2026"
                    value={lc}
                    onChange={e => setLc(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-mono font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Clearing Agent / Broker</label>
                <input
                  type="text"
                  placeholder="e.g. Bollore Logistics / DHL Global Forwarding"
                  value={agent}
                  onChange={e => setAgent(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
                />
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
                Submit Declaration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
