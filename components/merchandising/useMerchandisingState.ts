import { priceManagerService } from '../../services/price-manager.service';
import { usePriceManagerCatalog } from '../../hooks/usePriceManagerCatalog';
import { usePriceManagerBatch } from '../../hooks/usePriceManagerBatch';
import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../../constants';
import type { Product, Promotion, PricingRule } from '../../types';
import type { MerchandisingContextType, MerchandisingTab } from './MerchandisingContext';
import { useMerchandisingFilters } from './hooks/useMerchandisingFilters';
import { matchRuleProduct, calculateRulePrice } from './utils/ruleEvaluator';
import { runMerchandisingSimulation } from './utils/simulationRunner';
import { logger } from '../../utils/logger';
import { getCountryProfile, Country } from '../../utils/localization';
import { usePricingRules } from '../../hooks/usePricingRules';
import { usePricingRulesActions } from './hooks/usePricingRulesActions';
import { useSubmitPriceChanges, type PriceChangeInput } from '../../hooks/useSubmitPriceChanges';
import { useSubmitMerchandisingChanges } from '../../hooks/useSubmitMerchandisingChanges';
import { useMerchandisingCampaigns } from '../../hooks/useMerchandisingCampaigns';
import { buildCatalogSalesMetricsIndex } from '../../utils/merchandisingAnalytics';

const getMargin = (price: number, cost: number) => {
   if (!price || !cost) return 0;
   return ((price - cost) / price) * 100;
};

