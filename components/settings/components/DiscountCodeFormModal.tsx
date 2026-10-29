import React from 'react';
import { Percent, DollarSign, Store, CheckCircle } from 'lucide-react';
import { DiscountCode, Site } from '../../../types';
import Modal from '../../Modal';

interface DiscountCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCode: DiscountCode | null;
  formData: {
    code: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: string;
    minPurchaseAmount: string;
    maxDiscountAmount: string;
    validFrom: string;
    validUntil: string;
    usageLimit: string;
    status: DiscountCode['status'];
    description: string;
    applicableSites: string[];
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    code: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: string;
    minPurchaseAmount: string;
    maxDiscountAmount: string;
    validFrom: string;
    validUntil: string;
    usageLimit: string;
    status: DiscountCode['status'];
    description: string;
    applicableSites: string[];
  }>>;
  handleSave: () => void;
  activeStore: Site[];
  currencySymbol?: string;
}

export const DiscountCodeFormModal: React.FC<DiscountCodeFormModalProps> = ({
  isOpen,
  onClose,
  editingCode,
  formData,
  setFormData,
  handleSave,
  activeStore,
  currencySymbol = 'ETB',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
      size="lg"
    >
      <div className="space-y-5">
        {/* Code & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Code <span className="text-[var(--theme-status-danger-text)]">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SAVE10"
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all placeholder:text-[var(--theme-text-secondary)]/40"
            />
            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">What customers enter at checkout</p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Name / Description <span className="text-[var(--theme-status-danger-text)]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Member Promo"
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all placeholder:text-[var(--theme-text-secondary)]/40"
            />
            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">Descriptive promotional title</p>
          </div>
        </div>

        {/* Type & Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${formData.type === 'PERCENTAGE'
                  ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] dark:border-[var(--theme-accent)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold shadow-xs'
                  : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/40'
                  }`}
              >
                <Percent size={13} />
                Percent
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${formData.type === 'FIXED'
                  ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] dark:border-[var(--theme-accent)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold shadow-xs'
                  : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/40'
                  }`}
              >
                <DollarSign size={13} />
                Fixed
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Value <span className="text-[var(--theme-status-danger-text)]">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'PERCENTAGE' ? '10' : '50'}
                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all pr-10 font-bold"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] font-semibold text-xs">
                {formData.type === 'PERCENTAGE' ? '%' : currencySymbol}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DiscountCode['status'] })}
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
              title="Status"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Valid From
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all font-medium"
              title="Valid From"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all font-medium"
              title="Valid Until"
            />
          </div>
        </div>

        {/* Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Min Purchase ({currencySymbol})
            </label>
            <input
              type="number"
              value={formData.minPurchaseAmount}
              onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
              placeholder="0 (No min)"
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Max Cap ({currencySymbol})
            </label>
            <input
              type="number"
              value={formData.maxDiscountAmount}
              onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              placeholder="No limit"
              disabled={formData.type === 'FIXED'}
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
            />
          </div>
        </div>

        {/* Store Assignment */}
        {activeStore.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
              Applicable Stores (Leave empty for All Stores)
            </label>
            <div className="flex flex-wrap gap-2">
              {activeStore.map(store => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      applicableSites: prev.applicableSites.includes(store.id)
                        ? prev.applicableSites.filter(id => id !== store.id)
                        : [...prev.applicableSites, store.id]
                    }));
                  }}
                  className={`p-2 px-3 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${formData.applicableSites.includes(store.id)
                    ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] dark:border-[var(--theme-accent)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold shadow-xs'
                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/40'
                    }`}
                >
                  <Store size={13} />
                  <span>{store.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">
            Internal Note (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Promotion campaign notes..."
            rows={2}
            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all resize-none placeholder:text-[var(--theme-text-secondary)]/40"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <CheckCircle size={15} />
            {editingCode ? 'Save Changes' : 'Create Code'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
