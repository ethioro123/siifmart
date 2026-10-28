import type { SimulationResult } from './utils/simulationRunner';
import type { PriceBatch, PriceBatchResult, PriceChangeInput } from '../../utils/priceManager';
import React, { createContext, useContext } from 'react';
import type { Product, Promotion, PricingRule } from '../../types';
import type { ProductSalesMetrics } from '../../utils/merchandisingAnalytics';

export type MerchandisingTab = 'pricing' | 'rules' | 'promos' | 'planogram' | 'markdown' | 'forecast' | 'shelf-tags' | 'reviews';

export interface MerchandisingFilters {
   categories: string[];
   sites: string[];
   velocities: string[];
   onSale: boolean | null;
   minPrice: string;
   maxPrice: string;
   minMargin: string;
   maxMargin: string;
}

export interface MerchandisingContextType {
   // Data from DataContext
   products: Product[];
   catalogCount: number; catalogLoading: boolean; catalogError: string | null;
   priceBatch: PriceBatch | null; batchFailures: PriceBatchResult['failures'];
   confirmPriceBatch: () => Promise<void>; cancelPriceBatch: () => void;
   promotions: Promotion[];
   sites: any[];
   allOrders: any[];
   salesMetricsIndex: Map<string, ProductSalesMetrics>;
   refreshData: () => Promise<void>;
   addNotification: (type: any, message: string) => void;
   updateProduct: (p: Product) => Promise<any>;
   updatePricesBySKU: (sku: string, updates: any, targetSiteIds?: string[]) => Promise<any>;
   addPromotion: (promo: any) => Promise<any>;
   currencySymbol: string;
   activeCountry: string;

   // Shared state
   activeTab: MerchandisingTab;
   setActiveTab: (tab: MerchandisingTab) => void;
   pricingRules: PricingRule[];
   searchTerm: string;
   setSearchTerm: (term: string) => void;

   // Pagination
   currentPage: number;
   setCurrentPage: (page: number) => void;
   itemsPerPage: number;
   setItemsPerPage: (size: number) => void;

   // Edit state
   editingId: string | null;
   setEditingId: (id: string | null) => void;
   editForm: { price: number; cost: number; salePrice: number; isOnSale: boolean; applyToAll: boolean };
   setEditForm: React.Dispatch<React.SetStateAction<{ price: number; cost: number; salePrice: number; isOnSale: boolean; applyToAll: boolean }>>;
   isSubmitting: boolean;
   setIsSubmitting: (sub: boolean) => void;

   // Bulk state
   selectedIds: Set<string>;
   setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;

   // Modal open states
   isPromoModalOpen: boolean;
   setIsPromoModalOpen: (open: boolean) => void;
   newPromo: Partial<Promotion>;
   setNewPromo: React.Dispatch<React.SetStateAction<Partial<Promotion>>>;

   isRuleModalOpen: boolean;
   setIsRuleModalOpen: (open: boolean) => void;
   newRule: Partial<PricingRule>;
   setNewRule: React.Dispatch<React.SetStateAction<Partial<PricingRule>>>;
   pricingRulesMutating: boolean;
   pricingRulesLoading: boolean;
   pricingRulesError: string | null;
   retryPricingRules: () => void;
   pricingRulesTotalCount: number;
   pricingRulesPage: number;
   setPricingRulesPage: (page: number) => void;
   pricingRulesTotalPages: number;
   pricingRulesSearch: string;
   setPricingRulesSearch: (search: string) => void;
   pricingRulesStatus: 'all' | 'enabled' | 'paused';
   setPricingRulesStatus: (status: 'all' | 'enabled' | 'paused') => void;
   isCreatingRule: boolean;
   ruleValidationErrors: Record<string, string>;
   setRuleValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

   isBulkDiscountModalOpen: boolean;
   setIsBulkDiscountModalOpen: (open: boolean) => void;
   bulkDiscountValue: string;
   setBulkDiscountValue: (val: string) => void;

   // Heatmap/Planogram
   showHeatmap: boolean;
   setShowHeatmap: (show: boolean) => void;
   swapSource: string | null;
   setSwapSource: (src: string | null) => void;

   // Markdown
   selectedMarkdownProduct: Product | null;
   setSelectedMarkdownProduct: (p: Product | null) => void;
   isMarkdownSimulating: boolean;
   setIsMarkdownSimulating: (sim: boolean) => void;

   // Forecast/Simulation
   simResult: SimulationResult | null;
   setSimResult: (res: SimulationResult | null) => void;
   isSimulating: boolean;
   setIsSimulating: (sim: boolean) => void;

   // Location Matrix
   isLocationModalOpen: boolean;
   setIsLocationModalOpen: (open: boolean) => void;
   selectedLocationProduct: Product | null;
   setSelectedLocationProduct: (p: Product | null) => void;

   // Product Control Modal
   isProductControlOpen: boolean;
   setIsProductControlOpen: (open: boolean) => void;
   selectedControlProduct: Product | null;
   setSelectedControlProduct: (p: Product | null) => void;
   openProductControl: (p: Product, tab?: 'profile' | 'unit' | 'pricing' | 'stock') => void;

   // Handlers
   handleSort: (key: keyof Product | 'margin') => void;
   handleCreatePromo: () => void;
   handleEditClick: (p: Product) => void;
   handleSavePrice: (id: string) => void;
   previewLocationPrice: (change: PriceChangeInput) => void;
   handleApplyBulkDiscount: () => void;
   handleCreateRule: () => void;
   handleRunSimulation: () => void;
   handleShelfSwap: (productId: string) => void;
   handleMoveToShelf: (shelfName: string) => void;
   submitPlanogram: (changes: Array<{ product: Product; shelfPosition: string }>, customReason?: string) => Promise<any>;

   runPricingRule: (rule: PricingRule) => Promise<void>;
   toggleRuleStatus: (id: string) => void;
   deleteRule: (id: string) => void;
   calculateMarkdown: () => void;

   applyPsychologicalPricing: (target: '5' | '0') => Promise<void>;
   applyBulkSale: () => void;
   toggleSelection: (id: string) => void;
   toggleSelectAll: () => void;
   getMargin: (price: number, cost: number) => number;

   // Sorting and filtering state
   sortConfig: { key: keyof Product | 'margin'; direction: 'asc' | 'desc' };
   setSortConfig: React.Dispatch<React.SetStateAction<{ key: keyof Product | 'margin'; direction: 'asc' | 'desc' }>>;
   filters: MerchandisingFilters;
   setFilters: React.Dispatch<React.SetStateAction<MerchandisingFilters>>;
   isFilterPanelOpen: boolean;
   setIsFilterPanelOpen: (open: boolean) => void;
   filteredProducts: Product[];
}

const MerchandisingContext = createContext<MerchandisingContextType | null>(null);

export const useMerchandising = () => {
   const ctx = useContext(MerchandisingContext);
   if (!ctx) throw new Error('useMerchandising must be used within MerchandisingProvider');
   return ctx;
};

export const MerchandisingProvider: React.FC<{
   value: MerchandisingContextType;
   children: React.ReactNode;
}> = ({ value, children }) => (
   <MerchandisingContext.Provider value={value}>
      {children}
   </MerchandisingContext.Provider>
);
