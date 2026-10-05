import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { systemLogsService } from '../services/system-logs.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { formatPONumber } from '../utils/jobIdFormatter';
import type { PurchaseOrder } from '../types';

interface PurchaseOrderQueryParams {
  countryCode?: string;
  siteIds?: string[];
  status?: string;
  supplierId?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function usePurchaseOrdersQuery(params: PurchaseOrderQueryParams) {
  const { effectiveCountry, sites } = useData();
  const country = params.countryCode || effectiveCountry || 'ET';
  const siteIds = params.siteIds || (sites && sites.length > 0 ? sites.filter(s => (s.country || 'ET') === country).map(s => s.id) : undefined);
  const limit = params.limit || 20;
  const page = params.page || 1;
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ['purchase_orders', country, siteIds ? siteIds.join(',') : '', params.status, params.supplierId, params.search, params.sort, page, limit],
    queryFn: async () => {
      const filters = {
        status: params.status !== 'All' ? params.status : undefined,
        supplierId: params.supplierId !== 'All' ? params.supplierId : undefined,
        search: params.search,
        countryCode: country,
        siteIds,
        isRequest: false
      };
      return await purchaseOrdersService.getAll(undefined, limit, offset, filters);
    },
    staleTime: 30 * 1000,
  });
}

export function usePurchaseOrderMutations() {
  const queryClient = useQueryClient();
  const { user, showToast } = useStore();
  const { logSystemEvent, sites } = useData();

  const approvePOMutation = useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const approvedBy = user?.name || user?.email || 'Authorized Executive';

      const updated = await purchaseOrdersService.approve({
        poId: po.id,
        approverId: user?.id || (user as any)?.employeeId || 'USR',
        approverName: approvedBy,
        approverRole: user?.role || 'procurement_manager',
        reasonCode: 'STANDARD_REPLENISHMENT',
        notes: 'Quick list approval'
      });

      logSystemEvent('PO_APPROVED', `Approved PO ${formatPONumber(po)}`, approvedBy, 'Procurement');
      return updated;
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      showToast(`PO ${formatPONumber(po)} Approved`, 'success');
    },
    onError: (error: any) => {
      logger.error('usePurchaseOrderMutations', 'Approve failed', error);
      showToast(error.message || 'Failed to approve PO', 'error');
    }
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ordersToApprove: PurchaseOrder[]) => {
      const approvedBy = user?.name || user?.email || 'HQ Bulk Action';

      const promises = ordersToApprove.map(po =>
        purchaseOrdersService.approve({
          poId: po.id,
          approverId: user?.id || (user as any)?.employeeId || 'USR',
          approverName: approvedBy,
          approverRole: user?.role || 'procurement_manager',
          reasonCode: 'STANDARD_REPLENISHMENT',
          notes: 'HQ Bulk Action Approval'
        })
      );

      await Promise.all(promises);

      // Audit log
      try {
        await systemLogsService.create({
          action: 'PO_BULK_APPROVED',
          details: `Bulk approved ${ordersToApprove.length} purchase orders: ${ordersToApprove.map(p => formatPONumber(p)).join(', ')}`,
          user_name: approvedBy,
          module: 'Procurement'
        });
      } catch (logErr) {
        logger.warn('usePurchaseOrderMutations', 'Bulk approve audit log failed', { error: String(logErr) });
      }

      logSystemEvent('PO_BULK_APPROVED', `Bulk approved ${ordersToApprove.length} POs`, approvedBy, 'Procurement');
      return ordersToApprove.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      showToast(`Approved ${count} POs`, 'success');
    },
    onError: (error: any) => {
      logger.error('usePurchaseOrderMutations', 'Bulk approve failed', error);
      showToast(error.message || 'Bulk approve failed', 'error');
    }
  });

  const cancelPOMutation = useMutation({
    mutationFn: async ({ po, reason }: { po: PurchaseOrder; reason?: string }) => {
      const cancelledBy = user?.name || 'Manager';
      const result = await purchaseOrdersService.cancel(po.id, reason || `Cancelled by ${cancelledBy}`);

      // Write immutable audit log
      try {
        await systemLogsService.create({
          action: 'PO_CANCELLED',
          details: `PO ${formatPONumber(po)} cancelled: ${reason || 'User initiated'}`,
          user_name: cancelledBy,
          module: 'Procurement'
        });
      } catch (logErr) {
        logger.warn('usePurchaseOrderMutations', 'PO cancellation audit log failed', { error: String(logErr) });
      }

      logSystemEvent('PO_CANCELLED', `Cancelled PO ${formatPONumber(po)}`, cancelledBy, 'Procurement');
      return result;
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      showToast(`PO ${formatPONumber(po)} Cancelled`, 'success');
    },
    onError: (error: any) => {
      logger.error('usePurchaseOrderMutations', 'Failed to cancel PO', error);
      showToast(error.message || 'Failed to cancel PO', 'error');
    }
  });

  const createPOMutation = useMutation({
    mutationFn: async ({ po, items }: { po: Omit<PurchaseOrder, 'created_at' | 'updated_at'>; items: any[] }) => {
      // Zero-trust destination facility validation
      const targetSite = sites.find(s => s.id === po.siteId);
      if (targetSite && targetSite.type !== 'Warehouse' && targetSite.type !== 'Distribution Center') {
        throw new Error(`Procurement policy violation: Purchase orders can only be sent to a Warehouse or Distribution Center. Selected site "${targetSite.name}" is a ${targetSite.type}.`);
      }

      const created = await purchaseOrdersService.create(po, items);

      // Audit log
      try {
        await systemLogsService.create({
          action: 'PO_CREATED',
          details: `PO ${formatPONumber(created)} created for ${created.currency || 'ETB'} ${created.totalAmount.toLocaleString()} to ${targetSite?.name || created.siteId}`,
          user_name: user?.name || user?.email || 'User',
          module: 'Procurement'
        });
      } catch (logErr) {
        logger.warn('usePurchaseOrderMutations', 'Failed to write audit log to system_logs', { error: String(logErr) });
      }

      logSystemEvent('PO_CREATED', `Created PO ${formatPONumber(created)}`, user?.name || 'User', 'Procurement');
      return created;
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      showToast(`PO ${formatPONumber(po)} Created Successfully`, 'success');
    },
    onError: (error: any) => {
      logger.error('usePurchaseOrderMutations', 'PO creation failed', error);
      showToast(error.message || 'Failed to create PO', 'error');
    }
  });

  const updatePOMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PurchaseOrder> }) => {
      if (updates.siteId) {
        const targetSite = sites.find(s => s.id === updates.siteId);
        if (targetSite && targetSite.type !== 'Warehouse' && targetSite.type !== 'Distribution Center') {
          throw new Error(`Procurement policy violation: Purchase orders can only be sent to a Warehouse or Distribution Center. Selected site "${targetSite.name}" is a ${targetSite.type}.`);
        }
      }

      const updated = await purchaseOrdersService.update(id, updates);

      try {
        await systemLogsService.create({
          action: 'PO_UPDATED',
          details: `PO ${formatPONumber(updated)} updated`,
          user_name: user?.name || user?.email || 'User',
          module: 'Procurement'
        });
      } catch (logErr) {
        logger.warn('usePurchaseOrderMutations', 'Failed to write audit log to system_logs', { error: String(logErr) });
      }

      logSystemEvent('PO_UPDATED', `Updated PO ${formatPONumber(updated)}`, user?.name || 'User', 'Procurement');
      return updated;
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      showToast(`PO ${formatPONumber(po)} Updated Successfully`, 'success');
    },
    onError: (error: any) => {
      logger.error('usePurchaseOrderMutations', 'PO update failed', error);
      showToast(error.message || 'Failed to update PO', 'error');
    }
  });

  return {
    approvePOMutation,
    bulkApproveMutation,
    cancelPOMutation,
    createPOMutation,
    updatePOMutation
  };
}
