import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { MOCK_PRICING_RULES } from '../../constants';
import type { Product, Promotion, PricingRule } from '../../types';
import type { MerchandisingContextType, MerchandisingTab } from './MerchandisingContext';
import { useMerchandisingFilters } from './hooks/useMerchandisingFilters';
import { logger } from '../../utils/logger';

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
      refreshData
   } = useData();

   const [activeTab, setActiveTab] = useState<MerchandisingTab>('pricing');
   const [pricingRules, setPricingRules] = useState<PricingRule[]>(MOCK_PRICING_RULES);

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

   // --- ACTIONS ---

   const handleCreatePromo = async () => {
      if (!newPromo.code || !newPromo.value || !newPromo.type) return;

      setIsSubmitting(true);
      try {
         addPromotion({
            code: newPromo.code.toUpperCase(),
            type: newPromo.type,
            value: newPromo.value,
            expiryDate: newPromo.expiryDate,
            usageCount: 0,
            status: 'Active'
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
            await updateProduct({
               ...product,
               price: editForm.price,
               costPrice: editForm.cost,
               salePrice: editForm.salePrice,
               isOnSale: editForm.isOnSale
            });

            addNotification('success', `Updated pricing for ${product.name}`);

            if (editForm.applyToAll && product.sku) {
               await updatePricesBySKU(product.sku, {
                  price: editForm.price,
                  costPrice: editForm.cost,
                  salePrice: editForm.salePrice,
                  isOnSale: editForm.isOnSale
               });

               await refreshData();
            }
         }
         setEditingId(null);
      } catch (error) {
         logger.error('useMerchandisingState', "Error saving price:", error);
         addNotification('alert', 'Failed to save price');
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
         const productsToUpdate = products.filter(p => selectedIds.has(p.id));
         await Promise.all(productsToUpdate.map(p => updateProduct({ ...p, isOnSale: true, salePrice: Math.round(p.price * (1 - pct)) })));
         setSelectedIds(new Set());
         addNotification('success', `Applied ${bulkDiscountValue}% discount to ${productsToUpdate.length} items.`);
         setIsBulkDiscountModalOpen(false);
         setBulkDiscountValue('');
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to apply bulk discount');
      } finally {
         setIsSubmitting(false);
      }
   };

   // --- PSYCHOLOGICAL PRICING ---
   const applyPsychologicalPricing = async (target: '5' | '0') => {
      setIsSubmitting(true);
      try {
         let count = 0;
         const updates: Promise<any>[] = [];
         const targetList = selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : filteredProducts;

         targetList.forEach(p => {
            const current = Math.round(p.price);
            let nextPrice = current;
            if (target === '5') {
               nextPrice = current % 10 === 5 ? current : Math.floor((current - 1) / 10) * 10 + 5;
            } else {
               nextPrice = Math.floor((current - 1) / 10) * 10;
            }
            if (nextPrice !== current && nextPrice > 0) {
               count++;
               updates.push(updateProduct({ ...p, price: nextPrice }));
            }
         });

         await Promise.all(updates);
         addNotification('success', `Optimized ${count} prices to end in ${target}.`);
         if (selectedIds.size > 0) setSelectedIds(new Set());
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to update prices');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleCreateRule = () => {
      if (!newRule.name || !newRule.value || !newRule.threshold) return;
      const rule: PricingRule = {
         id: crypto.randomUUID(),
         name: newRule.name,
         targetCategory: newRule.targetCategory || 'Fresh Produce',
         condition: newRule.condition || 'Stock > X',
         threshold: newRule.threshold,
         action: newRule.action || 'Decrease Price %',
         value: newRule.value,
         isActive: true
      };
      setPricingRules(prev => [...prev, rule]);
      addNotification('success', `Automation Rule '${rule.name}' created and activated.`);
      setIsRuleModalOpen(false);
      setNewRule({ targetCategory: 'Fresh Produce', condition: 'Stock > X', action: 'Decrease Price %', isActive: true });
   };

   const runPricingRule = async (rule: PricingRule) => {
      setIsSubmitting(true);
      try {
         let updatedCount = 0;
         const updates: Promise<any>[] = [];
         products.forEach(p => {
            if (p.category === rule.targetCategory) {
               let shouldApply = false;
               if (rule.condition === 'Stock > X' && p.stock > rule.threshold) shouldApply = true;
               if (rule.condition === 'Expiry < X Days' && rule.threshold > 10) shouldApply = true;
               if (shouldApply) {
                  updatedCount++;
                  let newPrice = rule.action === 'Decrease Price %' ? p.price * (1 - (rule.value / 100)) : p.price * (1 + (rule.value / 100));
                  updates.push(updateProduct({ ...p, price: parseFloat(newPrice.toFixed(2)) }));
               }
            }
         });
         await Promise.all(updates);
         addNotification('info', `Rule Executed: Updated ${updatedCount} products in category '${rule.targetCategory}'`);
      } catch (e) {
         logger.error('useMerchandisingState', 'caught error', e as Error);
         addNotification('alert', 'Failed to run pricing rule');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleRuleStatus = (id: string) => setPricingRules(p => p.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
   const deleteRule = (id: string) => {
      setPricingRules(p => p.filter(r => r.id !== id));
      addNotification('info', 'Automation Rule deleted');
   };

   const handleRunSimulation = async () => {
      setIsSimulating(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      let totalImpactRevenue = 0, totalImpactMargin = 0, impactedCount = 0;
      const activeRules = pricingRules.filter(r => r.isActive);

      activeRules.forEach(rule => {
         products.forEach(p => {
            if (p.category === rule.targetCategory && rule.condition === 'Stock > X' && p.stock > rule.threshold) {
               impactedCount++;
               let newPrice = rule.action === 'Decrease Price %' ? p.price * (1 - (rule.value / 100)) : p.price * (1 + (rule.value / 100));
               const estSales = p.salesVelocity === 'High' ? 20 : p.salesVelocity === 'Medium' ? 10 : 2;
               totalImpactRevenue += (newPrice - p.price) * estSales;
               totalImpactMargin += (newPrice - (p.costPrice || p.price * 0.7) - (p.price - (p.costPrice || p.price * 0.7))) * estSales;
            }
         });
      });
      setSimResult({ rev: parseFloat((totalImpactRevenue / 1000).toFixed(1)), margin: parseFloat((totalImpactMargin / 1000).toFixed(1)) });
      setIsSimulating(false);
      addNotification('success', `Simulation complete. rules would affect ${impactedCount} products.`);
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
      promotions,
      sites,
      allOrders,
      refreshData,
      addNotification,
      updateProduct,
      updatePricesBySKU,
      addPromotion: async (promo: any) => {
         addPromotion(promo);
      },

      activeTab,
      setActiveTab,
      pricingRules,
      setPricingRules,
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
      deleteRule,
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
      filteredProducts
   };
};
