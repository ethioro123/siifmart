import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { employeesService } from '../services/employees.service';
import { shiftsService } from '../services/shifts.service';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { salesService } from '../services/sales.service';
import { transfersService } from '../services/transfers.service';
import type { Product, Employee, ShiftRecord, PurchaseOrder, SaleRecord, TransferRecord } from '../types';

interface UseRegionalDataQueriesProps {
  regionCode: string;
  siteIds: string[];
  enabled?: boolean;
}

export interface UseRegionalDataQueriesResult {
  regionalProducts: Product[];
  regionalEmployees: Employee[];
  regionalShifts: ShiftRecord[];
  regionalOrders: PurchaseOrder[];
  regionalSales: SaleRecord[];
  regionalTransfers: TransferRecord[];
  isLoading: boolean;
  isError: boolean;
}

export function useRegionalDataQueries({ regionCode, siteIds, enabled = true }: UseRegionalDataQueriesProps): UseRegionalDataQueriesResult {
  const sortedSiteIds = useMemo(() => [...siteIds].sort(), [siteIds]);
  const active = enabled && sortedSiteIds.length > 0;
  const products = useQuery({
    queryKey: ['regional-products', regionCode, sortedSiteIds],
    queryFn: async () => (await productsService.getAll(undefined, 25, 0, { siteIds: sortedSiteIds }, undefined, false)).data || [],
    enabled: active, staleTime: 300_000
  });
  const employees = useQuery({
    queryKey: ['regional-employees', regionCode, sortedSiteIds],
    queryFn: () => employeesService.getAll(sortedSiteIds),
    enabled: active, staleTime: 900_000
  });
  const shifts = useQuery({
    queryKey: ['regional-shifts', regionCode, sortedSiteIds],
    queryFn: () => shiftsService.getAll(sortedSiteIds, 25),
    enabled: active, staleTime: 300_000
  });
  const orders = useQuery({
    queryKey: ['regional-orders', regionCode, sortedSiteIds],
    queryFn: async () => (await purchaseOrdersService.getAll(undefined, 25, 0, { siteIds: sortedSiteIds })).data || [],
    enabled: active, staleTime: 300_000
  });
  const sales = useQuery({
    queryKey: ['regional-sales', regionCode, sortedSiteIds],
    queryFn: async () => (await salesService.getAll(undefined, 25, 0, { siteIds: sortedSiteIds, includeItems: false })).data || [],
    enabled: active, staleTime: 300_000
  });
  const transfers = useQuery({
    queryKey: ['regional-transfers', regionCode],
    queryFn: () => transfersService.getAll(undefined, 25, regionCode),
    enabled: active, staleTime: 120_000
  });
  return {
    regionalProducts: products.data || [], regionalEmployees: employees.data || [],
    regionalShifts: shifts.data || [], regionalOrders: orders.data || [],
    regionalSales: sales.data || [], regionalTransfers: transfers.data || [],
    isLoading: [products, employees, shifts, orders, sales, transfers].some(query => query.isLoading),
    isError: [products, employees, shifts, orders, sales, transfers].some(query => query.isError)
  };
}
