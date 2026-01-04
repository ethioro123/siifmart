
import React, { useState, useMemo } from 'react';
import {
   Tags, TrendingUp, Percent, DollarSign, Filter, Search, AlertTriangle,
   Edit2, Save, Plus, Calendar, CheckCircle, XCircle, BarChart3, BrainCircuit,
   Target, Layers, ArrowRight, Eye, Play, RefreshCw, Flame, Calculator, Zap,
   TrendingDown, MousePointer2, LineChart as LineChartIcon, Leaf, ShoppingCart, Map, Truck,
   Power, Trash2, Loader2, Package
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   LineChart, Line, ComposedChart, Legend, Bar
} from 'recharts';
import { MOCK_PRODUCTS, MOCK_PROMOTIONS, CURRENCY_SYMBOL, MOCK_PRICING_RULES, GROCERY_CATEGORIES } from '../constants';
import { Product, Promotion, PricingRule, ShelfPosition } from '../types';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { formatCompactNumber } from '../utils/formatting';

type Tab = 'pricing' | 'rules' | 'promos' | 'planogram' | 'markdown' | 'forecast';

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
   const { addNotification, allProducts: products, updateProduct, promotions, addPromotion, sites, allOrders } = useData();
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
   const [editForm, setEditForm] = useState<{ price: number, cost: number, salePrice: number, isOnSale: boolean }>({
      price: 0, cost: 0, salePrice: 0, isOnSale: false
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

   // Filtering
   const filteredProducts = useMemo(() => {
      // Reset to page 1 when search changes
      return products.filter(p =>
         p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [products, searchTerm]);

   // Reset page when search changes
   React.useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm]);

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
            id: `PR-${Date.now()}`,
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
         isOnSale: p.isOnSale || false
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

         await Promise.all(productsToUpdate.map(p =>
            updateProduct({
               ...p,
               isOnSale: true,
               salePrice: Math.round(p.price * (1 - pct))
            })
         ));

         setSelectedIds(new Set());
         addNotification('success', `Applied ${bulkDiscountValue}% discount to ${selectedIds.size} items.`);
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
   const applyPsychologicalPricing = async () => {
      setIsSubmitting(true);
      try {
         let count = 0;
         const updates: Promise<any>[] = [];

         products.forEach(p => {
            const current = p.price;
            const decimal = current % 1;
            if (decimal !== 0.99 && decimal !== 0.95 && decimal !== 0) {
               count++;
               const base = Math.floor(current);
               updates.push(updateProduct({ ...p, price: base + 0.99 }));
            }
         });

         await Promise.all(updates);
         addNotification('success', `Optimized ${count} prices to .99 endings.`);
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
         id: `R-${Date.now()}`,
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
      addNotification('success', `Simulation complete. rules would affect ${impactedCount} products.`);
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

   // --- CALCULATIONS ---
   const getMargin = (price: number, cost: number) => {
      if (!price || !cost) return 0;
      return ((price - cost) / price) * 100;
   };

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Tags className="text-cyber-primary" />
                  Merchandising Intelligence
               </h2>
               <p className="text-gray-400 text-sm">AI-driven pricing strategies, markdown optimization, and visual planograms.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl flex items-center gap-2">
                  <Target size={16} className="text-cyber-primary" />
                  <span className="text-xs text-gray-400">Price Index:</span>
                  <span className="text-sm font-bold text-white font-mono">98.5</span>
               </div>
               <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-xs text-gray-400">Avg Margin:</span>
                  <span className="text-sm font-bold text-white font-mono">32.5%</span>
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex space-x-1 bg-cyber-gray p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
            <button
               onClick={() => setActiveTab('pricing')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pricing' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <DollarSign size={16} />
               <span>Price Manager</span>
            </button>
            <button
               onClick={() => setActiveTab('forecast')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'forecast' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <LineChartIcon size={16} />
               <span>Demand Forecast</span>
            </button>
            <button
               onClick={() => setActiveTab('markdown')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'markdown' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <TrendingDown size={16} />
               <span>Markdown Optimizer</span>
            </button>
            <button
               onClick={() => setActiveTab('rules')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rules' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <BrainCircuit size={16} />
               <span>Smart Rules</span>
            </button>
            <button
               onClick={() => setActiveTab('planogram')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'planogram' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <Layers size={16} />
               <span>Planogram</span>
            </button>
            <button
               onClick={() => setActiveTab('promos')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'promos' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
               <Percent size={16} />
               <span>Campaigns</span>
            </button>
         </div>

         {/* --- DEMAND FORECAST --- */}
         {activeTab === 'forecast' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2"><BrainCircuit size={18} className="text-cyber-primary" /> AI Demand Prediction</h3>
                        <div className="flex items-center gap-2 text-xs bg-black/30 px-3 py-1 rounded-lg">
                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Historical
                           <span className="w-2 h-2 bg-purple-500 rounded-full ml-2"></span> AI Forecast
                        </div>
                     </div>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <ComposedChart data={DEMAND_DATA}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="period" stroke="#666" fontSize={12} />
                              <YAxis stroke="#666" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Actual Sales" />
                              <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Forecast" />
                              <Area type="monotone" dataKey="confidence" stroke="none" fill="#a855f7" fillOpacity={0.1} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex flex-col">
                     <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Leaf size={18} className="text-green-400" /> Seasonality Insights</h3>
                     <div className="space-y-4 flex-1">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                           <p className="text-xs text-blue-400 font-bold uppercase mb-1">Upcoming Pattern</p>
                           <p className="text-white font-bold">Winter Peak Season</p>
                           <p className="text-xs text-gray-400 mt-1">Historical data indicates a 25% surge in 'Beverages' demand starting next week.</p>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                           <p className="text-xs text-purple-400 font-bold uppercase mb-1">Category Trend</p>
                           <p className="text-white font-bold">Electronics Dip</p>
                           <p className="text-xs text-gray-400 mt-1">Post-holiday slump expected. Reduce inventory depth by 15%.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2"><ShoppingCart size={18} className="text-yellow-400" /> Recommended Buy Orders</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
                           <tr>
                              <th className="p-3 rounded-l-lg">Product</th>
                              <th className="p-3 text-center">Current Stock</th>
                              <th className="p-3 text-center">Predicted Demand (30d)</th>
                              <th className="p-3 text-center">Suggested Buy</th>
                              <th className="p-3">AI Reasoning</th>
                              <th className="p-3 rounded-r-lg text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {products.filter(p => p.stock < 100).slice(0, 5).map((p, idx) => {
                              const predictedDemand = Math.floor(p.stock * 1.5 + 50);
                              const suggestedBuy = predictedDemand - p.stock;
                              return (
                                 <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                       <div className="w-8 h-8 rounded bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={14} className="text-gray-600" />
                                          )}
                                       </div>
                                       <span className="font-bold text-white">{p.name}</span>
                                    </td>
                                    <td className="p-4 text-center text-gray-400">{p.stock}</td>
                                    <td className="p-4 text-center text-white">{predictedDemand}</td>
                                    <td className="p-4 text-center">
                                       <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg font-bold">
                                          +{suggestedBuy}
                                       </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400 flex items-center gap-2">
                                       <Zap size={14} className="text-yellow-400" /> {idx % 2 === 0 ? 'High Velocity detected' : 'Seasonal Low Stock'}
                                    </td>
                                    <td className="p-4 text-right">
                                       <button
                                          onClick={() => addNotification('success', `PO Draft created for ${p.name}`)}
                                          className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg text-xs hover:bg-cyber-accent transition-colors"
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
            <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
               <div className="p-4 border-b border-white/5 flex gap-4 items-center">
                  <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex-1 max-w-md">
                     <Search size={16} className="text-gray-400" />
                     <input
                        className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none"
                        placeholder="Search product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search product"
                     />
                  </div>
                  <div className="flex gap-2 ml-auto">
                     <button
                        onClick={applyPsychologicalPricing}
                        disabled={isSubmitting}
                        className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                        title="Auto-round prices to .99"
                     >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        {isSubmitting ? 'Optimizing...' : 'Magic Rounding (.99)'}
                     </button>
                     {selectedIds.size > 0 && (
                        <button
                           onClick={applyBulkSale}
                           className="px-3 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary border border-cyber-primary/30 rounded-lg text-xs font-bold flex items-center gap-2"
                        >
                           <Percent size={14} /> Bulk Discount ({selectedIds.size})
                        </button>
                     )}
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-black/20 border-b border-white/5">
                           <th className="p-4 text-center w-12">
                              <input
                                 type="checkbox"
                                 className="accent-cyber-primary w-4 h-4"
                                 aria-label="Select all products"
                                 checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                 onChange={toggleSelectAll}
                              />
                           </th>
                           <th className="p-4 text-xs text-gray-500 uppercase">Product</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Retail Price</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Competitor</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Margin</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-center">Velocity</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-center">Sale Active</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {paginatedProducts.map(p => {
                           const isEditing = editingId === p.id;
                           const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                           const retail = isEditing ? editForm.price : p.price;
                           const margin = getMargin(retail, cost);
                           const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                           return (
                              <tr key={p.id} className={`hover:bg-white/5 transition-colors ${selectedIds.has(p.id) ? 'bg-cyber-primary/5' : ''}`}>
                                 <td className="p-4 text-center">
                                    <input
                                       type="checkbox"
                                       checked={selectedIds.has(p.id)}
                                       onChange={() => toggleSelection(p.id)}
                                       className="accent-cyber-primary w-4 h-4"
                                       aria-label={`Select ${p.name}`}
                                    />
                                 </td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={18} className="text-gray-600" />
                                          )}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-white">{p.name}</p>
                                          <p className="text-xs text-gray-500">{p.category}</p>
                                       </div>
                                    </div>
                                 </td>

                                 {/* Retail Price */}
                                 <td className="p-4 text-right">
                                    {isEditing ? (
                                       <input
                                          type="number"
                                          className="w-24 bg-black border border-white/20 rounded px-2 py-1 text-right text-white outline-none font-mono"
                                          value={editForm.price}
                                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                          aria-label="Retail Price"
                                       />
                                    ) : (
                                       <div className="flex flex-col items-end">
                                          <span className="text-white font-mono font-bold">{CURRENCY_SYMBOL} {retail.toLocaleString()}</span>
                                          <span className="text-[10px] text-gray-500">Cost: {cost.toLocaleString()}</span>
                                       </div>
                                    )}
                                 </td>

                                 {/* Competitor Analysis */}
                                 <td className="p-4 text-right">
                                    {p.competitorPrice ? (
                                       <div className="flex flex-col items-end">
                                          <span className="text-gray-400 font-mono text-xs">{CURRENCY_SYMBOL} {p.competitorPrice.toLocaleString()}</span>
                                          <span className={`text-[10px] font-bold ${compVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                             {compVariance > 0 ? '+' : ''}{compVariance.toFixed(1)}% vs Mkt
                                          </span>
                                       </div>
                                    ) : (
                                       <span className="text-gray-600 text-xs">-</span>
                                    )}
                                 </td>

                                 {/* Margin */}
                                 <td className="p-4 text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${margin < 15 ? 'bg-red-500/10 text-red-400' :
                                       margin > 40 ? 'bg-green-500/10 text-green-400' :
                                          'bg-yellow-500/10 text-yellow-400'
                                       }`}>
                                       {margin.toFixed(1)}%
                                    </span>
                                 </td>

                                 {/* Sales Velocity */}
                                 <td className="p-4 text-center">
                                    {p.salesVelocity === 'High' && <span className="text-green-400 text-xs font-bold flex justify-center items-center"><TrendingUp size={12} className="mr-1" /> High</span>}
                                    {p.salesVelocity === 'Medium' && <span className="text-yellow-400 text-xs font-bold">Medium</span>}
                                    {p.salesVelocity === 'Low' && <span className="text-red-400 text-xs font-bold">Low</span>}
                                 </td>

                                 {/* Is On Sale Toggle */}
                                 <td className="p-4 text-center">
                                    {isEditing ? (
                                       <div className="flex flex-col items-center gap-1">
                                          <input
                                             type="checkbox"
                                             checked={editForm.isOnSale}
                                             onChange={(e) => setEditForm({ ...editForm, isOnSale: e.target.checked })}
                                             className="w-4 h-4 accent-cyber-primary"
                                             aria-label="Toggle Sale Status"
                                          />
                                          {editForm.isOnSale && (
                                             <input
                                                type="number"
                                                className="w-16 text-[10px] bg-black border border-white/20 rounded text-center text-white"
                                                value={editForm.salePrice}
                                                onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) })}
                                                aria-label="Sale Price"
                                             />
                                          )}
                                       </div>
                                    ) : (
                                       p.isOnSale ? (
                                          <div className="flex flex-col items-center">
                                             <CheckCircle size={16} className="text-green-400 mb-1" />
                                             <span className="text-[10px] text-cyber-primary font-mono">{formatCompactNumber(p.salePrice, { currency: CURRENCY_SYMBOL })}</span>
                                          </div>
                                       ) : (
                                          <div className="w-4 h-4 mx-auto border rounded-full border-gray-600"></div>
                                       )
                                    )}
                                 </td>

                                 {/* Actions */}
                                 <td className="p-4 text-right">
                                    {isEditing ? (
                                       <button
                                          onClick={() => handleSavePrice(p.id)}
                                          disabled={isSubmitting}
                                          className="p-2 bg-cyber-primary text-black rounded-lg hover:bg-cyber-accent disabled:opacity-50"
                                          aria-label="Save Price"
                                       >
                                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                       </button>
                                    ) : (
                                       <div className="flex gap-2 justify-end">
                                          <button
                                             onClick={() => {
                                                setSelectedLocationProduct(p);
                                                setIsLocationModalOpen(true);
                                             }}
                                             className="p-2 bg-white/5 text-blue-400 rounded-lg hover:text-white hover:bg-blue-500/20"
                                             title="View Network Stock"
                                          >
                                             <Map size={16} />
                                          </button>
                                          <button
                                             onClick={() => handleEditClick(p)}
                                             className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white hover:bg-white/10"
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
                              <td colSpan={8} className="p-12 text-center">
                                 <div className="flex flex-col items-center justify-center text-gray-500">
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
                  <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                     {/* Info and Items Per Page */}
                     <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                           Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(endIndex, filteredProducts.length)}</span> of <span className="text-cyber-primary font-bold">{filteredProducts.length}</span> products
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-500">Show:</span>
                           <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                 setItemsPerPage(Number(e.target.value));
                                 setCurrentPage(1);
                              }}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-cyber-primary/50 cursor-pointer"
                              aria-label="Items per page"
                           >
                              {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                 <option key={n} value={n}>{n}</option>
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
                           className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === 1
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                           title="First page"
                        >
                           ««
                        </button>

                        {/* Previous */}
                        <button
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === 1
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
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
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                       ? 'bg-cyber-primary text-black'
                                       : 'text-gray-400 hover:text-white hover:bg-white/10'
                                       }`}
                                 >
                                    {page}
                                 </button>
                              ) : (
                                 <span key={idx} className="text-gray-500 px-1">...</span>
                              )
                           ))}
                        </div>

                        {/* Next */}
                        <button
                           onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === totalPages
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                        >
                           Next
                        </button>

                        {/* Last Page */}
                        <button
                           onClick={() => setCurrentPage(totalPages)}
                           disabled={currentPage === totalPages}
                           className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === totalPages
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
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
               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4">Clearance Strategy</h3>
                  <p className="text-xs text-gray-400 mb-6">
                     Calculate optimal discount schedules to clear slow-moving inventory by a target date without sacrificing unnecessary margin.
                  </p>

                  <div className="space-y-4">
                     <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Select Product</label>
                        <select
                           className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                           value={selectedMarkdownProduct?.id || ''}
                           onChange={(e) => setSelectedMarkdownProduct(products.find(p => p.id === e.target.value) || null)}
                           aria-label="Select Product for Markdown"
                        >
                           <option value="">Choose SKU to Simulate...</option>
                           <optgroup label="Recommended for Clearance (Low Velocity)">
                              {products.filter(p => p.salesVelocity === 'Low').map(p => (
                                 <option key={p.id} value={p.id}>{p.name} ({p.stock} units)</option>
                              ))}
                           </optgroup>
                           <optgroup label="Other Products">
                              {products.filter(p => p.salesVelocity !== 'Low').map(p => (
                                 <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                           </optgroup>
                        </select>
                     </div>

                     {selectedMarkdownProduct && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                           <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                              <div className="w-10 h-10 rounded bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                 {selectedMarkdownProduct.image && !selectedMarkdownProduct.image.includes('placeholder.com') ? (
                                    <img
                                       src={selectedMarkdownProduct.image}
                                       className="w-full h-full object-cover"
                                       alt=""
                                       onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                       }}
                                    />
                                 ) : (
                                    <Package size={18} className="text-gray-600" />
                                 )}
                              </div>
                              <div>
                                 <p className="font-bold text-white text-sm">{selectedMarkdownProduct.name}</p>
                                 <p className="text-[10px] text-gray-400">{selectedMarkdownProduct.sku}</p>
                              </div>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Current Price</span>
                              <span className="text-white font-mono">{formatCompactNumber(selectedMarkdownProduct.price, { currency: CURRENCY_SYMBOL })}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Break-Even Cost</span>
                              <span className="text-white font-mono">{formatCompactNumber(selectedMarkdownProduct.costPrice || selectedMarkdownProduct.price * 0.7, { currency: CURRENCY_SYMBOL })}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Weeks on Shelf</span>
                              <span className="text-red-400 font-bold">12 Weeks</span>
                           </div>
                        </div>
                     )}

                     <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Target Exit Date</label>
                        <input type="date" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" aria-label="Target Exit Date" />
                     </div>

                     <button
                        onClick={calculateMarkdown}
                        disabled={!selectedMarkdownProduct || isMarkdownSimulating}
                        className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isMarkdownSimulating ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                        {isMarkdownSimulating ? 'Calculating Elasticity...' : 'Generate Glide Path'}
                     </button>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6 flex flex-col">
                  <h3 className="font-bold text-white mb-2">Projected Depletion Path</h3>
                  <div className="flex-1 min-h-[300px]">
                     {selectedMarkdownProduct ? (
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <AreaChart data={MARKDOWN_DATA}>
                              <defs>
                                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis dataKey="week" stroke="#666" fontSize={12} />
                              <YAxis yAxisId="left" stroke="#666" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#00ff9d" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                              <Line yAxisId="right" type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} name="Price Point" />
                              <Line yAxisId="right" type="monotone" dataKey="stock" stroke="#ef4444" strokeDasharray="5 5" name="Stock Level" />
                           </AreaChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
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
                     <div key={rule.id} className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-cyber-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                           <div className={`p-3 rounded-xl ${rule.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                              <BrainCircuit size={24} />
                           </div>
                           <div>
                              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                 {rule.name}
                                 {rule.isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase border border-green-500/30">Active</span>}
                              </h3>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 font-mono">
                                 <span className="bg-white/5 px-2 py-1 rounded text-white">IF {rule.condition.replace('X', rule.threshold.toString())}</span>
                                 <ArrowRight size={14} />
                                 <span className="bg-cyber-primary/10 text-cyber-primary px-2 py-1 rounded border border-cyber-primary/20">{rule.action} {rule.value}%</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Applies to: <span className="text-white">{rule.targetCategory}</span></p>
                           </div>
                        </div>
                        <button
                           onClick={() => runPricingRule(rule)}
                           disabled={isSubmitting}
                           className="p-3 bg-white/5 hover:bg-cyber-primary hover:text-black rounded-xl transition-all border border-white/10 group-hover:border-cyber-primary/50 disabled:opacity-50"
                           aria-label="Run Rule Now"
                           title="Run Rule Now"
                        >
                           {isSubmitting ? <Loader2 size={20} className="animate-spin text-cyber-primary" /> : <Play size={20} />}
                        </button>
                        <div className="flex flex-col gap-2 ml-2">
                           <button
                              onClick={() => toggleRuleStatus(rule.id)}
                              className={`p-2 rounded-lg border transition-all ${rule.isActive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-500/10 border-white/10 text-gray-400'}`}
                              title={rule.isActive ? "Deactivate Rule" : "Activate Rule"}
                           >
                              <Power size={16} />
                           </button>
                           <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
                              title="Delete Rule"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  ))}

                  <button
                     onClick={() => setIsRuleModalOpen(true)}
                     className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-cyber-primary hover:border-cyber-primary/50 transition-all flex items-center justify-center gap-2"
                  >
                     <Plus size={20} /> Create New Automation Rule
                  </button>
               </div>

               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4">Rule Simulator</h3>
                  <p className="text-xs text-gray-400 mb-6">Test how rules affect your margins before activating them.</p>
                  <div className="space-y-4">
                     <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase mb-1">Projected Impact</p>
                        <div className="flex justify-between items-center">
                           <span className="text-white text-sm">Revenue</span>
                           <span className={`text-sm font-mono font-bold ${simResult && simResult.rev > 0 ? 'text-green-400' : 'text-white'}`}>
                              {simResult ? `${simResult.rev > 0 ? '+' : ''}${simResult.rev}%` : '--'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-white text-sm">Margin</span>
                           <span className={`text-sm font-mono font-bold ${simResult && simResult.margin < 0 ? 'text-red-400' : 'text-white'}`}>
                              {simResult ? `${simResult.margin > 0 ? '+' : ''}${simResult.margin}%` : '--'}
                           </span>
                        </div>
                     </div>
                     <button
                        onClick={handleRunSimulation}
                        disabled={isSimulating}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isSimulating ? <RefreshCw className="animate-spin" size={16} /> : 'Run Simulation'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- PLANOGRAM (INTERACTIVE) --- */}
         {activeTab === 'planogram' && (
            <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-white">Interactive Shelf Map</h3>
                     <p className="text-xs text-gray-400 mt-1">Drag (Click) to rearrange. Enable heatmap to see sales velocity.</p>
                  </div>
                  <button
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${showHeatmap ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/5'}`}
                  >
                     <Flame size={16} /> Heatmap: {showHeatmap ? 'ON' : 'OFF'}
                  </button>
               </div>
               <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Shelf Visualization */}
                  <div className="lg:col-span-2 bg-black/30 border border-white/10 rounded-xl p-8 relative">
                     <div className="absolute top-2 left-2 text-[10px] text-gray-500 uppercase tracking-widest">Aisle 4 - Zone B</div>

                     <div className="space-y-6 mt-4">
                        {['Top Shelf', 'Eye Level', 'Bottom Shelf'].map((shelf, shelfIdx) => (
                           <div key={shelf} className={`h-24 border-b-8 border-gray-700 flex items-end px-4 gap-4 relative ${shelf === 'Eye Level' ? 'bg-white/5' : ''}`}>
                              <div className={`absolute -left-24 bottom-2 text-xs w-20 text-right font-bold ${shelf === 'Eye Level' ? 'text-cyber-primary' : 'text-gray-500'}`}>{shelf}</div>

                              {products.filter(p => p.shelfPosition === shelf || (shelf === 'Bottom Shelf' && !p.shelfPosition)).slice(0, 5).map(p => {
                                 const isHot = p.salesVelocity === 'High';
                                 const isCold = p.salesVelocity === 'Low';
                                 const isSelected = swapSource === p.id;

                                 return (
                                    <div
                                       key={p.id}
                                       onClick={() => handleShelfSwap(p.id)}
                                       className={`w-16 h-20 rounded transition-all cursor-pointer relative group/prod overflow-hidden border-2 ${isSelected ? 'border-yellow-400 scale-110 z-10' : 'border-transparent hover:border-white/30'
                                          } ${showHeatmap && isHot ? 'bg-red-500/40' : showHeatmap && isCold ? 'bg-blue-500/40' : 'bg-white/5'
                                          }`}
                                    >
                                       <div className="w-full h-full bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {p.image && !p.image.includes('placeholder.com') ? (
                                             <img
                                                src={p.image}
                                                className="w-full h-full object-cover opacity-80"
                                                alt=""
                                                onError={(e) => {
                                                   e.currentTarget.style.display = 'none';
                                                   (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                             />
                                          ) : (
                                             <Package size={32} className="text-gray-600" />
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
                                    className="h-20 w-16 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 hover:text-cyber-primary hover:border-cyber-primary hover:bg-white/5 transition-all ml-2"
                                    title={`Place on ${shelf}`}
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
                     <div className="bg-white/5 rounded-xl border border-white/5 p-4 max-h-[300px] overflow-y-auto">
                        <h4 className="text-sm font-bold text-white mb-2 sticky top-0 bg-[#1e2025] pb-2 border-b border-white/5 flex justify-between items-center">
                           <span>Unassigned ({products.filter(p => !p.shelfPosition).length})</span>
                           <span className="text-[10px] text-gray-400">Click to Place</span>
                        </h4>
                        <div className="space-y-2">
                           {products.filter(p => !p.shelfPosition).slice(0, 10).map(p => (
                              <div
                                 key={p.id}
                                 onClick={() => handleShelfSwap(p.id)}
                                 className={`flex items-center gap-2 p-2 rounded hover:bg-white/10 cursor-pointer border border-transparent ${swapSource === p.id ? 'border-yellow-400 bg-white/10' : ''}`}
                              >
                                 <div className="w-8 h-8 rounded bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                       <img
                                          src={p.image}
                                          className="w-full h-full object-cover"
                                          alt=""
                                          onError={(e) => {
                                             e.currentTarget.style.display = 'none';
                                             (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                          }}
                                       />
                                    ) : (
                                       <Package size={14} className="text-gray-600" />
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white truncate font-medium">{p.name}</p>
                                    <p className="text-[10px] text-gray-500">{p.sku}</p>
                                 </div>
                                 {swapSource === p.id && <MousePointer2 size={12} className="text-yellow-400" />}
                              </div>
                           ))}
                           {products.filter(p => !p.shelfPosition).length > 10 && (
                              <p className="text-[10px] text-center text-gray-500 italic">...and {products.filter(p => !p.shelfPosition).length - 10} more</p>
                           )}
                        </div>
                     </div>

                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-sm font-bold text-white mb-2">Shelf Efficiency</h4>
                        <div className="space-y-3">
                           <div>
                              <div className="flex justify-between text-xs mb-1">
                                 <span className="text-cyber-primary">Eye Level</span>
                                 <span className="text-white">450 Sales/Wk</span>
                              </div>
                              <div className="w-full h-1 bg-black/50 rounded-full"><div className="h-full bg-cyber-primary w-[85%] rounded-full"></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-xs mb-1">
                                 <span className="text-gray-400">Top Shelf</span>
                                 <span className="text-white">120 Sales/Wk</span>
                              </div>
                              <div className="w-full h-1 bg-black/50 rounded-full"><div className="h-full bg-gray-500 w-[30%] rounded-full"></div></div>
                           </div>
                        </div>
                     </div>
                     <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20 text-xs text-blue-300">
                        <strong>Optimization Tip:</strong> 3 Low-velocity items detected on Eye Level shelf. Recommend swapping with "Neon Energy Drink".
                     </div>
                     <button
                        onClick={() => setSimResult({ rev: 5.2, margin: 1.1 })}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                     >
                        <RefreshCw size={16} /> Auto-Optimize
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- PROMOTIONS (EXISTING) --- */}
         {activeTab === 'promos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Promo Stats */}
               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">Active Campaigns</h3>
                  <div className="flex items-end justify-between">
                     <span className="text-4xl font-bold text-white font-mono">{promotions.filter(p => p.status === 'Active').length}</span>
                     <BarChart3 className="text-cyber-primary mb-2" />
                  </div>
               </div>

               <div className="md:col-span-2 flex justify-end items-start">
                  <button
                     onClick={() => setIsPromoModalOpen(true)}
                     className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                  >
                     <Plus size={18} className="mr-2" />
                     New Promotion
                  </button>
               </div>

               <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promotions.map(promo => (
                     <div key={promo.id} className="bg-cyber-gray border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-primary/30 transition-all">
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${promo.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                           }`}>
                           {promo.status}
                        </div>

                        <div className="mb-4">
                           <div className="flex items-center gap-2 mb-1">
                              <Tags size={16} className="text-cyber-primary" />
                              <span className="text-xs text-gray-400">Promo Code</span>
                           </div>
                           <h3 className="text-2xl font-bold text-white font-mono tracking-wider">{promo.code}</h3>
                        </div>

                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                           <div>
                              <p className="text-xs text-gray-500 mb-1">Discount Value</p>
                              <p className="text-lg font-bold text-white">
                                 {promo.type === 'FIXED' ? CURRENCY_SYMBOL : ''}{promo.value}{promo.type === 'PERCENTAGE' ? '%' : ''} OFF
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Redemptions</p>
                              <p className="text-sm font-mono text-white">{promo.usageCount}</p>
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
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Promo Code</label>
                  <input
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary uppercase font-mono"
                     placeholder="e.g. FLASH50"
                     value={newPromo.code || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                     aria-label="Promo Code"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Type</label>
                     <select
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newPromo.type}
                        onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                        aria-label="Promo Type"
                     >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Value</label>
                     <input
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newPromo.value || ''}
                        onChange={(e) => setNewPromo({ ...newPromo, value: parseFloat(e.target.value) })}
                        aria-label="Promo Value"
                     />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Expiry Date</label>
                  <input
                     type="date"
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                     value={newPromo.expiryDate || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                     aria-label="Promo Expiry"
                  />
               </div>
               <button
                  onClick={handleCreatePromo}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Rule Name</label>
                  <input
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                     placeholder="e.g. Low Stock Clearance"
                     value={newRule.name || ''}
                     onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                     aria-label="Rule Name"
                  />
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Target Category</label>
                  <select
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                     value={newRule.targetCategory}
                     onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                     aria-label="Target Category"
                  >
                     {Object.keys(GROCERY_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Trigger Condition</label>
                     <select
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newRule.condition}
                        onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                        aria-label="Trigger Condition"
                     >
                        <option>Stock &gt; X</option>
                        <option>Expiry &lt; X Days</option>
                        <option>Sales &lt; X</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Threshold (X)</label>
                     <input
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newRule.threshold || ''}
                        onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                        aria-label="Threshold Value"
                     />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Action</label>
                     <select
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newRule.action}
                        onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                        aria-label="Action"
                     >
                        <option>Increase Price</option>
                        <option>Decrease Price</option>
                        <option>Set Margin</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Value (%)</label>
                     <input
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newRule.value || ''}
                        onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                        aria-label="Action Value"
                     />
                  </div>
               </div>
               <button
                  onClick={handleCreateRule}
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-4"
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
               <p className="text-sm text-gray-400">
                  Enter the discount percentage to apply to {selectedIds.size} selected product{selectedIds.size !== 1 ? 's' : ''}.
               </p>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Discount Percentage</label>
                  <input
                     type="number"
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
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
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                     <div className="w-16 h-16 rounded bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {selectedLocationProduct.image && !selectedLocationProduct.image.includes('placeholder.com') ? (
                           <img
                              src={selectedLocationProduct.image}
                              className="w-full h-full object-cover"
                              alt=""
                              onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                              }}
                           />
                        ) : (
                           <Package size={24} className="text-gray-600" />
                        )}
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">{selectedLocationProduct.name}</h3>
                        <p className="text-gray-400">{selectedLocationProduct.sku}</p>
                     </div>
                     <div className="ml-auto text-right">
                        <p className="text-xs text-gray-400 uppercase">Total Network Asset</p>
                        <p className="text-2xl font-bold text-cyber-primary font-mono">
                           {products
                              .filter(p => p.sku === selectedLocationProduct.sku)
                              .reduce((sum, p) => sum + p.stock, 0)} Units
                        </p>
                     </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/10">
                     <table className="w-full text-left">
                        <thead className="bg-black/40 text-xs uppercase text-gray-400 font-bold">
                           <tr>
                              <th className="p-4">Location</th>
                              <th className="p-4">Type</th>
                              <th className="p-4 text-center">Stock Level</th>
                              <th className="p-4 text-right">Aisle / Shelf</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {products
                              .filter(p => p.sku === selectedLocationProduct.sku)
                              .map(p => {
                                 const site = sites.find(s => s.id === p.siteId || s.id === (p as any).site_id);
                                 return (
                                    <tr key={p.id} className="hover:bg-white/5">
                                       <td className="p-4 font-bold text-white">
                                          {site ? site.name : 'Unknown Site'}
                                       </td>
                                       <td className="p-4 text-sm text-gray-400">
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
                                                      <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                                                         <Truck size={10} />
                                                         On Order: {totalOnOrder}
                                                      </div>
                                                   )}
                                                   {incomingCost > 0 && incomingCost !== (p.costPrice || 0) && (
                                                      <div className={`text-[10px] flex items-center gap-1 ${incomingCost > (p.costPrice || 0) ? 'text-red-400' : 'text-green-400'}`}>
                                                         {incomingCost > (p.costPrice || 0) ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                         New Cost: ${(incomingCost).toFixed(2)}
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                          })()}
                                       </td>
                                       <td className="p-4 align-top">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 20 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                             {p.stock} Units
                                          </span>
                                       </td>
                                       <td className="p-4 text-right font-mono text-white">
                                          {p.shelfPosition || <span className="text-gray-600 italic">Unassigned</span>}
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
