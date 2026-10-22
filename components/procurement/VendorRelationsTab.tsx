import React, { useState, useEffect, useCallback } from 'react';
import { Award, FileText, Users, Plus, Star, ShieldCheck, Clock, Check } from 'lucide-react';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import type { VendorScorecard, VendorContract, FarmerProgram } from '../../types/procurement-zero-trust';
import { useStore } from '../../contexts/CentralStore';
import { formatDateTime } from '../../utils/formatting';
import { AddVendorContractModal } from './AddVendorContractModal';
import { AddFarmerProgramModal } from './AddFarmerProgramModal';

interface VendorRelationsTabProps {
  countryCode: string;
  suppliers: any[];
}

export const VendorRelationsTab: React.FC<VendorRelationsTabProps> = ({ countryCode, suppliers }) => {
  const { user, showToast } = useStore();
  const isManager = Boolean(user?.role && ['country_commercial_director', 'regional_operations_manager', 'country_operations_director', 'country_managing_director', 'group_ceo'].includes(user.role));

  const [subTab, setSubTab] = useState<'scorecards' | 'contracts' | 'farmers'>('scorecards');
  const [scorecards, setScorecards] = useState<VendorScorecard[]>([]);
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [farmers, setFarmers] = useState<FarmerProgram[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [period, setPeriod] = useState('2026-Q3');
  const [qualityScore, setQualityScore] = useState(95);
  const [deliveryScore, setDeliveryScore] = useState(90);
  const [pricingScore, setPricingScore] = useState(92);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'scorecards') {
        const data = await procurementGovernanceService.getScorecards(countryCode);
        setScorecards(data);
      } else if (subTab === 'contracts') {
        const data = await procurementGovernanceService.getContracts(countryCode);
        setContracts(data);
      } else if (subTab === 'farmers') {
        const data = await procurementGovernanceService.getFarmerPrograms(countryCode);
        setFarmers(data);
      }
    } catch {
      // Graceful load
    } finally {
      setLoading(false);
    }
  }, [countryCode, subTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateScorecard = async () => {
    if (!selectedSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    const overall = (Number(qualityScore) + Number(deliveryScore) + Number(pricingScore)) / 3;
    try {
      await procurementGovernanceService.createScorecard({
        supplierId: selectedSupplierId,
        countryCode,
        evaluationPeriod: period,
        qualityScore: Number(qualityScore),
        deliveryScore: Number(deliveryScore),
        pricingScore: Number(pricingScore),
        complianceScore: 100,
        overallScore: Math.round(overall * 10) / 10,
        evaluatorId: user?.id || 'VRM-01',
        evaluatorName: user?.name || 'Vendor Relations Manager',
        evaluatorRole: user?.role || 'vendor_relations_manager',
        notes
      });
      showToast('Vendor scorecard recorded successfully', 'success');
      setShowAddModal(false);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to save scorecard', 'error');
    }
  };

  const handleAuthorizeContract = async (contract: VendorContract) => {
    try {
      await procurementGovernanceService.authorizeContract({
        contractId: contract.id,
        signedOffBy: user?.name || user?.email || 'Authorized Manager',
        signedOffRole: user?.role || 'country_commercial_director'
      });
      showToast(`Master agreement ${contract.contractNumber} authorized and signed off.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to authorize contract', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
            <Award size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                Vendor Relations & Governance ({countryCode})
              </h2>
              {isManager ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                  <ShieldCheck size={12} />
                  <span>Checker • Agreement Sign-Off</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[11px] font-semibold">
                  <Clock size={12} />
                  <span>Maker • Vendor Sourcing</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
              Supplier scorecards, master agreements, and direct cooperative sourcing programs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Sub-tab pill selector */}
          <div className="flex items-center bg-[var(--theme-bg-subtle)] p-1 rounded-full border border-[var(--theme-border)]">
            {(['scorecards', 'contracts', 'farmers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  subTab === tab
                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                {tab === 'scorecards' ? 'Scorecards' : tab === 'contracts' ? 'Contracts' : 'Farmer Programs'}
              </button>
            ))}
          </div>

          {subTab === 'scorecards' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="h-10 px-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} /> New Scorecard
            </button>
          )}

          {subTab === 'contracts' && (
            <button
              onClick={() => setShowContractModal(true)}
              className="h-10 px-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} /> New Master Contract
            </button>
          )}

          {subTab === 'farmers' && (
            <button
              onClick={() => setShowFarmerModal(true)}
              className="h-10 px-4 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} /> New Farmer Program
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-medium text-[var(--theme-text-secondary)] rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)]">
          Loading vendor data...
        </div>
      ) : subTab === 'scorecards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scorecards.length === 0 ? (
            <div className="col-span-full p-12 text-center text-[var(--theme-text-secondary)] text-sm font-medium rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm">
              No vendor scorecards recorded for {countryCode}. Click "New Scorecard" to evaluate a vendor.
            </div>
          ) : (
            scorecards.map(sc => {
              const sup = suppliers.find(s => s.id === sc.supplierId);
              return (
                <div key={sc.id} className="p-6 rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm space-y-4 hover:border-[var(--theme-accent)]/50 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[var(--theme-text-primary)] text-base tracking-tight">{sup?.name || 'Verified Vendor'}</h3>
                      <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5">Period: {sc.evaluationPeriod}</p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono tabular-nums">
                      <Star size={11} fill="currentColor" /> {sc.overallScore}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                      <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Quality</p>
                      <p className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">{sc.qualityScore}%</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                      <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Delivery</p>
                      <p className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">{sc.deliveryScore}%</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                      <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Pricing</p>
                      <p className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums mt-0.5">{sc.pricingScore}%</p>
                    </div>
                  </div>

                  {sc.notes && (
                    <p className="text-xs text-[var(--theme-text-secondary)] italic bg-[var(--theme-bg-subtle)]/50 p-3 rounded-2xl border border-[var(--theme-border)]">
                      "{sc.notes}"
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium pt-1">
                    Evaluated by {sc.evaluatorName} on {formatDateTime(sc.createdAt)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      ) : subTab === 'contracts' ? (
        <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/30 font-semibold text-xs uppercase tracking-wider text-[var(--theme-text-secondary)]">
            Active Vendor Master Agreements & Terms
          </div>
          <div className="divide-y divide-[var(--theme-border)]">
            {contracts.length === 0 ? (
              <div className="p-12 text-center text-[var(--theme-text-secondary)] text-sm font-medium">
                No active master contracts registered for {countryCode}.
              </div>
            ) : (
              contracts.map(c => {
                const sup = suppliers.find(s => s.id === c.supplierId);
                return (
                  <div key={c.id} className="p-5 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--theme-text-primary)]">{c.title} ({c.contractNumber})</h4>
                      <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{sup?.name || 'Supplier'} • Terms: {c.paymentTerms}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          c.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {c.status}
                        </span>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono font-medium mt-1">Expires: {c.endDate}</p>
                        {c.signedOffBy && c.signedOffAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                            Authorized by {c.signedOffBy}
                          </p>
                        )}
                      </div>
                      {isManager && c.status !== 'Active' && (
                        <button
                          type="button"
                          onClick={() => handleAuthorizeContract(c)}
                          className="h-8 px-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer shrink-0 shadow-sm"
                        >
                          <Check size={13} /> Sign Off
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
              <Users size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--theme-text-primary)]">Direct Farmer & Cooperative Sourcing</h3>
              <p className="text-xs text-[var(--theme-text-secondary)] font-medium">Direct purchase programs supporting smallholders in Ethiopia & Kenya.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {farmers.length === 0 ? (
              <div className="col-span-full p-12 text-center text-[var(--theme-text-secondary)] text-sm font-medium rounded-2xl bg-[var(--theme-bg-subtle)]/40 border border-[var(--theme-border)]">
                No farmer cooperative programs registered for {countryCode}.
              </div>
            ) : (
              farmers.map(f => (
                <div key={f.id} className="p-5 rounded-2xl bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-[var(--theme-text-primary)]">{f.cooperativeName}</h4>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Fair Trade
                    </span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)]">Region: {f.region} • Members: <span className="font-mono tabular-nums font-semibold">{f.memberCount}</span></p>
                  <p className="text-xs font-mono text-[var(--theme-text-primary)]">Crops: {f.primaryCrops.join(', ')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">New Vendor Scorecard</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                >
                  <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Evaluation Period</label>
                <input
                  type="text"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase block mb-1">Quality %</label>
                  <input
                    type="number"
                    value={qualityScore}
                    onChange={e => setQualityScore(Number(e.target.value))}
                    className="w-full h-10 px-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase block mb-1">Delivery %</label>
                  <input
                    type="number"
                    value={deliveryScore}
                    onChange={e => setDeliveryScore(Number(e.target.value))}
                    className="w-full h-10 px-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase block mb-1">Pricing %</label>
                  <input
                    type="number"
                    value={pricingScore}
                    onChange={e => setPricingScore(Number(e.target.value))}
                    className="w-full h-10 px-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">Audit Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Audit summary..."
                  className="w-full p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
                  rows={2}
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
                onClick={handleCreateScorecard}
                className="flex-1 h-11 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs font-semibold active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                Save Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Master Contract Modal */}
      <AddVendorContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onSuccess={loadData}
        countryCode={countryCode}
        suppliers={suppliers}
      />

      {/* New Farmer Cooperative Program Modal */}
      <AddFarmerProgramModal
        isOpen={showFarmerModal}
        onClose={() => setShowFarmerModal(false)}
        onSuccess={loadData}
        countryCode={countryCode}
      />
    </div>
  );
};
