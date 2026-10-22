import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { systemLogsService } from './system-logs.service';
import type { POApprovalPayload, PORejectionPayload } from '../types/procurement-zero-trust';
import { getById } from './purchase-orders.read';
import { wmsJobsService } from './wms-jobs.service';
import { regionsService } from './regions.service';

export const purchaseOrdersApprovalService = {
  /**
   * Approves a Purchase Order using Zero-Trust 4-Eyes Governance.
   * Calls the PostgreSQL RPC `approve_purchase_order` (SECURITY DEFINER).
   * Enforces self-approval block, mandatory reason code, role authorization, and monetary limits.
   */
  async approve(payload: POApprovalPayload) {
    const { poId, approverId, approverName, approverRole, reasonCode, notes = '', gpsCoords } = payload;

    // 1. Client-Side Pre-Validation Guard (Instant UI Feedback)
    const currentPO = await getById(poId);
    if (!currentPO) throw new Error('Purchase order not found');

    if (currentPO.status !== 'Draft' && currentPO.status !== 'Pending') {
      throw new Error(`Cannot approve PO with status "${currentPO.status}". Must be Draft or Pending.`);
    }

    if (![
      'super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin',
      'head_of_procurement',
      'head_of_finance',
      'head_of_operations',
      'regional_operations_manager',
      'regional_procurement_manager',
      'regional_finance_manager',
    ].includes(approverRole)) {
      throw new Error('Purchase order approval requires a procurement lead or authorized executive management role.');
    }

    // 4-Eyes rule: Creator cannot approve their own PO
    if (!['super_admin', 'CEO', 'ceo'].includes(approverRole)) {
      const creatorName = currentPO.createdBy?.toLowerCase().trim();
      const requesterName = currentPO.requestedBy?.toLowerCase().trim();
      const approverLower = approverName.toLowerCase().trim();

      if ((creatorName && creatorName === approverLower) || (requesterName && requesterName === approverLower)) {
        throw new Error('Zero-Trust 4-Eyes Violation: Self-approval is strictly prohibited. The creator of a purchase order cannot approve it.');
      }
    }

    // Mandatory structured reason code
    if (!reasonCode || !reasonCode.trim()) {
      throw new Error('Managerial Accountability Violation: Structured reason code is mandatory for PO approval.');
    }

    // Dynamic Regional Autonomous PO Limit Check
    const poRegionCode = currentPO.regionCode || (currentPO as any).region_code;
    let isEscalatedToHq = Boolean(currentPO.requiresHqApproval || (currentPO as any).requires_hq_approval);

    if (poRegionCode) {
      const region = await regionsService.getRegionByCode(poRegionCode);
      const autonomousLimit = region?.autonomous_po_limit ?? 150000;
      if (currentPO.totalAmount > autonomousLimit) {
        isEscalatedToHq = true;
        const isRegionalRole = [
          'regional_operations_manager',
          'regional_procurement_manager',
          'regional_finance_manager',
        ].includes(approverRole);
        const isHqRole = [
          'super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin',
          'head_of_procurement',
          'head_of_finance',
          'head_of_operations',
        ].includes(approverRole);

        if (isRegionalRole && !isHqRole) {
          throw new Error(
            `Autonomous Cap Exceeded: Order total (${currentPO.totalAmount.toLocaleString()} ${currentPO.currency || ''}) exceeds your region's autonomous limit of ${autonomousLimit.toLocaleString()} ${currentPO.currency || ''}. This order requires National HQ sign-off.`
          );
        }
      }
    }

    // 2. Execute via Server-Side RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('approve_purchase_order', {
      p_po_id: poId,
      p_approver_id: approverId,
      p_approver_name: approverName,
      p_approver_role: approverRole,
      p_reason_code: reasonCode,
      p_notes: notes,
      p_gps_coords: gpsCoords || null
    });

    if (rpcError) {
      // If RPC is missing on DB, fall back to atomic direct update + tamper-proof system_logs
      if (rpcError.code === '42883' || rpcError.message?.includes('function public.approve_purchase_order') || rpcError.message?.includes('does not exist')) {
        logger.warn('PurchaseOrdersApproval', 'approve_purchase_order RPC not found, falling back to direct update', { error: String(rpcError.message) });
        
        const approvalTag = isEscalatedToHq
          ? `\n[APPROVED_BY:${approverName} (${approverRole}):${new Date().toISOString()} REASON:${reasonCode} (NATIONAL_HQ_ESCALATION)]`
          : `\n[APPROVED_BY:${approverName} (${approverRole}):${new Date().toISOString()} REASON:${reasonCode}]`;
        const updatedNotes = (currentPO.notes || '') + approvalTag + (notes ? `\n[APPROVAL_NOTE: ${notes}]` : '');

        const updatePayload: any = {
            status: 'Approved',
            approved_by: approverName,
            approved_at: new Date().toISOString(),
            approver_role: approverRole,
            approver_employee_id: approverId,
            approver_gps: gpsCoords || null,
            approval_reason_code: reasonCode,
            approval_notes: notes,
            notes: updatedNotes,
            updated_at: new Date().toISOString(),
            requires_hq_approval: false
        };

        if (isEscalatedToHq) {
            updatePayload.hq_approved_by = approverName;
            updatePayload.hq_approved_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update(updatePayload)
          .eq('id', poId);

        if (updateError) throw updateError;

        await systemLogsService.create({
          user_name: approverName,
          action: 'PURCHASE_ORDER_APPROVED',
          module: 'Procurement',
          details: JSON.stringify({
            po_id: poId,
            po_number: currentPO.poNumber || currentPO.id,
            total_amount: currentPO.totalAmount,
            currency: currentPO.currency,
            approver_role: approverRole,
            reason_code: reasonCode,
            notes,
            gps: gpsCoords
          })
        });
      } else {
        throw new Error(rpcError.message || 'Server rejected PO approval');
      }
    }

    // 3. Auto-Trigger WMS Inbound Receiving Job for the approved PO
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