export const useMerchandisingState = (): MerchandisingContextType => {
   const {
      addNotification,
      allProducts: cachedProducts,
      updateProduct,
      updatePricesBySKU,
      promotions,
      addPromotion,
      sites,
      allOrders,
      sales,
      refreshData,
      effectiveCountry,
      settings, activeSite, activeRegionCode
   } = useData();

   const activeCountry = (effectiveCountry || settings?.country || 'ET') as Country;
   const countryProfile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
   const currencySymbol = countryProfile.currencySymbol || CURRENCY_SYMBOL;

   const countryPromotions = useMemo(() => {
      return (promotions || []).filter(p => {
         const pCountry = p.country_code || p.country;
         return !pCountry || pCountry.toUpperCase() === activeCountry.toUpperCase();
      });
   }, [promotions, activeCountry]);

   const [activeTab, setActiveTab] = useState<MerchandisingTab>('pricing');
   const {
      rules: pricingRules,
      isLoading: pricingRulesLoading,
      isMutating: pricingRulesMutating,
      error: pricingRulesError,
      retry: retryPricingRules,
      totalCount: pricingRulesTotalCount,
      page: pricingRulesPage,
      setPage: setPricingRulesPage,
      totalPages: pricingRulesTotalPages,
      search: pricingRulesSearch,
      setSearch: setPricingRulesSearch,
      statusFilter: pricingRulesStatus,
      setStatusFilter: setPricingRulesStatus,
      createRule,
      toggleRule,
      deleteRule,
      fetchAllActive
   } = usePricingRules(activeCountry);
   const { submit: submitPriceChanges } = useSubmitPriceChanges(activeCountry);
   const { submitPlanogram } = useSubmitMerchandisingChanges(activeCountry);
   const { create: createCampaignProposal } = useMerchandisingCampaigns(activeCountry);
   

   // Filtering and Sorting custom hook
   const {
      searchTerm,
      setSearchTerm,
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      sortConfig,
      setSortConfig,
      filters,
      setFilters,
      handleSort,
      filteredProducts: cachedFilteredProducts
   } = useMerchandisingFilters({ products: cachedProducts, getMargin });
   useEffect(() => { setCurrentPage(1); setFilters(previous => ({ ...previous, sites: [] })); }, [activeCountry, activeRegionCode]);
   useEffect(() => { setSelectedMarkdownProduct(null); }, [activeCountry, activeRegionCode, activeSite?.id]);
   const catalog = usePriceManagerCatalog({ country: activeCountry, search: searchTerm, filters, sort: sortConfig, page: currentPage, pageSize: itemsPerPage }, activeTab === 'pricing');
   const products = activeTab === 'pricing' ? catalog.data?.data || [] : cachedProducts;
   const filteredProducts = activeTab === 'pricing' ? products : cachedFilteredProducts;
   const salesMetricsIndex = useMemo(() => buildCatalogSalesMetricsIndex(products || [], sales || []), [products, sales]);
   useEffect(() => {
      if (activeTab === 'pricing' && catalog.data && currentPage > Math.max(1, Math.ceil(catalog.data.count / itemsPerPage))) setCurrentPage(1);
   }, [catalog.data, currentPage, itemsPerPage, activeTab]);

   // Edit State
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editForm, setEditForm] = useState<{ price: number; cost: number; salePrice: number; isOnSale: boolean; applyToAll: boolean }>({
      price: 0, cost: 0, salePrice: 0, isOnSale: false, applyToAll: true
   });
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Bulk Action State
   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

   const batch = usePriceManagerBatch({ products: filteredProducts, selectedIds, setSelectedIds, submit: submitPriceChanges, setIsSubmitting,
      scopeKey: JSON.stringify([activeCountry, activeSite?.id, activeRegionCode, activeTab, searchTerm, filters, sortConfig, currentPage, itemsPerPage]) });

   // Pricing Rules & Automation actions hook
   const {
      isRuleModalOpen,
      setIsRuleModalOpen,
      newRule,
      setNewRule,
      ruleValidationErrors,
      setRuleValidationErrors,
      isCreatingRule,
      simResult,
      setSimResult,
      isSimulating,
      setIsSimulating,
      handleCreateRule,
      runPricingRule,
      toggleRuleStatus,
      deleteRuleById,
      handleRunSimulation
   } = usePricingRulesActions({
      activeCountry,
      activeRegionCode: activeRegionCode || undefined,
      sites: sites || [],
      salesMetricsIndex,
      createRule,
      toggleRule,
      deleteRule,
      pricingRules,
      batch,
      setIsSubmitting,
      addNotification
   });

   // Promo Modal
   const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
   const [newPromo, setNewPromo] = useState<Partial<Promotion>>({ type: 'PERCENTAGE' });

   // Bulk Discount Modal
   const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);
   const [bulkDiscountValue, setBulkDiscountValue] = useState('');

   // Planogram State
   const [showHeatmap, setShowHeatmap] = useState(false);
   const [swapSource, setSwapSource] = useState<string | null>(null);

   // Markdown State
   const [selectedMarkdownProduct, setSelectedMarkdownProduct] = useState<Product | null>(null);
   const [isMarkdownSimulating, setIsMarkdownSimulating] = useState(false);

   // Location Matrix State
   const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
   const [selectedLocationProduct, setSelectedLocationProduct] = useState<Product | null>(null);

   // Product Control Modal State
   const [isProductControlOpen, setIsProductControlOpen] = useState(false);
   const [selectedControlProduct, setSelectedControlProduct] = useState<Product | null>(null);

   const openProductControl = (p: Product) => {
      setSelectedControlProduct(p);
      setIsProductControlOpen(true);
   };

   // --- ACTIONS ---

   const handleCreatePromo = async () => {
      if (!newPromo.code || !newPromo.value || !newPromo.type || !newPromo.expiryDate) {
         addNotification('alert', 'Enter a code, discount, and future expiry date.');
         return;
      }

      setIsSubmitting(true);
      try {
         await createCampaignProposal.mutateAsync({ code: newPromo.code, type: newPromo.type, value: newPromo.value, expiryDate: newPromo.expiryDate });
         addNotification('success', `Campaign '${newPromo.code}' submitted for lead approval.`);
         setIsPromoModalOpen(false);
         setNewPromo({ type: 'PERCENTAGE' });
      } catch (error) {
         logger.error('useMerchandisingState', 'Failed to create promotion:', error as Error);
         addNotification('alert', 'Failed to submit campaign proposal');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleEditClick = (p: Product) => {
      setEditingId(p.id);
      setEditForm({
         price: p.price,
         cost: p.costPrice ?? 0,
         salePrice: p.salePrice || Math.round(p.price * 0.9),
         isOnSale: p.isOnSale || false,
         applyToAll: true
      });
   };

   const handleSavePrice = async (id: string) => {
      setIsSubmitting(true);
      try {
         const product = products.find(p => p.id === id);
         if (product) {
            const proposal = {
               price: editForm.price,
               costPrice: editForm.cost,
               salePrice: editForm.salePrice,
               isOnSale: editForm.isOnSale
            };
            const targets = editForm.applyToAll && product.sku
               ? products.filter(p => p.sku === product.sku)
               : [product];
            batch.stagePriceBatch(targets.map(p => ({ product: p, proposal })), 'Manual price edit');
            setEditingId(null);
         }
      } catch (error) {
         logger.error('useMerchandisingState', "Error saving price:", error);
         addNotification('alert', 'Failed to submit price change');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleSelection = (id: string) => {
      const s = new Set(selectedIds);
      s.has(id) ? s.delete(id) : s.add(id);
      setSelectedIds(s);
   };

   const toggleSelectAll = () => {
      setSelectedIds(selectedIds.size === filteredProducts.length ? new Set() : new Set(filteredProducts.map(p => p.id)));
   };

   const applyBulkSale = () => {
      if (selectedIds.size > 0) setIsBulkDiscountModalOpen(true);
   };

   const handleApplyBulkDiscount = async () => {
      try { batch.stageDiscount(Number(bulkDiscountValue)); setIsBulkDiscountModalOpen(false); }
      catch (error) { addNotification('alert', (error as Error).message); }
   };
   const applyPsychologicalPricing = async (target: '5' | '0') => {
      try { batch.stageEnding(target); }
      catch (error) { addNotification('info', (error as Error).message); }
   };

   const handleShelfSwap = async (productId: string) => {
      if (swapSource === null) {
         setSwapSource(productId);
         addNotification('info', 'Select destination shelf position to place product');
      } else if (swapSource === productId) {
         setSwapSource(null);
      } else {
         const p1 = products.find(p => p.id === swapSource);
         const p2 = products.find(p => p.id === productId);
         if (p1 && p2) {
            const s1 = p1.shelfPosition, s2 = p2.shelfPosition;
            try {
               await submitPlanogram([{ product: p1, shelfPosition: s2 || 'Bottom Shelf' }, { product: p2, shelfPosition: s1 || 'Bottom Shelf' }]);
               setSwapSource(null);
            } catch (error) { addNotification('alert', (error as Error).message); }
         }
      }
   };

   const handleMoveToShelf = async (shelfName: string) => {
      if (swapSource) {
         const p = products.find(prod => prod.id === swapSource);
         if (p) {
            try { await submitPlanogram([{ product: p, shelfPosition: shelfName }]); }
            catch (error) { addNotification('alert', (error as Error).message); }
         }
         setSwapSource(null);
      }
   };

   const calculateMarkdown = () => {
      setIsMarkdownSimulating(false);
   };

   return {
      pricingRulesLoading, pricingRulesError, retryPricingRules, pricingRulesMutating,
      products,
      catalogCount: activeTab === 'pricing' ? catalog.data?.count || 0 : filteredProducts.length,
      catalogLoading: catalog.isFetching,
      catalogError: catalog.error instanceof Error ? catalog.error.message : null,
      priceBatch: batch.priceBatch, batchFailures: batch.batchFailures,
      confirmPriceBatch: batch.confirmPriceBatch, cancelPriceBatch: batch.cancelPriceBatch,
      promotions: countryPromotions,
      sites,
      allOrders: sales || [],
      refreshData,
      addNotification,
      updateProduct,
      updatePricesBySKU,
      currencySymbol,
      activeCountry,
      addPromotion: async (promo: any) => {
         addPromotion(promo);
      },

      activeTab,
      setActiveTab,
      pricingRules,
      searchTerm,
      setSearchTerm,

      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,

      editingId,
      setEditingId,
      editForm,
      setEditForm,
      isSubmitting,
      setIsSubmitting,

      selectedIds,
      setSelectedIds,

      isPromoModalOpen,
      setIsPromoModalOpen,
      newPromo,
      setNewPromo,

      isRuleModalOpen,
      setIsRuleModalOpen,
      newRule,
      setNewRule,
      pricingRulesTotalCount,
      pricingRulesPage,
      setPricingRulesPage,
      pricingRulesTotalPages,
      pricingRulesSearch,
      setPricingRulesSearch,
      pricingRulesStatus,
      setPricingRulesStatus,
      isCreatingRule,
      ruleValidationErrors,
      setRuleValidationErrors,

      isBulkDiscountModalOpen,
      setIsBulkDiscountModalOpen,
      bulkDiscountValue,
      setBulkDiscountValue,

      showHeatmap,
      setShowHeatmap,
      swapSource,
      setSwapSource,

      selectedMarkdownProduct,
      setSelectedMarkdownProduct,
      isMarkdownSimulating,
      setIsMarkdownSimulating,

      simResult,
      setSimResult,
      isSimulating,
      setIsSimulating,

      isLocationModalOpen,
      setIsLocationModalOpen,
      selectedLocationProduct,
      setSelectedLocationProduct,

      isProductControlOpen,
      setIsProductControlOpen,
      selectedControlProduct,
      setSelectedControlProduct,
      openProductControl,

      handleSort,
      handleCreatePromo,
      handleEditClick,
      handleSavePrice,
      handleApplyBulkDiscount,
      handleCreateRule,
      handleRunSimulation,
      handleShelfSwap,
      handleMoveToShelf,
      submitPlanogram,

      runPricingRule,
      toggleRuleStatus,
      deleteRule: deleteRuleById,
      calculateMarkdown,

      applyPsychologicalPricing,
      applyBulkSale,
      toggleSelection,
      toggleSelectAll,
      getMargin,

      sortConfig,
      setSortConfig,
      filters,
      setFilters,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      filteredProducts,
      salesMetricsIndex
   };
};
