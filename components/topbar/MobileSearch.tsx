import React from 'react';
import { Search, X, Package, FileText, ShoppingCart, Users, Zap, Layout, ArrowRight, Activity } from 'lucide-react';

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
      <div className="lg:hidden fixed inset-0 z-[100] bg-cyber-dark/98 backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
         <div className="p-4 flex items-center gap-4 bg-cyber-gray/50 border-b border-white/10">
            <button
               onClick={() => { setIsMobileSearchVisible(false); setSearchValue(''); }}
               className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
               aria-label="Close"
            >
               <X size={24} />
            </button>
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-primary" />
               <input
                  autoFocus
                  type="text"
                  placeholder="Search products, orders, customers..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-cyber-primary/50 transition-all font-medium"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-safe">
            {searchValue.trim().length >= 2 ? (
               searchResults && searchResults.total > 0 ? (
                  <div className="pb-8">
                     {/* Navigation & Commands */}
                     {(searchResults.navigation?.length > 0 || searchResults.deepLinks?.length > 0) && (
                        <div className="border-b border-cyber-primary/20 bg-cyber-primary/5">
                           <div className="px-4 py-3 bg-black/30">
                              <p className="text-[10px] font-black text-cyber-primary uppercase tracking-widest flex items-center gap-2">
                                 <Layout size={12} className="text-cyber-primary" />
                                 Commands & Navigation
                              </p>
                           </div>
                           
                           {/* Deep Links */}
                           {searchResults.deepLinks?.map((link: any, idx: number) => (
                              <button
                                 key={`dl-${idx}`}
                                 onClick={() => { handleResultClick('job', link.id, link.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-cyber-primary/10 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-cyber-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Activity size={20} className="text-cyber-accent" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{link.title}</p>
                                    <p className="text-xs text-cyber-primary opacity-80 font-mono truncate">Direct Access Link</p>
                                 </div>
                                 <ArrowRight size={16} className="text-cyber-primary" />
                              </button>
                           ))}

                           {/* Navigation */}
                           {searchResults.navigation?.map((nav: any, idx: number) => (
                              <button
                                 key={`nav-${idx}`}
                                 onClick={() => { handleResultClick('navigation', nav.module, nav.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-cyber-primary/10 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <Layout size={20} className="text-cyber-primary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{nav.title}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest truncate">{nav.module} module</p>
                                 </div>
                                 <ArrowRight size={16} className="text-gray-500" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Products */}
                     {searchResults.products.length > 0 && (
                        <div className="border-b border-white/5">
                           <div className="px-4 py-3 bg-black/20">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Package size={12} className="text-cyber-primary" />
                                 Products ({searchResults.products.length})
                              </p>
                           </div>
                           {searchResults.products.map((p: any) => (
                              <button
                                 key={p.id}
                                 onClick={() => { handleResultClick('product', p.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-white/5 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Package size={20} className="text-green-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{p.sku} • Stock: {p.stock}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Orders */}
                     {searchResults.orders.length > 0 && (
                        <div className="border-b border-white/5">
                           <div className="px-4 py-3 bg-black/20">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <FileText size={12} className="text-cyber-primary" />
                                 Purchase Orders ({searchResults.orders.length})
                              </p>
                           </div>
                           {searchResults.orders.map((o: any) => (
                              <button
                                 key={o.id}
                                 onClick={() => { handleResultClick('order', o.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-white/5 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-blue-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{o.poNumber || o.po_number}</p>
                                    <p className="text-xs text-gray-500 truncate">{o.status} • {o.supplierName}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Sales */}
                     {searchResults.sales.length > 0 && (
                        <div className="border-b border-white/5">
                           <div className="px-4 py-3 bg-black/20">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <ShoppingCart size={12} className="text-cyber-primary" />
                                 Sales Tracks ({searchResults.sales.length})
                              </p>
                           </div>
                           {searchResults.sales.map((s: any) => (
                              <button
                                 key={s.id}
                                 onClick={() => { handleResultClick('sale', s.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-white/5 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <ShoppingCart size={20} className="text-purple-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}</p>
                                    <p className="text-xs text-gray-500 truncate">${s.total} • {s.date}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Customers */}
                     {searchResults.customers.length > 0 && (
                        <div className="border-b border-white/5">
                           <div className="px-4 py-3 bg-black/20">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Users size={12} className="text-cyber-primary" />
                                 Customers ({searchResults.customers.length})
                              </p>
                           </div>
                           {searchResults.customers.map((c: any) => (
                              <button
                                 key={c.id}
                                 onClick={() => { handleResultClick('customer', c.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-white/5 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                    <Users size={20} className="text-cyan-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{c.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.email || c.phone}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Employees */}
                     {searchResults.employees.length > 0 && (
                        <div className="border-b border-white/5">
                           <div className="px-4 py-3 bg-black/20">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Users size={12} className="text-cyber-primary" />
                                 Team Members ({searchResults.employees.length})
                              </p>
                           </div>
                           {searchResults.employees.map((e: any) => (
                              <button
                                 key={e.id}
                                 onClick={() => { handleResultClick('employee', e.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-white/5 flex items-center gap-3 text-left border-b border-white/5 last:border-0 active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                    <Users size={20} className="text-yellow-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{e.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{e.role} • {e.email}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                     <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Search size={40} className="text-gray-600" />
                     </div>
                     <h3 className="text-lg font-bold text-white mb-2">No intelligence found</h3>
                     <p className="text-gray-500 text-sm max-w-[240px]">We couldn't find any records matching "{searchValue}" in the network.</p>
                  </div>
               )
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-cyber-primary/10 flex items-center justify-center mb-6 animate-pulse">
                     <Zap size={40} className="text-cyber-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Omniscient Search</h3>
                  <p className="text-gray-500 text-sm max-w-[280px]">
                     Type at least 2 characters to scan across products, orders, customers, and team members.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                     <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 border border-white/5 font-mono">PRODUCTS</span>
                     <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 border border-white/5 font-mono">ORDERS</span>
                     <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 border border-white/5 font-mono">CUSTOMERS</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
