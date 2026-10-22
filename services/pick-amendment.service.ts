import { WMSJob } from '../types';
import { wmsJobsService } from './wms-jobs.service';
import { inventoryRequestsService } from './inventory-requests.service';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const PICK_AMEND_REASON_CODES = [
    { code: 'DAMAGED_IN_BIN', label: 'Damaged / Spoiled in Picking Bin' },
    { code: 'BIN_SHORTAGE', label: 'Physical Shortage in Bin (Stock Missing)' },
    { code: 'WRONG_SKU_SCANNED', label: 'Wrong SKU / Barcode Mismatch' },
    { code: 'CUSTOMER_CANCELLATION', label: 'Customer / Order Item Reduction' },
    { code: 'QUALITY_REJECT', label: 'Substandard / Expired Item Discarded' },
    { code: 'OTHER', label: 'Other Operational Discrepancy' },
] as const;

export type PickAmendReasonCode = typeof PICK_AMEND_REASON_CODES[number]['code'];

export interface PickAmendLineInput {
    index: number;
    sku: string;
    name: string;
    productId?: string;
    originalPicked: number;
    amendedPicked: number;
}

export interface PickAmendParams {
    job: WMSJob;
    lines: PickAmendLineInput[];
    reasonCode: PickAmendReasonCode;
    reasonNotes: string;
    currentUser: {
        id: string;
        name: string;
        role: string;
    };
    gpsLocation?: string;
    linkedPackJob?: WMSJob;
}

export interface PickAmendResult {
    success: boolean;
    jobId: string;
    amendedLinesCount: number;
    inventoryRequestsSubmitted: number;
    packJobUpdated: boolean;
    auditLogId?: string;
}

const AUTHORIZED_SUPERVISORY_ROLES = [
    'super_admin',
    'admin',
    'CEO',
    'regional_operations_manager',
    'head_of_operations',
    'warehouse_manager',
    'store_manager',
    'inventory_manager',
    'logistics_manager',
    'assistant_manager',
    'shift_lead',
    'store_supervisor',
    'dispatch_manager',
    'head_of_merchandising',
    'head_of_supply_chain',
];

