import React from 'react';
import { Package, Loader2, Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useMerchandising } from './MerchandisingContext';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';

const MARKDOWN_DATA = [
   { week: 'Week 1', stock: 100, price: 1000, revenue: 5000 },
   { week: 'Week 2', stock: 85, price: 950, revenue: 8000 },
   { week: 'Week 3', stock: 60, price: 850, revenue: 12000 },
   { week: 'Week 4', stock: 25, price: 700, revenue: 15000 },
   { week: 'Week 5', stock: 0, price: 500, revenue: 18000 },
];

export const MarkdownTab: React.FC = () => {
   const {
      selectedMarkdownProduct,
      setSelectedMarkdownProduct,
      products,
      isMarkdownSimulating,
      calculateMarkdown,
   } = useMerchandising();

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
         <div className="glass-panel p-6">
            <h3 className="font-bold text-[#1E3F27] dark:text-white mb-4">Clearance Strategy</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
               Calculate optimal discount schedules to clear slow-moving inventory by a target date without sacrificing unnecessary margin.
            </p>

            <div className="space-y-4">
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Select Product</label>
                  <select
                     className="woody-input"
                     value={selectedMarkdownProduct?.id || ''}
                     onChange={(e) => setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null)}
                     aria-label="Select Product for Markdown"
                  >
                     <option value="" className="bg-white dark:bg-[#1E2822]">Choose SKU to Simulate...</option>
                     <optgroup label="Recommended for Clearance (Low Velocity)" className="bg-white dark:bg-[#1E2822]">
                        {products.filter(p => p.salesVelocity === 'Low').map(p => (
                           <option key={p.id} value={p.id} className="bg-white dark:bg-[#1E2822]">{p.name} ({p.stock} units)</option>
                        ))}
                     </optgroup>
                     <optgroup label="Other Products" className="bg-white dark:bg-[#1E2822]">
                        {products.filter(p => p.salesVelocity !== 'Low').map(p => (
                           <option key={p.id} value={p.id} className="bg-white dark:bg-[#1E2822]">{p.name}</option>
                        ))}
                     </optgroup>
                  </select>
               </div>

               {selectedMarkdownProduct && (
                  <div className="p-4 bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20 space-y-3">
                     <div className="flex items-center gap-3 pb-3 border-b border-[#E2DCCE]/40 dark:border-emerald-950/10">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           {selectedMarkdownProduct.image && !selectedMarkdownProduct.image.includes('placeholder.com') ? (
                              <img
                                 src={selectedMarkdownProduct.image}
                                 className="w-full h-full object-cover"
                                 alt=""
                                 onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                 }}
                              />
                           ) : (
                              <Package size={18} className="text-stone-400" />
                           )}
                        </div>
                        <div>
                           <p className="font-bold text-[#1E3F27] dark:text-white text-sm">{selectedMarkdownProduct.name}</p>
                           <p className="text-[10px] text-stone-500 dark:text-stone-400">{selectedMarkdownProduct.sku}</p>
                        </div>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Current Price</span>
                        <span className="text-[#1E3F27] dark:text-white font-mono font-semibold">{formatCompactNumber(selectedMarkdownProduct.price, { currency: CURRENCY_SYMBOL })}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Break-Even Cost</span>
                        <span className="text-[#1E3F27] dark:text-white font-mono font-semibold">{formatCompactNumber(selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7, { currency: CURRENCY_SYMBOL })}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Weeks on Shelf</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">12 Weeks</span>
                     </div>
                  </div>
               )}

               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Target Exit Date</label>
                  <input type="date" className="woody-input" aria-label="Target Exit Date" />
               </div>

               <button
                  onClick={calculateMarkdown}
                  disabled={!selectedMarkdownProduct || isMarkdownSimulating}
                  className="woody-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
               >
                  {isMarkdownSimulating ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                  {isMarkdownSimulating ? 'Calculating Elasticity...' : 'Generate Glide Path'}
               </button>
            </div>
         </div>

         <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
            <h3 className="font-bold text-[#1E3F27] dark:text-white mb-2">Projected Depletion Path</h3>
            <div className="flex-1 min-h-[300px]">
               {selectedMarkdownProduct ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                     <AreaChart data={MARKDOWN_DATA}>
                        <defs>
                           <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="week" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                        <YAxis yAxisId="left" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="price" stroke="#d97706" strokeWidth={2} name="Price Point" />
                        <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#ef4444" strokeDasharray="5 5" name="Stock Level" />
                     </AreaChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-stone-500 dark:text-stone-400 border-2 border-dashed border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl">
                     Select a product to view markdown forecast
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
