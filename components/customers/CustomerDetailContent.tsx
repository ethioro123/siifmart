import React from 'react';
import {
    Crown, Phone, Mail, Edit2, Trash2, Gift, History, FileText
} from 'lucide-react';
import { Customer } from '../../types';
import { ProtectedButton } from '../Protected';

interface CustomerDetailContentProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
}

export const CustomerDetailContent: React.FC<CustomerDetailContentProps> = ({
    customer,
    onEdit,
    onDelete
}) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--theme-bg-subtle)] mx-auto flex items-center justify-center border border-[var(--theme-border)] mb-4">
                    <Crown size={36} className={
                        customer.tier === 'Platinum' ? 'text-[var(--theme-accent)]' :
                            customer.tier === 'Gold' ? 'text-[var(--theme-status-warning-text)]' :
                                customer.tier === 'Silver' ? 'text-[var(--theme-text-muted)]' : 'text-[var(--theme-status-warning-text)]'
                    } />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)]">{customer.name}</h3>
                <p className="text-[var(--theme-text-secondary)] text-sm mt-1">{customer.email || 'No email address'}</p>
                <div className="flex justify-center gap-2 mt-4">
                    <a
                        href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`}
                        className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                        aria-label={`Call ${customer.name}`}
                    >
                        <Phone size={18} />
                    </a>
                    {customer.email && (
                        <a
                            href={`mailto:${encodeURIComponent(customer.email)}`}
                            className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                            aria-label={`Email ${customer.name}`}
                        >
                            <Mail size={18} />
                        </a>
                    )}
                    <ProtectedButton
                        permission="EDIT_CUSTOMER"
                        onClick={() => onEdit(customer)}
                        className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                        aria-label="Edit Customer"
                    >
                        <Edit2 size={18} />
                    </ProtectedButton>
                    <ProtectedButton
                        permission="DELETE_CUSTOMER"
                        onClick={() => onDelete(customer.id)}
                        className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-status-danger)] hover:bg-[var(--theme-status-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)] transition-colors"
                        aria-label="Delete Customer"
                    >
                        <Trash2 size={18} />
                    </ProtectedButton>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="bg-[var(--theme-bg-subtle)] p-3.5 sm:p-4 rounded-xl border border-[var(--theme-border)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Gift className="text-[var(--theme-accent)]" size={20} aria-hidden="true" />
                        <div>
                            <p className="text-xs text-[var(--theme-text-secondary)]">Loyalty balance</p>
                            <p className="font-bold text-[var(--theme-text-primary)] font-mono">{customer.loyaltyPoints} pts</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-subtle)] p-3.5 sm:p-4 rounded-xl border border-[var(--theme-border)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <History className="text-[var(--theme-accent)]" size={20} aria-hidden="true" />
                        <div>
                            <p className="text-xs text-[var(--theme-text-secondary)]">Last visit</p>
                            <p className="font-bold text-[var(--theme-text-primary)] font-mono">{customer.lastVisit}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-[var(--theme-text-primary)] mb-2.5 flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-[var(--theme-text-secondary)]" /> Notes
                </h4>
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-sm text-[var(--theme-text-primary)] min-h-[70px]">
                    {customer.notes || "No notes available."}
                </div>
            </div>
        </div>
    );
};