export const pickAmendmentService = {
    /**
     * Executes a Zero-Trust supervisory pick amendment.
     * Enforces:
     *   1. Supervisor / Manager authentication and role verification (Rule 18)
     *   2. Mandatory structured reason code + explanatory note (Rule 18)
     *   3. Audit trail with managerId, role, GPS, and timestamp logged to system_logs (Rule 5)
     *   4. Stock reversal / adjustment request filed to inventory_requests for HQ sign-off (Rule 1)
     *   5. Linked PACK job expectedQty preservation (evidence of shortage cannot be erased)
     */
    async executeAmendment(params: PickAmendParams): Promise<PickAmendResult> {
        const {
            job,
            lines,
            reasonCode,
            reasonNotes,
            currentUser,
            gpsLocation = 'GPS: Unavailable',
            linkedPackJob
        } = params;

        // 1. Zero-Trust Role & Permission Enforcement
        const userRole = (currentUser?.role || '').trim().toLowerCase();
        const isAuthorized = AUTHORIZED_SUPERVISORY_ROLES.some(r => r.toLowerCase() === userRole);
        if (!isAuthorized) {
            throw new Error('Zero-Trust Security Violation: Only verified supervisors or managers can amend pick quantities.');
        }

        // 2. Reason code and notes validation
        if (!reasonCode) {
            throw new Error('Zero-Trust Validation Violation: A structured reason code is required for pick amendments.');
        }
        if (!reasonNotes || reasonNotes.trim().length < 4) {
            throw new Error('Zero-Trust Validation Violation: An explanatory note (min 4 characters) is required for supervisory overrides.');
        }

        const timestamp = new Date().toISOString();
        const changedLines = lines.filter(l => l.amendedPicked !== l.originalPicked);
        if (changedLines.length === 0) {
            return {
                success: true,
                jobId: job.id,
                amendedLinesCount: 0,
                inventoryRequestsSubmitted: 0,
                packJobUpdated: false,
            };
        }

        const changesSummary = changedLines.map(
            l => `${l.sku} (${l.name}): ${l.originalPicked} -> ${l.amendedPicked}`
        );

        // 3. Update Line Items on Pick Job
        const existingLineItems = (job.lineItems as any[]) || [];
        const updatedPickLineItems = existingLineItems.map((item: any, idx: number) => {
            const matchedLine = lines.find(l => l.index === idx || l.sku === item.sku);
            if (!matchedLine) return item;

            const isChanged = matchedLine.amendedPicked !== matchedLine.originalPicked;
            return {
                ...item,
                pickedQty: matchedLine.amendedPicked,
                amended: isChanged ? true : (item.amended || false),
                amendedFrom: isChanged ? matchedLine.originalPicked : (item.amendedFrom ?? undefined),
                amendedBy: isChanged ? currentUser.name : item.amendedBy,
                amendedAt: isChanged ? timestamp : item.amendedAt,
                amendReasonCode: isChanged ? reasonCode : item.amendReasonCode,
            };
        });

        // 4. Construct Tamper-Evident Audit Stamp
        const auditNote = `[PICK AMENDED by ${currentUser.name} (${currentUser.role}, ID: ${currentUser.id}) at ${new Date().toLocaleString()} via ${gpsLocation}] Code: ${reasonCode} | Reason: ${reasonNotes.trim()} | Changes: ${changesSummary.join('; ')}`;
        const updatedPickNotes = job.notes ? `${job.notes}\n${auditNote}` : auditNote;

        await wmsJobsService.update(job.id, {
            lineItems: updatedPickLineItems,
            notes: updatedPickNotes,
            hasAmendment: true,
        } as any);

        // 5. Submit Inventory Adjustment Requests to Central HQ for Stock Alignment (Rule 1 & Rule 3)
        let inventoryRequestsCount = 0;
        const jobSiteId = job.siteId || (job as any).site_id;
        const jobCountry = job.countryCode || (job as any).country_code || 'ET';

        for (const line of changedLines) {
            const delta = line.amendedPicked - line.originalPicked;
            if (delta !== 0) {
                // If picker picked FEWER units than previously deducted from stock, units return to shelf (IN)
                // If picker picked MORE units than previously deducted, additional units leave stock (OUT)
                const adjustmentType: 'IN' | 'OUT' = delta < 0 ? 'IN' : 'OUT';
                const adjustmentQty = Math.abs(delta);

                try {
                    await inventoryRequestsService.create({
                        productId: line.productId || (job.lineItems as any[])?.[line.index]?.productId || '',
                        productName: line.name,
                        productSku: line.sku,
                        siteId: jobSiteId,
                        countryCode: jobCountry,
                        changeType: 'stock_adjustment',
                        requestedBy: currentUser.name,
                        requestedAt: timestamp,
                        status: 'pending',
                        adjustmentType,
                        adjustmentQty,
                        adjustmentReason: `[Pick Amendment #${job.jobNumber || job.id}] Code: ${reasonCode} | Notes: ${reasonNotes} (Supervisor: ${currentUser.name}, ID: ${currentUser.id})`,
                    });
                    inventoryRequestsCount++;
                } catch (invErr) {
                    logger.error('pickAmendmentService', `Failed to create inventory request for ${line.sku}:`, invErr);
                }
            }
        }

        // 6. Update Linked PACK Job (Preserve original expectedQty & record discrepancy)
        let packJobUpdated = false;
        if (linkedPackJob) {
            const packLineItems = (linkedPackJob.lineItems as any[]) || [];
            let hasPackShortage = false;

            const updatedPackLineItems = packLineItems.map((packItem: any) => {
                const matchedLine = lines.find(l => l.sku === packItem.sku || l.index === packItem.sourceItemIndex);
                if (!matchedLine) return packItem;

                const originalExpected = packItem.originalExpectedQty ?? packItem.expectedQty;
                const newPicked = matchedLine.amendedPicked;
                const isShortage = newPicked < originalExpected;
                if (isShortage) hasPackShortage = true;

                return {
                    ...packItem,
                    expectedQty: originalExpected, // PRESERVED: Never silently erase original demand!
                    originalExpectedQty: originalExpected,
                    pickedQty: newPicked,
                    shortageQty: Math.max(0, originalExpected - newPicked),
                    hasDiscrepancy: isShortage,
                    amended: true,
                    amendedBy: currentUser.name,
                    amendedAt: timestamp,
                    amendReasonCode: reasonCode,
                };
            });

            const packAuditNote = `[LINKED PACK UPDATED from Pick #${job.jobNumber || job.id} by ${currentUser.name} (${currentUser.role}) at ${new Date().toLocaleString()} via ${gpsLocation}] Reason: ${reasonCode} - ${reasonNotes}`;
            const updatedPackNotes = linkedPackJob.notes ? `${linkedPackJob.notes}\n${packAuditNote}` : packAuditNote;

            await wmsJobsService.update(linkedPackJob.id, {
                lineItems: updatedPackLineItems,
                notes: updatedPackNotes,
                hasDiscrepancy: hasPackShortage || linkedPackJob.hasDiscrepancy || false,
                discrepancyDetails: hasPackShortage
                    ? `Short-pick amended by ${currentUser.name}: ${changesSummary.join(', ')}`
                    : linkedPackJob.discrepancyDetails,
            } as any);
            packJobUpdated = true;
        }

        // 7. Log Tamper-Proof Audit Event to system_logs (Rule 5 & Rule 18)
        let auditLogId: string | undefined;
        try {
            const logEntry = await systemLogsService.create({
                user_name: currentUser.name,
                action: 'PICK_AMENDMENT_SUPERVISORY_OVERRIDE',
                module: 'Fulfillment',
                details: JSON.stringify({
                    managerId: currentUser.id,
                    managerName: currentUser.name,
                    managerRole: currentUser.role,
                    jobId: job.id,
                    jobNumber: job.jobNumber,
                    siteId: jobSiteId,
                    countryCode: jobCountry,
                    reasonCode,
                    reasonNotes,
                    gpsLocation,
                    timestamp,
                    lineChanges: changesSummary,
                    inventoryRequestsCreated: inventoryRequestsCount,
                    packJobUpdated,
                }),
            });
            auditLogId = logEntry?.id;
        } catch (logErr) {
            logger.error('pickAmendmentService', 'Failed to log pick amendment event to system_logs:', logErr);
        }

        return {
            success: true,
            jobId: job.id,
            amendedLinesCount: changedLines.length,
            inventoryRequestsSubmitted: inventoryRequestsCount,
            packJobUpdated,
            auditLogId,
        };
    },
};
