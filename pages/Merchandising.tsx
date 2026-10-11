import React, { useMemo } from 'react';
import { Tags, Target, TrendingUp, DollarSign, LineChart as LineChartIcon, TrendingDown, BrainCircuit, Layers, Percent, Tag } from 'lucide-react';

// Split Modals
import { PromoModal } from '../components/merchandising/PromoModal';
import { RuleModal } from '../components/merchandising/RuleModal';
import { BulkDiscountModal } from '../components/merchandising/BulkDiscountModal';
import { LocationModal } from '../components/merchandising/LocationModal';
import { ProductControlModal } from '../components/merchandising/ProductControlModal';

// Split Tabs
import { MerchandisingProvider } from '../components/merchandising/MerchandisingContext';
import { PricingTab } from '../components/merchandising/PricingTab';
import { ForecastTab } from '../components/merchandising/ForecastTab';
import { MarkdownTab } from '../components/merchandising/MarkdownTab';
import { RulesTab } from '../components/merchandising/RulesTab';
import { PlanogramTab } from '../components/merchandising/PlanogramTab';
import { PromosTab } from '../components/merchandising/PromosTab';
import { ShelfTagsTab } from '../components/merchandising/ShelfTagsTab';

// Hooks
import { useMerchandisingState } from '../components/merchandising/useMerchandisingState';

export default function Pricing() {
   const state = useMerchandisingState();

   const {
      activeTab,
      setActiveTab,
      products,
      sites,
      allOrders,
      selectedIds,
      isSubmitting,

      isPromoModalOpen,
      setIsPromoModalOpen,
      newPromo,
      setNewPromo,
      handleCreatePromo,

      isRuleModalOpen,
      setIsRuleModalOpen,
      newRule,
      setNewRule,
      handleCreateRule,

      isBulkDiscountModalOpen,
      setIsBulkDiscountModalOpen,
      bulkDiscountValue,
      setBulkDiscountValue,
      handleApplyBulkDiscount,

      isLocationModalOpen,
      setIsLocationModalOpen,
      selectedLocationProduct,

      isProductControlOpen,
      setIsProductControlOpen,
      selectedControlProduct,
      refreshData,
      currencySymbol
   } = state;

   const { avgMargin, priceIndex } = useMemo(() => {
      if (!products || products.length === 0) {
         return { avgMargin: '0.0%', priceIndex: '100.0' };
      }
      const validProducts = products.filter(p => p.price > 0);
      const totalMargin = validProducts.reduce((sum, p) => {
         const cost = p.costPrice || (p.price * 0.7);
         return sum + (((p.price - cost) / p.price) * 100);
      }, 0);
      const calculatedAvgMargin = validProducts.length > 0 
         ? (totalMargin / validProducts.length).toFixed(1) + '%' 
         : '0.0%';

      const compProducts = validProducts.filter(p => p.competitorPrice && p.competitorPrice > 0);
      const calculatedPriceIndex = compProducts.length > 0
         ? ((compProducts.reduce((sum, p) => sum + (p.price / p.competitorPrice!), 0) / compProducts.length) * 100).toFixed(1)
         : '100.0';

      return { avgMargin: calculatedAvgMargin, priceIndex: calculatedPriceIndex };
   }, [products]);

   return (
      <MerchandisingProvider value={state}>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-3 mb-1">
                     <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shadow-xs">
                        <Tags size={20} />
                     </div>
                     <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--theme-text-primary)] tracking-tight">
                        Merchandising Intelligence
                     </h2>
                  </div>
                  <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm font-normal">
                     AI-driven pricing strategies, markdown optimization, and visual planograms.
                  </p>
               </div>
               <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full flex items-center gap-2">
                     <Target size={14} className="text-[var(--theme-accent)]" />
                     <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Price Index:</span>
                     <span className="text-xs font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{priceIndex}</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                     <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                     <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Avg Margin:</span>
                     <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 font-mono tabular-nums">{avgMargin}</span>
                  </div>
               </div>
            </div>

            {/* Segmented Control Tabs */}
            <div className="inline-flex p-1 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] gap-1 flex-wrap w-fit">
               <button
                  onClick={() => setActiveTab('pricing')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'pricing'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <DollarSign size={14} />
                  <span>Price Manager</span>
               </button>
               <button
                  onClick={() => setActiveTab('forecast')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'forecast'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <LineChartIcon size={14} />
                  <span>Demand Forecast</span>
               </button>
               <button
                  onClick={() => setActiveTab('markdown')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'markdown'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <TrendingDown size={14} />
                  <span>Markdown Optimizer</span>
               </button>
               <button
                  onClick={() => setActiveTab('rules')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'rules'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <BrainCircuit size={14} />
                  <span>Smart Rules</span>
               </button>
               <button
                  onClick={() => setActiveTab('planogram')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'planogram'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <Layers size={14} />
                  <span>Planogram</span>
               </button>
               <button
                  onClick={() => setActiveTab('promos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'promos'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <Percent size={14} />
                  <span>Campaigns</span>
               </button>
               <button
                  onClick={() => setActiveTab('shelf-tags')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                     activeTab === 'shelf-tags'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <Tag size={14} />
                  <span>Shelf Tags & Parity</span>
               </button>
            </div>

            {/* Tab Panels */}
            {activeTab === 'forecast' && <ForecastTab />}
            {activeTab === 'pricing' && <PricingTab />}
            {activeTab === 'markdown' && <MarkdownTab />}
            {activeTab === 'rules' && <RulesTab />}
            {activeTab === 'planogram' && <PlanogramTab />}
            {activeTab === 'promos' && <PromosTab />}
            {activeTab === 'shelf-tags' && <ShelfTagsTab />}

            {/* New Promo Modal */}
            <PromoModal
               isOpen={isPromoModalOpen}
               onClose={() => setIsPromoModalOpen(false)}
               newPromo={newPromo}
               setNewPromo={setNewPromo}
               handleCreatePromo={handleCreatePromo}
               isSubmitting={isSubmitting}
               currencySymbol={currencySymbol}
            />

            {/* Create Rule Modal */}
            <RuleModal
               isOpen={isRuleModalOpen}
               onClose={() => setIsRuleModalOpen(false)}
               newRule={newRule}
               setNewRule={setNewRule}
               handleCreateRule={handleCreateRule}
            />

            {/* Bulk Discount Modal */}
            <BulkDiscountModal
               isOpen={isBulkDiscountModalOpen}
               onClose={() => {
                  setIsBulkDiscountModalOpen(false);
                  setBulkDiscountValue('');
               }}
               selectedIdsCount={selectedIds.size}
               bulkDiscountValue={bulkDiscountValue}
               setBulkDiscountValue={setBulkDiscountValue}
               handleApplyBulkDiscount={handleApplyBulkDiscount}
               isSubmitting={isSubmitting}
            />

            {/* --- LOCATION MATRIX MODAL --- */}
            <LocationModal
               isOpen={isLocationModalOpen}
               onClose={() => setIsLocationModalOpen(false)}
               selectedLocationProduct={selectedLocationProduct}
               products={products}
               sites={sites}
               allOrders={allOrders}
               currencySymbol={currencySymbol}
            />

            {/* --- PRODUCT CONTROL MODAL --- */}
            <ProductControlModal
               product={selectedControlProduct}
               isOpen={isProductControlOpen}
               onClose={() => setIsProductControlOpen(false)}
               onSaved={refreshData}
               currencySymbol={currencySymbol}
            />
         </div>
      </MerchandisingProvider>
   );
}
