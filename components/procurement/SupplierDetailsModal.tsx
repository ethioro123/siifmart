import React from 'react';
import Modal from '../../components/Modal';
import { Supplier } from '../../types';
import { Star, Phone, Mail, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

interface SupplierDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ isOpen, onClose, supplier }) => {
    const { showToast } = useStore();

    if (!supplier) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Supplier Details: ${supplier.name || ''}`} size="lg">
            <div className="space-y-6">
                {/* Status & Overview */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                    <div className="flex-1">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider">Category</p>
                        <p className="text-[var(--theme-text-primary)] font-bold text-sm mt-0.5">{supplier.category || 'General'}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider">Type</p>
                        <p className="text-[var(--theme-text-primary)] font-bold text-sm mt-0.5">{supplier.type}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider">Status</p>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mt-0.5 ${
                            supplier.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {supplier.status}
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-center">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider mb-1">Performance</p>
                        <div className="flex items-center justify-center gap-1 text-amber-500 font-bold font-mono tabular-nums text-sm">
                            <Star size={13} fill="currentColor" /> {supplier.rating}
                        </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-center">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider mb-1">Lead Time</p>
                        <p className="text-[var(--theme-text-primary)] font-bold font-mono tabular-nums text-sm">{supplier.leadTime} Days</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-center">
                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider mb-1">Payment Terms</p>
                        <p className="text-[var(--theme-text-primary)] font-bold font-mono text-sm">{supplier.paymentTerms || 'Net 30'}</p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Contact Information</h3>

                    {supplier.phone && (
                        <button
                            onClick={() => {
                                window.location.href = `tel:${supplier.phone}`;
                                showToast(`Calling ${supplier.name}...`, 'info');
                            }}
                            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/40 border border-[var(--theme-border)] transition-all cursor-pointer group active:scale-[0.99]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] group-hover:scale-105 transition-transform shrink-0">
                                <Phone size={17} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-[var(--theme-text-primary)] font-semibold text-xs">Call Phone</p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-mono">{supplier.phone}</p>
                            </div>
                            <ExternalLink size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-colors" />
                        </button>
                    )}

                    {supplier.email && (
                        <button
                            onClick={() => {
                                window.location.href = `mailto:${supplier.email}?subject=Inquiry&body=Hello...`;
                                showToast(`Opening email...`, 'info');
                            }}
                            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/40 border border-[var(--theme-border)] transition-all cursor-pointer group active:scale-[0.99]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] group-hover:scale-105 transition-transform shrink-0">
                                <Mail size={17} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-[var(--theme-text-primary)] font-semibold text-xs">Send Email</p>
                                <p className="text-xs text-[var(--theme-text-secondary)] truncate">{supplier.email}</p>
                            </div>
                            <ExternalLink size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-colors" />
                        </button>
                    )}

                    {supplier.location && (
                        <div className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
                                <MapPin size={17} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-[var(--theme-text-primary)] font-semibold text-xs">Location</p>
                                <p className="text-xs text-[var(--theme-text-secondary)]">{supplier.location}</p>
                            </div>
                        </div>
                    )}

                    {!supplier.phone && !supplier.email && !supplier.location && (
                        <div className="text-center py-8 text-[var(--theme-text-muted)]">
                            <AlertCircle size={28} className="mx-auto mb-2 opacity-40 text-[var(--theme-text-secondary)]" />
                            <p className="text-xs font-medium">No contact details on record</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
