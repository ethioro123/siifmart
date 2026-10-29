import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import { useStore } from '../../contexts/CentralStore';

interface AddVendorContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  countryCode: string;
  suppliers: any[];
}

export const AddVendorContractModal: React.FC<AddVendorContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  countryCode,
  suppliers
}) => {
  const { user, showToast } = useStore();
  const [supplierId, setSupplierId] = useState('');
  const [contractNumber, setContractNumber] = useState(`CTR-${Date.now().toString().slice(-6)}`);
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('Annual Master Agreement');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [agreedMarginPct, setAgreedMarginPct] = useState<number | ''>(15);
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Contract title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await procurementGovernanceService.createContract({
        supplierId,
        countryCode,
        contractNumber: contractNumber.trim(),
        title: title.trim(),
        contractType,
        status: 'Active',
        startDate,
        endDate,
        paymentTerms,
        autoRenew,
        agreedMarginPct: agreedMarginPct ? Number(agreedMarginPct) : undefined,
        notes: notes.trim() || undefined,
        createdBy: user?.name || user?.email || 'Authorized Manager'
      });

      showToast(`Master agreement ${contractNumber} registered successfully`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create vendor contract', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
              <FileText size={18} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)]">
              Register Vendor Master Contract
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
          <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              Supplier Partner *
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
            >
              <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Contract Ref # *
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={e => setContractNumber(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Contract Type
              </label>
              <select
                value={contractType}
                onChange={e => setContractType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
              >
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Annual Master Agreement">Annual Master Agreement</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Preferred Volume Sourcing">Preferred Volume Sourcing</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Exclusive Distribution">Exclusive Distribution</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Direct Cooperative Program">Direct Cooperative Program</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              Agreement Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Master FMCG Supply & Trade Margin Agreement 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full h-11 px-2.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
              >
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Net 30">Net 30</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Net 15">Net 15</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Net 60">Net 60</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Immediate / COD">Immediate / COD</option>
                <option className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]" value="Advance 50/50">Advance 50/50</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-11 px-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-11 px-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                Target Margin (%)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="15"
                value={agreedMarginPct}
                onChange={e => setAgreedMarginPct(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 px-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={e => setAutoRenew(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--theme-accent)] border-[var(--theme-border)] cursor-pointer"
              />
              <label htmlFor="autoRenew" className="text-xs font-medium text-[var(--theme-text-primary)] cursor-pointer select-none">
                Auto-Renew Annually
              </label>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
              Notes & Rebate Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 2% quarterly volume rebate if target threshold exceeded..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {isSubmitting ? 'Registering...' : 'Save Master Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
