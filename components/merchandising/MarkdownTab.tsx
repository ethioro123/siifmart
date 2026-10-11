import React, { useState, useMemo } from 'react';
import { Package, Loader2, Calculator, TrendingDown, Percent, CheckCircle2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useMerchandising } from './MerchandisingContext';
import { formatCompactNumber } from '../../utils/formatting';
import { useSubmitPriceChanges } from '../../hooks/useSubmitPriceChanges';

export const MarkdownTab: React.FC = () => {
   const {
      selectedMarkdownProduct,
      setSelectedMarkdownProduct,
      products,
      isMarkdownSimulating,
      calculateMarkdown,
      addNotification,
      activeCountry,
      currencySymbol,
      salesMetricsIndex
   } = useMerchandising();
   const { submit } = useSubmitPriceChanges(activeCountry);

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
         await submit(
            [{
               product: selectedMarkdownProduct,
               proposal: {
                  price: selectedMarkdownProduct.price,
                  costPrice: selectedMarkdownProduct.costPrice,
                  isOnSale: true,
                  salePrice: stage2Price
               }
            }],
            `Markdown clearance stage 2 (${currencySymbol} ${stage2Price})`
         );
      } catch (err: any) {
         addNotification('alert', `Failed to submit markdown: ${err.message || 'Unknown error'}`);
      }
   };

   const projectedTotalRevenue = glidePathData.length > 0 ? glidePathData[glidePathData.length - 1].revenue : 0;
   const estimatedCost = selectedMarkdownProduct ? (selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7) * (selectedMarkdownProduct.stock || 50) : 0;
   const projectedMargin = projectedTotalRevenue > 0 ? ((projectedTotalRevenue - estimatedCost) / projectedTotalRevenue) * 100 : 0;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
         {/* Left: Clearance Parameters Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-3 pb-3 mb-4 border-b border-[var(--theme-border)]">
                  <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                     <TrendingDown size={18} />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Clearance Strategy</h3>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Automated markdown decay</p>
                  </div>
               </div>
               <p className="text-xs text-[var(--theme-text-secondary)] mb-5 leading-relaxed">
                  Calculate optimal discount schedules to clear slow-moving inventory by a target date without sacrificing unnecessary margin.
               </p>

               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">Select Product</label>
                     <select
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                        value={selectedMarkdownProduct?.id || ''}
                        onChange={(e) => {
                           setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null);
                           setHasSimulated(false);
                        }}
                        aria-label="Select Product for Markdown"
                     >
                        <option value="">Choose SKU to Simulate...</option>
                        <optgroup label="Recommended for Clearance (High Days of Supply / Low Run-Rate)">
                           {products.filter(p => {
                              const m = salesMetricsIndex?.get(p.id);
                              return m?.needsMarkdown ?? (p.salesVelocity === 'Low' || (p.stock || 0) > 30);
                           }).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                           ))}
                        </optgroup>
                        <optgroup label="Other Catalog Products">
                           {products.filter(p => {
                              const m = salesMetricsIndex?.get(p.id);
                              return !(m?.needsMarkdown ?? (p.salesVelocity === 'Low' || (p.stock || 0) > 30));
                           }).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                           ))}
                        </optgroup>
                     </select>
                  </div>

                  {selectedMarkdownProduct && (
                     <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-2.5">
                        <div className="flex items-center gap-3 pb-2.5 border-b border-[var(--theme-border)]">
                           <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
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
                                 <Package size={16} className="text-[var(--theme-text-secondary)]" />
                              )}
                           </div>
                           <div className="overflow-hidden">
                              <p className="font-semibold text-xs text-[var(--theme-text-primary)] truncate leading-tight">{selectedMarkdownProduct.name}</p>
                              <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">{selectedMarkdownProduct.sku || 'No SKU'}</p>
                           </div>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-[var(--theme-text-secondary)]">Current Stock</span>
                           <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{selectedMarkdownProduct.stock} units</span>
                        </div>
                        {selectedMarkdownProduct && salesMetricsIndex?.get(selectedMarkdownProduct.id) && (
                           <>
                              <div className="flex justify-between text-xs">
                                 <span className="text-[var(--theme-text-secondary)]">30-Day POS Sales</span>
                                 <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">
                                    {salesMetricsIndex.get(selectedMarkdownProduct.id)?.unitsSold30d || 0} units ({salesMetricsIndex.get(selectedMarkdownProduct.id)?.dailyRunRate || 0}/day)
                                 </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                 <span className="text-[var(--theme-text-secondary)]">Days of Supply</span>
                                 <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">
                                    {salesMetricsIndex.get(selectedMarkdownProduct.id)?.daysOfSupply || 0} days
                                 </span>
                              </div>
                           </>
                        )}
                        <div className="flex justify-between text-xs">
                           <span className="text-[var(--theme-text-secondary)]">Current Price</span>
                           <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{formatCompactNumber(selectedMarkdownProduct.price, { currency: currencySymbol })}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-[var(--theme-text-secondary)]">Break-Even Cost</span>
                           <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums">{formatCompactNumber(selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7, { currency: currencySymbol })}</span>
                        </div>
                     </div>
                  )}

                  <div>
                     <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5 block">Target Exit Date</label>
                     <input
                        type="date"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium transition-colors"
                        value={targetExitDate}
                        onChange={(e) => setTargetExitDate(e.target.value)}
                        aria-label="Target Exit Date"
                     />
                  </div>
               </div>
            </div>

            <div className="pt-5 border-t border-[var(--theme-border)] space-y-2 mt-4">
               <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!selectedMarkdownProduct || isMarkdownSimulating}
                  className="w-full py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-sm transition-colors"
               >
                  {isMarkdownSimulating ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
                  <span>{isMarkdownSimulating ? 'Computing Elasticity...' : 'Generate Glide Path'}</span>
               </button>

               {hasSimulated && selectedMarkdownProduct && (
                  <button
                     type="button"
                     onClick={handleApplyPromo}
                     className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                     <Percent size={14} />
                     <span>Activate 10% Clearance Stage</span>
                  </button>
               )}
            </div>
         </div>

         {/* Right: Projected Depletion Chart & Metrics Card */}
         <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--theme-border)]">
                  <div>
                     <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Projected Depletion Path</h3>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Inventory drawdown velocity vs dynamic price concessions
                     </p>
                  </div>
                  {selectedMarkdownProduct && (
                     <div className="flex items-center gap-3 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1.5 rounded-full font-medium">
                        <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-[var(--theme-accent)] rounded-full"></span> Revenue</span>
                        <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Price</span>
                        <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Stock</span>
                     </div>
                  )}
               </div>

               {selectedMarkdownProduct ? (
                  <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                        <AreaChart data={glidePathData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} opacity={0.6} />
                           <XAxis dataKey="week" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                           <YAxis yAxisId="left" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                           <YAxis yAxisId="right" orientation="right" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                           <Tooltip
                              contentStyle={{
                                 backgroundColor: 'var(--theme-bg-card)',
                                 border: '1px solid var(--theme-border)',
                                 borderRadius: '14px',
                                 fontSize: '12px',
                                 fontWeight: 500,
                                 color: 'var(--theme-text-primary)',
                                 boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                              }}
                           />
                           <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={2.5} fillOpacity={0.08} fill="var(--theme-accent)" name="Cumulative Revenue" />
                           <Line yAxisId="right" type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} name="Price Point" />
                           <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#EF4444" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} name="Stock Level" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-2xl p-6">
                     <Package size={32} className="text-[var(--theme-text-tertiary)] mb-2" />
                     <p className="text-xs font-medium text-[var(--theme-text-secondary)]">Select a product on the left to simulate markdown glide path</p>
                  </div>
               )}
            </div>

            {/* Bottom Summary KPI Cards */}
            {selectedMarkdownProduct && (
               <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--theme-border)] mt-4">
                  <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                     <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Est. Clearance Rev</span>
                     <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5 block">
                        {currencySymbol} {formatCompactNumber(projectedTotalRevenue)}
                     </span>
                  </div>
                  <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                     <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Retained Margin</span>
                     <span className="text-xs font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 block">
                        {projectedMargin.toFixed(1)}%
                     </span>
                  </div>
                  <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                     <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Target Depletion</span>
                     <span className="text-xs font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                        <CheckCircle2 size={13} /> 100% Exit
                     </span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
