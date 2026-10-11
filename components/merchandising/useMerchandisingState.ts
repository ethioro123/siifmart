import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { CURRENCY_SYMBOL } from '../../constants';
import type { Product, Promotion, PricingRule } from '../../types';
import type { MerchandisingContextType, MerchandisingTab } from './MerchandisingContext';
import { useMerchandisingFilters } from './hooks/useMerchandisingFilters';
import { matchRuleProduct, calculateRulePrice } from './utils/ruleEvaluator';
import { logger } from '../../utils/logger';
import { getCountryProfile, Country } from '../../utils/localization';
import { usePricingRules } from '../../hooks/usePricingRules';
import { useSubmitPriceChanges, type PriceChangeInput } from '../../hooks/useSubmitPriceChanges';
import { buildCatalogSalesMetricsIndex } from '../../utils/merchandisingAnalytics';

const getMargin = (price: number, cost: number) => {
   if (!price || !cost) return 0;
   return ((price - cost) / price) * 100;
};

export const useMerchandisingState = (): MerchandisingContextType => {
   const {
      addNotification,
      allProducts: products,
      updateProduct,
      updatePricesBySKU,
      promotions,
      addPromotion,
      sites,
      allOrders,
      sales,
      refreshData,
      effectiveCountry,
      settings
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
   const { rules: pricingRules, createRule, toggleRule, deleteRule } = usePricingRules(activeCountry);
   const { submit: submitPriceChanges } = useSubmitPriceChanges(activeCountry);
   const salesMetricsIndex = useMemo(() => buildCatalogSalesMetricsIndex(products || [], sales || []), [products, sales]);

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
      filteredProducts
   } = useMerchandisingFilters({ products, getMargin });

   // Edit State
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editForm, setEditForm] = useState<{ price: number; cost: number; salePrice: number; isOnSale: boolean; applyToAll: boolean }>({
      price: 0, cost: 0, salePrice: 0, isOnSale: false, applyToAll: true
   });
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Bulk Action State
   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

   // Promo Modal
   const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
   const [newPromo, setNewPromo] = useState<Partial<Promotion>>({ type: 'PERCENTAGE' });

   // Rule Modal
   const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
   const [newRule, setNewRule] = useState<Partial<PricingRule>>({
      targetCategory: 'Fresh Produce',
      condition: 'Stock > X',
      action: 'Decrease Price %',
      isActive: true
   });

   // Bulk Discount Modal
   const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);
   const [bulkDiscountValue, setBulkDiscountValue] = useState('');

   // Planogram State
   const [showHeatmap, setShowHeatmap] = useState(false);
   const [swapSource, setSwapSource] = useState<string | null>(null);

   // Markdown State
   const [selectedMarkdownProduct, setSelectedMarkdownProduct] = useState<Product | null>(null);
   const [isMarkdownSimulating, setIsMarkdownSimulating] = useState(false);

   // Simulation State
   const [simResult, setSimResult] = useState<{ rev: number; margin: number } | null>(null);
   const [isSimulating, setIsSimulating] = useState(false);

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
      if (!newPromo.code || !newPromo.value || !newPromo.type) return;

      setIsSubmitting(true);
      try {
         addPromotion({
            id: `promo-${Date.now()}`,
            code: newPromo.code.toUpperCase(),
            type: newPromo.type,
            value: newPromo.value,
            expiryDate: newPromo.expiryDate,
            usageCount: 0,
            status: 'Active',
            country: activeCountry,
            country_code: activeCountry
         } as any);

         addNotification('success', `Campaign '${newPromo.code}' launched successfully.`);
         setIsPromoModalOpen(false);
         setNewPromo({ type: 'PERCENTAGE' });
      } catch (error) {
         logger.error('useMerchandisingState', 'Failed to create promotion:', error as Error);
         addNotification('alert', 'Failed to launch promotion campaign');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleEditClick = (p: Product) => {
      setEditingId(p.id);
      setEditForm({
         price: p.price,
         cost: p.costPrice || p.price * 0.7,
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
            const { submitted } = await submitPriceChanges(
               targets.map(p => ({ product: p, proposal })),
               'Manual price edit'
            );
            if (submitted > 0) setEditingId(null);
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
      if (!bulkDiscountValue) return;
      setIsSubmitting(true);
      try {
         const pct = parseFloat(bulkDiscountValue) / 100;
         const changes: PriceChangeInput[] = products
            .filter(p => selectedIds.has(p.id))
            .map(p => ({
               product: p,
               proposal: { price: p.price, costPrice: p.costPrice, isOnSale: true, salePrice: Math.round(p.price * (1 - pct)) }
            }));
         const { submitted } = await submitPriceChanges(changes, `Bulk ${bulkDiscountValue}% discount`);
         if (submitted > 0) setSelectedIds(new Set());
         setIsBulkDiscountModalOpen(false);
         setBulkDiscountValue('');
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to submit bulk discount');
      } finally {
         setIsSubmitting(false);
      }
   };

   // --- PSYCHOLOGICAL PRICING ---
   const applyPsychologicalPricing = async (target: '5' | '0') => {
      setIsSubmitting(true);
      try {
         const changes: PriceChangeInput[] = [];
         const targetList = selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : filteredProducts;

         targetList.forEach(p => {
            const current = Math.round(p.price);
            const nextPrice = target === '5'
               ? (current % 10 === 5 ? current : Math.floor((current - 1) / 10) * 10 + 5)
               : Math.floor((current - 1) / 10) * 10;
            if (nextPrice !== current && nextPrice > 0) {
               changes.push({ product: p, proposal: { price: nextPrice, costPrice: p.costPrice, salePrice: p.salePrice, isOnSale: p.isOnSale } });
            }
         });

         const { submitted } = await submitPriceChanges(changes, `Psychological pricing (.${target})`);
         if (submitted > 0 && selectedIds.size > 0) setSelectedIds(new Set());
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to submit price changes');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleCreateRule = () => {
      if (!newRule.name || !newRule.value || !newRule.threshold) return;
      createRule.mutate({
         name: newRule.name,
         targetCategory: newRule.targetCategory || 'Fresh Produce',
         condition: newRule.condition || 'Stock > X',
         threshold: newRule.threshold,
         action: newRule.action || 'Decrease Price %',
         value: newRule.value,
         isActive: true
      });
      setIsRuleModalOpen(false);
      setNewRule({ targetCategory: 'Fresh Produce', condition: 'Stock > X', action: 'Decrease Price %', isActive: true });
   };

   const runPricingRule = async (rule: PricingRule) => {
      setIsSubmitting(true);
      try {
         const changes: PriceChangeInput[] = [];
         products.forEach(p => {
            if (matchRuleProduct(p, rule)) {
               const newPrice = parseFloat(calculateRulePrice(p, rule).toFixed(2));
               if (newPrice > 0 && newPrice !== p.price) {
                  changes.push({ product: p, proposal: { price: newPrice, costPrice: p.costPrice, salePrice: p.salePrice, isOnSale: p.isOnSale } });
               }
            }
         });
         const { submitted } = await submitPriceChanges(changes, `Rule '${rule.name}'`);
         if (submitted === 0) addNotification('info', `Rule '${rule.name}' matched no products needing a price change.`);
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to run pricing rule');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleRuleStatus = (id: string) => {
      const rule = pricingRules.find(r => r.id === id);
      if (rule) toggleRule.mutate({ id, isActive: !rule.isActive });
   };
   const deleteRuleById = (id: string) => deleteRule.mutate(id);

   const handleRunSimulation = async () => {
      setIsSimulating(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      let totalCurrentRevenue = 0, totalProjectedRevenue = 0, totalCurrentMargin = 0, totalProjectedMargin = 0, impactedCount = 0;
      const activeRules = pricingRules.filter(r => r.isActive);

      products.forEach(p => {
         const cost = p.costPrice || (p.price * 0.7);
         const estSales = p.salesVelocity === 'High' ? 35 : p.salesVelocity === 'Medium' ? 18 : 6;
         const currentRev = p.price * estSales;
         const currentMarg = (p.price - cost) * estSales;

         totalCurrentRevenue += currentRev;
         totalCurrentMargin += currentMarg;

         const matchingRule = activeRules.find(r => matchRuleProduct(p, r));
         if (matchingRule) {
            impactedCount++;
            const newPrice = calculateRulePrice(p, matchingRule);
            // Price elasticity multiplier: price drop increases volume, price hike softens volume
            const elasticityFactor = newPrice < p.price ? 1.25 : 0.88;
            const projectedSales = Math.round(estSales * elasticityFactor);
            const projRev = newPrice * projectedSales;
            const projMarg = (newPrice - cost) * projectedSales;
            totalProjectedRevenue += projRev;
            totalProjectedMargin += projMarg;
         } else {
            totalProjectedRevenue += currentRev;
            totalProjectedMargin += currentMarg;
         }
      });

      const revDeltaPct = totalCurrentRevenue > 0 ? parseFloat((((totalProjectedRevenue - totalCurrentRevenue) / totalCurrentRevenue) * 100).toFixed(1)) : 0;
      const margDeltaPct = totalCurrentMargin > 0 ? parseFloat((((totalProjectedMargin - totalCurrentMargin) / totalCurrentMargin) * 100).toFixed(1)) : 0;

      setSimResult({ rev: revDeltaPct, margin: margDeltaPct });
      setIsSimulating(false);
      addNotification('success', `Simulation complete: Analyzed ${impactedCount} affected SKUs.`);
   };

   const handleShelfSwap = (productId: string) => {
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
            updateProduct({ ...p1, shelfPosition: s2 });
            updateProduct({ ...p2, shelfPosition: s1 });
            addNotification('success', `Swapped layout positions for '${p1.name}' and '${p2.name}'`);
            setSwapSource(null);
         }
      }
   };

   const handleMoveToShelf = (shelfName: string) => {
      if (swapSource) {
         const p = products.find(prod => prod.id === swapSource);
         if (p) {
            updateProduct({ ...p, shelfPosition: shelfName as any });
            addNotification('success', `Placed '${p.name}' on ${shelfName}`);
         }
         setSwapSource(null);
      }
   };

   const calculateMarkdown = () => {
      setIsMarkdownSimulating(true);
      setTimeout(() => setIsMarkdownSimulating(false), 1500);
   };

   return {
      products,
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
