import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber, formatDateTime, maskPhoneNumber } from '../../../utils/formatting';
import { Search, User, CheckCircle } from 'lucide-react';

export const CustomerSelectionModal: React.FC = () => {
    const {
        isCustomerModalOpen,
        setIsCustomerModalOpen,
        customerSearchTerm,
        setCustomerSearchTerm,
        selectedCustomer,
        setSelectedCustomer,
        filteredCustomers,
        handleSelectCustomer,
        getCustomerStats,
        getCustomerHistory,
    } = usePOS();

    const { addNotification } = useData();

    return (
        <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Select Customer" size="lg">
            <div className="space-y-4">
                <div className="flex items-center bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl px-4 py-3 focus-within:border-[var(--theme-border-strong)] transition-colors">
                    <Search className="w-5 h-5 text-[var(--theme-text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        className="bg-transparent border-none ml-3 flex-1 text-[var(--theme-text-primary)] outline-none placeholder-[var(--theme-text-muted)] text-sm"
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Customer List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCustomer(null);
                                setIsCustomerModalOpen(false);
                                addNotification('info', 'Customer set to Walk-in');
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] ${!selectedCustomer
                                ? 'bg-[var(--theme-bg-card)] border-[var(--theme-border-strong)] text-[var(--theme-text-primary)] ring-1 ring-[var(--theme-border-strong)]'
                                : 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-panel-hover)]'
                            }`}
                        >
                            <div>
                                <p className="font-bold text-[var(--theme-text-primary)]">Walk-in Customer</p>
                                <p className="text-xs text-[var(--theme-text-muted)]">Default guest account</p>
                            </div>
                            {!selectedCustomer && <CheckCircle size={16} className="text-emerald-500" />}
                        </button>

                        {filteredCustomers.map(customer => {
                            const stats = getCustomerStats(customer.id);
                            const isSelected = selectedCustomer?.id === customer.id;
                            return (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelectCustomer(customer)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${isSelected
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-border-strong)] text-[var(--theme-text-primary)] ring-1 ring-[var(--theme-border-strong)]'
                                        : 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-panel-hover)]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold text-[var(--theme-text-primary)]">{customer.name}</p>
                                            <p className="text-xs text-[var(--theme-text-secondary)] font-mono">{maskPhoneNumber(customer.phone)} • {customer.email}</p>
                                            <div className="flex gap-3 mt-1 text-xs font-medium">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.totalVisits} visits</span>
                                                <span className="text-[var(--theme-text-secondary)]">{formatCompactNumber(stats.totalSpent, { currency: CURRENCY_SYMBOL })} spent</span>
                                            </div>
                                        </div>
                                        {isSelected && <CheckCircle size={16} className="text-emerald-500" />}
                                    </div>
                                </button>
                            );
                        })}

                        {filteredCustomers.length === 0 && (
                            <div className="text-center py-8 text-[var(--theme-text-muted)] font-medium">
                                <User size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No customers found</p>
                            </div>
                        )}
                    </div>

                    {/* Customer History Panel */}
                    {selectedCustomer && (
                        <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl p-4">
                            <h3 className="font-bold text-[var(--theme-text-primary)] mb-3 flex items-center gap-2">
                                <User size={16} className="text-[var(--theme-text-secondary)]" />
                                Customer Details
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">Store Visits</p>
                                        <p className="text-xl font-bold text-[var(--theme-text-primary)]">{getCustomerStats(selectedCustomer.id).totalVisits}</p>
                                    </div>
                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">Store Spent</p>
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCompactNumber(getCustomerStats(selectedCustomer.id).totalSpent, { currency: CURRENCY_SYMBOL })}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium mb-2">Recent Store Purchases</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {getCustomerHistory(selectedCustomer.id).slice(0, 5).map((sale, idx) => (
                                            <div key={idx} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-2.5 rounded-lg text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[var(--theme-text-secondary)] font-medium">{formatDateTime(sale.date, { useRelative: true })}</span>
                                                    <span className="text-[var(--theme-text-primary)] font-bold">{formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}</span>
                                                </div>
                                                <p className="text-[var(--theme-text-secondary)] text-xs mt-1 font-medium">{sale.items.length} items</p>
                                            </div>
                                        ))}
                                        {getCustomerHistory(selectedCustomer.id).length === 0 && (
                                            <p className="text-[var(--theme-text-muted)] text-xs italic">No purchase history at this store</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(false)}
                        className="px-6 py-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-primary)] rounded-xl transition-all font-bold text-sm cursor-pointer active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
