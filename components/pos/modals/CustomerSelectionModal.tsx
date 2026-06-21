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
                <div className="flex items-center bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] transition-colors">
                    <Search className="w-5 h-5 text-[#4D6E56] dark:text-[#7A9E83]" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        className="bg-transparent border-none ml-3 flex-1 text-[#1E3F27] dark:text-white outline-none placeholder-stone-400 dark:placeholder-stone-500"
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
                                ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                                : 'bg-white/90 dark:bg-black/25 border-[#E2DCCE] dark:border-white/5 text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#18201B]/40 hover:border-[#2C5E3B]/30'
                                 }`}
                        >
                            <div>
                                <p className="font-bold">Walk-in Customer</p>
                                <p className="text-xs opacity-70">Default guest account</p>
                            </div>
                            {!selectedCustomer && <CheckCircle size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                        </button>

                        {filteredCustomers.map(customer => {
                            const stats = getCustomerStats(customer.id);
                            return (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer)}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedCustomer?.id === customer.id
                                        ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                                        : 'bg-white/90 dark:bg-black/25 border-[#E2DCCE] dark:border-white/5 text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#18201B]/40 hover:border-[#2C5E3B]/30'
                                         }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold">{customer.name}</p>
                                            <p className="text-xs opacity-70">{customer.phone} • {customer.email}</p>
                                            <div className="flex gap-3 mt-1 text-[10px]">
                                                <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">{stats.totalVisits} visits</span>
                                                <span className="text-[#4D6E56] dark:text-gray-400">{formatCompactNumber(stats.totalSpent, { currency: CURRENCY_SYMBOL })} spent</span>
                                            </div>
                                        </div>
                                        {selectedCustomer?.id === customer.id && <CheckCircle size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                                    </div>
                                </button>
                            );
                        })}

                        {filteredCustomers.length === 0 && (
                            <div className="text-center py-8 text-[#4D6E56] dark:text-gray-500">
                                <User size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No customers found</p>
                            </div>
                        )}
                    </div>

                    {/* Customer History Panel */}
                    {selectedCustomer && (
                        <div className="bg-white/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/5 rounded-xl p-4">
                            <h3 className="font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-3 flex items-center gap-2">
                                <User size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                Customer Details
                            </h3>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/90 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 p-3 rounded-lg">
                                        <p className="text-xs text-[#4D6E56] dark:text-gray-400">Total Visits</p>
                                        <p className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{getCustomerStats(selectedCustomer.id).totalVisits}</p>
                                    </div>
                                    <div className="bg-white/90 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 p-3 rounded-lg">
                                        <p className="text-xs text-[#4D6E56] dark:text-gray-400">Total Spent</p>
                                        <p className="text-xl font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{formatCompactNumber(getCustomerStats(selectedCustomer.id).totalSpent, { currency: CURRENCY_SYMBOL })}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-[#4D6E56] dark:text-gray-400 mb-2">Recent Purchases</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {getCustomerHistory(selectedCustomer.id).slice(0, 5).map((sale, idx) => (
                                            <div key={idx} className="bg-white/90 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/5 p-2 rounded text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-stone-700 dark:text-gray-300">{formatDateTime(sale.date, { useRelative: true })}</span>
                                                    <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}</span>
                                                </div>
                                                <p className="text-[#4D6E56] dark:text-gray-500 text-[10px] mt-1">{sale.items.length} items</p>
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

                <div className="pt-4 border-t border-[#E2DCCE] dark:border-white/10 flex justify-end">
                    <button
                        onClick={() => setIsCustomerModalOpen(false)}
                        className="px-6 py-2 bg-white/90 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-white text-stone-500 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
