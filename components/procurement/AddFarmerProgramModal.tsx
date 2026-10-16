import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import { useStore } from '../../contexts/CentralStore';

interface AddFarmerProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  countryCode: string;
}

export const AddFarmerProgramModal: React.FC<AddFarmerProgramModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  countryCode
}) => {
  const { user, showToast } = useStore();
  const [programName, setProgramName] = useState('');
  const [cooperativeName, setCooperativeName] = useState('');
  const [region, setRegion] = useState(countryCode === 'ET' ? 'Oromia / Sidama' : 'Rift Valley / Central');
  const [primaryCrops, setPrimaryCrops] = useState('Coffee, Avocado, Pulses');
  const [memberCount, setMemberCount] = useState<number>(120);
  const [leadContact, setLeadContact] = useState('');
  const [phone, setPhone] = useState('');
  const [fairTrade, setFairTrade] = useState(true);
  const [organic, setOrganic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooperativeName.trim()) {
      showToast('Cooperative or producer name is required', 'error');
      return;
    }

    const cropsArray = primaryCrops
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await procurementGovernanceService.createFarmerProgram({
        countryCode,
        programName: programName.trim() || `${cooperativeName.trim()} Direct Sourcing`,
        cooperativeName: cooperativeName.trim(),
        region: region.trim(),
        primaryCrops: cropsArray.length > 0 ? cropsArray : ['Fresh Produce'],
        memberCount: Number(memberCount) || 0,
        leadContact: leadContact.trim() || undefined,
        phone: phone.trim() || undefined,
        fairTradeCertified: fairTrade,
        organicCertified: organic,
        status: 'Active',
        managerName: user?.name || user?.email || 'Vendor Relations Manager'
      });

      showToast(`Farmer cooperative program "${cooperativeName}" registered successfully`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to register farmer program', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
              <Users size={18} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">
              Register Farmer Cooperative Program ({countryCode})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Cooperative / Union Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sidama Farmers Union"
                value={cooperativeName}
                onChange={e => setCooperativeName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Program Title
              </label>
              <input
                type="text"
                placeholder="e.g. Direct Sourcing 2026"
                value={programName}
                onChange={e => setProgramName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Origin Region / District *
              </label>
              <input
                type="text"
                placeholder="e.g. Oromia, Nakuru"
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Participating Farmers Count
              </label>
              <input
                type="number"
                value={memberCount}
                onChange={e => setMemberCount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              Primary Crops (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Coffee, Avocado, Bananas, Maize"
              value={primaryCrops}
              onChange={e => setPrimaryCrops(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Lead Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Bekele Tadesse"
                value={leadContact}
                onChange={e => setLeadContact(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +251 91 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-semibold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fairTrade"
                checked={fairTrade}
                onChange={e => setFairTrade(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--theme-accent)] border-[var(--theme-border)] cursor-pointer"
              />
              <label htmlFor="fairTrade" className="text-xs font-semibold text-[var(--theme-text-primary)] cursor-pointer select-none">
                Fair Trade Certified
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="organic"
                checked={organic}
                onChange={e => setOrganic(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--theme-accent)] border-[var(--theme-border)] cursor-pointer"
              />
              <label htmlFor="organic" className="text-xs font-semibold text-[var(--theme-text-primary)] cursor-pointer select-none">
                Organic Certified
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-full border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Save Cooperative Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
