import React, { useState } from 'react';
import {
   Users, Search, Gift, Star, Crown, Phone, Mail, ChevronRight,
   Plus, Filter, Edit2, Save, Trash2, MessageSquare, History, MapPin,
   TrendingUp, DollarSign, FileText
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { Customer } from '../types';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';

export default function Customers() {
   const { customers, addCustomer, updateCustomer, deleteCustomer, addNotification } = useData();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});

   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   // Filter logic with safety check
   const filteredCustomers = (customers || []).filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
   );

   const handleSaveCustomer = () => {
      if (!newCustomer.name || !newCustomer.phone) {
         addNotification('alert', "Name and Phone are required.");
         return;
      }
      const customer: Customer = {
         id: newCustomer.id || `CUST-${Date.now()}`,
         name: newCustomer.name,
         phone: newCustomer.phone,
         email: newCustomer.email || '',
         loyaltyPoints: newCustomer.loyaltyPoints || 0,
         totalSpent: newCustomer.totalSpent || 0,
         lastVisit: newCustomer.lastVisit || new Date().toISOString().split('T')[0],
         tier: newCustomer.tier || 'Bronze',
         notes: newCustomer.notes || ''
      };

      if (newCustomer.id) {
         updateCustomer(customer);
      } else {
         addCustomer(customer);
      }
      setIsAddModalOpen(false);
      setNewCustomer({});
   };

   const handleEditCustomer = (customer: Customer) => {
      setNewCustomer(customer);
      setIsAddModalOpen(true);
   };

   const handleDeleteCustomer = (id: string) => {
      const customer = customers.find(c => c.id === id);
      if (customer) {
         setCustomerToDelete(customer);
         setDeleteInput('');
         setIsDeleteModalOpen(true);
      }
   };

   const handleConfirmDelete = () => {
      if (!customerToDelete) return;

      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      deleteCustomer(customerToDelete.id);
      if (selectedCustomer?.id === customerToDelete.id) setSelectedCustomer(null);

      addNotification('success', `Customer ${customerToDelete.name} deleted.`);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      setDeleteInput('');
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="text-cyber-primary" />
                  Customer Relationship
               </h2>
               <p className="text-gray-400 text-sm">Manage loyalty, view history, and track customer tiers.</p>
            </div>
            <Protected permission="ADD_CUSTOMER">
               <button
                  onClick={() => { setNewCustomer({}); setIsAddModalOpen(true); }}
                  className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center shadow-[0_0_15px_rgba(0,255,157,0.2)]"
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
               </button>
            </Protected>
         </div>

         {/* Search Bar */}
         <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4">
            <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 focus-within:border-cyber-primary/50 transition-colors">
               <Search className="w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredCustomers.map(customer => (
                  <div
                     key={customer.id}
                     onClick={() => setSelectedCustomer(customer)}
                     className={`bg-cyber-gray border rounded-2xl p-5 cursor-pointer transition-all hover:border-cyber-primary/30 group ${selectedCustomer?.id === customer.id ? 'border-cyber-primary bg-cyber-primary/5' : 'border-white/5'}`}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                              {customer.name.charAt(0)}
                           </div>
                           <div>
                              <h3 className="font-bold text-white group-hover:text-cyber-primary transition-colors">{customer.name}</h3>
                              <p className="text-xs text-gray-500">{customer.phone}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${customer.tier === 'Platinum' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                           customer.tier === 'Gold' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                              customer.tier === 'Silver' ? 'text-gray-300 border-gray-500/30 bg-gray-500/10' :
                                 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                           }`}>
                           {customer.tier}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4">
                        <div className="flex flex-col">
                           <span className="text-gray-500 text-xs">Total Spent</span>
                           <span className="text-white font-mono font-bold">{CURRENCY_SYMBOL} {customer.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-gray-500 text-xs">Loyalty Pts</span>
                           <span className="text-cyber-primary font-mono font-bold">{customer.loyaltyPoints}</span>
                        </div>
                     </div>
                  </div>
               ))}
               {filteredCustomers.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                     No customers found.
                  </div>
               )}
            </div>

            {/* Detail Panel */}
            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 h-fit sticky top-6">
               {selectedCustomer ? (
                  <div className="space-y-6 animate-in fade-in">
                     <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary/20 to-blue-500/20 mx-auto flex items-center justify-center border-2 border-white/10 mb-4">
                           <Crown size={40} className={
                              selectedCustomer.tier === 'Platinum' ? 'text-purple-400' :
                                 selectedCustomer.tier === 'Gold' ? 'text-yellow-400' :
                                    selectedCustomer.tier === 'Silver' ? 'text-gray-300' : 'text-orange-400'
                           } />
                        </div>
                        <h3 className="text-2xl font-bold text-white">{selectedCustomer.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">{selectedCustomer.email}</p>
                        <div className="flex justify-center gap-2 mt-4">
                           <button onClick={() => addNotification('info', `Calling ${selectedCustomer.phone}...`)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><Phone size={18} /></button>
                           <button onClick={() => addNotification('info', `Emailing ${selectedCustomer.email}...`)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><Mail size={18} /></button>
                           <ProtectedButton permission="EDIT_CUSTOMER" onClick={() => handleEditCustomer(selectedCustomer)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><Edit2 size={18} /></ProtectedButton>
                           <ProtectedButton permission="DELETE_CUSTOMER" onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={18} /></ProtectedButton>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Gift className="text-pink-400" size={20} />
                              <div>
                                 <p className="text-xs text-gray-400">Loyalty Balance</p>
                                 <p className="font-bold text-white">{selectedCustomer.loyaltyPoints} pts</p>
                              </div>
                           </div>
                           <button className="text-xs text-pink-400 hover:underline">Redeem</button>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <History className="text-blue-400" size={20} />
                              <div>
                                 <p className="text-xs text-gray-400">Last Visit</p>
                                 <p className="font-bold text-white">{selectedCustomer.lastVisit}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2"><FileText size={16} className="text-gray-400" /> Notes</h4>
                        <div className="p-3 bg-black/30 rounded-xl border border-white/5 text-sm text-gray-300 min-h-[80px]">
                           {selectedCustomer.notes || "No notes available."}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                     <Users size={48} className="mb-4 opacity-20" />
                     <p>Select a customer to view details</p>
                  </div>
               )}
            </div>
         </div>

         {/* Add/Edit Modal */}
         <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={newCustomer.id ? "Edit Customer" : "Add New Customer"}>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Full Name</label>
                     <input
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                        value={newCustomer.name || ''}
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Phone Number</label>
                     <input
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                        value={newCustomer.phone || ''}
                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                     />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Email Address</label>
                  <input
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                     value={newCustomer.email || ''}
                     onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Tier</label>
                     <select
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newCustomer.tier || 'Bronze'}
                        onChange={e => setNewCustomer({ ...newCustomer, tier: e.target.value as any })}
                     >
                        <option>Bronze</option>
                        <option>Silver</option>
                        <option>Gold</option>
                        <option>Platinum</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Loyalty Points</label>
                     <input
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newCustomer.loyaltyPoints || 0}
                        onChange={e => setNewCustomer({ ...newCustomer, loyaltyPoints: parseInt(e.target.value) })}
                     />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Notes</label>
                  <textarea
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none h-24 resize-none focus:border-cyber-primary"
                     value={newCustomer.notes || ''}
                     onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  />
               </div>
               <button
                  onClick={handleSaveCustomer}
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-2 hover:bg-cyber-accent transition-colors"
               >
                  Save Customer
               </button>
            </div>
         </Modal>

         {/* Delete Confirmation Modal */}
         <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="p-3 bg-red-500/20 rounded-full">
                     <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Delete Customer?</h3>
                     <p className="text-red-200 text-sm">This action cannot be undone.</p>
                  </div>
               </div>

               <p className="text-gray-300 mb-6">
                  To confirm deletion for <span className="text-white font-bold">{customerToDelete?.name}</span>, please type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
               </p>

               <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  placeholder="Type DELETE to confirm"
               />

               <div className="flex justify-end gap-3">
                  <button
                     onClick={() => setIsDeleteModalOpen(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmDelete}
                     disabled={deleteInput !== 'DELETE'}
                     className={`px-6 py-2 rounded-lg font-bold transition-all ${deleteInput === 'DELETE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                  >
                     Delete Customer
                  </button>
               </div>
            </div>
         </Modal>
      </div>
   );
}
