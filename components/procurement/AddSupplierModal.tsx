import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { SupplierType } from '../../types';
import { useData } from '../../contexts/DataContext';
import type { SupplierDraft } from '../../services/suppliers.service';

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (supplier: SupplierDraft) => Promise<unknown>;
    countryCode?: string;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onAdd, countryCode }) => {
    const { effectiveCountry } = useData();
    const activeCountry = countryCode || effectiveCountry || 'ET';

    const [newSupName, setNewSupName] = useState('');
    const [newSupContact, setNewSupContact] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [newSupType, setNewSupType] = useState<SupplierType>('Business');
    const [newSupEmail, setNewSupEmail] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [newSupCategory, setNewSupCategory] = useState('');
    const [newSupID, setNewSupID] = useState('');
    const [newSupLocation, setNewSupLocation] = useState('');
    const [newSupBankName, setNewSupBankName] = useState('');
    const [newSupBankAccountNumber, setNewSupBankAccountNumber] = useState('');
    const [newSupBankAccountName, setNewSupBankAccountName] = useState('');

    const handleSubmit = async () => {
        if (!newSupName.trim() || !newSupContact.trim() || saving) {
            setError('Supplier name and contact are required.');
            return;
        }

        setSaving(true);
        setError('');
        try {
        await onAdd({
            name: newSupName,
            type: newSupType,
            contact: newSupContact,
            email: newSupEmail,
            phone: newSupPhone,
            category: newSupCategory,
            taxId: newSupType === 'Business' ? newSupID : undefined,
            nationalId: (newSupType === 'Farmer' || newSupType === 'Individual') ? newSupID : undefined,
            location: newSupLocation,
            countryCode: activeCountry,
            bankName: newSupBankName || undefined,
            bankAccountNumber: newSupBankAccountNumber || undefined,
            bankAccountName: newSupBankAccountName || undefined
        });

        // Reset form
        setNewSupName('');
        setNewSupContact('');
        setNewSupEmail('');
        setNewSupPhone('');
        setNewSupCategory('');
        setNewSupID('');
        setNewSupLocation('');
        setNewSupBankName('');
        setNewSupBankAccountNumber('');
        setNewSupBankAccountName('');
        onClose();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Supplier could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Supplier" size="md">
            <div className="space-y-4">
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Supplier Name *</label>
                    <input
                        type="text"
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                        placeholder="Enter supplier legal business name"
                        value={newSupName}
                        onChange={e => setNewSupName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Contact person *</label>
                    <input type="text" value={newSupContact} onChange={e => setNewSupContact(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)]"
                        placeholder="Supplier contact name" />
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Supplier Type</label>
                    <select
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] transition-all cursor-pointer"
                        value={newSupType}
                        onChange={e => setNewSupType(e.target.value as SupplierType)}
                        title="Select Supplier Type"
                        aria-label="Select Supplier Type"
                    >
                        <option value="Business" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Business / Registered Entity</option>
                        <option value="Individual" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Individual Merchant</option>
                        <option value="Farmer" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Farmer / Cooperative</option>
                        <option value="One-Time" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">One-Time / Spot Vendor</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Email</label>
                        <input
                            type="email"
                            className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                            placeholder="vendor@example.com"
                            value={newSupEmail}
                            onChange={e => setNewSupEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Phone</label>
                        <input
                            type="tel"
                            className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                            placeholder="+251 / +254..."
                            value={newSupPhone}
                            onChange={e => setNewSupPhone(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Category</label>
                    <input
                        type="text"
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                        placeholder="e.g. Produce, Grains, Dairy, Packaging"
                        value={newSupCategory}
                        onChange={e => setNewSupCategory(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Tax ID / TIN / National ID</label>
                    <input
                        type="text"
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                        placeholder="TIN / National ID (Checked for uniqueness)"
                        value={newSupID}
                        onChange={e => setNewSupID(e.target.value)}
                    />
                </div>
                <div className="border-t border-[var(--theme-border)] pt-3">
                    <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Banking & Settlement (Dual-Control)</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase mb-1 block">Bank Name</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
                                placeholder="e.g. CBE, KCB, Equity"
                                value={newSupBankName}
                                onChange={e => setNewSupBankName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase mb-1 block">Account Number</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)]"
                                placeholder="Bank Account #"
                                value={newSupBankAccountNumber}
                                onChange={e => setNewSupBankAccountNumber(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5 block">Location</label>
                    <input
                        type="text"
                        className="w-full h-11 px-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all"
                        placeholder="City, District, Commercial Region"
                        value={newSupLocation}
                        onChange={e => setNewSupLocation(e.target.value)}
                    />
                </div>
                {error && <p role="alert" className="text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">{error}</p>}
                <p className="text-xs text-[var(--theme-text-secondary)]">New suppliers are pending verification by a procurement lead.</p>
                <div className="pt-3 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 h-11 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/40 text-xs font-semibold text-[var(--theme-text-secondary)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 h-11 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                    >
                        {saving ? 'Saving…' : 'Register Supplier'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
