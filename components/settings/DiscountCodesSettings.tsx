import React, { useState } from 'react';
import {
  Tag, Plus, Trash2, Edit2, CheckCircle, XCircle,
  Calendar, Copy, Eye, EyeOff, AlertTriangle, Percent, DollarSign,
  Store, Loader2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { DiscountCode } from '../../types';
import Modal from '../Modal';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

const DiscountCodesSettings: React.FC = () => {
  const { user } = useStore();
  const { discountCodes, addDiscountCode, updateDiscountCode, deleteDiscountCode, sites, addNotification } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [showCode, setShowCode] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '',
    status: 'Active' as DiscountCode['status'],
    description: '',
    applicableSites: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'PERCENTAGE',
      value: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: '',
      status: 'Active',
      description: '',
      applicableSites: []
    });
    setEditingCode(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      type: code.type,
      value: code.value.toString(),
      minPurchaseAmount: code.minPurchaseAmount?.toString() || '',
      maxDiscountAmount: code.maxDiscountAmount?.toString() || '',
      validFrom: code.validFrom.split('T')[0],
      validUntil: code.validUntil.split('T')[0],
      usageLimit: code.usageLimit?.toString() || '',
      status: code.status,
      description: code.description || '',
      applicableSites: code.applicableSites || []
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.value) {
      addNotification('alert', 'Please fill in all required fields');
      return;
    }

    const codeData: DiscountCode = {
      id: editingCode?.id || `DC-${Date.now()}`,
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      type: formData.type,
      value: parseFloat(formData.value),
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usageCount: editingCode?.usageCount || 0,
      status: formData.status,
      applicableSites: formData.applicableSites.length > 0 ? formData.applicableSites : undefined,
      createdBy: editingCode?.createdBy || user?.name || 'Unknown',
      createdAt: editingCode?.createdAt || new Date().toISOString(),
      description: formData.description.trim() || undefined
    };

    if (editingCode) {
      updateDiscountCode(codeData);
    } else {
      addDiscountCode(codeData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteDiscountCode(id);
    setDeleteConfirm(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addNotification('success', `Code "${code}" copied to clipboard`);
  };

  const toggleShowCode = (id: string) => {
    setShowCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: DiscountCode['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Disabled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Scheduled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();
  const isScheduled = (validFrom: string) => new Date(validFrom) > new Date();

  // Auto-determine status based on dates
  const getEffectiveStatus = (code: DiscountCode): DiscountCode['status'] => {
    if (code.status === 'Disabled') return 'Disabled';
    if (isExpired(code.validUntil)) return 'Expired';
    if (isScheduled(code.validFrom)) return 'Scheduled';
    return 'Active';
  };

  const activeStore = sites.filter(s => s.type === 'Store');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-primary/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-cyber-primary" />
            </div>
            Discount Codes
          </h2>
          <p className="text-gray-400 mt-1">
            Manage discount codes that can be given to customers
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-cyber-primary to-cyan-400 text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-cyber-primary/30 transition-all"
        >
          <Plus size={18} />
          Create Code
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-300/80">
          <strong className="text-blue-300">How it works:</strong> Create discount codes here, then share them with customers.
          Cashiers must enter a valid code to apply any discount at the POS terminal.
          Free-form discounts are not allowed to prevent unauthorized price reductions.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total Codes</p>
          <p className="text-2xl font-bold text-white">{discountCodes.length}</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
          <p className="text-green-400/70 text-xs uppercase font-bold mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Active').length}
          </p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
          <p className="text-yellow-400/70 text-xs uppercase font-bold mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-yellow-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Scheduled').length}
          </p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <p className="text-red-400/70 text-xs uppercase font-bold mb-1">Expired</p>
          <p className="text-2xl font-bold text-red-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Expired').length}
          </p>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">
          <div className="col-span-3">Code</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Valid Period</div>
          <div className="col-span-1">Usage</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {discountCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No discount codes yet</p>
            <p className="text-gray-500 text-sm">Create your first discount code to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {discountCodes.map((code) => {
              const effectiveStatus = getEffectiveStatus(code);
              return (
                <div key={code.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                  {/* Code */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-black/40 px-3 py-1.5 rounded-lg font-mono text-cyber-primary font-bold tracking-wider">
                        {showCode[code.id] ? code.code : '••••••••'}
                      </code>
                      <button
                        onClick={() => toggleShowCode(code.id)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title={showCode[code.id] ? "Hide Code" : "Show Code"}
                      >
                        {showCode[code.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1 text-gray-500 hover:text-cyber-primary transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{code.name}</p>
                  </div>

                  {/* Type & Value */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {code.type === 'PERCENTAGE' ? (
                        <Percent className="w-4 h-4 text-purple-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-bold text-white">
                        {code.type === 'PERCENTAGE' ? `${code.value}%` : formatCompactNumber(code.value, { currency: CURRENCY_SYMBOL })}
                      </span>
                    </div>
                    {code.minPurchaseAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {formatCompactNumber(code.minPurchaseAmount, { currency: CURRENCY_SYMBOL })}
                      </p>
                    )}
                  </div>

                  {/* Validity */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{new Date(code.validFrom).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <span>→ {new Date(code.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="col-span-1">
                    <span className="text-white font-medium">{code.usageCount}</span>
                    {code.usageLimit && (
                      <span className="text-gray-500">/{code.usageLimit}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(effectiveStatus)}`}>
                      {effectiveStatus === 'Active' && <CheckCircle size={12} />}
                      {effectiveStatus === 'Expired' && <XCircle size={12} />}
                      {effectiveStatus === 'Disabled' && <XCircle size={12} />}
                      {effectiveStatus === 'Scheduled' && <Calendar size={12} />}
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(code)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Discount Code"
                    >
                      <Edit2 size={16} />
                    </button>
                    {deleteConfirm === code.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-gray-600 text-white text-xs rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(code.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Discount Code"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
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
              <p className="text-xs text-gray-500 mt-1">This is what customers will enter at checkout</p>
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
              <p className="text-xs text-gray-500 mt-1">Internal name for reference</p>
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
              <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
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
                <p className="text-xs text-gray-500 mt-1">Maximum discount in {CURRENCY_SYMBOL}</p>
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
              <p className="text-xs text-gray-500 mt-1">Total times code can be used</p>
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
              onClick={() => { setIsModalOpen(false); resetForm(); }}
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
    </div>
  );
};

export default DiscountCodesSettings;

