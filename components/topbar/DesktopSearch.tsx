import React from 'react';
import { Search, X, Package, FileText, ShoppingCart, Users, Layout, ArrowRight, Activity } from 'lucide-react';

interface DesktopSearchProps {
   searchValue: string;
   setSearchValue: (val: string) => void;
   isSearchOpen: boolean;
   setIsSearchOpen: (val: boolean) => void;
   searchResults: any;
   handleSearch: (e: React.FormEvent) => void;
   handleResultClick: (type: string, id: string, path?: string) => void;
   containerRef: React.RefObject<HTMLDivElement | null>;
}

export function DesktopSearch({
   searchValue,
   setSearchValue,
   isSearchOpen,
   setIsSearchOpen,
   searchResults,
   handleSearch,
   handleResultClick,
   containerRef
}: DesktopSearchProps) {
   return (
    <div className="relative hidden lg:block" ref={containerRef}>
         <form onSubmit={handleSearch} className="flex items-center bg-[#F4EFE6] dark:bg-black/20 rounded-full px-4 py-1.5 border border-[#E2DCCE] dark:border-white/10 focus-within:border-[#2C5E3B]/60 dark:focus-within:border-[#A9CBA2]/60 transition-colors">
            <Search className="w-4 h-4 text-[#4D6E56] dark:text-[#7A9E83]" />
            <input
               type="text"
               placeholder="Global Search..."
               className="bg-transparent border-none focus:ring-0 text-sm text-[#1E3F27] dark:text-[#EAE5D9] ml-2 w-64 placeholder-[#4D6E56]/60 dark:placeholder-[#7A9E83]/60 outline-none"
               value={searchValue}
               onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (e.target.value.length >= 2) setIsSearchOpen(true);
                  else setIsSearchOpen(false);
               }}
               onFocus={() => searchValue.length >= 2 && setIsSearchOpen(true)}
            />
         </form>

         {/* Search Results Dropdown */}
         {isSearchOpen && searchResults && (
            <>
               <div className="absolute left-0 mt-2 w-96 bg-[#FDFBF7] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden max-h-[500px] overflow-y-auto">
                  <div className="p-3 border-b border-[#E2DCCE] dark:border-white/5 bg-black/5 dark:bg-black/20 flex justify-between items-center">
                     <h4 className="text-xs font-bold text-[#1E3F27] dark:text-white uppercase tracking-wider">
                        Search Results ({searchResults.total})
                     </h4>
                     <button onClick={() => setIsSearchOpen(false)} className="text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white" aria-label="Close search">
                        <X size={14} />
                     </button>
                  </div>

                  {searchResults.total > 0 ? (
                     <>
                        {/* Navigation & Commands */}
                        {(searchResults.navigation?.length > 0 || searchResults.deepLinks?.length > 0) && (
                           <div className="border-b border-[#2C5E3B]/20 bg-[#2C5E3B]/5 dark:border-[#A9CBA2]/20 dark:bg-[#A9CBA2]/5">
                              <div className="px-3 py-2 bg-black/5 dark:bg-black/30">
                                 <p className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase flex items-center gap-1 tracking-widest">
                                    <Layout size={10} /> Commands & Navigation
                                 </p>
                              </div>
                              
                              {/* Deep Links First */}
                              {searchResults.deepLinks?.map((link: any, idx: number) => (
                                 <button
                                    key={`dl-${idx}`}
                                    onClick={() => handleResultClick('job', link.id, link.path)}
                                    className="w-full p-3 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 transition-colors flex items-center gap-3 text-left border-b border-[#E2DCCE]/50 dark:border-white/5 last:border-0 group cursor-pointer"
                                 >
                                    <div className="w-8 h-8 rounded-lg bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20 flex items-center justify-center flex-shrink-0">
                                       <Activity size={16} className="text-amber-600 dark:text-amber-500 group-hover:animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-sm font-black text-[#1E3F27] dark:text-white">{link.title}</p>
                                       <p className="text-[10px] text-[#4D6E56] dark:text-gray-400 font-mono tracking-wider">Direct Access Link</p>
                                    </div>
                                    <ArrowRight size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                 </button>
                              ))}

                              {/* Standard Navigation */}
                              {searchResults.navigation?.map((nav: any, idx: number) => (
                                 <button
                                    key={`nav-${idx}`}
                                    onClick={() => handleResultClick('navigation', nav.module, nav.path)}
                                    className="w-full p-3 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 transition-colors flex items-center gap-3 text-left border-b border-[#E2DCCE]/50 dark:border-white/5 last:border-0 group cursor-pointer"
                                 >
                                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                                       <Layout size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-[#1E3F27] dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{nav.title}</p>
                                       <p className="text-[10px] text-[#4D6E56] dark:text-gray-500 uppercase tracking-widest">{nav.module} module</p>
                                    </div>
                                    <ArrowRight size={14} className="text-[#4D6E56] dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Products */}
                        {searchResults.products.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Package size={10} /> Products ({searchResults.products.length})
                                 </p>
                              </div>
                              {searchResults.products.map((p: any) => (
                                 <button
                                    key={p.id}
                                    onClick={() => handleResultClick('product', p.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Package size={16} className="text-green-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{p.name}</p>
                                       <p className="text-[10px] text-gray-500">{p.sku} • Stock: {p.stock}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Orders */}
                        {searchResults.orders.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <FileText size={10} /> Purchase Orders ({searchResults.orders.length})
                                 </p>
                              </div>
                              {searchResults.orders.map((o: any) => (
                                 <button
                                    key={o.id}
                                    onClick={() => handleResultClick('order', o.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <FileText size={16} className="text-blue-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{o.poNumber || o.po_number}</p>
                                       <p className="text-[10px] text-gray-500">{o.status} • {o.supplierName}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Sales History */}
                        {searchResults.sales.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <ShoppingCart size={10} /> Sales History ({searchResults.sales.length})
                                 </p>
                              </div>
                              {searchResults.sales.map((s: any) => (
                                 <button
                                    key={s.id}
                                    onClick={() => handleResultClick('sale', s.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <ShoppingCart size={16} className="text-purple-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}</p>
                                       <p className="text-[10px] text-gray-500">${s.total} • {s.date}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Customers */}
                        {searchResults.customers.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Users size={10} /> Customers ({searchResults.customers.length})
                                 </p>
                              </div>
                              {searchResults.customers.map((c: any) => (
                                 <button
                                    key={c.id}
                                    onClick={() => handleResultClick('customer', c.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Users size={16} className="text-cyan-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{c.name}</p>
                                       <p className="text-[10px] text-gray-500">{c.email || c.phone}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Team */}
                        {searchResults.employees.length > 0 && (
                           <div>
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Users size={10} /> Team Members ({searchResults.employees.length})
                                 </p>
                              </div>
                              {searchResults.employees.map((e: any) => (
                                 <button
                                    key={e.id}
                                    onClick={() => handleResultClick('employee', e.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Users size={16} className="text-yellow-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{e.name}</p>
                                       <p className="text-[10px] text-gray-500">{e.role} • {e.email}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="p-10 text-center">
                        <Search size={32} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm italic">No intelligence found for "{searchValue}"</p>
                        <p className="text-gray-500 text-[10px] mt-1">Try searching for products, orders, customers, or team members</p>
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
