import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Product, WMSJob } from '../../types';
import { ReplenishHeader } from './replenish/ReplenishHeader';
import { ReplenishList } from './replenish/ReplenishList';
import { ReplenishHistory } from './replenish/ReplenishHistory';

interface ReplenishTabProps {
    filteredProducts: Product[];
    products: Product[];
    historicalJobs: WMSJob[];
    sales: any[];
    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    wmsJobsService: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    activeSite: any;
}

const REPLENISH_ITEMS_PER_PAGE = 25;
const REPLENISH_HISTORY_PER_PAGE = 25;

export const ReplenishTab: React.FC<ReplenishTabProps> = ({
    filteredProducts, products, historicalJobs, sales,
    isSubmitting, setIsSubmitting, setSelectedJob, setIsDetailsOpen,
    wmsJobsService, addNotification, activeSite
}) => {
    // --- REPLENISH-SPECIFIC STATE ---
    const [replenishSearch, setReplenishSearch] = useState('');
    const [replenishCurrentPage, setReplenishCurrentPage] = useState(1);
    const [replenishFilter, setReplenishFilter] = useState<'all' | 'critical' | 'low' | 'optimal'>('all');
    const [replenishSortBy, setReplenishSortBy] = useState<'urgency' | 'stock' | 'name'>('urgency');
    const [isReplenishFilterDropdownOpen, setIsReplenishFilterDropdownOpen] = useState(false);
    const [isReplenishSortDropdownOpen, setIsReplenishSortDropdownOpen] = useState(false);
    const [selectedReplenishItems, setSelectedReplenishItems] = useState<Set<string>>(new Set());
    const [expandedReplenishItem, setExpandedReplenishItem] = useState<string | null>(null);
    const [creatingReplenishTask, setCreatingReplenishTask] = useState<string | null>(null);

    // --- SORTED/FILTERED REPLENISH ITEMS ---
    const sortedReplenishItems = useMemo(() => {
        return filteredProducts
            .filter(p => {
                if (replenishSearch && !p.name.toLowerCase().includes(replenishSearch.toLowerCase()) && !p.sku?.toLowerCase().includes(replenishSearch.toLowerCase())) return false;
                const minStock = p.minStock || 10;
                if (replenishFilter === 'critical') return p.stock === 0;
                if (replenishFilter === 'low') return p.stock > 0 && p.stock < minStock;
                if (replenishFilter === 'optimal') return p.stock >= minStock;
                return p.stock < minStock * 2;
            })
            .sort((a, b) => {
                if (replenishSortBy === 'urgency') {
                    if (a.stock === 0 && b.stock !== 0) return -1;
                    if (b.stock === 0 && a.stock !== 0) return 1;
                    return (a.stock / (a.minStock || 10)) - (b.stock / (b.minStock || 10));
                }
                if (replenishSortBy === 'stock') return a.stock - b.stock;
                if (replenishSortBy === 'name') return a.name.localeCompare(b.name);
                return 0;
            });
    }, [filteredProducts, replenishSearch, replenishFilter, replenishSortBy]);

    const replenishTotalPages = Math.ceil(sortedReplenishItems.length / REPLENISH_ITEMS_PER_PAGE);
    const safeReplenishCurrentPage = Math.min(Math.max(1, replenishCurrentPage), Math.max(1, replenishTotalPages));

    const paginatedReplenishItems = useMemo(() => {
        const start = (safeReplenishCurrentPage - 1) * REPLENISH_ITEMS_PER_PAGE;
        return sortedReplenishItems.slice(start, start + REPLENISH_ITEMS_PER_PAGE);
    }, [sortedReplenishItems, safeReplenishCurrentPage]);

    useEffect(() => {
        setReplenishCurrentPage(1);
    }, [replenishSearch, replenishFilter, replenishSortBy]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
            <ReplenishHeader
                filteredProducts={filteredProducts}
                products={products}
                replenishSearch={replenishSearch}
                setReplenishSearch={setReplenishSearch}
                replenishFilter={replenishFilter}
                setReplenishFilter={setReplenishFilter}
                isReplenishFilterDropdownOpen={isReplenishFilterDropdownOpen}
                setIsReplenishFilterDropdownOpen={setIsReplenishFilterDropdownOpen}
                replenishSortBy={replenishSortBy}
                setReplenishSortBy={setReplenishSortBy}
                isReplenishSortDropdownOpen={isReplenishSortDropdownOpen}
                setIsReplenishSortDropdownOpen={setIsReplenishSortDropdownOpen}
                selectedReplenishItems={selectedReplenishItems}
                setSelectedReplenishItems={setSelectedReplenishItems}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
                wmsJobsService={wmsJobsService}
                addNotification={addNotification}
                activeSite={activeSite}
            />

            <ReplenishList
                sortedReplenishItems={sortedReplenishItems}
                paginatedReplenishItems={paginatedReplenishItems}
                replenishCurrentPage={safeReplenishCurrentPage}
                replenishTotalPages={replenishTotalPages}
                REPLENISH_ITEMS_PER_PAGE={REPLENISH_ITEMS_PER_PAGE}
                setReplenishCurrentPage={setReplenishCurrentPage}
                selectedReplenishItems={selectedReplenishItems}
                setSelectedReplenishItems={setSelectedReplenishItems}
                expandedReplenishItem={expandedReplenishItem}
                setExpandedReplenishItem={setExpandedReplenishItem}
                creatingReplenishTask={creatingReplenishTask}
                setCreatingReplenishTask={setCreatingReplenishTask}
                sales={sales}
                wmsJobsService={wmsJobsService}
                addNotification={addNotification}
                activeSite={activeSite}
            />

            <ReplenishHistory
                historicalJobs={historicalJobs}
                REPLENISH_HISTORY_PER_PAGE={REPLENISH_HISTORY_PER_PAGE}
                setSelectedJob={setSelectedJob}
                setIsDetailsOpen={setIsDetailsOpen}
            />
        </div>
    );
};
