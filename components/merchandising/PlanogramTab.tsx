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
      submitPlanogram,
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
         await submitPlanogram([
            ...highVelocityToPromote.map(product => ({ product, shelfPosition: 'Eye Level' })),
            ...lowVelocityToDemote.map(product => ({ product, shelfPosition: 'Bottom Shelf' }))
         ]);
      } catch (err: any) {
         addNotification('alert', `Failed to optimize shelf layout: ${err.message || 'Unknown error'}`);
      }
   };

   return (
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-sm overflow-hidden animate-in fade-in">
         {/* Top Header Toolbar */}
         <div className="p-5 sm:p-6 border-b border-[var(--theme-border)] flex flex-wrap gap-4 justify-between items-center bg-[var(--theme-bg-subtle)]/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Layers size={20} />
               </div>
               <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                     Interactive Shelf Planogram
                  </h3>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                     Click a product to select, then click another to swap or place into target shelf tier.
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                     showHeatmap
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm'
                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                  }`}
               >
                  <Flame size={14} className={showHeatmap ? 'text-amber-500' : 'text-[var(--theme-text-secondary)]'} />
                  <span>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
               </button>
            </div>
         </div>

         <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shelf Visualization (Zone B - Aisle 4) */}
            <div className="lg:col-span-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 relative flex flex-col justify-between">
               <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border)]">
                  <span className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono font-medium">
                     Zone B • Aisle 4 Center Gondola
                  </span>
                  {showHeatmap && (
                     <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span> High Vel
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                           <span className="w-2 h-2 rounded-full bg-amber-500"></span> Med
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] font-medium">
                           <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-600"></span> Low
                        </span>
                     </div>
                  )}
               </div>

               <div className="space-y-6 my-auto">
                  {['Top Shelf', 'Eye Level', 'Bottom Shelf'].map((shelf) => {
                     const shelfProducts = products.filter(p => p.shelfPosition === shelf || (shelf === 'Bottom Shelf' && !p.shelfPosition)).slice(0, 5);
                     const isEyeLevel = shelf === 'Eye Level';

                     return (
                        <div key={shelf} className="relative">
                           <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                                 isEyeLevel ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'
                              }`}>
                                 {shelf}
                                 {isEyeLevel && (
                                    <span className="text-[10px] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase">
                                       Prime Tier
                                    </span>
                                 )}
                              </span>
                           </div>

                           <div
                              className={`h-28 border-b-4 border-[var(--theme-border)] flex items-end px-3 gap-3 rounded-b-xl relative transition-colors ${
                                 isEyeLevel ? 'bg-[var(--theme-accent)]/5 border-b-[var(--theme-accent)]/40' : 'bg-[var(--theme-bg-card)]/50'
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
                                       className={`w-16 h-22 rounded-xl transition-all cursor-pointer relative group/prod overflow-hidden border flex flex-col justify-between p-1.5 shrink-0 ${
                                          isSelected
                                             ? 'border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/30 scale-105 shadow-md z-10 bg-[var(--theme-bg-card)]'
                                             : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 bg-[var(--theme-bg-card)]'
                                       } ${
                                          showHeatmap && isHot
                                             ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10'
                                             : showHeatmap && isMedium
                                             ? 'ring-1 ring-amber-500/50 bg-amber-500/10'
                                             : ''
                                       }`}
                                    >
                                       <div className="w-full h-11 bg-[var(--theme-bg-subtle)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--theme-border)]">
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
                                             <Package size={16} className="text-[var(--theme-accent)]" />
                                          )}
                                       </div>

                                       <div className="overflow-hidden">
                                          <p className="text-[10px] font-semibold text-[var(--theme-text-primary)] truncate leading-tight">{p.name}</p>
                                          <p className="text-[9px] text-[var(--theme-text-secondary)] font-mono">{p.sku || p.category}</p>
                                       </div>

                                       {isSelected && (
                                          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                             <MousePointer2 size={13} className="animate-bounce" />
                                             <span className="text-[8px] font-semibold uppercase mt-0.5 tracking-wider">Swap</span>
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
                                    className="h-22 w-16 border-2 border-dashed border-[var(--theme-accent)]/50 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors cursor-pointer mb-1 shrink-0"
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
               <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] p-4 max-h-[260px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--theme-border)] sticky top-0 bg-[var(--theme-bg-subtle)] z-10">
                     <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                        Unassigned Catalog ({products.filter(p => !p.shelfPosition).length})
                     </h4>
                     <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Click to Stage</span>
                  </div>

                  <div className="space-y-2">
                     {products
                        .filter(p => !p.shelfPosition)
                        .slice(0, 8)
                        .map(p => (
                           <div
                              key={p.id}
                              onClick={() => handleShelfSwap(p.id)}
                              className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--theme-bg-card)] cursor-pointer border transition-all ${
                                 swapSource === p.id
                                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                                    : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)]/60'
                              }`}
                           >
                              <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
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
                                    <Package size={14} className="text-[var(--theme-accent)]" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs text-[var(--theme-text-primary)] font-medium truncate">{p.name}</p>
                                 <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">{p.sku || p.category}</p>
                              </div>
                              {swapSource === p.id && <MousePointer2 size={12} className="text-[var(--theme-accent)]" />}
                           </div>
                        ))}

                     {products.filter(p => !p.shelfPosition).length > 8 && (
                        <p className="text-[10px] text-center text-[var(--theme-text-secondary)] font-medium pt-1">
                           +{products.filter(p => !p.shelfPosition).length - 8} more SKUs in inventory
                        </p>
                     )}
                  </div>
               </div>

               {/* 2. Shelf Efficiency Card */}
               <div className="p-5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-3.5">
                  <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Shelf Tier Velocity</h4>
                  <div className="space-y-3">
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="text-[var(--theme-accent)] font-semibold">Eye Level (Prime)</span>
                           <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{shelfStats.eyeVelocity} units/wk</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--theme-accent)] w-[82%] rounded-full"></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="text-[var(--theme-text-secondary)] font-medium">Top Shelf</span>
                           <span className="text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">{shelfStats.topVelocity} units/wk</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--theme-text-secondary)]/40 w-[38%] rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 3. Real Auto-Optimization Action Card */}
               <div className="p-4 bg-[var(--theme-accent)]/10 rounded-2xl border border-[var(--theme-accent)]/20 text-xs text-[var(--theme-text-primary)] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[var(--theme-accent)] font-semibold uppercase text-[10px] mb-1.5">
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
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer shadow-sm transition-opacity"
               >
                  <RefreshCw size={14} />
                  <span>Auto-Optimize Planogram</span>
               </button>
            </div>
         </div>
      </div>
   );
};
