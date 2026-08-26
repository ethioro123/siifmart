import React, { useState } from 'react';
import {
  Tag, Plus, Trash2, Edit2, CheckCircle, XCircle,
  Calendar, Copy, Eye, EyeOff, AlertTriangle, Percent, DollarSign,
  Store, Loader2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { DiscountCode } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { DiscountCodeFormModal } from './components/DiscountCodeFormModal';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';

const DiscountCodesSettings: React.FC = () => {
  const { user, showToast } = useStore();
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
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      showToast('Please fill in all required fields', 'error');
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
      showToast('Discount code updated', 'success');
    } else {
      addDiscountCode(codeData);
      showToast('Discount code created', 'success');
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteDiscountCode(id);
    setDeleteConfirm(null);
    showToast('Discount code deleted', 'success');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Code "${code}" copied to clipboard`, 'success');
  };

  const toggleShowCode = (id: string) => {
    setShowCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: DiscountCode['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30';
      case 'Expired': return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'Disabled': return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-stone-200 dark:border-stone-700';
      case 'Scheduled': return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
      default: return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-stone-200';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1E3F27] dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-[#2C5E3B]/20 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30">
              <Tag className="w-5 h-5 text-[#2C5E3B] dark:text-[#A9CBA2]" />
            </div>
            Discount & Promotional Codes
          </h2>
          <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-1">
            Manage authorized promotional codes for POS checkouts and marketing campaigns.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#2C5E3B] hover:opacity-90 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
        >
          <Plus size={16} />
          Create Code
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5 shrink-0" />
        <div className="text-xs text-[#1E3F27] dark:text-stone-200 leading-relaxed">
          <strong className="font-bold">How it works:</strong> Create authorized codes here, then share them with customers.
          Cashiers must enter a valid code at the checkout screen to apply any promotional discount.
          Free-form ad-hoc discounts are strictly blocked to prevent unauthorized cashier price reductions.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-black/20 rounded-2xl p-4 border border-[#E2DCCE] dark:border-white/10 shadow-sm">
          <p className="text-stone-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Codes</p>
          <p className="text-2xl font-black text-[#1E3F27] dark:text-white">{discountCodes.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-[#2C5E3B]/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-950/30 shadow-sm">
          <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-[10px] uppercase font-bold tracking-wider mb-1">Active</p>
          <p className="text-2xl font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Active').length}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/30 shadow-sm">
          <p className="text-amber-800 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1">Scheduled</p>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Scheduled').length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-4 border border-red-200 dark:border-red-900/30 shadow-sm">
          <p className="text-red-700 dark:text-red-400 text-[10px] uppercase font-bold tracking-wider mb-1">Expired</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Expired').length}
          </p>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 bg-[#FAF8F5] dark:bg-white/5 text-[10px] font-black text-[#4D6E56] dark:text-gray-400 uppercase tracking-wider border-b border-[#E2DCCE]/60 dark:border-white/10">
          <div className="col-span-3">Code</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Valid Period</div>
          <div className="col-span-1">Usage</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {discountCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 mx-auto text-stone-400 dark:text-gray-600 mb-3" />
            <p className="text-stone-600 dark:text-gray-400 font-bold mb-1">No discount codes yet</p>
            <p className="text-stone-400 dark:text-gray-500 text-xs">Create your first discount code to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5">
            {discountCodes.map((code) => {
              const effectiveStatus = getEffectiveStatus(code);
              return (
                <div key={code.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#2C5E3B]/[0.02] transition-colors">
                  {/* Code */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 px-3 py-1 rounded-xl font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-xs tracking-wider">
                        {showCode[code.id] ? code.code : '••••••••'}
                      </code>
                      <button
                        onClick={() => toggleShowCode(code.id)}
                        className="p-1 text-stone-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors cursor-pointer"
                        title={showCode[code.id] ? "Hide Code" : "Show Code"}
                      >
                        {showCode[code.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1 text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors cursor-pointer"
                        title="Copy Code"
                        aria-label="Copy code to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-1 font-medium">{code.name}</p>
                  </div>

                  {/* Type & Value */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      {code.type === 'PERCENTAGE' ? (
                        <Percent className="w-3.5 h-3.5 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                      )}
                      <span className="font-bold text-xs text-[#1E3F27] dark:text-white">
                        {code.type === 'PERCENTAGE' ? `${code.value}%` : formatCompactNumber(code.value, { currency: CURRENCY_SYMBOL })}
                      </span>
                    </div>
                    {code.minPurchaseAmount && (
                      <p className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5 font-medium">
                        Min: {formatCompactNumber(code.minPurchaseAmount, { currency: CURRENCY_SYMBOL })}
                      </p>
                    )}
                  </div>

                  {/* Validity */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-gray-300 font-medium">
                      <Calendar size={12} className="text-stone-400" />
                      <span>{formatDateTime(code.validFrom)}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5 pl-4">
                      → {formatDateTime(code.validUntil)}
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="col-span-1">
                    <span className="text-xs font-bold text-[#1E3F27] dark:text-white">{code.usageCount}</span>
                    {code.usageLimit && (
                      <span className="text-[10px] text-stone-400 dark:text-gray-500">/{code.usageLimit}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(effectiveStatus)}`}>
                      {effectiveStatus === 'Active' && <CheckCircle size={12} />}
                      {effectiveStatus === 'Expired' && <XCircle size={12} />}
                      {effectiveStatus === 'Disabled' && <XCircle size={12} />}
                      {effectiveStatus === 'Scheduled' && <Calendar size={12} />}
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(code)}
                      className="p-1.5 text-stone-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                      title="Edit Discount Code"
                    >
                      <Edit2 size={14} />
                    </button>
                    {deleteConfirm === code.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-lg font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-0.5 bg-stone-500 text-white text-[10px] rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(code.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                        title="Delete Discount Code"
                      >
                        <Trash2 size={14} />
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
