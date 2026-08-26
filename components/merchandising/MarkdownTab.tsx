import React, { useState, useMemo } from 'react';
import { Package, Loader2, Calculator, TrendingDown, Percent, CheckCircle2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useMerchandising } from './MerchandisingContext';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';

export const MarkdownTab: React.FC = () => {
   const {
      selectedMarkdownProduct,
      setSelectedMarkdownProduct,
      products,
      isMarkdownSimulating,
      calculateMarkdown,
      addNotification,
      updateProduct
   } = useMerchandising();

   const [targetExitDate, setTargetExitDate] = useState('');
   const [hasSimulated, setHasSimulated] = useState(false);

   // Dynamic Glide Path Calculation based on selected product
   const glidePathData = useMemo(() => {
      if (!selectedMarkdownProduct) return [];

      const initialStock = Math.max(10, selectedMarkdownProduct.stock || 50);
      const retailPrice = Math.max(10, selectedMarkdownProduct.price || 100);
      const costPrice = selectedMarkdownProduct.costPrice || Math.round(retailPrice * 0.7);

      const p1 = retailPrice;
      const s1 = Math.round(initialStock * 0.82);
      const rev1 = (initialStock - s1) * p1;

      const p2 = Math.round(retailPrice * 0.90);
      const s2 = Math.round(initialStock * 0.58);
      const rev2 = rev1 + (s1 - s2) * p2;

      const p3 = Math.round(retailPrice * 0.80);
      const s3 = Math.round(initialStock * 0.28);
      const rev3 = rev2 + (s2 - s3) * p3;

      const p4 = Math.max(costPrice, Math.round(retailPrice * 0.65));
      const s4 = Math.round(initialStock * 0.08);
      const rev4 = rev3 + (s3 - s4) * p4;

      const p5 = Math.max(costPrice, Math.round(retailPrice * 0.50));
      const s5 = 0;
      const rev5 = rev4 + s4 * p5;

      return [
         { week: 'Week 1', stock: initialStock, price: p1, revenue: rev1, discount: '0%' },
         { week: 'Week 2', stock: s1, price: p2, revenue: rev2, discount: '10%' },
         { week: 'Week 3', stock: s2, price: p3, revenue: rev3, discount: '20%' },
         { week: 'Week 4', stock: s3, price: p4, revenue: rev4, discount: '35%' },
         { week: 'Week 5', stock: s5, price: p5, revenue: rev5, discount: '50%' },
      ];
   }, [selectedMarkdownProduct]);

   const handleGenerate = () => {
      calculateMarkdown();
      setHasSimulated(true);
      addNotification('success', `Markdown glide path calculated for "${selectedMarkdownProduct?.name}"`);
   };

   const handleApplyPromo = async () => {
      if (!selectedMarkdownProduct || glidePathData.length < 2) return;
      const stage2Price = glidePathData[1].price;
      try {
         await updateProduct({
            ...selectedMarkdownProduct,
            isOnSale: true,
            salePrice: stage2Price
         });
         addNotification('success', `Activated 10% clearance promotion (${CURRENCY_SYMBOL} ${stage2Price}) for "${selectedMarkdownProduct.name}".`);
      } catch (err: any) {
         addNotification('alert', `Failed to apply markdown: ${err.message || 'Unknown error'}`);
      }
   };

   const projectedTotalRevenue = glidePathData.length > 0 ? glidePathData[glidePathData.length - 1].revenue : 0;
   const estimatedCost = selectedMarkdownProduct ? (selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7) * (selectedMarkdownProduct.stock || 50) : 0;
   const projectedMargin = projectedTotalRevenue > 0 ? ((projectedTotalRevenue - estimatedCost) / projectedTotalRevenue) * 100 : 0;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
         {/* Left: Clearance Parameters Card */}
         <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                  <div className="p-1.5 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                     <TrendingDown size={16} />
                  </div>
                  <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Clearance Strategy</h3>
               </div>
               <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
                  Calculate optimal discount schedules to clear slow-moving inventory by a target date without sacrificing unnecessary margin.
               </p>

               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1.5 block">Select Product</label>
                     <select
                        className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold cursor-pointer"
                        value={selectedMarkdownProduct?.id || ''}
                        onChange={(e) => {
                           setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null);
                           setHasSimulated(false);
                        }}
                        aria-label="Select Product for Markdown"
                     >
                        <option value="">Choose SKU to Simulate...</option>
                        <optgroup label="Recommended for Clearance (Low Velocity)">
                           {products.filter(p => p.salesVelocity === 'Low' || (p.stock || 0) > 30).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                           ))}
                        </optgroup>
                        <optgroup label="Other Products">
                           {products.filter(p => p.salesVelocity !== 'Low' && (p.stock || 0) <= 30).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                           ))}
                        </optgroup>
                     </select>
                  </div>

                  {selectedMarkdownProduct && (
                     <div className="p-4 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-2.5">
                        <div className="flex items-center gap-3 pb-2.5 border-b border-[#E2DCCE]/60 dark:border-white/5">
                           <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center shrink-0 overflow-hidden">
                              {selectedMarkdownProduct.image && !selectedMarkdownProduct.image.includes('placeholder.com') ? (
                                 <img
                                    src={selectedMarkdownProduct.image}
                                    className="w-full h-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                       e.currentTarget.style.display = 'none';
                                    }}
                                 />
                              ) : (
                                 <Package size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                              )}
                           </div>
                           <div className="overflow-hidden">
                              <p className="font-bold text-[#1E3F27] dark:text-white text-xs truncate">{selectedMarkdownProduct.name}</p>
                              <p className="text-[10px] text-stone-400 font-mono">{selectedMarkdownProduct.sku || 'No SKU'}</p>
                           </div>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-stone-500 dark:text-stone-400">Current Stock</span>
                           <span className="text-[#1E3F27] dark:text-white font-mono font-bold">{selectedMarkdownProduct.stock} units</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-stone-500 dark:text-stone-400">Current Price</span>
                           <span className="text-[#1E3F27] dark:text-white font-mono font-bold">{formatCompactNumber(selectedMarkdownProduct.price, { currency: CURRENCY_SYMBOL })}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-stone-500 dark:text-stone-400">Break-Even Cost</span>
                           <span className="text-stone-600 dark:text-stone-300 font-mono">{formatCompactNumber(selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7, { currency: CURRENCY_SYMBOL })}</span>
                        </div>
                     </div>
                  )}

                  <div>
                     <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1.5 block">Target Exit Date</label>
                     <input
                        type="date"
                        className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                        value={targetExitDate}
                        onChange={(e) => setTargetExitDate(e.target.value)}
                        aria-label="Target Exit Date"
                     />
                  </div>
               </div>
            </div>

            <div className="pt-5 border-t border-[#E2DCCE]/60 dark:border-white/5 space-y-2">
               <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!selectedMarkdownProduct || isMarkdownSimulating}
                  className="woody-btn-primary w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black disabled:opacity-40 cursor-pointer shadow-sm"
               >
                  {isMarkdownSimulating ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
                  <span>{isMarkdownSimulating ? 'Computing Elasticity...' : 'Generate Glide Path'}</span>
               </button>

               {hasSimulated && selectedMarkdownProduct && (
                  <button
                     type="button"
                     onClick={handleApplyPromo}
                     className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-colors cursor-pointer"
                  >
                     <Percent size={14} />
                     <span>Activate 10% Clearance Stage</span>
                  </button>
               )}
            </div>
         </div>

         {/* Right: Projected Depletion Chart & Metrics Card */}
         <div className="lg:col-span-2 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                  <div>
                     <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Projected Depletion Path</h3>
                     <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Inventory drawdown velocity vs dynamic price concessions
                     </p>
                  </div>
                  {selectedMarkdownProduct && (
                     <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 font-bold"><span className="w-2.5 h-2.5 bg-[#2C5E3B] rounded-full"></span> Revenue</span>
                        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold"><span className="w-2.5 h-2.5 bg-amber-600 rounded-full"></span> Price</span>
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Stock</span>
                     </div>
                  )}
               </div>

               {selectedMarkdownProduct ? (
                  <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                        <AreaChart data={glidePathData}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#2C5E3B" stopOpacity={0.25} />
                                 <stop offset="95%" stopColor="#2C5E3B" stopOpacity={0.0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#E2DCCE" vertical={false} opacity={0.6} />
                           <XAxis dataKey="week" stroke="#8C827A" fontSize={11} tickLine={false} />
                           <YAxis yAxisId="left" stroke="#8C827A" fontSize={11} tickLine={false} />
                           <YAxis yAxisId="right" orientation="right" stroke="#8C827A" fontSize={11} tickLine={false} />
                           <Tooltip
                              contentStyle={{
                                 backgroundColor: '#FAF8F5',
                                 border: '1px solid #E2DCCE',
                                 borderRadius: '16px',
                                 fontSize: '12px',
                                 fontWeight: 'bold',
                                 color: '#1E3F27'
                              }}
                           />
                           <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2C5E3B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="Cumulative Revenue" />
                           <Line yAxisId="right" type="monotone" dataKey="price" stroke="#D97706" strokeWidth={2} dot={{ r: 3, fill: '#D97706' }} name="Price Point" />
                           <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#DC2626" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3, fill: '#DC2626' }} name="Stock Level" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl">
                     <Package size={32} className="text-stone-300 dark:text-stone-600 mb-2" />
                     <p className="text-xs font-bold text-stone-500">Select a product on the left to simulate markdown glide path</p>
                  </div>
               )}
            </div>

            {/* Bottom Summary KPI Cards */}
            {selectedMarkdownProduct && (
               <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5">
                  <div className="p-3 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                     <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Est. Clearance Rev</span>
                     <span className="text-xs font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5 block">
                        {CURRENCY_SYMBOL} {formatCompactNumber(projectedTotalRevenue)}
                     </span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                     <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Retained Margin</span>
                     <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5 block">
                        {projectedMargin.toFixed(1)}%
                     </span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                     <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Target Depletion</span>
                     <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                        <CheckCircle2 size={12} /> 100% Exit
                     </span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
