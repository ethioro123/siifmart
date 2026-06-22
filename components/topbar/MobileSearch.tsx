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
      <div className="lg:hidden fixed inset-0 z-[100] bg-white/98 dark:bg-[#18201B]/98 backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
         <div className="p-4 flex items-center gap-4 bg-stone-50/80 dark:bg-[#232E27]/60 border-b border-[#E2DCCE] dark:border-white/10">
            <button
               onClick={() => { setIsMobileSearchVisible(false); setSearchValue(''); }}
               className="p-2 -ml-2 text-stone-500 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white transition-colors"
               aria-label="Close"
            >
               <X size={24} />
            </button>
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C5E3B] dark:text-[#A9CBA2]" />
               <input
                  autoFocus
                  type="text"
                  placeholder="Search products, orders, customers..."
                  className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[#1E3F27] dark:text-white placeholder-stone-400 dark:placeholder-gray-500 outline-none focus:border-[#2C5E3B]/50 dark:focus:border-[#A9CBA2]/50 transition-all font-medium"
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
                        <div className="border-b border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/30">
                              <p className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest flex items-center gap-2">
                                 <Layout size={12} />
                                 Commands &amp; Navigation
                              </p>
                           </div>

                           {/* Deep Links */}
                           {searchResults.deepLinks?.map((link: any, idx: number) => (
                              <button
                                 key={`dl-${idx}`}
                                 onClick={() => { handleResultClick('job', link.id, link.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/10 flex items-center justify-center flex-shrink-0">
                                    <Activity size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-[#1E3F27] dark:text-white truncate">{link.title}</p>
                                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] opacity-80 font-mono truncate">Direct Access Link</p>
                                 </div>
                                 <ArrowRight size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                              </button>
                           ))}

                           {/* Navigation */}
                           {searchResults.navigation?.map((nav: any, idx: number) => (
                              <button
                                 key={`nav-${idx}`}
                                 onClick={() => { handleResultClick('navigation', nav.module, nav.path); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <Layout size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{nav.title}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 uppercase tracking-widest truncate">{nav.module} module</p>
                                 </div>
                                 <ArrowRight size={16} className="text-stone-400 dark:text-gray-500" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Products */}
                     {searchResults.products.length > 0 && (
                        <div className="border-b border-[#E2DCCE] dark:border-white/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/20">
                              <p className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Package size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 Products ({searchResults.products.length})
                              </p>
                           </div>
                           {searchResults.products.map((p: any) => (
                              <button
                                 key={p.id}
                                 onClick={() => { handleResultClick('product', p.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Package size={20} className="text-green-600 dark:text-green-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{p.name}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 truncate">{p.sku} • Stock: {p.stock}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Orders */}
                     {searchResults.orders.length > 0 && (
                        <div className="border-b border-[#E2DCCE] dark:border-white/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/20">
                              <p className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <FileText size={12} className="text-blue-500 dark:text-blue-400" />
                                 Purchase Orders ({searchResults.orders.length})
                              </p>
                           </div>
                           {searchResults.orders.map((o: any) => (
                              <button
                                 key={o.id}
                                 onClick={() => { handleResultClick('order', o.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-blue-500 dark:text-blue-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{o.poNumber || o.po_number}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 truncate">{o.status} • {o.supplierName}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Sales */}
                     {searchResults.sales.length > 0 && (
                        <div className="border-b border-[#E2DCCE] dark:border-white/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/20">
                              <p className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <ShoppingCart size={12} className="text-purple-500 dark:text-purple-400" />
                                 Sales Tracks ({searchResults.sales.length})
                              </p>
                           </div>
                           {searchResults.sales.map((s: any) => (
                              <button
                                 key={s.id}
                                 onClick={() => { handleResultClick('sale', s.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <ShoppingCart size={20} className="text-purple-500 dark:text-purple-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 truncate">${s.total} • {s.date}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Customers */}
                     {searchResults.customers.length > 0 && (
                        <div className="border-b border-[#E2DCCE] dark:border-white/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/20">
                              <p className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Users size={12} className="text-cyan-500 dark:text-cyan-400" />
                                 Customers ({searchResults.customers.length})
                              </p>
                           </div>
                           {searchResults.customers.map((c: any) => (
                              <button
                                 key={c.id}
                                 onClick={() => { handleResultClick('customer', c.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                    <Users size={20} className="text-cyan-500 dark:text-cyan-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{c.name}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 truncate">{c.email || c.phone}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Employees */}
                     {searchResults.employees.length > 0 && (
                        <div className="border-b border-[#E2DCCE] dark:border-white/5">
                           <div className="px-4 py-3 bg-stone-50/60 dark:bg-black/20">
                              <p className="text-[10px] font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                 <Users size={12} className="text-amber-500 dark:text-yellow-400" />
                                 Team Members ({searchResults.employees.length})
                              </p>
                           </div>
                           {searchResults.employees.map((e: any) => (
                              <button
                                 key={e.id}
                                 onClick={() => { handleResultClick('employee', e.id); setIsMobileSearchVisible(false); }}
                                 className="w-full px-4 py-4 hover:bg-stone-50 dark:hover:bg-white/5 flex items-center gap-3 text-left border-b border-[#E2DCCE] dark:border-white/5 last:border-0 active:bg-stone-100 dark:active:bg-white/10"
                              >
                                 <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                    <Users size={20} className="text-amber-500 dark:text-yellow-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{e.name}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 truncate">{e.role} • {e.email}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                     <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-6">
                        <Search size={40} className="text-stone-300 dark:text-gray-600" />
                     </div>
                     <h3 className="text-lg font-bold text-[#1E3F27] dark:text-white mb-2">No results found</h3>
                     <p className="text-stone-400 dark:text-gray-500 text-sm max-w-[240px]">We couldn't find any records matching "{searchValue}" in the network.</p>
                  </div>
               )
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center mb-6 animate-pulse">
                     <Zap size={40} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1E3F27] dark:text-white mb-2">Omniscient Search</h3>
                  <p className="text-stone-400 dark:text-gray-500 text-sm max-w-[280px]">
                     Type at least 2 characters to scan across products, orders, customers, and team members.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                     <span className="px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full text-[10px] text-stone-400 dark:text-gray-400 border border-[#E2DCCE] dark:border-white/5 font-mono">PRODUCTS</span>
                     <span className="px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full text-[10px] text-stone-400 dark:text-gray-400 border border-[#E2DCCE] dark:border-white/5 font-mono">ORDERS</span>
                     <span className="px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full text-[10px] text-stone-400 dark:text-gray-400 border border-[#E2DCCE] dark:border-white/5 font-mono">CUSTOMERS</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
