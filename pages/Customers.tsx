import React, { useState } from 'react';
import {
   Users, Search, Gift, Star, Crown, Phone, Mail, ChevronRight,
   Plus, Filter, Edit2, Save, Trash2, MessageSquare, History, MapPin,
   TrendingUp, DollarSign, FileText, Loader2
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { Customer } from '../types';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';
import { logger } from '../utils/logger';
import { RegionalScopeBanner } from '../components/regional-ops/RegionalScopeBanner';

export default function Customers() {
   const { customers, addCustomer, updateCustomer, deleteCustomer, addNotification } = useData();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});

   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
   const [deleteInput, setDeleteInput] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

   // Filter logic with safety check
   const filteredCustomers = (customers || []).filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
   );

   const handleSaveCustomer = async () => {
      if (!newCustomer.name || !newCustomer.phone) {
         addNotification('alert', "Name and Phone are required.");
         return;
      }

      setIsSubmitting(true);
      try {
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
            await updateCustomer(customer.id, customer);
            addNotification('success', `Customer ${customer.name} updated.`);
         } else {
            await addCustomer(customer);
            addNotification('success', `Customer ${customer.name} added.`);
         }
         setIsAddModalOpen(false);
         setNewCustomer({});
      } catch (error) {
         logger.error('Customers', "Failed to save customer:", error);
         addNotification('alert', "Failed to save customer.");
      } finally {
         setIsSubmitting(false);
      }
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

   const handleConfirmDelete = async () => {
      if (!customerToDelete) return;

      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      setIsSubmitting(true);
      try {
         await deleteCustomer(customerToDelete.id);
         if (selectedCustomer?.id === customerToDelete.id) setSelectedCustomer(null);

         addNotification('success', `Customer ${customerToDelete.name} deleted.`);
         setIsDeleteModalOpen(false);
         setCustomerToDelete(null);
         setDeleteInput('');
      } catch (error) {
         logger.error('Customers', "Failed to delete customer:", error);
         addNotification('alert', "Failed to delete customer.");
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                  <Users className="text-[var(--theme-accent)]" />
                  Customers
               </h2>
               <p className="text-[var(--theme-text-secondary)] text-sm">Manage loyalty, view history, and track customer tiers.</p>
            </div>
             <Protected permission="ADD_CUSTOMER">
                <button
                   type="button"
                   onClick={() => { setNewCustomer({}); setIsAddModalOpen(true); }}
                   className="woody-btn-primary min-h-11 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                >
                   <Plus className="w-4 h-4 mr-2" />
                   Add Customer
                </button>
             </Protected>
         </div>

         {/* Adaptive Regional Territory Lens */}
         <RegionalScopeBanner moduleName="Customers" />

         {/* Search Bar */}
          <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
             <div className="flex items-center min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/25 transition-colors">
                <Search className="w-4 h-4 text-[var(--theme-text-secondary)]" aria-hidden="true" />
                <input
                   type="text"
                   placeholder="Search by name, email, or phone..."
                   className="bg-transparent border-none ml-3 flex-1 text-[var(--theme-input-text)] text-sm outline-none placeholder:text-[var(--theme-text-muted)]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   aria-label="Search customers by name, email, or phone"
                />
             </div>
          </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredCustomers.map(customer => (
                  <div
                     key={customer.id}
                     role="button"
                     tabIndex={0}
                     aria-pressed={selectedCustomer?.id === customer.id}
                     onClick={() => setSelectedCustomer(customer)}
                     onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCustomer(customer); } }}
                     className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 cursor-pointer transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${selectedCustomer?.id === customer.id ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-muted)] shadow-xs' : 'hover:bg-[var(--theme-bg-card-hover)]'}`}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-full bg-[var(--theme-accent-muted)] flex items-center justify-center text-[var(--theme-accent)] font-bold text-lg">
                              {customer.name.charAt(0)}
                           </div>
                           <div>
                              <h3 className="font-bold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors">{customer.name}</h3>
                              <p className="text-xs text-[var(--theme-text-secondary)]">{customer.phone}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${customer.tier === 'Platinum' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                           customer.tier === 'Gold' ? 'text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)]' :
                              customer.tier === 'Silver' ? 'text-gray-300 border-gray-500/30 bg-gray-500/10' :
                                 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                           }`}>
                           {customer.tier}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-sm border-t border-[var(--theme-border-subtle)] pt-4">
                        <div className="flex flex-col">
                           <span className="text-[var(--theme-text-secondary)] text-xs">Total spent</span>
                           <span className="text-[var(--theme-text-primary)] font-mono font-bold">{CURRENCY_SYMBOL} {customer.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[var(--theme-text-secondary)] text-xs">Loyalty points</span>
                           <span className="text-[var(--theme-accent)] font-mono font-bold">{customer.loyaltyPoints}</span>
                        </div>
                     </div>
                  </div>
               ))}
               {filteredCustomers.length === 0 && (
                  <div role="status" className="col-span-full text-center py-12 px-4 text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] border-dashed">
                     {searchTerm ? 'No customers match this search.' : 'No customer records yet.'}
                  </div>
               )}
            </div>

            {/* Detail Panel */}
             <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 h-fit lg:sticky lg:top-6 shadow-xs">
               {selectedCustomer ? (
                  <div className="space-y-6 animate-in fade-in">
                     <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-[var(--theme-bg-subtle)] mx-auto flex items-center justify-center border border-[var(--theme-border)] mb-4">
                           <Crown size={40} className={
                              selectedCustomer.tier === 'Platinum' ? 'text-purple-400' :
                                 selectedCustomer.tier === 'Gold' ? 'text-[var(--theme-status-warning-text)]' :
                                    selectedCustomer.tier === 'Silver' ? 'text-gray-300' : 'text-orange-400'
                           } />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--theme-text-primary)]">{selectedCustomer.name}</h3>
                        <p className="text-[var(--theme-text-secondary)] text-sm mt-1">{selectedCustomer.email || 'No email address'}</p>
                        <div className="flex justify-center gap-2 mt-4">
                           <a href={`tel:${selectedCustomer.phone.replace(/[^\d+]/g, '')}`} className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label={`Call ${selectedCustomer.name}`}><Phone size={18} /></a>
                           {selectedCustomer.email && <a href={`mailto:${encodeURIComponent(selectedCustomer.email)}`} className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label={`Email ${selectedCustomer.name}`}><Mail size={18} /></a>}
                           <ProtectedButton permission="EDIT_CUSTOMER" onClick={() => handleEditCustomer(selectedCustomer)} className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label="Edit Customer"><Edit2 size={18} /></ProtectedButton>
                           <ProtectedButton permission="DELETE_CUSTOMER" onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-status-danger)] hover:bg-[var(--theme-status-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]" aria-label="Delete Customer"><Trash2 size={18} /></ProtectedButton>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)] flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Gift className="text-[var(--theme-accent)]" size={20} aria-hidden="true" />
                              <div>
                                 <p className="text-xs text-[var(--theme-text-secondary)]">Loyalty balance</p>
                                 <p className="font-bold text-[var(--theme-text-primary)]">{selectedCustomer.loyaltyPoints} pts</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)] flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <History className="text-[var(--theme-accent)]" size={20} aria-hidden="true" />
                              <div>
                                 <p className="text-xs text-[var(--theme-text-secondary)]">Last visit</p>
                                 <p className="font-bold text-[var(--theme-text-primary)]">{selectedCustomer.lastVisit}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-[var(--theme-text-primary)] mb-3 flex items-center gap-2"><FileText size={16} className="text-[var(--theme-text-secondary)]" /> Notes</h4>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-sm text-[var(--theme-text-primary)] min-h-[80px]">
                           {selectedCustomer.notes || "No notes available."}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--theme-text-secondary)] py-20">
                     <Users size={48} className="mb-4 opacity-20" />
                     <p>Select a customer to view details</p>
                  </div>
               )}
            </div>
         </div>

         {/* Add/Edit Modal */}
         <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={newCustomer.id ? "Edit Customer" : "Add New Customer"}>
            <div className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label htmlFor="c-name" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Full name *</label>
                     <input
                        id="c-name"
                        required
                        className="woody-input"
                        value={newCustomer.name || ''}
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        disabled={isSubmitting}
                     />
                  </div>
                  <div>
                     <label htmlFor="c-phone" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Phone number *</label>
                     <input
                        id="c-phone"
                        type="tel"
                        required
                        className="woody-input"
                        value={newCustomer.phone || ''}
                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        disabled={isSubmitting}
                     />
                  </div>
               </div>
               <div>
                  <label htmlFor="c-email" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Email address</label>
                  <input
                     id="c-email"
                     type="email"
                     className="woody-input"
                     value={newCustomer.email || ''}
                     onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                     disabled={isSubmitting}
                  />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label htmlFor="c-tier" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Tier</label>
                     <select
                        id="c-tier"
                        className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] hover:border-[var(--theme-border-strong)] rounded-xl px-3 py-2 text-[var(--theme-input-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        value={newCustomer.tier || 'Bronze'}
                        onChange={e => setNewCustomer({ ...newCustomer, tier: e.target.value as any })}
                        disabled={isSubmitting}
                     >
                        <option>Bronze</option>
                        <option>Silver</option>
                        <option>Gold</option>
                        <option>Platinum</option>
                      </select>
                  </div>
                  <div>
                     <label htmlFor="c-points" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Loyalty points</label>
                     <input
                        id="c-points"
                        type="number"
                        className="woody-input min-h-11 animate-none"
                        value={newCustomer.loyaltyPoints || 0}
                        onChange={e => setNewCustomer({ ...newCustomer, loyaltyPoints: parseInt(e.target.value) })}
                        disabled={isSubmitting}
                     />
                  </div>
               </div>
               <div>
                  <label htmlFor="c-notes" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">Notes</label>
                  <textarea
                     id="c-notes"
                     className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-3 py-2 text-[var(--theme-input-text)] outline-none min-h-24 resize-y focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                     value={newCustomer.notes || ''}
                     onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                     disabled={isSubmitting}
                  />
               </div>
               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--theme-border)]">
                  <button
                     type="button"
                     onClick={() => setIsAddModalOpen(false)}
                     disabled={isSubmitting}
                     className="min-h-11 px-4 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     onClick={handleSaveCustomer}
                     disabled={isSubmitting || !newCustomer.name?.trim() || !newCustomer.phone?.trim()}
                     className="woody-btn-primary min-h-11 flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                     {isSubmitting ? (newCustomer.id ? 'Saving...' : 'Adding...') : (newCustomer.id ? 'Save Customer' : 'Add Customer')}
                  </button>
               </div>
            </div>
         </Modal>

         {/* Delete Confirmation Modal */}
         <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl">
                  <div className="p-3 bg-[var(--theme-status-danger-bg)] rounded-full">
                     <Trash2 className="w-8 h-8 text-[var(--theme-status-danger-text)]" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-[var(--theme-text-primary)]">Delete customer?</h3>
                     <p className="text-[var(--theme-status-danger-text)] text-sm">This action cannot be undone.</p>
                  </div>
               </div>

               <p className="text-[var(--theme-text-secondary)] mb-6">
                  To confirm deletion for <span className="text-[var(--theme-text-primary)] font-bold">{customerToDelete?.name}</span>, type <span className="font-mono font-bold text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] px-2 py-1 rounded">DELETE</span> below:
               </p>

               <input
                  type="text"
                  autoComplete="off"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-lg px-4 py-3 text-[var(--theme-input-text)] mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)] transition-colors font-mono"
                  placeholder="Type DELETE to confirm"
                  disabled={isSubmitting}
                  aria-label="Confirm deletion input"
               />

               <div className="flex justify-end gap-3">
                  <button
                     type="button"
                     onClick={() => setIsDeleteModalOpen(false)}
                     disabled={isSubmitting}
                     className="min-h-11 px-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     onClick={handleConfirmDelete}
                     disabled={deleteInput !== 'DELETE' || isSubmitting}
                     className={`min-h-11 px-6 rounded-lg font-bold transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)] ${deleteInput === 'DELETE' && !isSubmitting
                        ? 'bg-[var(--theme-status-danger)] hover:opacity-90 text-white'
                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                        }`}
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                     {isSubmitting ? 'Deleting...' : 'Delete Customer'}
                  </button>
               </div>
            </div>
         </Modal>
      </div>
   );
}
