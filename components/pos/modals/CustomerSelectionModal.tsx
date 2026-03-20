import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber, formatDateTime } from '../../../utils/formatting';
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
                <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-primary/50 transition-colors">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500"
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Customer List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                        <button
                            onClick={() => {
                                setSelectedCustomer(null);
                                setIsCustomerModalOpen(false);
                                addNotification('info', 'Customer set to Walk-in');
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between ${!selectedCustomer
                                ? 'bg-cyber-primary/20 border-cyber-primary text-white'
                                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            <div>
                                <p className="font-bold">Walk-in Customer</p>
                                <p className="text-xs opacity-70">Default guest account</p>
                            </div>
                            {!selectedCustomer && <CheckCircle size={16} className="text-cyber-primary" />}
                        </button>

                        {filteredCustomers.map(customer => {
                            const stats = getCustomerStats(customer.id);
                            return (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer)}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedCustomer?.id === customer.id
                                        ? 'bg-cyber-primary/20 border-cyber-primary text-white'
                                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold">{customer.name}</p>
                                            <p className="text-xs opacity-70">{customer.phone} • {customer.email}</p>
                                            <div className="flex gap-3 mt-1 text-[10px]">
                                                <span className="text-cyber-primary">{stats.totalVisits} visits</span>
                                                <span className="text-green-400">{formatCompactNumber(stats.totalSpent, { currency: CURRENCY_SYMBOL })} spent</span>
                                            </div>
                                        </div>
                                        {selectedCustomer?.id === customer.id && <CheckCircle size={16} className="text-cyber-primary" />}
                                    </div>
                                </button>
                            );
                        })}

                        {filteredCustomers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <User size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No customers found</p>
                            </div>
                        )}
                    </div>

                    {/* Customer History Panel */}
                    {selectedCustomer && (
                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <User size={16} className="text-cyber-primary" />
                                Customer Details
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400">Total Visits</p>
                                        <p className="text-xl font-bold text-white">{getCustomerStats(selectedCustomer.id).totalVisits}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <p className="text-xs text-gray-400">Total Spent</p>
                                        <p className="text-xl font-bold text-cyber-primary">{formatCompactNumber(getCustomerStats(selectedCustomer.id).totalSpent, { currency: CURRENCY_SYMBOL })}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Recent Purchases</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {getCustomerHistory(selectedCustomer.id).slice(0, 5).map((sale, idx) => (
                                            <div key={idx} className="bg-white/5 p-2 rounded text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">{formatDateTime(sale.date, { useRelative: true })}</span>
                                                    <span className="text-cyber-primary font-bold">{formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}</span>
                                                </div>
                                                <p className="text-gray-500 text-[10px] mt-1">{sale.items.length} items</p>
                                            </div>
                                        ))}
                                        {getCustomerHistory(selectedCustomer.id).length === 0 && (
                                            <p className="text-gray-500 text-xs italic">No purchase history</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                        onClick={() => setIsCustomerModalOpen(false)}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
