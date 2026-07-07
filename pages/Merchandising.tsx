import React from 'react';
import { Tags, Target, TrendingUp, DollarSign, LineChart as LineChartIcon, TrendingDown, BrainCircuit, Layers, Percent } from 'lucide-react';

// Split Modals
import { PromoModal } from '../components/merchandising/PromoModal';
import { RuleModal } from '../components/merchandising/RuleModal';
import { BulkDiscountModal } from '../components/merchandising/BulkDiscountModal';
import { LocationModal } from '../components/merchandising/LocationModal';

// Split Tabs
import { MerchandisingProvider } from '../components/merchandising/MerchandisingContext';
import { PricingTab } from '../components/merchandising/PricingTab';
import { ForecastTab } from '../components/merchandising/ForecastTab';
import { MarkdownTab } from '../components/merchandising/MarkdownTab';
import { RulesTab } from '../components/merchandising/RulesTab';
import { PlanogramTab } from '../components/merchandising/PlanogramTab';
import { PromosTab } from '../components/merchandising/PromosTab';

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
      selectedLocationProduct
   } = state;

   return (
      <MerchandisingProvider value={state}>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                     <Tags className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     Merchandising Intelligence
                  </h2>
                  <p className="text-stone-500 dark:text-gray-400 text-sm">AI-driven pricing strategies, markdown optimization, and visual planograms.</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 rounded-xl flex items-center gap-2">
                     <Target size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     <span className="text-xs text-stone-500 dark:text-gray-400">Price Index:</span>
                     <span className="text-sm font-bold text-[#1E3F27] dark:text-white font-mono">98.5</span>
                  </div>
                  <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                     <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                     <span className="text-xs text-stone-500 dark:text-gray-400">Avg Margin:</span>
                     <span className="text-sm font-bold text-[#1E3F27] dark:text-white font-mono">32.5%</span>
                  </div>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1.5 bg-stone-100/80 dark:bg-black/25 p-1 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20 w-fit overflow-x-auto scrollbar-hide">
               <button
                  onClick={() => setActiveTab('pricing')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'pricing'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <DollarSign size={14} />
                  <span>Price Manager</span>
               </button>
               <button
                  onClick={() => setActiveTab('forecast')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'forecast'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <LineChartIcon size={14} />
                  <span>Demand Forecast</span>
               </button>
               <button
                  onClick={() => setActiveTab('markdown')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'markdown'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <TrendingDown size={14} />
                  <span>Markdown Optimizer</span>
               </button>
               <button
                  onClick={() => setActiveTab('rules')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'rules'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <BrainCircuit size={14} />
                  <span>Smart Rules</span>
               </button>
               <button
                  onClick={() => setActiveTab('planogram')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'planogram'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <Layers size={14} />
                  <span>Planogram</span>
               </button>
               <button
                  onClick={() => setActiveTab('promos')}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                     activeTab === 'promos'
                        ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                        : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <Percent size={14} />
                  <span>Campaigns</span>
               </button>
            </div>

            {/* Tab Panels */}
            {activeTab === 'forecast' && <ForecastTab />}
            {activeTab === 'pricing' && <PricingTab />}
            {activeTab === 'markdown' && <MarkdownTab />}
            {activeTab === 'rules' && <RulesTab />}
            {activeTab === 'planogram' && <PlanogramTab />}
            {activeTab === 'promos' && <PromosTab />}

            {/* New Promo Modal */}
            <PromoModal
               isOpen={isPromoModalOpen}
               onClose={() => setIsPromoModalOpen(false)}
               newPromo={newPromo}
               setNewPromo={setNewPromo}
               handleCreatePromo={handleCreatePromo}
               isSubmitting={isSubmitting}
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
            />
         </div>
      </MerchandisingProvider>
   );
}
