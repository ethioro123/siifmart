import React from 'react';
import { Search, X, Package, FileText, ShoppingCart, Users, Zap, Layout, ArrowRight, Activity } from 'lucide-react';
import { getEmployeeJobTitle } from '../../utils/roles';

interface MobileSearchProps {
   isMobileSearchVisible: boolean;
   setIsMobileSearchVisible: (val: boolean) => void;
   searchValue: string;
   setSearchValue: (val: string) => void;
   searchResults: any;
   handleResultClick: (type: string, id: string, path?: string) => void;
}

export function MobileSearch({
   isMobileSearchVisible,
   setIsMobileSearchVisible,
   searchValue,
   setSearchValue,
   searchResults,
   handleResultClick
}: MobileSearchProps) {
   if (!isMobileSearchVisible) return null;

   return (
      <div style={{ top: 'var(--app-top-inset, 0px)' }} className="fixed inset-0 z-[100] bg-[var(--theme-bg-app)]/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200">
         <div className="p-4 flex items-center gap-3 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)]">
            <button
               onClick={() => { setIsMobileSearchVisible(false); setSearchValue(''); }}
               className="p-2 -ml-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] active:scale-95 transition-all cursor-pointer"
               aria-label="Close"
            >
               <X size={20} />
            </button>
            <div className="flex-1 relative flex items-center">
               <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
               <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  className="w-full h-9 min-h-[36px] pl-9 pr-9 text-xs sm:text-sm font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/60 !bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 transition-all"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
               />
               {searchValue.trim() ? (
                  <button
                     type="button"
                     onClick={() => setSearchValue('')}
                     className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                     aria-label="Clear Search"
                  >
                     <X size={13} />
                  </button>
               ) : null}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-safe">
            {searchValue.trim().length >= 2 ? (
               searchResults && searchResults.total > 0 ? (
                  <div className="pb-8">
                     {/* Navigation & Commands */}
                     {(searchResults.navigation?.length > 0 || searchResults.deepLinks?.length > 0) && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Layout size={12} /> Commands &amp; Navigation
                              </p>
                           </div>

                           {/* Deep Links */}
                           {searchResults.deepLinks?.map((link: any, idx: number) => (
                              <button
                                 key={`dl-${idx}`}
                                 onClick={() => { handleResultClick('job', link.id, link.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                                    <Activity size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{link.title}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] font-mono truncate">Direct Access Link</p>
                                 </div>
                                 <ArrowRight size={16} className="text-[var(--theme-text-muted)] shrink-0" />
                              </button>
                           ))}

                           {/* Navigation */}
                           {searchResults.navigation?.map((nav: any, idx: number) => (
                              <button
                                 key={`nav-${idx}`}
                                 onClick={() => { handleResultClick('navigation', nav.module, nav.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Layout size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{nav.title}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] uppercase tracking-wider truncate">{nav.module} module</p>
                                 </div>
                                 <ArrowRight size={16} className="text-[var(--theme-text-muted)] shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Products */}
                     {searchResults.products?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-[var(--theme-status-success-text)] uppercase tracking-widest flex items-center gap-1.5">
                                 <Package size={12} /> Products ({searchResults.products.length})
                              </p>
                           </div>
                           {searchResults.products.map((p: any) => (
                              <button
                                 key={p.id}
                                 onClick={() => { handleResultClick('product', p.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                                    <Package size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{p.name}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] truncate">{p.sku} • Stock: {p.stock}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Purchase Orders */}
                     {searchResults.orders?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-[var(--theme-status-info-text)] uppercase tracking-widest flex items-center gap-1.5">
                                 <FileText size={12} /> Purchase Orders ({searchResults.orders.length})
                              </p>
                           </div>
                           {searchResults.orders.map((o: any) => (
                              <button
                                 key={o.id}
                                 onClick={() => { handleResultClick('order', o.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{o.poNumber || o.po_number}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] truncate">{o.status} • {o.supplierName}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Sales */}
                     {searchResults.sales?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <ShoppingCart size={12} /> Sales History ({searchResults.sales.length})
                              </p>
                           </div>
                           {searchResults.sales.map((s: any) => (
                              <button
                                 key={s.id}
                                 onClick={() => { handleResultClick('sale', s.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                    <ShoppingCart size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] truncate">${s.total} • {s.date}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Customers */}
                     {searchResults.customers?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} /> Customers ({searchResults.customers.length})
                              </p>
                           </div>
                           {searchResults.customers.map((c: any) => (
                              <button
                                 key={c.id}
                                 onClick={() => { handleResultClick('customer', c.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                    <Users size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{c.name}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] truncate">{c.email || c.phone}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Employees */}
                     {searchResults.employees?.length > 0 && (
                        <div>
                           <div className="px-4 py-2.5 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-[var(--theme-status-warning-text)] uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} /> Team Members ({searchResults.employees.length})
                              </p>
                           </div>
                           {searchResults.employees.map((e: any) => (
                              <button
                                 key={e.id}
                                 onClick={() => { handleResultClick('employee', e.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-3.5 hover:bg-[var(--theme-bg-subtle)] active:bg-[var(--theme-bg-card-hover)] flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 transition-colors"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                                    <Users size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{e.name}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)] truncate">{getEmployeeJobTitle(e)} • {e.email}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-8 select-none">
                     <div className="w-16 h-16 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-4 text-[var(--theme-text-muted)]">
                        <Search size={28} />
                     </div>
                     <h3 className="text-base font-semibold text-[var(--theme-text-primary)] mb-1">No results found</h3>
                     <p className="text-xs text-[var(--theme-text-secondary)] max-w-[260px]">
                        We couldn't find any records matching &ldquo;{searchValue}&rdquo; in the network.
                     </p>
                  </div>
               )
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center mb-4">
                     <Zap size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--theme-text-primary)] mb-1">Global Search</h3>
                  <p className="text-xs text-[var(--theme-text-secondary)] max-w-[280px]">
                     Type at least 2 characters to search across products, orders, customers, and team members.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                     <span className="px-3 py-1 bg-[var(--theme-bg-subtle)] rounded-full text-[10px] text-[var(--theme-text-muted)] border border-[var(--theme-border)] font-mono font-medium">PRODUCTS</span>
                     <span className="px-3 py-1 bg-[var(--theme-bg-subtle)] rounded-full text-[10px] text-[var(--theme-text-muted)] border border-[var(--theme-border)] font-mono font-medium">ORDERS</span>
                     <span className="px-3 py-1 bg-[var(--theme-bg-subtle)] rounded-full text-[10px] text-[var(--theme-text-muted)] border border-[var(--theme-border)] font-mono font-medium">CUSTOMERS</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
