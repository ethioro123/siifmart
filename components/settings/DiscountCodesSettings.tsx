import React, { useState } from 'react';
import {
  Tag, Plus, Trash2, Edit2, CheckCircle, XCircle,
  Calendar, Copy, Eye, EyeOff, AlertTriangle, Percent, DollarSign,
  Lock, Loader2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { DiscountCode, Site } from '../../types';
import { DiscountCodeFormModal } from './components/DiscountCodeFormModal';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { Country, getCountryProfile } from '../../utils/localization';
import { canSwitchCountry } from '../../utils/permissions';
import { useDiscountCodeMutations } from '../../hooks/useDiscountCodeMutations';
import type { DiscountCodeInput } from '../../schemas/discount-code.schema';

function getSiteCountry(s: Site): string {
  if (s.country) return s.country;
  if (s.currency === 'KES' || s.currency === 'KSh') return 'KE';
  if (s.currency === 'UGX' || s.currency === 'USh') return 'UG';
  if (s.currency === 'RWF') return 'RW';
  if (s.currency === 'TZS' || s.currency === 'TSh') return 'TZ';
  return 'ET';
}

const DiscountCodesSettings: React.FC = () => {
  const { user, showToast } = useStore();
  const { discountCodes, addDiscountCode, updateDiscountCode, deleteDiscountCode, sites, effectiveCountry } = useData();

  const activeCountry = (effectiveCountry || 'ET') as Country;
  const profile = getCountryProfile(activeCountry);
  const currentCurrency = profile.currencySymbol;

  const isHQAdmin = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_finance_director', 'country_operations_director', 'country_commercial_director'].includes(user?.role || '') || canSwitchCountry(user);
  const { createMutation, updateMutation, deleteMutation, isPending } = useDiscountCodeMutations(activeCountry);

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
    if (!isHQAdmin) {
      showToast('Permission denied: Only corporate HQ managers can create discount codes.', 'error');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (code: DiscountCode) => {
    if (!isHQAdmin) {
      showToast('Permission denied: Only corporate HQ managers can edit discount codes.', 'error');
      return;
    }
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

  const handleSave = async () => {
    if (!isHQAdmin) {
      showToast('Permission denied: Only corporate HQ managers can create or modify discount codes.', 'error');
      return;
    }

    if (!formData.code.trim() || !formData.name.trim() || !formData.value) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload: DiscountCodeInput = {
      id: editingCode?.id,
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      type: formData.type,
      value: parseFloat(formData.value),
      country: activeCountry,
      country_code: activeCountry,
      currency: currentCurrency,
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usageCount: editingCode?.usageCount || 0,
      status: formData.status,
      applicableSites: formData.applicableSites.length > 0 ? formData.applicableSites : undefined,
      description: formData.description.trim() || undefined,
      createdBy: editingCode?.createdBy || user?.name || 'HQ Admin',
    };

    try {
      if (editingCode) {
        await updateMutation.mutateAsync({ id: editingCode.id, input: payload });
        updateDiscountCode({ ...payload, id: editingCode.id } as DiscountCode);
      } else {
        await createMutation.mutateAsync(payload);
        addDiscountCode({ ...payload, id: `DC-${Date.now()}` } as DiscountCode);
      }
      setIsModalOpen(false);
      resetForm();
    } catch {
      // Errors handled via mutation onError
    }
  };

  const handleDelete = async (id: string) => {
    if (!isHQAdmin) {
      showToast('Permission denied: Only corporate HQ managers can delete discount codes.', 'error');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      deleteDiscountCode(id);
      setDeleteConfirm(null);
    } catch {
      // Errors handled via mutation onError
    }
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
      case 'Active': return 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)] border-[var(--theme-accent)]/20';
      case 'Expired': return 'bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20';
      case 'Disabled': return 'bg-neutral-500/10 text-neutral-400 dark:text-neutral-500 border-neutral-500/20';
      case 'Scheduled': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();
  const isScheduled = (validFrom: string) => new Date(validFrom) > new Date();

  const getEffectiveStatus = (code: DiscountCode): DiscountCode['status'] => {
    if (code.status === 'Disabled') return 'Disabled';
    if (isExpired(code.validUntil)) return 'Expired';
    if (isScheduled(code.validFrom)) return 'Scheduled';
    return 'Active';
  };

  // Strictly filter store assignment candidates to the active country
  const activeStore = sites.filter(s => s.type === 'Store' && (getSiteCountry(s) === activeCountry));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
              <Tag className="w-4.5 h-4.5" />
            </div>
            Discount & Promotional Codes
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
            Manage authorized promotional codes for POS checkouts and marketing campaigns in {profile.name}.
          </p>
        </div>
        {isHQAdmin ? (
          <button
            onClick={handleOpenCreate}
            disabled={isPending}
            className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Create Code
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-secondary)] font-medium">
            <Lock size={13} />
            <span>HQ Managed</span>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
          <strong className="font-semibold text-[var(--theme-text-primary)]">Zero-Trust Guard:</strong> Create authorized codes here for marketing campaigns.
          Cashiers must enter a valid code at the checkout screen to apply promotional discounts.
          Free-form ad-hoc discounts are strictly blocked to eliminate unauthorized register price reductions.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[var(--theme-bg-card)] rounded-2xl p-4 border border-[var(--theme-border)] shadow-xs">
          <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-semibold tracking-wider mb-1">Total Codes</p>
          <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{discountCodes.length}</p>
        </div>
        <div className="bg-[var(--theme-bg-card)] rounded-2xl p-4 border border-[var(--theme-border)] shadow-xs">
          <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-semibold tracking-wider mb-1">Active</p>
          <p className="text-2xl font-bold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Active').length}
          </p>
        </div>
        <div className="bg-[var(--theme-bg-card)] rounded-2xl p-4 border border-[var(--theme-border)] shadow-xs">
          <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-semibold tracking-wider mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Scheduled').length}
          </p>
        </div>
        <div className="bg-[var(--theme-bg-card)] rounded-2xl p-4 border border-[var(--theme-border)] shadow-xs">
          <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-semibold tracking-wider mb-1">Expired</p>
          <p className="text-2xl font-bold text-neutral-400 dark:text-neutral-500">
            {discountCodes.filter(c => getEffectiveStatus(c) === 'Expired').length}
          </p>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--theme-bg-subtle)] text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider border-b border-[var(--theme-border)]">
          <div className="col-span-3">Code</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Valid Period</div>
          <div className="col-span-1">Usage</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {discountCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 mx-auto text-[var(--theme-text-secondary)] mb-3 opacity-40" />
            <p className="text-[var(--theme-text-primary)] font-semibold text-xs mb-1">No discount codes for this market</p>
            <p className="text-[var(--theme-text-secondary)] text-xs">Create your first national discount code to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-border)]">
            {discountCodes.map((code) => {
              const effectiveStatus = getEffectiveStatus(code);
              const codeCurrency = code.currency || currentCurrency;
              return (
                <div key={code.id} className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                  {/* Code */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-1 rounded-lg font-mono text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold text-xs tracking-wider">
                        {showCode[code.id] ? code.code : '••••••••'}
                      </code>
                      <button
                        onClick={() => toggleShowCode(code.id)}
                        className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                        title={showCode[code.id] ? "Hide Code" : "Show Code"}
                      >
                        {showCode[code.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] dark:hover:text-[var(--theme-accent)] transition-colors cursor-pointer"
                        title="Copy Code"
                        aria-label="Copy code to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 font-medium">{code.name}</p>
                  </div>

                  {/* Type & Value */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      {code.type === 'PERCENTAGE' ? (
                        <Percent className="w-3.5 h-3.5 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                      )}
                      <span className="font-semibold text-xs text-[var(--theme-text-primary)]">
                        {code.type === 'PERCENTAGE' ? `${code.value}%` : formatCompactNumber(code.value, { currency: codeCurrency })}
                      </span>
                    </div>
                    {code.minPurchaseAmount && (
                      <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5 font-medium">
                        Min: {formatCompactNumber(code.minPurchaseAmount, { currency: codeCurrency })}
                      </p>
                    )}
                  </div>

                  {/* Validity */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-primary)] font-medium">
                      <Calendar size={12} className="text-[var(--theme-text-secondary)]" />
                      <span>{formatDateTime(code.validFrom)}</span>
                    </div>
                    <div className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5 pl-4">
                      → {formatDateTime(code.validUntil)}
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="col-span-1">
                    <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{code.usageCount}</span>
                    {code.usageLimit && (
                      <span className="text-[10px] text-[var(--theme-text-secondary)]">/{code.usageLimit}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(effectiveStatus)}`}>
                      {effectiveStatus === 'Active' && <CheckCircle size={12} />}
                      {effectiveStatus === 'Expired' && <XCircle size={12} />}
                      {effectiveStatus === 'Disabled' && <XCircle size={12} />}
                      {effectiveStatus === 'Scheduled' && <Calendar size={12} />}
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {isHQAdmin ? (
                      <>
                        <button
                          onClick={() => handleOpenEdit(code)}
                          disabled={isPending}
                          className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-lg transition-colors cursor-pointer"
                          title="Edit Discount Code"
                        >
                          <Edit2 size={14} />
                        </button>
                        {deleteConfirm === code.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(code.id)}
                              disabled={isPending}
                              className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-0.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] text-[10px] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(code.id)}
                            disabled={isPending}
                            className="p-1.5 text-[var(--theme-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Discount Code"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono">HQ Only</span>
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
        currencySymbol={currentCurrency}
      />
    </div>
  );
};

export default DiscountCodesSettings;
