import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { MOCK_PRICING_RULES } from '../../constants';
import type { Product, Promotion, PricingRule } from '../../types';
import type { MerchandisingContextType, MerchandisingTab, MerchandisingFilters } from './MerchandisingContext';

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
   const [searchTerm, setSearchTerm] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);

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

   // Advanced Filtering & Sorting State
   const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
   const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'margin'; direction: 'asc' | 'desc' }>({
      key: 'name',
      direction: 'asc'
   });
   const [filters, setFilters] = useState<MerchandisingFilters>({
      categories: [],
      sites: [],
      velocities: [],
      onSale: null,
      minPrice: '',
      maxPrice: '',
      minMargin: '',
      maxMargin: ''
   });

   // Sorting Helper
   const handleSort = (key: keyof Product | 'margin') => {
      if (sortConfig.key === key) {
         setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
      } else {
         setSortConfig({ key, direction: 'asc' });
      }
   };

   // Filtering
   const filteredProducts = useMemo(() => {
      let result = products.filter(p =>
         p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Category Filter
      if (filters.categories.length > 0) {
         result = result.filter(p => filters.categories.includes(p.category));
      }

      // Site Filter
      if (filters.sites.length > 0) {
         result = result.filter(p => filters.sites.includes(p.siteId || (p as any).site_id));
      }

      // Velocity Filter
      if (filters.velocities.length > 0) {
         result = result.filter(p => filters.velocities.includes(p.salesVelocity || ''));
      }

      // Sale Filter
      if (filters.onSale !== null) {
         result = result.filter(p => p.isOnSale === filters.onSale);
      }

      // Price Range Filter
      if (filters.minPrice !== '') {
         result = result.filter(p => p.price >= parseFloat(filters.minPrice));
      }
      if (filters.maxPrice !== '') {
         result = result.filter(p => p.price <= parseFloat(filters.maxPrice));
      }

      // Margin Range Filter
      if (filters.minMargin !== '' || filters.maxMargin !== '') {
         result = result.filter(p => {
            const cost = p.costPrice || p.price * 0.7;
            const margin = getMargin(p.price, cost);
            const min = filters.minMargin !== '' ? parseFloat(filters.minMargin) : -Infinity;
            const max = filters.maxMargin !== '' ? parseFloat(filters.maxMargin) : Infinity;
            return margin >= min && margin <= max;
         });
      }

      // Sorting
      result.sort((a, b) => {
         let valA: any;
         let valB: any;

         if (sortConfig.key === 'margin') {
            valA = getMargin(a.price, a.costPrice || a.price * 0.7);
            valB = getMargin(b.price, b.costPrice || b.price * 0.7);
         } else {
            valA = a[sortConfig.key as keyof Product];
            valB = b[sortConfig.key as keyof Product];
         }

         if (valA === valB) return 0;
         if (valA === null || valA === undefined) return 1;
         if (valB === null || valB === undefined) return -1;

         const modifier = sortConfig.direction === 'asc' ? 1 : -1;
         if (typeof valA === 'string') {
            return valA.localeCompare(valB as string) * modifier;
         }
         return (valA - (valB as any)) * modifier;
      });

      return result;
   }, [products, searchTerm, filters, sortConfig]);

   // Reset page when search or filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, filters]);

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
         console.error('Failed to create promotion:', error);
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
         console.error("Error saving price:", error);
         addNotification('alert', 'Failed to save price');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
   };

   const toggleSelectAll = () => {
      if (selectedIds.size === filteredProducts.length) {
         setSelectedIds(new Set());
      } else {
         setSelectedIds(new Set(filteredProducts.map(p => p.id)));
      }
   };

   const applyBulkSale = () => {
      if (selectedIds.size === 0) return;
      setIsBulkDiscountModalOpen(true);
   };

   const handleApplyBulkDiscount = async () => {
      if (!bulkDiscountValue) return;

      setIsSubmitting(true);
      try {
         const pct = parseFloat(bulkDiscountValue) / 100;
         const productsToUpdate = products.filter(p => selectedIds.has(p.id));
         const count = productsToUpdate.length;

         await Promise.all(productsToUpdate.map(p =>
            updateProduct({
               ...p,
               isOnSale: true,
               salePrice: Math.round(p.price * (1 - pct))
            })
         ));

         setSelectedIds(new Set());
         addNotification('success', `Applied ${bulkDiscountValue}% discount to ${count} items.`);
         setIsBulkDiscountModalOpen(false);
         setBulkDiscountValue('');
      } catch (e) {
         console.error(e);
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

         const targetList = selectedIds.size > 0
            ? products.filter(p => selectedIds.has(p.id))
            : filteredProducts;

         targetList.forEach(p => {
            const current = Math.round(p.price);
            let nextPrice = current;

            if (target === '5') {
               if (current % 10 === 5) {
                  nextPrice = current;
               } else {
                  nextPrice = Math.floor((current - 1) / 10) * 10 + 5;
               }
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
         if (selectedIds.size > 0) {
            setSelectedIds(new Set());
         }
      } catch (e) {
         console.error(e);
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
                  let newPrice = p.price;
                  if (rule.action === 'Decrease Price %') newPrice = p.price * (1 - (rule.value / 100));
                  if (rule.action === 'Increase Price %') newPrice = p.price * (1 + (rule.value / 100));

                  updates.push(updateProduct({ ...p, price: parseFloat(newPrice.toFixed(2)) }));
               }
            }
         });

         await Promise.all(updates);
         addNotification('info', `Rule Executed: Updated ${updatedCount} products in category '${rule.targetCategory}'`);
      } catch (e) {
         console.error(e);
         addNotification('alert', 'Failed to run pricing rule');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleRuleStatus = (id: string) => {
      setPricingRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
   };

   const deleteRule = (id: string) => {
      setPricingRules(prev => prev.filter(r => r.id !== id));
      addNotification('info', 'Automation Rule deleted');
   };

   const handleRunSimulation = async () => {
      setIsSimulating(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      let totalImpactRevenue = 0;
      let totalImpactMargin = 0;
      let impactedCount = 0;

      const activeRules = pricingRules.filter(r => r.isActive);

      activeRules.forEach(rule => {
         products.forEach(p => {
            if (p.category === rule.targetCategory) {
               let matches = false;
               if (rule.condition === 'Stock > X' && p.stock > rule.threshold) matches = true;

               if (matches) {
                  impactedCount++;
                  let newPrice = p.price;
                  if (rule.action === 'Decrease Price %') newPrice = p.price * (1 - (rule.value / 100));
                  if (rule.action === 'Increase Price %') newPrice = p.price * (1 + (rule.value / 100));

                  const estimatedSales = p.salesVelocity === 'High' ? 20 : p.salesVelocity === 'Medium' ? 10 : 2;
                  const oldRev = p.price * estimatedSales;
                  const newRev = newPrice * estimatedSales;

                  totalImpactRevenue += (newRev - oldRev);

                  const cost = p.costPrice || p.price * 0.7;
                  const oldMargin = (p.price - cost);
                  const newMargin = (newPrice - cost);
                  totalImpactMargin += (newMargin - oldMargin) * estimatedSales;
               }
            }
         });
      });

      setSimResult({
         rev: parseFloat((totalImpactRevenue / 1000).toFixed(1)),
         margin: parseFloat((totalImpactMargin / 1000).toFixed(1))
      });
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
            const shelf1 = p1.shelfPosition;
            const shelf2 = p2.shelfPosition;

            updateProduct({ ...p1, shelfPosition: shelf2 });
            updateProduct({ ...p2, shelfPosition: shelf1 });

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
      setTimeout(() => {
         setIsMarkdownSimulating(false);
      }, 1500);
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
