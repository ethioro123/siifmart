import React from 'react';
import { Percent, DollarSign, Store, CheckCircle } from 'lucide-react';
import { DiscountCode, Site } from '../../../types';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';

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
}

export const DiscountCodeFormModal: React.FC<DiscountCodeFormModalProps> = ({
  isOpen,
  onClose,
  editingCode,
  formData,
  setFormData,
  handleSave,
  activeStore,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Code & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SAVE10"
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white font-mono tracking-wider uppercase focus:border-[#2C5E3B] outline-none transition-all"
            />
            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1">What customers enter at checkout</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Name / Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Member Promo"
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all"
            />
            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1">Descriptive promotional title</p>
          </div>
        </div>

        {/* Type & Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${formData.type === 'PERCENTAGE'
                  ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                  : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400'
                  }`}
              >
                <Percent size={14} />
                Percent
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${formData.type === 'FIXED'
                  ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                  : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400'
                  }`}
              >
                <DollarSign size={14} />
                Fixed
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'PERCENTAGE' ? '10' : '50'}
                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all pr-10 font-bold"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                {formData.type === 'PERCENTAGE' ? '%' : CURRENCY_SYMBOL}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DiscountCode['status'] })}
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold focus:border-[#2C5E3B] outline-none transition-all"
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
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Valid From
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all font-medium"
              title="Valid From"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all font-medium"
              title="Valid Until"
            />
          </div>
        </div>

        {/* Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Min Purchase ({CURRENCY_SYMBOL})
            </label>
            <input
              type="number"
              value={formData.minPurchaseAmount}
              onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
              placeholder="0 (No min)"
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Max Cap ({CURRENCY_SYMBOL})
            </label>
            <input
              type="number"
              value={formData.maxDiscountAmount}
              onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              placeholder="No limit"
              disabled={formData.type === 'FIXED'}
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all disabled:opacity-40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
              className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all"
            />
          </div>
        </div>

        {/* Store Assignment */}
        {activeStore.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
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
                  className={`p-2.5 px-4 rounded-xl border flex items-center gap-2 transition-all text-xs font-bold cursor-pointer ${formData.applicableSites.includes(store.id)
                    ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] text-[#2C5E3B] dark:text-[#A9CBA2]'
                    : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400'
                    }`}
                >
                  <Store size={14} />
                  <span>{store.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1.5">
            Internal Note (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Promotion campaign notes..."
            rows={2}
            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#2C5E3B] hover:opacity-90 text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <CheckCircle size={16} />
            {editingCode ? 'Save Changes' : 'Create Code'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
