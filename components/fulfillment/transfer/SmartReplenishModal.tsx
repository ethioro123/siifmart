import React from 'react';
import { WMSJob, Product, Site, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';

// --- Hook and Sub-Components ---
import { useSmartReplenishState } from './hooks/useSmartReplenishState';
import { SmartReplenishHeader } from './components/SmartReplenishHeader';
import { CriticalNeedsPanel } from './components/CriticalNeedsPanel';
import { AllocationSidebar } from './components/AllocationSidebar';

interface SmartReplenishModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    wmsJobsService: any;
    productsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    renderTabs: () => React.ReactNode;
}

export const SmartReplenishModal: React.FC<SmartReplenishModalProps> = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    wmsJobsService,
    productsService,
    addNotification,
    refreshData,
    renderTabs
}) => {
    const { settings } = useData();

    const state = useSmartReplenishState({
        isOpen,
        onClose,
        sites,
        products,
        allProducts,
        user,
        wmsJobsService,
        productsService,
        addNotification,
        refreshData,
        settings
    });

    if (!isOpen) return null;

    // Filter needs list based on search and status/store selectors
    const filteredItems = state.distHubLowStockItems.filter(item => {
        const siteName = sites.find((s: Site) => s.id === (item.siteId || item.site_id))?.name || '';
        const matchQuery =
            item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            siteName.toLowerCase().includes(state.searchQuery.toLowerCase());

        if (!matchQuery) return false;

        const stockRatio = item.stock / (item.minStock || 1);
        const isCritical = stockRatio <= 0.3;
        if (state.filterStatus === 'CRITICAL' && !isCritical) return false;
        if (state.filterStatus === 'LOW' && isCritical) return false;

        const storeId = item.siteId || item.site_id;
        if (state.filterStoreId !== 'ALL' && storeId !== state.filterStoreId) return false;

        return true;
    });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full h-full md:p-8 flex flex-col">
                <div className="flex-1 bg-cyber-gray md:rounded-3xl border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.1)] flex flex-col overflow-hidden relative">
                    
                    {/* Header bar */}
                    <SmartReplenishHeader
                        distHubSectorIntegrity={state.distHubSectorIntegrity}
                        formatMissionTime={state.formatMissionTime}
                        distHubTimer={state.distHubTimer}
                        renderTabs={renderTabs}
                        onClose={onClose}
                    />

                    {/* Tactical background Grid layout */}
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
                        {/* Left Panel: Store Needs List */}
                        <CriticalNeedsPanel
                            filteredItems={filteredItems}
                            searchQuery={state.searchQuery}
                            setSearchQuery={state.setSearchQuery}
                            filterStoreId={state.filterStoreId}
                            setFilterStoreId={state.setFilterStoreId}
                            filterStatus={state.filterStatus}
                            setFilterStatus={state.setFilterStatus}
                            distHubLowStockItems={state.distHubLowStockItems}
                            distHubLoading={state.distHubLoading}
                            fetchDistHubData={state.fetchDistHubData}
                            distHubSelectedSku={state.distHubSelectedSku}
                            distHubSelectedDestSite={state.distHubSelectedDestSite}
                            handleSelectLowStockProduct={state.handleSelectLowStockProduct}
                            sites={sites}
                        />

                        {/* Right Panel: Source Allocations Sidebar & Launchpad */}
                        <AllocationSidebar
                            distHubSelectedSku={state.distHubSelectedSku}
                            distHubSelectedDestSite={state.distHubSelectedDestSite}
                            distHubAvailableSources={state.distHubAvailableSources}
                            distHubAllocQty={state.distHubAllocQty}
                            incrementQty={state.incrementQty}
                            decrementQty={state.decrementQty}
                            handleQtyChange={state.handleQtyChange}
                            addToDistDraft={state.addToDistDraft}
                            dbDraftJobs={state.dbDraftJobs}
                            settings={settings}
                            user={user}
                            sites={sites}
                            allProducts={allProducts}
                            distHubLoading={state.distHubLoading}
                            setDistHubLoading={state.setDistHubLoading}
                            wmsJobsService={wmsJobsService}
                            addNotification={addNotification}
                            fetchDistHubData={state.fetchDistHubData}
                            updateDraftItemQty={state.updateDraftItemQty}
                            removeDraftItem={state.removeDraftItem}
                            submitDistTransfers={state.submitDistTransfers}
                            getZoneName={state.getZoneName}
                            distHubLowStockItems={state.distHubLowStockItems}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
