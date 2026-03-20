/**
 * Supabase API Service Layer - Barrel Re-exports
 * Individual services are in their own files for maintainability.
 */

// Core Services
export { sitesService } from './sites.service';
export { warehouseZonesService } from './zones.service';
export { systemConfigService } from './config.service';

// Entity Services
export { productsService } from './products.service';
export { customersService } from './customers.service';
export { employeesService } from './employees.service';
export { suppliersService } from './suppliers.service';

// Transaction Services
export { purchaseOrdersService } from './purchase-orders.service';
export { salesService } from './sales.service';

// Warehouse Services
export { stockMovementsService } from './stock-movements.service';
export { wmsJobsService, generateReadableJobNumber, generateTransferId } from './wms-jobs.service';
export { transfersService } from './transfers.service';

// Operations Services
export { expensesService } from './expenses.service';
export { systemLogsService } from './system-logs.service';
export { jobAssignmentsService } from './job-assignments.service';

// Gamification
export { workerPointsService, pointsTransactionsService, storePointsService } from './gamification.service';

// Approval & Audit
export { inventoryRequestsService } from './inventory-requests.service';
export { barcodeApprovalsService } from './barcode-approvals.service';

// CEO Tools
export { brainstormService } from './brainstorm.service';
export type { BrainstormNodeDB } from './brainstorm.service';

// Discrepancy
export { discrepancyService } from './discrepancy.service';

// HR
export { tasksService } from './tasks.service';
export { schedulesService } from './schedules.service';
