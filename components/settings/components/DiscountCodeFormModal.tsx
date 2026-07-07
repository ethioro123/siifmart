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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SAVE10"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-wider uppercase focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
            />
            <p className="text-xs text-gray-550 mt-1">This is what customers will enter at checkout</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Sale Discount"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
            />
            <p className="text-xs text-gray-555 mt-1">Internal name for reference</p>
          </div>
        </div>

        {/* Type & Value */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 border ${formData.type === 'PERCENTAGE'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
              >
                <Percent size={16} />
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 border ${formData.type === 'FIXED'
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
              >
                <DollarSign size={16} />
                Fixed Amount
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Value <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'PERCENTAGE' ? '10' : '50'}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {formData.type === 'PERCENTAGE' ? '%' : CURRENCY_SYMBOL}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DiscountCode['status'] })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
              title="Status"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Valid From
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
              title="Valid From"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
              title="Valid Until"
            />
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Min Purchase Amount
            </label>
            <input
              type="number"
              value={formData.minPurchaseAmount}
              onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
              placeholder="Optional"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
            />
            <p className="text-xs text-gray-550 mt-1">Leave empty for no minimum</p>
          </div>
          {formData.type === 'PERCENTAGE' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                Max Discount Cap
              </label>
              <input
                type="number"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                placeholder="Optional"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
              />
              <p className="text-xs text-gray-555 mt-1">Maximum discount in {CURRENCY_SYMBOL}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20"
            />
            <p className="text-xs text-gray-555 mt-1">Total times code can be used</p>
          </div>
        </div>

        {/* Applicable Sites */}
        {activeStore.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Applicable Stores (Leave empty for all)
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${formData.applicableSites.includes(store.id)
                    ? 'bg-cyber-primary/20 border-cyber-primary/50 text-cyber-primary'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  <Store size={14} />
                  <span className="text-sm">{store.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Internal notes about this discount code..."
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-cyber-primary to-cyan-400 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-cyber-primary/30 transition-all"
          >
            <CheckCircle size={18} />
            {editingCode ? 'Save Changes' : 'Create Code'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
