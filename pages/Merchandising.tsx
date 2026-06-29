import React, { useState, useMemo } from 'react';
import {
   Tags, TrendingUp, Percent, DollarSign, Filter, Search, AlertTriangle,
   Edit2, Save, Plus, Calendar, CheckCircle, XCircle, BarChart3, BrainCircuit,
   Target, Layers, ArrowRight, Eye, Play, RefreshCw, Flame, Calculator, Zap,
   TrendingDown, MousePointer2, LineChart as LineChartIcon, Leaf, ShoppingCart, Map, Truck,
   Power, Trash2, Loader2, Package, ChevronUp, ChevronDown, SlidersHorizontal, ChevronRight
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   LineChart, Line, ComposedChart, Legend, Bar
} from 'recharts';
import { MOCK_PRODUCTS, MOCK_PROMOTIONS, CURRENCY_SYMBOL, MOCK_PRICING_RULES, GROCERY_CATEGORIES, ALL_CATEGORY_OPTIONS } from '../constants';
import { Product, Promotion, PricingRule, ShelfPosition } from '../types';
import { productsService } from '../services/supabase.service';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { formatCompactNumber } from '../utils/formatting';

type Tab = 'pricing' | 'rules' | 'promos' | 'planogram' | 'markdown' | 'forecast';

// --- UTILS ---
const getMargin = (price: number, cost: number) => {
   if (!price || !cost) return 0;
   return ((price - cost) / price) * 100;
};

// --- MARKDOWN SIMULATION DATA ---
const MARKDOWN_DATA = [
   { week: 'Week 1', stock: 100, price: 1000, revenue: 5000 },
   { week: 'Week 2', stock: 85, price: 950, revenue: 8000 },
   { week: 'Week 3', stock: 60, price: 850, revenue: 12000 },
   { week: 'Week 4', stock: 25, price: 700, revenue: 15000 },
   { week: 'Week 5', stock: 0, price: 500, revenue: 18000 },
];

// --- DEMAND FORECAST DATA ---
const DEMAND_DATA = [
   { period: 'Week 1', actual: 120, predicted: 125, confidence: 115 },
   { period: 'Week 2', actual: 135, predicted: 130, confidence: 120 },
   { period: 'Week 3', actual: 145, predicted: 140, confidence: 130 },
   { period: 'Week 4', actual: 150, predicted: 155, confidence: 145 },
   { period: 'Week 5', actual: null, predicted: 170, confidence: 160 }, // Future
   { period: 'Week 6', actual: null, predicted: 190, confidence: 180 }, // Future
   { period: 'Week 7', actual: null, predicted: 210, confidence: 200 }, // Future
   { period: 'Week 8', actual: null, predicted: 180, confidence: 170 }, // Future
];

const RECOMMENDED_BUYS = [
   { id: 1, name: 'Neon Energy Drink', current: 120, predicted: 500, buy: 380, reason: 'Summer Heatwave' },
   { id: 2, name: 'Smart Water', current: 500, predicted: 800, buy: 300, reason: 'Event Spike' },
   { id: 3, name: 'Synth-Fruit Basket', current: 45, predicted: 150, buy: 105, reason: 'Seasonal Peak' },
];

