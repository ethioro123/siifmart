import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { employeesService } from '../services/employees.service';
import { shiftsService } from '../services/shifts.service';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { salesService } from '../services/sales.service';
import { transfersService } from '../services/transfers.service';
import type { Product, Employee, ShiftRecord, PurchaseOrder, SaleRecord, TransferRecord } from '../types';
import { logger } from '../utils/logger';

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
}

export function useRegionalDataQueries({
  regionCode,
  siteIds,
  enabled = true
}: UseRegionalDataQueriesProps): UseRegionalDataQueriesResult {
  const sortedSiteIds = useMemo(() => [...siteIds].sort(), [siteIds]);
  const hasSites = sortedSiteIds.length > 0;
  const isQueryEnabled = enabled && hasSites;

  // 1. Regional Products across all facilities in region
  const { data: regionalProducts = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['regional-products', regionCode, sortedSiteIds],
    queryFn: async () => {
      try {
        const res = await productsService.getAll(undefined, 1000, 0, { siteIds: sortedSiteIds }, undefined, false);
        return res.data || [];
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional products', err);
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Regional Employees across all facilities in region
  const { data: regionalEmployees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['regional-employees', regionCode, sortedSiteIds],
    queryFn: async () => {
      try {
        return await employeesService.getAll(sortedSiteIds);
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional employees', err);
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 15,
  });

  // 3. Regional Shifts across all facilities in region
  const { data: regionalShifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['regional-shifts', regionCode, sortedSiteIds],
    queryFn: async () => {
      try {
        return await shiftsService.getAll(sortedSiteIds, 100);
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional shifts', err);
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 4. Regional Purchase Orders across all facilities in region
  const { data: regionalOrders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['regional-orders', regionCode, sortedSiteIds],
    queryFn: async () => {
      try {
        const res = await purchaseOrdersService.getAll(undefined, 100, 0, { siteIds: sortedSiteIds });
        return res.data || [];
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional orders', err);
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 5. Regional Sales across all facilities in region
  const { data: regionalSales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['regional-sales', regionCode, sortedSiteIds],
    queryFn: async () => {
      try {
        const res = await salesService.getAll(undefined, 100, 0, { siteIds: sortedSiteIds, includeItems: true });
        return res.data || [];
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional sales', err);
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 6. Regional Transfers across all facilities in region
  const { data: regionalTransfers = [], isLoading: isTransfersLoading } = useQuery({
    queryKey: ['regional-transfers', regionCode],
    queryFn: async () => {
      try {
        return await transfersService.getAll(undefined, 50, regionCode);
      } catch (err) {
        logger.error('useRegionalDataQueries', 'Failed to fetch regional transfers', err);
        return [];
      }
    },
    enabled: Boolean(enabled && regionCode),
    staleTime: 1000 * 60 * 2,
  });

  return {
    regionalProducts,
    regionalEmployees,
    regionalShifts,
    regionalOrders,
    regionalSales,
    regionalTransfers,
    isLoading: isProductsLoading || isEmployeesLoading || isShiftsLoading || isOrdersLoading || isSalesLoading || isTransfersLoading
  };
}
