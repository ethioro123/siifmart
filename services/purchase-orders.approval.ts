import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { systemLogsService } from './system-logs.service';
import type { POApprovalPayload, PORejectionPayload } from '../types/procurement-zero-trust';
import { getById } from './purchase-orders.read';
import { wmsJobsService } from './wms-jobs.service';
import { regionsService } from './regions.service';

export interface POApprovalExtendedPayload extends POApprovalPayload {
  approverCountry?: string;
}

export const purchaseOrdersApprovalService = {
  async clearFinance(poId: string, reason: string) {
    if (!reason.trim()) throw new Error('A finance clearance reason is required.');
    const { error } = await supabase.rpc('clear_purchase_order_finance', {
      p_po_id: poId,
      p_reason: reason.trim()
    });
    if (error) throw new Error(error.message || 'Finance clearance was rejected.');
    return getById(poId);
  },

  async recommendCountryMd(poId: string, notes: string) {
    if (!notes.trim()) throw new Error('A recommendation note is required.');
    const { error } = await supabase.rpc('recommend_purchase_order_country_md', {
      p_po_id: poId,
      p_notes: notes.trim()
    });
    if (error) throw new Error(error.message || 'Country MD recommendation was rejected.');
    return getById(poId);
  },

  /**
   * Approves a Purchase Order using Zero-Trust Delegated Governance (10M / 100M Limits).
   * Calls the PostgreSQL RPC `approve_purchase_order` (SECURITY DEFINER).
   * Enforces self-approval block, country isolation, mandatory reason code, and monetary limits.
   */
  async approve(payload: POApprovalExtendedPayload) {
    const { poId, approverId, approverName, approverRole, reasonCode, notes = '', gpsCoords, approverCountry } = payload;

    // 1. Client-Side Pre-Validation Guard (Instant UI Feedback)
    const currentPO = await getById(poId);
    if (!currentPO) throw new Error('Purchase order not found');

    if (currentPO.status !== 'Draft' && currentPO.status !== 'Pending') {
      throw new Error(`Cannot approve PO with status "${currentPO.status}". Must be Draft or Pending.`);
    }

    const authorizedRoles = [
      'group_ceo', 'group_cfo', 'country_commercial_director', 'country_managing_director',
      'country_operations_director', 'regional_procurement_manager', 'regional_operations_manager',
      'head_of_procurement', 'super_admin'
    ];
    if (!authorizedRoles.includes(approverRole)) {
      throw new Error('Final purchase order approval requires an authorized procurement lead or executive.');
    }

    // Zero-Self-Approval: Creator or requester cannot approve their own PO
    const creatorName = currentPO.createdBy?.toLowerCase().trim();
    const requesterName = currentPO.requestedBy?.toLowerCase().trim();
    const approverLower = approverName.toLowerCase().trim();
    if ((creatorName && creatorName === approverLower) || (requesterName && requesterName === approverLower)) {
      throw new Error('The creator or requester cannot approve their own purchase order.');
    }

    // Country Isolation Guard
    const poCountry = (currentPO.country_code || (currentPO as any).countryCode || '').toUpperCase();
    if (approverCountry && !['group_ceo', 'group_cfo', 'super_admin'].includes(approverRole)) {
      if (poCountry && approverCountry.toUpperCase() !== poCountry) {
        throw new Error('Approver is outside the purchase order country.');
      }
    }

    // Mandatory structured reason code
    if (!reasonCode || !reasonCode.trim()) {
      throw new Error('Managerial Accountability Violation: Structured reason code is mandatory for PO approval.');
    }

    // Thresholds: 10M Regional Autonomous Limit / 100M Country Limit
    const poRegionCode = currentPO.regionCode || (currentPO as any).region_code;
    let autonomousLimit = 10_000_000;
    if (poRegionCode) {
      const region = await regionsService.getRegionByCode(poRegionCode);
      if (region && region.status === 'active' && region.autonomous_po_limit != null) {
        autonomousLimit = Number(region.autonomous_po_limit);
      }
    }
    const countryLimit = 100_000_000;

    const isFinanceCleared = Boolean(currentPO.finance_cleared_at || currentPO.financeClearedAt);
    const isCountryMdRecommended = Boolean(
      (currentPO as any).country_md_recommended_at || (currentPO as any).countryMdRecommendedAt
    );

    // Tier 1: PO <= 10M (Regional Autonomous Limit)
    if (currentPO.totalAmount <= autonomousLimit) {
      // Regional Procurement Manager can approve within assigned region; higher executives can also approve
    }
    // Tier 2: 10M < PO <= 100M (Country Autonomous Limit)
    else if (currentPO.totalAmount <= countryLimit) {
      if (approverRole === 'regional_procurement_manager') {
        throw new Error('This order exceeds the configured regional PO limit and requires country leadership approval.');
      }
      if (!isFinanceCleared) {
        throw new Error('Country finance clearance is required before approving this order.');
      }
      if (!['country_commercial_director', 'country_managing_director', 'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin'].includes(approverRole)) {
        throw new Error('Order between 10M and 100M requires Country Commercial Director or Country MD approval.');
      }
    }
    // Tier 3: PO > 100M (Above Country Autonomous Limit)
    else {
      if (!['group_cfo', 'group_ceo', 'super_admin'].includes(approverRole)) {
        throw new Error('Orders above the 100M country limit require Group Executive (CFO/CEO) sign-off.');
      }
      if (!isCountryMdRecommended && approverRole !== 'super_admin') {
        throw new Error('Orders above the 100M country limit require Country Managing Director recommendation.');
      }
      if (!isFinanceCleared) {
        throw new Error('Group finance clearance is required before approving orders exceeding 100M.');
      }
    }

    // 2. Execute via Server-Side RPC
    const { error: rpcError } = await supabase.rpc('approve_purchase_order', {
      p_po_id: poId,
      p_approver_id: approverId,
      p_approver_name: approverName,
      p_approver_role: approverRole,
      p_reason_code: reasonCode,
      p_notes: notes,
      p_gps_coords: gpsCoords || null
    });

    if (rpcError) throw new Error(rpcError.message || 'Server rejected PO approval');

    // 3. Auto-Trigger WMS Inbound Receiving Job for the approved PO (Atomic Handshake)
    let jobCreationError: Error | null = null;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { count } = await supabase
          .from('wms_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('order_ref', poId)
          .eq('type', 'RECEIVE');

        if (!count || count === 0) {
          const jobItems = (currentPO.lineItems || []).map((item: any) => ({
            productId: item.productId || 'UNKNOWN',
            name: item.productName || 'Unknown Item',
            sku: item.sku || '',
            image: item.image || '',
            brand: item.brand || '',
            size: item.size || '',
            unit: item.unit || '',
            category: item.category || '',
            expectedQty: item.quantity || 0,
            pickedQty: 0,
            receivedQty: 0,
            status: 'Pending'
          }));

          let priority: any = currentPO.priority || 'Normal';
          if (priority === 'Urgent') priority = 'Critical';
          if (priority === 'Low') priority = 'Normal';

          await wmsJobsService.create({
            siteId: currentPO.siteId,
            countryCode: (currentPO as any).country_code || (currentPO as any).countryCode || 'ET',
            type: 'RECEIVE',
            priority,
            status: 'Pending',
            items: jobItems.length,
            lineItems: jobItems,
            orderRef: poId,
            jobNumber: currentPO.po_number || currentPO.id,
            location: 'INBOUND_DOCK',
            sourceSiteId: undefined
          });
        }
        jobCreationError = null;
        break;
      } catch (jobErr) {
        jobCreationError = jobErr as Error;
        logger.warn('PurchaseOrdersApproval', `Attempt ${attempt}/${maxAttempts} to initialize inbound receiving task failed`, {
          error: jobErr instanceof Error ? jobErr.message : String(jobErr)
        });
        if (attempt < maxAttempts) {
          await new Promise(res => setTimeout(res, 250));
        }
      }
    }

    if (jobCreationError) {
      logger.error('PurchaseOrdersApproval', 'Failed to auto-create WMS receiving job after retries', jobCreationError);
      try {
        await systemLogsService.create({
          action: 'WMS_RECEIVING_JOB_INIT_FAILED',
          module: 'Procurement',
          user_name: approverName,
          site_id: currentPO.siteId,
          country_code: (currentPO as any).country_code || (currentPO as any).countryCode || 'ET',
          entity_type: 'purchase_order',
          entity_id: poId,
          details: {
            poNumber: currentPO.po_number || poId,
            error: jobCreationError.message
          }
        });
      } catch { }

      throw new Error(`PO ${currentPO.po_number || poId} was approved, but the inbound warehouse receiving task failed to initialize: ${jobCreationError.message}. Please run Job Maintenance to generate the receiving job.`);
    }

    return await getById(poId);
  },

  /**
   * Rejects a Purchase Order with mandatory structured reason code.
   * Calls the PostgreSQL RPC `reject_purchase_order`.
   */
  async reject(payload: PORejectionPayload) {
    const { poId, rejectorId, rejectorName, rejectorRole, reasonCode, notes = '', gpsCoords } = payload;

    const currentPO = await getById(poId);
    if (!currentPO) throw new Error('Purchase order not found');

    if (currentPO.status === 'Received' || currentPO.status === 'Partially Received') {
      throw new Error('Cannot reject a purchase order that has already been received.');
    }

    if (!reasonCode || !reasonCode.trim()) {
      throw new Error('Managerial Accountability Violation: Structured reason code is mandatory for PO rejection.');
    }

    const { error: rpcError } = await supabase.rpc('reject_purchase_order', {
      p_po_id: poId,
      p_rejector_id: rejectorId,
      p_rejector_name: rejectorName,
      p_rejector_role: rejectorRole,
      p_reason_code: reasonCode,
      p_notes: notes,
      p_gps_coords: gpsCoords || null
    });

    if (rpcError) {
      if (rpcError.code === '42883' || rpcError.message?.includes('function public.reject_purchase_order') || rpcError.message?.includes('does not exist')) {
        logger.warn('PurchaseOrdersApproval', 'reject_purchase_order RPC not found, falling back to direct update', { error: String(rpcError.message) });

        const rejectionTag = `\n[REJECTED_BY:${rejectorName} (${rejectorRole}):${new Date().toISOString()} REASON:${reasonCode}]`;
        const updatedNotes = (currentPO.notes || '') + rejectionTag + (notes ? `\n[REJECTION_NOTE: ${notes}]` : '');

        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            status: 'Rejected',
            rejected_by: rejectorName,
            rejected_at: new Date().toISOString(),
            rejection_reason_code: reasonCode,
            rejection_notes: notes,
            notes: updatedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', poId);

        if (updateError) throw updateError;

        await systemLogsService.create({
          user_name: rejectorName,
          action: 'PURCHASE_ORDER_REJECTED',
          module: 'Procurement',
          details: JSON.stringify({
            po_id: poId,
            po_number: currentPO.poNumber || currentPO.id,
            rejector_role: rejectorRole,
            reason_code: reasonCode,
            notes,
            gps: gpsCoords
          })
        });
      } else {
        throw new Error(rpcError.message || 'Server rejected PO rejection request');
      }
    }

    return await getById(poId);
  }
};
