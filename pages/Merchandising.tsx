import { ProductApprovalInboxButton } from '../components/approvals/ProductApprovalInboxButton';
import { PriceBatchPreview } from '../components/merchandising/components/PriceBatchPreview';
import { useSearchParams } from 'react-router-dom';
import { sellingMargin } from '../utils/priceManager';
import { effectivePrice } from '../utils/pricingGovernance';
import React, { useMemo, useEffect } from 'react';
import { Tags, Target, TrendingUp, DollarSign, LineChart as LineChartIcon, TrendingDown, BrainCircuit, Layers, Percent, Tag, ClipboardCheck } from 'lucide-react';

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
import { MerchandisingReviewsTab } from '../components/merchandising/MerchandisingReviewsTab';

// Hooks
import { useMerchandisingState } from '../components/merchandising/useMerchandisingState';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { RegionalScopeBanner } from '../components/regional-ops/RegionalScopeBanner';

export default function Pricing() {
   const state = useMerchandisingState();
   const [searchParams] = useSearchParams();
   useEffect(() => { if (searchParams.get('tab') === 'reviews') state.setActiveTab('reviews'); else if (searchParams.get('tab') === 'promos') state.setActiveTab('promos'); }, [searchParams, state.setActiveTab]);
   const { user } = useStore();
   const { isRegionalUser } = useData();

   const isRegionalStaff = isRegionalUser || user?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL' || ['regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'store_manager'].includes(user?.role || '');

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
      isCreatingRule,
      ruleValidationErrors,

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
      currencySymbol,
      activeCountry
   } = state;
   const { activeRegionCode } = useData();

   const { avgMargin, priceIndex } = useMemo(() => {
      if (!products || products.length === 0) {
         return { avgMargin: '—', priceIndex: '—' };
      }
      const marginProducts = products.filter(p => sellingMargin(p) !== null);
      const totalMargin = marginProducts.reduce((sum, p) => sum + (sellingMargin(p) || 0), 0);
      const calculatedAvgMargin = marginProducts.length > 0
         ? (totalMargin / marginProducts.length).toFixed(1) + '%'
         : '—';
      const pricedProducts = products.filter(p => p.price > 0);

      const compProducts = pricedProducts.filter(p => p.competitorPrice && p.competitorPrice > 0);
      const calculatedPriceIndex = compProducts.length > 0
         ? ((compProducts.reduce((sum, p) => sum + ((effectivePrice(p) || 0) / p.competitorPrice!), 0) / compProducts.length) * 100).toFixed(1)
         : '—';

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
                     Pricing and promotion planning, markdown review, and store display execution.
                  </p>
               </div>
               <div className="flex items-center gap-2.5 flex-wrap">
                  <ProductApprovalInboxButton />
                  <div className="px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full flex items-center gap-2">
                     <Target size={14} className="text-[var(--theme-accent)]" />
                     <span className="text-xs text-[var(--theme-text-secondary)] font-medium">{activeTab === 'pricing' ? 'Page Price Index:' : 'Price Index:'}</span>
                     <span className="text-xs font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{priceIndex}</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-full flex items-center gap-2">
                     <TrendingUp size={14} className="text-[var(--theme-status-success-text)]" aria-hidden="true" />
                     <span className="text-xs text-[var(--theme-status-success-text)] font-medium">{activeTab === 'pricing' ? 'Page Avg Margin:' : 'Avg Margin:'}</span>
                     <span className="text-xs font-semibold text-[var(--theme-status-success-text)] font-mono tabular-nums">{avgMargin}</span>
                  </div>
               </div>
            </div>

            {/* Adaptive Regional Territory Lens */}
            <RegionalScopeBanner
               moduleName="Merchandising"
               guardrailBadge={
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] text-xs font-semibold">
                     <span>Corporate Margin Floor: 15.0% Min</span>
                  </div>
               }
            />

            {/* Segmented Control Tabs */}
            <div role="group" aria-label="Merchandising sections" className="flex w-full max-w-full flex-nowrap overflow-x-auto p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] gap-1">
               <button type="button" aria-pressed={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${activeTab === 'reviews' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-transparent'}`}>
                  <ClipboardCheck size={14} /> Proposals
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'pricing'}
                  onClick={() => setActiveTab('pricing')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'pricing'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <DollarSign size={14} />
                  <span>Price Manager</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'forecast'}
                  onClick={() => setActiveTab('forecast')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'forecast'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <LineChartIcon size={14} />
                  <span>Demand Forecast</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'markdown'}
                  onClick={() => setActiveTab('markdown')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'markdown'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <TrendingDown size={14} />
                  <span>Markdown Optimizer</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'rules'}
                  onClick={() => setActiveTab('rules')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'rules'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <BrainCircuit size={14} />
                  <span>Smart Rules</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'planogram'}
                  onClick={() => setActiveTab('planogram')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'planogram'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <Layers size={14} />
                  <span>Planogram</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'promos'}
                  onClick={() => setActiveTab('promos')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                     activeTab === 'promos'
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-border)]'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                  }`}
               >
                  <Percent size={14} />
                  <span>Campaigns</span>
               </button>
               <button
                  type="button"
                  aria-pressed={activeTab === 'shelf-tags'}
                  onClick={() => setActiveTab('shelf-tags')}
                  className={`min-h-11 shrink-0 flex items-center gap-2 px-4 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
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
            {activeTab === 'reviews' && <MerchandisingReviewsTab />}

            {/* New Promo Modal */}
            <PromoModal
               isOpen={isPromoModalOpen}
               onClose={() => setIsPromoModalOpen(false)}
               newPromo={newPromo}
               setNewPromo={setNewPromo}
               handleCreatePromo={handleCreatePromo}
               isSubmitting={isSubmitting}
               currencySymbol={currencySymbol}
               activeCountry={activeCountry}
               activeRegionCode={activeRegionCode}
            />

            {/* Create Rule Modal */}
            <RuleModal
               isOpen={isRuleModalOpen}
               onClose={() => setIsRuleModalOpen(false)}
               newRule={newRule}
               setNewRule={setNewRule}
               handleCreateRule={handleCreateRule}
               isSubmitting={isCreatingRule}
               errors={ruleValidationErrors}
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

            <PriceBatchPreview batch={state.priceBatch} failures={state.batchFailures} sites={sites} currency={currencySymbol} pending={isSubmitting} onConfirm={state.confirmPriceBatch} onClose={state.cancelPriceBatch} />
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
