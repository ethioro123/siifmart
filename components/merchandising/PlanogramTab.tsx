import React, { useMemo } from 'react';
import { Flame, Package, MousePointer2, Plus, Sparkles, RefreshCw, Layers, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { Product } from '../../types';

export const PlanogramTab: React.FC = () => {
   const {
      showHeatmap,
      setShowHeatmap,
      swapSource,
      products,
      handleShelfSwap,
      handleMoveToShelf,
      updateProduct,
      addNotification
   } = useMerchandising();

   // 1. Dynamic Shelf Stats
   const shelfStats = useMemo(() => {
      const eyeLevelItems = products.filter(p => p.shelfPosition === 'Eye Level');
      const topShelfItems = products.filter(p => p.shelfPosition === 'Top Shelf');
      const bottomShelfItems = products.filter(p => p.shelfPosition === 'Bottom Shelf' || (!p.shelfPosition && false));

      const eyeVelocity = eyeLevelItems.reduce((acc, p) => acc + (p.salesVelocity === 'High' ? 120 : p.salesVelocity === 'Medium' ? 60 : 15), 0);
      const topVelocity = topShelfItems.reduce((acc, p) => acc + (p.salesVelocity === 'High' ? 90 : p.salesVelocity === 'Medium' ? 40 : 10), 0);
      const bottomVelocity = bottomShelfItems.reduce((acc, p) => acc + (p.salesVelocity === 'High' ? 70 : p.salesVelocity === 'Medium' ? 30 : 8), 0);

      const lowOnEyeLevel = eyeLevelItems.filter(p => p.salesVelocity === 'Low');
      const highNotOnEyeLevel = products.filter(p => p.salesVelocity === 'High' && p.shelfPosition !== 'Eye Level');

      return {
         eyeVelocity: Math.max(120, eyeVelocity),
         topVelocity: Math.max(45, topVelocity),
         bottomVelocity: Math.max(30, bottomVelocity),
         lowOnEyeLevel,
         highNotOnEyeLevel
      };
   }, [products]);

   // 2. Real Functional Auto-Optimization
   const handleAutoOptimize = async () => {
      const highVelocityToPromote = products.filter(p => p.salesVelocity === 'High' && p.shelfPosition !== 'Eye Level').slice(0, 3);
      const lowVelocityToDemote = products.filter(p => p.shelfPosition === 'Eye Level' && p.salesVelocity === 'Low').slice(0, 3);

      if (highVelocityToPromote.length === 0 && lowVelocityToDemote.length === 0) {
         addNotification('info', 'Planogram is already optimized for maximum customer visibility.');
         return;
      }

      try {
         const updates: Promise<any>[] = [];
         highVelocityToPromote.forEach(p => {
            updates.push(updateProduct({ ...p, shelfPosition: 'Eye Level' }));
         });
         lowVelocityToDemote.forEach(p => {
            updates.push(updateProduct({ ...p, shelfPosition: 'Bottom Shelf' }));
         });

         await Promise.all(updates);
         addNotification('success', `Planogram optimized: Promoted ${highVelocityToPromote.length} high-velocity items to Eye Level.`);
      } catch (err: any) {
         addNotification('alert', `Failed to optimize shelf layout: ${err.message || 'Unknown error'}`);
      }
   };

   return (
      <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl shadow-sm overflow-hidden animate-in fade-in">
         {/* Top Header Toolbar */}
         <div className="p-5 sm:p-6 border-b border-[#E2DCCE]/60 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center bg-[#FAF8F5]/80 dark:bg-black/20">
            <div>
               <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Interactive Shelf Planogram
               </h3>
               <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                  Click a product to select, then click another to swap or place into target shelf tier.
               </p>
            </div>
            <div className="flex items-center gap-3">
               <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
                     showHeatmap
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-sm'
                        : 'bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]'
                  }`}
               >
                  <Flame size={14} className={showHeatmap ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'} />
                  <span>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
               </button>
            </div>
         </div>

         <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shelf Visualization (Zone B - Aisle 4) */}
            <div className="lg:col-span-2 bg-[#FAF8F5]/60 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-6 sm:p-8 relative flex flex-col justify-between">
               <div className="flex items-center justify-between pb-4 mb-2 border-b border-[#E2DCCE]/60 dark:border-white/5">
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono font-bold">
                     Zone B • Aisle 4 Center Gondola
                  </span>
                  {showHeatmap && (
                     <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-[#A9CBA2]"><span className="w-2 h-2 rounded-full bg-[#2C5E3B]"></span> High Vel</span>
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Med</span>
                        <span className="flex items-center gap-1 text-stone-400"><span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700"></span> Low</span>
                     </div>
                  )}
               </div>

               <div className="space-y-8 my-auto">
                  {['Top Shelf', 'Eye Level', 'Bottom Shelf'].map((shelf) => {
                     const shelfProducts = products.filter(p => p.shelfPosition === shelf || (shelf === 'Bottom Shelf' && !p.shelfPosition)).slice(0, 5);
                     const isEyeLevel = shelf === 'Eye Level';

                     return (
                        <div key={shelf} className="relative">
                           <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                 isEyeLevel ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-500 dark:text-stone-400'
                              }`}>
                                 {shelf}
                                 {isEyeLevel && (
                                    <span className="text-[9px] bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 px-1.5 py-0.5 rounded font-black">
                                       Prime Tier
                                    </span>
                                 )}
                              </span>
                           </div>

                           <div
                              className={`h-28 border-b-8 border-[#CFC6B4] dark:border-[#2C3830] flex items-end px-3 gap-3 rounded-b-lg relative transition-colors ${
                                 isEyeLevel ? 'bg-emerald-50/40 dark:bg-[#2C5E3B]/10 border-emerald-800/40' : 'bg-white/70 dark:bg-black/20'
                              }`}
                           >
                              {shelfProducts.map((p) => {
                                 const isHot = p.salesVelocity === 'High';
                                 const isMedium = p.salesVelocity === 'Medium';
                                 const isSelected = swapSource === p.id;

                                 return (
                                    <div
                                       key={p.id}
                                       onClick={() => handleShelfSwap(p.id)}
                                       className={`w-16 h-22 rounded-2xl transition-all cursor-pointer relative group/prod overflow-hidden border-2 flex flex-col justify-between p-1.5 shrink-0 ${
                                          isSelected
                                             ? 'border-amber-500 scale-105 shadow-md z-10 bg-amber-50 dark:bg-amber-950/30'
                                             : 'border-transparent hover:border-[#2C5E3B]/40 bg-white dark:bg-[#18201B]'
                                       } ${
                                          showHeatmap && isHot
                                             ? 'ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40'
                                             : showHeatmap && isMedium
                                             ? 'ring-1 ring-amber-500 bg-amber-50/80 dark:bg-amber-950/30'
                                             : ''
                                       }`}
                                    >
                                       <div className="w-full h-11 bg-[#FAF8F5] dark:bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-[#E2DCCE]/60 dark:border-white/5">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
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
                                          <p className="text-[9px] font-black text-[#1E3F27] dark:text-white truncate leading-tight">{p.name}</p>
                                          <p className="text-[8px] text-stone-400 font-mono">{p.sku || p.category}</p>
                                       </div>

                                       {isSelected && (
                                          <div className="absolute inset-0 bg-[#1E3F27]/70 flex flex-col items-center justify-center text-amber-300">
                                             <MousePointer2 size={13} className="animate-bounce" />
                                             <span className="text-[8px] font-black uppercase mt-0.5">Swap</span>
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}

                              {/* Place Button when an item is selected */}
                              {swapSource && (
                                 <button
                                    type="button"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleMoveToShelf(shelf);
                                    }}
                                    className="h-22 w-16 border-2 border-dashed border-[#2C5E3B]/60 dark:border-[#A9CBA2]/40 rounded-2xl flex flex-col items-center justify-center text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-emerald-50 dark:hover:bg-[#2C5E3B]/20 transition-all cursor-pointer mb-1 shrink-0"
                                    title={`Place product on ${shelf}`}
                                 >
                                    <Plus size={15} />
                                    <span>Place</span>
                                 </button>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Right: Unassigned Items + Shelf Efficiency Metrics */}
            <div className="space-y-5">
               {/* 1. Unassigned SKUs Queue */}
               <div className="bg-[#FAF8F5]/60 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 p-5 max-h-[260px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E2DCCE]/60 dark:border-white/5 sticky top-0 bg-[#FAF8F5] dark:bg-[#18201B] z-10">
                     <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">
                        Unassigned Catalog ({products.filter(p => !p.shelfPosition).length})
                     </h4>
                     <span className="text-[10px] text-stone-400 font-medium">Click to Stage</span>
                  </div>

                  <div className="space-y-2">
                     {products
                        .filter(p => !p.shelfPosition)
                        .slice(0, 8)
                        .map(p => (
                           <div
                              key={p.id}
                              onClick={() => handleShelfSwap(p.id)}
                              className={`flex items-center gap-2.5 p-2 rounded-2xl hover:bg-white dark:hover:bg-white/5 cursor-pointer border transition-all ${
                                 swapSource === p.id
                                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
                                    : 'border-[#E2DCCE]/40 dark:border-white/5 bg-white/60 dark:bg-black/20'
                              }`}
                           >
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center shrink-0 overflow-hidden">
                                 {p.image && !p.image.includes('placeholder.com') ? (
                                    <img
                                       src={p.image}
                                       className="w-full h-full object-cover"
                                       alt=""
                                       onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                       }}
                                    />
                                 ) : (
                                    <Package size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs text-[#1E3F27] dark:text-white font-bold truncate">{p.name}</p>
                                 <p className="text-[10px] text-stone-400 font-mono">{p.sku || p.category}</p>
                              </div>
                              {swapSource === p.id && <MousePointer2 size={12} className="text-amber-500" />}
                           </div>
                        ))}

                     {products.filter(p => !p.shelfPosition).length > 8 && (
                        <p className="text-[10px] text-center text-stone-400 font-medium pt-1">
                           +{products.filter(p => !p.shelfPosition).length - 8} more SKUs in inventory
                        </p>
                     )}
                  </div>
               </div>

               {/* 2. Shelf Efficiency Card */}
               <div className="p-5 bg-[#FAF8F5]/60 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-3">
                  <h4 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Shelf Tier Velocity</h4>
                  <div className="space-y-2.5">
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black">Eye Level (Prime)</span>
                           <span className="text-stone-700 dark:text-white font-mono font-bold">{shelfStats.eyeVelocity} units/wk</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-black/50 rounded-full overflow-hidden">
                           <div className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] w-[82%] rounded-full"></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-stone-500 dark:text-stone-400 font-bold">Top Shelf</span>
                           <span className="text-stone-700 dark:text-white font-mono font-bold">{shelfStats.topVelocity} units/wk</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-black/50 rounded-full overflow-hidden">
                           <div className="h-full bg-stone-400 dark:bg-stone-600 w-[38%] rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 3. Real Auto-Optimization Action Card */}
               <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 rounded-2xl border border-emerald-200 dark:border-emerald-950/30 text-xs text-[#1E3F27] dark:text-stone-200 leading-snug">
                  <div className="flex items-center gap-1.5 text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase text-[10px] mb-1">
                     <Sparkles size={13} />
                     <span>Merchandising Optimization</span>
                  </div>
                  {shelfStats.highNotOnEyeLevel.length > 0 ? (
                     <span>
                        {shelfStats.highNotOnEyeLevel.length} high-velocity items detected off Prime Tier. Auto-promote to Eye Level.
                     </span>
                  ) : (
                     <span>All high-velocity products are currently stationed on Prime Eye Level shelf.</span>
                  )}
               </div>

               <button
                  type="button"
                  onClick={handleAutoOptimize}
                  className="woody-btn-primary w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm"
               >
                  <RefreshCw size={14} />
                  <span>Auto-Optimize Planogram</span>
               </button>
            </div>
         </div>
      </div>
   );
};
