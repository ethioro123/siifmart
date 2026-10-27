import React from 'react';
import { Search, X, Package, FileText, ShoppingCart, Users, Layout, ArrowRight, Activity } from 'lucide-react';
import { getEmployeeJobTitle } from '../../utils/roles';

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
      <div className="topbar-desktop-search relative hidden lg:block" ref={containerRef}>
         <form
            onSubmit={handleSearch}
            className="flex items-center bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 min-h-[40px] h-10 focus-within:border-[var(--theme-accent)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/20 focus-within:bg-[var(--theme-bg-card)] transition-all group shadow-xs"
         >
            <Search size={16} className="text-[var(--theme-text-secondary)] group-focus-within:text-[var(--theme-accent)] transition-colors shrink-0" />
            <input
               type="text"
               placeholder="Search..."
               className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm text-[var(--theme-text-primary)] ml-2.5 w-44 md:w-56 lg:w-64 focus-within:w-72 placeholder:text-[var(--theme-text-secondary)]/60 outline-none font-medium tracking-tight transition-all"
               value={searchValue}
               onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (e.target.value.length >= 2) setIsSearchOpen(true);
                  else setIsSearchOpen(false);
               }}
               onFocus={() => searchValue.length >= 2 && setIsSearchOpen(true)}
            />
            {searchValue.trim() ? (
               <button
                  type="button"
                  onClick={() => {
                     setSearchValue('');
                     setIsSearchOpen(false);
                  }}
                  className="w-5 h-5 rounded-md hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors cursor-pointer active:scale-90 shrink-0 ml-1.5"
                  aria-label="Clear Search"
               >
                  <X size={13} />
               </button>
            ) : (
               <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[10px] font-mono text-[var(--theme-text-secondary)] shadow-xs select-none shrink-0 ml-1.5">
                  <span className="text-xs leading-none">⌘</span><span className="leading-none">K</span>
               </kbd>
            )}
         </form>

         {/* Search Results Dropdown */}
         {isSearchOpen && searchResults && (
            <div className="absolute left-0 mt-2 w-[420px] bg-[var(--theme-bg-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden max-h-[520px] overflow-y-auto custom-scrollbar">
               <div className="p-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/70 flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight">
                     Search Results ({searchResults.total})
                  </h4>
                  <button
                     type="button"
                     onClick={() => setIsSearchOpen(false)}
                     className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer active:scale-90"
                     aria-label="Close search"
                  >
                     <X size={14} />
                  </button>
               </div>

               {searchResults.total > 0 ? (
                  <>
                     {/* Navigation & Commands */}
                     {(searchResults.navigation?.length > 0 || searchResults.deepLinks?.length > 0) && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Layout size={12} /> Commands &amp; Navigation
                              </p>
                           </div>

                           {/* Deep Links First */}
                           {searchResults.deepLinks?.map((link: any, idx: number) => (
                              <button
                                 key={`dl-${idx}`}
                                 onClick={() => handleResultClick('job', link.id, link.path)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                    <Activity size={16} className="group-hover:animate-pulse" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-amber-500 transition-colors truncate">
                                       {link.title}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] font-mono tracking-wider">
                                       Direct Access Link
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}

                           {/* Standard Navigation */}
                           {searchResults.navigation?.map((nav: any, idx: number) => (
                              <button
                                 key={`nav-${idx}`}
                                 onClick={() => handleResultClick('navigation', nav.module, nav.path)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Layout size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-indigo-500 transition-colors truncate">
                                       {nav.title}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider">
                                       {nav.module} module
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Products */}
                     {searchResults.products?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Package size={12} /> Products ({searchResults.products.length})
                              </p>
                           </div>
                           {searchResults.products.map((p: any) => (
                              <button
                                 key={p.id}
                                 onClick={() => handleResultClick('product', p.id)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Package size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-emerald-500 transition-colors truncate">
                                       {p.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] font-mono truncate">
                                       {p.sku} • Stock: {p.stock}
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Purchase Orders */}
                     {searchResults.orders?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <FileText size={12} /> Purchase Orders ({searchResults.orders.length})
                              </p>
                           </div>
                           {searchResults.orders.map((o: any) => (
                              <button
                                 key={o.id}
                                 onClick={() => handleResultClick('order', o.id)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-blue-500 transition-colors truncate">
                                       {o.poNumber || o.po_number}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] truncate">
                                       {o.status} • {o.supplierName}
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Sales History */}
                     {searchResults.sales?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <ShoppingCart size={12} /> Sales History ({searchResults.sales.length})
                              </p>
                           </div>
                           {searchResults.sales.map((s: any) => (
                              <button
                                 key={s.id}
                                 onClick={() => handleResultClick('sale', s.id)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                    <ShoppingCart size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-purple-500 transition-colors truncate">
                                       {s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] font-mono truncate">
                                       ${s.total} • {s.date}
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Customers */}
                     {searchResults.customers?.length > 0 && (
                        <div className="border-b border-[var(--theme-border-subtle)]">
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} /> Customers ({searchResults.customers.length})
                              </p>
                           </div>
                           {searchResults.customers.map((c: any) => (
                              <button
                                 key={c.id}
                                 onClick={() => handleResultClick('customer', c.id)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-cyan-500 transition-colors truncate">
                                       {c.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] truncate">
                                       {c.email || c.phone}
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Team Members */}
                     {searchResults.employees?.length > 0 && (
                        <div>
                           <div className="px-3.5 py-2 bg-[var(--theme-bg-subtle)]/50 border-b border-[var(--theme-border-subtle)]">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} /> Team Members ({searchResults.employees.length})
                              </p>
                           </div>
                           {searchResults.employees.map((e: any) => (
                              <button
                                 key={e.id}
                                 onClick={() => handleResultClick('employee', e.id)}
                                 className="w-full p-3 hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-3 text-left border-b border-[var(--theme-border-subtle)] last:border-0 group cursor-pointer"
                              >
                                 <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-amber-500 transition-colors truncate">
                                       {e.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] truncate">
                                       {getEmployeeJobTitle(e)} • {e.email}
                                    </p>
                                 </div>
                                 <ArrowRight size={14} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                              </button>
                           ))}
                        </div>
                     )}
                  </>
               ) : (
                  <div className="p-8 text-center select-none">
                     <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] mx-auto mb-3">
                        <Search size={20} />
                     </div>
                     <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        No results for &ldquo;{searchValue}&rdquo;
                     </p>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                        Try searching for products, POs, receipts, customers, or team members
                     </p>
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