export default function Pricing() {
   const { addNotification, allProducts: products, updateProduct, updatePricesBySKU, promotions, addPromotion, sites, allOrders, refreshData } = useData();
   const [activeTab, setActiveTab] = useState<Tab>('pricing');
   // Removed local state: products, promotions
   const [pricingRules, setPricingRules] = useState<PricingRule[]>(MOCK_PRICING_RULES);
   const [searchTerm, setSearchTerm] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

   // Edit State
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editForm, setEditForm] = useState<{ price: number, cost: number, salePrice: number, isOnSale: boolean, applyToAll: boolean }>({
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
   const [simResult, setSimResult] = useState<{ rev: number, margin: number } | null>(null);
   const [isSimulating, setIsSimulating] = useState(false);

   // Location Matrix State
   const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
   const [selectedLocationProduct, setSelectedLocationProduct] = useState<Product | null>(null);

   // Advanced Filtering & Sorting State
   const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
   const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'margin', direction: 'asc' | 'desc' }>({
      key: 'name',
      direction: 'asc'
   });
   const [filters, setFilters] = useState({
      categories: [] as string[],
      sites: [] as string[],
      velocities: [] as string[],
      onSale: null as boolean | null,
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
   React.useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, filters]);

   // Pagination calculations
   const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

   // Generate page numbers for pagination
   const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
         for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
         pages.push(1);
         if (currentPage > 3) pages.push('...');

         const start = Math.max(2, currentPage - 1);
         const end = Math.min(totalPages - 1, currentPage + 1);

         for (let i = start; i <= end; i++) pages.push(i);

         if (currentPage < totalPages - 2) pages.push('...');
         pages.push(totalPages);
      }
      return pages;
   };

   // --- ACTIONS ---

   const handleCreatePromo = async () => {
      if (!newPromo.code || !newPromo.value) return;

      setIsSubmitting(true);
      try {
         const promo: Promotion = {
            id: `PR - ${Date.now()} `,
            code: newPromo.code,
            type: newPromo.type || 'PERCENTAGE',
            value: newPromo.value,
            status: 'Active',
            usageCount: 0,
            expiryDate: newPromo.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
         };

         await addPromotion(promo);
         setIsPromoModalOpen(false);
         setNewPromo({ type: 'PERCENTAGE' });
      } catch (e) {
         console.error(e);
         addNotification('alert', 'Failed to create promotion');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleEditClick = (p: Product) => {
      setEditingId(p.id);
      setEditForm({
         price: p.price,
         cost: p.costPrice || p.price * 0.7,
         salePrice: p.salePrice || p.price * 0.9,
         isOnSale: p.isOnSale || false,
         applyToAll: false
      });
   };

   const handleSavePrice = async (id: string) => {
      setIsSubmitting(true);
      try {
         const product = products.find(p => p.id === id);
         if (product) {
            // 1. Update the Main Product
            await updateProduct({
               ...product,
               price: editForm.price,
               costPrice: editForm.cost,
               salePrice: editForm.salePrice,
               isOnSale: editForm.isOnSale
            });

            // 2. Global Sync Logic (SKU-Centric Atomic)
            if (editForm.applyToAll && product.sku) {
               await updatePricesBySKU(product.sku, {
                  price: editForm.price,
                  costPrice: editForm.cost,
                  salePrice: editForm.salePrice,
                  isOnSale: editForm.isOnSale
               });

               // Force refresh to ensure local state is perfectly synced
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

   // --- PSYCHOLOGICAL PRICING (ETB COMPLIANT - WHOLE NUMBERS) ---
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
               // Target ending in 5 (e.g., 700 -> 695)
               if (current % 10 === 5) {
                  nextPrice = current;
               } else {
                  nextPrice = Math.floor((current - 1) / 10) * 10 + 5;
               }
            } else {
               // Target ending in 0 (e.g., 700 -> 690)
               // Even if it ends in 0, we shave it down to the next 10s boundary for a "deal" feel
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

   // --- RULE ACTIONS ---

   const handleCreateRule = () => {
      if (!newRule.name || !newRule.value || !newRule.threshold) return;

      const rule: PricingRule = {
         id: `R - ${Date.now()} `,
         name: newRule.name,
         targetCategory: newRule.targetCategory || 'Electronics',
         condition: newRule.condition || 'Stock > X',
         threshold: newRule.threshold,
         action: newRule.action || 'Decrease Price %',
         value: newRule.value,
         isActive: true
      };

      setPricingRules([...pricingRules, rule]);
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

      // Simulate processing delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000));

      let totalImpactRevenue = 0;
      let totalImpactMargin = 0;
      let impactedCount = 0;

      // Iterate all ACTIVE rules
      const activeRules = pricingRules.filter(r => r.isActive);

      activeRules.forEach(rule => {
         products.forEach(p => {
            if (p.category === rule.targetCategory) {
               // Check Condition
               let matches = false;
               if (rule.condition === 'Stock > X' && p.stock > rule.threshold) matches = true;
               // (Expiry check omitted for now as p.expiry is optional/string)

               if (matches) {
                  impactedCount++;
                  let newPrice = p.price;
                  if (rule.action === 'Decrease Price %') newPrice = p.price * (1 - (rule.value / 100));
                  if (rule.action === 'Increase Price %') newPrice = p.price * (1 + (rule.value / 100));

                  const estimatedSales = p.salesVelocity === 'High' ? 20 : p.salesVelocity === 'Medium' ? 10 : 2;
                  const oldRev = p.price * estimatedSales;
                  const newRev = newPrice * estimatedSales;

                  totalImpactRevenue += (newRev - oldRev); // Monthly revenue difference

                  // Margin impact (simplified)
                  const cost = p.costPrice || p.price * 0.7;
                  const oldMargin = (p.price - cost);
                  const newMargin = (newPrice - cost);
                  totalImpactMargin += (newMargin - oldMargin) * estimatedSales;
               }
            }
         });
      });

      // Normalize to percentages relative to total bogus revenue for display
      const percentRev = totalImpactRevenue > 0 ? (Math.random() * 2 + 1) : - (Math.random() * 2 + 1);
      // Actually, let's just use the calculated derived sign and a magnitude

      setSimResult({
         rev: parseFloat((totalImpactRevenue / 1000).toFixed(1)), // Mock scaling
         margin: parseFloat((totalImpactMargin / 1000).toFixed(1))
      });
      setIsSimulating(false);
      addNotification('success', `Simulation complete.rules would affect ${impactedCount} products.`);
   };

   // --- PLANOGRAM ACTIONS ---
   const handleShelfSwap = (productId: string) => {
      if (!swapSource) {
         setSwapSource(productId);
      } else {
         const sourceProduct = products.find(p => p.id === swapSource);
         const targetProduct = products.find(p => p.id === productId);

         if (sourceProduct && targetProduct) {
            const tempPos = sourceProduct.shelfPosition;
            updateProduct({ ...sourceProduct, shelfPosition: targetProduct.shelfPosition });
            updateProduct({ ...targetProduct, shelfPosition: tempPos });
         }

         setSwapSource(null);
      }
   };

   const handleMoveToShelf = (shelfName: string) => {
      if (swapSource) {
         const sourceProduct = products.find(p => p.id === swapSource);
         if (sourceProduct) {
            updateProduct({ ...sourceProduct, shelfPosition: shelfName as ShelfPosition });
         }
         setSwapSource(null);
      }
   };

   // --- MARKDOWN OPTIMIZATION ---
   const calculateMarkdown = () => {
      setIsMarkdownSimulating(true);
      setTimeout(() => {
         setIsMarkdownSimulating(false);
      }, 1500);
   };


   return (
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
               className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'promos'
                     ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                     : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white'
               }`}
            >
               <Percent size={14} />
               <span>Campaigns</span>
            </button>
         </div>

         {/* --- DEMAND FORECAST --- */}
         {activeTab === 'forecast' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-panel p-6">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[#1E3F27] dark:text-white flex items-center gap-2"><BrainCircuit size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> AI Demand Prediction</h3>
                        <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-xl text-stone-600 dark:text-stone-400">
                           <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Historical
                           <span className="w-2.5 h-2.5 bg-purple-500 rounded-full ml-2"></span> AI Forecast
                        </div>
                     </div>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <ComposedChart data={DEMAND_DATA}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                              <XAxis dataKey="period" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                              <YAxis stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Actual Sales" />
                              <Line type="monotone" dataKey="predicted" stroke="#9333ea" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Forecast" />
                              <Area type="monotone" dataKey="confidence" stroke="none" fill="#9333ea" fillOpacity={0.08} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="glass-panel p-6 flex flex-col">
                     <h3 className="font-bold text-[#1E3F27] dark:text-white mb-4 flex items-center gap-2"><Leaf size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Seasonality Insights</h3>
                     <div className="space-y-4 flex-1">
                        <div className="p-4 bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 rounded-2xl">
                           <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Upcoming Pattern</p>
                           <p className="text-[#1E3F27] dark:text-white font-bold">Winter Peak Season</p>
                           <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Historical data indicates a 25% surge in 'Beverages' demand starting next week.</p>
                        </div>
                        <div className="p-4 bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/20 dark:border-purple-500/10 rounded-2xl">
                           <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">Category Trend</p>
                           <p className="text-[#1E3F27] dark:text-white font-bold">Electronics Dip</p>
                           <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Post-holiday slump expected. Reduce inventory depth by 15%.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="glass-panel p-6">
                  <h3 className="font-bold text-[#1E3F27] dark:text-white mb-6 flex items-center gap-2"><ShoppingCart size={18} className="text-yellow-600 dark:text-yellow-400" /> Recommended Buy Orders</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400 text-xs uppercase font-bold">
                           <tr>
                              <th className="p-3 rounded-l-xl">Product</th>
                              <th className="p-3 text-center">Current Stock</th>
                              <th className="p-3 text-center">Predicted Demand (30d)</th>
                              <th className="p-3 text-center">Suggested Buy</th>
                              <th className="p-3">AI Reasoning</th>
                              <th className="p-3 rounded-r-xl text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                           {products.filter(p => p.stock < 100).slice(0, 5).map((p, idx) => {
                              const predictedDemand = Math.floor(p.stock * 1.5 + 50);
                              const suggestedBuy = predictedDemand - p.stock;
                              return (
                                 <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={14} className="text-stone-400" />
                                          )}
                                       </div>
                                       <span className="font-bold text-[#1E3F27] dark:text-white">{p.name}</span>
                                    </td>
                                    <td className="p-4 text-center text-stone-500 dark:text-stone-400">{p.stock}</td>
                                    <td className="p-4 text-center text-[#1E3F27] dark:text-white font-semibold">{predictedDemand}</td>
                                    <td className="p-4 text-center">
                                       <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 dark:border-green-500/10 px-3 py-1 rounded-xl font-bold">
                                          +{suggestedBuy}
                                       </span>
                                    </td>
                                    <td className="p-4 text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                       <Zap size={14} className="text-yellow-600 dark:text-yellow-400" /> {idx % 2 === 0 ? 'High Velocity detected' : 'Seasonal Low Stock'}
                                    </td>
                                    <td className="p-4 text-right">
                                       <button
                                          onClick={() => addNotification('success', `PO Draft created for ${p.name}`)}
                                          className="woody-btn-primary text-xs py-2 px-3 rounded-xl"
                                       >
                                          Create PO
                                       </button>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* --- PRICE MANAGER --- */}
         {activeTab === 'pricing' && (
            <div className="glass-panel overflow-hidden">
               <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-stone-50/50 dark:bg-[#1E2822]/30">
                  <div className="flex flex-wrap gap-4 items-center">
                     {/* Refined Search Bar */}
                     <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                        <input
                           className="woody-input pl-11"
                           placeholder="Search inventory system..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           aria-label="Search product"
                        />
                     </div>

                     {/* Advanced Filter Toggle */}
                     <button
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                        className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                           isFilterPanelOpen || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '')
                              ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] border-transparent shadow-sm'
                              : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                        }`}
                     >
                        <SlidersHorizontal size={18} />
                        <span className="tracking-wide">Filter Studio</span>
                        {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length > 0 && (
                           <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                              isFilterPanelOpen 
                                 ? 'bg-white text-[#2C5E3B] dark:bg-[#1E3B24] dark:text-[#A9CBA2]' 
                                 : 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24]'
                           }`}>
                              {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length}
                           </span>
                        )}
                     </button>

                     {/* Quick Action Tools */}
                     <div className="flex gap-3 ml-auto">
                        <button
                           onClick={() => applyPsychologicalPricing('5')}
                           disabled={isSubmitting}
                           className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                           title="Shave prices to end in 5 (e.g., 700 -> 695)"
                        >
                           {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                           {isSubmitting ? 'Optimizing...' : 'Ending in 5'}
                        </button>
                        <button
                           onClick={() => applyPsychologicalPricing('0')}
                           disabled={isSubmitting}
                           className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                           title="Shave prices to end in 0 (e.g., 700 -> 690)"
                        >
                           {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                           {isSubmitting ? 'Optimizing...' : 'Ending in 0'}
                        </button>
                        {selectedIds.size > 0 && (
                           <button
                              onClick={applyBulkSale}
                              className="px-4 py-2.5 bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300 shadow-sm"
                           >
                              <Percent size={14} /> Global Batch ({selectedIds.size})
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Collapsible Filter Panel - Redesigned with Premium Aesthetics */}
                  {isFilterPanelOpen && (
                     <div className="mt-4 p-8 glass-panel grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                        {/* Categories Section */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                              <Tags size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                              <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Categories</label>
                           </div>
                           <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                              {ALL_CATEGORY_OPTIONS.map(cat => (
                                 <label key={cat} className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors">
                                    <div className="relative flex items-center justify-center">
                                       <input
                                          type="checkbox"
                                          checked={filters.categories.includes(cat)}
                                          onChange={(e) => {
                                             const next = e.target.checked ? [...filters.categories, cat] : filters.categories.filter(c => c !== cat);
                                             setFilters({ ...filters, categories: next });
                                          }}
                                          className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                       />
                                       <CheckCircle size={10} className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">{cat}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        {/* Sites Section */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                              <Map size={14} className="text-blue-500 dark:text-blue-400" />
                              <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Store Locations</label>
                           </div>
                           <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                              {sites.map(site => (
                                 <label key={site.id} className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors">
                                    <div className="relative flex items-center justify-center">
                                       <input
                                          type="checkbox"
                                          checked={filters.sites.includes(site.id)}
                                          onChange={(e) => {
                                             const next = e.target.checked ? [...filters.sites, site.id] : filters.sites.filter(s => s !== site.id);
                                             setFilters({ ...filters, sites: next });
                                          }}
                                          className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                       />
                                       <CheckCircle size={10} className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">{site.name}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        {/* Price & Margin Range Section */}
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                                 <Calculator size={14} className="text-green-600 dark:text-green-400" />
                                 <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Market Position</label>
                              </div>
                              <div className="space-y-3">
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price Range ({CURRENCY_SYMBOL})</span>
                                    <div className="flex gap-2">
                                       <div className="relative flex-1">
                                          <input
                                             type="number"
                                             placeholder="Min"
                                             className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                             value={filters.minPrice}
                                             onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                          />
                                       </div>
                                       <div className="relative flex-1">
                                          <input
                                             type="number"
                                             placeholder="Max"
                                             className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                             value={filters.maxPrice}
                                             onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                          />
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Target Margin (%)</span>
                                    <div className="flex gap-2">
                                       <input
                                          type="number"
                                          placeholder="Min %"
                                          className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                          value={filters.minMargin}
                                          onChange={(e) => setFilters({ ...filters, minMargin: e.target.value })}
                                       />
                                       <input
                                          type="number"
                                          placeholder="Max %"
                                          className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                          value={filters.maxMargin}
                                          onChange={(e) => setFilters({ ...filters, maxMargin: e.target.value })}
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Velocity & Automation Section */}
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                                 <Zap size={14} className="text-yellow-600 dark:text-yellow-400" />
                                 <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Performance</label>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Sales Velocity</span>
                                    <div className="flex flex-wrap gap-2">
                                       {['High', 'Medium', 'Low'].map(v => (
                                          <button
                                             key={v}
                                             onClick={() => {
                                                const next = filters.velocities.includes(v) ? filters.velocities.filter(item => item !== v) : [...filters.velocities, v];
                                                setFilters({ ...filters, velocities: next });
                                             }}
                                             className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                                filters.velocities.includes(v)
                                                   ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] border-transparent shadow-sm'
                                                   : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                                             }`}
                                          >
                                             {v}
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Campaign Status</span>
                                    <button
                                       onClick={() => setFilters({ ...filters, onSale: filters.onSale === true ? null : true })}
                                       className={`group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                          filters.onSale === true
                                             ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 shadow-sm'
                                             : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:border-[#CFC6B4] dark:hover:border-emerald-900/15'
                                       }`}
                                    >
                                       <div className="flex items-center gap-2">
                                          <Percent size={14} className={filters.onSale === true ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'} />
                                          <span>On Sale / Active Promo</span>
                                       </div>
                                       <div className={`w-8 h-4 rounded-full relative transition-colors ${filters.onSale === true ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-stone-300 dark:bg-stone-700'}`}>
                                          <div className={`absolute top-1 w-2 h-2 rounded-full bg-white dark:bg-[#1E3B24] transition-all ${filters.onSale === true ? 'left-5' : 'left-1'}`} />
                                       </div>
                                    </button>
                                 </div>
                              </div>
                           </div>
                           <button
                              onClick={() => {
                                 setFilters({
                                    categories: [],
                                    sites: [],
                                    velocities: [],
                                    onSale: null,
                                    minPrice: '',
                                    maxPrice: '',
                                    minMargin: '',
                                    maxMargin: ''
                                 });
                                 setSearchTerm('');
                              }}
                              className="w-full py-2.5 text-[10px] uppercase font-bold text-stone-500 hover:text-[#1E3F27] dark:hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-[#2C5E3B]/5 dark:hover:bg-[#A9CBA2]/5 rounded-xl border border-transparent"
                           >
                              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Reset All Studio Filters
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Filter Chips - Refined for High-End Look */}
                  {(searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '')) && (
                     <div className="flex flex-wrap gap-2 mt-6 animate-in fade-in duration-700">
                        {searchTerm && (
                           <div className="flex items-center gap-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-3 py-1.5 rounded-full text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                              <Search size={10} />
                              <span>"{searchTerm}"</span>
                              <button onClick={() => setSearchTerm('')} aria-label="Clear search" className="hover:text-[#1E3F27] dark:hover:text-white transition-colors"><XCircle size={12} /></button>
                           </div>
                        )}
                        {filters.categories.map(cat => (
                           <div key={cat} className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium">
                              <Tags size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                              <span>{cat}</span>
                              <button onClick={() => setFilters({ ...filters, categories: filters.categories.filter(c => c !== cat) })} aria-label={`Remove category filter ${cat}`} className="hover:text-red-500 transition-colors"><XCircle size={12} className="opacity-60 hover:opacity-100" /></button>
                           </div>
                        ))}
                        {filters.sites.map(sid => (
                           <div key={sid} className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium">
                              <Map size={10} className="text-blue-500 dark:text-blue-400" />
                              <span>{sites.find(s => s.id === sid)?.name}</span>
                              <button onClick={() => setFilters({ ...filters, sites: filters.sites.filter(s => s !== sid) })} aria-label="Remove site filter" className="hover:text-red-500 transition-colors"><XCircle size={12} className="opacity-60 hover:opacity-100" /></button>
                           </div>
                        ))}
                        {(filters.minPrice || filters.maxPrice) && (
                           <div className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium">
                              <Calculator size={10} className="text-green-600 dark:text-green-400" />
                              <span>{CURRENCY_SYMBOL}{filters.minPrice || '0'} - {CURRENCY_SYMBOL}{filters.maxPrice || '∞'}</span>
                              <button onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })} aria-label="Clear price range filter" className="hover:text-red-500 transition-colors"><XCircle size={12} className="opacity-60 hover:opacity-100" /></button>
                           </div>
                        )}
                        {filters.onSale && (
                           <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                              <Percent size={10} />
                              <span>On Sale</span>
                              <button onClick={() => setFilters({ ...filters, onSale: null })} aria-label="Remove sale filter" className="hover:text-red-500 transition-colors"><XCircle size={12} className="opacity-60 hover:opacity-100" /></button>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400">
                           <th className="p-4 text-center w-12">
                              <input
                                 type="checkbox"
                                 className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                                 aria-label="Select all products"
                                 checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                 onChange={toggleSelectAll}
                              />
                           </th>
                           {/* Product Name */}
                           <th
                              className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                              onClick={() => handleSort('name')}
                           >
                              <div className="flex items-center gap-2">
                                 <span className={sortConfig.key === 'name' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Product</span>
                                 {sortConfig.key === 'name' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                           </th>
                           {/* Site/Location */}
                           <th
                              className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                              onClick={() => handleSort('siteId')}
                           >
                              <div className="flex items-center gap-2">
                                 <span className={sortConfig.key === 'siteId' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Location</span>
                                 {sortConfig.key === 'siteId' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                           </th>
                           {/* Price */}
                           <th
                              className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                              onClick={() => handleSort('price')}
                           >
                              <div className="flex items-center justify-end gap-2">
                                 <span className={sortConfig.key === 'price' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Retail Price</span>
                                 {sortConfig.key === 'price' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                           </th>
                           {/* Competitor Price */}
                           <th
                              className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                              onClick={() => handleSort('competitorPrice')}
                           >
                              <div className="flex items-center justify-end gap-2">
                                 <span className={sortConfig.key === 'competitorPrice' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Competitor</span>
                                 {sortConfig.key === 'competitorPrice' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                           </th>
                           {/* Margin */}
                           <th
                              className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                              onClick={() => handleSort('margin')}
                           >
                              <div className="flex items-center justify-end gap-2">
                                 <span className={sortConfig.key === 'margin' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Margin</span>
                                 {sortConfig.key === 'margin' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 )}
                              </div>
                           </th>
                           {/* Velocity */}
                           <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Velocity</th>
                           {/* Sale Active */}
                           <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Sale Active</th>
                           <th className="p-4 text-xs text-stone-500 uppercase text-right border-r-0 font-bold">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                        {paginatedProducts.map(p => {
                           const isEditing = editingId === p.id;
                           const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                           const retail = isEditing ? editForm.price : p.price;
                           const margin = getMargin(retail, cost);
                           const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                           return (
                              <tr key={p.id} className={`hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.04] ${selectedIds.has(p.id) ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5' : ''}`}>
                                 <td className="p-4 text-center">
                                    <input
                                       type="checkbox"
                                       checked={selectedIds.has(p.id)}
                                       onChange={() => toggleSelection(p.id)}
                                       className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                                       aria-label={`Select ${p.name} `}
                                    />
                                 </td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={18} className="text-stone-400" />
                                          )}
                                       </div>
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                             <p className="text-sm font-bold text-[#1E3F27] dark:text-white leading-none">{p.name}</p>
                                             {p.sku && (
                                                <span className="text-[10px] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-1.5 py-0.5 rounded text-[#2C5E3B] dark:text-[#A9CBA2] font-mono uppercase tracking-wider">
                                                   {p.sku}
                                                </span>
                                             )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                             <p className="text-xs text-stone-500 dark:text-stone-400">{p.category}</p>
                                             {p.sku && products.filter(pi => pi.sku === p.sku).length > 1 && (
                                                <span className="text-[10px] text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                   <Map size={10} /> {products.filter(pi => pi.sku === p.sku).length} Locations
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </td>

                                 {/* Location */}
                                 <td className="p-4 text-sm text-stone-600 dark:text-stone-400">
                                    {sites.find(s => s.id === p.siteId)?.name || 'Unknown Site'}
                                 </td>

                                 {/* Retail Price */}
                                 <td className="p-4 text-right">
                                    {isEditing ? (
                                       <div className="flex flex-col items-end gap-1.5">
                                          <div className="flex items-center gap-1.5">
                                             <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price:</span>
                                             <input
                                                type="number"
                                                className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                aria-label="Retail Price"
                                             />
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                             <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Cost:</span>
                                             <input
                                                type="number"
                                                className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                                value={editForm.cost}
                                                onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                                                aria-label="Cost Price"
                                             />
                                          </div>
                                       </div>
                                    ) : (
                                       <div className="flex flex-col items-end">
                                          <span className="text-[#1E3F27] dark:text-white font-mono font-bold">{CURRENCY_SYMBOL} {retail.toLocaleString()}</span>
                                          <span className="text-[10px] text-stone-500">Cost: {cost.toLocaleString()}</span>
                                       </div>
                                    )}
                                 </td>

                                 {/* Competitor Analysis */}
                                 <td className="p-4 text-right">
                                    {p.competitorPrice ? (
                                       <div className="flex flex-col items-end">
                                          <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">{CURRENCY_SYMBOL} {p.competitorPrice.toLocaleString()}</span>
                                          <span className={`text-[10px] font-bold ${compVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                             {compVariance > 0 ? '+' : ''}{compVariance.toFixed(1)}% vs Mkt
                                          </span>
                                       </div>
                                    ) : (
                                       <span className="text-stone-400 dark:text-stone-600 text-xs">-</span>
                                    )}
                                 </td>

                                 {/* Margin */}
                                 <td className="p-4 text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${margin < 15 ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                       margin > 40 ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                          'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                       }`}>
                                       {margin.toFixed(1)}%
                                    </span>
                                 </td>

                                 {/* Sales Velocity */}
                                 <td className="p-4 text-center">
                                    {p.salesVelocity === 'High' && <span className="text-green-600 dark:text-green-400 text-xs font-bold flex justify-center items-center"><TrendingUp size={12} className="mr-1" /> High</span>}
                                    {p.salesVelocity === 'Medium' && <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">Medium</span>}
                                    {p.salesVelocity === 'Low' && <span className="text-red-600 dark:text-red-400 text-xs font-bold">Low</span>}
                                 </td>

                                 {/* Is On Sale Toggle */}
                                 <td className="p-4 text-center">
                                    {isEditing ? (
                                       <div className="flex flex-col items-center gap-1">
                                          <input
                                             type="checkbox"
                                             checked={editForm.isOnSale}
                                             onChange={(e) => setEditForm({ ...editForm, isOnSale: e.target.checked })}
                                             className="w-4 h-4 accent-[#2C5E3B] dark:accent-[#A9CBA2] cursor-pointer"
                                             aria-label="Toggle Sale Status"
                                          />
                                          {editForm.isOnSale && (
                                             <input
                                                type="number"
                                                className="w-16 text-[10px] bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded text-center text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono"
                                                value={editForm.salePrice}
                                                onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) })}
                                                aria-label="Sale Price"
                                             />
                                          )}
                                       </div>
                                    ) : (
                                       p.isOnSale ? (
                                          <div className="flex flex-col items-center">
                                             <CheckCircle size={16} className="text-green-600 dark:text-green-400 mb-1" />
                                             <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">{formatCompactNumber(p.salePrice, { currency: CURRENCY_SYMBOL })}</span>
                                          </div>
                                       ) : (
                                          <div className="w-4 h-4 mx-auto border rounded-full border-stone-300 dark:border-stone-700"></div>
                                       )
                                    )}
                                 </td>

                                 {/* Actions */}
                                 <td className="p-4 text-right">
                                    {isEditing ? (
                                       <div className="flex flex-col gap-2 items-end">
                                          <div className="flex gap-2">
                                             <button
                                                onClick={() => setEditingId(null)}
                                                className="p-2 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 rounded-xl hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                                aria-label="Cancel Edit"
                                                title="Cancel"
                                             >
                                                <XCircle size={16} />
                                             </button>
                                             <button
                                                onClick={() => handleSavePrice(p.id)}
                                                disabled={isSubmitting}
                                                className="p-2 bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] rounded-xl hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] disabled:opacity-50 transition-all duration-300 shadow-sm"
                                                aria-label="Save Price"
                                                title="Save"
                                             >
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                             </button>
                                          </div>
                                          <label className="flex items-center gap-1 text-[10px] text-stone-500 dark:text-stone-400 cursor-pointer">
                                             <input
                                                type="checkbox"
                                                className="accent-[#2C5E3B] dark:accent-[#A9CBA2] cursor-pointer"
                                                checked={editForm.applyToAll}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, applyToAll: e.target.checked }))}
                                             />
                                             Sync All
                                          </label>
                                       </div>
                                    ) : (
                                       <div className="flex gap-2 justify-end">
                                          <button
                                             onClick={() => {
                                                setSelectedLocationProduct(p);
                                                setIsLocationModalOpen(true);
                                             }}
                                             className="p-2 bg-stone-100 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-xl hover:text-[#1E3F27] dark:hover:text-white hover:bg-blue-500/20 transition-all duration-300"
                                             title="View Network Stock"
                                          >
                                             <Map size={16} />
                                          </button>
                                          <button
                                             onClick={() => handleEditClick(p)}
                                             className="p-2 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 rounded-xl hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 transition-all duration-300"
                                             aria-label="Edit Product"
                                          >
                                             <Edit2 size={16} />
                                          </button>
                                       </div>
                                    )}
                                 </td>
                              </tr>
                           );
                        })}
                        {filteredProducts.length === 0 && (
                           <tr>
                              <td colSpan={9} className="p-12 text-center">
                                 <div className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
                                    <Search size={48} className="mb-4 opacity-30" />
                                    <p className="font-bold text-lg">No products found</p>
                                    <p className="text-sm">Try adjusting your search term or filters</p>
                                 </div>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Modern Pagination Controls */}
               {filteredProducts.length > 0 && (
                  <div className="p-4 border-t border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-stone-50/50 dark:bg-[#1E2822]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                     {/* Info and Items Per Page */}
                     <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-500 dark:text-stone-400">
                           Showing <span className="text-[#1E3F27] dark:text-white font-bold">{startIndex + 1}</span> to <span className="text-[#1E3F27] dark:text-white font-bold">{Math.min(endIndex, filteredProducts.length)}</span> of <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{filteredProducts.length}</span> products
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-stone-400 dark:text-stone-500">Show:</span>
                           <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                 setItemsPerPage(Number(e.target.value));
                                 setCurrentPage(1);
                              }}
                              className="bg-white/80 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-lg px-2 py-1 text-sm text-[#1E3F27] dark:text-[#EAE5D9] outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] cursor-pointer transition-all duration-300"
                              aria-label="Items per page"
                           >
                              {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                 <option key={n} value={n} className="bg-white dark:bg-[#1E2822]">{n}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {/* Page Navigation */}
                     <div className="flex items-center gap-1">
                        {/* First Page */}
                        <button
                           onClick={() => setCurrentPage(1)}
                           disabled={currentPage === 1}
                           className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${currentPage === 1
                              ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                              : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                              }`}
                           title="First page"
                        >
                           ««
                        </button>

                        {/* Previous */}
                        <button
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${currentPage === 1
                              ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                              : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                              }`}
                        >
                           Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-2">
                           {getPageNumbers().map((page, idx) => (
                              typeof page === 'number' ? (
                                 <button
                                    key={idx}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 ${currentPage === page
                                       ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                                       : 'text-stone-500 dark:text-[#7A9E83] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                                       }`}
                                 >
                                    {page}
                                 </button>
                              ) : (
                                 <span key={idx} className="text-stone-400 dark:text-stone-600 px-1">...</span>
                              )
                           ))}
                        </div>

                        {/* Next */}
                        <button
                           onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages}
                           className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${currentPage === totalPages
                              ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                              : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                              }`}
                        >
                           Next
                        </button>

                        {/* Last Page */}
                        <button
                           onClick={() => setCurrentPage(totalPages)}
                           disabled={currentPage === totalPages}
                           className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${currentPage === totalPages
                              ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                              : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                              }`}
                           title="Last page"
                        >
                           »»
                        </button>
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* --- MARKDOWN OPTIMIZER --- */}
         {activeTab === 'markdown' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="glass-panel p-6">
                  <h3 className="font-bold text-[#1E3F27] dark:text-white mb-4">Clearance Strategy</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                     Calculate optimal discount schedules to clear slow-moving inventory by a target date without sacrificing unnecessary margin.
                  </p>

                  <div className="space-y-4">
                     <div>
                        <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Select Product</label>
                        <select
                           className="woody-input"
                           value={selectedMarkdownProduct?.id || ''}
                           onChange={(e) => setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null)}
                           aria-label="Select Product for Markdown"
                        >
                           <option value="" className="bg-white dark:bg-[#1E2822]">Choose SKU to Simulate...</option>
                           <optgroup label="Recommended for Clearance (Low Velocity)" className="bg-white dark:bg-[#1E2822]">
                              {products.filter(p => p.salesVelocity === 'Low').map(p => (
                                 <option key={p.id} value={p.id} className="bg-white dark:bg-[#1E2822]">{p.name} ({p.stock} units)</option>
                              ))}
                           </optgroup>
                           <optgroup label="Other Products" className="bg-white dark:bg-[#1E2822]">
                              {products.filter(p => p.salesVelocity !== 'Low').map(p => (
                                 <option key={p.id} value={p.id} className="bg-white dark:bg-[#1E2822]">{p.name}</option>
                              ))}
                           </optgroup>
                        </select>
                     </div>

                     {selectedMarkdownProduct && (
                        <div className="p-4 bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20 space-y-3">
                           <div className="flex items-center gap-3 pb-3 border-b border-[#E2DCCE]/40 dark:border-emerald-950/10">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                 {selectedMarkdownProduct.image && !selectedMarkdownProduct.image.includes('placeholder.com') ? (
                                    <img
                                       src={selectedMarkdownProduct.image}
                                       className="w-full h-full object-cover"
                                       alt=""
                                       onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                       }}
                                    />
                                 ) : (
                                    <Package size={18} className="text-stone-400" />
                                 )}
                              </div>
                              <div>
                                 <p className="font-bold text-[#1E3F27] dark:text-white text-sm">{selectedMarkdownProduct.name}</p>
                                 <p className="text-[10px] text-stone-500 dark:text-stone-400">{selectedMarkdownProduct.sku}</p>
                              </div>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-stone-500 dark:text-stone-400">Current Price</span>
                              <span className="text-[#1E3F27] dark:text-white font-mono font-semibold">{formatCompactNumber(selectedMarkdownProduct.price, { currency: CURRENCY_SYMBOL })}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-stone-500 dark:text-stone-400">Break-Even Cost</span>
                              <span className="text-[#1E3F27] dark:text-white font-mono font-semibold">{formatCompactNumber(selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7, { currency: CURRENCY_SYMBOL })}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-stone-500 dark:text-stone-400">Weeks on Shelf</span>
                              <span className="text-red-600 dark:text-red-400 font-bold">12 Weeks</span>
                           </div>
                        </div>
                     )}

                     <div>
                        <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Target Exit Date</label>
                        <input type="date" className="woody-input" aria-label="Target Exit Date" />
                     </div>

                     <button
                        onClick={calculateMarkdown}
                        disabled={!selectedMarkdownProduct || isMarkdownSimulating}
                        className="woody-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                     >
                        {isMarkdownSimulating ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                        {isMarkdownSimulating ? 'Calculating Elasticity...' : 'Generate Glide Path'}
                     </button>
                  </div>
               </div>

               <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
                  <h3 className="font-bold text-[#1E3F27] dark:text-white mb-2">Projected Depletion Path</h3>
                  <div className="flex-1 min-h-[300px]">
                     {selectedMarkdownProduct ? (
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <AreaChart data={MARKDOWN_DATA}>
                              <defs>
                                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                              <XAxis dataKey="week" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                              <YAxis yAxisId="left" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                              <Line yAxisId="right" type="monotone" dataKey="price" stroke="#d97706" strokeWidth={2} name="Price Point" />
                              <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#ef4444" strokeDasharray="5 5" name="Stock Level" />
                           </AreaChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-stone-500 dark:text-stone-400 border-2 border-dashed border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl">
                           Select a product to view markdown forecast
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* --- SMART RULES (AI PRICING) --- */}
         {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-4">
                  {pricingRules.map(rule => (
                     <div key={rule.id} className="glass-panel p-6 flex items-center justify-between group hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:scale-[1.005] duration-300">
                        <div className="flex items-start gap-4">
                           <div className={`p-3 rounded-xl ${rule.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-stone-100 dark:bg-gray-500/10 text-stone-500 dark:text-gray-400'}`}>
                              <BrainCircuit size={24} />
                           </div>
                           <div>
                              <h3 className="font-bold text-[#1E3F27] dark:text-white text-lg flex items-center gap-2">
                                 {rule.name}
                                 {rule.isActive && <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase border border-green-500/20 dark:border-green-500/10 font-semibold">Active</span>}
                              </h3>
                              <div className="flex items-center gap-2 mt-2 text-sm text-stone-500 dark:text-stone-400 font-mono">
                                 <span className="bg-stone-100 dark:bg-black/35 px-2 py-1 rounded-xl text-[#1E3F27] dark:text-[#EAE5D9] border border-[#E2DCCE]/50 dark:border-emerald-950/20 font-medium">IF {rule.condition.replace('X', rule.threshold.toString())}</span>
                                 <ArrowRight size={14} className="text-stone-400 dark:text-stone-500" />
                                 <span className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] px-2 py-1 rounded-xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 font-medium">{rule.action} {rule.value}%</span>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Applies to: <span className="text-[#1E3F27] dark:text-white font-medium">{rule.targetCategory}</span></p>
                           </div>
                        </div>
                        <button
                           onClick={() => runPricingRule(rule)}
                           disabled={isSubmitting}
                           className="p-3 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 hover:bg-[#2C5E3B] dark:hover:bg-[#A9CBA2] text-stone-600 dark:text-stone-400 hover:text-white dark:hover:text-[#1E3B24] rounded-xl transition-all border border-[#E2DCCE] dark:border-white/10 group-hover:border-[#2C5E3B]/50 dark:group-hover:border-[#A9CBA2]/50 disabled:opacity-50"
                           aria-label="Run Rule Now"
                           title="Run Rule Now"
                        >
                           {isSubmitting ? <Loader2 size={20} className="animate-spin text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <Play size={20} />}
                        </button>
                        <div className="flex flex-col gap-2 ml-2">
                           <button
                              onClick={() => toggleRuleStatus(rule.id)}
                              className={`p-2 rounded-lg border transition-all ${rule.isActive ? 'bg-green-500/10 border-green-500/20 dark:border-green-500/10 text-green-600 dark:text-green-400' : 'bg-stone-100 dark:bg-gray-500/10 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400'}`}
                              title={rule.isActive ? "Deactivate Rule" : "Activate Rule"}
                           >
                              <Power size={16} />
                           </button>
                           <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10 rounded-lg transition-all"
                              title="Delete Rule"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  ))}

                  <button
                     onClick={() => setIsRuleModalOpen(true)}
                     className="w-full py-4 border border-dashed border-[#E2DCCE] dark:border-emerald-950/40 rounded-2xl text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B]/50 dark:hover:border-[#A9CBA2]/50 transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                     <Plus size={20} /> Create New Automation Rule
                  </button>
               </div>

               <div className="glass-panel p-6">
                  <h3 className="text-[#1E3F27] dark:text-white font-bold mb-4">Rule Simulator</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Test how rules affect your margins before activating them.</p>
                  <div className="space-y-4">
                     <div className="p-4 bg-stone-50/50 dark:bg-black/35 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20">
                        <p className="text-xs text-stone-400 dark:text-stone-500 uppercase mb-1">Projected Impact</p>
                        <div className="flex justify-between items-center">
                           <span className="text-stone-700 dark:text-stone-300 text-sm">Revenue</span>
                           <span className={`text-sm font-mono font-bold ${simResult && simResult.rev > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'}`}>
                              {simResult ? `${simResult.rev > 0 ? '+' : ''}${simResult.rev}% ` : '--'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-stone-700 dark:text-stone-300 text-sm">Margin</span>
                           <span className={`text-sm font-mono font-bold ${simResult && simResult.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'}`}>
                              {simResult ? `${simResult.margin > 0 ? '+' : ''}${simResult.margin}% ` : '--'}
                           </span>
                        </div>
                     </div>
                     <button
                        onClick={handleRunSimulation}
                        disabled={isSimulating}
                        className="woody-btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isSimulating ? <RefreshCw className="animate-spin" size={16} /> : 'Run Simulation'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- PLANOGRAM (INTERACTIVE) --- */}
         {activeTab === 'planogram' && (
            <div className="glass-panel overflow-hidden">
               <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex justify-between items-center bg-stone-50/50 dark:bg-[#1E2822]/30">
                  <div>
                     <h3 className="font-bold text-[#1E3F27] dark:text-white">Interactive Shelf Map</h3>
                     <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Drag (Click) to rearrange. Enable heatmap to see sales velocity.</p>
                  </div>
                  <button
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${showHeatmap ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10' : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 border border-[#E2DCCE] dark:border-white/5'}`}
                  >
                     <Flame size={16} /> Heatmap: {showHeatmap ? 'ON' : 'OFF'}
                  </button>
               </div>
               <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Shelf Visualization */}
                  <div className="lg:col-span-2 bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] rounded-2xl p-8 relative">
                     <div className="absolute top-2 left-2 text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">Zone B - Aisle 4</div>

                     <div className="space-y-6 mt-4">
                        {['Top Shelf', 'Eye Level', 'Bottom Shelf'].map((shelf, shelfIdx) => (
                           <div key={shelf} className={`h-24 border-b-8 border-stone-400 dark:border-stone-800 flex items-end px-4 gap-4 relative ${shelf === 'Eye Level' ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5' : ''}`}>
                              <div className={`absolute -left-24 bottom-2 text-xs w-20 text-right font-bold ${shelf === 'Eye Level' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'}`}>{shelf}</div>

                              {products.filter(p => p.shelfPosition === shelf || (shelf === 'Bottom Shelf' && !p.shelfPosition)).slice(0, 5).map(p => {
                                 const isHot = p.salesVelocity === 'High';
                                 const isCold = p.salesVelocity === 'Low';
                                 const isSelected = swapSource === p.id;

                                 return (
                                    <div
                                       key={p.id}
                                       onClick={() => handleShelfSwap(p.id)}
                                       className={`w-16 h-20 rounded-lg transition-all cursor-pointer relative group/prod overflow-hidden border-2 ${isSelected ? 'border-yellow-400 scale-110 z-10' : 'border-transparent hover:border-stone-300 dark:hover:border-white/30'
                                          } ${showHeatmap && isHot ? 'bg-red-500/25' : showHeatmap && isCold ? 'bg-blue-500/25' : 'bg-stone-100 dark:bg-white/5'
                                          }`}
                                    >
                                       <div className="w-full h-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover opacity-85"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={32} className="text-stone-400" />
                                          )}
                                       </div>

                                       {/* Heatmap Overlay */}
                                       {showHeatmap && (
                                          <div className={`absolute inset-0 mix-blend-overlay ${isHot ? 'bg-red-500' : isCold ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                       )}

                                       {isSelected && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                             <MousePointer2 className="text-yellow-400 animate-bounce" size={16} />
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}

                              {/* PLACE BUTTON - Shows when item selected from sidebar */}
                              {swapSource && (
                                 <button
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleMoveToShelf(shelf);
                                    }}
                                    className="h-20 w-16 border-2 border-dashed border-[#E2DCCE] dark:border-white/20 rounded-lg flex flex-col items-center justify-center text-xs text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] hover:bg-stone-50 dark:hover:bg-white/5 transition-all ml-2"
                                    title={`Place on ${shelf} `}
                                 >
                                    <Plus size={16} className="mb-1" />
                                    <span>Place</span>
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Planogram Stats & Unassigned */}
                  <div className="space-y-4">
                     {/* Unassigned Items - DRAG SOURCE */}
                     <div className="bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 sticky top-0 bg-stone-50 dark:bg-[#1E2822] pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20 flex justify-between items-center z-10">
                           <span>Unassigned ({products.filter(p => !p.shelfPosition).length})</span>
                           <span className="text-[10px] text-stone-400 dark:text-stone-500">Click to Place</span>
                        </h4>
                        <div className="space-y-2">
                           {products.filter(p => !p.shelfPosition).slice(0, 10).map(p => (
                              <div
                                 key={p.id}
                                 onClick={() => handleShelfSwap(p.id)}
                                 className={`flex items-center gap-2 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer border transition-all ${swapSource === p.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent'}`}
                              >
                                 <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                       <img
                                          src={p.image}
                                          className="w-full h-full object-cover"
                                          alt=""
                                          onError={(e) => {
                                             e.currentTarget.style.display = 'none';
                                             (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                          }}
                                       />
                                    ) : (
                                       <Package size={14} className="text-stone-400" />
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#1E3F27] dark:text-white truncate font-medium">{p.name}</p>
                                    <p className="text-[10px] text-stone-400 dark:text-stone-500">{p.sku}</p>
                                 </div>
                                 {swapSource === p.id && <MousePointer2 size={12} className="text-yellow-500" />}
                              </div>
                           ))}
                           {products.filter(p => !p.shelfPosition).length > 10 && (
                              <p className="text-[10px] center text-stone-400 dark:text-stone-500 italic">...and {products.filter(p => !p.shelfPosition).length - 10} more</p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20">
                     <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2">Shelf Efficiency</h4>
                     <div className="space-y-3">
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">Eye Level</span>
                              <span className="text-stone-700 dark:text-white">450 Sales/Wk</span>
                           </div>
                           <div className="w-full h-1 bg-stone-200 dark:bg-black/50 rounded-full"><div className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] w-[85%] rounded-full"></div></div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                              <span className="text-stone-500 dark:text-stone-400">Top Shelf</span>
                              <span className="text-stone-700 dark:text-white">120 Sales/Wk</span>
                           </div>
                           <div className="w-full h-1 bg-stone-200 dark:bg-black/50 rounded-full"><div className="h-full bg-stone-400 w-[30%] rounded-full"></div></div>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl border border-blue-500/20 dark:border-blue-500/10 text-xs text-blue-600 dark:text-blue-400">
                     <strong>Optimization Tip:</strong> 3 Low-velocity items detected on Eye Level shelf. Recommend swapping with "Neon Energy Drink".
                  </div>
                  <button
                     onClick={() => setSimResult({ rev: 5.2, margin: 1.1 })}
                     className="woody-btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                     <RefreshCw size={16} /> Auto-Optimize
                  </button>
               </div>
            </div>
         )}

         {/* --- PROMOTIONS (EXISTING) --- */}
         {activeTab === 'promos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Promo Stats */}
               <div className="glass-panel p-6">
                  <h3 className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase mb-4">Active Campaigns</h3>
                  <div className="flex items-end justify-between">
                     <span className="text-4xl font-bold text-[#1E3F27] dark:text-white font-mono">{promotions.filter(p => p.status === 'Active').length}</span>
                     <BarChart3 className="text-[#2C5E3B] dark:text-[#A9CBA2] mb-2" />
                  </div>
               </div>

               <div className="md:col-span-2 flex justify-end items-start">
                  <button
                     onClick={() => setIsPromoModalOpen(true)}
                     className="woody-btn-primary px-6 py-3 flex items-center shadow-sm"
                  >
                     <Plus size={18} className="mr-2" />
                     New Promotion
                  </button>
               </div>

               <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotions.map(promo => (
                     <div key={promo.id} className="glass-panel p-6 relative overflow-hidden group hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:scale-[1.01] duration-300">
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider border-b border-l ${promo.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-[#E2DCCE] dark:border-emerald-950/20' : 'bg-stone-100 dark:bg-gray-500/10 text-stone-500 dark:text-stone-400 border-[#E2DCCE] dark:border-emerald-950/20'
                           }`}>
                           {promo.status}
                        </div>

                        <div className="mb-4">
                           <div className="flex items-center gap-2 mb-1">
                              <Tags size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                              <span className="text-xs text-stone-400 dark:text-stone-500">Promo Code</span>
                           </div>
                           <h3 className="text-2xl font-bold text-[#1E3F27] dark:text-white font-mono tracking-wider">{promo.code}</h3>
                        </div>
                        <div className="flex justify-between items-end border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 pt-4">
                           <div>
                              <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">Discount Value</p>
                              <p className="text-lg font-bold text-[#1E3F27] dark:text-white">
                                 {promo.type === 'FIXED' ? CURRENCY_SYMBOL : ''}{promo.value}{promo.type === 'PERCENTAGE' ? '%' : ''} OFF
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">Redemptions</p>
                              <p className="text-sm font-mono text-[#1E3F27] dark:text-white">{promo.usageCount}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* New Promo Modal */}
         <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Create Promotion">
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Promo Code</label>
                  <input
                     className="woody-input uppercase font-mono"
                     placeholder="e.g. FLASH50"
                     value={newPromo.code || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                     aria-label="Promo Code"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Type</label>
                     <select
                        className="woody-input"
                        value={newPromo.type}
                        onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                        aria-label="Promo Type"
                     >
                        <option value="PERCENTAGE" className="bg-white dark:bg-[#1E2822]">Percentage (%)</option>
                        <option value="FIXED" className="bg-white dark:bg-[#1E2822]">Fixed Amount</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Value</label>
                     <input
                        type="number"
                        className="woody-input"
                        value={newPromo.value || ''}
                        onChange={(e) => setNewPromo({ ...newPromo, value: parseFloat(e.target.value) })}
                        aria-label="Promo Value"
                     />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Expiry Date</label>
                  <input
                     type="date"
                     className="woody-input"
                     value={newPromo.expiryDate || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                     aria-label="Promo Expiry"
                  />
               </div>
               <button
                  onClick={handleCreatePromo}
                  disabled={isSubmitting}
                  className="woody-btn-primary w-full mt-4 flex items-center justify-center gap-2"
               >
                  {isSubmitting ? (
                     <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Launching...</span>
                     </>
                  ) : 'Launch Campaign'}
               </button>
            </div>
         </Modal>

         {/* Create Rule Modal */}
          <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title="New Automation Rule">
             <div className="space-y-4">
                <div>
                   <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Rule Name</label>
                   <input
                      className="woody-input"
                      placeholder="e.g. Low Stock Clearance"
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      aria-label="Rule Name"
                   />
                </div>
                <div>
                   <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Target Category</label>
                   <select
                      className="woody-input"
                      value={newRule.targetCategory}
                      onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                      aria-label="Target Category"
                   >
                       {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                          <optgroup key={group} label={group} className="bg-stone-100 dark:bg-[#1E2822] text-stone-900 dark:text-stone-300">
                             {items.map(c => (
                                <option key={c} value={c} className="bg-white dark:bg-[#1E2822] text-stone-900 dark:text-stone-100">{c}</option>
                             ))}
                          </optgroup>
                       ))}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Trigger Condition</label>
                      <select
                         className="woody-input"
                         value={newRule.condition}
                         onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                         aria-label="Trigger Condition"
                      >
                         <option className="bg-white dark:bg-[#1E2822]">Stock &gt; X</option>
                         <option className="bg-white dark:bg-[#1E2822]">Expiry &lt; X Days</option>
                         <option className="bg-white dark:bg-[#1E2822]">Sales &lt; X</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Threshold (X)</label>
                      <input
                         type="number"
                         className="woody-input"
                         value={newRule.threshold || ''}
                         onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                         aria-label="Threshold Value"
                      />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Action</label>
                      <select
                         className="woody-input"
                         value={newRule.action}
                         onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                         aria-label="Action"
                      >
                         <option className="bg-white dark:bg-[#1E2822]">Increase Price</option>
                         <option className="bg-white dark:bg-[#1E2822]">Decrease Price</option>
                         <option className="bg-white dark:bg-[#1E2822]">Set Margin</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Value (%)</label>
                      <input
                         type="number"
                         className="woody-input"
                         value={newRule.value || ''}
                         onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                         aria-label="Action Value"
                      />
                   </div>
                </div>
                <button
                   onClick={handleCreateRule}
                   className="woody-btn-primary w-full mt-4"
                >
                   Activate Rule
                </button>
             </div>
          </Modal>

          {/* Bulk Discount Modal */}
          <Modal
             isOpen={isBulkDiscountModalOpen}
             onClose={() => {
                setIsBulkDiscountModalOpen(false);
                setBulkDiscountValue('');
             }}
             title="Apply Bulk Discount"
          >
             <div className="space-y-4">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                   Enter the discount percentage to apply to {selectedIds.size} selected product{selectedIds.size !== 1 ? 's' : ''}.
                </p>
                <div>
                   <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Discount Percentage</label>
                   <input
                      type="number"
                      className="woody-input"
                      placeholder="e.g., 20 for 20% off"
                      value={bulkDiscountValue}
                      onChange={(e) => setBulkDiscountValue(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') handleApplyBulkDiscount();
                      }}
                      autoFocus
                      aria-label="Bulk Discount Percentage"
                   />
                </div>
                <button
                   onClick={handleApplyBulkDiscount}
                   disabled={!bulkDiscountValue || isSubmitting}
                   className="woody-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isSubmitting ? (
                      <>
                         <Loader2 size={18} className="animate-spin" />
                         <span>Applying...</span>
                      </>
                   ) : `Apply ${bulkDiscountValue}% Discount`}
                </button>
             </div>
          </Modal>

         {/* --- LOCATION MATRIX MODAL --- */}
         <Modal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            title="Network Stock Matrix"
            size="lg"
         >
            {selectedLocationProduct && (
               <div className="space-y-6">
                  <div className="flex items-center gap-4 glass-panel-pushed p-4 rounded-2xl">
                     <div className="w-16 h-16 rounded-xl bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {selectedLocationProduct.image && !selectedLocationProduct.image.includes('placeholder.com') ? (
                           <img
                              src={selectedLocationProduct.image}
                              className="w-full h-full object-cover"
                              alt=""
                              onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                              }}
                           />
                        ) : (
                           <Package size={24} className="text-stone-500" />
                        )}
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{selectedLocationProduct.name}</h3>
                        <p className="text-stone-400 dark:text-stone-500 font-mono text-sm">{selectedLocationProduct.sku}</p>
                     </div>
                     <div className="ml-auto text-right">
                        <p className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wider">Total Network Asset</p>
                        <p className="text-2xl font-bold text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
                           {products
                              .filter(p => p.sku === selectedLocationProduct.sku)
                              .reduce((sum, p) => sum + p.stock, 0)} Units
                        </p>
                     </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-white/40 dark:bg-black/10">
                     <table className="w-full text-left">
                        <thead className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400 text-xs uppercase font-bold">
                           <tr>
                              <th className="p-4">Location</th>
                              <th className="p-4">Type</th>
                              <th className="p-4 text-center">Stock Level</th>
                              <th className="p-4 text-right">Aisle / Shelf</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                           {products
                              .filter(p => p.sku === selectedLocationProduct.sku)
                              .map(p => {
                                 const site = sites.find(s => s.id === p.siteId || s.id === (p as any).site_id);
                                 return (
                                    <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                       <td className="p-4 font-bold text-[#1E3F27] dark:text-white">
                                          {site ? site.name : 'Unknown Site'}
                                       </td>
                                       <td className="p-4 text-sm text-stone-500 dark:text-stone-400">
                                          {site ? site.type : '-'}
                                          {/* --- INCOMING PO DATA --- */}
                                          {(() => {
                                             // Find all open POs for this product
                                             const openPOs = allOrders
                                                .filter(o => o.status === 'Pending' || o.status === 'Approved')
                                                .flatMap(o => o.lineItems || [])
                                                .filter(item => item.productId === p.id);

                                             const totalOnOrder = openPOs.reduce((sum, item) => sum + item.quantity, 0);
                                             const latestPO = openPOs[openPOs.length - 1]; // Simple latest check
                                             const incomingCost = latestPO ? latestPO.unitCost : 0;

                                             return (
                                                <div className="flex flex-col gap-1 mt-1">
                                                   {totalOnOrder > 0 && (
                                                      <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold flex items-center gap-1">
                                                         <Truck size={10} />
                                                         On Order: {totalOnOrder}
                                                      </div>
                                                   )}
                                                   {incomingCost > 0 && incomingCost !== (p.costPrice || 0) && (
                                                      <div className={`text-[10px] flex items-center gap-1 ${incomingCost > (p.costPrice || 0) ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                         {incomingCost > (p.costPrice || 0) ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                         New Cost: ${(incomingCost).toFixed(2)}
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                          })()}
                                       </td>
                                       <td className="p-4 align-top text-center">
                                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${p.stock < 20 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'}`}>
                                             {p.stock} Units
                                          </span>
                                       </td>
                                       <td className="p-4 text-right font-mono text-[#1E3F27] dark:text-white">
                                          {p.shelfPosition || <span className="text-stone-400 dark:text-stone-600 italic">Unassigned</span>}
                                       </td>
                                    </tr>
                                 );
                              })}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </Modal>
      </div>
   );
}
