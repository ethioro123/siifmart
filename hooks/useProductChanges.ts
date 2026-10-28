import { useState,useMemo,useEffect } from 'react';
import { priceHistorySince,type PriceHistoryWindow } from '../utils/priceHistoryRetention';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryRequestsService } from '../services/inventory-requests.service';
import { productPriceHistoryService } from '../services/product-price-history.service';
import { useStore } from '../contexts/CentralStore';
import type { Product } from '../types';
export function useProductChanges(product: Product | null, country: string, page: number, enabled: boolean, resetPage?: (page:number)=>void) {
    const { user } = useStore();
    const [historyWindow,setWindow]=useState<PriceHistoryWindow>('12months');const [historySearch,setSearch]=useState('');
    useEffect(()=>{setWindow('12months');setSearch('');},[product?.id,country,user?.id]);
    const since=useMemo(()=>priceHistorySince(historyWindow),[historyWindow,product?.id,country]);
    const setHistoryWindow=(window:PriceHistoryWindow)=>{setWindow(window);resetPage?.(1);};
    const setHistorySearch=(value:string)=>{setSearch(value.slice(0,200));resetPage?.(1);};
    const cache = useQueryClient();
    const site = product?.siteId || product?.site_id || '';
    const scope = [country, site, user?.id, product?.id || ''];
    const pending = useQuery({ queryKey: ['product_pending_changes', ...scope], enabled: Boolean(user?.id && site), queryFn: () => inventoryRequestsService.getMerchandisingRequests(country, { productId: product?.id || '', siteId: site, status: 'pending', limit: 10 }), staleTime: 15_000 });
    const history = useQuery({ queryKey: ['product_change_history', ...scope, page], enabled: enabled && Boolean(site && user?.id), queryFn: () => inventoryRequestsService.getMerchandisingRequests(country, { productId: product?.id || '', siteId: site, status: 'all', page, limit: 10 }) });
    const prices = useQuery({ queryKey: ['product_applied_prices', ...scope, page,historyWindow,historySearch], enabled: enabled && Boolean(site && user?.id), queryFn: () => productPriceHistoryService.listByProduct(site, country, product?.id || '', (page - 1) * 10, 10,{since,search:historySearch}) });
    const decision = useMutation({ mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject' | 'finance'; reason?: string }) => {
        if (action === 'approve') return inventoryRequestsService.approveProductEdit(id);
        if (action === 'finance') await inventoryRequestsService.signoffMerchandisingPrice(id);
        else await inventoryRequestsService.rejectProductEdit(id, reason || '');
        return null;
    }, onSuccess: result => {
        for (const key of ['product_pending_changes','product_change_history','inventory_requests','merchandising_reviews']) cache.invalidateQueries({ queryKey: [key] });
        if (result?.applied) for (const key of ['products','price_manager_catalog','product_applied_prices','product_workspace_record']) cache.invalidateQueries({ queryKey: [key] });
    } });
    return { pending, history, prices, decision,historyWindow,setHistoryWindow,historySearch,setHistorySearch };
}
