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
import { DiscountCodeFormModal } from './components/DiscountCodeFormModal';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';

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
                        title="Copy Code"
                        aria-label="Copy code to clipboard"
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
                      <span>{formatDateTime(code.validFrom)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <span>→ {formatDateTime(code.validUntil)}</span>
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
      <DiscountCodeFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        editingCode={editingCode}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        activeStore={activeStore}
      />
    </div>
  );
};

export default DiscountCodesSettings;

